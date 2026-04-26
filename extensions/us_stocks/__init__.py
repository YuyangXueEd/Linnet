"""US stocks extension — pre-market signal radar for AI infrastructure names."""

from typing import Any

from extensions.base import BaseExtension, FeedSection
from extensions.us_stocks.collector import fetch_us_stock_inputs
from extensions.us_stocks.scorer import build_sector_overview, score_all_stocks
from extensions.us_stocks.summarizer import synthesize_us_stock_signals


class USStocksExtension(BaseExtension):
    key = "us_stocks"
    title = "US Stocks"
    icon = "📈"

    def __init__(self, config: dict, llm_client: Any = None) -> None:
        super().__init__(config, llm_client)
        self._raw_payload: dict[str, Any] = {}
        self._llm_synthesis_used = False
        self._sector_overview: list[dict[str, Any]] = []

    def fetch(self) -> list[dict]:
        print("Fetching US stock signal inputs...")
        self._raw_payload = fetch_us_stock_inputs(self.config)
        if self._raw_payload.get("market_status") == "closed":
            print(f"  US stocks skipped: {self._raw_payload.get('skip_reason')}")
            return []
        stocks = self._raw_payload.get("stocks", [])
        print(f"  US stock targets: {len(stocks)}")
        return stocks

    def process(self, items: list[dict]) -> list[dict]:
        self._llm_synthesis_used = False
        if self._raw_payload.get("market_status") == "closed":
            self._sector_overview = []
            return []
        scored_all = score_all_stocks(self._raw_payload, self.config)
        self._sector_overview = build_sector_overview(scored_all, self.config)
        max_items = int(self.config.get("max_items", 12))
        scored = scored_all[:max_items]
        if self.config.get("dry_run") or self.config.get("skip_llm", True):
            print(f"  Deterministic US stock scoring for {len(items)} symbols")
            return scored

        if not scored or self.llm is None:
            return scored

        print(f"  LLM synthesis for top US stock signals: {len(scored)} candidates")
        prompts = self.config.get("prompts", {})
        try:
            enriched = synthesize_us_stock_signals(
                scored,
                self.llm,
                self.config["llm_summarization_model"],
                self.config.get("language", "en"),
                prompt_template=prompts.get("us_stocks_signal_synthesis"),
                max_items=int(self.config.get("max_llm_items", 8)),
            )
            self._llm_synthesis_used = any(item.get("llm_synthesized") for item in enriched)
            return enriched
        except Exception as exc:
            print(f"  US stocks LLM synthesis failed; using deterministic text — {exc}")
            return scored

    def render(self, items: list[dict]) -> FeedSection:
        meta = {
            "count": len(items),
            "market_date": self._raw_payload.get("market_date", ""),
            "market_status": self._raw_payload.get("market_status", "unknown"),
            "skip_reason": self._raw_payload.get("skip_reason", ""),
            "provider_coverage": self._raw_payload.get("provider_coverage", {}),
            "invalid_symbols": self._raw_payload.get("invalid_symbols", []),
            "sector_overview": self._sector_overview,
            "mode": self.config.get("mode", "premarket"),
            "language": self.config.get("language", "en"),
            "llm_synthesis_used": self._llm_synthesis_used,
            "llm_synthesis_model": self.config.get("llm_summarization_model", ""),
            "disclaimer": (
                "Generated from public market data and news for research and education. "
                "Not financial advice; data may be delayed, incomplete, or wrong."
            ),
        }
        return self.build_section(items=items, meta=meta)

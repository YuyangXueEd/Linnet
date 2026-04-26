# US Stocks Extension

Pre-market signal radar for a configurable AI infrastructure stock universe.

The MVP uses public quote/history data, broad news search, sector proxies, optional SEC filing metadata, no-key fallback retrievers, and an optional LLM synthesis pass to rank stocks before the US market opens. It does not make buy/sell recommendations and does not require paid market-data keys.

## Pipeline

```
fetch → process → render
```

- `fetch()` gathers quote/history data, GDELT news, benchmark ETF data, and optional SEC filing metadata.
- `process()` computes deterministic scores and maps them to `bullish`, `neutral`, or `bearish` signal labels. When `skip_llm` is false, the configured LLM refines the top candidates' summaries, drivers, invalidation points, and risk flags.
- `render()` returns a `FeedSection` with market status, provider coverage, data-quality notes, and a disclaimer.

## Configuration

Enable the extension in `config/sources.yaml`:

```yaml
display_order:
  - weather
  - us_stocks
  - arxiv
  - hacker_news
  - github_trending

us_stocks:
  enabled: true
  mode: premarket
  max_items: 12
  max_symbols: 24
  max_sector_overview: 8
  max_llm_items: 8
  include_neutral: true
  skip_llm: false
  request_timeout: 20.0
```

Customize the stock universe and scoring in `config/extensions/us_stocks.yaml`.

| Key | Default | Notes |
| --- | --- | --- |
| `news_window_hours` | `18` | Lookback window for recent news. |
| `max_news_per_symbol` | `3` | GDELT articles per ticker. |
| `history_days` | `90` | OHLCV lookback for trend and volume features. |
| `max_symbols` | `24` | Limits live fetch breadth before ranking. Set `0` or omit to use the full configured universe. |
| `max_sector_overview` | `8` | Number of sector tape rows shown above the stock table. |
| `max_llm_items` | `8` | Limits how many ranked candidates receive LLM synthesis. |
| `include_neutral` | `true` | Keep neutral but newsworthy/watchlist items. |
| `skip_llm` | `false` | Set `true` to keep deterministic summaries only. |
| `data_providers` | see YAML | Provider order for quotes, news, and filings. Keep a no-key fallback at the end of each list. |
| `signal_thresholds` | see YAML | Score cutoffs for bullish/bearish/high confidence. |
| `scoring_weights` | see YAML | Weights for move, news, filings, technicals, sector, and risks. |
| `sectors` | AI infrastructure preset | User-owned taxonomy and ticker list. |

Default provider order:

```yaml
data_providers:
  quotes:
    order: [yahoo, nasdaq]
  news:
    order: [gdelt, google_news_rss]
  filings:
    order: [sec, sec_company_page]

api_key_env:
  finnhub: FINNHUB_API_KEY
```

Finnhub is already supported as an optional keyed provider for quotes/OHLCV and company news. To enable it, keep the no-key fallbacks at the end:

```yaml
data_providers:
  quotes:
    order: [finnhub, yahoo, nasdaq]
  news:
    order: [finnhub, gdelt, google_news_rss]
```

If you later add providers such as Polygon, Financial Modeling Prep, or Alpha Vantage, use the same pattern: keyed provider first, public fallback last. Secrets should stay in environment variables or GitHub Actions secrets, never in YAML.

Optional SEC filing metadata requires a respectful User-Agent:

```bash
export SEC_USER_AGENT="Your Name your-email@example.com"
```

Without that environment variable, the extension skips SEC API requests and uses the SEC company page fallback as a reference link when `sec_company_page` is in the filing provider order.

## Output Schema

Each item includes:

```yaml
symbol: NVDA
name: Nvidia
sector: Chip Design and Equipment
signal: bullish
score: 82
confidence: medium
setup_type: gap_up_news
price: 123.45
previous_close: 121.20
premarket_change_pct: 1.86
change_5d_pct: 4.2
relative_strength_pct: 1.7
sector_trend: positive
news_sentiment: positive
summary: "Bullish setup from +1.9% vs previous close, positive sector tape..."
drivers: []
invalidation: []
risk_flags: []
sources: []
data_quality:
  quote: delayed
  news: fresh
  financials: reference
```

The section `meta` also includes `sector_overview`, which powers the sector tape:

```yaml
sector: Chip Design and Equipment
signal: bullish
avg_score: 76
avg_change_5d_pct: 3.2
avg_relative_strength_pct: 1.1
counts:
  bullish: 2
  bearish: 0
  neutral: 3
top_symbol: NVDA
```

## Market Calendar

The extension skips weekends and common full-day US market holidays. When skipped, it returns an empty section with `meta.market_status = "closed"` and `meta.skip_reason = "weekend_or_us_market_holiday"`.

## Data Sources

| Data | Source | Notes |
| --- | --- | --- |
| Quotes/OHLCV optional | Finnhub quote + stock candle endpoints | Requires `FINNHUB_API_KEY`; skipped when absent. |
| Quotes/OHLCV | Yahoo Finance chart endpoint | Public baseline, delayed or incomplete. |
| Quotes/OHLCV fallback | Nasdaq quote/history endpoint | No-key delayed fallback when Yahoo is unavailable. |
| News optional | Finnhub company news endpoint | Requires `FINNHUB_API_KEY`; skipped when absent. |
| News | GDELT DOC API | Free broad news search; may be noisy. |
| News fallback | Google News RSS | No-key fallback when GDELT is sparse. |
| Filings | SEC EDGAR | Optional; requires `SEC_USER_AGENT` or `LINNET_SEC_USER_AGENT`. |
| Filings fallback | SEC company page link | No-key reference link; not treated as a fresh filing. |

The Astro stock board uses `language` from `config/sources.yaml` for its UI labels (`en` and `zh` are currently covered). LLM-generated signal text follows the configured `language` through the normal Linnet prompt language instruction.

## Testing

```bash
PYTHONPATH=. pytest tests/test_us_stocks_extension.py -q
```

## Disclaimer

This extension is for research and educational use. It is not financial advice. Public market data can be delayed, incomplete, or wrong; verify with your broker and primary sources before trading.

# Contributing to Linnet

Contributions welcome — bug fixes, new extensions, new sinks, and documentation improvements.

---

## Adding a new extension (5 steps)

An extension is a self-contained data source. It owns its full pipeline: **fetch → process → render**.

### Step 1 — Create `extensions/my_source.py`

```python
from extensions.base import BaseExtension, FeedSection


class MySourceExtension(BaseExtension):
    key = "my_source"    # must match the key in config/sources.yaml
    title = "My Source"

    def fetch(self) -> list[dict]:
        """Pull raw items from the data source. No LLM here."""
        return [{"title": "Example", "url": "https://example.com"}]

    def process(self, items: list[dict]) -> list[dict]:
        """Optional: score, filter, or summarise items.

        Available helpers:
          self.llm     — OpenAI-compatible client (OpenRouter)
          self.config  — your config slice from sources.yaml
                         includes: language, llm_scoring_model, llm_summarization_model
        """
        lang = self.config.get("language", "en")
        # call self.llm.chat.completions.create(...) if you need LLM summaries
        return items

    def render(self, items: list[dict]) -> FeedSection:
        return FeedSection(key=self.key, title=self.title, items=items)
```

### Step 2 — Register in `extensions/__init__.py`

```python
from extensions.my_source import MySourceExtension

REGISTRY: list[type[BaseExtension]] = [
    ...,
    MySourceExtension,   # add here
]
```

### Step 3 — Add a config block in `config/sources.yaml`

```yaml
my_source:
  enabled: true
  # any extension-specific options go here
```

### Step 4 — Wire it into the orchestrator (`main.py`)

In `_build_extension_configs()`, add a key matching `MySourceExtension.key`:

```python
"my_source": {**sources.get("my_source", {}), **llm},
```

And in `run_daily()`, pass the items to `build_daily_payload()` (or just let the payload carry them via `sections`).

### Step 5 — Add tests in `tests/`

At minimum, test your `fetch()` parsing logic with a fixture — no live network calls needed.

---

## Adding a new sink

A sink receives the fully built daily payload and delivers it to an external service.

```python
# sinks/my_sink.py
import os
from sinks.base import BaseSink


class MySink(BaseSink):
    key = "my_sink"   # matches sinks.my_sink in sources.yaml

    def deliver(self, payload: dict) -> None:
        """
        payload keys: date, papers, hacker_news, jobs,
                      github_trending, supervisor_updates, meta
        Credentials: read from environment variables only — never from config files.
        """
        api_key = os.environ.get("MY_SINK_API_KEY", "")
        if not api_key:
            raise EnvironmentError("MY_SINK_API_KEY is not set")
        # ... send payload ...
```

Register in `sinks/__init__.py` and add a config block under `sinks:` in `sources.yaml`.
Add the required credential as a GitHub secret and pass it in `.github/workflows/daily.yml`.

---

## Development setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. pytest tests/ -q
```

Run the pipeline locally (requires `OPENROUTER_API_KEY`):

```bash
export OPENROUTER_API_KEY=sk-or-...
python main.py --mode daily
python main.py --dry-run      # fetch only, no LLM calls
```

---

## Guidelines

- Keep extensions self-contained — no cross-extension imports.
- Credentials only from environment variables, never hardcoded or in YAML.
- Sink failures must not abort the pipeline (`deliver()` raises → caller logs and continues).
- One extension per PR makes review easier.
- Run `pytest` before opening a PR — all 53 tests must pass.

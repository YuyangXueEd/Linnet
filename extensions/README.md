# extensions/

This directory contains all data source extensions. Each extension is a self-contained unit that owns its full pipeline:

```
fetch() → process() → render() → FeedSection
```

The orchestrator (`main.py`) calls `ext.run()` on every enabled extension and assembles the results into the daily payload.

---

## How an extension works

```
┌─────────────────────────────────────────────────────────┐
│  BaseExtension.run()                                    │
│                                                         │
│  1. fetch()   — pull raw items (no LLM)                 │
│  2. process() — score / filter / summarise (LLM ok)     │
│  3. render()  — package into FeedSection                │
└─────────────────────────────────────────────────────────┘
```

### FeedSection

The output every extension must produce:

```python
@dataclass
class FeedSection:
    key:         str        # snake_case, matches config/sources.yaml key
    title:       str        # display name shown in rendered output
    icon:        str        # marker shown in nav + heading
    payload_key: str | None # optional flat JSON key (defaults to key)
    items:       list[dict] # processed item dicts
    meta:        dict       # optional stats (counts, durations, etc.)
```

### What's injected into `self.config`

The orchestrator merges your `sources.yaml` block with `config/extensions/{name}.yaml` and injects:

| Key | Value |
|---|---|
| `enabled` | bool from sources.yaml |
| `language` | output language code (e.g. `"en"`) |
| `llm_scoring_model` | model name for scoring |
| `llm_summarization_model` | model name for summarisation |
| `dry_run` | `True` when `--dry-run` flag is set — **skip all LLM calls** |

---

## Quickstart: build a new extension

### 1. Copy the template package

```bash
cp -r extensions/_template extensions/my_source
```

### 2. Fill in the metadata

Edit `extensions/my_source/meta.json`.

This file is the source of truth for the Astro-side extension registry used by:

- the setup wizard source picker
- the setup wizard field forms
- section titles / subtitles / layout hints in the site

After editing metadata, refresh the generated Astro registry:

```bash
cd astro
npm run sync:extension-meta
```

### 3. Fill in the three methods

Open `extensions/my_source/__init__.py` and implement:

- **`fetch()`** — pull raw data. Return a list of dicts. No LLM calls here.
- **`process()`** — optional. Call `self.llm` to score or summarise. Respect `dry_run`.
- **`render()`** — wrap items in a `FeedSection`. No network calls here.

### 4. Register it

In `extensions/__init__.py`:

```python
from extensions.my_source import MySourceExtension

REGISTRY = [
    ...,
    MySourceExtension,   # add here
]
```

### 5. Add a config block

Add it to `config/sources.yaml`:

```yaml
display_order:
  - my_source
```

```yaml
my_source:
  enabled: true
  # any source-level limits (e.g. max_items)
```

If your extension needs filter/keyword config, create `config/extensions/my_source.yaml`:

```yaml
# config/extensions/my_source.yaml
keywords:
  - AI
  - machine learning
llm_score_threshold: 7
```

### 6. Write a test

Add `tests/test_my_source.py`. At minimum, test your `fetch()` parsing logic with a fixture — no live network calls needed. See `tests/test_hn_collector.py` for a simple example.

---

## Testing

```bash
# Run all tests
PYTHONPATH=. pytest tests/ -q

# Run only your extension's tests
PYTHONPATH=. pytest tests/test_my_source.py -v

# Smoke test: fetch real data without LLM calls (no API cost)
python main.py --dry-run
```

`--dry-run` fetches live data from all enabled extensions but skips every LLM call, so you can verify your `fetch()` and parsing logic without spending any API credits.

---

## Built-in extensions

Each extension is a package (`extensions/<name>/`) containing `__init__.py` (the extension class) and usually `README.md` (docs specific to that extension).
Each built-in extension also has a `meta.json` file that feeds the Astro setup wizard registry.

If your extension needs a custom card layout in the Astro site, add a component under `astro/src/components/` and register it in `SectionBlock.astro`. The default `GenericCard.astro` handles any unknown key automatically.

| Package | Key | What it does |
|---|---|---|
| `arxiv/` | `arxiv` | Fetches arXiv papers, LLM-scores and summarises them — [docs](arxiv/README.md) |
| `hacker_news/` | `hacker_news` | Fetches top HN stories above a score threshold — [docs](hacker_news/README.md) |
| `github_trending/` | `github_trending` | Fetches daily trending GitHub repos — [docs](github_trending/README.md) |
| `us_stocks/` | `us_stocks` | Builds a pre-market signal board for configurable US stock watchlists — [docs](us_stocks/README.md) |
| `postdoc_jobs/` | `postdoc_jobs` | Fetches and ranks research job postings — [docs](postdoc_jobs/README.md) |
| `supervisor_updates/` | `supervisor_updates` | Monitors supervisor / lab pages for changes — [docs](supervisor_updates/README.md) |
| `weather/` | `weather` | Fetches today's weather for a configured city |

---

## Extension checklist

Before opening a PR with a new extension:

- [ ] `key` is unique and matches `config/sources.yaml`
- [ ] `meta.json` exists and `meta.json.key` matches the directory name
- [ ] `fetch()` makes no LLM calls
- [ ] `process()` checks `self.config.get("dry_run")` and skips LLM calls if set
- [ ] `render()` makes no network calls
- [ ] Credentials read from `os.environ` only — never from config files
- [ ] At least one test covering the parsing/filtering logic
- [ ] `PYTHONPATH=. pytest tests/ -q` passes

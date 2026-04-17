# postdoc_jobs extension

Fetches postdoc and academic job postings (research associate, fellowship positions) from multiple RSS feeds and web sources, scores them for relevance with an LLM, and summarises the requirements.

## Pipeline

```
fetch()    — pulls from RSS feeds (jobs.ac.uk) + scraped pages (FindAPostDoc,
             AcademicPositions, EURAXESS) → keyword filter → deduplication
process()  — LLM relevance scoring → drops jobs below threshold
           → LLM requirements summarisation
render()   — wraps in FeedSection
```

## Config

`config/sources.yaml` — toggle only:

| Key | Default | Notes |
|---|---|---|
| `enabled` | `false` | Set to `true` to activate |

`config/extensions/postdoc_jobs.yaml` — all other settings (see [`postdoc_jobs.yaml.example`](postdoc_jobs.yaml.example) to restore defaults):

| Key | Default | Notes |
|---|---|---|
| `rss_sources` | `[]` | List of `{url, name}` RSS feed dicts |
| `jina_sources` | `[]` | List of `{url, name, type}` scraped sources |
| `filter_keywords` | `[]` | At least one must match title or description |
| `exclude_keywords` | `[]` | Jobs matching any of these are dropped |
| `llm_score_threshold` | `7` | Jobs scoring below this (0–10) are dropped |
| `request_timeout` | `20.0` | Seconds for job detail HTTP fetches |
| `jina_timeout` | `30.0` | Seconds for Jina.ai scrape requests |

## Output item schema

```python
{
  "title":           str,
  "url":             str,
  "institution":     str,
  "location":        str,
  "deadline":        str,
  "salary":          str,
  "source":          str,    # e.g. "jobs.ac.uk Research"
  "relevance_score": float,  # LLM score 0–10
  "requirements":    str,    # LLM-summarised requirements
}
```

## Underlying collector

- `collectors/jobs_collector.py`
  - `fetch_jobs(rss_sources, filter_keywords, exclude_keywords, jina_sources)`
  - Supports: jobs.ac.uk (RSS), FindAPostDoc, AcademicPositions, EURAXESS

## Enabling this extension

1. Set `postdoc_jobs.enabled: true` in `config/sources.yaml`
2. Edit `config/extensions/postdoc_jobs.yaml` to configure sources and filters
3. Add it to `REGISTRY` in `extensions/__init__.py`:
   ```python
   from extensions.postdoc_jobs import PostdocJobsExtension
   REGISTRY = [..., PostdocJobsExtension]
   ```
4. Update `run_daily()` in `main.py` to pass `sections["postdoc_jobs"].items` to `build_daily_payload()`

## Tests

```bash
PYTHONPATH=. pytest tests/test_jobs_collector.py -v
```

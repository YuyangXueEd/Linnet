# github_trending extension

Fetches the daily trending repositories from GitHub Trending and summarises each one with an LLM.

## Pipeline

```
fetch()    — scrapes github.com/trending for today's top repos
process()  — LLM one-sentence summary per repo
render()   — wraps in FeedSection
```

## Config

`config/sources.yaml` — toggle only:

| Key | Default | Notes |
|---|---|---|
| `enabled` | `true` | |

`config/extensions/github_trending.yaml` — all other settings (see [`github_trending.yaml.example`](github_trending.yaml.example) to restore defaults):

| Key | Default | Notes |
|---|---|---|
| `max_repos` | `15` | Maximum repos to fetch and display |
| `max_topics` | `5` | Topics queried via GitHub Search API (keep low to avoid rate limits) |
| `request_timeout` | `30.0` | Seconds for HTTP requests |
| `ai_topics` | *(built-in list)* | Topic tags used in GitHub Search API fallback |
| `ai_keywords` | *(built-in list)* | Keywords used to filter repos for AI/ML relevance |

## Output item schema

```python
{
  "full_name":   str,         # "owner/repo"
  "url":         str,         # https://github.com/owner/repo
  "description": str,
  "language":    str,         # primary language (may be empty)
  "stars_today": int,         # stars gained today
  "total_stars": int,
  "summary":     str,         # LLM one-liner
}
```

## Underlying collector

- `collectors/github_trending_collector.py`
  - `fetch_github_trending(max_repos)` — scrapes github.com/trending

## Tests

```bash
PYTHONPATH=. pytest tests/test_github_trending_collector.py -v
```

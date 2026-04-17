# hacker_news extension

Fetches top Hacker News stories that match configured AI/ML keywords and exceed a minimum score threshold, then summarises each one with an LLM.

## Pipeline

```
fetch()    — scrapes HN top stories, filters by score + keyword match
process()  — LLM one-sentence summary per story
render()   — wraps in FeedSection
```

## Config

`config/sources.yaml` — toggle only:

| Key | Default | Notes |
|---|---|---|
| `enabled` | `true` | |

`config/extensions/hacker_news.yaml` — all other settings (see [`hacker_news.yaml.example`](hacker_news.yaml.example) to restore defaults):

| Key | Default | Notes |
|---|---|---|
| `min_score` | `50` | Minimum HN points to include |
| `max_items` | `20` | Maximum stories in the digest |
| `keywords` | `[]` | At least one must appear in the story title |
| `hours_back` | `24` | How far back to look for stories (hours) |
| `search_terms` | *(built-in list)* | Terms sent to Algolia API to drive the search |
| `hits_per_page` | `50` | Results per Algolia API query |
| `request_timeout` | `30.0` | Seconds for HTTP requests |

## Output item schema

```python
{
  "id":           int,
  "title":        str,
  "url":          str,   # external link (may be empty for Ask HN / Show HN)
  "score":        int,   # HN points
  "comments_url": str,   # https://news.ycombinator.com/item?id=<id>
  "summary":      str,   # LLM one-liner
}
```

## Underlying collector

- `collectors/hn_collector.py`
  - `fetch_stories(keywords, min_score, max_items)` — scrapes HN top stories

## Tests

```bash
PYTHONPATH=. pytest tests/test_hn_collector.py -v
```

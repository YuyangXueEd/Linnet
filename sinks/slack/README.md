# slack sink

Posts the daily digest to a Slack channel as a Block Kit message via Incoming Webhook.

## Setup

### 1. Create a Slack App

1. Go to https://api.slack.com/apps → **Create New App** → **From scratch**
2. Name it (e.g. `DailyDigest`) and pick your workspace
3. Under **Features** → **Incoming Webhooks** → toggle **On**
4. Click **Add New Webhook to Workspace** → pick a channel → **Allow**
5. Copy the webhook URL (starts with `https://hooks.slack.com/services/…`)

### 2. Add the webhook as a secret

**GitHub Actions:**
```
Settings → Secrets and variables → Actions → New repository secret
Name: SLACK_WEBHOOK_URL
Value: https://hooks.slack.com/services/…
```

**Local / .env:**
```bash
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/…
```

### 3. Enable in config

```yaml
# config/sources.yaml
sinks:
  slack:
    enabled: true
    max_papers: 5
    max_hn: 3
    max_github: 3
```

## Config options

| Key | Default | Notes |
|---|---|---|
| `enabled` | `false` | Must be `true` to post |
| `max_papers` | `5` | arXiv papers included in the message |
| `max_hn` | `3` | Hacker News stories included |
| `max_github` | `3` | GitHub trending repos included |

## Message structure

```
📰 Linnet — YYYY-MM-DD
N papers  •  N HN stories  •  N jobs  •  N trending repos
────────────────────────────────
📄 Top arXiv Papers
   [paper title](url)  `cs.AI` · score 8
   Abstract text …
────────────────────────────────
🔥 Hacker News
   • [title](url)  `42 pts`
     Summary …
────────────────────────────────
⭐ GitHub Trending
   • [owner/repo](url)  `Python`  +123★ today
     Summary …
────────────────────────────────
💼 Academic Jobs   (if jobs extension enabled)
   • [title](url)  —  Institution
────────────────────────────────
_Generated in 42s · model-name_
```

## Payload fields used

The sink reads these keys from the daily payload dict:

| Key | Type | Source |
|---|---|---|
| `date` | str | orchestrator |
| `papers` | list[dict] | arxiv extension |
| `hacker_news` | list[dict] | hacker_news extension |
| `github_trending` | list[dict] | github_trending extension |
| `jobs` | list[dict] | jobs extension (optional) |
| `meta` | dict | orchestrator (duration, model) |

## Limitations

- Slack Block Kit text fields are capped at **3000 characters**. Long summaries are truncated automatically.
- Slack limits messages to **50 blocks**. Very large digests may be silently cut off.

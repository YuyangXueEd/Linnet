# serverchan sink

Posts the daily digest to Server酱 via SendKey / AppKey.

## Setup

### 1. Get a key

Start from the official SendKey page:

- Docs / entry: https://sct.ftqq.com/sendkey
- Optional referral link: https://sct.ftqq.com/r/21449

Copy your `SendKey` or `AppKey`.

### 2. Add the key as a secret

**GitHub Actions:**
```text
Settings → Secrets and variables → Actions → New repository secret
Name: SERVERCHAN_SENDKEY
Value: SCT...
```

**Local / .env:**
```bash
export SERVERCHAN_SENDKEY=SCT...
```

### 3. Enable in config

```yaml
sinks:
  serverchan:
    enabled: true
    max_papers: 5
    max_hn: 3
    max_github: 3
    max_jobs: 3
```

## Config options

| Key | Default | Notes |
|---|---|---|
| `enabled` | `false` | Must be `true` to post |
| `max_papers` | `5` | arXiv papers included in the message |
| `max_hn` | `3` | Hacker News stories included |
| `max_github` | `3` | GitHub trending repos included |
| `max_jobs` | `3` | Job postings included |

## Message shape

The sink sends:

- a short title via the `text` field
- a Markdown body via the `desp` field

The current implementation uses the standard Server酱 endpoint:

```text
POST https://sctapi.ftqq.com/<SENDKEY>.send
```

## Notes

- Free limits and exact quotas can change over time. Always trust the current Server酱 control panel / docs over hard-coded numbers in this repo.
- Credentials are read from environment variables only and never written into `sources.yaml`.

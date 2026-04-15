![MyDailyUpdater](assets/logo-wide.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Daily Digest](https://github.com/YuyangXueEd/MyDailyUpdater/actions/workflows/daily.yml/badge.svg)](https://github.com/YuyangXueEd/MyDailyUpdater/actions/workflows/daily.yml)
[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/downloads/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/YuyangXueEd/MyDailyUpdater/pulls)

[中文文档](README_zh.md)

![MyDailyUpdater hero](assets/hero.png)

**Get a personalised research digest every morning — without lifting a finger.**

Fork this repo, add one API key, and publish your own site with daily research updates, AI summaries, and optional notifications.

**[See a live example →](https://yuyangxueed.github.io/MyDailyUpdater)** · **[Setup Wizard →](https://yuyangxueed.github.io/MyDailyUpdater/setup/)** · **[Manual config guide →](docs/setup/manual-config.md)**

> **Important:** the public wizard is a generator for your own fork. It does **not** modify this demo site or this repository. Today it generates config for copy-paste; browser-side one-click deploy is not enabled yet.
>
> **Default LLM path:** the quick-start flow uses OpenRouter with `OPENROUTER_API_KEY`. Advanced users can also edit models and `llm.base_url` in `config/sources.yaml`.

---

## What you get every morning

| Core source | What it gives you |
|---|---|
| **arXiv** | New papers matching your keywords, with AI summaries |
| **Hacker News** | High-signal AI/ML stories above your score threshold |
| **GitHub Trending** | Trending repos in your area |
| **Weather** | Today's forecast for your city |

Optional sources such as postdoc jobs and supervisor-page monitoring are available through the extension system, but they are not required for most users.

Everything runs on GitHub Actions and publishes to GitHub Pages as your own searchable site.

![Pipeline workflow](assets/workflow.png)

---

## Get started in 5 simple steps

### 1. Fork this repo

Click **Fork** on GitHub so the generated config and published site belong to you.

### 2. Add your API key

Go to **Settings → Secrets and variables → Actions → New repository secret** in your fork.

| Name | Value |
|---|---|
| `OPENROUTER_API_KEY` | Your key from [openrouter.ai/keys](https://openrouter.ai/keys) |

OpenRouter is the default fast path because one key can access many models. If you want to experiment with other OpenAI-compatible gateways later, start from the [manual config guide](docs/setup/manual-config.md).

### 3. Enable GitHub Pages

Go to **Settings → Pages → Source: Deploy from a branch → `main` / `/docs`**.

### 4. Open the wizard and generate config

Use the [Setup Wizard](https://yuyangxueed.github.io/MyDailyUpdater/setup/) for the fast path. It walks through source selection, ordering, sink choices, and generated files for **your fork**.

If you prefer to edit everything yourself, use [`docs/setup/manual-config.md`](docs/setup/manual-config.md) instead.

### 5. Run the first workflow

Go to **Actions → Daily Digest → Run workflow**.

Your site should be live in a few minutes.

---

## Read the config at a glance

A small `sources.yaml` example is usually enough to understand the shape:

```yaml
display_order:
  - weather
  - arxiv
  - github_trending
  - hacker_news

weather:
  enabled: true
  city: "Edinburgh"
  timezone: "auto"

arxiv:
  enabled: true

github_trending:
  enabled: true
  max_repos: 15

hacker_news:
  enabled: true

language: "en"

llm:
  scoring_model: "google/gemini-2.5-flash-lite-preview-09-2025"
  summarization_model: "google/gemini-2.5-flash-lite-preview-09-2025"
  base_url: "https://openrouter.ai/api/v1"
```

Two key ideas:

- `enabled: true/false` turns each source or sink on and off
- `display_order` also controls the order those sections appear in the rendered digest

Keep the README mental model simple. Use the per-extension and per-sink docs for detailed options.

---

## Extensions: bring your own sources

This project is built around an extension system.

- Built-in examples live in [`extensions/`](extensions/)
- Detailed conventions live in [`extensions/README.md`](extensions/README.md)
- Extension-specific options belong in each extension's own `README.md`
- New extensions can be created by copying [`extensions/_template/`](extensions/_template/)

That means you do **not** need every built-in source. If you only want papers, HN, GitHub Trending, and weather, that is a perfectly normal setup.

---

## Sinks: optional delivery channels

The website is the default output. Sinks are optional extra delivery channels.

Current built-in sinks include:

- `slack`
- `serverchan`

Sink-specific setup belongs in:

- [`sinks/README.md`](sinks/README.md) for the shared sink model
- `sinks/<name>/README.md` for each sink's own setup details

Sinks are already standardized around the same pattern:

- configure non-secret options in `sources.yaml`
- keep credentials in GitHub Secrets or environment variables
- add new sinks by copying [`sinks/_template/`](sinks/_template/)

Example:

```yaml
sinks:
  slack:
    enabled: true
    max_papers: 5
    max_hn: 3
    max_github: 3
```

More sinks are welcome, just like more extensions.

---

## Schedules and timezones

The default schedules live in:

- [`.github/workflows/daily.yml`](.github/workflows/daily.yml)
- [`.github/workflows/weekly.yml`](.github/workflows/weekly.yml)
- [`.github/workflows/monthly.yml`](.github/workflows/monthly.yml)

GitHub Actions cron uses **UTC**. If you want different times, edit those cron lines directly in your fork.

Source-specific time settings, such as the weather timezone, live in `config/sources.yaml`.

---

## Run locally

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

export OPENROUTER_API_KEY=sk-or-...
python main.py --mode daily
python main.py --dry-run
python main.py --mode weekly
python main.py --mode monthly
```

Run tests:

```bash
PYTHONPATH=. pytest tests/ -q
```

---

## Project layout

```text
MyDailyUpdater/
├── extensions/   # data-source plugins
├── sinks/        # optional delivery channels
├── config/       # sources.yaml + per-extension config
├── templates/    # daily / weekly / monthly page templates
├── publishers/   # writes docs/ pages and JSON outputs
├── docs/         # public GitHub Pages site
├── skills/       # public prompt/skill files for contributors and users
├── dev_docs/     # maintainer-focused docs
└── main.py       # CLI entry point
```

---

## Using AI coding agents for contribution and setup

This project actively encourages both contributors and end users to use AI agents for new extensions, sinks, and repo customization.

Packaged skill folders now live in [`skills/`](skills/):

- [`skills/dailyreport-contributor/SKILL.md`](skills/dailyreport-contributor/SKILL.md)
- [`skills/dailyreport-config-customization/SKILL.md`](skills/dailyreport-config-customization/SKILL.md)

Lightweight prompt versions are also available:

- [`skills/dailyreport-contributor.md`](skills/dailyreport-contributor.md)
- [`skills/dailyreport-config-customization.md`](skills/dailyreport-config-customization.md)

Before asking an AI agent to make changes, point it at the repo guidance first:

- [`llms.txt`](llms.txt)
- [`extensions/llms.txt`](extensions/llms.txt)
- [`sinks/llms.txt`](sinks/llms.txt)
- [`extensions/README.md`](extensions/README.md)
- [`sinks/README.md`](sinks/README.md)
- the relevant packaged skill under [`skills/`](skills/)

Suggested prompt:

```text
Please read llms.txt, extensions/llms.txt, sinks/llms.txt, extensions/README.md,
sinks/README.md, and the relevant SKILL.md under skills/ before making changes or suggesting configuration edits.
```

---

## Share setups and ask for help

If you build an interesting setup, please share it in [Discussions](https://github.com/YuyangXueEd/MyDailyUpdater/discussions).

For implementation problems, config help, extension ideas, or sink requests, use the issue templates in this repo.

---

## Support the project

If this repo saves you time, helps you track your field, or gives you a good starting point for your own research dashboard, you can support it here:

- [GitHub Sponsors](https://github.com/sponsors/yuyangxueed)
- [Ko-fi](https://ko-fi.com/guesswhat_moe)

Support is optional. I appreciate donations, but I value contributions, fixes, ideas, and new integrations even more.

---

## Acknowledgements

Special thanks to [Just the Docs](https://just-the-docs.com/) and [Jekyll](https://jekyllrb.com/) for the public-site foundation behind this project.

More broadly, I’m also grateful to the many open-source repositories, maintainers, and contributors whose ideas, patterns, and examples helped shape this repo.

If you notice a project or repository that should be credited more explicitly, please open an issue or PR and I’ll gladly add it.

---

## License

MIT — see [LICENSE](LICENSE). Contributions welcome.

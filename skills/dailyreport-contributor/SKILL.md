---
name: dailyreport-contributor
description: This skill should be used when contributing code, docs, extensions, sinks, setup UX, or generated-site changes to the MyDailyUpdater repository, especially when an AI agent needs to learn repo conventions before editing files.
---

# DailyReport Contributor

## Overview

Follow this skill when working on `MyDailyUpdater` as a contributor. Build context from the repo's canonical guidance first, then make minimal edits that preserve the plugin-based architecture, secret-handling rules, and generated-site workflow.

## Quick start

1. Read `llms.txt` for the repo overview.
2. Read `README.md` or `README_zh.md` for the user-facing setup story.
3. If touching extensions, read `extensions/llms.txt` and `extensions/README.md`.
4. If touching sinks, read `sinks/llms.txt`, `sinks/README.md`, and the sink-specific `README.md`.
5. If touching setup/onboarding, read `docs/setup/manual-config.md` and the relevant setup page.
6. Keep secrets in environment variables or GitHub Actions secrets, never in committed YAML.
7. Read `references/repo-map.md` when a compact repo map is useful.

## When to use this skill

Use this skill for tasks such as:

- adding or modifying an extension in `extensions/`
- adding or modifying a sink in `sinks/`
- changing `config/sources.yaml` conventions or docs
- updating `README.md`, `README_zh.md`, or setup documentation
- changing generated-site templates in `templates/` or `publishers/`
- reviewing PR scope for extension, sink, setup, or public-site work

## Workflow

### 1. Build repo context first

Read the smallest set of canonical files that fully explains the task. Prefer the repo's own docs over assumptions.

Core entry points:

- `llms.txt`
- `README.md`
- `README_zh.md`
- `main.py`
- `config/sources.yaml`

Extension work:

- `extensions/llms.txt`
- `extensions/README.md`
- `extensions/_template/`
- the target extension's own `README.md`

Sink work:

- `sinks/llms.txt`
- `sinks/README.md`
- `sinks/_template/`
- the target sink's own `README.md`

Public-site work:

- `docs/_config.yml`
- `docs/_includes/head_custom.html`
- `templates/*.md.j2`
- `publishers/pages_publisher.py`

### 2. Preserve the repo's architecture

Keep these rules intact:

- Treat extensions as self-contained source plugins.
- Treat sinks as optional delivery channels.
- Keep source/sink secrets out of YAML.
- Keep README focused on user mental model, not exhaustive implementation detail.
- Put detailed setup and implementation details in the relevant docs near the code.

### 3. Follow extension conventions

When building or updating an extension:

1. Start from `extensions/_template/` when possible.
2. Keep `fetch()` free of LLM calls.
3. Keep `process()` responsible for scoring/filtering/summarisation.
4. Keep `render()` focused on packaging output into a `FeedSection`.
5. Register the extension in `extensions/__init__.py`.
6. Add or update tests under `tests/`.
7. Document extension-specific config in that extension's own `README.md`.

### 4. Follow sink conventions

When building or updating a sink:

1. Start from `sinks/_template/` when possible.
2. Keep credentials in environment variables or GitHub Actions secrets.
3. Keep non-secret behaviour under `sinks:` in `config/sources.yaml`.
4. Register the sink in `sinks/__init__.py`.
5. Document setup in the sink's own `README.md`.

### 5. Keep docs in sync

When behaviour changes, update the closest user-facing or developer-facing docs in the same pass.

Typical sync targets:

- `README.md` / `README_zh.md`
- `docs/setup/manual-config.md`
- `extensions/README.md`
- `sinks/README.md`
- extension- or sink-specific `README.md`
- `superpowers/roadmap.md` for tracked follow-up work

### 6. Validate before finishing

Run the smallest useful validation available for the change:

- targeted lint checks for edited files
- `PYTHONPATH=. pytest tests/ -q` when code paths changed
- manual sanity checks for generated docs/templates when public-site output changed

## Repo-specific reminders

- `display_order` in `config/sources.yaml` affects rendered section order.
- The public setup wizard is a generator for the visitor's own fork; treat demo-site safety and wording as important.
- Weekly/monthly rollups still have extension-awareness debt; avoid assuming they are fully registry-driven.
- Prefer focused edits to existing files over broad rewrites unless the task explicitly calls for restructuring.

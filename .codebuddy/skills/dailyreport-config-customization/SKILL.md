---
name: dailyreport-config-customization
description: This skill should be used when helping someone use, configure, or customize MyDailyUpdater, especially for setup, source selection, language/model changes, prompt overrides, sink enablement, or workflow schedule changes.
---

# DailyReport Config & Customization

## Overview

Guide setup, configuration, and customization work for `MyDailyUpdater`. Build context from the repo's own setup and config docs first. Prefer minimal edits to existing config and documentation instead of inventing new conventions.

## Quick start

1. Read `README.md` or `README_zh.md` for the user-facing setup story.
2. Read `docs/setup/manual-config.md` for the step-by-step setup path.
3. Read `config/sources.yaml` for global toggles, models, prompts, pages, and sinks.
4. Read `config/extensions/*.yaml` for source-specific filters or keywords.
5. Read `sinks/README.md`, `sinks/llms.txt`, and the target sink's `README.md` if delivery changes are requested.
6. Read `.github/workflows/daily.yml`, `weekly.yml`, and `monthly.yml` if schedule changes are requested.
7. Read `references/config-map.md` when a compact map of the editable surfaces is needed.

## When to use this skill

Use this skill for tasks such as:

- helping someone fork and configure the repo for first use
- enabling or disabling data sources
- changing language, model IDs, or OpenAI-compatible `base_url`
- editing `llm.prompts` overrides
- changing topic filters under `config/extensions/`
- enabling Slack or ServerChan delivery
- adjusting workflow schedules or clarifying UTC timing
- explaining what each major config block means

## Workflow

### 1. Build the user's mental model first

Explain the config in this order:

1. `display_order` controls rendered section order.
2. Each top-level source block uses `enabled` to opt in or out.
3. `language` controls summary language.
4. `llm.*` controls provider endpoint, model choice, and optional prompt overrides.
5. `sinks.*` controls optional delivery channels.
6. `.github/workflows/*.yml` controls automation timing.

### 2. Prefer safe, minimal changes

Make focused edits to existing YAML or docs. Avoid introducing new top-level config keys unless the repository architecture truly requires them.

### 3. Preserve secret-handling rules

Keep API keys, webhook URLs, and tokens in environment variables or GitHub Actions secrets only. Do not move secrets into committed config files.

### 4. Keep optional features clearly optional

Present `postdoc_jobs`, `supervisor_updates`, and sinks as opt-in features. Keep the default user story centered on the core daily digest setup.

### 5. Keep docs in sync

When setup or config behaviour changes, update the nearest docs in the same pass. Typical sync targets:

- `README.md` / `README_zh.md`
- `docs/setup/manual-config.md`
- `sinks/README.md`
- sink-specific `README.md`
- `superpowers/roadmap.md` if the change closes a tracked follow-up

### 6. Validate before finishing

Run the smallest useful validation for the scope of the change:

- targeted lint or diagnostics for edited files
- manual sanity check of YAML structure and indentation
- manual review of any workflow cron comment or timezone wording that changed

## Repo-specific reminders

- The public setup wizard is a generator for the visitor's own fork; treat wording and safety as important product behaviour.
- `llm.base_url` already supports OpenAI-compatible endpoints; naming and docs should still stay clear for users.
- `display_order` affects the final rendered page order.
- Sinks are optional delivery channels and should not be required for the site to work.

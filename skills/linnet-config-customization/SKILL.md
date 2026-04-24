---
name: linnet-config-customization
description: This skill should be used when helping someone use, configure, or customize Linnet, especially for setup, source selection, language/model changes, prompt overrides, sink enablement, or workflow schedule changes.
---

# Linnet Config & Customization

Use this skill when the task is mainly about helping someone set up or customize their own Linnet repository.

Do not use it as the main guide for contributor-facing repo edits. For implementation work inside the repo, prefer `skills/linnet-contributor/SKILL.md`.

## Read order

Start with the user-facing setup path first:

1. `README.md` or `README_zh.md`
2. `setup-bridge/README.md`
3. `dev_docs/manual-config.md`
4. `config/sources.yaml`
5. `config/extensions/*.yaml` for the relevant source
6. `sinks/README.md` plus the relevant sink `README.md` if delivery changes are involved
7. `.github/workflows/daily.yml`, `weekly.yml`, or `monthly.yml` if schedule changes are requested

Read `references/config-map.md` when you want a compact config map.

## Explain the config in this order

1. `display_order` controls the rendered section order
2. each source block uses `enabled`
3. `language` controls the output language
4. `llm.*` controls provider label, API base URL, secret name, model IDs, and prompt overrides
5. `sinks.*` controls optional delivery channels
6. workflow files control automation timing and all cron expressions are UTC

## Rules to preserve

- Keep secrets in environment variables or GitHub Actions secrets only
- Do not move credentials into committed YAML
- Keep optional features clearly optional
- Prefer editing existing config keys over inventing new top-level config
- Keep setup docs and wizard wording aligned with the actual generated config
- Prefer `Use this template` plus the upstream setup wizard over `Fork` for first-time users
- Treat the GitHub App + Linnet Bridge flow as the default happy path
- Treat manual config as a fallback path, not the main onboarding story

## Common tasks

### LLM changes

- provider presets live in the setup wizard
- `llm.base_url` and `llm.api_key_env` already support OpenAI-compatible endpoints
- the chosen secret name must match the environment variable that actually exists
- Step 5 deploy instructions should reflect the resolved provider config, not assume OpenRouter

### Setup and deploy changes

- the default path is: `Use this template -> install Linnet Bridge GitHub App -> authorize browser -> deploy`
- do not reintroduce PAT requirements into the default wizard path
- if a user cannot install the GitHub App or is blocked by org policy, move them to the manual guide explicitly

### Source changes

- enable or disable sources in `config/sources.yaml`
- adjust detail config in `config/extensions/<name>.yaml`
- keep the default user story simple unless the user explicitly wants advanced customization

### Sink changes

- enable sinks under `sinks:`
- keep webhook URLs and tokens out of the repo
- check the sink-specific README for required env var names

### Schedule changes

- edit the GitHub Actions workflow cron lines directly
- explain UTC clearly when discussing run times

## Validation

Use the smallest useful check for the scope:

- review YAML structure and indentation
- run targeted tests or diagnostics when behaviour changed
- run `cd astro && npm run check` if setup copy or generated wizard content changed
- mention anything you could not verify

## Done means

- the user can see which file or wizard step they need to touch
- secret handling remains safe
- docs match the real current setup flow
- advanced options stay discoverable without complicating the default path

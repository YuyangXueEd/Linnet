Use this prompt/skill when contributing code, docs, extensions, sinks, setup UX, or public-site changes in `MyDailyUpdater`.

## Read first

- `llms.txt`
- `README.md` or `README_zh.md`
- `config/sources.yaml`
- `extensions/llms.txt` and `extensions/README.md` if touching extensions
- `sinks/llms.txt` and `sinks/README.md` if touching sinks
- `docs/setup/manual-config.md` if touching setup/onboarding

## Working rules

1. Make focused edits instead of broad rewrites.
2. Keep secrets in environment variables or GitHub Actions secrets, never in committed YAML.
3. For extensions, keep `fetch()` free of LLM calls, let `process()` handle scoring/filtering/summarisation, and let `render()` only package a `FeedSection`.
4. For sinks, keep them opt-in under `sinks:` in `config/sources.yaml`, and read credentials from environment variables only.
5. If behaviour changes, update the nearest docs in the same pass.
6. Run the smallest useful validation before finishing.

## Repo reminders

- `display_order` in `config/sources.yaml` controls rendered section order.
- The setup wizard is a generator for the visitor's own fork, so wording and safety matter.
- `postdoc_jobs` and `supervisor_updates` are optional sources, not the default story.
- Sinks are optional delivery channels, not required for the site to work.

## Suggested prompt

```text
Please read llms.txt, extensions/llms.txt, sinks/llms.txt, extensions/README.md,
sinks/README.md, and skills/dailyreport-contributor/SKILL.md before making changes.
```

If the agent supports packaged local skills, use `skills/dailyreport-contributor/` directly.

# MyDailyUpdater repo map

Use this reference when the task touches onboarding, extensions, sinks, or the generated site.

## Canonical onboarding files

- `README.md` / `README_zh.md` — user-facing story and setup path
- `docs/setup/manual-config.md` — advanced manual configuration path
- `config/sources.yaml` — top-level source, sink, language, and model config

## Extension files

- `extensions/README.md` — extension conventions
- `extensions/llms.txt` — machine-readable extension guidance
- `extensions/_template/` — starter package for new extensions

## Sink files

- `sinks/README.md` — sink conventions and secret-handling rules
- `sinks/llms.txt` — machine-readable sink guidance
- `sinks/_template/` — starter package for new sinks

## Generated-site files

- `templates/*.md.j2` — daily/weekly/monthly page templates
- `publishers/pages_publisher.py` — page rendering pipeline
- `docs/_includes/head_custom.html` — shared public-site styling

## Validation reminders

- Run targeted lint checks for edited docs or code files.
- Run `PYTHONPATH=. pytest tests/ -q` when Python behaviour changes.
- Re-check generated page output when editing templates or page publisher logic.

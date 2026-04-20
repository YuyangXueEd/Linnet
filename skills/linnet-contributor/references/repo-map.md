# Linnet repo map

Use this reference when the task touches onboarding, extensions, sinks, or the generated site.

## Canonical onboarding files

- `README.md` / `README_zh.md` — user-facing story and setup path
- `dev_docs/manual-config.md` — advanced manual configuration path
- `config/sources.yaml` — top-level source, sink, language, and model config

## Extension files

- `extensions/README.md` — extension conventions
- `extensions/llms.txt` — machine-readable extension guidance
- `extensions/_template/` — starter package for new extensions

## Sink files

- `sinks/README.md` — sink conventions and secret-handling rules
- `sinks/llms.txt` — machine-readable sink guidance
- `sinks/_template/` — starter package for new sinks

## Astro site files

- `astro/src/pages/` — route pages (index, daily/[date], weekly/[week], monthly/[month])
- `astro/src/pages/setup/` — setup wizard Astro routes
- `astro/src/components/` — card components (PaperCard, HNCard, RepoCard, …)
- `astro/src/layouts/Base.astro` — HTML shell with NavBar and theme toggle
- `astro/src/styles/global.css` — CSS design tokens
- `astro/astro.config.mjs` — site base path and `__DATA_ROOT__` vite define

## Validation reminders

- Run targeted lint checks for edited docs or code files.
- Run `PYTHONPATH=. pytest tests/ -q` when Python behaviour changes.
- Run `npm run check` inside `astro/` after editing Astro/TypeScript files.

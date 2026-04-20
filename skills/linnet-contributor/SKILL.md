---
name: linnet-contributor
description: This skill should be used when contributing code, docs, extensions, sinks, setup UX, or generated-site changes to the Linnet repository, especially when an AI agent needs to learn repo conventions before editing files.
---

# Linnet Contributor

Use this skill when you are editing the Linnet repository itself.

Do not use it as the main guide for "help me configure my fork" requests. For that, prefer `skills/linnet-config-customization/SKILL.md`.

## Quick routing

Read the smallest relevant set before editing:

### Repo-wide or docs changes
1. `llms.txt`
2. `README.md` or `README_zh.md`
3. `superpowers/roadmap.md` if the change might close tracked debt

### Setup wizard or public-site changes
1. `dev_docs/manual-config.md`
2. `astro/src/pages/setup/index.astro` or `astro/src/pages/setup/zh/index.astro`
3. `astro/src/components/wizard/`

### Extension work
1. `extensions/llms.txt`
2. `extensions/README.md`
3. `extensions/_template/`
4. the target extension's code and `README.md`

### Sink work
1. `sinks/llms.txt`
2. `sinks/README.md`
3. `sinks/_template/`
4. the target sink's code and `README.md`

Read `references/repo-map.md` when you want a compact map instead of opening many files.

## Repo rules to preserve

- Keep extensions as self-contained source plugins
- Keep sinks as optional delivery channels
- Keep secrets in environment variables or GitHub Actions secrets, never in committed YAML
- Keep the README focused on the user's mental model
- Put deeper implementation detail in docs that live near the relevant code

## Editing checklist

### If you change extensions

1. Keep `fetch()` free of LLM calls
2. Keep `process()` responsible for scoring, filtering, or summarisation
3. Keep `render()` focused on packaging data into a `FeedSection`
4. Register the extension in `extensions/__init__.py`
5. Update tests and the extension's own docs

### If you change sinks

1. Keep credentials in environment variables or GitHub Actions secrets
2. Keep non-secret behaviour under `sinks:` in `config/sources.yaml`
3. Register the sink in `sinks/__init__.py`
4. Update tests and sink-specific docs

### If you change setup or docs

1. Keep the setup wizard and README aligned
2. Reflect current provider/secret behaviour accurately
3. Update `llms.txt` or skills if the agent guidance changed
4. Remove obsolete references when a migration is complete

## Validation

Run the smallest useful validation for the touched surface:

- Python/runtime: `PYTHONPATH=. pytest tests/ -q`, `python -m py_compile main.py`
- Astro/site: `cd astro && npm run check`, `npm run build`, `node --test tests/githubDeploy.test.mjs tests/githubAuth.test.mjs`
- Hygiene: `git diff --check`

## Done means

- the code or docs match current behaviour
- nearby user-facing docs are updated in the same pass
- no obsolete paths, files, or instructions remain because of your change
- the relevant checks pass, or you explicitly state what could not be verified

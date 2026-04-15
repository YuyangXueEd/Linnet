Use this prompt/skill when helping someone fork, use, configure, or customise `MyDailyUpdater`.

## Read first

- `README.md` or `README_zh.md`
- `docs/setup/manual-config.md`
- `config/sources.yaml`
- `config/extensions/arxiv.yaml` for topic filtering
- `sinks/README.md` and the target sink's `README.md` if enabling delivery channels
- `.github/workflows/daily.yml`, `weekly.yml`, `monthly.yml` if changing schedules

## Mental model

- `display_order` controls section order on the final page.
- Each top-level source block uses `enabled: true/false` to turn it on or off.
- `language` controls the output language.
- `llm.scoring_model`, `llm.summarization_model`, and `llm.base_url` control the LLM provider path.
- `llm.prompts` lets users override built-in prompts, but only with the documented placeholders.
- `sinks.*` config controls optional delivery channels; secrets still belong in environment variables or GitHub Actions secrets.

## Common customisation tasks

1. Turn sources on or off in `config/sources.yaml`.
2. Change research keywords in `config/extensions/arxiv.yaml`.
3. Change language, models, or provider-compatible `base_url`.
4. Override built-in prompts under `llm.prompts`.
5. Enable Slack or ServerChan delivery.
6. Adjust UTC workflow schedules in `.github/workflows/`.

## Safety rules

- Never put API keys or webhooks into committed YAML.
- Prefer editing the existing config shape instead of inventing a new schema.
- Keep optional sources and sinks clearly marked as optional.
- If setup behaviour changes, update the nearest docs in the same pass.

## Suggested prompt

```text
Please read README.md, docs/setup/manual-config.md, config/sources.yaml,
skills/dailyreport-config-customization/SKILL.md, and any related sink docs before helping me customise this repo.
```

If the agent supports packaged local skills, use `skills/dailyreport-config-customization/` directly.

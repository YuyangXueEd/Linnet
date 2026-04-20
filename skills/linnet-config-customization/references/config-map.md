# Config map

Use this reference when helping with setup or customization.

## Main files

- `README.md` / `README_zh.md` — high-level setup story and product framing
- `dev_docs/manual-config.md` — step-by-step manual setup flow
- `config/sources.yaml` — source toggles, display order, language, models, prompt overrides, pages, sinks
- `config/extensions/arxiv.yaml` — topic filters for arXiv
- `config/extensions/hitokoto.yaml` — sentence type for Chinese daily quote (locale: zh)
- `config/extensions/quote_of_day.yaml` — category for English daily quote (locale: en, requires API_NINJAS_KEY)
- `sinks/README.md` — sink conventions and extension points
- `.github/workflows/daily.yml` — daily run schedule (UTC)
- `.github/workflows/weekly.yml` — weekly run schedule (UTC)
- `.github/workflows/monthly.yml` — monthly run schedule (UTC)

## What users usually change

### `config/sources.yaml`

- `display_order` — final page section order
- `<source>.enabled` — source on/off switch
- `language` — output language (`en`, `zh`, etc. — also controls which locale the setup wizard shows)
- `hitokoto.enabled` — locale: zh; no key required
- `quote_of_day.enabled` — locale: en; requires `API_NINJAS_KEY` secret
- `llm.provider` — setup-facing provider label
- `llm.scoring_model` / `llm.summarization_model` — model selection
- `llm.base_url` — OpenAI-compatible provider endpoint
- `llm.api_key_env` — environment variable name for the provider key
- `llm.prompts.*` — prompt overrides with documented placeholders only
- `sinks.*` — optional delivery channel settings

### `config/extensions/arxiv.yaml`

- `categories`
- `must_include`
- `boost_keywords`
- score threshold fields

## Safety rules

- Keep secrets out of committed YAML.
- Prefer existing schema over new config shapes.
- If setup or config behaviour changes, update nearby docs in the same pass.

# Research Daily Digest — Design Spec
**Date:** 2026-04-13  
**Status:** Approved  
**Scope:** Automated daily digest of AI/CS/CV/Medical Imaging research + postdoc jobs, delivered via GitHub Pages and Claude Code session integration.

---

## 1. Problem Statement

Keeping up with daily arxiv papers (cs.CV, cs.AI, cs.LG, eess.IV), Hacker News tech news, and postdoc position openings across dozens of platforms is manually expensive. No existing project combines:
- Medical Imaging keyword-level filtering from arxiv
- Postdoc job aggregation with CV/AI/LLM/VLM relevance filtering
- Supervisor/lab homepage change detection
- Claude Code native interactive analysis
- Config-file-driven keyword management
- UK timezone scheduling with daily + weekly + monthly rollups

---

## 2. Architecture: Method B — Modular Python + Dual-Track Output

```
GitHub Actions (cron: UTC 00:00)
  ├── Collector Layer   → fetch raw data from all sources
  ├── Filter Layer      → keyword pre-filter + OpenRouter LLM scoring
  ├── Summarizer Layer  → OpenRouter Chinese summary generation
  └── Publisher Layer
        ├── data/daily/YYYY-MM-DD.json    ← Claude Code reads this
        └── docs/daily/YYYY-MM-DD.md     ← GitHub Pages renders this

Claude Code Skill (/daily-digest)
  └── Reads data/ JSON files for interactive analysis in session
```

**Key principle:** GitHub Actions handles all data collection and publishing autonomously (no local machine required). Claude Code adds an interactive analysis layer on top of the structured JSON output.

---

## 3. Repository Structure

```
research-daily-digest/
│
├── config/
│   ├── sources.yaml          # Data source toggles and settings
│   ├── keywords.yaml         # Keywords and LLM scoring config (user-maintained)
│   └── supervisors.yaml      # Target supervisor/lab URLs (starts empty)
│
├── collectors/
│   ├── arxiv_collector.py    # arxiv lib + keyword pre-filter + LLM scoring
│   ├── hn_collector.py       # HN Algolia Search API
│   ├── jobs_collector.py     # feedparser on Tier-1 RSS sources
│   └── supervisor_watcher.py # trafilatura fetch + SHA256 hash diff
│
├── pipeline/
│   ├── scorer.py             # OpenRouter LLM relevance scoring (0–10)
│   ├── summarizer.py         # OpenRouter Chinese summary generation
│   └── aggregator.py         # Merges sources; drives weekly/monthly rollups
│
├── publishers/
│   ├── data_publisher.py     # Writes data/YYYY-MM-DD.json
│   └── pages_publisher.py    # Renders Jinja2 templates → docs/ Markdown
│
├── docs/                     # GitHub Pages root (Jekyll, minima theme)
│   ├── _config.yml
│   ├── index.md              # Homepage with latest digest summary
│   ├── daily/                # Per-day Markdown pages
│   ├── weekly/               # Per-week Markdown pages
│   └── monthly/              # Per-month Markdown pages
│
├── data/                     # Structured JSON (Claude Code's data layer)
│   ├── daily/
│   ├── weekly/
│   ├── monthly/
│   └── supervisor_hashes.json   # Persisted page hashes for diff detection
│
├── skills/
│   └── daily-digest.md       # Claude Code /daily-digest skill definition
│
├── .github/workflows/
│   ├── daily.yml             # cron: '0 0 * * *'   (UTC midnight)
│   ├── weekly.yml            # cron: '0 0 * * 1'   (Monday UTC midnight)
│   └── monthly.yml           # cron: '0 0 1 * *'   (1st of month)
│
├── templates/
│   ├── daily.md.j2
│   ├── weekly.md.j2
│   └── monthly.md.j2
│
├── main.py                   # Local manual trigger entry point
├── requirements.txt
└── README.md
```

---

## 4. Configuration Files

### 4.1 `config/keywords.yaml`

```yaml
arxiv:
  categories:
    - cs.CV
    - cs.AI
    - cs.LG
    - eess.IV

  # Layer 1: fast local keyword pre-filter (title + abstract)
  must_include:
    - medical imaging
    - medical image
    - MRI
    - CT scan
    - radiology
    - pathology
    - ultrasound
    - fundus
    - histology
    - segmentation
    - computer vision
    - large language model
    - vision language model
    - diffusion model
    - foundation model

  boost_keywords:
    - VLM
    - SAM
    - ViT
    - CLIP
    - zero-shot
    - few-shot
    - multimodal

  # Layer 2: LLM scoring threshold (0–10, papers >= threshold pass)
  llm_score_threshold: 6

hacker_news:
  min_score: 50
  max_items: 20
  keywords:
    - AI
    - LLM
    - machine learning
    - computer vision
    - GPU
    - open source model
    - research
    - benchmark

jobs:
  rss_sources:
    - url: "https://www.jobs.ac.uk/jobs/academic-or-research/?format=rss"
      name: "jobs.ac.uk Research"
    - url: "https://www.jobs.ac.uk/jobs/computer-science/?format=rss"
      name: "jobs.ac.uk CS"
    - url: "https://www.findapostdoc.com/rss"
      name: "FindAPostDoc"
    - url: "https://academicpositions.com/rss/jobs"
      name: "AcademicPositions"

  filter_keywords:
    - computer vision
    - medical imaging
    - machine learning
    - artificial intelligence
    - deep learning
    - LLM
    - VLM
    - postdoc
    - research associate
    - fellowship

  exclude_keywords:
    - chemistry
    - economics
    - social science
    - humanities

  llm_score_threshold: 6
```

### 4.2 `config/supervisors.yaml`

```yaml
# Add target supervisor/lab homepages here.
# The system checks each URL daily for content changes.
# Format:
#   - name: "Prof. Name"
#     url: "https://lab-website.ac.uk/openings"
#     institution: "University Name"
#     notes: "Focus: cardiac imaging"

supervisors: []
```

### 4.3 `config/sources.yaml`

```yaml
# Toggle data sources on/off without code changes
arxiv:
  enabled: true
  max_papers_per_run: 500   # cap on initial RSS fetch

hacker_news:
  enabled: true

jobs:
  enabled: true

supervisor_monitoring:
  enabled: true

# OpenRouter model config
llm:
  scoring_model: "deepseek/deepseek-chat"       # cheap, fast, for bulk scoring
  summarization_model: "deepseek/deepseek-chat"  # Chinese summaries
  # Override with: "anthropic/claude-haiku-4-5" for higher quality
  base_url: "https://openrouter.ai/api/v1"

# GitHub Pages
pages:
  base_url: ""    # set to your GitHub Pages URL after repo creation
```

---

## 5. Data Layer — JSON Schema

### 5.1 `data/daily/YYYY-MM-DD.json`

```json
{
  "date": "2026-04-13",
  "generated_at": "2026-04-13T00:03:42Z",
  "papers": [
    {
      "id": "2604.12345",
      "title": "FoundationSeg: A Universal Medical Image Segmentation Model",
      "authors": ["Zhang Wei", "Li Ming"],
      "categories": ["cs.CV", "eess.IV"],
      "score": 8.5,
      "abstract_zh": "本文提出了一种通用医学图像分割基础模型...",
      "keywords_matched": ["medical imaging", "segmentation", "foundation model"],
      "url": "https://arxiv.org/abs/2604.12345",
      "pdf_url": "https://arxiv.org/pdf/2604.12345"
    }
  ],
  "hacker_news": [
    {
      "id": 43821045,
      "title": "Meta releases new open-source vision model",
      "score": 342,
      "url": "https://example.com",
      "summary_zh": "Meta开源了新的视觉模型...",
      "comments_url": "https://news.ycombinator.com/item?id=43821045"
    }
  ],
  "jobs": [
    {
      "title": "Research Associate in Medical Imaging AI",
      "institution": "Imperial College London",
      "deadline": "2026-05-15",
      "url": "https://jobs.ac.uk/job/ABC123",
      "requirements_zh": "需要CV/深度学习背景，熟悉医学图像分割...",
      "source": "jobs.ac.uk",
      "relevance_score": 9.2,
      "posted_date": "2026-04-12"
    }
  ],
  "supervisor_updates": [
    {
      "name": "Prof. John Smith",
      "institution": "Oxford",
      "url": "https://...",
      "change_summary_zh": "新增博士后职位，方向为眼底图像分析，截止日期6月1日"
    }
  ],
  "meta": {
    "papers_fetched": 287,
    "papers_after_keyword_filter": 43,
    "papers_after_llm_filter": 12,
    "jobs_fetched": 156,
    "jobs_after_filter": 4,
    "supervisor_pages_checked": 0,
    "supervisor_updates_found": 0,
    "llm_model": "deepseek/deepseek-chat",
    "cost_usd": 0.024,
    "duration_seconds": 147
  }
}
```

### 5.2 `data/weekly/YYYY-WNN.json` and `data/monthly/YYYY-MM.json`

Same schema extended with:
```json
{
  "period": "2026-W15",
  "summary_zh": "本周趋势综述...",
  "top_papers": [...],
  "trending_keywords": ["foundation model", "VLM", "segmentation"],
  "keyword_frequency": {"foundation model": 14, "VLM": 9, ...},
  "new_jobs": [...],
  "daily_refs": ["2026-04-07", "2026-04-08", "..."]
}
```

---

## 6. Data Flow (End-to-End)

```
00:00 UTC daily trigger
  │
  ├─► arxiv_collector.py
  │     Uses: arxiv Python library
  │     Fetch cs.CV + cs.AI + cs.LG + eess.IV (~200–500 papers)
  │     → Layer 1: must_include keyword filter → ~30–80 papers
  │     → scorer.py: OpenRouter LLM scores each 0–10 → ~10–20 papers
  │     → summarizer.py: Chinese abstract per paper
  │
  ├─► hn_collector.py
  │     Uses: HN Algolia Search API (free, no auth)
  │     GET https://hn.algolia.com/api/v1/search?query=AI&tags=story
  │     → min_score filter + keyword filter → ~5–15 stories
  │     → summarizer.py: one-line Chinese summary per story
  │
  ├─► jobs_collector.py
  │     Uses: feedparser (all Tier-1 RSS sources)
  │     → keyword filter (title + description) → ~2–10 jobs
  │     → scorer.py: LLM relevance score
  │     → summarizer.py: Chinese requirements summary
  │
  ├─► supervisor_watcher.py
  │     Uses: trafilatura (content extraction), hashlib (SHA256)
  │     For each URL in supervisors.yaml:
  │       fetch → extract text → hash → compare to supervisor_hashes.json
  │       if changed → summarizer.py extracts new position info
  │
  ▼
aggregator.py: merge all results into unified dict
  │
  ├─► data_publisher.py
  │     Write data/daily/YYYY-MM-DD.json
  │     git add + commit
  │
  └─► pages_publisher.py
        Render templates/daily.md.j2 → docs/daily/YYYY-MM-DD.md
        Regenerate docs/index.md (latest digest link)
        git add + commit + push
        → GitHub Pages deploys automatically (~2 min)
```

---

## 7. GitHub Actions Workflows

### `daily.yml`
```yaml
name: Daily Digest
on:
  schedule:
    - cron: '0 0 * * *'   # UTC 00:00 = UK winter midnight (GMT+0)
  workflow_dispatch:        # Manual trigger for testing

jobs:
  digest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0    # Need full history for data/ files
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      - run: pip install -r requirements.txt
      - run: python main.py --mode daily
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
      - name: Commit and push outputs
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/ docs/
          git diff --staged --quiet || git commit -m "digest: $(date -u +%Y-%m-%d)"
          git push
```

### `weekly.yml`
```yaml
name: Weekly Digest
on:
  schedule:
    - cron: '0 0 * * 1'   # Monday UTC midnight
  workflow_dispatch:

jobs:
  weekly:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      - run: pip install -r requirements.txt
      - run: python main.py --mode weekly
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
      - name: Commit and push weekly report
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/weekly/ docs/weekly/
          git diff --staged --quiet || git commit -m "weekly: $(date -u +%Y-W%V)"
          git push
```

### `monthly.yml` — same pattern, cron `'0 0 1 * *'`, mode `--mode monthly`

---

## 8. Claude Code Skill: `/daily-digest`

**File:** `skills/daily-digest.md`

```markdown
Read the JSON files under data/ in the research-daily-digest repo
and produce a Chinese-language analysis based on the user's request.

Subcommands:
  /daily-digest              → Today's full digest summary
  /daily-digest week         → This week's trend analysis across daily JSONs
  /daily-digest month        → Monthly highlights and direction shifts
  /daily-digest job          → Today's job updates only
  /daily-digest paper <kw>   → Search recent JSONs for papers matching keyword
  /daily-digest cost         → Show API cost breakdown from meta fields
```

The skill reads local `data/` files directly — no network required after the daily Actions run.

---

## 9. Python Dependencies

```
# requirements.txt
arxiv>=2.1.0               # Official arxiv API wrapper
feedparser>=6.0.11         # RSS parsing for jobs + HN fallback
trafilatura>=1.12.0        # Web content extraction for supervisor pages
openai>=1.30.0             # OpenRouter-compatible SDK (set base_url)
jinja2>=3.1.4              # Markdown template rendering
pyyaml>=6.0.2              # Config file parsing
httpx>=0.27.0              # Async HTTP for HN Algolia API
tenacity>=9.0.0            # Retry logic for flaky network calls
python-dateutil>=2.9.0     # Date arithmetic for weekly/monthly ranges
```

---

## 10. Cost Estimate

| Component | Volume/day | Model | Est. cost/day |
|-----------|-----------|-------|--------------|
| Paper scoring | ~40 papers × ~300 tokens | DeepSeek Chat | ~$0.008 |
| Paper summaries | ~12 papers × ~500 tokens | DeepSeek Chat | ~$0.010 |
| HN summaries | ~10 items × ~200 tokens | DeepSeek Chat | ~$0.003 |
| Job summaries | ~5 jobs × ~400 tokens | DeepSeek Chat | ~$0.005 |
| **Total daily** | | | **~$0.026/day** |
| **Monthly** | | | **~$0.78/month** |

Weekly/monthly rollup adds ~$0.05–0.10 per run (aggregation over many JSON files).

---

## 11. Differentiation vs Existing Projects

| Feature | Existing projects | This system |
|---------|------------------|-------------|
| Medical Imaging keyword filter | ❌ | ✅ YAML-configurable |
| Postdoc job aggregation | ❌ | ✅ Tier-1 RSS + supervisor watch |
| Supervisor homepage monitoring | ❌ | ✅ hash-diff via trafilatura |
| Config-file driven (no code changes) | Partial | ✅ All via YAML |
| Weekly + monthly rollups | agents-radar only | ✅ With trend analysis |
| Claude Code native /skill | ❌ | ✅ /daily-digest |
| Cost transparency per run | ❌ | ✅ meta.cost_usd field |
| UK timezone | ❌ (mostly CST) | ✅ UTC 00:00 |
| OpenRouter (any model) | ❌ | ✅ swap model in sources.yaml |

---

## 12. Out of Scope (MVP)

- Nature journal scraping (strong anti-scraping, no reliable RSS for sub-journals)
- LinkedIn job scraping (requires authenticated API or fragile scraper)
- PDF full-text analysis (abstract-only for now)
- Email/Telegram push notifications (GitHub Pages URL is the delivery mechanism)
- Real-time updates (once-daily batch is sufficient for research digests)

---

## 13. Future Extensions (Post-MVP)

- Add `eess.SP` (Signal Processing) category for broader biomedical signal coverage
- LinkedIn job integration via RapidAPI
- Telegram bot for push notifications on high-score papers (score ≥ 9)
- Per-supervisor email alerts when their page changes
- Vector embedding search across historical JSONs for deep trend queries

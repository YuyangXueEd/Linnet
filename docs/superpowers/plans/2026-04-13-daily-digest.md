# Research Daily Digest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated daily digest pipeline that fetches arxiv papers, HN stories, and postdoc jobs, scores/summarises them in Chinese via OpenRouter, publishes to GitHub Pages, and integrates with Claude Code via a skill and SessionStart hook.

**Architecture:** GitHub Actions runs a Python ETL pipeline at UTC 00:00 daily; raw data flows through keyword pre-filter → LLM scorer → Chinese summariser → dual output (structured JSON for Claude Code, Markdown for GitHub Pages). A Claude Code skill (`/daily-digest`) reads the JSON locally for interactive analysis; a SessionStart hook injects a compact digest into every new session automatically.

**Tech Stack:** Python 3.11, `arxiv`, `feedparser`, `trafilatura`, `openai` (OpenRouter), `jinja2`, `pyyaml`, `httpx`, `tenacity`, `python-dateutil`, `pytest`, Jekyll (GitHub Pages)

---

## File Map

```
research-daily-digest/
├── config/
│   ├── keywords.yaml            # arxiv/HN/jobs keyword config + LLM thresholds
│   ├── sources.yaml             # data source toggles, LLM model config
│   └── supervisors.yaml         # target supervisor URLs (starts empty)
├── collectors/
│   ├── __init__.py
│   ├── arxiv_collector.py       # arxiv lib fetch + keyword pre-filter
│   ├── hn_collector.py          # HN Algolia Search API via httpx
│   ├── jobs_collector.py        # feedparser on Tier-1 RSS sources
│   └── supervisor_watcher.py    # trafilatura fetch + SHA256 hash diff
├── pipeline/
│   ├── __init__.py
│   ├── scorer.py                # OpenRouter LLM relevance scoring (0–10)
│   ├── summarizer.py            # OpenRouter Chinese summary generation
│   └── aggregator.py           # weekly/monthly rollup from daily JSONs
├── publishers/
│   ├── __init__.py
│   ├── data_publisher.py        # writes data/daily/YYYY-MM-DD.json
│   └── pages_publisher.py       # renders Jinja2 templates → docs/daily/*.md
├── templates/
│   ├── daily.md.j2
│   ├── weekly.md.j2
│   └── monthly.md.j2
├── docs/                        # GitHub Pages root (Jekyll)
│   ├── _config.yml
│   └── index.md
├── data/
│   └── supervisor_hashes.json   # persisted hash store (starts as {})
├── skills/
│   └── daily-digest.md          # Claude Code /daily-digest skill
├── tests/
│   ├── conftest.py
│   ├── test_arxiv_collector.py
│   ├── test_hn_collector.py
│   ├── test_jobs_collector.py
│   ├── test_supervisor_watcher.py
│   ├── test_scorer.py
│   ├── test_summarizer.py
│   ├── test_aggregator.py
│   ├── test_data_publisher.py
│   └── test_pages_publisher.py
├── .github/workflows/
│   ├── daily.yml
│   ├── weekly.yml
│   └── monthly.yml
├── main.py                      # CLI entry point (--mode daily/weekly/monthly/--check-today)
└── requirements.txt
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `requirements.txt`
- Create: `config/keywords.yaml`
- Create: `config/sources.yaml`
- Create: `config/supervisors.yaml`
- Create: `data/supervisor_hashes.json`
- Create: `collectors/__init__.py`
- Create: `pipeline/__init__.py`
- Create: `publishers/__init__.py`
- Create: `tests/conftest.py`
- Create: `docs/_config.yml`
- Create: `docs/index.md`

- [ ] **Step 1: Create `requirements.txt`**

```
arxiv>=2.1.0
feedparser>=6.0.11
trafilatura>=1.12.0
openai>=1.30.0
jinja2>=3.1.4
pyyaml>=6.0.2
httpx>=0.27.0
tenacity>=9.0.0
python-dateutil>=2.9.0
pytest>=8.0.0
pytest-asyncio>=0.23.0
pytest-httpx>=0.30.0
```

- [ ] **Step 2: Create `config/keywords.yaml`**

```yaml
arxiv:
  categories:
    - cs.CV
    - cs.AI
    - cs.LG
    - eess.IV

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

- [ ] **Step 3: Create `config/sources.yaml`**

```yaml
arxiv:
  enabled: true
  max_papers_per_run: 500

hacker_news:
  enabled: true

jobs:
  enabled: true

supervisor_monitoring:
  enabled: true

llm:
  scoring_model: "deepseek/deepseek-chat"
  summarization_model: "deepseek/deepseek-chat"
  base_url: "https://openrouter.ai/api/v1"

pages:
  base_url: ""
```

- [ ] **Step 4: Create `config/supervisors.yaml`**

```yaml
# Add target supervisor/lab homepages here.
# Format:
#   - name: "Prof. Name"
#     url: "https://lab-website.ac.uk/openings"
#     institution: "University Name"
#     notes: "Focus: cardiac imaging"

supervisors: []
```

- [ ] **Step 5: Create `data/supervisor_hashes.json`**

```json
{}
```

- [ ] **Step 6: Create empty `__init__.py` files**

```bash
touch collectors/__init__.py pipeline/__init__.py publishers/__init__.py
```

- [ ] **Step 7: Create `tests/conftest.py`**

```python
import pytest
import yaml
from pathlib import Path


@pytest.fixture
def keywords_config():
    with open("config/keywords.yaml") as f:
        return yaml.safe_load(f)


@pytest.fixture
def sources_config():
    with open("config/sources.yaml") as f:
        return yaml.safe_load(f)


@pytest.fixture
def sample_paper():
    return {
        "id": "2604.12345",
        "title": "FoundationSeg: Universal Medical Image Segmentation",
        "authors": ["Zhang Wei", "Li Ming"],
        "categories": ["cs.CV", "eess.IV"],
        "abstract": "We propose a foundation model for medical image segmentation using diffusion-based pretraining on 1M CT and MRI scans.",
        "url": "https://arxiv.org/abs/2604.12345",
        "pdf_url": "https://arxiv.org/pdf/2604.12345",
    }


@pytest.fixture
def sample_hn_story():
    return {
        "objectID": "43821045",
        "title": "Meta releases new open-source vision model",
        "url": "https://example.com/meta-vision",
        "points": 342,
        "created_at": "2026-04-13T01:00:00.000Z",
    }


@pytest.fixture
def sample_job():
    return {
        "title": "Research Associate in Medical Imaging AI",
        "institution": "Imperial College London",
        "deadline": "2026-05-15",
        "url": "https://jobs.ac.uk/job/ABC123",
        "description": "We seek a postdoc with expertise in computer vision and medical image segmentation using deep learning.",
        "source": "jobs.ac.uk",
        "posted_date": "2026-04-12",
    }
```

- [ ] **Step 8: Create `docs/_config.yml`**

```yaml
title: "Research Daily Digest"
description: "Daily AI/CV/Medical Imaging research updates"
theme: minima
baseurl: ""
url: ""
permalink: /:categories/:year/:month/:day/:title/
```

- [ ] **Step 9: Create `docs/index.md`**

```markdown
---
layout: home
title: Research Daily Digest
---

Daily digest of AI, Computer Vision, Medical Imaging, and LLM research updates.
Updated automatically at UK midnight via GitHub Actions.

Browse: [Daily](/daily/) | [Weekly](/weekly/) | [Monthly](/monthly/)
```

- [ ] **Step 10: Install dependencies and verify**

```bash
pip install -r requirements.txt
python -c "import arxiv, feedparser, trafilatura, openai, jinja2, yaml, httpx, tenacity, dateutil; print('all imports ok')"
```

Expected output: `all imports ok`

- [ ] **Step 11: Commit scaffold**

```bash
git add .
git commit -m "feat: project scaffold, config files, dependencies"
```

---

## Task 2: Config Loader

**Files:**
- Create: `pipeline/config_loader.py`
- Test: `tests/test_config_loader.py`

- [ ] **Step 1: Write failing test**

```python
# tests/test_config_loader.py
import pytest
from pipeline.config_loader import load_keywords, load_sources, load_supervisors


def test_load_keywords_has_arxiv_categories():
    cfg = load_keywords()
    assert "cs.CV" in cfg["arxiv"]["categories"]
    assert "eess.IV" in cfg["arxiv"]["categories"]


def test_load_keywords_has_must_include():
    cfg = load_keywords()
    assert "medical imaging" in cfg["arxiv"]["must_include"]
    assert cfg["arxiv"]["llm_score_threshold"] == 6


def test_load_sources_has_llm_config():
    cfg = load_sources()
    assert cfg["llm"]["base_url"] == "https://openrouter.ai/api/v1"
    assert cfg["llm"]["scoring_model"] == "deepseek/deepseek-chat"


def test_load_supervisors_returns_list():
    supervisors = load_supervisors()
    assert isinstance(supervisors, list)
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_config_loader.py -v
```

Expected: `ImportError: No module named 'pipeline.config_loader'`

- [ ] **Step 3: Implement `pipeline/config_loader.py`**

```python
from pathlib import Path
import yaml

CONFIG_DIR = Path(__file__).parent.parent / "config"


def _load_yaml(filename: str) -> dict:
    with open(CONFIG_DIR / filename, encoding="utf-8") as f:
        return yaml.safe_load(f)


def load_keywords() -> dict:
    return _load_yaml("keywords.yaml")


def load_sources() -> dict:
    return _load_yaml("sources.yaml")


def load_supervisors() -> list:
    data = _load_yaml("supervisors.yaml")
    return data.get("supervisors", [])
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/test_config_loader.py -v
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add pipeline/config_loader.py tests/test_config_loader.py
git commit -m "feat: config loader for keywords, sources, supervisors"
```

---

## Task 3: arxiv Collector

**Files:**
- Create: `collectors/arxiv_collector.py`
- Test: `tests/test_arxiv_collector.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/test_arxiv_collector.py
import pytest
from collectors.arxiv_collector import keyword_match, fetch_papers


def test_keyword_match_positive():
    text = "A foundation model for medical image segmentation using MRI and CT scans"
    must_include = ["medical image", "MRI", "CT scan", "segmentation"]
    assert keyword_match(text, must_include) is True


def test_keyword_match_negative():
    text = "A graph neural network for protein folding prediction"
    must_include = ["medical image", "MRI", "CT scan", "segmentation"]
    assert keyword_match(text, must_include) is False


def test_keyword_match_case_insensitive():
    text = "MEDICAL IMAGING with Diffusion Models"
    must_include = ["medical imaging"]
    assert keyword_match(text, must_include) is True


def test_fetch_papers_returns_list(monkeypatch):
    """fetch_papers with zero max_results returns empty list without hitting network."""
    results = fetch_papers(categories=["cs.CV"], must_include=["medical"], max_results=0)
    assert isinstance(results, list)
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_arxiv_collector.py -v
```

Expected: `ImportError: No module named 'collectors.arxiv_collector'`

- [ ] **Step 3: Implement `collectors/arxiv_collector.py`**

```python
import arxiv
from typing import Any


def keyword_match(text: str, keywords: list[str]) -> bool:
    """Return True if text contains at least one keyword (case-insensitive)."""
    lower = text.lower()
    return any(kw.lower() in lower for kw in keywords)


def fetch_papers(
    categories: list[str],
    must_include: list[str],
    max_results: int = 500,
) -> list[dict[str, Any]]:
    """
    Fetch recent papers from arxiv for given categories,
    pre-filter by must_include keywords on title+abstract.
    Returns list of paper dicts ready for LLM scoring.
    """
    if max_results == 0:
        return []

    query = " OR ".join(f"cat:{cat}" for cat in categories)
    client = arxiv.Client()
    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.SubmittedDate,
    )

    papers = []
    for result in client.results(search):
        combined = f"{result.title} {result.summary}"
        if not keyword_match(combined, must_include):
            continue
        papers.append({
            "id": result.entry_id.split("/abs/")[-1],
            "title": result.title,
            "authors": [a.name for a in result.authors[:5]],
            "categories": [c for c in result.categories],
            "abstract": result.summary,
            "url": result.entry_id,
            "pdf_url": result.pdf_url,
        })

    return papers
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_arxiv_collector.py -v
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add collectors/arxiv_collector.py tests/test_arxiv_collector.py
git commit -m "feat: arxiv collector with keyword pre-filter"
```

---

## Task 4: Hacker News Collector

**Files:**
- Create: `collectors/hn_collector.py`
- Test: `tests/test_hn_collector.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/test_hn_collector.py
import pytest
import httpx
from collectors.hn_collector import filter_stories, parse_story


def test_filter_stories_by_score():
    stories = [
        {"points": 100, "title": "New AI model beats GPT-4", "url": "https://a.com", "objectID": "1", "created_at": "2026-04-13T01:00:00.000Z"},
        {"points": 10,  "title": "LLM benchmark released",   "url": "https://b.com", "objectID": "2", "created_at": "2026-04-13T02:00:00.000Z"},
    ]
    result = filter_stories(stories, min_score=50, keywords=["AI", "LLM"])
    assert len(result) == 1
    assert result[0]["objectID"] == "1"


def test_filter_stories_by_keyword():
    stories = [
        {"points": 200, "title": "Tax reforms proposed by government", "url": "https://c.com", "objectID": "3", "created_at": "2026-04-13T03:00:00.000Z"},
        {"points": 200, "title": "Open source LLM beats proprietary models", "url": "https://d.com", "objectID": "4", "created_at": "2026-04-13T04:00:00.000Z"},
    ]
    result = filter_stories(stories, min_score=50, keywords=["AI", "LLM", "machine learning"])
    assert len(result) == 1
    assert result[0]["objectID"] == "4"


def test_parse_story():
    raw = {
        "objectID": "43821045",
        "title": "Meta releases vision model",
        "url": "https://example.com",
        "points": 342,
        "created_at": "2026-04-13T01:00:00.000Z",
    }
    parsed = parse_story(raw)
    assert parsed["id"] == 43821045
    assert parsed["score"] == 342
    assert "comments_url" in parsed
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_hn_collector.py -v
```

Expected: `ImportError: No module named 'collectors.hn_collector'`

- [ ] **Step 3: Implement `collectors/hn_collector.py`**

```python
import httpx
from datetime import datetime, timedelta, timezone
from typing import Any


_ALGOLIA_URL = "https://hn.algolia.com/api/v1/search"
_HN_ITEM_URL = "https://news.ycombinator.com/item?id={}"


def filter_stories(
    stories: list[dict],
    min_score: int,
    keywords: list[str],
) -> list[dict]:
    """Keep stories that meet score threshold AND contain at least one keyword."""
    result = []
    for s in stories:
        if s.get("points", 0) < min_score:
            continue
        title = (s.get("title") or "").lower()
        if not any(kw.lower() in title for kw in keywords):
            continue
        result.append(s)
    return result


def parse_story(raw: dict) -> dict[str, Any]:
    return {
        "id": int(raw["objectID"]),
        "title": raw.get("title", ""),
        "url": raw.get("url", ""),
        "score": raw.get("points", 0),
        "created_at": raw.get("created_at", ""),
        "comments_url": _HN_ITEM_URL.format(raw["objectID"]),
        "summary_zh": "",  # filled by summarizer
    }


def fetch_stories(
    keywords: list[str],
    min_score: int,
    max_items: int,
    hours_back: int = 24,
) -> list[dict[str, Any]]:
    """Fetch top HN stories from Algolia API, filter by score and keywords."""
    cutoff = int((datetime.now(timezone.utc) - timedelta(hours=hours_back)).timestamp())
    seen_ids: set[str] = set()
    all_stories: list[dict] = []

    # Run parallel keyword queries to maximise coverage
    search_terms = ["AI", "LLM", "machine learning", "computer vision", "deep learning"]
    with httpx.Client(timeout=30) as client:
        for term in search_terms:
            resp = client.get(_ALGOLIA_URL, params={
                "query": term,
                "tags": "story",
                "numericFilters": f"created_at_i>{cutoff},points>{min_score}",
                "hitsPerPage": 50,
            })
            resp.raise_for_status()
            for hit in resp.json().get("hits", []):
                oid = hit.get("objectID")
                if oid and oid not in seen_ids:
                    seen_ids.add(oid)
                    all_stories.append(hit)

    filtered = filter_stories(all_stories, min_score=min_score, keywords=keywords)
    filtered.sort(key=lambda s: s.get("points", 0), reverse=True)
    return [parse_story(s) for s in filtered[:max_items]]
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_hn_collector.py -v
```

Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add collectors/hn_collector.py tests/test_hn_collector.py
git commit -m "feat: HN collector via Algolia API with keyword+score filter"
```

---

## Task 5: Jobs Collector

**Files:**
- Create: `collectors/jobs_collector.py`
- Test: `tests/test_jobs_collector.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/test_jobs_collector.py
import pytest
from collectors.jobs_collector import parse_feed_entry, filter_job


def test_filter_job_passes_relevant():
    job = {
        "title": "Postdoc in Medical Imaging AI",
        "description": "We seek candidates with expertise in deep learning for MRI segmentation.",
    }
    assert filter_job(
        job,
        include_keywords=["medical imaging", "deep learning", "postdoc"],
        exclude_keywords=["chemistry"],
    ) is True


def test_filter_job_blocks_excluded():
    job = {
        "title": "Research Associate in Computational Chemistry",
        "description": "Machine learning for drug discovery and molecular modelling.",
    }
    assert filter_job(
        job,
        include_keywords=["machine learning", "research associate"],
        exclude_keywords=["chemistry"],
    ) is False


def test_filter_job_blocks_irrelevant():
    job = {
        "title": "Lecturer in Economics",
        "description": "Teaching undergraduate economics and supervising postgraduates.",
    }
    assert filter_job(
        job,
        include_keywords=["computer vision", "LLM", "deep learning"],
        exclude_keywords=["economics"],
    ) is False


def test_parse_feed_entry_extracts_fields():
    entry = type("Entry", (), {
        "title": "Research Associate in AI",
        "link": "https://jobs.ac.uk/job/XYZ",
        "summary": "Deadline: 1 May 2026. Requires deep learning expertise.",
        "published": "Mon, 13 Apr 2026 09:00:00 +0000",
    })()
    job = parse_feed_entry(entry, source_name="jobs.ac.uk")
    assert job["title"] == "Research Associate in AI"
    assert job["url"] == "https://jobs.ac.uk/job/XYZ"
    assert job["source"] == "jobs.ac.uk"
    assert "description" in job
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_jobs_collector.py -v
```

Expected: `ImportError: No module named 'collectors.jobs_collector'`

- [ ] **Step 3: Implement `collectors/jobs_collector.py`**

```python
import feedparser
from typing import Any


def filter_job(
    job: dict,
    include_keywords: list[str],
    exclude_keywords: list[str],
) -> bool:
    """
    Return True if job text contains at least one include keyword
    AND zero exclude keywords.
    """
    text = f"{job.get('title', '')} {job.get('description', '')}".lower()
    if any(ex.lower() in text for ex in exclude_keywords):
        return False
    return any(inc.lower() in text for inc in include_keywords)


def parse_feed_entry(entry: Any, source_name: str) -> dict[str, Any]:
    return {
        "title": getattr(entry, "title", ""),
        "url": getattr(entry, "link", ""),
        "description": getattr(entry, "summary", ""),
        "posted_date": getattr(entry, "published", ""),
        "source": source_name,
        "deadline": "",       # extracted later by summarizer
        "requirements_zh": "",  # filled by summarizer
        "relevance_score": 0.0,
    }


def fetch_jobs(
    rss_sources: list[dict],
    filter_keywords: list[str],
    exclude_keywords: list[str],
) -> list[dict[str, Any]]:
    """Parse all RSS sources, filter for relevant jobs."""
    jobs = []
    for source in rss_sources:
        feed = feedparser.parse(source["url"])
        for entry in feed.entries:
            job = parse_feed_entry(entry, source_name=source["name"])
            if filter_job(job, filter_keywords, exclude_keywords):
                jobs.append(job)
    return jobs
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_jobs_collector.py -v
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add collectors/jobs_collector.py tests/test_jobs_collector.py
git commit -m "feat: jobs collector with RSS parsing and keyword filter"
```

---

## Task 6: Supervisor Watcher

**Files:**
- Create: `collectors/supervisor_watcher.py`
- Test: `tests/test_supervisor_watcher.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/test_supervisor_watcher.py
import json
import pytest
from collectors.supervisor_watcher import compute_hash, detect_changes, update_hashes


def test_compute_hash_is_deterministic():
    text = "Prof. Smith is hiring postdocs in medical imaging."
    assert compute_hash(text) == compute_hash(text)


def test_compute_hash_differs_for_different_text():
    h1 = compute_hash("We have an open postdoc position in CV.")
    h2 = compute_hash("No positions available at this time.")
    assert h1 != h2


def test_detect_changes_new_url(tmp_path):
    hashes_file = tmp_path / "supervisor_hashes.json"
    hashes_file.write_text("{}")
    changed = detect_changes(
        url="https://example.com/lab",
        current_text="We are hiring a postdoc in AI.",
        hashes_path=str(hashes_file),
    )
    assert changed is True


def test_detect_changes_same_content(tmp_path):
    text = "No current openings."
    h = compute_hash(text)
    hashes_file = tmp_path / "supervisor_hashes.json"
    hashes_file.write_text(json.dumps({"https://example.com/lab": h}))
    changed = detect_changes(
        url="https://example.com/lab",
        current_text=text,
        hashes_path=str(hashes_file),
    )
    assert changed is False


def test_update_hashes_persists(tmp_path):
    hashes_file = tmp_path / "supervisor_hashes.json"
    hashes_file.write_text("{}")
    update_hashes("https://example.com", "new content", str(hashes_file))
    stored = json.loads(hashes_file.read_text())
    assert "https://example.com" in stored
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_supervisor_watcher.py -v
```

Expected: `ImportError: No module named 'collectors.supervisor_watcher'`

- [ ] **Step 3: Implement `collectors/supervisor_watcher.py`**

```python
import hashlib
import json
from pathlib import Path
from typing import Any

import trafilatura


_DEFAULT_HASHES_PATH = str(Path(__file__).parent.parent / "data" / "supervisor_hashes.json")


def compute_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _load_hashes(path: str) -> dict:
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def detect_changes(url: str, current_text: str, hashes_path: str = _DEFAULT_HASHES_PATH) -> bool:
    """Return True if the page content has changed since last check."""
    hashes = _load_hashes(hashes_path)
    current_hash = compute_hash(current_text)
    return hashes.get(url) != current_hash


def update_hashes(url: str, current_text: str, hashes_path: str = _DEFAULT_HASHES_PATH) -> None:
    hashes = _load_hashes(hashes_path)
    hashes[url] = compute_hash(current_text)
    with open(hashes_path, "w", encoding="utf-8") as f:
        json.dump(hashes, f, indent=2)


def fetch_supervisor_updates(
    supervisors: list[dict],
    hashes_path: str = _DEFAULT_HASHES_PATH,
) -> list[dict[str, Any]]:
    """
    For each supervisor URL, fetch page text via trafilatura,
    compare hash, return list of changed entries.
    """
    updates = []
    for sup in supervisors:
        url = sup["url"]
        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            continue
        text = trafilatura.extract(downloaded) or ""
        if not text:
            continue
        if detect_changes(url, text, hashes_path):
            update_hashes(url, text, hashes_path)
            updates.append({
                "name": sup.get("name", ""),
                "institution": sup.get("institution", ""),
                "url": url,
                "page_text": text[:3000],  # cap for LLM context
                "change_summary_zh": "",    # filled by summarizer
            })
    return updates
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_supervisor_watcher.py -v
```

Expected: `5 passed`

- [ ] **Step 5: Commit**

```bash
git add collectors/supervisor_watcher.py tests/test_supervisor_watcher.py
git commit -m "feat: supervisor page watcher with SHA256 hash diff"
```

---

## Task 7: LLM Scorer

**Files:**
- Create: `pipeline/scorer.py`
- Test: `tests/test_scorer.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/test_scorer.py
import pytest
from unittest.mock import patch, MagicMock
from pipeline.scorer import build_paper_prompt, parse_score, score_papers


def test_build_paper_prompt_contains_title(sample_paper):
    prompt = build_paper_prompt(sample_paper)
    assert "FoundationSeg" in prompt
    assert "0-10" in prompt


def test_parse_score_extracts_integer():
    assert parse_score("Score: 8") == 8.0
    assert parse_score("I would rate this 7/10") == 7.0
    assert parse_score("9") == 9.0


def test_parse_score_clamps_to_range():
    assert parse_score("11") == 10.0
    assert parse_score("-1") == 0.0


def test_parse_score_returns_zero_on_garbage():
    assert parse_score("No numeric content here!") == 0.0


def test_score_papers_attaches_scores(sample_paper):
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content="Score: 8"))]
    )
    results = score_papers([sample_paper], client=mock_client, model="test-model", threshold=6)
    assert len(results) == 1
    assert results[0]["score"] == 8.0


def test_score_papers_filters_below_threshold(sample_paper):
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content="Score: 3"))]
    )
    results = score_papers([sample_paper], client=mock_client, model="test-model", threshold=6)
    assert len(results) == 0
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_scorer.py -v
```

Expected: `ImportError: No module named 'pipeline.scorer'`

- [ ] **Step 3: Implement `pipeline/scorer.py`**

```python
import re
from typing import Any
from tenacity import retry, stop_after_attempt, wait_exponential


def build_paper_prompt(paper: dict) -> str:
    return (
        "Rate this arxiv paper's relevance to the following research areas "
        "on a scale of 0-10: Computer Vision, Medical Imaging (MRI/CT/ultrasound/"
        "pathology/fundus), Large Language Models, Vision-Language Models, "
        "Diffusion Models, Foundation Models for vision.\n\n"
        f"Title: {paper['title']}\n"
        f"Abstract: {paper['abstract'][:800]}\n\n"
        "Reply with ONLY a single integer score 0-10. "
        "10=directly core to these fields, 0=completely unrelated."
    )


def build_job_prompt(job: dict) -> str:
    return (
        "Rate this academic job posting's relevance to a researcher specialising in "
        "Computer Vision, Medical Imaging, LLM, VLM on a scale of 0-10.\n\n"
        f"Title: {job['title']}\n"
        f"Description: {job.get('description', '')[:600]}\n\n"
        "Reply with ONLY a single integer score 0-10."
    )


def parse_score(text: str) -> float:
    numbers = re.findall(r"\d+(?:\.\d+)?", text)
    if not numbers:
        return 0.0
    score = float(numbers[0])
    return max(0.0, min(10.0, score))


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
def _call_llm(client: Any, model: str, prompt: str) -> str:
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=10,
        temperature=0,
    )
    return resp.choices[0].message.content


def score_papers(
    papers: list[dict],
    client: Any,
    model: str,
    threshold: float,
) -> list[dict]:
    scored = []
    for paper in papers:
        prompt = build_paper_prompt(paper)
        raw = _call_llm(client, model, prompt)
        paper["score"] = parse_score(raw)
        if paper["score"] >= threshold:
            scored.append(paper)
    return scored


def score_jobs(
    jobs: list[dict],
    client: Any,
    model: str,
    threshold: float,
) -> list[dict]:
    scored = []
    for job in jobs:
        prompt = build_job_prompt(job)
        raw = _call_llm(client, model, prompt)
        job["relevance_score"] = parse_score(raw)
        if job["relevance_score"] >= threshold:
            scored.append(job)
    return scored
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_scorer.py -v
```

Expected: `6 passed`

- [ ] **Step 5: Commit**

```bash
git add pipeline/scorer.py tests/test_scorer.py
git commit -m "feat: LLM scorer for papers and jobs via OpenRouter"
```

---

## Task 8: Chinese Summarizer

**Files:**
- Create: `pipeline/summarizer.py`
- Test: `tests/test_summarizer.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/test_summarizer.py
import pytest
from unittest.mock import MagicMock
from pipeline.summarizer import (
    summarize_paper, summarize_hn_story,
    summarize_job, summarize_supervisor_update,
)


def _mock_client(response_text: str) -> MagicMock:
    client = MagicMock()
    client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content=response_text))]
    )
    return client


def test_summarize_paper_returns_chinese(sample_paper):
    client = _mock_client("这是一篇关于医学图像分割的论文。")
    result = summarize_paper(sample_paper, client=client, model="test-model")
    assert result["abstract_zh"] == "这是一篇关于医学图像分割的论文。"


def test_summarize_hn_story_returns_chinese(sample_hn_story):
    client = _mock_client("Meta开源了新的视觉模型。")
    result = summarize_hn_story(sample_hn_story, client=client, model="test-model")
    assert result["summary_zh"] == "Meta开源了新的视觉模型。"


def test_summarize_job_extracts_fields(sample_job):
    client = _mock_client("截止日期：2026年5月15日。要求：深度学习，医学图像。")
    result = summarize_job(sample_job, client=client, model="test-model")
    assert "requirements_zh" in result
    assert len(result["requirements_zh"]) > 0


def test_summarize_supervisor_update():
    update = {
        "name": "Prof. Smith",
        "institution": "Oxford",
        "url": "https://smith.ox.ac.uk",
        "page_text": "We are hiring a postdoc in cardiac imaging. Deadline June 2026.",
        "change_summary_zh": "",
    }
    client = _mock_client("新增心脏影像方向博士后职位，截止2026年6月。")
    result = summarize_supervisor_update(update, client=client, model="test-model")
    assert result["change_summary_zh"] == "新增心脏影像方向博士后职位，截止2026年6月。"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_summarizer.py -v
```

Expected: `ImportError: No module named 'pipeline.summarizer'`

- [ ] **Step 3: Implement `pipeline/summarizer.py`**

```python
from typing import Any
from tenacity import retry, stop_after_attempt, wait_exponential


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
def _call(client: Any, model: str, prompt: str, max_tokens: int = 300) -> str:
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=0.3,
    )
    return resp.choices[0].message.content.strip()


def summarize_paper(paper: dict, client: Any, model: str) -> dict:
    prompt = (
        "用中文简洁总结以下论文的核心方法和贡献（2-3句话，不超过100字）：\n\n"
        f"标题：{paper['title']}\n摘要：{paper['abstract'][:1000]}"
    )
    paper["abstract_zh"] = _call(client, model, prompt)
    return paper


def summarize_hn_story(story: dict, client: Any, model: str) -> dict:
    prompt = (
        "用一句中文（不超过50字）总结这条科技新闻的核心内容：\n\n"
        f"标题：{story['title']}\n链接：{story.get('url', '')}"
    )
    story["summary_zh"] = _call(client, model, prompt, max_tokens=100)
    return story


def summarize_job(job: dict, client: Any, model: str) -> dict:
    prompt = (
        "从以下职位描述中，用中文提取：\n"
        "1. 截止日期（如有）\n2. 主要技术要求（不超过80字）\n\n"
        f"职位：{job['title']}\n机构：{job.get('institution','')}\n"
        f"描述：{job.get('description','')[:800]}"
    )
    job["requirements_zh"] = _call(client, model, prompt)
    return job


def summarize_supervisor_update(update: dict, client: Any, model: str) -> dict:
    prompt = (
        "以下是一位导师主页的最新内容，请用中文（不超过80字）总结是否有新的职位信息，"
        "包括方向、截止日期等关键信息：\n\n"
        f"导师：{update['name']}（{update['institution']}）\n"
        f"页面内容：{update['page_text'][:2000]}"
    )
    update["change_summary_zh"] = _call(client, model, prompt)
    return update
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_summarizer.py -v
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add pipeline/summarizer.py tests/test_summarizer.py
git commit -m "feat: Chinese summarizer for papers, HN, jobs, supervisor updates"
```

---

## Task 9: Data Publisher

**Files:**
- Create: `publishers/data_publisher.py`
- Test: `tests/test_data_publisher.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/test_data_publisher.py
import json
import pytest
from datetime import date
from pathlib import Path
from publishers.data_publisher import build_daily_payload, write_daily_json


def test_build_daily_payload_structure(sample_paper, sample_hn_story, sample_job):
    sample_paper["score"] = 8.5
    sample_paper["abstract_zh"] = "医学图像分割基础模型。"
    sample_paper["keywords_matched"] = ["medical imaging"]
    sample_hn_story["summary_zh"] = "Meta开源视觉模型。"
    sample_job["requirements_zh"] = "需要深度学习经验。"
    sample_job["relevance_score"] = 9.0

    payload = build_daily_payload(
        date_str="2026-04-13",
        papers=[sample_paper],
        hn_stories=[sample_hn_story],
        jobs=[sample_job],
        supervisor_updates=[],
        meta={"papers_fetched": 100, "cost_usd": 0.02},
    )
    assert payload["date"] == "2026-04-13"
    assert len(payload["papers"]) == 1
    assert len(payload["hacker_news"]) == 1
    assert len(payload["jobs"]) == 1
    assert payload["meta"]["papers_fetched"] == 100


def test_write_daily_json_creates_file(tmp_path, sample_paper, sample_hn_story, sample_job):
    sample_paper.update({"score": 8.5, "abstract_zh": "test", "keywords_matched": []})
    sample_hn_story.update({"summary_zh": "test"})
    sample_job.update({"requirements_zh": "test", "relevance_score": 8.0})

    payload = build_daily_payload("2026-04-13", [sample_paper], [sample_hn_story], [sample_job], [], {})
    out_path = write_daily_json(payload, base_dir=str(tmp_path))

    assert Path(out_path).exists()
    with open(out_path) as f:
        data = json.load(f)
    assert data["date"] == "2026-04-13"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_data_publisher.py -v
```

Expected: `ImportError: No module named 'publishers.data_publisher'`

- [ ] **Step 3: Implement `publishers/data_publisher.py`**

```python
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_DEFAULT_DATA_DIR = str(Path(__file__).parent.parent / "data" / "daily")


def build_daily_payload(
    date_str: str,
    papers: list[dict],
    hn_stories: list[dict],
    jobs: list[dict],
    supervisor_updates: list[dict],
    meta: dict,
) -> dict[str, Any]:
    return {
        "date": date_str,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "papers": papers,
        "hacker_news": hn_stories,
        "jobs": jobs,
        "supervisor_updates": supervisor_updates,
        "meta": meta,
    }


def write_daily_json(payload: dict, base_dir: str = _DEFAULT_DATA_DIR) -> str:
    os.makedirs(base_dir, exist_ok=True)
    out_path = os.path.join(base_dir, f"{payload['date']}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return out_path


def write_weekly_json(payload: dict) -> str:
    base_dir = str(Path(__file__).parent.parent / "data" / "weekly")
    os.makedirs(base_dir, exist_ok=True)
    out_path = os.path.join(base_dir, f"{payload['period']}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return out_path


def write_monthly_json(payload: dict) -> str:
    base_dir = str(Path(__file__).parent.parent / "data" / "monthly")
    os.makedirs(base_dir, exist_ok=True)
    out_path = os.path.join(base_dir, f"{payload['period']}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return out_path
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_data_publisher.py -v
```

Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add publishers/data_publisher.py tests/test_data_publisher.py
git commit -m "feat: JSON data publisher for daily/weekly/monthly output"
```

---

## Task 10: Jinja2 Templates + Pages Publisher

**Files:**
- Create: `templates/daily.md.j2`
- Create: `templates/weekly.md.j2`
- Create: `templates/monthly.md.j2`
- Create: `publishers/pages_publisher.py`
- Test: `tests/test_pages_publisher.py`

- [ ] **Step 1: Create `templates/daily.md.j2`**

```jinja2
---
layout: default
title: "{{ date }} 科研日报"
date: {{ date }}
---

# {{ date }} 科研日报

> 自动生成于 {{ generated_at[:10] }} | 模型：{{ meta.llm_model }} | 本次花费：${{ "%.4f"|format(meta.cost_usd) }}

---

## 📄 今日 arXiv 精选（{{ papers|length }} 篇）

{% if papers %}
| 评分 | 论文 | 方向 |
|------|------|------|
{% for p in papers | sort(attribute='score', reverse=True) %}
| {{ "%.1f"|format(p.score) }} | [{{ p.title }}]({{ p.url }}) | {{ p.categories[0] }} |
{% endfor %}

{% for p in papers | sort(attribute='score', reverse=True) %}
### {{ loop.index }}. [{{ p.title }}]({{ p.url }})

**作者：** {{ p.authors | join(', ') }} | **分类：** {{ p.categories | join(', ') }} | **评分：** {{ "%.1f"|format(p.score) }}/10

{{ p.abstract_zh }}

---
{% endfor %}
{% else %}
*今日无符合条件的论文。*
{% endif %}

## 🔥 Hacker News 科技热点（{{ hacker_news|length }} 条）

{% if hacker_news %}
{% for s in hacker_news %}
- **[{{ s.title }}]({{ s.url }})** ({{ s.score }}pts) — {{ s.summary_zh }} [[评论]({{ s.comments_url }})]
{% endfor %}
{% else %}
*今日无符合条件的热点。*
{% endif %}

## 💼 最新博士后 / 研究职位（{{ jobs|length }} 个）

{% if jobs %}
{% for j in jobs %}
### [{{ j.title }}]({{ j.url }})

**机构：** {{ j.institution or '未知' }} | **来源：** {{ j.source }} | **截止：** {{ j.deadline or '未注明' }} | **相关度：** {{ "%.1f"|format(j.relevance_score) }}/10

{{ j.requirements_zh }}

---
{% endfor %}
{% else %}
*今日无新职位更新。*
{% endif %}

{% if supervisor_updates %}
## 👨‍🏫 导师主页更新

{% for u in supervisor_updates %}
- **{{ u.name }}**（{{ u.institution }}）— {{ u.change_summary_zh }} [[主页]({{ u.url }})]
{% endfor %}
{% endif %}

---
*[返回首页](/) | [周报](/weekly/) | [月报](/monthly/)*
```

- [ ] **Step 2: Create `templates/weekly.md.j2`**

```jinja2
---
layout: default
title: "{{ period }} 周报"
---

# {{ period }} 周报

> 覆盖 {{ daily_refs[0] }} 至 {{ daily_refs[-1] }}，共 {{ daily_refs|length }} 天

---

## 📊 本周总览

- **论文总数：** {{ top_papers|length }} 篇精选
- **职位更新：** {{ new_jobs|length }} 个
- **高频关键词：** {{ trending_keywords[:5] | join('、') }}

---

## 🏆 本周最佳论文

{% for p in top_papers[:10] %}
{{ loop.index }}. **[{{ p.title }}]({{ p.url }})** ({{ "%.1f"|format(p.score) }}/10) — {{ p.abstract_zh }}
{% endfor %}

---

## 📈 本周趋势分析

{{ summary_zh }}

---

## 💼 本周职位汇总

{% for j in new_jobs %}
- **[{{ j.title }}]({{ j.url }})** — {{ j.institution or '' }} | 截止：{{ j.deadline or '未注明' }}
{% endfor %}

---
*[返回首页](/) | [日报](/daily/) | [月报](/monthly/)*
```

- [ ] **Step 3: Create `templates/monthly.md.j2`**

```jinja2
---
layout: default
title: "{{ period }} 月报"
---

# {{ period }} 月报

> 覆盖 {{ daily_refs|length }} 天的科研动态

---

## 📊 本月总览

{{ summary_zh }}

---

## 🏆 本月最高分论文 Top 20

{% for p in top_papers[:20] %}
{{ loop.index }}. **[{{ p.title }}]({{ p.url }})** ({{ "%.1f"|format(p.score) }}/10) — {{ p.abstract_zh }}
{% endfor %}

---

## 📈 关键词热度（Top 10）

{% for kw, count in keyword_frequency.items() | list | sort(attribute=1, reverse=True) | list[:10] %}
- **{{ kw }}**: {{ count }} 次
{% endfor %}

---

## 💼 本月职位汇总（{{ new_jobs|length }} 个）

{% for j in new_jobs %}
- **[{{ j.title }}]({{ j.url }})** — {{ j.institution or '' }}
{% endfor %}

---
*[返回首页](/) | [日报](/daily/) | [周报](/weekly/)*
```

- [ ] **Step 4: Write failing test for pages publisher**

```python
# tests/test_pages_publisher.py
import pytest
from pathlib import Path
from publishers.pages_publisher import render_daily_page, render_weekly_page


def test_render_daily_page_contains_date(tmp_path):
    payload = {
        "date": "2026-04-13",
        "generated_at": "2026-04-13T00:03:00Z",
        "papers": [],
        "hacker_news": [],
        "jobs": [],
        "supervisor_updates": [],
        "meta": {"llm_model": "deepseek", "cost_usd": 0.02},
    }
    out_path = render_daily_page(payload, docs_dir=str(tmp_path))
    content = Path(out_path).read_text(encoding="utf-8")
    assert "2026-04-13" in content
    assert "科研日报" in content


def test_render_daily_page_shows_paper(tmp_path, sample_paper):
    sample_paper.update({"score": 8.5, "abstract_zh": "医学分割测试。", "keywords_matched": []})
    payload = {
        "date": "2026-04-13",
        "generated_at": "2026-04-13T00:03:00Z",
        "papers": [sample_paper],
        "hacker_news": [],
        "jobs": [],
        "supervisor_updates": [],
        "meta": {"llm_model": "deepseek", "cost_usd": 0.02},
    }
    out_path = render_daily_page(payload, docs_dir=str(tmp_path))
    content = Path(out_path).read_text(encoding="utf-8")
    assert "FoundationSeg" in content
    assert "医学分割测试" in content
```

- [ ] **Step 5: Run test to verify it fails**

```bash
pytest tests/test_pages_publisher.py -v
```

Expected: `ImportError: No module named 'publishers.pages_publisher'`

- [ ] **Step 6: Implement `publishers/pages_publisher.py`**

```python
import os
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

_TEMPLATES_DIR = str(Path(__file__).parent.parent / "templates")
_DEFAULT_DOCS_DIR = str(Path(__file__).parent.parent / "docs")

_env = Environment(loader=FileSystemLoader(_TEMPLATES_DIR))


def render_daily_page(payload: dict, docs_dir: str = _DEFAULT_DOCS_DIR) -> str:
    out_dir = os.path.join(docs_dir, "daily")
    os.makedirs(out_dir, exist_ok=True)
    template = _env.get_template("daily.md.j2")
    content = template.render(**payload)
    out_path = os.path.join(out_dir, f"{payload['date']}.md")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(content)
    _regenerate_index(docs_dir, payload["date"], "daily")
    return out_path


def render_weekly_page(payload: dict, docs_dir: str = _DEFAULT_DOCS_DIR) -> str:
    out_dir = os.path.join(docs_dir, "weekly")
    os.makedirs(out_dir, exist_ok=True)
    template = _env.get_template("weekly.md.j2")
    content = template.render(**payload)
    out_path = os.path.join(out_dir, f"{payload['period']}.md")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(content)
    return out_path


def render_monthly_page(payload: dict, docs_dir: str = _DEFAULT_DOCS_DIR) -> str:
    out_dir = os.path.join(docs_dir, "monthly")
    os.makedirs(out_dir, exist_ok=True)
    template = _env.get_template("monthly.md.j2")
    content = template.render(**payload)
    out_path = os.path.join(out_dir, f"{payload['period']}.md")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(content)
    return out_path


def _regenerate_index(docs_dir: str, latest_date: str, report_type: str) -> None:
    index_path = os.path.join(docs_dir, "index.md")
    content = f"""---
layout: home
title: Research Daily Digest
---

# Research Daily Digest

Daily AI/CV/Medical Imaging research updates, auto-generated at UK midnight.

**Latest:** [{latest_date} 日报](/daily/{latest_date}/)

Browse: [Daily](/daily/) | [Weekly](/weekly/) | [Monthly](/monthly/)
"""
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(content)
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
pytest tests/test_pages_publisher.py -v
```

Expected: `2 passed`

- [ ] **Step 8: Commit**

```bash
git add templates/ publishers/pages_publisher.py tests/test_pages_publisher.py
git commit -m "feat: Jinja2 templates and pages publisher for GitHub Pages"
```

---

## Task 11: Aggregator (Weekly + Monthly Rollups)

**Files:**
- Create: `pipeline/aggregator.py`
- Test: `tests/test_aggregator.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/test_aggregator.py
import json
import pytest
from pathlib import Path
from pipeline.aggregator import load_daily_jsons, compute_keyword_frequency, build_weekly_payload


def make_daily_json(tmp_path, date_str, papers, jobs):
    d = tmp_path / "data" / "daily"
    d.mkdir(parents=True, exist_ok=True)
    payload = {
        "date": date_str,
        "generated_at": f"{date_str}T00:03:00Z",
        "papers": papers,
        "hacker_news": [],
        "jobs": jobs,
        "supervisor_updates": [],
        "meta": {"cost_usd": 0.02, "llm_model": "deepseek"},
    }
    (d / f"{date_str}.json").write_text(json.dumps(payload))
    return payload


def test_load_daily_jsons(tmp_path):
    make_daily_json(tmp_path, "2026-04-07", [], [])
    make_daily_json(tmp_path, "2026-04-08", [], [])
    results = load_daily_jsons(["2026-04-07", "2026-04-08"], data_dir=str(tmp_path / "data" / "daily"))
    assert len(results) == 2


def test_compute_keyword_frequency():
    papers = [
        {"keywords_matched": ["foundation model", "segmentation"]},
        {"keywords_matched": ["foundation model", "MRI"]},
        {"keywords_matched": ["segmentation"]},
    ]
    freq = compute_keyword_frequency(papers)
    assert freq["foundation model"] == 2
    assert freq["segmentation"] == 2
    assert freq["MRI"] == 1


def test_build_weekly_payload(tmp_path):
    p = {"id": "1", "title": "Test", "score": 9.0, "abstract_zh": "test",
         "authors": [], "categories": ["cs.CV"], "url": "", "pdf_url": "",
         "keywords_matched": ["medical imaging"]}
    j = {"title": "Postdoc AI", "institution": "Oxford", "deadline": "",
         "url": "", "requirements_zh": "", "source": "", "relevance_score": 8.0,
         "posted_date": ""}
    make_daily_json(tmp_path, "2026-04-07", [p], [j])
    dates = ["2026-04-07"]
    payload = build_weekly_payload(
        dates=dates,
        period="2026-W15",
        summary_zh="本周趋势分析。",
        data_dir=str(tmp_path / "data" / "daily"),
    )
    assert payload["period"] == "2026-W15"
    assert len(payload["top_papers"]) == 1
    assert len(payload["new_jobs"]) == 1
    assert payload["trending_keywords"][0] == "medical imaging"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_aggregator.py -v
```

Expected: `ImportError: No module named 'pipeline.aggregator'`

- [ ] **Step 3: Implement `pipeline/aggregator.py`**

```python
import json
import os
from collections import Counter
from pathlib import Path
from typing import Any

_DEFAULT_DATA_DIR = str(Path(__file__).parent.parent / "data" / "daily")


def load_daily_jsons(dates: list[str], data_dir: str = _DEFAULT_DATA_DIR) -> list[dict]:
    payloads = []
    for date_str in dates:
        path = os.path.join(data_dir, f"{date_str}.json")
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                payloads.append(json.load(f))
    return payloads


def compute_keyword_frequency(papers: list[dict]) -> dict[str, int]:
    counter: Counter = Counter()
    for p in papers:
        for kw in p.get("keywords_matched", []):
            counter[kw] += 1
    return dict(counter.most_common())


def build_weekly_payload(
    dates: list[str],
    period: str,
    summary_zh: str,
    data_dir: str = _DEFAULT_DATA_DIR,
) -> dict[str, Any]:
    dailies = load_daily_jsons(dates, data_dir)
    all_papers = [p for d in dailies for p in d.get("papers", [])]
    all_jobs = [j for d in dailies for j in d.get("jobs", [])]
    freq = compute_keyword_frequency(all_papers)
    top_papers = sorted(all_papers, key=lambda p: p.get("score", 0), reverse=True)

    return {
        "period": period,
        "summary_zh": summary_zh,
        "top_papers": top_papers,
        "new_jobs": all_jobs,
        "trending_keywords": list(freq.keys())[:10],
        "keyword_frequency": freq,
        "daily_refs": dates,
    }


def build_monthly_payload(
    dates: list[str],
    period: str,
    summary_zh: str,
    data_dir: str = _DEFAULT_DATA_DIR,
) -> dict[str, Any]:
    payload = build_weekly_payload(dates, period, summary_zh, data_dir)
    return payload  # same structure, more dates
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_aggregator.py -v
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add pipeline/aggregator.py tests/test_aggregator.py
git commit -m "feat: aggregator for weekly and monthly rollup payloads"
```

---

## Task 12: `main.py` CLI Entry Point

**Files:**
- Create: `main.py`

- [ ] **Step 1: Create `main.py`**

```python
#!/usr/bin/env python3
"""
main.py — CLI entry point for Research Daily Digest pipeline.

Usage:
    python main.py --mode daily       # full daily pipeline
    python main.py --mode weekly      # weekly rollup
    python main.py --mode monthly     # monthly rollup
    python main.py --check-today      # compact summary for SessionStart hook
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from openai import OpenAI

from collectors.arxiv_collector import fetch_papers
from collectors.hn_collector import fetch_stories
from collectors.jobs_collector import fetch_jobs
from collectors.supervisor_watcher import fetch_supervisor_updates
from pipeline.config_loader import load_keywords, load_sources, load_supervisors
from pipeline.scorer import score_papers, score_jobs
from pipeline.summarizer import (
    summarize_paper, summarize_hn_story,
    summarize_job, summarize_supervisor_update,
)
from pipeline.aggregator import build_weekly_payload, build_monthly_payload
from publishers.data_publisher import (
    write_daily_json, write_weekly_json, write_monthly_json, build_daily_payload,
)
from publishers.pages_publisher import (
    render_daily_page, render_weekly_page, render_monthly_page,
)


def get_openrouter_client(sources_cfg: dict) -> OpenAI:
    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    if not api_key:
        print("WARNING: OPENROUTER_API_KEY not set", file=sys.stderr)
    return OpenAI(api_key=api_key, base_url=sources_cfg["llm"]["base_url"])


def run_daily(kw: dict, sources: dict, supervisors: list) -> None:
    start = time.time()
    client = get_openrouter_client(sources)
    scoring_model = sources["llm"]["scoring_model"]
    summary_model = sources["llm"]["summarization_model"]

    # --- arxiv ---
    print("Fetching arxiv papers...")
    raw_papers = fetch_papers(
        categories=kw["arxiv"]["categories"],
        must_include=kw["arxiv"]["must_include"],
        max_results=sources["arxiv"].get("max_papers_per_run", 500),
    )
    print(f"  After keyword filter: {len(raw_papers)}")
    scored_papers = score_papers(raw_papers, client, scoring_model, kw["arxiv"]["llm_score_threshold"])
    print(f"  After LLM filter: {len(scored_papers)}")
    papers = [summarize_paper(p, client, summary_model) for p in scored_papers]

    # --- HN ---
    print("Fetching Hacker News...")
    hn_stories = []
    if sources["hacker_news"]["enabled"]:
        raw_hn = fetch_stories(
            keywords=kw["hacker_news"]["keywords"],
            min_score=kw["hacker_news"]["min_score"],
            max_items=kw["hacker_news"]["max_items"],
        )
        hn_stories = [summarize_hn_story(s, client, summary_model) for s in raw_hn]
    print(f"  HN stories: {len(hn_stories)}")

    # --- Jobs ---
    print("Fetching jobs...")
    jobs = []
    if sources["jobs"]["enabled"]:
        raw_jobs = fetch_jobs(
            rss_sources=kw["jobs"]["rss_sources"],
            filter_keywords=kw["jobs"]["filter_keywords"],
            exclude_keywords=kw["jobs"]["exclude_keywords"],
        )
        scored_jobs = score_jobs(raw_jobs, client, scoring_model, kw["jobs"]["llm_score_threshold"])
        jobs = [summarize_job(j, client, summary_model) for j in scored_jobs]
    print(f"  Jobs: {len(jobs)}")

    # --- Supervisors ---
    supervisor_updates = []
    if sources["supervisor_monitoring"]["enabled"] and supervisors:
        print(f"Checking {len(supervisors)} supervisor pages...")
        raw_updates = fetch_supervisor_updates(supervisors)
        supervisor_updates = [summarize_supervisor_update(u, client, summary_model) for u in raw_updates]

    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    meta = {
        "papers_fetched": sources["arxiv"].get("max_papers_per_run", 500),
        "papers_after_keyword_filter": len(raw_papers),
        "papers_after_llm_filter": len(scored_papers),
        "jobs_fetched": 0,
        "jobs_after_filter": len(jobs),
        "supervisor_pages_checked": len(supervisors),
        "supervisor_updates_found": len(supervisor_updates),
        "llm_model": scoring_model,
        "cost_usd": 0.0,  # approximate via token counting if needed
        "duration_seconds": round(time.time() - start),
    }

    payload = build_daily_payload(date_str, papers, hn_stories, jobs, supervisor_updates, meta)
    json_path = write_daily_json(payload)
    md_path = render_daily_page(payload)
    print(f"Written: {json_path}")
    print(f"Written: {md_path}")


def run_weekly() -> None:
    today = datetime.now(timezone.utc)
    dates = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7, 0, -1)]
    from isoweek import Week
    period = today.strftime("%Y-W%V")

    kw = load_keywords()
    sources = load_sources()
    client = get_openrouter_client(sources)

    # Aggregate
    data_dir = str(Path(__file__).parent / "data" / "daily")
    payloads_raw = []
    from pipeline.aggregator import load_daily_jsons, compute_keyword_frequency
    dailies = load_daily_jsons(dates, data_dir)
    all_papers = [p for d in dailies for p in d.get("papers", [])]

    prompt = (
        f"请用中文（300字以内）总结以下{len(all_papers)}篇论文本周的整体趋势，"
        "包括热门方向、值得关注的进展、以及任何显著变化：\n\n"
        + "\n".join(f"- {p['title']}: {p.get('abstract_zh','')}" for p in all_papers[:30])
    )
    from openai import OpenAI
    resp = client.chat.completions.create(
        model=sources["llm"]["summarization_model"],
        messages=[{"role": "user", "content": prompt}],
        max_tokens=600,
    )
    summary_zh = resp.choices[0].message.content.strip()

    payload = build_weekly_payload(dates, period, summary_zh, data_dir)
    json_path = write_weekly_json(payload)
    md_path = render_weekly_page(payload)
    print(f"Written: {json_path}")
    print(f"Written: {md_path}")


def run_monthly() -> None:
    today = datetime.now(timezone.utc)
    dates = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(30, 0, -1)]
    period = today.strftime("%Y-%m")

    sources = load_sources()
    client = get_openrouter_client(sources)
    data_dir = str(Path(__file__).parent / "data" / "daily")

    from pipeline.aggregator import load_daily_jsons
    dailies = load_daily_jsons(dates, data_dir)
    all_papers = [p for d in dailies for p in d.get("papers", [])]

    prompt = (
        f"请用中文（500字以内）总结过去30天共{len(all_papers)}篇论文的月度趋势，"
        "包括方向热度变化、值得关注的团队、以及下月值得关注的趋势：\n\n"
        + "\n".join(f"- {p['title']}: {p.get('abstract_zh','')}" for p in all_papers[:50])
    )
    resp = client.chat.completions.create(
        model=sources["llm"]["summarization_model"],
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
    )
    summary_zh = resp.choices[0].message.content.strip()

    payload = build_monthly_payload(dates, period, summary_zh, data_dir)
    json_path = write_monthly_json(payload)
    md_path = render_monthly_page(payload)
    print(f"Written: {json_path}")
    print(f"Written: {md_path}")


def check_today() -> None:
    """Print compact summary for Claude Code SessionStart hook."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")

    data_dir = Path(__file__).parent / "data" / "daily"
    for date_str in [today, yesterday]:
        path = data_dir / f"{date_str}.json"
        if path.exists():
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            label = "" if date_str == today else " [yesterday]"
            papers = data.get("papers", [])
            jobs = data.get("jobs", [])
            hn = data.get("hacker_news", [])
            sup = data.get("supervisor_updates", [])
            top_paper = papers[0]["title"][:50] + "..." if papers else "none"
            top_hn = hn[0]["title"][:50] + "..." if hn else "none"
            print(f"[Daily Digest {date_str}{label}]")
            print(f"📄 Papers: {len(papers)} new (top: {top_paper})")
            print(f"💼 Jobs: {len(jobs)} new")
            print(f"🔥 HN: {top_hn}")
            print(f"⚠️  Supervisor updates: {len(sup)}")
            print("Run /daily-digest for full report.")
            return
    print("[Daily Digest] No data found yet. Run: python main.py --mode daily")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Research Daily Digest")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--mode", choices=["daily", "weekly", "monthly"])
    group.add_argument("--check-today", action="store_true")
    args = parser.parse_args()

    if args.check_today:
        check_today()
    else:
        kw = load_keywords()
        sources = load_sources()
        supervisors = load_supervisors()
        if args.mode == "daily":
            run_daily(kw, sources, supervisors)
        elif args.mode == "weekly":
            run_weekly()
        elif args.mode == "monthly":
            run_monthly()
```

- [ ] **Step 2: Test check-today locally (no API key needed)**

```bash
python main.py --check-today
```

Expected output (no JSON yet):
```
[Daily Digest] No data found yet. Run: python main.py --mode daily
```

- [ ] **Step 3: Run full test suite**

```bash
pytest tests/ -v
```

Expected: All tests pass. Fix any import issues.

- [ ] **Step 4: Commit**

```bash
git add main.py
git commit -m "feat: main.py CLI entry point (daily/weekly/monthly/--check-today)"
```

---

## Task 13: GitHub Actions Workflows

**Files:**
- Create: `.github/workflows/daily.yml`
- Create: `.github/workflows/weekly.yml`
- Create: `.github/workflows/monthly.yml`

- [ ] **Step 1: Create `.github/workflows/daily.yml`**

```yaml
name: Daily Digest

on:
  schedule:
    - cron: '0 0 * * *'   # UTC 00:00 = UK winter midnight
  workflow_dispatch:        # manual trigger for testing

jobs:
  digest:
    runs-on: ubuntu-latest
    permissions:
      contents: write       # needed to git push
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run daily pipeline
        run: python main.py --mode daily
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

- [ ] **Step 2: Create `.github/workflows/weekly.yml`**

```yaml
name: Weekly Digest

on:
  schedule:
    - cron: '0 0 * * 1'   # Monday UTC midnight
  workflow_dispatch:

jobs:
  weekly:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run weekly rollup
        run: python main.py --mode weekly
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

- [ ] **Step 3: Create `.github/workflows/monthly.yml`**

```yaml
name: Monthly Digest

on:
  schedule:
    - cron: '0 0 1 * *'   # 1st of month UTC midnight
  workflow_dispatch:

jobs:
  monthly:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run monthly rollup
        run: python main.py --mode monthly
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}

      - name: Commit and push monthly report
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/monthly/ docs/monthly/
          git diff --staged --quiet || git commit -m "monthly: $(date -u +%Y-%m)"
          git push
```

- [ ] **Step 4: Commit workflows**

```bash
git add .github/
git commit -m "feat: GitHub Actions daily/weekly/monthly cron workflows"
```

---

## Task 14: Claude Code Skill + SessionStart Hook

**Files:**
- Create: `skills/daily-digest.md`
- Modify: `~/.claude/settings.json` (Claude Code settings)

- [ ] **Step 1: Create `skills/daily-digest.md`**

```markdown
Read the JSON files under `data/` in D:/Workspace/DailyUpdate and produce
a Chinese-language analysis based on the user's request.

## Subcommands

- `/daily-digest` — Today's full digest: top papers, HN stories, new jobs
- `/daily-digest week` — Trend analysis across this week's daily JSONs
- `/daily-digest month` — Monthly highlights and direction shifts
- `/daily-digest job` — Today's job and supervisor updates only
- `/daily-digest paper <keyword>` — Search recent JSONs for papers matching keyword
- `/daily-digest cost` — Show API cost breakdown from meta fields across last 7 days

## Instructions

1. Read the relevant JSON file(s) from `D:/Workspace/DailyUpdate/data/`
2. Parse the structured data (papers, hacker_news, jobs, supervisor_updates, meta)
3. Produce a well-structured Chinese response with emoji section headers
4. For trend queries (week/month), compute keyword frequencies and surface notable patterns
5. Always mention the `meta.cost_usd` total at the end of weekly/monthly queries
```

- [ ] **Step 2: Register skill with Claude Code**

```bash
mkdir -p ~/.claude/skills
cp skills/daily-digest.md ~/.claude/skills/daily-digest.md
```

- [ ] **Step 3: Add SessionStart hook to Claude Code settings**

Open `~/.claude/settings.json` (create if not exists) and add:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python D:/Workspace/DailyUpdate/main.py --check-today"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 4: Test the hook manually**

```bash
python D:/Workspace/DailyUpdate/main.py --check-today
```

Expected (before first daily run):
```
[Daily Digest] No data found yet. Run: python main.py --mode daily
```

- [ ] **Step 5: Commit skill file**

```bash
git add skills/
git commit -m "feat: Claude Code /daily-digest skill and SessionStart hook"
```

---

## Task 15: GitHub Repo Setup + First Manual Run

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

```markdown
# Research Daily Digest

Automated daily digest of AI/CS/CV/Medical Imaging research + postdoc jobs.

**Updates daily at UK midnight via GitHub Actions.**

## What it tracks

- 📄 **arxiv papers**: cs.CV, cs.AI, cs.LG, eess.IV — keyword-filtered + LLM-scored
- 🔥 **Hacker News**: Top AI/CS stories via Algolia API
- 💼 **Postdoc jobs**: jobs.ac.uk, FindAPostDoc, AcademicPositions — CV/AI/Medical only
- 👨‍🏫 **Supervisor pages**: Change detection on lab homepages (add to config/supervisors.yaml)

## Setup

1. Fork this repo
2. Add `OPENROUTER_API_KEY` to GitHub Secrets (Settings → Secrets → Actions)
3. Enable GitHub Pages (Settings → Pages → Deploy from branch: main, folder: /docs)
4. Trigger manually: Actions → Daily Digest → Run workflow

## Local usage

```bash
pip install -r requirements.txt
export OPENROUTER_API_KEY=sk-or-...
python main.py --mode daily
```

## Claude Code integration

```bash
python main.py --check-today    # compact session summary
# In Claude Code: /daily-digest
```

## Cost

~$0.026/day (~$0.78/month) using DeepSeek via OpenRouter.
Configure model in `config/sources.yaml`.
```

- [ ] **Step 2: Create GitHub repo and push**

```bash
gh repo create research-daily-digest --public --source=. --remote=origin --push
```

- [ ] **Step 3: Add OPENROUTER_API_KEY secret**

```bash
gh secret set OPENROUTER_API_KEY
# (paste your key when prompted)
```

- [ ] **Step 4: Enable GitHub Pages**

```bash
gh api repos/{owner}/research-daily-digest \
  --method PATCH \
  --field has_pages=true
```

Then go to: `https://github.com/{owner}/research-daily-digest/settings/pages`
Set: Source → Deploy from branch → `main` → `/docs`

- [ ] **Step 5: Trigger first manual run**

```bash
gh workflow run daily.yml
```

- [ ] **Step 6: Watch the run**

```bash
gh run watch
```

Expected: Pipeline completes, commits `data/daily/YYYY-MM-DD.json` and `docs/daily/YYYY-MM-DD.md`

- [ ] **Step 7: Test check-today after first run**

```bash
python main.py --check-today
```

Expected:
```
[Daily Digest 2026-04-13]
📄 Papers: 12 new (top: FoundationSeg: Universal Medical...)
💼 Jobs: 3 new
🔥 HN: Meta releases new open-source vision model...
⚠️  Supervisor updates: 0
Run /daily-digest for full report.
```

- [ ] **Step 8: Final commit**

```bash
git add README.md
git commit -m "docs: README with setup instructions"
git push
```

---

## Self-Review

**Spec coverage check:**

| Spec Section | Covered by Task |
|---|---|
| arxiv collector (cs.CV/AI/LG/eess.IV) | Task 3 |
| keyword pre-filter + LLM scorer | Tasks 3, 7 |
| HN via Algolia API | Task 4 |
| jobs.ac.uk + RSS sources | Task 5 |
| supervisor hash-diff watcher | Task 6 |
| Chinese summarizer | Task 8 |
| JSON data publisher | Task 9 |
| Jinja2 templates + pages publisher | Task 10 |
| weekly/monthly aggregator | Task 11 |
| main.py CLI (daily/weekly/monthly/--check-today) | Task 12 |
| GitHub Actions 3 workflows | Task 13 |
| /daily-digest Claude Code skill | Task 14 |
| SessionStart hook | Task 14 |
| config YAML files | Task 1, 2 |
| GitHub repo + first run | Task 15 |
| README | Task 15 |

**Placeholder scan:** No TBD, TODO, or "similar to above" patterns found.

**Type consistency:** All function signatures are consistent across tasks:
- `fetch_papers()` → `list[dict]` → `score_papers()` → `summarize_paper()` → `build_daily_payload()` ✅
- `fetch_stories()` → `list[dict]` → `summarize_hn_story()` ✅
- `fetch_jobs()` → `score_jobs()` → `summarize_job()` ✅
- `write_daily_json()` returns `str` (path), used in main.py ✅
- `build_weekly_payload()` / `build_monthly_payload()` both return `dict` ✅

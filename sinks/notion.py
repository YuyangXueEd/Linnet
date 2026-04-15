"""
Notion sink — creates a new page in a Notion database for each daily digest.

Required secrets (GitHub Actions / environment variables):
  NOTION_API_KEY      — Integration token from https://www.notion.so/my-integrations
  NOTION_DATABASE_ID  — ID of the Notion database to add pages to.
                        Find it in the database URL:
                        https://www.notion.so/<workspace>/<DATABASE_ID>?v=...

Setup steps:
  1. Create a Notion Integration at https://www.notion.so/my-integrations
     (type: Internal, capability: Insert content)
  2. Open your target database in Notion → "..." menu → "Add connections"
     → select your integration
  3. Copy the Integration token → set as NOTION_API_KEY secret
  4. Copy the database ID from the URL → set as NOTION_DATABASE_ID secret

Expected database schema (add these properties to your Notion database):
  - Title (default title property)  — text, e.g. "Daily Digest 2026-04-15"
  - Date  (type: Date)              — the digest date
  - Papers (type: Number)           — paper count
  - Jobs   (type: Number)           — job count

Config block in sources.yaml:
  sinks:
    notion:
      enabled: true
      max_papers: 10    # papers to list in the page body (default 10)
      max_hn: 5         # HN stories to list (default 5)
      max_github: 5     # GitHub repos to list (default 5)
      max_jobs: 5       # jobs to list (default 5)
"""

import os
import httpx
from sinks.base import BaseSink

_NOTION_API = "https://api.notion.com/v1"
_NOTION_VERSION = "2022-06-28"


class NotionSink(BaseSink):
    key = "notion"

    def deliver(self, payload: dict) -> None:
        api_key = os.environ.get("NOTION_API_KEY", "")
        database_id = os.environ.get("NOTION_DATABASE_ID", "")
        if not api_key:
            raise EnvironmentError("NOTION_API_KEY is not set")
        if not database_id:
            raise EnvironmentError("NOTION_DATABASE_ID is not set")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Notion-Version": _NOTION_VERSION,
            "Content-Type": "application/json",
        }

        page_body = self._build_page(payload, database_id)
        with httpx.Client(timeout=30) as client:
            resp = client.post(f"{_NOTION_API}/pages", headers=headers, json=page_body)
            resp.raise_for_status()

    # ------------------------------------------------------------------
    # Page builder
    # ------------------------------------------------------------------

    def _build_page(self, payload: dict, database_id: str) -> dict:
        date = payload.get("date", "")
        papers = payload.get("papers", [])
        hn = payload.get("hacker_news", [])
        jobs = payload.get("jobs", [])
        github = payload.get("github_trending", [])
        meta = payload.get("meta", {})

        max_papers = self.config.get("max_papers", 10)
        max_hn = self.config.get("max_hn", 5)
        max_github = self.config.get("max_github", 5)
        max_jobs = self.config.get("max_jobs", 5)

        children: list[dict] = []

        # ── Stats callout ────────────────────────────────────────────────
        stats_text = (
            f"{len(papers)} papers  ·  {len(hn)} HN stories  ·  "
            f"{len(jobs)} jobs  ·  {len(github)} trending repos  ·  "
            f"model: {meta.get('llm_model', 'unknown')}"
        )
        children.append(_callout(stats_text, emoji="📊"))

        # ── arXiv papers ─────────────────────────────────────────────────
        if papers:
            children.append(_heading2("📄 arXiv Papers"))
            for p in papers[:max_papers]:
                title = p.get("title", "Untitled")
                url = p.get("url", "")
                summary = p.get("abstract_zh", "")
                score = p.get("score", "")
                cat = p.get("primary_category", "")
                label = f"[{cat}]  score {score}" if score else f"[{cat}]"
                children.append(_bulleted(title, url=url, annotation=label))
                if summary:
                    children.append(_quote(summary))

        # ── Hacker News ──────────────────────────────────────────────────
        if hn:
            children.append(_heading2("🔥 Hacker News"))
            for s in hn[:max_hn]:
                title = s.get("title", "")
                url = s.get("url", "") or s.get("comments_url", "")
                summary = s.get("summary_zh", "")
                score = s.get("score", "")
                label = f"{score} pts" if score else ""
                children.append(_bulleted(title, url=url, annotation=label))
                if summary:
                    children.append(_quote(summary))

        # ── GitHub Trending ──────────────────────────────────────────────
        if github:
            children.append(_heading2("⭐ GitHub Trending"))
            for r in github[:max_github]:
                name = r.get("full_name", "")
                url = r.get("url", "")
                summary = r.get("summary_zh", "")
                lang = r.get("language", "")
                stars = r.get("stars_today", 0)
                label = "  ".join(filter(None, [lang, f"+{stars}★" if stars else ""]))
                children.append(_bulleted(name, url=url, annotation=label))
                if summary:
                    children.append(_quote(summary))

        # ── Academic Jobs ────────────────────────────────────────────────
        if jobs:
            children.append(_heading2("💼 Academic Jobs"))
            for j in jobs[:max_jobs]:
                title = j.get("title", "")
                url = j.get("url", "")
                inst = j.get("institution", "")
                deadline = j.get("deadline", "")
                label = "  ·  ".join(filter(None, [inst, deadline]))
                children.append(_bulleted(title, url=url, annotation=label))

        # Notion API allows max 100 children per request
        children = children[:100]

        return {
            "parent": {"database_id": database_id},
            "properties": {
                "title": {
                    "title": [{"type": "text", "text": {"content": f"Daily Digest {date}"}}]
                },
                "Date": {"date": {"start": date}},
                "Papers": {"number": len(papers)},
                "Jobs": {"number": len(jobs)},
            },
            "children": children,
        }


# ── Block helpers ────────────────────────────────────────────────────────────

def _heading2(text: str) -> dict:
    return {
        "object": "block",
        "type": "heading_2",
        "heading_2": {"rich_text": [_rt(text)]},
    }


def _callout(text: str, emoji: str = "ℹ️") -> dict:
    return {
        "object": "block",
        "type": "callout",
        "callout": {
            "rich_text": [_rt(text)],
            "icon": {"type": "emoji", "emoji": emoji},
        },
    }


def _bulleted(text: str, url: str = "", annotation: str = "") -> dict:
    parts: list[dict] = []
    if url:
        parts.append(_rt(text, url=url, bold=True))
    else:
        parts.append(_rt(text, bold=True))
    if annotation:
        parts.append(_rt(f"  {annotation}", color="gray"))
    return {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {"rich_text": parts},
    }


def _quote(text: str) -> dict:
    return {
        "object": "block",
        "type": "quote",
        "quote": {"rich_text": [_rt(text[:1900])]},  # Notion text limit
    }


def _rt(
    text: str,
    url: str = "",
    bold: bool = False,
    color: str = "default",
) -> dict:
    """Build a Notion rich_text object."""
    obj: dict = {
        "type": "text",
        "text": {"content": text},
        "annotations": {"bold": bold, "color": color},
    }
    if url:
        obj["text"]["link"] = {"url": url}
    return obj

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_DEFAULT_DATA_DIR = str(Path(__file__).parent.parent / "docs" / "data" / "daily")


def build_daily_payload(
    date_str: str,
    papers: list[dict],
    hn_stories: list[dict],
    jobs: list[dict],
    supervisor_updates: list[dict],
    meta: dict,
    github_trending: list[dict] | None = None,
) -> dict[str, Any]:
    return {
        "date": date_str,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "papers": papers,
        "hacker_news": hn_stories,
        "jobs": jobs,
        "supervisor_updates": supervisor_updates,
        "github_trending": github_trending or [],
        "meta": meta,
    }


def write_daily_json(payload: dict, base_dir: str = _DEFAULT_DATA_DIR) -> str:
    os.makedirs(base_dir, exist_ok=True)
    out_path = os.path.join(base_dir, f"{payload['date']}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return out_path


def write_weekly_json(payload: dict) -> str:
    base_dir = str(Path(__file__).parent.parent / "docs" / "data" / "weekly")
    os.makedirs(base_dir, exist_ok=True)
    out_path = os.path.join(base_dir, f"{payload['period']}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return out_path


def write_monthly_json(payload: dict) -> str:
    base_dir = str(Path(__file__).parent.parent / "docs" / "data" / "monthly")
    os.makedirs(base_dir, exist_ok=True)
    out_path = os.path.join(base_dir, f"{payload['period']}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return out_path

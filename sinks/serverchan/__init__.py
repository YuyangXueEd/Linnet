"""
ServerChan sink — posts the daily digest to Server酱 / ftqq.

Required secret (GitHub Actions / environment variable):
  SERVERCHAN_SENDKEY  — Your ServerChan SendKey or AppKey.

Config block in sources.yaml:
  sinks:
    serverchan:
      enabled: true
      max_papers: 5
      max_hn: 3
      max_github: 3
      max_jobs: 3
"""

import os

import httpx

from sinks.base import BaseSink


class ServerChanSink(BaseSink):
    key = "serverchan"

    def deliver(self, payload: dict) -> None:
        sendkey = os.environ.get("SERVERCHAN_SENDKEY", "").strip()
        if not sendkey:
            raise OSError("SERVERCHAN_SENDKEY is not set")

        title, body = self._build_message(payload)
        resp = httpx.post(
            f"https://sctapi.ftqq.com/{sendkey}.send",
            data={"text": title, "desp": body},
            timeout=15,
        )
        resp.raise_for_status()

        result = resp.json()
        if result.get("code") != 0:
            raise RuntimeError(f"ServerChan push failed: {result}")

    def _build_message(self, payload: dict) -> tuple[str, str]:
        date = payload.get("date", "")
        papers = payload.get("papers", [])
        hn = payload.get("hacker_news", [])
        jobs = payload.get("jobs", [])
        github = payload.get("github_trending", [])
        meta = payload.get("meta", {})

        max_papers = self.config.get("max_papers", 5)
        max_hn = self.config.get("max_hn", 3)
        max_github = self.config.get("max_github", 3)
        max_jobs = self.config.get("max_jobs", 3)

        title = f"Linnet | {date}"

        lines = [
            f"# Linnet · {date}",
            "",
            (
                f"- 论文：{len(papers)}"
                f"  - HN：{len(hn)}"
                f"  - GitHub：{len(github)}"
                f"  - 职位：{len(jobs)}"
            ),
            "",
        ]

        if papers:
            lines.extend(["## 今日论文", ""])
            for paper in papers[:max_papers]:
                title_text = paper.get("title", "Untitled")
                url = paper.get("url", "")
                category = paper.get("primary_category", "")
                score = paper.get("score", "")
                summary = _truncate(paper.get("abstract", ""), 180)
                link = f"[{title_text}]({url})" if url else title_text
                meta_bits = " · ".join(
                    [bit for bit in [category, f"score {score}" if score != "" else ""] if bit]
                )
                lines.append(f"- {link}{f'  `{meta_bits}`' if meta_bits else ''}")
                if summary:
                    lines.append(f"  {summary}")
            lines.append("")

        if hn:
            lines.extend(["## Hacker News", ""])
            for item in hn[:max_hn]:
                title_text = item.get("title", "Untitled")
                url = item.get("url", "") or item.get("comments_url", "")
                score = item.get("score", "")
                summary = _truncate(item.get("summary", ""), 140)
                link = f"[{title_text}]({url})" if url else title_text
                lines.append(f"- {link}{f'  `{score} pts`' if score != '' else ''}")
                if summary:
                    lines.append(f"  {summary}")
            lines.append("")

        if github:
            lines.extend(["## GitHub Trending", ""])
            for repo in github[:max_github]:
                name = repo.get("full_name", "")
                url = repo.get("url", "")
                language = repo.get("language", "")
                stars_today = repo.get("stars_today", 0)
                summary = _truncate(repo.get("summary", ""), 140)
                link = f"[{name}]({url})" if url else name
                meta_bits = " · ".join(
                    [
                        bit
                        for bit in [
                            language,
                            f"+{stars_today}★ today" if stars_today else "",
                        ]
                        if bit
                    ]
                )
                lines.append(f"- {link}{f'  `{meta_bits}`' if meta_bits else ''}")
                if summary:
                    lines.append(f"  {summary}")
            lines.append("")

        if jobs:
            lines.extend(["## Academic Jobs", ""])
            for job in jobs[:max_jobs]:
                title_text = job.get("title", "Untitled")
                url = job.get("url", "")
                institution = job.get("institution", "")
                link = f"[{title_text}]({url})" if url else title_text
                lines.append(f"- {link}{f' — {institution}' if institution else ''}")
            if len(jobs) > max_jobs:
                lines.append(f"- …还有 {len(jobs) - max_jobs} 条")
            lines.append("")

        duration = meta.get("duration_seconds", 0)
        model = meta.get("llm_model", "")
        lines.append(f"_Generated in {duration}s · {model}_")

        return title, "\n".join(lines)


def _truncate(text: str, max_len: int) -> str:
    text = str(text)
    return text if len(text) <= max_len else text[: max_len - 1] + "…"

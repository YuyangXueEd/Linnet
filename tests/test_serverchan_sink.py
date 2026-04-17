from sinks.serverchan import ServerChanSink


def test_serverchan_build_message_uses_limits():
    sink = ServerChanSink(
        {
            "enabled": True,
            "max_papers": 1,
            "max_hn": 1,
            "max_github": 1,
            "max_jobs": 1,
        }
    )

    payload = {
        "date": "2026-04-15",
        "papers": [
            {
                "title": "Paper A",
                "url": "https://example.com/paper-a",
                "primary_category": "cs.AI",
                "score": 9,
                "abstract": "A" * 220,
            },
            {
                "title": "Paper B",
                "url": "https://example.com/paper-b",
                "primary_category": "cs.LG",
                "score": 8,
                "abstract": "Second paper",
            },
        ],
        "hacker_news": [
            {
                "title": "HN Story",
                "url": "https://example.com/hn",
                "score": 42,
                "summary": "Interesting summary",
            }
        ],
        "github_trending": [
            {
                "full_name": "owner/repo",
                "url": "https://github.com/owner/repo",
                "language": "Python",
                "stars_today": 123,
                "summary": "Repo summary",
            }
        ],
        "jobs": [
            {
                "title": "Research Fellow",
                "url": "https://example.com/job",
                "institution": "Example University",
            }
        ],
        "meta": {"duration_seconds": 12, "llm_model": "test-model"},
    }

    title, body = sink._build_message(payload)

    assert title == "Linnet | 2026-04-15"
    assert body.count("## 今日论文") == 1
    assert "Paper A" in body
    assert "Paper B" not in body
    assert "HN Story" in body
    assert "owner/repo" in body
    assert "Research Fellow" in body
    assert "Generated in 12s" in body

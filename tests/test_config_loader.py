from pipeline.config_loader import load_extension_config, load_sources


def test_load_extension_config_arxiv_has_categories():
    cfg = load_extension_config("arxiv")
    assert isinstance(cfg.get("categories"), list)


def test_load_extension_config_arxiv_has_must_include():
    cfg = load_extension_config("arxiv")
    assert isinstance(cfg.get("must_include"), list)
    assert "llm_score_threshold" in cfg


def test_load_extension_config_missing_returns_empty():
    cfg = load_extension_config("nonexistent_extension")
    assert cfg == {}


def test_load_sources_has_llm_config():
    cfg = load_sources()
    assert "llm" in cfg
    assert "base_url" in cfg["llm"]
    assert cfg["llm"]["scoring_model"]  # just check it's set


def test_load_extension_config_supervisor_updates_returns_list():
    cfg = load_extension_config("supervisor_updates")
    assert isinstance(cfg.get("supervisors", []), list)

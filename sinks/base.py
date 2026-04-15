"""Base class for all delivery sinks."""

from abc import ABC, abstractmethod


class BaseSink(ABC):
    """
    Abstract base for all delivery sinks.

    Subclasses must:
      - Set class-level ``key`` (unique snake_case string, matches sinks.<key>
        in sources.yaml)
      - Implement ``deliver()``

    Credentials (API keys, webhook URLs) are read from environment variables
    inside ``deliver()``, not from the config dict, so they never appear in
    committed config files.

    Config layout (from sources.yaml under sinks.<key>):
    {
        "enabled": false,   # sinks are opt-in — default disabled
        ...sink-specific display/limit options...
    }
    """

    key: str = ""

    def __init__(self, config: dict) -> None:
        self.config = config

    @property
    def enabled(self) -> bool:
        # Sinks are opt-in: must be explicitly enabled in config.
        return self.config.get("enabled", False)

    @abstractmethod
    def deliver(self, payload: dict) -> None:
        """
        Format and deliver the daily payload to the external service.

        ``payload`` is the same dict written to docs/data/daily/<date>.json,
        containing: date, papers, hacker_news, jobs, supervisor_updates,
        github_trending, meta.

        Raise an exception on unrecoverable errors; the orchestrator will
        catch and log them without aborting the rest of the pipeline.
        """
        ...

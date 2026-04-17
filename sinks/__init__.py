"""
sinks/ — delivery layer for the Linnet pipeline.

After the daily payload is built, the orchestrator calls every enabled sink.
Each sink formats and delivers the payload to an external service (Slack,
Notion, Teams, Telegram, …).

To add a new sink:
  1. Create sinks/my_sink.py subclassing BaseSink (key = "my_sink")
  2. Add it to SINK_REGISTRY below
  3. Add a config block under the "sinks:" key in config/sources.yaml
  4. Set required credentials as GitHub secrets / environment variables
"""

from sinks.base import BaseSink
from sinks.serverchan import ServerChanSink
from sinks.slack import SlackSink

# Ordered list of all known sinks.
# The orchestrator iterates this list; disabled sinks are skipped.
SINK_REGISTRY: list[type[BaseSink]] = [
    SlackSink,
    ServerChanSink,
]

__all__ = ["BaseSink", "SINK_REGISTRY"]

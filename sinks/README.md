# sinks/ — delivery layer

After the daily payload is built, the orchestrator calls every **enabled** sink. Each sink formats and delivers the payload to an external service.

## Available sinks

| Sink | Key | Status | Description |
|---|---|---|---|
| [slack/](slack/) | `slack` | active | Block Kit message via Incoming Webhook |
| [serverchan/](serverchan/) | `serverchan` | active | Daily digest sent to Server酱 via SendKey / AppKey |

## Quickstart — add a new sink

```bash
# 1. Copy the template
cp -r sinks/_template sinks/my_sink

# 2. Edit the class
#    - rename MySink → MyServiceSink
#    - set key = "my_sink"
#    - implement deliver()

# 3. Register it
#    sinks/__init__.py → add to SINK_REGISTRY

# 4. Configure it
#    config/sources.yaml → add under sinks:
#      my_sink:
#        enabled: true

# 5. Document the required env var in sinks/my_sink/README.md
```

## File map

```
base.py          BaseSink ABC — read this first
__init__.py      SINK_REGISTRY list — all active sinks registered here
README.md        This file
llms.txt         Machine-readable context for LLMs

slack/
  __init__.py    SlackSink — Block Kit via Incoming Webhook
  README.md      Setup guide, config options, message structure

serverchan/
  __init__.py    ServerChanSink — Markdown message via SendKey / AppKey
  README.md      Setup guide, config options, message structure

_template/
  __init__.py    Fully commented starter for new sinks
  README.md      How to use the template
```

## BaseSink contract

```python
class BaseSink(ABC):
    key: str = ""                  # unique snake_case, matches sources.yaml

    def __init__(self, config: dict): ...

    @property
    def enabled(self) -> bool:
        return self.config.get("enabled", False)   # sinks are opt-in

    @abstractmethod
    def deliver(self, payload: dict) -> None: ...
```

Sinks default to **disabled** (`enabled: false`). Set `enabled: true` in `sources.yaml` to activate.

## Credential convention

Credentials (webhook URLs, API keys, tokens) are **always** read from environment variables inside `deliver()` — never from `self.config`. This keeps secrets out of committed config files.

```python
def deliver(self, payload):
    api_key = os.environ.get("MY_SINK_API_KEY", "")
    if not api_key:
        raise EnvironmentError("MY_SINK_API_KEY is not set")
    ...
```

Set credentials as GitHub Actions secrets or in your local `.env` file.

## SINK_REGISTRY

```python
# sinks/__init__.py
from sinks.base import BaseSink
from sinks.serverchan import ServerChanSink
from sinks.slack import SlackSink

SINK_REGISTRY: list[type[BaseSink]] = [
    SlackSink,
    ServerChanSink,
    # MySink,   ← add here
]
```

## Testing

Sinks are tested indirectly via the pipeline integration tests. For unit testing a new sink, mock the HTTP client and assert the correct payload shape is sent:

```bash
PYTHONPATH=. pytest tests/ -q
```

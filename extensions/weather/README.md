# weather extension

Fetches today's weather forecast for a configured city using the Open-Meteo API (no API key required).

## Pipeline

```
fetch()    — geocodes the city name, fetches current conditions and daily forecast
render()   — wraps in FeedSection
```

## Config

`config/sources.yaml` — toggle only:

| Key | Default | Notes |
|---|---|---|
| `enabled` | `true` | |

`config/extensions/weather.yaml` — all other settings (see [`weather.yaml.example`](weather.yaml.example) to restore defaults):

| Key | Default | Notes |
|---|---|---|
| `city` | `""` | City name resolved via Open-Meteo geocoding |
| `timezone` | `"auto"` | `"auto"` detects from coordinates; or use e.g. `"Europe/London"` |
| `request_timeout` | `10.0` | Seconds for HTTP requests |

## Output item schema

```python
{
  "query":                        str,    # city name as configured
  "label":                        str,    # "Edinburgh, Scotland, United Kingdom"
  "resolved_name":                str,
  "region":                       str,
  "country":                      str,
  "latitude":                     float,
  "longitude":                    float,
  "timezone":                     str,
  "forecast_date":                str,
  "condition":                    str,    # e.g. "Partly cloudy"
  "weather_code":                 int,
  "temperature_c":                float,
  "apparent_temperature_c":       float,
  "temp_max_c":                   float,
  "temp_min_c":                   float,
  "humidity_pct":                 int,
  "wind_speed_kmh":               float,
  "precipitation_probability_pct": int,
  "is_day":                       bool,
  "sunrise":                      str,
  "sunset":                       str,
  "source":                       str,    # "Open-Meteo"
  "source_url":                   str,
}
```

## Underlying collector

- `extensions/weather/collector.py`
  - `fetch_today_weather(city, timezone, language, request_timeout)` — Open-Meteo API

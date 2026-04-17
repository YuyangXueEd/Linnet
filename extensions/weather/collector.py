"""Helpers for fetching today's weather from Open-Meteo."""

import httpx

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def describe_weather_code(code: int | None) -> str:
    if code is None:
        return "Unknown"
    return WEATHER_CODES.get(code, f"Weather code {code}")


def _location_label(result: dict) -> str:
    parts = [result.get("name"), result.get("admin1"), result.get("country")]
    return ", ".join(part for part in parts if part)


def fetch_today_weather(
    city: str,
    timezone: str = "auto",
    language: str = "en",
    request_timeout: float = 10.0,
) -> list[dict]:
    """Resolve a city name and fetch today's forecast from Open-Meteo."""
    if not city:
        return []

    try:
        with httpx.Client(timeout=request_timeout, follow_redirects=True) as client:
            geo_resp = client.get(
                GEOCODING_URL,
                params={
                    "name": city,
                    "count": 1,
                    "language": language,
                    "format": "json",
                },
            )
            geo_resp.raise_for_status()
            results = geo_resp.json().get("results") or []
            if not results:
                print(f"  Weather: no city matched {city!r}")
                return []

            place = results[0]
            forecast_resp = client.get(
                FORECAST_URL,
                params={
                    "latitude": place["latitude"],
                    "longitude": place["longitude"],
                    "current": (
                        "temperature_2m,apparent_temperature,relative_humidity_2m,"
                        "weather_code,wind_speed_10m,is_day"
                    ),
                    "daily": (
                        "temperature_2m_max,temperature_2m_min,"
                        "precipitation_probability_max,sunrise,sunset"
                    ),
                    "forecast_days": 1,
                    "timezone": timezone,
                },
            )
            forecast_resp.raise_for_status()
    except httpx.HTTPError as exc:
        print(f"  Weather: fetch failed for {city!r} — {exc}")
        return []

    data = forecast_resp.json()
    current = data.get("current", {})
    daily = data.get("daily", {})

    def _daily_value(name: str):
        values = daily.get(name) or []
        return values[0] if values else None

    item = {
        "query": city,
        "label": _location_label(place),
        "resolved_name": place.get("name", city),
        "region": place.get("admin1", ""),
        "country": place.get("country", ""),
        "latitude": place.get("latitude"),
        "longitude": place.get("longitude"),
        "timezone": data.get("timezone", timezone),
        "forecast_date": _daily_value("time"),
        "condition": describe_weather_code(current.get("weather_code")),
        "weather_code": current.get("weather_code"),
        "temperature_c": current.get("temperature_2m"),
        "apparent_temperature_c": current.get("apparent_temperature"),
        "temp_max_c": _daily_value("temperature_2m_max"),
        "temp_min_c": _daily_value("temperature_2m_min"),
        "humidity_pct": current.get("relative_humidity_2m"),
        "wind_speed_kmh": current.get("wind_speed_10m"),
        "precipitation_probability_pct": _daily_value("precipitation_probability_max"),
        "is_day": bool(current.get("is_day", 1)),
        "sunrise": _daily_value("sunrise"),
        "sunset": _daily_value("sunset"),
        "source": "Open-Meteo",
        "source_url": "https://open-meteo.com/",
    }
    return [item]

"""Weather extension — fetches today's weather for a configured city."""

from extensions.base import BaseExtension, FeedSection
from extensions.weather.collector import fetch_today_weather


class WeatherExtension(BaseExtension):
    key = "weather"
    title = "Weather"
    icon = "🌦️"

    def fetch(self) -> list[dict]:
        city = self.config.get("city", "")
        timezone = self.config.get("timezone", "auto")
        lang = self.config.get("language", "en")
        if not city:
            print("Weather skipped: no city configured")
            return []
        print(f"Fetching weather for {city}...")
        items = fetch_today_weather(
            city=city,
            timezone=timezone,
            language=lang,
            request_timeout=self.config.get("request_timeout", 10.0),
        )
        print(f"  Weather items: {len(items)}")
        return items

    def render(self, items: list[dict]) -> FeedSection:
        return self.build_section(
            items=items,
            meta={
                "count": len(items),
                "city": self.config.get("city", ""),
            },
        )

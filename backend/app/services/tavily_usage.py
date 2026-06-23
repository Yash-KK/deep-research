import requests

from ..config import settings


def fetch_tavily_usage() -> dict:
    if not settings.TAVILY_API_KEY:
        raise ValueError("Tavily API key is not configured")

    response = requests.get(
        settings.TAVILY_USAGE_URL,
        headers={
            "Authorization": f"Bearer {settings.TAVILY_API_KEY}",
            "Accept": "application/json",
        },
        timeout=10,
    )
    response.raise_for_status()
    return response.json()

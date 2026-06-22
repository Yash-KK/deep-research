import os

from langchain_tavily import TavilySearch
from ..config import settings


def get_search_tool() -> TavilySearch:
    os.environ.setdefault("TAVILY_API_KEY", settings.TAVILY_API_KEY)

    return TavilySearch(
        max_results=3,
        search_depth="basic",
        include_answer=True,
        include_raw_content=True,
    )
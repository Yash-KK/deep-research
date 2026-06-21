import os

from langchain_community.tools.tavily_search import TavilySearchResults

from ..config import settings


def get_search_tool() -> TavilySearchResults:
    os.environ.setdefault("TAVILY_API_KEY", settings.TAVILY_API_KEY)

    return TavilySearchResults(
        max_results=3,
        search_depth="basic",
        include_answer=True,
        include_raw_content=True,
    )

from langchain.tools import tool
from langchain_tavily import TavilySearch

from ..config import settings


@tool(
    "web_search",
    description=(
        "Searches the web for up-to-date or factual information. "
        "Use this tool when the question requires recent data, external knowledge, "
        "current events, factual lookups, company/product information, "
        "documentation, or anything not guaranteed to be in memory. "
        "Input should be a concise search query "
        "(e.g., 'latest LangChain version', 'weather in Hyderabad'). "
        "Do NOT use for math calculations or simple reasoning."
    ),
)
def web_search(query: str):
    resp = TavilySearch(
        max_results=3,
        topic="general",
        include_answer=True,
        include_raw_content=True,
        tavily_api_key=settings.TAVILY_API_KEY,
    )

    return resp.invoke(query)

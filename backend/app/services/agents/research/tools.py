from langchain.tools import tool
from tavily import TavilyClient
import trafilatura

from app.config import settings

tavily = TavilyClient(api_key=settings.TAVILY_API_KEY)


@tool
def web_search(query: str, max_results: int = 5) -> str:
    """Search the web for recent and reliable information on a topic."""
    try:
        response = tavily.search(
            query=query,
            search_depth="basic",
            max_results=max_results,
            include_answer=True,
            include_raw_content=False,
            include_images=False,
        )
        results = response.get("results", [])
        if not results:
            return "No relevant results found."

        output = []
        for idx, result in enumerate(results, start=1):
            output.append(
                f"""[{idx}]
Title: {result.get("title", "N/A")}
URL: {result.get("url", "N/A")}
Snippet: {result.get("content", "No snippet available.")}
"""
            )
        return "\n" + ("\n" + "-" * 10 + "\n").join(output)
    except Exception as e:
        return f"Web search failed: {e}"


@tool
def scrape_url(url: str) -> str:
    """Extract the main textual content from a webpage."""
    try:
        downloaded = trafilatura.fetch_url(url)
        if downloaded is None:
            return "Failed to download the webpage."

        content = trafilatura.extract(downloaded)
        if not content:
            return "No readable content found."

        return " ".join(content.split()[:1500])
    except Exception as e:
        return f"Failed to scrape URL: {e}"
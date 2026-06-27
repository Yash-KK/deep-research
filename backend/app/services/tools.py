import requests
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
        search_depth="basic",
        include_answer=True,
        tavily_api_key=settings.TAVILY_API_KEY,
    )

    return resp.invoke(query)


@tool(
    "calculator",
    description=(
        "Performs arithmetic and mathematical calculations. "
        "Use this tool for evaluating math expressions, basic arithmetic, "
        "scientific calculations, or solving numeric problems. "
        "Input should be a valid mathematical expression as a string "
        "(e.g., '25 * 4 + 10', 'sqrt(16)', '100 / 5'). "
        "Do NOT use for general reasoning, factual queries, or web lookups."
    ),
)
def calculator(expression: str) -> str:
    return str(eval(expression))


@tool(
    "weather",
    description=(
        "Fetches real-time weather information for a specific location. "
        "Use this tool when the user asks about current weather conditions, "
        "temperature, humidity, rain, wind, or weather forecasts for a city or place. "
        "Input should be a location name as a string "
        "(e.g., 'Hyderabad', 'New York', 'London'). "
        "Use for weather-related questions like "
        "'What's the weather in Mumbai?' or "
        "'Is it raining in Bangalore?'. "
        "Do NOT use for general knowledge, math, or non-weather queries."
    ),
)
def weather(location: str) -> str:
    url = settings.WEATHER_API_URL.format(location=location)
    response = requests.get(url, timeout=20)

    response.raise_for_status()
    data = response.json()

    return data


AGENT_TOOLS = [web_search, calculator, weather]

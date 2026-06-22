from langchain.agents import create_agent

from ..llm import get_llm_model
from ..search import web_search


SYSTEM_PROMPT = """You are a sharp, concise research assistant with live web search.

When answering:
- Search the web for any factual question that may have changed recently
- Keep answers focused and readable — use bullet points for lists
- Cite sources inline where useful (e.g. "According to Reuters...")
- If the answer is straightforward general knowledge, answer directly without searching
- Never make up facts — search instead of guessing
"""


def get_chat_agent():
    """Build and return a compiled LangGraph ReAct agent."""

    return create_agent(
        model=get_llm_model(),
        tools=[web_search],
        system_prompt=SYSTEM_PROMPT,
    )

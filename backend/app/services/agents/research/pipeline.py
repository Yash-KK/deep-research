from langchain.agents import create_agent
from langchain_core.output_parsers import StrOutputParser

from app.services.agents.research.prompts import CRITIC_PROMPT, WRITER_PROMPT
from app.services.agents.research.tools import scrape_url, web_search
from app.services.llm import get_llm_model


def _last_message_content(response: dict) -> str:
    content = response["messages"][-1].content
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(
            part.get("text", "")
            for part in content
            if isinstance(part, dict) and part.get("type") == "text"
        )
    return str(content)


def run_research(topic: str) -> str:
    """Run search → scrape → write → critique and return the final report."""
    model = get_llm_model()

    search_agent = create_agent(model=model, tools=[web_search])
    scrape_agent = create_agent(model=model, tools=[scrape_url])

    search_results = _last_message_content(
        search_agent.invoke(
            {
                "messages": [
                    (
                        "user",
                        f"Find recent, reliable and detailed information about {topic}",
                    )
                ]
            }
        )
    )

    scraped_results = _last_message_content(
        scrape_agent.invoke(
            {
                "messages": [
                    (
                        "user",
                        f"Based on the following search results about {topic}, "
                        f"pick the most relevant URL and scrape it for deeper content.\n\n"
                        f"Search Results:\n{search_results}",
                    )
                ]
            }
        )
    )

    research_combined = (
        f"SEARCH RESULTS:\n{search_results}\n\n"
        f"DETAILED SCRAPED CONTENT:\n{scraped_results}"
    )

    report = (WRITER_PROMPT | model | StrOutputParser()).invoke(
        {"topic": topic, "research": research_combined}
    )
    feedback = (CRITIC_PROMPT | model | StrOutputParser()).invoke({"report": report})

    return f"{report}\n\n---\n\n## Critic Feedback\n\n{feedback}"

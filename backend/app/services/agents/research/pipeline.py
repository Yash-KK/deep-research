import re

from langchain_core.output_parsers import StrOutputParser

from app.services.agents.research.prompts import CRITIC_PROMPT, WRITER_PROMPT
from app.services.agents.research.tools import scrape_url, web_search
from app.services.llm import get_llm_model


def run_research(topic: str) -> str:
    model = get_llm_model()

    search_results = web_search.invoke({"query": topic, "max_results": 5})

    urls = re.findall(r"URL: (\S+)", search_results)
    scraped_chunks = []
    for url in urls:
        content = scrape_url.invoke({"url": url})
        scraped_chunks.append(f"Source: {url}\n{content}")
    scraped_results = "\n\n---\n\n".join(scraped_chunks) or "No pages scraped successfully."

    research_combined = (
        f"SEARCH RESULTS:\n{search_results}\n\n"
        f"DETAILED SCRAPED CONTENT:\n{scraped_results}"
    )

    writer_chain = WRITER_PROMPT | model | StrOutputParser()
    critic_chain = CRITIC_PROMPT | model | StrOutputParser()

    report = writer_chain.invoke({"topic": topic, "research": research_combined})
    feedback = critic_chain.invoke({"research": research_combined, "report": report})

    return f"{report}\n\n---\n\n## Critic Feedback\n\n{feedback}"
import asyncio
import uuid
from datetime import datetime, timezone

from ..celery_app import celery
from ..config import settings
from ..database import SessionLocal
from ..models.job import JobStatus, ResearchJob


async def _run_agent(question: str) -> str:
    import os

    from deepagents import create_deep_agent
    from langchain_community.tools.tavily_search import TavilySearchResults
    from langchain_openai import ChatOpenAI

    if not settings.NVIDIA_API_KEY or not settings.NVIDIA_BASE_URL or not settings.NVIDIA_QWEN_MODEL:
        raise ValueError(
            "NVIDIA settings missing. Set NVIDIA_API_KEY, NVIDIA_BASE_URL, and NVIDIA_QWEN_MODEL in .env"
        )

    os.environ.setdefault("TAVILY_API_KEY", settings.TAVILY_API_KEY)

    search_tool = TavilySearchResults(
        max_results=6,
        search_depth="advanced",
        include_answer=True,
        include_raw_content=False,
    )

    model = ChatOpenAI(
        model=settings.NVIDIA_QWEN_MODEL,
        api_key=settings.NVIDIA_API_KEY,
        base_url=settings.NVIDIA_BASE_URL,
    )

    agent = create_deep_agent(
        model=model,
        tools=[search_tool],
        system_prompt="""You are a world-class research analyst.

When given a question:
1. Decompose it into focused sub-questions worth researching separately.
2. Search the web thoroughly — use multiple targeted queries.
3. Cross-reference sources; prefer authoritative, recent content.
4. Synthesise findings into a clear, structured report with:
   - ## Summary  (3-5 sentence TL;DR)
   - ## Key Findings  (bulleted insights)
   - ## Details  (deeper explanation per sub-topic)
   - ## Sources  (list the URLs you found most useful)
5. Close with a direct answer to the original question.

Be comprehensive but concise. Avoid padding. Cite sources inline where possible.""",
    )

    result = await agent.ainvoke(
        {"messages": [{"role": "user", "content": question}]}
    )

    messages = result.get("messages", [])
    for msg in reversed(messages):
        content = getattr(msg, "content", None)
        msg_type = getattr(msg, "type", "")
        if msg_type == "ai" and content:
            if isinstance(content, str):
                return content
            if isinstance(content, list):
                parts = [
                    c.get("text", "")
                    for c in content
                    if isinstance(c, dict) and c.get("type") == "text"
                ]
                return "\n".join(parts)

    return "Research completed — no text response extracted."


def _run_agent_sync(question: str) -> str:
    return asyncio.run(_run_agent(question))


@celery.task(
    bind=True,
    name="app.tasks.research.run_research_job",
    max_retries=2,
    default_retry_delay=30,
    queue="research",
)
def run_research_job(self, job_id: str, question: str):
    db = SessionLocal()
    job = None
    try:
        job = db.query(ResearchJob).filter(ResearchJob.id == uuid.UUID(job_id)).first()
        if not job:
            return

        job.status = JobStatus.RUNNING
        job.updated_at = datetime.now(timezone.utc)
        db.commit()

        result_text = _run_agent_sync(question)

        job.status = JobStatus.COMPLETED
        job.result = result_text
        job.updated_at = datetime.now(timezone.utc)
        db.commit()

    except Exception as exc:
        try:
            if job:
                job.status = JobStatus.FAILED
                job.error = f"{type(exc).__name__}: {exc}"
                job.updated_at = datetime.now(timezone.utc)
                db.commit()
        except Exception:
            db.rollback()

        raise self.retry(exc=exc, countdown=self.default_retry_delay)
    finally:
        db.close()

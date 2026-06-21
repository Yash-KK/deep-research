"""
DeepAgent Research Task
────────────────────────
Runs inside a Celery worker.  Because DeepAgents / LangGraph are async-first
we bridge with asyncio.run() — safe because each Celery worker process owns
its own event loop (prefork model).
"""

import asyncio
import uuid
from datetime import datetime, timezone

from ..celery_app import celery
from ..config import settings
from ..database import SessionLocal
from ..models.job import JobStatus, ResearchJob


# ─── DeepAgent runner ────────────────────────────────────────────────────────

async def _run_agent(question: str) -> str:
    """Build and invoke the DeepAgent, return the final text response."""
    from deepagents import create_deep_agent
    from langchain_community.tools.tavily_search import TavilySearchResults

    import os
    os.environ.setdefault("TAVILY_API_KEY", settings.TAVILY_API_KEY)
    os.environ.setdefault("OPENAI_API_KEY", settings.OPENAI_API_KEY)

    if not settings.OPENAI_API_KEY:
        raise ValueError("No AI provider key configured. Set OPENAI_API_KEY in .env")

    search_tool = TavilySearchResults(
        max_results=6,
        search_depth="advanced",
        include_answer=True,
        include_raw_content=False,
    )

    model = "openai:gpt-4o"

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

    # Extract final AI message text
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
    """Synchronous wrapper so Celery (prefork) can call async code."""
    return asyncio.run(_run_agent(question))


# ─── Celery Task ─────────────────────────────────────────────────────────────

@celery.task(
    bind=True,
    name="app.tasks.research.run_research_job",
    max_retries=2,
    default_retry_delay=30,
    queue="research",
)
def run_research_job(self, job_id: str, question: str):
    """
    Celery task:
      1. Mark job RUNNING
      2. Run DeepAgent
      3. Mark job COMPLETED (or FAILED on error)
    """
    db = SessionLocal()
    job = None
    try:
        job = db.query(ResearchJob).filter(ResearchJob.id == uuid.UUID(job_id)).first()
        if not job:
            return  # Job deleted before worker picked it up

        # ── Mark running ──────────────────────────────────────────────────
        job.status = JobStatus.RUNNING
        job.updated_at = datetime.now(timezone.utc)
        db.commit()

        # ── Run the agent ─────────────────────────────────────────────────
        result_text = _run_agent_sync(question)

        # ── Mark completed ────────────────────────────────────────────────
        job.status = JobStatus.COMPLETED
        job.result = result_text
        job.updated_at = datetime.now(timezone.utc)
        db.commit()

    except Exception as exc:
        # Re-fetch in case session went stale
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

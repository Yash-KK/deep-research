import asyncio
import uuid
from datetime import datetime, timezone

from celery.exceptions import Ignore
from celery.result import AsyncResult
from celery.signals import task_revoked
from langchain.agents.middleware import (
    ModelCallLimitMiddleware,
    ToolCallLimitMiddleware,
)

from ..celery_app import celery
from ..core.jobs import mark_job_cancelled
from ..database import SessionLocal
from ..models.job import JobStatus, ResearchJob


async def _run_agent(question: str) -> str:
    from deepagents import create_deep_agent

    from ..services.llm import get_llm_model
    from ..services.prompts import RESEARCH_SYSTEM_PROMPT
    from ..services.search import get_search_tool

    agent = create_deep_agent(
        model=get_llm_model(),
        tools=[get_search_tool()],
        system_prompt=RESEARCH_SYSTEM_PROMPT,
        middleware=[
            ModelCallLimitMiddleware(run_limit=20),
            ToolCallLimitMiddleware(run_limit=10),
        ],
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


@task_revoked.connect
def handle_task_revoked(request, terminated, signum, expired, **kwargs):
    if not request or not request.id:
        return

    db = SessionLocal()
    try:
        job = db.query(ResearchJob).filter(ResearchJob.celery_task_id == request.id).first()
        if job:
            mark_job_cancelled(job, db)
    finally:
        db.close()


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

        if job.status == JobStatus.CANCELLED:
            return

        job.status = JobStatus.RUNNING
        job.updated_at = datetime.now(timezone.utc)
        db.commit()

        result_text = _run_agent_sync(question)

        db.refresh(job)
        if job.status == JobStatus.CANCELLED:
            return

        job.status = JobStatus.COMPLETED
        job.result = result_text
        job.updated_at = datetime.now(timezone.utc)
        db.commit()

    except Exception as exc:
        if AsyncResult(self.request.id, app=celery).state == "REVOKED":
            try:
                if job:
                    mark_job_cancelled(job, db)
            except Exception:
                db.rollback()
            raise Ignore() from exc

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

import uuid
from datetime import datetime, timezone

from celery.exceptions import Ignore
from celery.result import AsyncResult
from celery.signals import task_revoked

from ..celery_app import celery
from ..core.jobs import mark_job_cancelled
from ..database import SessionLocal
from ..models.job import JobStatus, ResearchJob
from ..services.agents.research import run_research


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
            raise ValueError(f"Research job {job_id} not found")

        if job.status == JobStatus.CANCELLED:
            return

        job.status = JobStatus.RUNNING
        job.updated_at = datetime.now(timezone.utc)
        db.commit()

        result_text = run_research(question)

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

        if job:
            db.refresh(job)
            if job.status == JobStatus.CANCELLED:
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

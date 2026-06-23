from datetime import datetime, timezone

from celery.result import AsyncResult
from sqlalchemy.orm import Session

from ..celery_app import celery
from ..models.job import JobStatus, ResearchJob

ACTIVE_STATUSES = (JobStatus.PENDING, JobStatus.RUNNING)


def revoke_celery_task(task_id: str) -> None:
    celery.control.revoke(task_id, terminate=True, signal="SIGTERM")


def sync_job_with_celery(job: ResearchJob, db: Session) -> None:
    if job.status not in ACTIVE_STATUSES or not job.celery_task_id:
        return

    result = AsyncResult(job.celery_task_id, app=celery)
    state = result.state

    if state == "REVOKED":
        mark_job_cancelled(job, db)
        return

    try:
        meta = result.backend.get_task_meta(job.celery_task_id)
        if meta.get("status") == "REVOKED":
            mark_job_cancelled(job, db)
            return
    except Exception:
        pass

    if state == "STARTED" and job.status == JobStatus.PENDING:
        job.status = JobStatus.RUNNING
        job.updated_at = datetime.now(timezone.utc)
        db.commit()
        return

    if state == "FAILURE":
        job.status = JobStatus.FAILED
        job.error = str(result.result) if result.result else "Research task failed"
        job.updated_at = datetime.now(timezone.utc)
        db.commit()


def mark_job_cancelled(job: ResearchJob, db: Session, message: str = "Research job was cancelled.") -> None:
    if job.status not in ACTIVE_STATUSES:
        return
    job.status = JobStatus.CANCELLED
    job.error = message
    job.updated_at = datetime.now(timezone.utc)
    db.commit()

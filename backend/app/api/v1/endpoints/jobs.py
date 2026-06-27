from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.jobs import ACTIVE_STATUSES, sync_job_with_celery
from app.database import get_db
from app.models.job import JobStatus, ResearchJob
from app.models.user import User
from app.schemas.job import JobCreate, JobResponse
from app.tasks.research import run_research_job

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _get_user_job(job_id: UUID, current_user: User, db: Session) -> ResearchJob:
    job = (
        db.query(ResearchJob)
        .filter(ResearchJob.id == job_id, ResearchJob.user_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/", response_model=JobResponse, status_code=201)
def create_job(
    data: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = ResearchJob(
        user_id=current_user.id,
        question=data.question.strip(),
        status=JobStatus.PENDING,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    task = run_research_job.delay(str(job.id), data.question.strip())

    job.celery_task_id = task.id
    db.commit()
    db.refresh(job)

    return job


@router.get("/", response_model=List[JobResponse])
def list_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    jobs = (
        db.query(ResearchJob)
        .filter(ResearchJob.user_id == current_user.id)
        .order_by(ResearchJob.created_at.desc())
        .all()
    )
    for job in jobs:
        sync_job_with_celery(job, db)
    return jobs


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = _get_user_job(job_id, current_user, db)
    sync_job_with_celery(job, db)
    db.refresh(job)
    return job


@router.delete("/{job_id}", status_code=204)
def delete_job(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = _get_user_job(job_id, current_user, db)

    if job.status in ACTIVE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a research job while it is in progress.",
        )

    db.delete(job)
    db.commit()
    return Response(status_code=204)

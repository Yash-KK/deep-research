from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from ..models.job import JobStatus


class JobCreate(BaseModel):
    question: str


class JobResponse(BaseModel):
    id: UUID
    question: str
    status: JobStatus
    result: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

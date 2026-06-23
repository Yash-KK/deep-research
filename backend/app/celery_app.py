from celery import Celery

from .config import settings

celery = Celery(
    "deepagent",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.research"],
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    broker_connection_retry_on_startup=True,
    task_default_queue="research",
    task_create_missing_queues=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_routes={"app.tasks.research.run_research_job": {"queue": "research"}},
)

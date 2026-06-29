import logging

from celery import Celery
from celery.signals import after_setup_logger

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


@after_setup_logger.connect
def configure_deepagent_logging(logger, *args, **kwargs):
    deepagent_logger = logging.getLogger("app.deepagent")
    deepagent_logger.setLevel(logging.INFO)
    if not deepagent_logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(
            logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s")
        )
        deepagent_logger.addHandler(handler)
    deepagent_logger.propagate = True

from app.api.v1.constants import API_V1_PREFIX
from app.api.v1.endpoints import auth, chat, jobs, tavily
from fastapi import APIRouter

api_router = APIRouter()

api_router.include_router(auth.router, prefix=API_V1_PREFIX)
api_router.include_router(jobs.router, prefix=API_V1_PREFIX)
api_router.include_router(chat.router, prefix=API_V1_PREFIX)
api_router.include_router(tavily.router, prefix=API_V1_PREFIX)

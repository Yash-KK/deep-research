from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.config import settings

app = FastAPI(
    title="DeepAgent Research API",
    description="Multi-user AI research assistant powered by LangChain DeepAgents",
    version="1.0.0",
)

cors_origins_list = (
    [
        origin.strip()
        for origin in settings.CORS_ORIGINS.split(",")
        if origin.strip()
    ]
    if settings.CORS_ORIGINS
    else []
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "deepagent-research-api"}

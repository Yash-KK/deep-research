from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, chat, jobs

app = FastAPI(
    title="DeepAgent Research API",
    description="Multi-user AI research assistant powered by LangChain DeepAgents",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(chat.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "deepagent-research-api"}

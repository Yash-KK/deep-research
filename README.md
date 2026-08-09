# Deep Research

Ask a question. Get a thorough, source-grounded research report.

Deep Research is a multi-user web app that queues research jobs, searches and scrapes the web, then writes a structured Markdown report with critic feedback — all powered by a LangChain **LCEL** pipeline. A lightweight **Quick Search** chat agent is available for one-off tool-assisted answers.

---

## Screenshots

### Login
<img width="1846" height="1165" alt="image" src="https://github.com/user-attachments/assets/8eee6d5d-2765-4dca-b17e-99b3f2d6721a" />


### Research Page
<img width="1846" height="1165" alt="image" src="https://github.com/user-attachments/assets/b1b24fd8-1847-4b03-9d59-96adb035a155" />


### Report Viewer
<img width="1846" height="1165" alt="image" src="https://github.com/user-attachments/assets/7fbf6164-420a-40f1-a0d7-a8504e81f214" />



---

## Features

- **Google SSO** — sign in and get a JWT-backed session
- **Research queue** — submit questions, track pending / running / completed / failed / cancelled jobs
- **LCEL research pipeline** — Web Search (Tavily) → Scrape (Trafilatura) → writer chain → critic chain
- **Report viewer** — read completed Markdown reports in-app; download as needed
- **Quick Search chat** — streaming ReAct-style agent with web search, calculator, and weather tools
- **Usage limits** — per-user report and chat quotas (editable in PostgreSQL)
- **Soft-deleted reports** — removing a job from the UI does not free a report slot
- **Celery workers** — async research on a dedicated `research` queue
- **Tavily usage** — sidebar shows plan credit usage when available

---

## How research works

```text
Question
   │
   ▼
Web Search (Tavily)
   │
   ▼
Scrape (Trafilatura)
   │
   ▼
Writer chain (LCEL)  ──► Markdown report
   │
   ▼
Critic chain (LCEL)  ──► Feedback appended to the report
```

The pipeline lives in `backend/app/services/agents/research/pipeline.py`. It is a fixed LCEL-style flow (`Prompt | model | StrOutputParser`), not a Deep Agents / open-ended agent loop.

Quick Search chat uses a separate LangGraph-style tool agent (`create_agent`) for short, interactive answers.

---
## Architecture

<img width="1511" height="749" alt="Screenshot from 2026-08-09 18-48-10" src="https://github.com/user-attachments/assets/4974f5b1-3894-4d18-bd7b-0f267dc05f2b" />

Nginx serves the React production build and reverse proxies `/api` requests to FastAPI. FastAPI queues research jobs in Redis, which are processed by Celery workers. FastAPI and Celery use Neon PostgreSQL for persistent data, with systemd managing the application services.

---

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind, Zustand |
| API | FastAPI, SQLAlchemy, Alembic, JWT, Google SSO |
| Workers | Celery, Redis, Flower |
| Database | PostgreSQL |
| LLM / tools | LangChain (LCEL), OpenAI-compatible API, Tavily, Trafilatura |

---

## Project layout

```text
deepagent-research/
├── backend/                 # FastAPI + Celery
│   ├── app/
│   │   ├── api/             # Auth, jobs, chat, Tavily
│   │   ├── services/agents/ # Research pipeline + chat agent
│   │   └── tasks/           # Celery research task
│   ├── alembic/             # Migrations
│   └── run_local.sh         # API + worker + Flower
├── frontend/                # React dashboard
└── notebooks/               # Experiments
```

---

## Prerequisites

- Python **3.12+** and [uv](https://github.com/astral-sh/uv) (or a venv + pip)
- Node.js **18+**
- PostgreSQL
- Redis
- Google OAuth credentials (SSO)
- API keys for your LLM provider and Tavily

---

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with real DATABASE_URL, REDIS_URL, secrets, and API keys

uv sync
# or: python -m venv .venv && source .venv/bin/activate && pip install -e .

uv run alembic upgrade head
```

Key environment variables (see `backend/.env.example`):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis for Celery |
| `SECRET_KEY` | JWT signing |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | SSO |
| `FRONTEND_URL` / `CORS_ORIGINS` | Frontend origin |
| `AIC_*` | LLM model / base URL / API key |
| `TAVILY_API_KEY` | Web search |

Start API, Celery worker, and Flower:

```bash
./run_local.sh
```

- API: [http://localhost:8000](http://localhost:8000)
- Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Flower: [http://localhost:5555](http://localhost:5555)

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:8000/api/v1

npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

---

## Usage

1. Sign in with Google.
2. Submit a research question from the dashboard queue.
3. Watch the job move from pending → running → completed.
4. Open the job to read the report (and critic feedback).
5. Optionally use **Quick Search** for a short tool-assisted answer.

### Quotas

Defaults:

| Field | Default | Notes |
| --- | --- | --- |
| `users.report_limit` | `2` | Soft-deleted jobs still count |
| `users.chat_limit` | `1` | Clearing chat does not reset usage |

```sql
UPDATE users SET report_limit = 5 WHERE email = 'you@example.com';
UPDATE users SET chat_limit = 3, chats_used = 0 WHERE email = 'you@example.com';
```

---

## API overview

| Area | Endpoints |
| --- | --- |
| Auth | `GET /api/v1/auth/login`, `/callback`, `/me` |
| Jobs | `POST/GET /api/v1/jobs/`, get / cancel / delete by id |
| Chat | `POST /api/v1/chat/stream` (SSE) |
| Tavily | `GET /api/v1/tavily/usage` |
| Health | `GET /health` |

---

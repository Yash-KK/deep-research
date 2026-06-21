#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"

for venv in "$BACKEND/deep-webapp-venv" "$BACKEND/.venv" "$BACKEND/venv"; do
  if [[ -f "$venv/bin/activate" ]]; then
    # shellcheck source=/dev/null
    source "$venv/bin/activate"
    break
  fi
done

if ! command -v uvicorn >/dev/null 2>&1 || ! command -v celery >/dev/null 2>&1; then
  echo "uvicorn and celery must be installed. Activate a venv or run: pip install -r backend/requirements.txt"
  exit 1
fi

if [[ ! -f "$BACKEND/.env" ]]; then
  echo "Missing backend/.env — copy backend/.env.example to backend/.env and fill in values."
  exit 1
fi

cd "$BACKEND"

echo "Ensure PostgreSQL and Redis are running locally (see backend/.env)."
echo ""

cleanup() {
  trap - EXIT INT TERM
  echo ""
  echo "Stopping backend and Celery..."
  jobs -p | xargs -r kill 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting Celery worker (queue: research)..."
celery -A app.celery_app.celery worker --loglevel=info --concurrency=4 -Q research &

echo "Starting FastAPI backend at http://localhost:8000"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &

wait -n

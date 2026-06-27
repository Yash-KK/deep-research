#!/usr/bin/env bash
set -euo pipefail

BACKEND="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for venv in "$BACKEND/deep-webapp-venv" "$BACKEND/.venv" "$BACKEND/venv"; do
    if [[ -f "$venv/bin/activate" ]]; then
        source "$venv/bin/activate"
        break
    fi
done

if ! command -v gunicorn >/dev/null 2>&1 || ! command -v celery >/dev/null 2>&1; then
    echo "gunicorn and celery must be installed."
    exit 1
fi

if [[ ! -f "$BACKEND/.env" ]]; then
    echo "Missing .env"
    exit 1
fi

cd "$BACKEND"

mkdir -p logs

echo "Starting Celery..."

nohup celery \
    -A app.celery_app.celery worker \
    --loglevel=info \
    --concurrency=3 \
    -Q research \
    > logs/celery.log 2>&1 &

echo $! > logs/celery.pid

echo "Starting Gunicorn..."

nohup gunicorn app.main:app \
    -k uvicorn.workers.UvicornWorker \
    --workers 1 \
    --bind 127.0.0.1:8010 \
    > logs/gunicorn.log 2>&1 &

echo $! > logs/gunicorn.pid

sleep 2

echo ""
echo "=========================================="
echo "Application started successfully."
echo ""
echo "FastAPI  : http://127.0.0.1:8010"
echo ""
echo "Logs:"
echo "  tail -f logs/gunicorn.log"
echo "  tail -f logs/celery.log"
echo ""
echo "PIDs:"
echo "  Gunicorn -> $(cat logs/gunicorn.pid)"
echo "  Celery   -> $(cat logs/celery.pid)"
echo "=========================================="
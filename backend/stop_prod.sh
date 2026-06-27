#!/usr/bin/env bash
set -euo pipefail

BACKEND="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$BACKEND"

if [[ -f logs/gunicorn.pid ]]; then
    echo "Stopping Gunicorn..."
    kill "$(cat logs/gunicorn.pid)" || true
    rm -f logs/gunicorn.pid
fi

if [[ -f logs/celery.pid ]]; then
    echo "Stopping Celery..."
    kill "$(cat logs/celery.pid)" || true
    rm -f logs/celery.pid
fi

echo "Done."
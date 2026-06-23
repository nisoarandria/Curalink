#!/usr/bin/env sh
set -e
cd "$(dirname "$0")"
python3 -m pip install -q -r requirements.txt
python3 -m uvicorn app.main:app --host "${GATEWAY_HOST:-0.0.0.0}" --port "${GATEWAY_PORT:-8080}" --reload

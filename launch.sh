#!/bin/bash
cd "$(dirname "$0")"
source .venv/bin/activate
python -m http.server 3000 -d frontend &
sleep 1 && open http://localhost:3000 &
cd backend && python -m uvicorn api:app --reload --port 8000

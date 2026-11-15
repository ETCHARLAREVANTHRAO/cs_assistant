@echo off
title My Assistant - Local Backend (FastAPI)
echo ======================================================================
echo   Starting Local Backend on http://localhost:8000
echo   Auto-reload enabled: Any change in backend/ will restart the server.
echo ======================================================================
cd /d "%~dp0backend"
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
    python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
) else (
    echo [ERROR] Virtual environment not found in backend/.venv.
    echo Please install dependencies first with: pip install -r backend/requirements.txt
    pause
)

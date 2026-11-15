@echo off
title My Assistant - Local Dev Launcher
echo ======================================================================
echo           Launching My Assistant Full-Stack Local Development
echo ======================================================================
echo.
echo   1. Starting Local Backend (FastAPI on http://localhost:8000)...
start "My Assistant Backend" cmd /k "%~dp0start-backend.bat"

echo   2. Waiting 2 seconds for backend initialization...
timeout /t 2 /nobreak >nul

echo   3. Starting Local Frontend (Vite React on http://localhost:3000)...
start "My Assistant Frontend" cmd /k "%~dp0start-frontend.bat"

echo.
echo ======================================================================
echo   SUCCESS! Both servers are now running in their own windows:
echo     - Backend API Docs:  http://localhost:8000/docs
echo     - Frontend Web App:  http://localhost:3000
echo.
echo   You can test, tweak, and debug locally with instant hot-reload!
echo   When you're happy with your changes, push to develop and main.
echo ======================================================================
echo.
pause

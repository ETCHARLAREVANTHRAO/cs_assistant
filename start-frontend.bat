@echo off
title My Assistant - Local Frontend (Vite React)
echo ======================================================================
echo   Starting Local Frontend on http://localhost:3000
echo   Hot-Module-Replacement enabled: Any change in frontend-web/ updates instantly!
echo ======================================================================
cd /d "%~dp0frontend-web"
call npm run dev

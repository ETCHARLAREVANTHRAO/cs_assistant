Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "          Launching My Assistant Full-Stack Local Development         " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Start Backend in a separate window
Write-Host "`n1. Starting Local Backend (FastAPI on http://localhost:8000)..." -ForegroundColor Yellow
$backendCmd = "cd '$PSScriptRoot\backend'; if (Test-Path '.\.venv\Scripts\Activate.ps1') { .\.venv\Scripts\Activate.ps1 }; python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Start-Sleep -Seconds 2

# 2. Start Frontend in a separate window
Write-Host "2. Starting Local Frontend (Vite React on http://localhost:3000)..." -ForegroundColor Yellow
$frontendCmd = "cd '$PSScriptRoot\frontend-web'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Start-Sleep -Seconds 2

# 3. Open default browser
Write-Host "3. Opening browser at http://localhost:3000..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host " SUCCESS! Both services are now running in their own windows:" -ForegroundColor Green
Write-Host "   - Backend API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "   - Frontend Web App:  http://localhost:3000" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Green

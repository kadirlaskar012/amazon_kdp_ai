@echo off
echo ===================================================
echo     Starting KDP Intelligence Studio (Localhost)
echo ===================================================

echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "KDP Studio - Backend" cmd /k "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 >nul

echo [2/2] Launching Next.js Frontend on http://localhost:3000 ...
start "KDP Studio - Frontend" cmd /k "cd frontend && npm.cmd run dev"

timeout /t 3 >nul

echo Opening browser...
start http://localhost:3000

echo.
echo KDP Intelligence Studio is now active at http://localhost:3000

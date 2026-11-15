@echo off
echo ========================================================
echo Starting ElderCare AI Full-Stack Platform...
echo ========================================================

start "ElderCare AI Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
start "ElderCare AI Frontend (Vite React)" cmd /k "cd frontend && npm run dev"

echo.
echo Backend running at:  http://127.0.0.1:8000
echo API Documentation at: http://127.0.0.1:8000/docs
echo Frontend running at: http://localhost:5173
echo.
pause

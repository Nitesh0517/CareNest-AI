# ElderCare AI Development Runner
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting ElderCare AI Full-Stack Platform..." -ForegroundColor Green
Write-Host "PromptWars x Catalyst Hackathon Edition" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Services launched successfully!" -ForegroundColor Green
Write-Host "Backend API:  http://127.0.0.1:8000" -ForegroundColor White
Write-Host "Swagger Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "Frontend Web: http://localhost:5173" -ForegroundColor White

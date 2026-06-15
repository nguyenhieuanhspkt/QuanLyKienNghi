@echo off
chcp 65001 >nul
echo Khoi dong QuanLyKienNghi...

start "Backend - FastAPI" cmd /k "cd /d D:\TaskApp_kiet\QuanLyKienNghi\backend && ..\venv\Scripts\uvicorn main:app --reload --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak >nul

start "Frontend - Vite" cmd /k "cd /d D:\TaskApp_kiet\QuanLyKienNghi\frontend && npm run dev"

echo.
echo Backend : http://localhost:8000
echo Frontend: http://localhost:5173
echo Swagger : http://localhost:8000/docs
echo.
echo Dong cua so nay de tat ca hai server.
pause >nul

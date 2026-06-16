@echo off
cd /d "%~dp0backend"
echo =========================================
echo   QuanLyKienNghi - Production Server
echo =========================================
echo.
echo Truy cap tai: http://localhost:8000
echo Dong nghiep truy cap: http://[IP may nay]:8000
echo.
echo De dung server: nhan Ctrl+C
echo.
..\venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000
pause

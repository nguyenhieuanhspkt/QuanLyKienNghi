@echo off
chcp 65001 >nul

:: Lay IP LAN — dung Where-Object <Property> <op> <Value> de tranh $_ bi bat an mat
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object IPAddress -notlike '127.*' | Where-Object IPAddress -notlike '169.254.*' | Select-Object -First 1 -ExpandProperty IPAddress)"`) do set LAN_IP=%%i

echo ============================================
echo  QuanLyKienNghi - Production Server
echo ============================================
echo.
echo  May nay (localhost) : http://localhost:8000
echo  Dong nghiep (LAN)   : http://%LAN_IP%:8000
echo  Swagger UI          : http://%LAN_IP%:8000/docs
echo.
echo  Nhan Ctrl+C de dung server.
echo ============================================
echo.

:: Kiem tra thu muc backend truoc khi lam bat cu dieu gi khac
cd /d D:\TaskApp_kiet\QuanLyKienNghi\backend
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay thu muc backend.
    pause
    exit /b 1
)

:: Kiem tra uvicorn
if not exist "..\venv\Scripts\uvicorn.exe" (
    echo [LOI] Khong tim thay uvicorn tai ..\venv\Scripts\uvicorn.exe
    pause
    exit /b 1
)

:: Tat tien trinh cu dang chiem port 8000 (neu co)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr " :8000 "') do (
    taskkill /pid %%a /f >nul 2>&1
)

:: Chay server
..\venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000
echo.
echo [SERVER DA TAT]
pause

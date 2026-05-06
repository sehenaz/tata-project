@echo off
title TMH PDF Utility Server
color 0A
cd /d "%~dp0"

echo.
echo ========================================
echo   TATA MEMORIAL HOSPITAL
echo   PDF UTILITY SERVER
echo ========================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found! Please install Node.js
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install express cors multer bcryptjs
    echo ✅ Done
    echo.
)

echo 🚀 Starting server...
echo.
echo Share the NETWORK ACCESS IP with other users
echo Press Ctrl+C to stop
echo.

node server.js
pause
<<<<<<< HEAD
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
=======
@echo off
REM Tata Memorial Hospital Server Launcher
REM This batch file starts the Node.js server

echo.
echo ========================================
echo Tata Memorial Hospital Server Launcher
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Make sure to add Node.js to your system PATH
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
    echo.
)

REM Start the server
echo 🚀 Starting Tata Memorial Hospital Server...
echo.
call npm start

pause
>>>>>>> 9e87fc9764fb33a127c3ce98656d272de3028189

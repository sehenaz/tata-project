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

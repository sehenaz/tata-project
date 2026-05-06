@echo off
title TMH PDF Utility - Central Server
color 0A
echo.
echo  =====================================================
echo    TATA MEMORIAL HOSPITAL - PDF Utility Server
echo  =====================================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Node.js is not installed!
    echo.
    echo  Please install Node.js from:
    echo  https://nodejs.org  (Download LTS version)
    echo.
    echo  After installing Node.js, run this file again.
    echo.
    pause
    start https://nodejs.org
    exit /b 1
)

echo  Node.js found! Starting server...
echo.

:: Install dependencies if needed
if not exist node_modules (
    echo  Installing dependencies (first time only)...
    npm install
    echo.
)

:: Start the server
node server.js

pause

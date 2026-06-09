@echo off
title SPORT LOUNGE Control Panel
color 0B
echo =======================================================================
echo               🌿 WELCOME TO SPORT LOUNGE FULLSTACK CONTROL PANEL 🌿
echo =======================================================================
echo.

:: 1. Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not installed! Please install Node.js 20+ first.
    pause
    exit /b
)
echo [OK] Node.js detected.

:: 2. Check Server Dependencies
if not exist "server\node_modules\" (
    echo [INFO] Server dependencies not found. Installing now...
    cd server
    call npm install
    cd ..
) else (
    echo [OK] Server dependencies already installed.
)

:: 3. Check Client Dependencies
if not exist "client\node_modules\" (
    echo [INFO] Client dependencies not found. Installing now...
    cd client
    call npm install
    cd ..
) else (
    echo [OK] Client dependencies already installed.
)

echo.
echo =======================================================================
echo                      🎲 DATABASE SEED ENGINE 🎲
echo =======================================================================
echo.
set /p SEED="Do you want to run the database seeder? (y/n, default: n): "
if /i "%SEED%"=="y" (
    echo.
    echo [INFO] Seeding database...
    cd server
    call npm run seed
    cd ..
) else (
    echo [OK] Skipping database seed.
)

echo.
echo =======================================================================
echo                      🚀 LAUNCHING FULLSTACK 🚀
echo =======================================================================
echo [INFO] Starting Backend Server in a new window...
start "SPORT LOUNGE Server" cmd /k "cd server && npm run dev"

echo [INFO] Starting Frontend Client in a new window...
start "SPORT LOUNGE Client" cmd /k "cd client && npm run dev"

echo [INFO] Waiting for client to spin up...
timeout /t 3 /nobreak >nul

echo [INFO] Opening application in your default browser...
start http://localhost:3000

echo.
echo =======================================================================
echo              🎉 SPORT LOUNGE IS SUCCESSFULLY LAUNCHED! 🎉
echo =======================================================================
echo.
echo Backend is running on: http://localhost:5000
echo Frontend is running on: http://localhost:3000
echo.
echo You can close this Control Panel. The server and client windows will remain open.
echo To stop them, simply close their respective command windows.
echo.
pause

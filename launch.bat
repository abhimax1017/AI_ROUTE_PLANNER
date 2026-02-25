@echo off
TITLE PathFinder AI Launcher
echo ========================================
echo   PATHFINDER AI - ONE-CLICK LAUNCHER
echo ========================================
echo.

:: Get the project root directory
set ROOT_DIR=%~dp0

:: Fix path if Node.js is missing from environment but installed in typical location
set PATH=%PATH%;C:\Program Files\nodejs\;%AppData%\npm

:: 1. Start the Flask Backend in a new window
echo Starting MAS Backend (Logic Engine)...
start "AI_BACKEND" /D "%ROOT_DIR%templates" cmd /k "python app.py || echo ERROR: Backend crashed. Check if Flask is installed. && pause"

:: 2. Start the React Frontend in a new window
echo Starting React Frontend (Visual Map)...
:: Force bypass for PowerShell scripts if npm tries to use them
set "npm_config_shell=cmd.exe"

:: Check if node_modules exists, if not, try to install
if not exist "%ROOT_DIR%route-planner\node_modules\" (
    echo node_modules not found. Installing dependencies (this may take 1-2 minutes)...
    cd /d "%ROOT_DIR%route-planner"
    call npm.cmd install --no-audit --no-fund
)

cd /d "%ROOT_DIR%route-planner"
start "AI_FRONTEND" /D "%ROOT_DIR%route-planner" cmd /k "call npm.cmd run dev || echo ERROR: Could not start Frontend. Please check if Node.js is installed. && pause"

:: 3. Give servers a few seconds to initialize
echo Waiting for servers to initialize (12s)...
timeout /t 12 /nobreak > nul

:: 4. Open the browser automatically
echo Opening PathFinder AI Dashboard...
start http://localhost:5173

echo.
echo ========================================
echo   SYSTEM READY - ENJOY YOUR VOYAGE!
echo ========================================
echo Close the two pop-up terminals to stop.
pause

@echo off
REM LocaCar Development Server Launcher
REM This script starts both backend and frontend

cd /d "%~dp0"

echo ==========================================
echo LocaCar Development Server
echo ==========================================
echo.
echo Starting backend on port 3001...
echo.

REM Start backend in a new window
start "LocaCar Backend" cmd /k npm run backend:dev

REM Wait a bit for backend to start
timeout /t 3 /nobreak

echo.
echo Starting frontend on port 5173...
echo.

REM Start frontend in another new window
start "LocaCar Frontend" cmd /k npm run frontend:dev

echo.
echo ==========================================
echo Services starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173 (or 3000)
echo ==========================================
echo.
pause

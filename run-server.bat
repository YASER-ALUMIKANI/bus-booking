@echo off
setlocal
cd /d "%~dp0"

echo Building frontend... 
npm run build
if errorlevel 1 (
  echo.
  echo [ERROR] Frontend build failed. Fix build issues and run this again.
  exit /b 1
)

echo Starting Flask server at http://127.0.0.1:5000
python server.py
endlocal

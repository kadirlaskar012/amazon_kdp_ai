@echo off
echo ===================================================
echo     KDP Intelligence Studio - Local Windows Setup
echo ===================================================

echo [1/4] Checking Python environment...
python --version
if errorlevel 1 (
    echo [ERROR] Python 3.10+ is required. Please install Python and ensure it is added to PATH.
    pause
    exit /b 1
)

echo [2/4] Checking Node.js environment...
node --version
if errorlevel 1 (
    echo [ERROR] Node.js 18+ is required. Please install Node.js and ensure it is added to PATH.
    pause
    exit /b 1
)

echo [3/4] Installing Python backend dependencies...
python -m pip install -r backend\requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install Python dependencies.
    pause
    exit /b 1
)

echo [4/4] Installing Next.js frontend dependencies...
cd frontend
call npm.cmd install
if errorlevel 1 (
    echo [ERROR] Failed to install npm dependencies.
    cd ..
    pause
    exit /b 1
)
cd ..

if not exist data mkdir data
if not exist reports mkdir reports
if not exist backups mkdir backups

echo.
echo ===================================================
echo   Setup Complete! You can now run start.bat
echo ===================================================
pause

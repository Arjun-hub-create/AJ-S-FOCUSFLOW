@echo off
echo =====================================
echo FocusFlow Installation Script
echo =====================================
echo.

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js found!
echo.

echo [2/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo Dependencies installed successfully!
echo.

echo [3/4] Setting up environment file...
if not exist .env (
    copy .env.example .env
    echo .env file created! Please edit it with your settings.
) else (
    echo .env file already exists. Skipping...
)
echo.

echo [4/4] Installation complete!
echo.
echo =====================================
echo Next Steps:
echo =====================================
echo 1. Make sure MongoDB is running
echo 2. Edit .env file with your settings
echo 3. Run: npm run dev
echo.
echo Or run: install.bat start
echo to start the server now!
echo =====================================
echo.

if "%1"=="start" (
    echo Starting FocusFlow server...
    npm run dev
)

pause

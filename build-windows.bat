@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ==========================================
echo Building Algorithm Practice for Windows
echo WASM-based code execution (Browser-side)
echo ==========================================

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js not found
    echo Please install Node.js: https://nodejs.org
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo [OK] Node.js installed: %NODE_VER%

REM Check if npm is installed
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm not found
    echo Please install npm
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
echo [OK] npm installed: %NPM_VER%

REM Clean previous builds
echo.
echo Cleaning previous builds...
if exist dist rmdir /s /q dist
if exist .next rmdir /s /q .next

REM Install dependencies
echo.
echo Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [OK] Dependencies installed successfully

REM Build Next.js app
echo.
echo Building Next.js application...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Next.js build failed
    exit /b 1
)
echo [OK] Next.js build completed successfully

REM Build Electron app for Windows
echo.
echo Building Electron app for Windows...
echo    Targets: NSIS Installer (x64, ia32), Portable (x64)
call npx electron-builder --config electron-builder.config.js --win
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Electron build failed
    exit /b 1
)

echo.
echo ==========================================
echo [OK] Windows build completed successfully!
echo ==========================================
echo.
echo Output files in 'dist' folder:
dir /b dist\*.exe dist\*.msi 2>nul
echo.

endlocal

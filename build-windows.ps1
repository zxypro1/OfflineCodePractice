# PowerShell script to build Offline Leet Practice for Windows

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Building Algorithm Practice for Windows" -ForegroundColor Cyan
Write-Host "WASM-based code execution (Browser-side)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js not found" -ForegroundColor Red
    Write-Host "Please install Node.js: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: npm not found" -ForegroundColor Red
    Write-Host "Please install npm" -ForegroundColor Yellow
    exit 1
}

# Clean previous builds
Write-Host ""
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green

# Build Next.js app
Write-Host ""
Write-Host "🔨 Building Next.js application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Next.js build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Next.js build completed successfully" -ForegroundColor Green

# Build Electron app for Windows
Write-Host ""
Write-Host "📱 Building Electron app for Windows..." -ForegroundColor Yellow
Write-Host "   Targets: NSIS Installer (x64, ia32), Portable (x64)" -ForegroundColor Gray
npx electron-builder --config electron-builder.config.js --win
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Electron build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Windows build completed successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📁 Output files in 'dist' folder:" -ForegroundColor Yellow
Get-ChildItem dist\*.exe, dist\*.msi 2>$null | ForEach-Object { Write-Host "   $_" }
Write-Host ""

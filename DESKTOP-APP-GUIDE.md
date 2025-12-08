# Desktop Application Build Guide

This guide explains how to build Algorithm Practice as a cross-platform desktop application (supporting Windows, macOS, and Linux).

## Technology Stack

- **Frontend Framework**: Next.js + React
- **Desktop Framework**: Electron
- **Code Execution**: Pure browser-side WASM execution
  - JavaScript: Native browser execution
  - TypeScript: TypeScript compiler transpilation
  - Python: Pyodide (CPython WASM)

## Prerequisites

- Node.js >= 18.x
- npm >= 8.x
- For macOS builds: macOS system
- For Windows builds: Windows system or Wine
- For Linux builds: Linux system or Docker

## Quick Start

### Development Mode

```bash
# Install dependencies
npm install

# Build Next.js
npm run build

# Start Electron in development mode
npm run electron:start
```

### Building Desktop Application

#### macOS

```bash
# Using build script
./build-mac.sh

# Or using npm command
npm run electron:build:mac
```

Output files:
- `dist/Algorithm Practice-x.x.x-macOS-x64.dmg` (Intel Mac)
- `dist/Algorithm Practice-x.x.x-macOS-arm64.dmg` (Apple Silicon)

#### Windows

```powershell
# Using PowerShell script
.\build-windows.ps1

# Or using npm command
npm run electron:build:win
```

Or using batch script:
```cmd
build-windows.bat
```

Output files:
- `dist/Algorithm Practice-x.x.x-Windows-x64.exe` (64-bit installer)
- `dist/Algorithm Practice-x.x.x-Windows-Portable.exe` (portable version)

#### Linux

```bash
npm run electron:build:linux
```

Output files:
- `dist/Algorithm Practice-x.x.x-Linux.AppImage`
- `dist/Algorithm Practice-x.x.x-Linux.deb`
- `dist/Algorithm Practice-x.x.x-Linux.rpm`

#### Build All Platforms

```bash
npm run electron:build:all
```

## Supported Languages

The desktop app uses WASM to execute code in the browser, supporting:

| Language | Status | Implementation |
|----------|--------|----------------|
| JavaScript | ✅ Supported | Native browser |
| TypeScript | ✅ Supported | TypeScript compiler |
| Python | ✅ Supported | Pyodide (WASM) |

**Note**: Java, C, C++, Go and other languages requiring compilers are not supported in the pure browser-side WASM environment.

## Project Structure

```
.
├── electron-main.js          # Electron main process
├── electron-preload.js       # Electron preload script
├── electron-builder.config.js # Build configuration
├── build/
│   └── entitlements.mac.plist # macOS entitlements
├── build-mac.sh              # macOS build script
├── build-windows.ps1         # Windows PowerShell build script
├── build-windows.bat         # Windows batch build script
└── dist/                     # Build output directory
```

## Configuration

### electron-builder.config.js

Key configuration options:

- `appId`: Application ID
- `productName`: Application name
- `files`: Files to include in package
- `win/mac/linux`: Platform-specific configurations

### Environment Variables

The desktop app supports the following AI provider configurations (configured in app settings):

- DeepSeek
- OpenAI
- Qwen
- Claude
- Ollama (local models)

Configuration is saved in `~/.offline-leet-practice/config.json`

## Troubleshooting

### macOS Security Warning

When first opening the app, macOS may show a security warning. Solution:

1. Open "System Preferences" > "Security & Privacy"
2. Click "Open Anyway"

### Windows SmartScreen Warning

Windows may show a SmartScreen warning. Click "More info" > "Run anyway".

### Code Signing

For production, code signing is recommended:

- macOS: Requires Apple Developer certificate
- Windows: Requires EV code signing certificate

## Changelog

### v0.0.9
- Migrated to pure WASM browser-side code execution
- Added TypeScript support
- Removed dependency on server-side Node.js execution
- Improved Electron build configuration

## License

MIT License

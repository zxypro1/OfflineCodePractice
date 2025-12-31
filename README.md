# Offline Algorithm Practice

[中文](./README-zh.md)

Quick links: [Discussions](https://github.com/zxypro1/OfflineLeetPractice/discussions) | [Issues](https://github.com/zxypro1/OfflineLeetPractice/issues) | [Pull Requests](https://github.com/zxypro1/OfflineLeetPractice/pulls)

> A standalone algorithm coding practice application that works 100% offline. No local development environment required — just download, install, and start practicing. Supports JavaScript, TypeScript, and Python with WASM-based browser-side code execution.

<img width="2536" height="1219" alt="2025-08-24165250" src="https://github.com/user-attachments/assets/17846e96-32e8-479f-9193-02a2fc8db017" />

<img width="2545" height="1229" alt="2025-08-24165302" src="https://github.com/user-attachments/assets/93116550-60af-41aa-b0f3-cc2b10fd5ac5" />

## Quick Start

### Desktop Application (Recommended)

The desktop application provides the best experience with zero environment setup required. Simply download and run.

**[Download Latest Release](https://github.com/zxypro1/OfflineCodePractice/releases/latest)**

| Platform | Download |
|----------|----------|
| **macOS** (Apple Silicon) | `Algorithm-Practice-*-macOS-arm64.dmg` |
| **macOS** (Intel) | `Algorithm-Practice-*-macOS-x64.dmg` |
| **Windows** (Installer) | `Algorithm-Practice-*-Windows-Setup.exe` |
| **Windows** (Portable) | `Algorithm-Practice-*-Windows-Portable.exe` |
| **Linux** (AppImage) | `Algorithm-Practice-*-Linux.AppImage` |
| **Linux** (Debian/Ubuntu) | `Algorithm-Practice-*-Linux.deb` |
| **Linux** (Fedora/RHEL) | `Algorithm-Practice-*-Linux.rpm` |

**macOS Users**: If you encounter "App is damaged and can't be opened", run in Terminal:
```bash
xattr -cr "/Applications/Algorithm Practice.app"
```

### Web Version (Alternative)

For developers who prefer running from source, see [Development Setup](#development-setup) below.

## Features

### Core Functionality

- **Standalone Application**: No Node.js, Python, or any development environment required
- **Complete Offline Support**: Works without internet after installation
- **Built-in Problem Library**: 10+ classic algorithm problems included
- **AI Problem Generator**: Generate custom problems using various AI providers
- **WASM Code Execution**: Browser-side execution for JavaScript, TypeScript, and Python
- **Monaco Code Editor**: VS Code-like editing experience with syntax highlighting and autocomplete
- **Instant Testing**: Run tests immediately with detailed results and execution time tracking
- **Cross-platform**: Windows, macOS, and Linux supported

### Supported Languages

| Language | Status | Implementation |
|----------|--------|----------------|
| **JavaScript** | Supported | Native browser execution |
| **TypeScript** | Supported | TypeScript compiler transpilation |
| **Python** | Supported | Pyodide (CPython WASM) |

All code execution happens in the browser using WebAssembly. No server-side execution required.

### AI-Powered Problem Generation

- **Custom Problem Creation**: Describe what you want to practice in natural language
- **Complete Solutions**: Each problem includes working reference solutions
- **Comprehensive Testing**: Auto-generated test cases including edge cases
- **Instant Integration**: Problems automatically added to your local library

## How to Use

### Problem Solving

1. **Browse Problems**: View the problem list with difficulty and tags
2. **Select a Problem**: Click on any problem to open the detail page
3. **Choose Language**: Select JavaScript, TypeScript, or Python
4. **Write Solution**: Use the Monaco editor with full IDE features
5. **Run Tests**: Click "Submit & Run Tests" to execute your code
6. **View Results**: See detailed test results with execution time

### AI Problem Generation

1. **Access Generator**: Click "AI Generator" on the homepage
2. **Describe Requirements**: Enter what type of problem you want
3. **Generate**: AI creates a complete problem with test cases and solutions
4. **Practice**: Generated problem is automatically available in your library

### Settings Configuration

Access the settings page to configure AI providers:

- **Desktop Mode**: Via "Settings" button or application menu
- **Web Mode**: Navigate to `/settings` (e.g., http://localhost:3000/settings)

Supported AI providers:
- DeepSeek
- OpenAI
- Qwen (Alibaba Cloud)
- Claude (Anthropic)
- Ollama (Local)

Configuration is saved to `~/.offline-leet-practice/config.json` in desktop mode. See [AI_PROVIDER_GUIDE.md](./AI_PROVIDER_GUIDE.md) for detailed configuration.

### Adding Custom Problems

1. **Via UI**: Use the "Add Problem" page in the application
2. **JSON Import**: Upload or paste problem data in JSON format
3. **Direct Edit**: Modify `public/problems.json` for immediate changes

See [MODIFY-PROBLEMS-GUIDE.md](./MODIFY-PROBLEMS-GUIDE.md) for the complete guide.

## Development Setup

For developers who want to run from source or contribute to the project.

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- npm 8+

### Running Locally

**Windows:**
```bash
start-local.bat
```

**macOS / Linux:**
```bash
chmod +x start-local.sh
./start-local.sh
```

**Manual Setup:**
```bash
git clone https://github.com/zxypro1/OfflineLeetPractice.git
cd OfflineLeetPractice
npm install
npm run build
npm start
```

Then open http://localhost:3000 in your browser.

### Building Desktop Application

```bash
# macOS
npm run dist:mac

# Windows
npm run dist:win

# Linux
npm run dist:linux

# All platforms
npm run dist:all
```

See [DESKTOP-APP-GUIDE.md](./DESKTOP-APP-GUIDE.md) for detailed build instructions.

## Technology Stack

### Frontend
- **Framework**: React 18, Next.js 13, TypeScript
- **UI Framework**: Mantine v7
- **Code Editor**: Monaco Editor
- **Code Execution**: WebAssembly
  - JavaScript: Native browser `Function` constructor
  - TypeScript: TypeScript compiler (CDN)
  - Python: Pyodide (CPython compiled to WASM)
- **Desktop**: Electron

### Backend (Problem Marketplace)
- **Framework**: Rust + Axum
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT + OAuth (GitHub, Google)
- **Deployment**: Vercel Serverless Functions

👉 **[Backend Documentation](./backend/README.md)** | **[后端文档](./backend/README-zh.md)**

## Project Structure

```
OfflineLeetPractice/
├── pages/                  # Next.js pages and API routes
│   ├── api/
│   │   ├── problems.ts     # Problem data API
│   │   ├── generate-problem.ts
│   │   └── add-problem.ts
│   ├── problems/[id].tsx   # Problem detail page
│   ├── generator.tsx       # AI Generator page
│   └── index.tsx           # Homepage
├── src/
│   ├── components/         # React components
│   └── hooks/
│       └── useWasmExecutor.ts
├── public/
│   └── problems.json       # Problem database
├── electron-main.js        # Electron main process
└── electron-builder.config.js
```

## Contributing

Contributions are welcome. Areas for improvement:

- Additional algorithm problems
- Performance analytics features
- User experience enhancements
- Documentation improvements

## License

MIT License - see the [LICENSE](./LICENSE) file for details.

### Problem Market Content

**All problems uploaded to the Problem Market are automatically licensed under the MIT License.** By uploading content to the Problem Market, you:

- ✅ Grant all users the right to freely use, modify, and distribute your problems
- ✅ Allow commercial use of your content
- ✅ Understand that no permission is required for others to use your problems
- ✅ Retain attribution rights while allowing free usage

For complete terms, see the Terms of Service displayed during registration.

---

**Practice algorithms anywhere — on flights, cruises, or any offline environment.**

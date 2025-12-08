# Algorithm Practice (离线算法练习)

[中文](./README-zh.md)

Quick links: [Discussions](https://github.com/zxypro1/OfflineLeetPractice/discussions) • [Issues](https://github.com/zxypro1/OfflineLeetPractice/issues) • [Pull requests](https://github.com/zxypro1/OfflineLeetPractice/pulls)

> A local-run algorithm coding practice system that lets you browse, code, and test problems 100% offline—perfect for planes, cruises, or any no-internet scenario. Features **WASM-based browser-side code execution** for JavaScript, TypeScript, and Python.

<img width="2536" height="1219" alt="2025-08-24165250" src="https://github.com/user-attachments/assets/17846e96-32e8-479f-9193-02a2fc8db017" />

<img width="2545" height="1229" alt="2025-08-24165302" src="https://github.com/user-attachments/assets/93116550-60af-41aa-b0f3-cc2b10fd5ac5" />

<img width="1236" height="1057" alt="屏幕截图 2025-08-24 210556" src="https://github.com/user-attachments/assets/6c1fe0f2-df1b-4cc9-a78e-8f0d88b87c24" />

## Quick Start

### Prerequisites

- **Node.js** 18+ ([Download here](https://nodejs.org/))
- Any modern web browser

> **Note**: Internet is only required for the initial setup and build. Once built, the application works completely offline.

### Desktop App (Recommended)

For the best offline experience, you can build the desktop application:

#### Build Desktop App

```bash
# macOS
npm run dist:mac

# Windows  
npm run dist:win

# Linux
npm run dist:linux
```

> See [DESKTOP-APP-GUIDE.md](./DESKTOP-APP-GUIDE.md) for detailed instructions.

### One-Click Setup (Web Version)

#### Windows

```bash
# Double-click or run in terminal
start-local.bat
```

Non-interactive usage (CI or automation):

```bash
# Accept defaults and copy from .env.example if present
start-local.bat --yes

# Or set an environment variable (PowerShell)
set START_LOCAL_NONINTERACTIVE=1 && start-local.bat
```

#### macOS / Linux

```bash
# Make executable (first time only)
chmod +x start-local.sh

# Run the startup script
./start-local.sh
```

The scripts will automatically:

1. Check Node.js installation
2. Install dependencies (npm install) - *Requires internet*
3. Build the application (npm run build) - *Requires internet*
4. Start the local server

Then open **http://localhost:3000** in your browser!

> **Note**: After the initial build, you can use the application offline without rebuilding.

### Manual Setup (Alternative)

```bash
# Clone the repository
git clone https://github.com/zxypro1/OfflineLeetPractice.git
cd OfflineLeetPractice

# Install dependencies - Requires internet
npm install

# Build for production - Requires internet
npm run build

# Start the server (works offline)
npm start
```

## Features

### Core Functionality

- **Local Problem Library**: 10+ classic algorithm problems included
- **AI Problem Generator**: Generate unlimited custom problems with various AI providers
- **WASM Code Execution**: Browser-side execution for JavaScript, TypeScript, and Python
- **Monaco Code Editor**: VS Code-like editing experience
- **Instant Testing**: Run tests immediately with detailed results
- **Performance Metrics**: Execution time tracking
- **Dynamic Problem Management**: Add/edit problems without rebuilding
- **Desktop App**: Cross-platform Electron app (Windows, macOS, Linux)

### Supported Languages (WASM Execution)

| Language | Status | Implementation |
|----------|--------|----------------|
| **JavaScript** | ✅ Supported | Native browser execution |
| **TypeScript** | ✅ Supported | TypeScript compiler transpilation |
| **Python** | ✅ Supported | Pyodide (CPython WASM) |

> **Note**: All code execution happens in the browser using WebAssembly, no server-side execution required.

### AI-Powered Problem Generation

- **Custom Problem Creation**: Describe what you want to practice
- **Complete Solutions**: Each problem includes working reference solutions
- **Comprehensive Testing**: Auto-generated test cases including edge cases
- **Instant Integration**: Problems automatically added to your local library

## How to Use

### Basic Problem Solving

1. **Browse Problems**: View the problem list with difficulty and tags
2. **Select a Problem**: Click on any problem to open the detail page
3. **Choose Language**: Select JavaScript, TypeScript, or Python
4. **Code Your Solution**: Use the Monaco editor (supports autocomplete, syntax highlighting)
5. **Run Tests**: Click "Submit & Run Tests" to execute your code
6. **View Results**: See test results with execution time

### AI Problem Generation

1. **Access AI Generator**: Click the "AI Generator" button on the homepage
2. **Describe Your Need**: Enter what type of problem you want
3. **Generate Problem**: AI creates a complete problem with test cases and solutions
4. **Practice Immediately**: Generated problem is auto-added to your library

### Settings Configuration

You can configure AI providers through the settings page, which is accessible in both desktop and web modes:

1. **In Desktop Mode**: Access via the "Settings" button on the loading screen or through the application menu
2. **In Web Mode**: Navigate to `/settings` path (e.g., http://localhost:3000/settings)

The settings page allows you to configure all supported AI providers:
- DeepSeek Cloud Service
- OpenAI
- Qwen (通义千问)
- Claude
- Ollama (Local)

Configuration is saved to your user directory in desktop mode (`~/.offline-leet-practice/config.json`) or simulated in web mode. See [AI_PROVIDER_GUIDE.md](./AI_PROVIDER_GUIDE.md) for detailed instructions.

#### Setting Up AI Features

To use the AI problem generator, you can configure any of these AI providers (or multiple):

##### First-run interactive AI configuration

If no `.env` file exists when you run the provided startup scripts (`start-local.sh` or `start-local.bat`), the script will detect this as a first-time startup and offer to interactively configure AI features for you.

##### Option 1: DeepSeek Cloud Service

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

##### Option 2: OpenAI

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

##### Option 3: Qwen (通义千问)

```bash
QWEN_API_KEY=your_qwen_api_key_here
```

##### Option 4: Claude

```bash
CLAUDE_API_KEY=your_claude_api_key_here
```

##### Option 5: Local Ollama Models

```bash
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=llama3
```

See **`AI_PROVIDER_GUIDE.md`** for more detailed configuration instructions!

### Adding Custom Problems

1. **Manual Addition**: Use the "Add Problem" page for custom problems
2. **JSON Import**: Upload or paste problem data in JSON format
3. **Direct Edit**: Modify `public/problems.json` for immediate changes (no rebuild needed)

## Technology Stack

- **Frontend**: React 18 + Next.js 13 + TypeScript
- **UI Framework**: Mantine v7 (Modern React components)
- **Code Editor**: Monaco Editor (VS Code engine)
- **Code Execution**: WASM-based browser execution
  - JavaScript: Native browser `Function` constructor
  - TypeScript: TypeScript compiler (CDN)
  - Python: Pyodide (CPython compiled to WASM)
- **Desktop App**: Electron

## Project Structure

```
OfflineLeetPractice/
├── pages/                  # Next.js pages and API routes
│   ├── api/
│   │   ├── problems.ts     # Problem data API
│   │   ├── generate-problem.ts # AI problem generation API
│   │   └── add-problem.ts  # Manual problem addition API
│   ├── problems/[id].tsx   # Problem detail page
│   ├── generator.tsx       # AI Generator page
│   ├── add-problem.tsx     # Manual problem addition page
│   └── index.tsx           # Homepage
├── src/
│   ├── components/         # React components
│   │   ├── CodeRunner.tsx  # Code editor and test runner
│   │   └── ...
│   ├── hooks/
│   │   └── useWasmExecutor.ts # WASM code execution hook
│   └── services/           # Service modules
├── problems/
│   └── problems.json       # Local problem database
├── electron-main.js        # Electron main process
├── electron-builder.config.js # Desktop app build config
├── start-local.bat         # Windows startup script
├── start-local.sh          # Unix startup script
└── AI_PROVIDER_GUIDE.md    # AI Provider configuration guide
```

## Customization

### Adding New Problems (No Rebuild Required!) 🎯

**The application supports adding/modifying problems in offline environments without rebuilding!**

1. **Edit the Problem Database**: Open `public/problems.json` in your built application folder
2. **Add Your Problem**: Follow the JSON format (see `MODIFY-PROBLEMS-GUIDE.md` for details)
3. **Save and Refresh**: Changes take effect immediately!

**Example**: Add a new problem by editing `public/problems.json`:

```json
{
  "id": "reverse-string",
  "title": {
    "en": "Reverse String",
    "zh": "反转字符串"
  },
  "difficulty": "Easy",
  "tags": ["string"],
  "description": {
    "en": "Write a function that reverses a string.",
    "zh": "编写一个函数来反转字符串。"
  },
  "template": {
    "js": "function reverseString(s) {\n  // Your code here\n}\nmodule.exports = reverseString;"
  },
  "tests": [
    { "input": "[\"h\",\"e\",\"l\",\"l\",\"o\"]", "output": "[\"o\",\"l\",\"l\",\"e\",\"h\"]" }
  ]
}
```

See **`MODIFY-PROBLEMS-GUIDE.md`** for complete instructions!

## Contributing

We welcome contributions! Areas for improvement:

- **More Problems**: Add classic algorithm challenges
- **Enhanced Features**: Better performance analytics
- **UI Improvements**: Enhanced user experience

## License

MIT License - Feel free to use, modify, and distribute!

---

**Happy Coding at 30,000 feet! ✈️💻**
*Perfect for your next flight, cruise, or anywhere without reliable internet!*

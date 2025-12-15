# 离线算法练习

[English](./README.md)

快速链接: [讨论区](https://github.com/zxypro1/OfflineLeetPractice/discussions) | [Issues](https://github.com/zxypro1/OfflineLeetPractice/issues) | [Pull Requests](https://github.com/zxypro1/OfflineLeetPractice/pulls)

> 一款独立的算法编程练习应用，支持 100% 离线使用。无需配置任何本地开发环境——下载、安装、即可开始练习。支持 JavaScript、TypeScript 和 Python，采用 WASM 浏览器端代码执行。

<img width="2524" height="1223" alt="2025-08-24165202" src="https://github.com/user-attachments/assets/0c5a4952-77c1-41be-9cdc-fd8fe1db4b8a" />

<img width="2542" height="1221" alt="2025-08-2165223" src="https://github.com/user-attachments/assets/5b9298e2-fa5b-4596-9694-733132ea509f" />

<img width="1302" height="1001" alt="2025-08-24210533" src="https://github.com/user-attachments/assets/efa542ae-137a-4150-892b-0608255cef8c" />

## 快速开始

### 桌面应用程序（推荐）

桌面应用提供最佳体验，无需任何环境配置。下载后即可直接运行。

**[下载最新版本](https://github.com/zxypro1/OfflineCodePractice/releases/latest)**

| 平台 | 下载文件 |
|------|----------|
| **macOS** (Apple Silicon) | `Algorithm-Practice-*-macOS-arm64.dmg` |
| **macOS** (Intel) | `Algorithm-Practice-*-macOS-x64.dmg` |
| **Windows** (安装版) | `Algorithm-Practice-*-Windows-Setup.exe` |
| **Windows** (便携版) | `Algorithm-Practice-*-Windows-Portable.exe` |
| **Linux** (AppImage) | `Algorithm-Practice-*-Linux.AppImage` |
| **Linux** (Debian/Ubuntu) | `Algorithm-Practice-*-Linux.deb` |
| **Linux** (Fedora/RHEL) | `Algorithm-Practice-*-Linux.rpm` |

**macOS 用户**：如果提示"应用已损坏，无法打开"，请在终端执行：
```bash
xattr -cr "/Applications/Algorithm Practice.app"
```

### Web 版本（备选方案）

如果您更倾向于从源码运行，请参阅下方的[开发环境配置](#开发环境配置)章节。

## 功能特性

### 核心功能

- **独立应用程序**：无需 Node.js、Python 或任何开发环境
- **完全离线支持**：安装后无需网络即可使用
- **内置题库**：包含 10+ 道经典算法题目
- **AI 题目生成器**：使用多种 AI 服务生成自定义题目
- **WASM 代码执行**：浏览器端执行 JavaScript、TypeScript 和 Python
- **Monaco 代码编辑器**：VS Code 级别的编辑体验，支持语法高亮和自动补全
- **即时测试**：立即运行测试并查看详细结果和执行时间
- **跨平台支持**：支持 Windows、macOS 和 Linux

### 支持的语言

| 语言 | 状态 | 实现方式 |
|------|------|---------|
| **JavaScript** | 支持 | 浏览器原生执行 |
| **TypeScript** | 支持 | TypeScript 编译器转译 |
| **Python** | 支持 | Pyodide (CPython WASM) |

所有代码执行都在浏览器端通过 WebAssembly 完成，无需服务器端执行。

### AI 智能题目生成

- **自定义题目创建**：用自然语言描述想要练习的内容
- **完整解法**：每个题目都包含可运行的参考解法
- **全面测试**：自动生成包括边界情况的测试用例
- **即时集成**：题目自动添加到本地题库

## 使用方法

### 题目练习

1. **浏览题目**：查看包含难度和标签的题目列表
2. **选择题目**：点击任意题目打开详情页面
3. **选择语言**：选择 JavaScript、TypeScript 或 Python
4. **编写解法**：使用具备完整 IDE 功能的 Monaco 编辑器
5. **运行测试**：点击"提交并运行测试"执行代码
6. **查看结果**：查看详细测试结果和执行时间

### AI 题目生成

1. **访问生成器**：点击首页的"AI 生成器"按钮
2. **描述需求**：输入想要的题目类型
3. **生成题目**：AI 创建包含测试用例和解法的完整题目
4. **开始练习**：生成的题目自动出现在题库中

### 设置配置

访问设置页面配置 AI 服务商：

- **桌面模式**：通过"设置"按钮或应用程序菜单访问
- **Web 模式**：导航到 `/settings`（例如：http://localhost:3000/settings）

支持的 AI 服务商：
- DeepSeek
- OpenAI
- Qwen（通义千问）
- Claude（Anthropic）
- Ollama（本地部署）

桌面模式下配置保存在 `~/.offline-leet-practice/config.json`。详细配置请参阅 [AI_PROVIDER_GUIDE.md](./AI_PROVIDER_GUIDE.md)。

### 添加自定义题目

1. **通过界面**：使用应用内的"添加题目"页面
2. **JSON 导入**：上传或粘贴 JSON 格式的题目数据
3. **直接编辑**：修改 `public/problems.json` 即时生效

完整指南请参阅 [MODIFY-PROBLEMS-GUIDE.md](./MODIFY-PROBLEMS-GUIDE.md)。

## 开发环境配置

适用于希望从源码运行或参与项目开发的开发者。

### 前置要求

- Node.js 18+（[下载](https://nodejs.org/)）
- npm 8+

### 本地运行

**Windows：**
```bash
start-local.bat
```

**macOS / Linux：**
```bash
chmod +x start-local.sh
./start-local.sh
```

**手动配置：**
```bash
git clone https://github.com/zxypro1/OfflineLeetPractice.git
cd OfflineLeetPractice
npm install
npm run build
npm start
```

然后在浏览器中打开 http://localhost:3000。

### 构建桌面应用

```bash
# macOS
npm run dist:mac

# Windows
npm run dist:win

# Linux
npm run dist:linux

# 所有平台
npm run dist:all
```

详细构建说明请参阅 [DESKTOP-APP-GUIDE-zh.md](./DESKTOP-APP-GUIDE-zh.md)。

## 技术栈

- **前端框架**：React 18、Next.js 13、TypeScript
- **UI 框架**：Mantine v7
- **代码编辑器**：Monaco Editor
- **代码执行**：WebAssembly
  - JavaScript：浏览器原生 `Function` 构造函数
  - TypeScript：TypeScript 编译器（CDN）
  - Python：Pyodide（CPython 编译为 WASM）
- **桌面框架**：Electron

## 项目结构

```
OfflineLeetPractice/
├── pages/                  # Next.js 页面和 API 路由
│   ├── api/
│   │   ├── problems.ts     # 题目数据 API
│   │   ├── generate-problem.ts
│   │   └── add-problem.ts
│   ├── problems/[id].tsx   # 题目详情页面
│   ├── generator.tsx       # AI 生成器页面
│   └── index.tsx           # 首页
├── src/
│   ├── components/         # React 组件
│   └── hooks/
│       └── useWasmExecutor.ts
├── public/
│   └── problems.json       # 题目数据库
├── electron-main.js        # Electron 主进程
└── electron-builder.config.js
```

## 贡献

欢迎贡献。改进方向包括：

- 添加更多算法题目
- 性能分析功能
- 用户体验优化
- 文档完善

## 许可证

MIT License

---

**随时随地练习算法——飞机上、游轮上，或任何离线环境。**

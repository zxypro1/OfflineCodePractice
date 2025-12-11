# 离线算法练习 (Algorithm Practice)

快速链接: [讨论区](https://github.com/zxypro1/OfflineLeetPractice/discussions) • [Issues](https://github.com/zxypro1/OfflineLeetPractice/issues) • [Pull requests](https://github.com/zxypro1/OfflineLeetPractice/pulls)

> 本地运行的算法编程练习系统，让你在 100% 离线环境下浏览、编码和测试算法题目——非常适合飞机上、游轮上或任何无网络场景。采用 **WASM 浏览器端代码执行**，支持 JavaScript、TypeScript 和 Python。

<img width="2524" height="1223" alt="2025-08-24165202" src="https://github.com/user-attachments/assets/0c5a4952-77c1-41be-9cdc-fd8fe1db4b8a" />

<img width="2542" height="1221" alt="2025-08-2165223" src="https://github.com/user-attachments/assets/5b9298e2-fa5b-4596-9694-733132ea509f" />

<img width="1302" height="1001" alt="2025-08-24210533" src="https://github.com/user-attachments/assets/efa542ae-137a-4150-892b-0608255cef8c" />

## 快速开始

### 系统要求

- **Node.js** 18+ ([点击下载](https://nodejs.org/))
- 任意现代网页浏览器

> **注意**: 仅在首次设置和构建时需要网络连接。构建完成后，应用可完全离线使用。

### 桌面应用程序（推荐）

为了获得最佳的离线体验，可以直接下载预构建的桌面应用：

#### 📥 下载安装

**[⬇️ 下载最新版本](https://github.com/zxypro1/OfflineCodePractice/releases/latest)**

| 平台 | 下载文件 |
|------|----------|
| **macOS** (Apple Silicon) | `Algorithm-Practice-*-macOS-arm64.dmg` |
| **macOS** (Intel) | `Algorithm-Practice-*-macOS-x64.dmg` |
| **Windows** (安装版) | `Algorithm-Practice-*-Windows-Setup.exe` |
| **Windows** (便携版) | `Algorithm-Practice-*-Windows-Portable.exe` |
| **Linux** (AppImage) | `Algorithm-Practice-*-Linux.AppImage` |
| **Linux** (Debian/Ubuntu) | `Algorithm-Practice-*-Linux.deb` |
| **Linux** (Fedora/RHEL) | `Algorithm-Practice-*-Linux.rpm` |

#### 从源码构建

您也可以自行从源码构建桌面应用：

```bash
# macOS
npm run dist:mac

# Windows  
npm run dist:win

# Linux
npm run dist:linux
```

> 有关详细构建说明，请参见 [DESKTOP-APP-GUIDE-zh.md](./DESKTOP-APP-GUIDE-zh.md)。

### 一键启动（Web 版本）

#### Windows 用户

```bash
# 双击运行或在终端中执行
start-local.bat
```

非交互模式（用于 CI 或自动化）：

```bash
REM 接受默认并优先从 .env.example 复制
start-local.bat --yes

REM 或在 PowerShell 中设置环境变量
set START_LOCAL_NONINTERACTIVE=1 && start-local.bat
```

#### macOS / Linux 用户

```bash
# 首次使用需要赋予执行权限
chmod +x start-local.sh

# 运行启动脚本
./start-local.sh
```

启动脚本会自动：

1. 检查 Node.js 安装
2. 安装依赖 (npm install) - *需要网络*
3. 构建应用 (npm run build) - *需要网络*
4. 启动本地服务器

然后在浏览器中打开 **http://localhost:3000** 即可！

> **注意**: 首次构建完成后，您可以离线使用应用而无需重新构建。

### 手动安装（备选方案）

```bash
# 克隆仓库
git clone https://github.com/zxypro1/OfflineLeetPractice.git
cd OfflineLeetPractice

# 安装依赖 - 需要网络
npm install

# 构建生产版本 - 需要网络
npm run build

# 启动服务器（可离线工作）
npm start
```

## 功能特性

### 核心功能

- **本地题库**: 内置 10+ 道经典算法题目
- **AI 题目生成器**: 使用多种 AI 提供商生成无限自定义题目
- **WASM 代码执行**: 浏览器端执行 JavaScript、TypeScript 和 Python
- **Monaco 代码编辑器**: VS Code 级别的编辑体验
- **即时测试**: 立即运行测试并查看详细结果
- **性能指标**: 执行时间跟踪
- **动态题目管理**: 无需重新构建即可添加/编辑题目
- **桌面应用**: 跨平台 Electron 应用（Windows、macOS、Linux）

### 支持的语言（WASM 执行）

| 语言 | 状态 | 实现方式 |
|------|------|---------|
| **JavaScript** | ✅ 支持 | 浏览器原生执行 |
| **TypeScript** | ✅ 支持 | TypeScript 编译器转译 |
| **Python** | ✅ 支持 | Pyodide (CPython WASM) |

> **注意**: 所有代码执行都在浏览器端使用 WebAssembly 完成，无需服务器端执行。

### AI 智能题目生成

- **自定义题目创建**: 用中文描述你想练习的内容
- **完整解法**: 每个题目都包含工作的参考解法
- **全面测试**: 自动生成包括边界情况的测试用例
- **即时集成**: 题目自动添加到你的本地库中

## 使用方法

### 基本题目解决

1. **浏览题目**: 查看包含难度和标签的题目列表
2. **选择题目**: 点击任意题目打开详情页面
3. **选择语言**: 选择 JavaScript、TypeScript 或 Python
4. **编写解法**: 使用 Monaco 编辑器（支持自动补全、语法高亮）
5. **运行测试**: 点击"提交并运行测试"执行你的代码
6. **查看结果**: 查看测试结果和执行时间

### AI 题目生成

1. **访问 AI 生成器**: 点击首页的"AI 生成器"按钮
2. **描述你的需求**: 输入你想要的题目类型
3. **生成题目**: AI 创建包含测试用例和解法的完整题目
4. **立即练习**: 生成的题目自动添加到你的库中

### 设置配置

您可以通过设置页面配置 AI 提供商，该页面在桌面和网页模式下均可访问：

1. **桌面模式**: 通过加载屏幕上的"设置"按钮或应用程序菜单访问
2. **网页模式**: 导航到 `/settings` 路径 (例如: http://localhost:3000/settings)

设置页面允许您配置所有支持的 AI 提供商：

- DeepSeek 云服务
- OpenAI
- Qwen (通义千问)
- Claude
- Ollama (本地)

在桌面模式下，配置保存到您的用户目录 (`~/.offline-leet-practice/config.json`)。详细说明请参见 [AI_PROVIDER_GUIDE.md](./AI_PROVIDER_GUIDE.md)。

#### AI 功能设置

要使用 AI 题目生成器，您可以配置以下任一 AI 提供商（或多个）：

##### 首次启动的交互式 AI 配置

当您运行启动脚本（`start-local.sh` 或 `start-local.bat`）且项目中不存在 `.env` 文件时，脚本会提供交互式配置 AI 的选项。

##### 选项 1：DeepSeek 云服务

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

##### 选项 2：OpenAI

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

##### 选项 3：Qwen (通义千问)

```bash
QWEN_API_KEY=your_qwen_api_key_here
```

##### 选项 4：Claude

```bash
CLAUDE_API_KEY=your_claude_api_key_here
```

##### 选项 5：本地 Ollama 模型

```bash
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=llama3
```

查看 **`AI_PROVIDER_GUIDE.md`** 获取更详细的配置说明！

### 添加自定义题目

1. **手动添加**: 使用"添加题目"页面添加自定义题目
2. **JSON 导入**: 上传或粘贴 JSON 格式的题目数据
3. **直接编辑**: 修改 `public/problems.json` 即时生效（无需重新构建）

## 技术栈

- **前端**: React 18 + Next.js 13 + TypeScript
- **UI 框架**: Mantine v7 (现代 React 组件)
- **代码编辑器**: Monaco Editor (VS Code 引擎)
- **代码执行**: WASM 浏览器端执行
  - JavaScript: 浏览器原生 `Function` 构造函数
  - TypeScript: TypeScript 编译器 (CDN)
  - Python: Pyodide (CPython 编译为 WASM)
- **桌面应用**: Electron

## 项目结构

```
OfflineLeetPractice/
├── pages/                  # Next.js 页面和 API 路由
│   ├── api/
│   │   ├── problems.ts     # 题目数据 API
│   │   ├── generate-problem.ts # AI 题目生成 API
│   │   └── add-problem.ts  # 手动添加题目 API
│   ├── problems/[id].tsx   # 题目详情页面
│   ├── generator.tsx       # AI 生成器页面
│   ├── add-problem.tsx     # 手动添加题目页面
│   └── index.tsx           # 首页
├── src/
│   ├── components/         # React 组件
│   │   ├── CodeRunner.tsx  # 代码编辑器和测试运行器
│   │   └── ...
│   ├── hooks/
│   │   └── useWasmExecutor.ts # WASM 代码执行 Hook
│   └── services/           # 服务模块
├── problems/
│   └── problems.json       # 本地题目数据库
├── electron-main.js        # Electron 主进程
├── electron-builder.config.js # 桌面应用构建配置
├── start-local.bat         # Windows 启动脚本
├── start-local.sh          # Unix 启动脚本
└── AI_PROVIDER_GUIDE.md    # AI 提供商配置指南
```

## 自定义

### 添加新题目（无需重新构建！）🎯

**应用支持在离线环境下添加/修改题目，无需重新构建！**

1. **编辑题目数据库**: 在构建后的应用文件夹中打开 `public/problems.json`
2. **添加你的题目**: 按照 JSON 格式（详见 `MODIFY-PROBLEMS-GUIDE.md`）
3. **保存并刷新**: 更改立即生效！

**例子**: 通过编辑 `public/problems.json` 添加新题目：

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
    "js": "function reverseString(s) {\n  // 你的代码\n}\nmodule.exports = reverseString;"
  },
  "tests": [
    { "input": "[\"h\",\"e\",\"l\",\"l\",\"o\"]", "output": "[\"o\",\"l\",\"l\",\"e\",\"h\"]" }
  ]
}
```

查看 **`MODIFY-PROBLEMS-GUIDE.md`** 获取完整说明！

## 贡献

我们欢迎贡献！改进方向：

- **更多题目**: 添加经典算法挑战
- **增强功能**: 更好的性能分析
- **UI 改进**: 增强用户体验

## 许可证

MIT 许可证 - 随意使用、修改和分发！

---

**在 30,000 英尺高空愉快编程！ ✈️💻**

*完美适用于你的下一次飞行、游轮旅行或任何没有可靠网络的地方！*

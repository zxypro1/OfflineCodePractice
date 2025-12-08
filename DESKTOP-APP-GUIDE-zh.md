# 桌面应用构建指南

本指南介绍如何将离线算法练习应用构建为跨平台桌面应用（支持 Windows、macOS 和 Linux）。

## 技术架构

- **前端框架**: Next.js + React
- **桌面框架**: Electron
- **代码执行**: 纯浏览器端 WASM 执行
  - JavaScript: 原生浏览器执行
  - TypeScript: TypeScript 编译器转译后执行
  - Python: Pyodide (CPython WASM)

## 前置要求

- Node.js >= 18.x
- npm >= 8.x
- 对于 macOS 构建: macOS 系统
- 对于 Windows 构建: Windows 系统或 Wine
- 对于 Linux 构建: Linux 系统或 Docker

## 快速开始

### 开发模式

```bash
# 安装依赖
npm install

# 构建 Next.js
npm run build

# 启动 Electron 开发模式
npm run electron:start
```

### 构建桌面应用

#### macOS

```bash
# 使用构建脚本
./build-mac.sh

# 或使用 npm 命令
npm run electron:build:mac
```

输出文件:
- `dist/Algorithm Practice-x.x.x-macOS-x64.dmg` (Intel Mac)
- `dist/Algorithm Practice-x.x.x-macOS-arm64.dmg` (Apple Silicon)

#### Windows

```powershell
# 使用 PowerShell 脚本
.\build-windows.ps1

# 或使用 npm 命令
npm run electron:build:win
```

或使用批处理脚本:
```cmd
build-windows.bat
```

输出文件:
- `dist/Algorithm Practice-x.x.x-Windows-x64.exe` (64位安装包)
- `dist/Algorithm Practice-x.x.x-Windows-Portable.exe` (便携版)

#### Linux

```bash
npm run electron:build:linux
```

输出文件:
- `dist/Algorithm Practice-x.x.x-Linux.AppImage`
- `dist/Algorithm Practice-x.x.x-Linux.deb`
- `dist/Algorithm Practice-x.x.x-Linux.rpm`

#### 构建所有平台

```bash
npm run electron:build:all
```

## 支持的语言

桌面应用使用 WASM 在浏览器端执行代码，支持以下语言:

| 语言 | 状态 | 实现方式 |
|------|------|---------|
| JavaScript | ✅ 支持 | 浏览器原生 |
| TypeScript | ✅ 支持 | TypeScript 编译器 |
| Python | ✅ 支持 | Pyodide (WASM) |

**注意**: Java、C、C++、Go 等语言因为需要编译器，在纯浏览器端 WASM 环境中不支持。

## 项目结构

```
.
├── electron-main.js          # Electron 主进程
├── electron-preload.js       # Electron 预加载脚本
├── electron-builder.config.js # 构建配置
├── build/
│   └── entitlements.mac.plist # macOS 权限配置
├── build-mac.sh              # macOS 构建脚本
├── build-windows.ps1         # Windows PowerShell 构建脚本
├── build-windows.bat         # Windows 批处理构建脚本
└── dist/                     # 构建输出目录
```

## 配置说明

### electron-builder.config.js

主要配置项:

- `appId`: 应用程序 ID
- `productName`: 应用名称
- `files`: 打包文件列表
- `win/mac/linux`: 各平台特定配置

### 环境变量

桌面应用支持以下 AI 提供者配置（在应用设置页面配置）:

- DeepSeek
- OpenAI
- Qwen (通义千问)
- Claude
- Ollama (本地模型)

配置保存在 `~/.offline-leet-practice/config.json`

## 故障排除

### macOS 安全警告

首次打开应用时，macOS 可能会显示安全警告。解决方法:

1. 打开 "系统偏好设置" > "安全性与隐私"
2. 点击 "仍要打开"

### Windows SmartScreen 警告

Windows 可能会显示 SmartScreen 警告。点击 "更多信息" > "仍要运行"。

### 代码签名

生产环境建议进行代码签名:

- macOS: 需要 Apple Developer 证书
- Windows: 需要 EV 代码签名证书

## 更新日志

### v0.0.9
- 迁移到纯 WASM 浏览器端代码执行
- 新增 TypeScript 支持
- 移除对服务器端 Node.js 执行的依赖
- 改进 Electron 构建配置

## 许可证

MIT License

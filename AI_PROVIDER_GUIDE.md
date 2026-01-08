# AI Provider Configuration Guide

This guide explains how to configure AI model providers for the problem generation feature in AlgoLocal.

## Accessing Settings

### Desktop Application

- Click "Navigation" > "Settings" in the application menu
- Click the "Settings" button on the loading screen

### Web Version

Navigate to `/settings` (e.g., http://localhost:3000/settings)

## Supported Providers

The application supports multiple AI providers. You can configure one or more, and the system will automatically select the best available option.

### DeepSeek

**Configuration:**
- **API Key**: Obtain from [DeepSeek Platform](https://platform.deepseek.com/)
- **Model**: Default `deepseek-chat`
- **Timeout**: Default 30000ms
- **Max Tokens**: Default 4000

**Environment Variables:**
```bash
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_MODEL=deepseek-chat  # optional
```

### OpenAI

**Configuration:**
- **API Key**: Obtain from [OpenAI Platform](https://platform.openai.com/)
- **Model**: Default `gpt-4-turbo`

**Environment Variables:**
```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4-turbo  # optional
```

### Qwen (Alibaba Cloud)

**Configuration:**
- **API Key**: Obtain from [DashScope Console](https://dashscope.console.aliyun.com/)
- **Model**: Default `qwen-turbo`

**Environment Variables:**
```bash
QWEN_API_KEY=your_api_key_here
QWEN_MODEL=qwen-turbo  # optional
```

### Claude (Anthropic)

**Configuration:**
- **API Key**: Obtain from [Anthropic Console](https://console.anthropic.com/)
- **Model**: Default `claude-3-haiku-20240307`

**Environment Variables:**
```bash
CLAUDE_API_KEY=your_api_key_here
CLAUDE_MODEL=claude-3-haiku-20240307  # optional
```

### Ollama (Local)

**Prerequisites:**
1. Install Ollama from https://ollama.com/
2. Download a model: `ollama pull llama3`

**Configuration:**
- **Endpoint**: Default `http://localhost:11434`
- **Model**: Default `llama3`

**Environment Variables:**
```bash
OLLAMA_ENDPOINT=http://localhost:11434  # optional
OLLAMA_MODEL=llama3  # optional
```

## Configuration Methods

### Method 1: Settings Page (Recommended for Desktop)

1. Open the application
2. Navigate to Settings
3. Configure your preferred providers
4. Click "Save Configuration"

Configuration is stored in `~/.offline-leet-practice/config.json`.

### Method 2: Environment File (For Web/Development)

Create `.env.local` in the project root:

```bash
# DeepSeek
DEEPSEEK_API_KEY=your_key

# OpenAI
OPENAI_API_KEY=your_key

# Qwen
QWEN_API_KEY=your_key

# Claude
CLAUDE_API_KEY=your_key

# Ollama
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=llama3
```

### Method 3: System Environment Variables

**Windows (PowerShell):**
```powershell
$env:DEEPSEEK_API_KEY="your_key"
```

**Windows (Command Prompt):**
```cmd
set DEEPSEEK_API_KEY=your_key
```

**macOS/Linux:**
```bash
export DEEPSEEK_API_KEY="your_key"
```

## Provider Priority

When multiple providers are configured, the system selects in this order:

1. Ollama (local)
2. OpenAI
3. Claude
4. Qwen
5. DeepSeek

You can manually select a provider in the AI Generator interface.

## First-Run Configuration

When running the startup scripts (`start-local.sh` or `start-local.bat`) without an existing `.env` file, the script offers interactive configuration:

- Choose whether to enable AI features
- Select and configure each provider
- Defaults are provided for quick setup

Non-interactive mode (CI/automation):
```bash
# Use --yes flag or environment variable
start-local.bat --yes
# or
set START_LOCAL_NONINTERACTIVE=1
```

## Using AI Generator

1. Navigate to the AI Generator page
2. Enter your problem request, for example:
   - "Generate a medium difficulty array manipulation problem"
   - "我想做一道动态规划题目"
   - "Create a binary search problem with edge cases"
3. Click "Generate Problem"
4. The generated problem is automatically added to your library

### Features

- **Bilingual Support**: English and Chinese requests
- **Multi-language Templates**: JavaScript, Python, Java, C++, C
- **Complete Solutions**: Each problem includes reference solutions
- **Comprehensive Test Cases**: Including edge cases
- **Difficulty Control**: Specify in your request
- **Algorithm Targeting**: Request specific algorithm types

## Security Notes

- Keep API keys secure and never commit them to version control
- `.env.local` is automatically ignored by Git
- API calls are made server-side to protect keys
- Sensitive variables are never exposed to the frontend

## Troubleshooting

### API Key Not Found

- Verify the environment variable is set correctly
- Restart the development server after changes
- Check that `.env.local` is in the project root

### Ollama Connection Error

- Ensure Ollama is running: `ollama serve`
- Verify the endpoint is correct
- Check that the model is downloaded: `ollama list`
- Pull the model if needed: `ollama pull llama3`

### API Rate Limits

- Verify your API key is valid and active
- Check your account for usage limits
- Ensure sufficient credits/quota

### Generation Errors

- The AI generates problems in a specific JSON format
- If parsing fails, try rephrasing your request
- Be more specific about problem requirements

## Example Requests

**Dynamic Programming (Chinese):**
```
我想做一道中等难度的动态规划题目，关于最优子结构
```

**Array Manipulation (English):**
```
Generate a medium difficulty array manipulation problem using two pointers technique
```

**String Processing (Mixed):**
```
创建一个关于字符串处理的题目，使用sliding window算法
```

## API Reference

**Endpoint:** `/api/generate-problem`

**Method:** POST

**Body:**
```json
{
  "request": "your problem description"
}
```

**Response:** Generated problem data or error message

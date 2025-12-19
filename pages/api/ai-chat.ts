import { NextApiRequest, NextApiResponse } from 'next';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIProviderConfig {
  deepSeek?: { apiKey: string; model: string; timeout?: string; maxTokens?: string };
  openAI?: { apiKey: string; model: string };
  qwen?: { apiKey: string; model: string };
  claude?: { apiKey: string; model: string };
  ollama?: { endpoint: string; model: string };
  selectedProvider?: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  problem: {
    id: string;
    title: { en: string; zh: string };
    description: { en: string; zh: string };
    difficulty: string;
    tags: string[];
  };
  language: 'en' | 'zh';
  provider?: string;
  config?: AIProviderConfig;
  currentCode?: string;
  codeLanguage?: string;
  stream?: boolean;
}

function writeStreamHeaders(res: NextApiResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });
  // Next.js response may have flushHeaders in some runtimes
  (res as any).flushHeaders?.();
}

async function streamSSEFromProvider(upstream: Response, onChunk: (text: string) => void) {
  const reader = upstream.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';
    for (const part of parts) {
      const lines = part.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const delta = json?.choices?.[0]?.delta?.content ?? json?.choices?.[0]?.message?.content ?? '';
          if (delta) onChunk(delta);
        } catch {
          // ignore parse errors for non-json lines
        }
      }
    }
  }
}

async function streamOllamaNDJSON(upstream: Response, onChunk: (text: string) => void) {
  const reader = upstream.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      try {
        const json = JSON.parse(t);
        const chunk = json?.message?.content || '';
        if (chunk) onChunk(chunk);
        if (json?.done) return;
      } catch {
        // ignore
      }
    }
  }
}

// AI Provider API functions
async function callDeepSeekChat(messages: ChatMessage[], apiKey: string, model: string): Promise<string> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callOpenAIChat(messages: ChatMessage[], apiKey: string, model: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callQwenChat(messages: ChatMessage[], apiKey: string, model: string): Promise<string> {
  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'qwen-turbo',
      input: { messages },
      parameters: { temperature: 0.7, max_tokens: 2000 }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Qwen API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.output.text;
}

async function callClaudeChat(messages: ChatMessage[], apiKey: string, model: string): Promise<string> {
  // Claude API requires messages without system role in the messages array
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const chatMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-3-haiku-20240307',
      system: systemMessage,
      messages: chatMessages,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callOllamaChat(messages: ChatMessage[], endpoint: string, model: string): Promise<string> {
  const response = await fetch(`${endpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || 'llama3',
      messages: messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.message.content;
}

function getSystemPrompt(language: 'en' | 'zh'): string {
  if (language === 'zh') {
    return `你是一个专业的算法导师和编程助手。你的任务是帮助用户理解和解决算法题目。

你可以访问：
- 题目的完整描述和要求
- 用户当前在编辑器中的代码（如果有的话）

你可以：
1. 提供解题思路和提示
2. 解释算法概念和数据结构
3. 分析时间和空间复杂度
4. 帮助用户调试和优化他们的代码
5. 指出用户代码中的错误或改进点
6. 提供循序渐进的引导

请使用中文回复。使用 Markdown 格式来组织你的回复，包括代码块、列表等。`;
  }
  
  return `You are a professional algorithm tutor and programming assistant. Your task is to help users understand and solve algorithm problems.

You have access to:
- The complete problem description and requirements
- The user's current code in the editor (if available)

You can:
1. Provide hints and approaches
2. Explain algorithm concepts and data structures
3. Analyze time and space complexity
4. Help users debug and optimize their code
5. Point out errors or improvements in the user's code
6. Provide step-by-step guidance

Please respond in English. Use Markdown formatting for your responses, including code blocks, lists, etc.`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, problem, language, provider, config, currentCode, codeLanguage, stream } = req.body as ChatRequest;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Build the full message array with system prompt and problem context
    const problemContext = language === 'zh' 
      ? `当前题目：${problem.title.zh}\n难度：${problem.difficulty}\n标签：${problem.tags.join(', ')}\n\n题目描述：\n${problem.description.zh}`
      : `Current Problem: ${problem.title.en}\nDifficulty: ${problem.difficulty}\nTags: ${problem.tags.join(', ')}\n\nDescription:\n${problem.description.en}`;

    // Build code context if available
    let codeContext = '';
    if (currentCode && currentCode.trim()) {
      codeContext = language === 'zh'
        ? `\n\n用户当前的代码 (${codeLanguage || 'unknown'}):\n\`\`\`${codeLanguage || ''}\n${currentCode}\n\`\`\``
        : `\n\nUser's Current Code (${codeLanguage || 'unknown'}):\n\`\`\`${codeLanguage || ''}\n${currentCode}\n\`\`\``;
    }

    const fullMessages: ChatMessage[] = [
      { role: 'system', content: getSystemPrompt(language) },
      { role: 'system', content: problemContext + codeContext },
      ...messages
    ];

    // Determine which provider to use
    // Priority: explicit provider param > config.selectedProvider > auto
    const selectedProviderChoice = provider || config?.selectedProvider || 'auto';
    let response: string;

    // Get API keys and configs - prefer config from frontend, fallback to environment
    const deepseekKey = config?.deepSeek?.apiKey || process.env.DEEPSEEK_API_KEY;
    const deepseekModel = config?.deepSeek?.model || process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    const openaiKey = config?.openAI?.apiKey || process.env.OPENAI_API_KEY;
    const openaiModel = config?.openAI?.model || process.env.OPENAI_MODEL || 'gpt-4-turbo';
    const qwenKey = config?.qwen?.apiKey || process.env.QWEN_API_KEY;
    const qwenModel = config?.qwen?.model || process.env.QWEN_MODEL || 'qwen-turbo';
    const claudeKey = config?.claude?.apiKey || process.env.CLAUDE_API_KEY;
    const claudeModel = config?.claude?.model || process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307';
    const ollamaEndpoint = config?.ollama?.endpoint || process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
    const ollamaModel = config?.ollama?.model || process.env.OLLAMA_MODEL || 'llama3';

    const wantsStream = stream !== false;
    if (wantsStream) {
      writeStreamHeaders(res);
    }

    if (selectedProviderChoice === 'deepseek' && deepseekKey) {
      if (wantsStream) {
        const upstream = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
          body: JSON.stringify({
            model: deepseekModel || 'deepseek-chat',
            messages: fullMessages,
            temperature: 0.7,
            max_tokens: 2000,
            stream: true,
          }),
        });
        if (!upstream.ok) {
          const errorText = await upstream.text();
          if (!res.headersSent) return res.status(500).json({ error: errorText });
          res.write(errorText);
          return res.end();
        }
        await streamSSEFromProvider(upstream, (t) => res.write(t));
        return res.end();
      }

      response = await callDeepSeekChat(fullMessages, deepseekKey, deepseekModel);
    } else if (selectedProviderChoice === 'openai' && openaiKey) {
      if (wantsStream) {
        const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
          body: JSON.stringify({
            model: openaiModel || 'gpt-4-turbo',
            messages: fullMessages,
            temperature: 0.7,
            max_tokens: 2000,
            stream: true,
          }),
        });
        if (!upstream.ok) {
          const errorText = await upstream.text();
          if (!res.headersSent) return res.status(500).json({ error: errorText });
          res.write(errorText);
          return res.end();
        }
        await streamSSEFromProvider(upstream, (t) => res.write(t));
        return res.end();
      }

      response = await callOpenAIChat(fullMessages, openaiKey, openaiModel);
    } else if (selectedProviderChoice === 'qwen' && qwenKey) {
      response = await callQwenChat(fullMessages, qwenKey, qwenModel);
    } else if (selectedProviderChoice === 'claude' && claudeKey) {
      response = await callClaudeChat(fullMessages, claudeKey, claudeModel);
    } else if (selectedProviderChoice === 'ollama' && ollamaEndpoint) {
      if (wantsStream) {
        const upstream = await fetch(`${ollamaEndpoint}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel || 'llama3',
            messages: fullMessages,
            stream: true,
          }),
        });
        if (!upstream.ok) {
          const errorText = await upstream.text();
          if (!res.headersSent) return res.status(500).json({ error: errorText });
          res.write(errorText);
          return res.end();
        }
        await streamOllamaNDJSON(upstream, (t) => res.write(t));
        return res.end();
      }

      response = await callOllamaChat(fullMessages, ollamaEndpoint, ollamaModel);
    } else if (selectedProviderChoice === 'auto') {
      // Auto-select first available provider
      if (deepseekKey) {
        if (wantsStream) {
          const upstream = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
            body: JSON.stringify({
              model: deepseekModel || 'deepseek-chat',
              messages: fullMessages,
              temperature: 0.7,
              max_tokens: 2000,
              stream: true,
            }),
          });
          if (!upstream.ok) {
            const errorText = await upstream.text();
            if (!res.headersSent) return res.status(500).json({ error: errorText });
            res.write(errorText);
            return res.end();
          }
          await streamSSEFromProvider(upstream, (t) => res.write(t));
          return res.end();
        }

        response = await callDeepSeekChat(fullMessages, deepseekKey, deepseekModel);
      } else if (openaiKey) {
        if (wantsStream) {
          const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
            body: JSON.stringify({
              model: openaiModel || 'gpt-4-turbo',
              messages: fullMessages,
              temperature: 0.7,
              max_tokens: 2000,
              stream: true,
            }),
          });
          if (!upstream.ok) {
            const errorText = await upstream.text();
            if (!res.headersSent) return res.status(500).json({ error: errorText });
            res.write(errorText);
            return res.end();
          }
          await streamSSEFromProvider(upstream, (t) => res.write(t));
          return res.end();
        }

        response = await callOpenAIChat(fullMessages, openaiKey, openaiModel);
      } else if (qwenKey) {
        response = await callQwenChat(fullMessages, qwenKey, qwenModel);
      } else if (claudeKey) {
        response = await callClaudeChat(fullMessages, claudeKey, claudeModel);
      } else if (ollamaEndpoint) {
        if (wantsStream) {
          const upstream = await fetch(`${ollamaEndpoint}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: ollamaModel || 'llama3',
              messages: fullMessages,
              stream: true,
            }),
          });
          if (!upstream.ok) {
            const errorText = await upstream.text();
            if (!res.headersSent) return res.status(500).json({ error: errorText });
            res.write(errorText);
            return res.end();
          }
          await streamOllamaNDJSON(upstream, (t) => res.write(t));
          return res.end();
        }

        response = await callOllamaChat(fullMessages, ollamaEndpoint, ollamaModel);
      } else {
        return res.status(400).json({ error: 'No AI provider configured. Please configure an AI provider in Settings.' });
      }
    } else {
      return res.status(400).json({ error: 'No AI provider configured or selected provider not available' });
    }

    if (wantsStream) {
      res.write(response);
      return res.end();
    }

    res.status(200).json({ message: response, role: 'assistant' });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to get AI response' });
  }
}


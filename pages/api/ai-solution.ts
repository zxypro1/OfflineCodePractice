import { NextApiRequest, NextApiResponse } from 'next';

interface AIProviderConfig {
  deepSeek?: { apiKey: string; model: string; timeout?: string; maxTokens?: string };
  openAI?: { apiKey: string; model: string };
  qwen?: { apiKey: string; model: string };
  claude?: { apiKey: string; model: string };
  ollama?: { endpoint: string; model: string };
  selectedProvider?: string;
}

interface SolutionRequest {
  problem: {
    id: string;
    title: { en: string; zh: string };
    description: { en: string; zh: string };
    difficulty: string;
    tags: string[];
    examples?: Array<{ input: string; output: string }>;
    tests?: Array<{ input: string; output: string }>;
  };
  language: 'en' | 'zh';
  codeLanguage: 'javascript' | 'typescript' | 'python';
  provider?: string;
  config?: AIProviderConfig;
  stream?: boolean;
}

// AI Provider API functions
async function callDeepSeekAPI(prompt: string, systemPrompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callOpenAIAPI(prompt: string, systemPrompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callQwenAPI(prompt: string, systemPrompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'qwen-turbo',
      input: {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      },
      parameters: { temperature: 0.7, max_tokens: 8000 }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Qwen API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.output.text;
}

async function callClaudeAPI(prompt: string, systemPrompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-3-haiku-20240307',
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callOllamaAPI(prompt: string, systemPrompt: string, endpoint: string, model: string): Promise<string> {
  const response = await fetch(`${endpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || 'llama3',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
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

function getSystemPrompt(language: 'en' | 'zh', codeLanguage: string): string {
  const langName = {
    javascript: 'JavaScript',
    typescript: 'TypeScript', 
    python: 'Python'
  }[codeLanguage] || 'JavaScript';

  if (language === 'zh') {
    return `你是一个专业的算法专家和编程导师。请为给定的算法题目生成“同一份代码文件里包含多个解法”的答案。

要求：
1. 使用 ${langName} 语言编写代码
2. 在同一份代码里提供 2-3 个不同的解法（如：暴力法、优化解法、最优解法），用清晰的注释分隔每个解法
3. 每个解法都要包含详细的中文注释（思路 + 复杂度 + 关键实现点）
4. 代码必须是可运行的、正确的
5. 使用清晰的变量命名和代码结构

代码格式要求：
- JavaScript/TypeScript: 使用 module.exports = functionName 导出
- Python: 定义一个名为 solution 的函数

输出要求：
- 只输出代码本体（不要输出任何 JSON / Markdown 解释性文字）
- 建议在文件顶部给出“解法对比总结”注释，然后依次给出解法 1/2/3
- 最后导出你认为最推荐的那个解法（其余解法保留为不同函数名/实现块即可）。`;
  }
  
  return `You are a professional algorithm expert and programming tutor. Generate a single code file that contains multiple solutions for the given algorithm problem.

Requirements:
1. Write code in ${langName}
2. Provide 2-3 different solutions (e.g., brute force, optimized, optimal) in the SAME file, clearly separated by comments
3. Each solution must include detailed comments (approach + complexity + key points)
4. Code must be runnable and correct
5. Use clear variable naming and code structure

Code format requirements:
- JavaScript/TypeScript: Use module.exports = functionName to export
- Python: Define a function named solution

Output:
- Return ONLY the code (no JSON / no extra prose)
- Put a short comparison summary in comments at the top
- Finally export the recommended implementation (keep other implementations as alternate functions/blocks).`;
}

function buildPrompt(problem: SolutionRequest['problem'], language: 'en' | 'zh', codeLanguage: string): string {
  const title = language === 'zh' ? problem.title.zh : problem.title.en;
  const description = language === 'zh' ? problem.description.zh : problem.description.en;
  
  let prompt = language === 'zh' 
    ? `请为以下算法题目生成“同一份代码文件里包含多个解法”的答案（2-3个解法 + 对比总结注释）：

题目：${title}
难度：${problem.difficulty}
标签：${problem.tags.join(', ')}

题目描述：
${description}`
    : `Please generate a single code file that contains multiple solutions (2-3) for the following algorithm problem, with a comparison summary in comments:

Problem: ${title}
Difficulty: ${problem.difficulty}
Tags: ${problem.tags.join(', ')}

Description:
${description}`;

  if (problem.examples && problem.examples.length > 0) {
    prompt += language === 'zh' ? '\n\n示例：' : '\n\nExamples:';
    problem.examples.forEach((ex, i) => {
      prompt += `\n${language === 'zh' ? '输入' : 'Input'}: ${ex.input}`;
      prompt += `\n${language === 'zh' ? '输出' : 'Output'}: ${ex.output}\n`;
    });
  }

  return prompt;
}

function cleanCode(code: string): string {
  const trimmed = (code || '').trim();
  const codeBlockMatch = trimmed.match(/```(?:javascript|typescript|python|js|ts|py)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  return trimmed;
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

    // SSE frames separated by \n\n
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { problem, language, codeLanguage, provider, config, stream } = req.body as SolutionRequest;

    if (!problem) {
      return res.status(400).json({ error: 'Problem data is required' });
    }

    const systemPrompt = getSystemPrompt(language || 'en', codeLanguage || 'javascript');
    const prompt = buildPrompt(problem, language || 'en', codeLanguage || 'javascript');

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
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 8000,
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

      response = await callDeepSeekAPI(prompt, systemPrompt, deepseekKey, deepseekModel);
    } else if (selectedProviderChoice === 'openai' && openaiKey) {
      if (wantsStream) {
        const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
          body: JSON.stringify({
            model: openaiModel || 'gpt-4-turbo',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 8000,
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

      response = await callOpenAIAPI(prompt, systemPrompt, openaiKey, openaiModel);
    } else if (selectedProviderChoice === 'qwen' && qwenKey) {
      response = await callQwenAPI(prompt, systemPrompt, qwenKey, qwenModel);
    } else if (selectedProviderChoice === 'claude' && claudeKey) {
      response = await callClaudeAPI(prompt, systemPrompt, claudeKey, claudeModel);
    } else if (selectedProviderChoice === 'ollama' && ollamaEndpoint) {
      if (wantsStream) {
        const upstream = await fetch(`${ollamaEndpoint}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel || 'llama3',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
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

      response = await callOllamaAPI(prompt, systemPrompt, ollamaEndpoint, ollamaModel);
    } else if (selectedProviderChoice === 'auto') {
      // Auto-select first available provider
      if (deepseekKey) {
        if (wantsStream) {
          const upstream = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
            body: JSON.stringify({
              model: deepseekModel || 'deepseek-chat',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
              ],
              temperature: 0.7,
              max_tokens: 8000,
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
        response = await callDeepSeekAPI(prompt, systemPrompt, deepseekKey, deepseekModel);
      } else if (openaiKey) {
        if (wantsStream) {
          const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
            body: JSON.stringify({
              model: openaiModel || 'gpt-4-turbo',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
              ],
              temperature: 0.7,
              max_tokens: 8000,
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
        response = await callOpenAIAPI(prompt, systemPrompt, openaiKey, openaiModel);
      } else if (qwenKey) {
        response = await callQwenAPI(prompt, systemPrompt, qwenKey, qwenModel);
      } else if (claudeKey) {
        response = await callClaudeAPI(prompt, systemPrompt, claudeKey, claudeModel);
      } else if (ollamaEndpoint) {
        if (wantsStream) {
          const upstream = await fetch(`${ollamaEndpoint}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: ollamaModel || 'llama3',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
              ],
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
        response = await callOllamaAPI(prompt, systemPrompt, ollamaEndpoint, ollamaModel);
      } else {
        return res.status(400).json({ error: 'No AI provider configured. Please configure an AI provider in Settings.' });
      }
    } else {
      return res.status(400).json({ error: 'No AI provider configured or selected provider not available' });
    }

    const code = cleanCode(response);
    if (wantsStream) {
      res.write(code);
      return res.end();
    }
    res.status(200).json({ code });
  } catch (error: any) {
    console.error('AI Solution error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate solution' });
  }
}


/**
 * React Hook for WASM Code Execution
 * 在浏览器端使用 WebAssembly 执行代码
 * 
 * JavaScript: 使用 Function 构造函数执行
 * TypeScript: 使用 TypeScript 编译器转译后执行
 * Python: 使用 Pyodide WASM
 */
import { useState, useCallback } from 'react';

export interface WasmExecutionResult {
  output: string;
  error: string;
  executionTime: number;
  success: boolean;
}

export interface TestResult {
  input: string;
  expected: any;
  actual: any;
  passed: boolean;
  executionTime: number;
  error: string | null;
}

export interface RunTestsResult {
  status: 'success' | 'error';
  total: number;
  passed: number;
  results: TestResult[];
  performance: {
    totalExecutionTime: number;
    averageExecutionTime: number;
    memoryUsage: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
  };
  error?: string;
}

// WASM 运行时状态
interface WasmRuntimeState {
  pyodide: any;
  pyodideLoading: boolean;
  pyodideError: string | null;
  typescript: any;
  typescriptLoading: boolean;
  typescriptError: string | null;
}

// 全局运行时缓存
let globalRuntime: WasmRuntimeState = {
  pyodide: null,
  pyodideLoading: false,
  pyodideError: null,
  typescript: null,
  typescriptLoading: false,
  typescriptError: null,
};

/**
 * 使用 Function 构造函数安全执行 JavaScript 代码
 * 比 iframe 更可靠，适用于用户自己编写的代码
 */
function executeCode(code: string): any {
  try {
    // 使用 Function 构造函数创建一个新的函数作用域
    const fn = new Function(code);
    const result = fn();
    return result;
  } catch (error) {
    console.error('executeCode error:', error);
    console.error('Code:', code);
    throw error;
  }
}

/**
 * 加载 TypeScript 编译器
 */
async function loadTypeScript(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('TypeScript can only be loaded in browser environment');
  }

  if (globalRuntime.typescript) {
    return globalRuntime.typescript;
  }

  if (globalRuntime.typescriptLoading) {
    return new Promise((resolve, reject) => {
      const checkLoaded = setInterval(() => {
        if (globalRuntime.typescript) {
          clearInterval(checkLoaded);
          resolve(globalRuntime.typescript);
        }
        if (globalRuntime.typescriptError) {
          clearInterval(checkLoaded);
          reject(new Error(globalRuntime.typescriptError));
        }
      }, 100);
    });
  }

  globalRuntime.typescriptLoading = true;

  try {
    // 动态加载 TypeScript 编译器
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/typescript@5.3.3/lib/typescript.min.js';
    
    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load TypeScript'));
      document.head.appendChild(script);
    });

    globalRuntime.typescript = (window as any).ts;
    globalRuntime.typescriptLoading = false;
    return globalRuntime.typescript;
  } catch (error: any) {
    globalRuntime.typescriptError = error.message;
    globalRuntime.typescriptLoading = false;
    throw error;
  }
}

/**
 * 将 TypeScript 代码转译为 JavaScript
 */
async function transpileTypeScript(code: string): Promise<string> {
  const ts = await loadTypeScript();
  
  const result = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      strict: false,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    }
  });
  
  return result.outputText;
}

/**
 * 加载 Pyodide 运行时
 */
async function loadPyodide(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Pyodide can only be loaded in browser environment');
  }

  if (globalRuntime.pyodide) {
    return globalRuntime.pyodide;
  }

  if (globalRuntime.pyodideLoading) {
    return new Promise((resolve, reject) => {
      const checkLoaded = setInterval(() => {
        if (globalRuntime.pyodide) {
          clearInterval(checkLoaded);
          resolve(globalRuntime.pyodide);
        }
        if (globalRuntime.pyodideError) {
          clearInterval(checkLoaded);
          reject(new Error(globalRuntime.pyodideError));
        }
      }, 100);
    });
  }

  globalRuntime.pyodideLoading = true;

  try {
    // 动态加载 Pyodide 脚本
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
    
    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Pyodide script'));
      document.head.appendChild(script);
    });

    // @ts-ignore - loadPyodide 来自 CDN 脚本
    globalRuntime.pyodide = await (window as any).loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
    });
    globalRuntime.pyodideLoading = false;
    return globalRuntime.pyodide;
  } catch (error: any) {
    globalRuntime.pyodideError = error.message;
    globalRuntime.pyodideLoading = false;
    throw error;
  }
}

/**
 * 执行 JavaScript 代码（使用 Function 构造函数）
 */
async function executeJavaScript(
  code: string,
  args: any[],
  isLinkedListProblem: boolean = false
): Promise<{ result: any; error: string | null; executionTime: number }> {
  const startTime = performance.now();

  try {
    const jsCode = `
      ${isLinkedListProblem ? `
      function ListNode(val, next) {
        this.val = (val === undefined ? 0 : val);
        this.next = (next === undefined ? null : next);
      }

      function arrayToLinkedList(arr) {
        if (!arr || arr.length === 0) return null;
        var head = new ListNode(arr[0]);
        var current = head;
        for (var i = 1; i < arr.length; i++) {
          current.next = new ListNode(arr[i]);
          current = current.next;
        }
        return head;
      }

      function linkedListToArray(head) {
        var result = [];
        var current = head;
        while (current) {
          result.push(current.val);
          current = current.next;
        }
        return result;
      }
      ` : ''}

      var userExports = null;
      (function() {
        var module = { exports: null };
        ${code}
        userExports = module.exports;
      })();

      if (typeof userExports !== 'function') {
        throw new Error('Must use module.exports = yourFunction to export function');
      }

      var args = ${JSON.stringify(args)};
      
      ${isLinkedListProblem ? `
      var processedArgs = args.map(function(arg) {
        if (Array.isArray(arg)) {
          return arrayToLinkedList(arg);
        }
        return arg;
      });
      var rawResult = userExports.apply(null, processedArgs);
      return linkedListToArray(rawResult);
      ` : `
      return userExports.apply(null, args);
      `}
    `;

    console.log('Executing JS code with args:', args);
    const result = executeCode(jsCode);
    console.log('Execution result:', result);
    const executionTime = performance.now() - startTime;

    return {
      result,
      error: null,
      executionTime
    };
  } catch (error: any) {
    const executionTime = performance.now() - startTime;
    return {
      result: null,
      error: error.message || String(error),
      executionTime
    };
  }
}

/**
 * 执行 TypeScript 代码（先转译为 JS 再执行）
 */
async function executeTypeScript(
  code: string,
  args: any[],
  isLinkedListProblem: boolean = false
): Promise<{ result: any; error: string | null; executionTime: number }> {
  const startTime = performance.now();

  try {
    // 先转译 TypeScript 为 JavaScript
    const jsCode = await transpileTypeScript(code);
    
    // 然后使用 JavaScript 执行逻辑
    return await executeJavaScript(jsCode, args, isLinkedListProblem);
  } catch (error: any) {
    const executionTime = performance.now() - startTime;
    return {
      result: null,
      error: `TypeScript Error: ${error.message || String(error)}`,
      executionTime
    };
  }
}

/**
 * 执行 Python 代码
 */
async function executePython(
  code: string,
  args: any[],
  functionName: string = 'solution'
): Promise<{ result: any; error: string | null; executionTime: number }> {
  const startTime = performance.now();

  try {
    const pyodide = await loadPyodide();

    // 准备测试代码
    const argsJson = JSON.stringify(args).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    
    const testCode = `
import json
import sys
from io import StringIO

# 重置输出
_stdout_backup = sys.stdout
_stderr_backup = sys.stderr
sys.stdout = StringIO()
sys.stderr = StringIO()

_result = None
_error = None

try:
${code.split('\n').map(line => '    ' + line).join('\n')}

    # 执行测试
    _args = json.loads('${argsJson}')
    if len(_args) == 1:
        _result = ${functionName}(_args[0])
    else:
        _result = ${functionName}(*_args)
except Exception as e:
    _error = str(e)

_stdout_content = sys.stdout.getvalue()
_stderr_content = sys.stderr.getvalue()

sys.stdout = _stdout_backup
sys.stderr = _stderr_backup

{
    "result": _result if _error is None else None,
    "error": _error,
    "stdout": _stdout_content,
    "stderr": _stderr_content
}
    `;

    const output = await pyodide.runPythonAsync(testCode);
    const executionTime = performance.now() - startTime;

    // 将 Python 对象转换为 JS
    const jsOutput = output.toJs ? output.toJs({ dict_converter: Object.fromEntries }) : output;
    
    if (jsOutput.error) {
      return {
        result: null,
        error: jsOutput.error,
        executionTime
      };
    }

    // 递归转换 Map 为普通对象
    const convertResult = (val: any): any => {
      if (val instanceof Map) {
        const obj: any = {};
        val.forEach((v, k) => {
          obj[k] = convertResult(v);
        });
        return obj;
      }
      if (Array.isArray(val)) {
        return val.map(convertResult);
      }
      return val;
    };

    return {
      result: convertResult(jsOutput.result),
      error: null,
      executionTime
    };
  } catch (error: any) {
    const executionTime = performance.now() - startTime;
    return {
      result: null,
      error: error.message || String(error),
      executionTime
    };
  }
}

/**
 * 从模板提取函数名
 */
function extractFunctionName(template: string, language: string): string {
  switch (language) {
    case 'python': {
      const match = template.match(/def\s+(\w+)\s*\(/);
      return match ? match[1] : 'solution';
    }
    case 'javascript':
    case 'typescript': {
      const match = template.match(/function\s+(\w+)\s*[<(]/) || 
                   template.match(/(\w+)\s*=\s*function/) ||
                   template.match(/(\w+)\s*=\s*[<(]/) ||
                   template.match(/const\s+(\w+)\s*=/);
      return match ? match[1] : 'solution';
    }
    default:
      return 'solution';
  }
}

/**
 * 解析测试输入
 */
function parseTestInput(input: string): any[] {
  try {
    // 处理多个参数的情况
    if (input.includes(',')) {
      const parts = splitCommaNotInBrackets(input);
      return parts.map(part => JSON.parse(part.trim()));
    } else {
      return [JSON.parse(input)];
    }
  } catch {
    return [input];
  }
}

/**
 * 分割逗号但不分割括号内的逗号
 */
function splitCommaNotInBrackets(str: string): string[] {
  const result: string[] = [];
  let current = '';
  let bracketCount = 0;
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if ((char === '"' || char === "'") && str[i - 1] !== '\\') {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
      }
    }

    if (!inQuotes) {
      if (char === '[' || char === '(' || char === '{') {
        bracketCount++;
      } else if (char === ']' || char === ')' || char === '}') {
        bracketCount--;
      }
    }

    if (char === ',' && bracketCount === 0 && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

/**
 * 深度比较两个值
 */
function deepEqual(a: any, b: any): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return a === b;
}

/**
 * WASM 执行器 Hook
 */
export function useWasmExecutor() {
  const [isLoading, setIsLoading] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState<{
    javascript: 'idle' | 'loading' | 'ready' | 'error';
    typescript: 'idle' | 'loading' | 'ready' | 'error';
    python: 'idle' | 'loading' | 'ready' | 'error';
  }>({
    javascript: 'ready', // JavaScript 原生支持，无需预加载
    typescript: 'idle',  // TypeScript 需要加载编译器
    python: 'idle'       // Python 需要加载 Pyodide
  });

  /**
   * 预加载运行时
   */
  const preloadRuntime = useCallback(async (language: string) => {
    // JavaScript 原生支持，无需预加载
    if (language === 'javascript') {
      setRuntimeStatus(prev => ({ ...prev, javascript: 'ready' }));
      return;
    }
    
    // TypeScript 需要加载编译器
    if (language === 'typescript') {
      if (runtimeStatus.typescript === 'ready') return;
      setRuntimeStatus(prev => ({ ...prev, typescript: 'loading' }));
      try {
        await loadTypeScript();
        setRuntimeStatus(prev => ({ ...prev, typescript: 'ready' }));
      } catch {
        setRuntimeStatus(prev => ({ ...prev, typescript: 'error' }));
      }
      return;
    }
    
    // Python 需要加载 Pyodide
    if (language === 'python') {
      if (runtimeStatus.python === 'ready') return;
      setRuntimeStatus(prev => ({ ...prev, python: 'loading' }));
      try {
        await loadPyodide();
        setRuntimeStatus(prev => ({ ...prev, python: 'ready' }));
      } catch {
        setRuntimeStatus(prev => ({ ...prev, python: 'error' }));
      }
    }
  }, [runtimeStatus]);

  /**
   * 运行测试（纯 WASM 执行）
   */
  const runTests = useCallback(async (
    problem: any,
    code: string,
    language: string
  ): Promise<RunTestsResult> => {
    setIsLoading(true);
    const totalStartTime = performance.now();
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

    try {
      // 验证语言是否支持
      const supportedLanguages = ['javascript', 'typescript', 'python'];
      if (!supportedLanguages.includes(language)) {
        throw new Error(`Language "${language}" is not supported. Supported languages: ${supportedLanguages.join(', ')}`);
      }

      const tests = problem.tests || [];
      const results: TestResult[] = [];
      let passedCount = 0;

      const isLinkedListProblem = problem.tags?.includes('linked-list');
      const templateKey = language === 'javascript' ? 'js' : language;
      const functionName = extractFunctionName(
        problem.template?.[templateKey] || '',
        language
      );

      for (const test of tests) {
        try {
          const args = parseTestInput(test.input);
          const expected = JSON.parse(test.output);

          let execResult;
          
          if (language === 'javascript') {
            execResult = await executeJavaScript(code, args, isLinkedListProblem);
          } else if (language === 'typescript') {
            execResult = await executeTypeScript(code, args, isLinkedListProblem);
          } else if (language === 'python') {
            execResult = await executePython(code, args, functionName);
          } else {
            throw new Error(`Unsupported language: ${language}`);
          }

          if (execResult.error) {
            results.push({
              input: test.input,
              expected,
              actual: null,
              passed: false,
              executionTime: execResult.executionTime,
              error: execResult.error
            });
          } else {
            const passed = deepEqual(execResult.result, expected);
            if (passed) passedCount++;

            results.push({
              input: test.input,
              expected,
              actual: execResult.result,
              passed,
              executionTime: execResult.executionTime,
              error: null
            });
          }
        } catch (error: any) {
          results.push({
            input: test.input,
            expected: JSON.parse(test.output),
            actual: null,
            passed: false,
            executionTime: 0,
            error: error.message || String(error)
          });
        }
      }

      const totalExecutionTime = performance.now() - totalStartTime;
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryUsed = Math.max(0, finalMemory - initialMemory);

      setIsLoading(false);

      return {
        status: 'success',
        total: tests.length,
        passed: passedCount,
        results,
        performance: {
          totalExecutionTime: Math.round(totalExecutionTime),
          averageExecutionTime: tests.length > 0 ? Math.round(totalExecutionTime / tests.length * 100) / 100 : 0,
          memoryUsage: {
            heapUsed: Math.round(memoryUsed / 1024 / 1024 * 100) / 100,
            heapTotal: Math.round(finalMemory / 1024 / 1024 * 100) / 100,
            external: 0,
            rss: Math.round(finalMemory / 1024 / 1024 * 100) / 100
          }
        }
      };
    } catch (error: any) {
      setIsLoading(false);
      return {
        status: 'error',
        total: 0,
        passed: 0,
        results: [],
        performance: {
          totalExecutionTime: 0,
          averageExecutionTime: 0,
          memoryUsage: { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 }
        },
        error: error.message || String(error)
      };
    }
  }, []);

  /**
   * 获取支持的语言列表
   */
  const getSupportedLanguages = useCallback((): string[] => {
    return ['javascript', 'typescript', 'python'];
  }, []);

  return {
    runTests,
    isLoading,
    runtimeStatus,
    preloadRuntime,
    getSupportedLanguages
  };
}

export default useWasmExecutor;


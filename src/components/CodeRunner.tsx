import React, { useState, useEffect, useCallback } from 'react';
import { 
  Button, 
  Paper, 
  Text, 
  Title, 
  Stack,
  Group, 
  Badge, 
  LoadingOverlay,
  Alert,
  Code,
  Select,
  Tooltip,
  Modal,
  Loader
} from '@mantine/core';
import { IconWand } from '@tabler/icons-react';
import Editor from '@monaco-editor/react';
import { useTranslation, useI18n } from '../contexts/I18nContext';
import { useTheme } from '../contexts/ThemeContext';
import { useWasmExecutor } from '../hooks/useWasmExecutor';

interface AIProviderConfig {
  deepSeek?: { apiKey: string; model: string; timeout?: string; maxTokens?: string };
  openAI?: { apiKey: string; model: string };
  qwen?: { apiKey: string; model: string };
  claude?: { apiKey: string; model: string };
  ollama?: { endpoint: string; model: string };
  selectedProvider?: string;
}

// WASM 支持的语言配置
const WASM_SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', monacoLang: 'javascript', templateKey: 'js' },
  { value: 'typescript', label: 'TypeScript', monacoLang: 'typescript', templateKey: 'typescript' },
  { value: 'python', label: 'Python', monacoLang: 'python', templateKey: 'python' }
];

// Format output results
function formatOutput(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') return `${value}`;
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return `[${value.map(formatOutput).join(',')}]`;
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

interface CodeRunnerProps {
  problem: any;
  onTestResult?: (result: any) => void;
  showResults?: boolean;
  onCodeChange?: (code: string, language: string) => void;
}

export default function CodeRunner({ problem, onTestResult, showResults = true, onCodeChange }: CodeRunnerProps) {
  const { t } = useTranslation();
  const { locale } = useI18n();
  const { colorScheme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // AI Solution state
  const [isGeneratingSolution, setIsGeneratingSolution] = useState(false);
  const [solutionError, setSolutionError] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIProviderConfig | null>(null);
  
  // WASM 执行器 hook
  const { runTests: runWasmTests, runtimeStatus, preloadRuntime } = useWasmExecutor();

  // Load AI configuration
  const loadAIConfig = useCallback(async () => {
    try {
      // Check if running in Electron
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const result = await (window as any).electronAPI.loadConfiguration();
        if (result.success && result.data) {
          setAiConfig(result.data);
        }
      } else {
        // Web mode: Load from localStorage
        const savedConfig = localStorage.getItem('ai-provider-config');
        if (savedConfig) {
          setAiConfig(JSON.parse(savedConfig));
        }
      }
    } catch (err) {
      console.error('Failed to load AI config:', err);
    }
  }, []);

  useEffect(() => {
    loadAIConfig();
  }, [loadAIConfig]);
  
  // 预加载选中语言的 WASM 运行时
  useEffect(() => {
    preloadRuntime(selectedLanguage);
  }, [selectedLanguage, preloadRuntime]);
  
  // Update code when language changes
  useEffect(() => {
    const langConfig = WASM_SUPPORTED_LANGUAGES.find(l => l.value === selectedLanguage);
    const templateKey = langConfig?.templateKey || 'js';
    let template = problem.template?.[templateKey];
    
    // Fallback to 'js' template for JavaScript compatibility
    if (!template && selectedLanguage === 'javascript' && problem.template?.js) {
      template = problem.template.js;
    }
    
    // TypeScript can use JavaScript template as base (since TS is superset of JS)
    if (!template && selectedLanguage === 'typescript' && problem.template?.js) {
      // Convert JS template to TS by adding type annotations hint
      template = problem.template.js;
    }
    
    setCode(template || '');
  }, [selectedLanguage, problem]);

  // Notify parent of code changes
  useEffect(() => {
    if (onCodeChange) {
      onCodeChange(code, selectedLanguage);
    }
  }, [code, selectedLanguage, onCodeChange]);
  
  // 过滤可用的 WASM 支持语言
  const availableLanguages = WASM_SUPPORTED_LANGUAGES.filter(
    lang => {
      // Check if the specific template exists
      if (problem.template?.[lang.templateKey]) {
        return true;
      }
      // For JavaScript, also check for 'js' key (backward compatibility)
      if (lang.value === 'javascript' && problem.template?.js) {
        return true;
      }
      // TypeScript is available when JavaScript template exists
      // (TypeScript is a superset of JavaScript)
      if (lang.value === 'typescript' && problem.template?.js) {
        return true;
      }
      return false;
    }
  );
  
  const runTests = async () => {
    setIsRunning(true);
    const runningStatus = { status: 'running' };
    setResult(runningStatus);
    
    // Call the callback with running status if provided
    if (onTestResult) {
      onTestResult(runningStatus);
    }
    
    try {
      // 使用 WASM 执行器
      const data = await runWasmTests(problem, code, selectedLanguage);
      
      setResult(data);
      
      // Call the callback if provided
      if (onTestResult) {
        onTestResult(data);
      }
    } catch (error: any) {
      const errorResult = { 
        status: 'error', 
        error: error.message || t('codeRunner.executionError') || '执行错误'
      };
      setResult(errorResult);
      
      // Call the callback with error if provided
      if (onTestResult) {
        onTestResult(errorResult);
      }
    } finally {
      setIsRunning(false);
    }
  };

  // Generate AI Solution
  const generateAISolution = async () => {
    setIsGeneratingSolution(true);
    setSolutionError(null);
    setConfirmModalOpen(false);

    try {
      const response = await fetch('/api/ai-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: {
            id: problem.id,
            title: problem.title,
            description: problem.description,
            difficulty: problem.difficulty,
            tags: problem.tags,
            examples: problem.examples,
            tests: problem.tests,
          },
          language: locale,
          codeLanguage: selectedLanguage,
          config: aiConfig, // Pass AI configuration
          stream: true,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          throw new Error(data.error || 'Failed to generate solution');
        } catch {
          throw new Error(text || 'Failed to generate solution');
        }
      }

      const reader = response.body?.getReader();
      if (!reader) {
        const text = await response.text();
        setCode(cleanCodeFromResponse(text));
        return;
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        setCode(cleanCodeFromResponse(buffer));
      }

      buffer += decoder.decode();
      setCode(cleanCodeFromResponse(buffer));
    } catch (error: any) {
      setSolutionError(error.message || 'Failed to generate AI solution');
    } finally {
      setIsGeneratingSolution(false);
    }
  };

  const cleanCodeFromResponse = (raw: string) => {
    const text = (raw || '').trim();
    const match = text.match(/```(?:javascript|typescript|python|js|ts|py)?\s*([\s\S]*?)```/);
    if (match) return match[1].trim();
    return text;
  };

  const handleAISolutionClick = () => {
    // If code has been modified from template, show confirmation
    const langConfig = WASM_SUPPORTED_LANGUAGES.find(l => l.value === selectedLanguage);
    const templateKey = langConfig?.templateKey || 'js';
    const template = problem.template?.[templateKey] || problem.template?.js || '';
    
    if (code.trim() !== template.trim() && code.trim() !== '') {
      setConfirmModalOpen(true);
    } else {
      generateAISolution();
    }
  };
  
  const renderResult = () => {
    if (!result) return null;
    
    if (result.status === 'running') {
      return (
        <Alert color="blue">
          {t('codeRunner.runningTests')}
        </Alert>
      );
    }
    
    if (result.error) {
      return (
        <Alert color="red" title={t('codeRunner.runError')}>
          <Code block>{result.error}</Code>
        </Alert>
      );
    }
    
    if (result.results) {
      const passedTests = result.passed || 0;
      const totalTests = result.total || result.results.length;
      const allPassed = passedTests === totalTests;
      console.log(result.results)
      
      return (
        <Stack gap={10}>
          <Group justify="space-between">
            <Title order={5}>
              {t('codeRunner.testResults')}
            </Title>
            <Badge 
              color={allPassed ? 'green' : 'red'} 
              variant="filled"
            >
              {passedTests}/{totalTests} {t('codeRunner.passed')}
            </Badge>
          </Group>
          
          {/* Performance Information */}
          {result.performance && (
            <Paper p="sm" withBorder style={{ background: 'var(--mantine-color-blue-light)' }}>
              <Stack gap="xs">
                <Group justify="space-between" wrap="wrap">
                  <div>
                    <Text size="xs" c="dimmed">{t('codeRunner.totalExecutionTime')}:</Text>
                    <Text size="sm" fw={500}>{result.performance.totalExecutionTime}ms</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">{t('codeRunner.medianTime') || 'Median Time'}:</Text>
                    <Text size="sm" fw={500}>{result.performance.medianExecutionTime}ms</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">{t('codeRunner.averageTime')}:</Text>
                    <Text size="sm" fw={500}>{result.performance.averageExecutionTime}ms</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">{t('codeRunner.memoryUsed')}:</Text>
                    <Text size="sm" fw={500}>{result.performance.memoryUsage.heapUsed}MB</Text>
                  </div>
                </Group>
                <Group justify="space-between" wrap="wrap">
                  <div>
                    <Text size="xs" c="dimmed">{t('codeRunner.minTime') || 'Min'}:</Text>
                    <Text size="sm" fw={500}>{result.performance.minExecutionTime}ms</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">{t('codeRunner.maxTime') || 'Max'}:</Text>
                    <Text size="sm" fw={500}>{result.performance.maxExecutionTime}ms</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">{t('codeRunner.stdDev') || 'Std Dev'}:</Text>
                    <Text size="sm" fw={500}>±{result.performance.standardDeviation}ms</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">{t('codeRunner.iterations') || 'Iterations'}:</Text>
                    <Text size="sm" fw={500}>{result.performance.iterations}x</Text>
                  </div>
                </Group>
              </Stack>
            </Paper>
          )}
          
          <Stack gap={8}>
            {result.results.map((testResult: any, index: number) => (
              <Paper key={index} p="sm" withBorder>
                <Group justify="space-between" mb={5}>
                  <Text size="sm" fw={500}>
                    {t('codeRunner.testCase')} {index + 1}
                  </Text>
                  <Badge 
                    color={testResult.passed ? 'green' : 'red'}
                    variant="light"
                    size="sm"
                  >
                    {testResult.passed ? t('codeRunner.passed') : t('codeRunner.failed')}
                  </Badge>
                </Group>
                
                <Stack gap={5}>
                  <div>
                    <Text size="xs" c="dimmed">{t('codeRunner.input')}:</Text>
                    <Code>{testResult.input}</Code>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">{t('codeRunner.expected')}:</Text>
                    <Code>{formatOutput(testResult.expected)}</Code>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">{t('codeRunner.actual')}:</Text>
                    <Code color={testResult.passed ? undefined : 'red'}>
                      {testResult.actual === null ? 'null' : 
                       testResult.actual === undefined ? 'undefined' : 
                       formatOutput(testResult.actual)}
                    </Code>
                  </div>
                  {testResult.error && (
                    <div>
                      <Text size="xs" c="red">{t('common.error')}:</Text>
                      <Code c="red">{testResult.error}</Code>
                    </div>
                  )}
                  {testResult.executionTime !== undefined && (
                    <div>
                      <Text size="xs" c="dimmed">{t('codeRunner.executionTime')}: {testResult.executionTime}ms</Text>
                    </div>
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Stack>
      );
    }
    
    return (
      <Code block>
        {JSON.stringify(result, null, 2)}
      </Code>
    );
  };
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <Paper shadow="sm" p="md" withBorder style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <LoadingOverlay visible={isRunning} />
        
        <Group justify="space-between" mb={15}>
          <Title order={4}>
            {t('codeRunner.title')}
          </Title>
          <Group>
            {/* WASM 运行时状态指示器 */}
            <Tooltip 
              label={t('codeRunner.wasmEnabled') || 'WASM 浏览器端执行'}
              position="bottom"
            >
              <Badge 
                size="sm" 
                color={
                  runtimeStatus[selectedLanguage as 'javascript' | 'typescript' | 'python'] === 'ready' ? 'teal' :
                  runtimeStatus[selectedLanguage as 'javascript' | 'typescript' | 'python'] === 'loading' ? 'yellow' :
                  runtimeStatus[selectedLanguage as 'javascript' | 'typescript' | 'python'] === 'error' ? 'red' : 'gray'
                }
                variant="light"
                leftSection={<Text size="xs">⚡</Text>}
              >
                {runtimeStatus[selectedLanguage as 'javascript' | 'typescript' | 'python'] === 'ready' ? 'WASM Ready' :
                 runtimeStatus[selectedLanguage as 'javascript' | 'typescript' | 'python'] === 'loading' ? 'Loading...' :
                 runtimeStatus[selectedLanguage as 'javascript' | 'typescript' | 'python'] === 'error' ? 'Error' : 
                 'WASM'}
              </Badge>
            </Tooltip>
            
            {/* AI Solution Button */}
            <Tooltip label={t('codeRunner.aiSolutionTooltip')} position="bottom">
              <Button
                onClick={handleAISolutionClick}
                disabled={isGeneratingSolution || isRunning}
                color="violet"
                variant="light"
                size="sm"
                leftSection={isGeneratingSolution ? <Loader size={14} /> : <IconWand size={16} />}
              >
                {isGeneratingSolution ? t('codeRunner.generating') : t('codeRunner.aiSolution')}
              </Button>
            </Tooltip>
            
            <Select
              value={selectedLanguage}
              onChange={(value) => setSelectedLanguage(value || 'javascript')}
              data={availableLanguages}
              size="sm"
              w={130}
            />
            <Button 
              onClick={runTests} 
              disabled={isRunning || runtimeStatus[selectedLanguage as 'javascript' | 'typescript' | 'python'] === 'loading'}
              color="blue"
              variant="filled"
            >
              {isRunning ? t('codeRunner.running') : t('codeRunner.submit')}
            </Button>
          </Group>
        </Group>
        
        {/* AI Solution Error */}
        {solutionError && (
          <Alert color="red" mb="sm" withCloseButton onClose={() => setSolutionError(null)}>
            {solutionError}
          </Alert>
        )}
        
        <div style={{ flex: 1, minHeight: '300px' }}>
          <Editor
            height="100%"
            language={WASM_SUPPORTED_LANGUAGES.find(l => l.value === selectedLanguage)?.monacoLang || 'javascript'}
            value={code}
            onChange={(v) => setCode(v || '')}
            theme={colorScheme === 'dark' ? 'vs-dark' : 'light'}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              contextmenu: false,
              folding: false
            }}
          />
        </div>
      </Paper>
      
      {showResults && result && (
        <Paper shadow="sm" p="md" withBorder style={{ maxHeight: '300px', overflow: 'auto' }}>
          {renderResult()}
        </Paper>
      )}
      
      {/* AI Solution Confirmation Modal */}
      <Modal
        opened={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title={t('codeRunner.aiSolutionConfirmTitle')}
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            {t('codeRunner.aiSolutionConfirmMessage')}
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmModalOpen(false)}>
              {t('manage.cancel')}
            </Button>
            <Button color="violet" onClick={generateAISolution} leftSection={<IconWand size={16} />}>
              {t('codeRunner.generateAnyway')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}

import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Title, 
  Paper, 
  Text, 
  Badge, 
  Group, 
  Stack, 
  Code,
  Button,
  Collapse,
  Loader,
  Alert,
  Center,
  AppShell,
  Tabs,
  Select
} from '@mantine/core';
import dynamic from 'next/dynamic';
import { useTranslation, useI18n } from '../../src/contexts/I18nContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { LanguageThemeControls } from '../../src/components/LanguageThemeControls';
import { CodeWithCopy } from '../../src/components/CodeWithCopy';
import MarkdownRenderer from '../../src/components/MarkdownRenderer';

const CodeRunner = dynamic(() => import('../../src/components/CodeRunner'), { ssr: false });
const AIChatDialog = dynamic(() => import('../../src/components/AIChatDialog'), { ssr: false });

export default function ProblemPage() {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation();
  const { locale } = useI18n();
  const { colorScheme } = useTheme();
  const [showSolution, setShowSolution] = useState(false);
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('description');
  const [selectedSolutionIndex, setSelectedSolutionIndex] = useState<number>(0);
  
  // Track current code for AI chat context
  const [currentCode, setCurrentCode] = useState<string>('');
  const [codeLanguage, setCodeLanguage] = useState<string>('javascript');
  
  // Handle code changes from CodeRunner
  const handleCodeChange = useCallback((code: string, language: string) => {
    setCurrentCode(code);
    setCodeLanguage(language);
  }, []);
  
  // Resizable split pane state
  const [leftWidth, setLeftWidth] = useState(30); // percentage - default 30% for problem & results, 70% for code editor
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resizable split pane handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constrain between 20% and 80%
    const clampedWidth = Math.max(20, Math.min(80, newLeftWidth));
    setLeftWidth(clampedWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (!id) return;

    const fetchProblem = async () => {
      try {
        const response = await fetch('/api/problems');
        if (!response.ok) {
          throw new Error('Failed to fetch problems');
        }
        const problems = await response.json();
        const foundProblem = problems.find((p: any) => p.id === id);
        
        if (!foundProblem) {
          throw new Error('Problem not found');
        }
        
        setProblem(foundProblem);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load problem');
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [id]);
  
  if (loading) {
    return (
      <AppShell
        header={{ height: 80 }}
        padding={{ base: 'sm', md: 'md' }}
      >
        <AppShell.Header>
          <Stack gap="xs" h="100%" justify="center" px="md">
            <Group justify="space-between" align="flex-start">
            <div 
              onClick={() => router.push('/')} 
              style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              <Title order={2} mb={4}>{t('homepage.title')}</Title>
              <Text size="sm" c="dimmed">{t('homepage.subtitle')}</Text>
            </div>
            <Group>
              <Button 
                component={Link} 
                href="/add-problem" 
                variant="outline" 
                color="blue"
                size="sm"
              >
                + {t('homepage.addProblem')}
              </Button>
              <LanguageThemeControls />
            </Group>
          </Group>
        </Stack>
      </AppShell.Header>

      <AppShell.Main>
        <Center style={{ minHeight: '50vh' }}>
          <Stack align="center" gap={20}>
            <Loader size="lg" />
            <Text>{t('common.loading')}</Text>
          </Stack>
        </Center>
      </AppShell.Main>
    </AppShell>
  );
}

if (error || !problem) {
  return (
    <AppShell
      header={{ height: 80 }}
      padding={{ base: 'sm', md: 'md' }}
    >
      <AppShell.Header>
        <Stack gap="xs" h="100%" justify="center" px="md">
          <Group justify="space-between" align="flex-start">
            <div 
              onClick={() => router.push('/')} 
              style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              <Title order={2} mb={4}>{t('homepage.title')}</Title>
              <Text size="sm" c="dimmed">{t('homepage.subtitle')}</Text>
            </div>
            <Group>
              <Button 
                component={Link} 
                href="/" 
                variant="outline" 
                color="gray"
                size="sm"
              >
                ← {t('common.home')}
              </Button>
              <Button 
                component={Link} 
                href="/add-problem" 
                variant="outline" 
                color="blue"
                size="sm"
              >
                + {t('homepage.addProblem')}
              </Button>
              <LanguageThemeControls />
            </Group>
            </Group>
          </Stack>
        </AppShell.Header>

        <AppShell.Main>
          <Center style={{ minHeight: '50vh' }}>
            <Alert color="red" title={t('common.error')}>
              {error || 'Problem not found'}
            </Alert>
          </Center>
        </AppShell.Main>
      </AppShell>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'green';
      case 'Medium': return 'yellow';
      case 'Hard': return 'red';
      default: return 'gray';
    }
  };
  
  // Format output results
  const formatOutput = (value: any): string => {
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
  };
  
  const handleTestResult = (result: any) => {
    setTestResult(result);
    // Auto-switch to results tab when test results are received
    if (result && result.status !== 'running') {
      setActiveTab('results');
    }
  };
  
  const renderTestResult = (result: any) => {
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
      
      return (
        <Stack gap={10}>
          <Group justify="space-between">
            <Badge 
              color={allPassed ? 'green' : 'red'} 
              variant="filled"
            >
              {passedTests}/{totalTests} {t('codeRunner.passed')}
            </Badge>
          </Group>
          
          {/* Performance Information */}
          {result.performance && (
            <Paper p="sm" withBorder style={{ background: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-blue-light)' }}>
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed">{t('codeRunner.totalExecutionTime')}:</Text>
                  <Text size="sm" fw={500}>{result.performance.totalExecutionTime}ms</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">{t('codeRunner.averageTime')}:</Text>
                  <Text size="sm" fw={500}>{result.performance.averageExecutionTime}ms</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">{t('codeRunner.memoryUsed')}:</Text>
                  <Text size="sm" fw={500}>{result.performance.memoryUsage.heapUsed}MB</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">{t('codeRunner.totalMemory')}:</Text>
                  <Text size="sm" fw={500}>{result.performance.memoryUsage.rss}MB</Text>
                </div>
              </Group>
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
    <AppShell
      header={{ height: 80 }}
      padding="0"
    >
      {/* Header with title and controls */}
      <AppShell.Header>
        <Stack gap="xs" h="100%" justify="center" px="md">
          <Group justify="space-between" align="flex-start">
            <div 
              onClick={() => router.push('/')} 
              style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              <Title order={2} mb={4}>{t('homepage.title')}</Title>
              <Text size="sm" c="dimmed">{t('homepage.subtitle')}</Text>
            </div>
            <Group>
              <Button 
                component={Link} 
                href="/" 
                variant="outline" 
                color="gray"
                size="sm"
              >
                ← {t('common.home')}
              </Button>
              <Button 
                component={Link} 
                href="/add-problem" 
                variant="outline" 
                color="blue"
                size="sm"
              >
                + {t('homepage.addProblem')}
              </Button>
              <LanguageThemeControls />
            </Group>
          </Group>
        </Stack>
      </AppShell.Header>

      {/* Main content with resizable split panes */}
      <AppShell.Main>
        <div
          ref={containerRef}
          style={{
            display: 'flex',
            height: 'calc(100vh - 80px)',
            overflow: 'hidden'
          }}
        >
          {/* Left Panel - Tabbed Content */}
          <div
            style={{
              width: `${leftWidth}%`,
              minWidth: '300px',
              maxWidth: '80%',
              overflow: 'hidden',
              padding: '16px',
              borderRight: '1px solid #e9ecef',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Problem Title and Metadata */}
            <Paper shadow="sm" p="lg" withBorder mb="md">
              <Group justify="space-between" align="flex-start" mb={15}>
                <div style={{ flex: 1 }}>
                  <Title order={2} mb={8}>
                    {problem.title[locale as keyof typeof problem.title] || problem.title.zh}
                  </Title>
                  <Group gap={8}>
                    <Badge 
                      color={getDifficultyColor(problem.difficulty)}
                      variant="filled"
                      size="md"
                    >
                      {t(`homepage.difficulty.${problem.difficulty}`)}
                    </Badge>
                    {problem.tags?.map((tag: string) => (
                      <Badge key={tag} color="blue" variant="light" size="sm">
                        {t(`tags.${tag}`) !== `tags.${tag}` ? t(`tags.${tag}`) : tag}
                      </Badge>
                    ))}
                  </Group>
                </div>
              </Group>
            </Paper>
            
            {/* Tabs Container */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Tabs value={activeTab} onChange={(value) => value && setActiveTab(value)} style={{ height: '100%' }}>
                <Tabs.List>
                  <Tabs.Tab value="description">
                    📝 {t('problemPage.description')}
                  </Tabs.Tab>
                  <Tabs.Tab value="solution">
                    🔍 {t('problemPage.solution')}
                  </Tabs.Tab>
                  <Tabs.Tab value="results">
                    {t('codeRunner.testResults')}
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="description" style={{ height: 'calc(100% - 40px)', overflow: 'auto', padding: '16px 0' }}>
                  <Stack gap="lg">
                    {/* Problem Description */}
                    <Paper shadow="sm" p="lg" withBorder>
                      <MarkdownRenderer 
                        content={problem.description[locale as keyof typeof problem.description] || problem.description.zh}
                      />
                    </Paper>
                    
                    {/* Examples */}
                    {problem.examples && (
                      <Paper shadow="sm" p="lg" withBorder>
                        <Title order={4} mb={15}>
                          💡 {t('problemPage.examples')}
                        </Title>
                        <Stack gap={15}>
                          {problem.examples.map((example: any, index: number) => (
                            <div key={index}>
                              <Text size="sm" fw={500} mb={5}>
                                {t('problemPage.example')} {index + 1}:
                              </Text>
                              <pre style={{
                                backgroundColor: colorScheme === 'dark' ? '#2e2e2e' : '#f8f9fa',
                                border: `1px solid ${colorScheme === 'dark' ? '#373a40' : '#e9ecef'}`,
                                borderRadius: '4px',
                                padding: '12px',
                                fontFamily: 'monospace',
                                fontSize: '14px',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                margin: 0
                              }}>
                                {t('problemPage.input')}: {example.input}
                                {'\n'}
                                {t('problemPage.output')}: {example.output}
                              </pre>
                            </div>
                          ))}
                        </Stack>
                      </Paper>
                    )}

                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="solution" style={{ height: 'calc(100% - 40px)', overflow: 'auto', padding: '16px 0' }}>
                  {problem.solutions && problem.solutions.length > 0 ? (
                    <Paper shadow="sm" p="lg" withBorder>
                      <Group justify="space-between" align="center" mb={15}>
                        {problem.solutions.length > 1 && (
                          <Select
                            value={selectedSolutionIndex.toString()}
                            onChange={(value) => value && setSelectedSolutionIndex(parseInt(value))}
                            data={problem.solutions.map((solution: any, index: number) => ({
                              value: index.toString(),
                              label: solution.title?.[locale] || solution.title?.zh || `${t('problemPage.solution')} ${index + 1}`
                            }))}
                            size="sm"
                            style={{ minWidth: 200 }}
                          />
                        )}
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => setShowSolution(!showSolution)}
                        >
                          {showSolution ? t('problemPage.hideSolution') : t('problemPage.showSolution')}
                        </Button>
                      </Group>
                      
                      <Collapse in={showSolution}>
                        {problem.solutions[selectedSolutionIndex]?.content ? (
                          <MarkdownRenderer 
                            content={(
                              problem.solutions[selectedSolutionIndex].content[locale as 'en' | 'zh'] ||
                              problem.solutions[selectedSolutionIndex].content.zh ||
                              problem.solutions[selectedSolutionIndex].content.en ||
                              ''
                            )}
                          />
                        ) : problem.solution?.js ? (
                          <CodeWithCopy code={problem.solution.js} />
                        ) : (
                          <Text size="sm" c="dimmed" ta="center" py="xl">
                            {t('problemPage.noSolutions')}
                          </Text>
                        )}
                      </Collapse>
                      
                      {!showSolution && (
                        <Text size="sm" c="dimmed" ta="center" py="xl">
                          {t('problemPage.solutionHidden')}
                        </Text>
                      )}
                    </Paper>
                  ) : problem.solution?.js ? (
                    <Paper shadow="sm" p="lg" withBorder>
                      <Group justify="flex-end" align="center" mb={15}>
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => setShowSolution(!showSolution)}
                        >
                          {showSolution ? t('problemPage.hideSolution') : t('problemPage.showSolution')}
                        </Button>
                      </Group>
                      <Collapse in={showSolution}>
                        <CodeWithCopy code={problem.solution.js} />
                      </Collapse>
                      {!showSolution && (
                        <Text size="sm" c="dimmed" ta="center" py="xl">
                          {t('problemPage.solutionHidden')}
                        </Text>
                      )}
                    </Paper>
                  ) : (
                    <Paper shadow="sm" p="lg" withBorder>
                      <Center py="xl">
                        <Text size="md" c="dimmed">
                          {t('problemPage.noSolutions')}
                        </Text>
                      </Center>
                    </Paper>
                  )}
                </Tabs.Panel>

                <Tabs.Panel value="results" style={{ height: 'calc(100% - 40px)', overflow: 'auto', padding: '16px 0' }}>
                  {testResult ? (
                    <Paper shadow="sm" p="lg" withBorder>
                      <div style={{ maxHeight: '100%', overflow: 'auto' }}>
                        {renderTestResult(testResult)}
                      </div>
                    </Paper>
                  ) : (
                    <Paper shadow="sm" p="lg" withBorder>
                      <Center py="xl">
                        <Text size="md" c="dimmed">
                          {t('codeRunner.noResults')}
                        </Text>
                      </Center>
                    </Paper>
                  )}
                </Tabs.Panel>
              </Tabs>
            </div>
          </div>
          
          {/* Resizable Divider */}
          <div
            onMouseDown={handleMouseDown}
            style={{
              width: '4px',
              backgroundColor: isDragging 
                ? '#228be6' 
                : colorScheme === 'dark' ? '#424242' : '#e9ecef',
              cursor: 'col-resize',
              position: 'relative',
              transition: isDragging ? 'none' : 'background-color 0.2s ease'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '20px',
                height: '40px',
                backgroundColor: '#228be6',
                borderRadius: '4px',
                opacity: isDragging ? 1 : 0.3,
                transition: 'opacity 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              ⋮⋮
            </div>
          </div>
          
          {/* Right Panel - Code Editor */}
          <div
            style={{
              width: `${100 - leftWidth}%`,
              minWidth: '300px',
              maxWidth: '80%',
              height: '100%',
              overflow: 'hidden',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ flex: 1, height: '100%' }}>
              <CodeRunner 
                problem={problem} 
                onTestResult={handleTestResult}
                showResults={false}
                onCodeChange={handleCodeChange}
              />
            </div>
          </div>
        </div>
      </AppShell.Main>
      
      {/* AI Chat Dialog */}
      <AIChatDialog 
        problem={problem} 
        currentCode={currentCode}
        codeLanguage={codeLanguage}
      />
    </AppShell>
  );
}

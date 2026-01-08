import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Card, 
  Group, 
  Badge, 
  Grid, 
  Stack,
  Center,
  Divider,
  Loader,
  Alert,
  TextInput,
  Select,
  MultiSelect,
  Button,
  Flex,
  Paper,
  AppShell,
  SegmentedControl,
  Table,
  ActionIcon,
  Tooltip,
  Drawer,
  NavLink
} from '@mantine/core';
import { IconLayoutGrid, IconList, IconMenu2, IconChartBar, IconPlus, IconRobot, IconPackage, IconSettings } from '@tabler/icons-react';
import { useMemo } from 'react';
import { useTranslation, useI18n } from '../src/contexts/I18nContext';
import { LanguageThemeControls } from '../src/components/LanguageThemeControls'
import { buildProblemStatusIndex, loadPracticeAttemptEvents, PRACTICE_STATS_UPDATED_EVENT } from '../src/lib/practiceStats';

type Problem = {
  id: string;
  title: { en: string; zh: string };
  difficulty: string;
  tags: string[];
  description: { en: string; zh: string };
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy': return 'green';
    case 'Medium': return 'yellow';
    case 'Hard': return 'red';
    default: return 'gray';
  }
};

export default function Home() {
  const { t } = useTranslation();
  const { locale } = useI18n();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [problemStatusIndex, setProblemStatusIndex] = useState<Map<string, { attempted: boolean; solved: boolean; lastTs: string }>>(
    new Map()
  );
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [drawerOpened, setDrawerOpened] = useState(false);
  
  // Column widths for list view table
  const [columnWidths, setColumnWidths] = useState({
    status: 100,
    title: 400,
    difficulty: 150,
    tags: 300
  });

  useEffect(() => {
    setMounted(true);
    // Load view mode preference from localStorage
    const savedViewMode = localStorage.getItem('problemViewMode');
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      setViewMode(savedViewMode);
    }
    // Load column widths from localStorage
    const savedWidths = localStorage.getItem('tableColumnWidths');
    if (savedWidths) {
      try {
        setColumnWidths(JSON.parse(savedWidths));
      } catch (e) {
        console.error('Failed to parse saved column widths', e);
      }
    }
  }, []);
  
  // Save column widths to localStorage when they change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('tableColumnWidths', JSON.stringify(columnWidths));
    }
  }, [columnWidths, mounted]);

  // Save view mode preference
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('problemViewMode', viewMode);
    }
  }, [viewMode, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const refresh = () => {
      const events = loadPracticeAttemptEvents();
      setProblemStatusIndex(buildProblemStatusIndex(events));
    };

    refresh();

    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.includes('practice-attempt-events-v1')) refresh();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(PRACTICE_STATS_UPDATED_EVENT, refresh as any);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(PRACTICE_STATS_UPDATED_EVENT, refresh as any);
    };
  }, [mounted]);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await fetch('/api/problems');
        if (!response.ok) {
          throw new Error('Failed to fetch problems');
        }
        const data = await response.json();
        setProblems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load problems');
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  // Get unique difficulties and tags for filter options
  const { difficulties, allTags } = useMemo(() => {
    const uniqueDifficulties = Array.from(new Set(problems.map(p => p.difficulty)));
    const uniqueTags = Array.from(new Set(problems.flatMap(p => p.tags || [])));
    return {
      difficulties: uniqueDifficulties,
      allTags: uniqueTags
    };
  }, [problems]);

  // Filter and search logic
  const filteredProblems = useMemo(() => {
    return problems.filter(problem => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const titleMatch = problem.title.en.toLowerCase().includes(searchLower) || 
                         problem.title.zh.toLowerCase().includes(searchLower);
      const descMatch = problem.description.en.toLowerCase().includes(searchLower) || 
                        problem.description.zh.toLowerCase().includes(searchLower);
      const searchMatch = !searchQuery || titleMatch || descMatch;
      
      // Difficulty filter
      const difficultyMatch = selectedDifficulties.length === 0 || 
                             selectedDifficulties.includes(problem.difficulty);
      
      // Tag filter
      const tagMatch = selectedTags.length === 0 || 
                       selectedTags.some(tag => problem.tags?.includes(tag));
      
      return searchMatch && difficultyMatch && tagMatch;
    });
  }, [problems, searchQuery, selectedDifficulties, selectedTags]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDifficulties([]);
    setSelectedTags([]);
  };

  // Check if any filters are applied
  const hasActiveFilters = searchQuery || selectedDifficulties.length > 0 || selectedTags.length > 0;

  // Prevent hydration mismatch by waiting for client-side mount
  if (!mounted) {
    return (
      <AppShell
        header={{ height: 80 }}
        navbar={{ width: 300, breakpoint: 'md', collapsed: { mobile: true } }}
        padding={{ base: 'sm', md: 'md' }}
      >
        <AppShell.Header>
          <Stack gap="xs" h="100%" justify="center" px="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={2} mb={4}>Offline LeetCode Practice</Title>
                <Text size="sm" c="dimmed">Practice coding problems offline</Text>
              </div>
              <Group>
                <Badge 
                  size="lg" 
                  variant="outline" 
                  color="blue" 
                  style={{ cursor: 'pointer', padding: '8px 16px' }}
                >
                  + {t('homepage.addProblem')}
                </Badge>
                <Badge 
                  size="lg" 
                  variant="outline" 
                  color="violet" 
                  style={{ cursor: 'pointer', padding: '8px 16px' }}
                >
                  🤖 {t('homepage.aiGenerator')}
                </Badge>
                <Link href="/settings">
                  <Badge 
                    size="lg" 
                    variant="outline" 
                    color="gray" 
                    style={{ cursor: 'pointer', padding: '8px 16px' }}
                  >
                    ⚙️ {t('common.settings')}
                  </Badge>
                </Link>
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

  if (loading) {
    return (
      <AppShell
        header={{ height: 80 }}
        navbar={{ width: 300, breakpoint: 'md', collapsed: { mobile: true } }}
        padding={{ base: 'sm', md: 'md' }}
      >
        <AppShell.Header>
          <Stack gap="xs" h="100%" justify="center" px="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={2} mb={4}>{t('homepage.title')}</Title>
                <Text size="sm" c="dimmed">{t('homepage.subtitle')}</Text>
              </div>
              <Group>
                <Link href="/add-problem">
                  <Badge 
                    size="lg" 
                    variant="outline" 
                    color="blue" 
                    style={{ cursor: 'pointer', padding: '8px 16px' }}
                  >
                    + {t('homepage.addProblem')}
                  </Badge>
                </Link>
                <Link href="/generator">
                  <Badge 
                    size="lg" 
                    variant="outline" 
                    color="violet" 
                    style={{ cursor: 'pointer', padding: '8px 16px' }}
                  >
                    🤖 {t('homepage.aiGenerator')}
                  </Badge>
                </Link>
                <Link href="/manage">
                  <Badge 
                    size="lg" 
                    variant="outline" 
                    color="teal" 
                    style={{ cursor: 'pointer', padding: '8px 16px' }}
                  >
                    📦 {t('manage.manageProblems')}
                  </Badge>
                </Link>
                <Link href="/settings">
                  <Badge 
                    size="lg" 
                    variant="outline" 
                    color="gray" 
                    style={{ cursor: 'pointer', padding: '8px 16px' }}
                  >
                    ⚙️ {t('common.settings')}
                  </Badge>
                </Link>
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

  if (error) {
    return (
      <AppShell
        header={{ height: 80 }}
        navbar={{ width: 300, breakpoint: 'md', collapsed: { mobile: true } }}
        padding={{ base: 'sm', md: 'md' }}
      >
        <AppShell.Header>
          <Stack gap="xs" h="100%" justify="center" px="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={2} mb={4}>{t('homepage.title')}</Title>
                <Text size="sm" c="dimmed">{t('homepage.subtitle')}</Text>
              </div>
              <Group>
                <Link href="/add-problem">
                  <Badge 
                    size="lg" 
                    variant="outline" 
                    color="blue" 
                    style={{ cursor: 'pointer', padding: '8px 16px' }}
                  >
                    + {t('homepage.addProblem')}
                  </Badge>
                </Link>
                <Link href="/generator">
                  <Badge 
                    size="lg" 
                    variant="outline" 
                    color="violet" 
                    style={{ cursor: 'pointer', padding: '8px 16px' }}
                  >
                    🤖 {t('homepage.aiGenerator')}
                  </Badge>
                </Link>
                <Link href="/manage">
                  <Badge 
                    size="lg" 
                    variant="outline" 
                    color="teal" 
                    style={{ cursor: 'pointer', padding: '8px 16px' }}
                  >
                    📦 {t('manage.manageProblems')}
                  </Badge>
                </Link>
                <Link href="/settings">
                  <Badge 
                    size="lg" 
                    variant="outline" 
                    color="gray" 
                    style={{ cursor: 'pointer', padding: '8px 16px' }}
                  >
                    ⚙️ {t('common.settings')}
                  </Badge>
                </Link>
                <LanguageThemeControls />
              </Group>
            </Group>
          </Stack>
        </AppShell.Header>

        <AppShell.Main>
          <Center style={{ minHeight: '50vh' }}>
            <Alert color="red" title={t('common.error')}>
              {error}
            </Alert>
          </Center>
        </AppShell.Main>
      </AppShell>
    );
  }

  return (
    <AppShell
      header={{ height: 80 }}
      navbar={{ width: 300, breakpoint: 'md', collapsed: { mobile: true } }}
      padding={{ base: 'sm', md: 'md' }}
    >
      {/* Header with title and controls */}
      <AppShell.Header>
        <Stack gap="xs" h="100%" justify="center" px="md">
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={2} mb={4}>{t('homepage.title')}</Title>
              <Text size="sm" c="dimmed">{t('homepage.subtitle')}</Text>
            </div>
            <Group>
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={() => setDrawerOpened(true)}
              >
                <IconMenu2 size={24} />
              </ActionIcon>
              <LanguageThemeControls />
            </Group>
          </Group>
        </Stack>
      </AppShell.Header>

      {/* Left Sidebar with search and filters */}
      <AppShell.Navbar p="md">
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <Title order={4}>{t('homepage.problemList')}</Title>
            {/* View Mode Toggle */}
            <Group gap={4}>
              <Tooltip label={t('homepage.viewMode.grid')}>
                <ActionIcon
                  variant={viewMode === 'grid' ? 'filled' : 'subtle'}
                  color="gray"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <IconLayoutGrid size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t('homepage.viewMode.list')}>
                <ActionIcon
                  variant={viewMode === 'list' ? 'filled' : 'subtle'}
                  color="gray"
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <IconList size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          <Divider />

          {/* Search Section */}
          <div>
            <Title order={4} mb="md">{t('homepage.search')}</Title>
            <TextInput
              placeholder={t('homepage.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              size="sm"
            />
          </div>
          
          <Divider />
          
          {/* Difficulty Filter */}
          <div>
            <Title order={4} mb="md">{t('homepage.filterByDifficulty')}</Title>
            <Select
              placeholder={t('homepage.allDifficulties')}
              data={[
                { value: '', label: t('homepage.allDifficulties') },
                ...difficulties.map(diff => ({
                  value: diff,
                  label: t(`homepage.difficulty.${diff}`)
                }))
              ]}
              value={selectedDifficulties.length === 1 ? selectedDifficulties[0] : ''}
              onChange={(value) => {
                if (value) {
                  setSelectedDifficulties([value]);
                } else {
                  setSelectedDifficulties([]);
                }
              }}
              clearable
              size="sm"
            />
          </div>
          
          {/* Tag Filter */}
          <div>
            <Title order={4} mb="md">{t('homepage.filterByTags')}</Title>
            <MultiSelect
              placeholder={t('homepage.allTags')}
              data={allTags.map(tag => ({
                value: tag,
                label: t(`tags.${tag}`) !== `tags.${tag}` ? t(`tags.${tag}`) : tag
              }))}
              value={selectedTags}
              onChange={setSelectedTags}
              searchable
              limit={20}
              size="sm"
            />
          </div>
          
          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button 
              variant="light" 
              onClick={clearFilters}
              fullWidth
              size="sm"
            >
              {t('homepage.clearFilters')}
            </Button>
          )}
          
          <Divider />
          
          {/* Result Counter */}
          <Text size="sm" c="dimmed" ta="center">
            {t('homepage.showingResults')} {filteredProblems.length} {t('homepage.of')} {problems.length} {t('homepage.problems')}
          </Text>
        </Stack>
      </AppShell.Navbar>

      {/* Main content area with problem list */}
      <AppShell.Main>
        <Container fluid p={0}>
          {filteredProblems.length === 0 ? (
            <Center mt={40}>
              <Alert color="blue" title={t('homepage.noResults')}>
                <Text>
                  {hasActiveFilters 
                    ? t('homepage.noResults') 
                    : t('homepage.noResults')
                  }
                </Text>
              </Alert>
            </Center>
          ) : viewMode === 'grid' ? (
            <Grid gutter="md" style={{ margin: 0 }}>
              {filteredProblems.map((problem) => (
                <Grid.Col key={problem.id} span={{ base: 12, sm: 6, xl: 4 }}>
                  <Card 
                    shadow="sm" 
                    padding="lg" 
                    radius="md" 
                    withBorder
                    style={{ height: '100%', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    component={Link}
                    href={`/problems/${problem.id}`}
                  >
                    <Stack gap={12}>
                      <Group justify="space-between" align="flex-start">
                        <Badge 
                          color={getDifficultyColor(problem.difficulty)}
                          variant="filled"
                          size="sm"
                        >
                          {t(`homepage.difficulty.${problem.difficulty}`)}
                        </Badge>
                        {(() => {
                          const st = problemStatusIndex.get(problem.id);
                          if (!st?.attempted) return null;
                          return (
                            <Group gap={6}>
                              {st.solved ? (
                                <Badge color="green" variant="light" size="sm">
                                  {t('homepage.problemStatus.solved')}
                                </Badge>
                              ) : (
                                <Badge color="blue" variant="light" size="sm">
                                  {t('homepage.problemStatus.attempted')}
                                </Badge>
                              )}
                            </Group>
                          );
                        })()}
                      </Group>
                      
                      <div>
                        <Title order={4} mb={8}>
                          {problem.title[locale as keyof typeof problem.title] || problem.title.zh}
                        </Title>
                        <Text size="xs" lineClamp={2}>
                          {problem.description[locale as keyof typeof problem.description] || problem.description.zh}
                        </Text>
                      </div>
                      
                      <Group gap={4} style={{ flexWrap: 'wrap' }}>
                        {problem.tags?.slice(0, 3).map((tag) => (
                          <Badge 
                            key={tag} 
                            color="blue" 
                            variant="light" 
                            size="xs"
                            style={{ flexShrink: 0 }}
                          >
                            {t(`tags.${tag}`) !== `tags.${tag}` ? t(`tags.${tag}`) : tag}
                          </Badge>
                        ))}
                        {problem.tags?.length > 3 && (
                          <Badge color="gray" variant="light" size="xs" style={{ flexShrink: 0 }}>
                            +{problem.tags.length - 3}
                          </Badge>
                        )}
                      </Group>
                    </Stack>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover withTableBorder withColumnBorders style={{ tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                  <col style={{ width: `${columnWidths.status}px` }} />
                  <col style={{ width: `${columnWidths.title}px` }} />
                  <col style={{ width: `${columnWidths.difficulty}px` }} />
                  <col style={{ width: `${columnWidths.tags}px` }} />
                </colgroup>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ position: 'relative', padding: '12px' }}>
                      {t('homepage.table.status')}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          bottom: 0,
                          width: '5px',
                          cursor: 'col-resize',
                          userSelect: 'none',
                          backgroundColor: 'transparent'
                        }}
                        onMouseDown={(e) => {
                          const startX = e.pageX;
                          const startWidth = columnWidths.status;
                          const handleMouseMove = (e: MouseEvent) => {
                            const newWidth = Math.max(50, startWidth + e.pageX - startX);
                            setColumnWidths(prev => ({ ...prev, status: newWidth }));
                          };
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                    </Table.Th>
                    <Table.Th style={{ position: 'relative', padding: '12px' }}>
                      {t('homepage.table.title')}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          bottom: 0,
                          width: '5px',
                          cursor: 'col-resize',
                          userSelect: 'none',
                          backgroundColor: 'transparent'
                        }}
                        onMouseDown={(e) => {
                          const startX = e.pageX;
                          const startWidth = columnWidths.title;
                          const handleMouseMove = (e: MouseEvent) => {
                            const newWidth = Math.max(100, startWidth + e.pageX - startX);
                            setColumnWidths(prev => ({ ...prev, title: newWidth }));
                          };
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                    </Table.Th>
                    <Table.Th style={{ position: 'relative', padding: '12px' }}>
                      {t('homepage.table.difficulty')}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          bottom: 0,
                          width: '5px',
                          cursor: 'col-resize',
                          userSelect: 'none',
                          backgroundColor: 'transparent'
                        }}
                        onMouseDown={(e) => {
                          const startX = e.pageX;
                          const startWidth = columnWidths.difficulty;
                          const handleMouseMove = (e: MouseEvent) => {
                            const newWidth = Math.max(80, startWidth + e.pageX - startX);
                            setColumnWidths(prev => ({ ...prev, difficulty: newWidth }));
                          };
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                    </Table.Th>
                    <Table.Th style={{ position: 'relative', padding: '12px' }}>
                      {t('homepage.table.tags')}
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredProblems.map((problem) => {
                    const st = problemStatusIndex.get(problem.id);
                    return (
                      <Table.Tr 
                        key={problem.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => window.location.href = `/problems/${problem.id}`}
                      >
                        <Table.Td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {st?.attempted && (
                            st.solved ? (
                              <Badge color="green" variant="light" size="sm">
                                ✓
                              </Badge>
                            ) : (
                              <Badge color="blue" variant="light" size="sm">
                                ○
                              </Badge>
                            )
                          )}
                        </Table.Td>
                        <Table.Td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Text fw={500} size="sm">
                            {problem.title[locale as keyof typeof problem.title] || problem.title.zh}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Badge 
                            color={getDifficultyColor(problem.difficulty)}
                            variant="light"
                            size="sm"
                          >
                            {t(`homepage.difficulty.${problem.difficulty}`)}
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <Group gap={4}>
                            {problem.tags?.slice(0, 2).map((tag) => (
                              <Badge 
                                key={tag} 
                                color="blue" 
                                variant="light" 
                                size="xs"
                              >
                                {t(`tags.${tag}`) !== `tags.${tag}` ? t(`tags.${tag}`) : tag}
                              </Badge>
                            ))}
                            {problem.tags?.length > 2 && (
                              <Badge color="gray" variant="light" size="xs">
                                +{problem.tags.length - 2}
                              </Badge>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </div>
          )}
        </Container>
      </AppShell.Main>

      {/* Navigation Drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        position="right"
        title={
          <Group gap="xs">
            <IconMenu2 size={24} />
            <Text fw={600} size="lg">{t('common.navigation')}</Text>
          </Group>
        }
        padding="lg"
        size="sm"
        styles={{
          header: {
            paddingBottom: 16
          }
        }}
      >
        <Stack gap="md">
          {/* Practice Section */}
          <div>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="xs" px="xs">
              {t('common.practice') || 'Practice'}
            </Text>
            <Stack gap={4}>
              <Paper
                p="md"
                radius="md"
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: 'var(--mantine-color-grape-light)',
                  border: 'none'
                }}
                onClick={() => {
                  window.location.href = '/stats';
                  setDrawerOpened(false);
                }}
                className="nav-item"
              >
                <Group gap="md">
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderRadius: '8px',
                    background: 'var(--mantine-color-grape-filled)'
                  }}>
                    <IconChartBar size={22} style={{ color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text fw={500} size="sm">{t('homepage.stats.jumpToDashboard')}</Text>
                    <Text size="xs" c="dimmed">{t('navigation.statsDesc') || 'View your progress'}</Text>
                  </div>
                </Group>
              </Paper>
            </Stack>
          </div>

          <Divider />

          {/* Content Management Section */}
          <div>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="xs" px="xs">
              {t('common.content') || 'Content'}
            </Text>
            <Stack gap={4}>
              <Paper
                p="md"
                radius="md"
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: 'var(--mantine-color-blue-light)',
                  border: 'none'
                }}
                onClick={() => {
                  window.location.href = '/add-problem';
                  setDrawerOpened(false);
                }}
                className="nav-item"
              >
                <Group gap="md">
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderRadius: '8px',
                    background: 'var(--mantine-color-blue-filled)'
                  }}>
                    <IconPlus size={22} style={{ color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text fw={500} size="sm">{t('homepage.addProblem')}</Text>
                    <Text size="xs" c="dimmed">{t('navigation.addDesc') || 'Create new problem'}</Text>
                  </div>
                </Group>
              </Paper>

              <Paper
                p="md"
                radius="md"
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: 'var(--mantine-color-violet-light)',
                  border: 'none'
                }}
                onClick={() => {
                  window.location.href = '/generator';
                  setDrawerOpened(false);
                }}
                className="nav-item"
              >
                <Group gap="md">
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderRadius: '8px',
                    background: 'var(--mantine-color-violet-filled)'
                  }}>
                    <IconRobot size={22} style={{ color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text fw={500} size="sm">{t('homepage.aiGenerator')}</Text>
                    <Text size="xs" c="dimmed">{t('navigation.aiDesc') || 'Generate with AI'}</Text>
                  </div>
                </Group>
              </Paper>

              <Paper
                p="md"
                radius="md"
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: 'var(--mantine-color-teal-light)',
                  border: 'none'
                }}
                onClick={() => {
                  window.location.href = '/manage';
                  setDrawerOpened(false);
                }}
                className="nav-item"
              >
                <Group gap="md">
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderRadius: '8px',
                    background: 'var(--mantine-color-teal-filled)'
                  }}>
                    <IconPackage size={22} style={{ color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text fw={500} size="sm">{t('manage.manageProblems')}</Text>
                    <Text size="xs" c="dimmed">{t('navigation.manageDesc') || 'Manage problems'}</Text>
                  </div>
                </Group>
              </Paper>
            </Stack>
          </div>

          <Divider />

          {/* Settings Section */}
          <div>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="xs" px="xs">
              {t('common.system') || 'System'}
            </Text>
            <Stack gap={4}>
              <Paper
                p="md"
                radius="md"
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: 'var(--mantine-color-gray-light)',
                  border: 'none'
                }}
                onClick={() => {
                  window.location.href = '/settings';
                  setDrawerOpened(false);
                }}
                className="nav-item"
              >
                <Group gap="md">
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderRadius: '8px',
                    background: 'var(--mantine-color-gray-filled)'
                  }}>
                    <IconSettings size={22} style={{ color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text fw={500} size="sm">{t('common.settings')}</Text>
                    <Text size="xs" c="dimmed">{t('navigation.settingsDesc') || 'App settings'}</Text>
                  </div>
                </Group>
              </Paper>
            </Stack>
          </div>
        </Stack>

        <style jsx global>{`
          .nav-item:hover {
            transform: translateX(-4px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
        `}</style>
      </Drawer>
    </AppShell>
  );
}

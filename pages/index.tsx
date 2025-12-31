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
  AppShell
} from '@mantine/core';
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

  useEffect(() => {
    setMounted(true);
  }, []);

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
                <Link href="/stats">
                  <Badge 
                    size="lg" 
                    variant="outline" 
                    color="grape" 
                    style={{ cursor: 'pointer', padding: '8px 16px' }}
                  >
                    📊 {t('homepage.stats.jumpToDashboard')}
                  </Badge>
                </Link>
                <Link href="/market">
                  <Badge 
                    size="lg" 
                    variant="outline" 
                    color="orange" 
                    style={{ cursor: 'pointer', padding: '8px 16px' }}
                  >
                    🛒 {t('manage.market')}
                  </Badge>
                </Link>
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
                <Link href="/stats">
                  <Badge 
                    size="lg" 
                    variant="outline" 
                    color="grape" 
                    style={{ cursor: 'pointer', padding: '8px 16px' }}
                  >
                    📊 {t('homepage.stats.jumpToDashboard')}
                  </Badge>
                </Link>
                <Link href="/market">
                  <Badge 
                    size="lg" 
                    variant="outline" 
                    color="orange" 
                    style={{ cursor: 'pointer', padding: '8px 16px' }}
                  >
                    🛒 {t('manage.market')}
                  </Badge>
                </Link>
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
              <Link href="/stats">
                <Badge
                  size="lg"
                  variant="outline"
                  color="grape"
                  style={{ cursor: 'pointer', padding: '8px 16px' }}
                >
                  📊 {t('homepage.stats.jumpToDashboard')}
                </Badge>
              </Link>
              <Link href="/market">
                <Badge 
                  size="lg" 
                  variant="outline" 
                  color="orange" 
                  style={{ cursor: 'pointer', padding: '8px 16px' }}
                >
                  🛒 {t('manage.market')}
                </Badge>
              </Link>
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

      {/* Left Sidebar with search and filters */}
      <AppShell.Navbar p="md">
        <Stack gap="lg">
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
          ) : (
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
          )}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

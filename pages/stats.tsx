import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AppShell,
  Badge,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useTranslation } from '../src/contexts/I18nContext';
import { LanguageThemeControls } from '../src/components/LanguageThemeControls';
import { PracticeDashboard } from '../src/components/PracticeDashboard';

type ProblemLite = {
  id: string;
  title: { en: string; zh: string };
  difficulty: string;
  tags?: string[];
};

export default function StatsPage() {
  const { t } = useTranslation();
  const [problems, setProblems] = useState<ProblemLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await fetch('/api/problems');
        if (!response.ok) throw new Error('Failed to fetch problems');
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

  if (loading) {
    return (
      <AppShell header={{ height: 80 }} padding={{ base: 'sm', md: 'md' }}>
        <AppShell.Header>
          <Stack gap="xs" h="100%" justify="center" px="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={2} mb={4}>
                  {t('statsPage.title')}
                </Title>
                <Text size="sm" c="dimmed">
                  {t('statsPage.subtitle')}
                </Text>
              </div>
              <Group>
                <Link href="/">
                  <Badge size="lg" variant="outline" color="gray" style={{ cursor: 'pointer', padding: '8px 16px' }}>
                    ← {t('common.home')}
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
      <AppShell header={{ height: 80 }} padding={{ base: 'sm', md: 'md' }}>
        <AppShell.Header>
          <Stack gap="xs" h="100%" justify="center" px="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={2} mb={4}>
                  {t('statsPage.title')}
                </Title>
                <Text size="sm" c="dimmed">
                  {t('statsPage.subtitle')}
                </Text>
              </div>
              <Group>
                <Link href="/">
                  <Badge size="lg" variant="outline" color="gray" style={{ cursor: 'pointer', padding: '8px 16px' }}>
                    ← {t('common.home')}
                  </Badge>
                </Link>
                <LanguageThemeControls />
              </Group>
            </Group>
          </Stack>
        </AppShell.Header>
        <AppShell.Main>
          <Center style={{ minHeight: '50vh' }}>
            <Text c="red">{error}</Text>
          </Center>
        </AppShell.Main>
      </AppShell>
    );
  }

  return (
    <AppShell header={{ height: 80 }} padding={{ base: 'sm', md: 'md' }}>
      <AppShell.Header>
        <Stack gap="xs" h="100%" justify="center" px="md">
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={2} mb={4}>
                {t('statsPage.title')}
              </Title>
              <Text size="sm" c="dimmed">
                {t('statsPage.subtitle')}
              </Text>
            </div>
            <Group>
              <Link href="/">
                <Badge size="lg" variant="outline" color="gray" style={{ cursor: 'pointer', padding: '8px 16px' }}>
                  ← {t('common.home')}
                </Badge>
              </Link>
              <LanguageThemeControls />
            </Group>
          </Group>
        </Stack>
      </AppShell.Header>

      <AppShell.Main>
        <PracticeDashboard problems={problems as any} />
      </AppShell.Main>
    </AppShell>
  );
}


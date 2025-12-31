import { useEffect, useState } from 'react';
import {
  Center,
  Loader,
  Stack,
  Text,
} from '@mantine/core';
import { useTranslation } from '../src/contexts/I18nContext';
import { StandardPageLayout } from '../src/components/StandardPageLayout';
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
      <StandardPageLayout
        title={t('statsPage.title')}
        subtitle={t('statsPage.subtitle')}
        pageTitle={t('statsPage.title')}
      >
        <Center style={{ minHeight: '50vh' }}>
          <Stack align="center" gap={20}>
            <Loader size="lg" />
            <Text>{t('common.loading')}</Text>
          </Stack>
        </Center>
      </StandardPageLayout>
    );
  }

  if (error) {
    return (
      <StandardPageLayout
        title={t('statsPage.title')}
        subtitle={t('statsPage.subtitle')}
        pageTitle={t('statsPage.title')}
      >
        <Center style={{ minHeight: '50vh' }}>
          <Text c="red">{error}</Text>
        </Center>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title={t('statsPage.title')}
      subtitle={t('statsPage.subtitle')}
      pageTitle={t('statsPage.title')}
    >
      <PracticeDashboard problems={problems as any} />
    </StandardPageLayout>
  );
}

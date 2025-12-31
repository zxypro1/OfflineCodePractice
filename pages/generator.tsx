import React, { useState, useEffect } from 'react';
import { Container, Button, Text } from '@mantine/core';
import { useRouter } from 'next/router';
import { useTranslation, useI18n } from '../src/contexts/I18nContext';
import { StandardPageLayout } from '../src/components/StandardPageLayout';
import ProblemGenerator from '../src/components/ProblemGenerator';

interface GeneratedProblem {
  id: string;
  title: {
    en: string;
    zh: string;
  };
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  description: {
    en: string;
    zh: string;
  };
}

const GeneratorPage: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useI18n();
  const [lastGeneratedProblem, setLastGeneratedProblem] = useState<GeneratedProblem | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleProblemGenerated = (problem: GeneratedProblem) => {
    setLastGeneratedProblem(problem);
  };

  const handleTryProblem = () => {
    if (lastGeneratedProblem) {
      router.push(`/problems/${lastGeneratedProblem.id}`);
    }
  };

  if (!mounted) {
    return (
      <StandardPageLayout
        title={t('aiGenerator.title')}
        subtitle={t('aiGenerator.subtitle')}
        pageTitle={t('aiGenerator.title')}
      >
        <Text>{t('common.loading')}</Text>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title={t('aiGenerator.title')}
      subtitle={t('aiGenerator.subtitle')}
      pageTitle={t('aiGenerator.title')}
      rightSection={
        lastGeneratedProblem && (
          <Button 
            variant="outline"
            onClick={handleTryProblem}
          >
            {t('aiGenerator.tryLastProblem')}
          </Button>
        )
      }
    >
      <Container size="lg" py="xl">
        <ProblemGenerator onProblemGenerated={handleProblemGenerated} />
      </Container>
    </StandardPageLayout>
  );
};

export default GeneratorPage;

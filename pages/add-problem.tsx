import React from 'react';
import { Container } from '@mantine/core';
import { useTranslation } from '../src/contexts/I18nContext';
import { StandardPageLayout } from '../src/components/StandardPageLayout';
import ProblemForm from '../src/components/ProblemForm';

const AddProblem: React.FC = () => {
  const { t } = useTranslation();

  return (
    <StandardPageLayout
      title={t('addProblem.title')}
      pageTitle={t('addProblem.title')}
    >
      <Container size="xl" py="xl">
        <ProblemForm />
      </Container>
    </StandardPageLayout>
  );
};

export default AddProblem;

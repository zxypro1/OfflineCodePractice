import React, { ReactNode } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import {
  AppShell,
  Group,
  Title,
  Text,
  ActionIcon,
  Stack,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useTranslation } from '../contexts/I18nContext';
import { LanguageThemeControls } from './LanguageThemeControls';

interface StandardPageLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  rightSection?: ReactNode;
  loading?: boolean;
  pageTitle?: string; // For <Head> tag
}

export function StandardPageLayout({
  title,
  subtitle,
  children,
  rightSection,
  pageTitle,
}: StandardPageLayoutProps) {
  const { t } = useTranslation();

  return (
    <AppShell header={{ height: 80 }} padding="md">
      <Head>
        <title>{pageTitle || title} - {t('header.title')}</title>
      </Head>

      <AppShell.Header>
        <Stack gap="xs" h="100%" justify="center" px="md">
          <Group justify="space-between">
            <Group>
              <Link href="/">
                <ActionIcon variant="subtle" color="gray" size="lg">
                  <IconArrowLeft size={24} />
                </ActionIcon>
              </Link>
              <div>
                <Title order={3}>{title}</Title>
                {subtitle && (
                  <Text size="xs" c="dimmed">{subtitle}</Text>
                )}
              </div>
            </Group>
            <Group>
              {rightSection}
              <LanguageThemeControls />
            </Group>
          </Group>
        </Stack>
      </AppShell.Header>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}

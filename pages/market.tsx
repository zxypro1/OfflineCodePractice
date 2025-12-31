import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  AppShell,
  Title,
  Text,
  Group,
  Badge,
  Stack,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Container,
  Alert,
  Tabs,
  SimpleGrid,
  Divider,
  ActionIcon,
  Tooltip,
  Center,
  Loader,
  Select,
  MultiSelect,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSearch, IconDownload, IconUpload, IconLogout, IconBrandGithub, IconBrandGoogle } from '@tabler/icons-react';
import { useTranslation, useI18n } from '../src/contexts/I18nContext';
import { StandardPageLayout } from '../src/components/StandardPageLayout';

interface ProblemMarketItem {
  id: string;
  title: string;
  difficulty: string;
  tags: string[];
  download_count: number;
  created_at: string;
  username: string;
}

export default function MarketPage() {
  const { t } = useTranslation();
  const { locale } = useI18n();
  
  const [user, setUser] = useState<{ token: string; username: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Auth Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthModeLoading] = useState(false);
  
  // Market State
  const [problems, setProblems] = useState<ProblemMarketItem[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const API_BASE = '/api'; // Proxy to Rust backend via vercel.json

  useEffect(() => {
    const savedUser = localStorage.getItem('market_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchMarketProblems();
    }
  }, [user]);

  const fetchMarketProblems = async () => {
    setMarketLoading(true);
    try {
      const res = await fetch(`${API_BASE}/market/problems`);
      if (res.ok) {
        const data = await res.json();
        setProblems(data);
      }
    } catch (err) {
      console.error('Failed to fetch problems', err);
    } finally {
      setMarketLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthModeLoading(true);
    
    const endpoint = authMode === 'login' ? 'login' : 'register';
    const payload = authMode === 'login' 
      ? { email, password }
      : { username, email, password };
      
    try {
      const res = await fetch(`${API_BASE}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('market_user', JSON.stringify(data));
        setUser(data);
        notifications.show({
          title: t('common.success'),
          message: authMode === 'login' ? t('market.loginSuccess') : t('market.registerSuccess'),
          color: 'green',
        });
      } else {
        notifications.show({
          title: t('common.error'),
          message: data.error || 'Authentication failed',
          color: 'red',
        });
      }
    } catch (err) {
      notifications.show({
        title: t('common.error'),
        message: 'Network error',
        color: 'red',
      });
    } finally {
      setAuthModeLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('market_user');
    setUser(null);
    setProblems([]);
  };

  const handleDownload = async (problemId: string) => {
    if (!user) return;
    
    try {
      const res = await fetch(`${API_BASE}/market/problems/${problemId}/download`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      
      if (res.ok) {
        const problemData = await res.json();
        // The problemData.content contains the full JSON of the problem
        // We use our local /api/add-problem to save it
        const addRes = await fetch('/api/add-problem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problem: problemData.content }),
        });

        if (addRes.ok) {
          notifications.show({
            title: t('common.success'),
            message: t('market.downloadSuccess'),
            color: 'green',
          });
          // Refresh list to update download count
          fetchMarketProblems();
        } else {
          const error = await addRes.json();
          notifications.show({
            title: t('common.error'),
            message: error.error || 'Failed to save problem locally',
            color: 'red',
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Center style={{ height: '100vh' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <StandardPageLayout
      title={t('market.title')}
      subtitle={t('market.subtitle')}
      pageTitle={t('market.title')}
      rightSection={
        user && (
          <Group gap="xs">
            <Text size="sm" fw={500}>{user.username}</Text>
            <Button variant="subtle" color="red" size="xs" leftSection={<IconLogout size={14} />} onClick={handleLogout}>
              {t('market.logout')}
            </Button>
          </Group>
        )
      }
    >
        {!user ? (
          <Container size="xs" py={100}>
            <Paper withBorder shadow="md" p={30} radius="md">
              <Title order={2} ta="center" mb="lg">
                {authMode === 'login' ? t('market.login') : t('market.register')}
              </Title>
              
              <form onSubmit={handleAuth}>
                <Stack>
                  {authMode === 'register' && (
                    <TextInput 
                      label={t('market.username')} 
                      placeholder="Your username" 
                      required 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  )}
                  <TextInput 
                    label={t('market.email')} 
                    placeholder="hello@example.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <PasswordInput 
                    label={t('market.password')} 
                    placeholder="Your password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  
                  <Button type="submit" loading={authLoading}>
                    {authMode === 'login' ? t('market.login') : t('market.register')}
                  </Button>
                </Stack>
              </form>

              <Divider label="OR" labelPosition="center" my="lg" />

              <Group grow mb="md">
                <Button variant="default" leftSection={<IconBrandGithub size={20} />} onClick={() => window.location.href = `${API_BASE}/auth/github`}>
                  GitHub
                </Button>
                <Button variant="default" leftSection={<IconBrandGoogle size={20} />} onClick={() => window.location.href = `${API_BASE}/auth/google`}>
                  Google
                </Button>
              </Group>

              <Text ta="center" size="sm" mt="md">
                {authMode === 'login' ? (
                  <Text component="span" c="blue" style={{ cursor: 'pointer' }} onClick={() => setAuthMode('register')}>
                    {t('market.noAccount')}
                  </Text>
                ) : (
                  <Text component="span" c="blue" style={{ cursor: 'pointer' }} onClick={() => setAuthMode('login')}>
                    {t('market.hasAccount')}
                  </Text>
                )}
              </Text>
            </Paper>
          </Container>
        ) : (
          <Stack gap="xl">
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <TextInput
                  placeholder={t('market.searchPlaceholder')}
                  leftSection={<IconSearch size={16} />}
                  style={{ flex: 1 }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                />
                <Link href="/manage">
                  <Button variant="light" leftSection={<IconUpload size={16} />}>
                    {t('market.uploadProblem')}
                  </Button>
                </Link>
              </Group>
            </Paper>

            {marketLoading ? (
              <Center py="xl">
                <Loader size="lg" />
              </Center>
            ) : problems.length === 0 ? (
              <Center py={100}>
                <Stack align="center" gap="xs">
                  <Text c="dimmed">{t('market.noProblems')}</Text>
                </Stack>
              </Center>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {problems
                  .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((problem) => (
                  <Paper key={problem.id} withBorder p="md" radius="md">
                    <Stack gap="xs">
                      <Group justify="space-between" align="flex-start">
                        <Title order={4} lineClamp={1}>{problem.title}</Title>
                        <Badge color={problem.difficulty === 'Easy' ? 'green' : problem.difficulty === 'Medium' ? 'yellow' : 'red'}>
                          {t(`homepage.difficulty.${problem.difficulty}`)}
                        </Badge>
                      </Group>
                      
                      <Group gap={4}>
                        {problem.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} size="xs" variant="outline">{tag}</Badge>
                        ))}
                        {problem.tags.length > 3 && <Text size="xs" c="dimmed">+{problem.tags.length - 3}</Text>}
                      </Group>

                      <Divider my={4} />

                      <Group justify="space-between" align="center">
                        <div>
                          <Text size="xs" c="dimmed">{t('market.author')}: {problem.username}</Text>
                          <Text size="xs" c="dimmed">{t('market.downloadCount')}: {problem.download_count}</Text>
                        </div>
                        <Button 
                          variant="light" 
                          size="xs" 
                          leftSection={<IconDownload size={14} />}
                          onClick={() => handleDownload(problem.id)}
                        >
                          {t('market.downloadProblem')}
                        </Button>
                      </Group>
                    </Stack>
                  </Paper>
                ))}
              </SimpleGrid>
           )}
         </Stack>
         )}
    </StandardPageLayout>
  );
}

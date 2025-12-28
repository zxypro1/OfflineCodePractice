import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Group,
  Paper,
  RingProgress,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useTranslation, useI18n } from '../contexts/I18nContext';
import {
  aggregateByDay,
  aggregateTodayProblems,
  calculateAccuracyByDifficulty,
  calculateAccuracyByTag,
  clearPracticeAttemptEvents,
  getRecentAttemptEvents,
  lastNDaysKeys,
  loadPracticeAttemptEvents,
  PRACTICE_STATS_UPDATED_EVENT,
} from '../lib/practiceStats';
import { SparkBarChart } from './SparkBarChart';
import { ContributionHeatmap } from './ContributionHeatmap';

type ProblemLite = {
  id: string;
  title: { en: string; zh: string };
  difficulty: string;
  tags?: string[];
};

export function PracticeDashboard({ problems }: { problems: ProblemLite[] }) {
  const { t } = useTranslation();
  const { locale } = useI18n();
  const [range, setRange] = useState<'7' | '30' | '90' | '365'>('7');
  const [eventsVersion, setEventsVersion] = useState(0);

  // keep it reactive across tabs + same-tab updates
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.includes('practice-attempt-events-v1')) {
        setEventsVersion((v) => v + 1);
      }
    };
    const onUpdated = () => setEventsVersion((v) => v + 1);
    window.addEventListener('storage', onStorage);
    window.addEventListener(PRACTICE_STATS_UPDATED_EVENT, onUpdated as any);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const data = useMemo(() => {
    const events = loadPracticeAttemptEvents();
    const days = range === '7' ? 7 : range === '30' ? 30 : range === '90' ? 90 : 365;
    const keys = lastNDaysKeys(days);
    const daily = aggregateByDay(events, keys);

    // Unique-problem based
    const totalAttempted = daily.reduce((sum, d) => sum + d.attempted, 0);
    const totalSolved = daily.reduce((sum, d) => sum + d.solved, 0);
    const accuracy = totalAttempted === 0 ? 0 : Math.round((totalSolved / totalAttempted) * 100);

    // Submission based (each run = one submission)
    const totalSubmissions = daily.reduce((sum, d) => sum + d.submissions, 0);
    const totalCorrectSubmissions = daily.reduce((sum, d) => sum + d.correctSubmissions, 0);
    const submissionAccuracy =
      totalSubmissions === 0 ? 0 : Math.round((totalCorrectSubmissions / totalSubmissions) * 100);

    const todayKey = keys[keys.length - 1];
    const todayProblems = aggregateTodayProblems(events, todayKey);
    const recentEvents = getRecentAttemptEvents(events, 50);

    const idToProblem = new Map(problems.map((p) => [p.id, p]));
    
    // Calculate accuracy by difficulty and tags
    const accuracyByDifficulty = calculateAccuracyByDifficulty(events, idToProblem, keys);
    const accuracyByTag = calculateAccuracyByTag(events, idToProblem, keys);

    return {
      daily,
      totalAttempted,
      totalSolved,
      accuracy,
      totalSubmissions,
      totalCorrectSubmissions,
      submissionAccuracy,
      todayKey,
      todayProblems,
      recentEvents,
      idToProblem,
      accuracyByDifficulty,
      accuracyByTag,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problems, range, eventsVersion]);

  const attemptedTrend = data.daily.map((d) => d.attempted);
  const solvedTrend = data.daily.map((d) => d.solved);
  const submissionsTrend = data.daily.map((d) => d.submissions);
  const correctSubmissionsTrend = data.daily.map((d) => d.correctSubmissions);
  const labels = data.daily.map((d) => d.date.slice(5)); // MM-DD

  const todayAttempted = data.todayProblems.length; // unique problems
  const todaySolved = data.todayProblems.filter((p) => p.solved).length; // unique problems solved
  const todayAccuracy = todayAttempted === 0 ? 0 : Math.round((todaySolved / todayAttempted) * 100); // unique-problem accuracy

  // Submission-based today stats
  const todayAgg = data.daily[data.daily.length - 1];
  const todaySubmissions = todayAgg?.submissions || 0;
  const todayCorrectSubmissions = todayAgg?.correctSubmissions || 0;
  const todaySubmissionAccuracy =
    todaySubmissions === 0 ? 0 : Math.round((todayCorrectSubmissions / todaySubmissions) * 100);

  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" align="center" mb="sm">
        <div>
          <Title order={4}>{t('homepage.stats.title')}</Title>
          <Text size="xs" c="dimmed">
            {t('homepage.stats.subtitle')}
          </Text>
        </div>
        <Group>
          <SegmentedControl
            size="xs"
            value={range}
            onChange={(v) => setRange(v as '7' | '30' | '90' | '365')}
            data={[
              { value: '7', label: t('homepage.stats.last7Days') },
              { value: '30', label: t('homepage.stats.last30Days') },
              { value: '90', label: t('homepage.stats.last90Days') },
              { value: '365', label: t('homepage.stats.last365Days') },
            ]}
          />
          <Button
            variant="light"
            color="red"
            size="xs"
            onClick={() => {
              clearPracticeAttemptEvents();
              setEventsVersion((v) => v + 1);
            }}
          >
            {t('homepage.stats.clear')}
          </Button>
        </Group>
      </Group>

      <Group align="stretch" gap="md" wrap="wrap">
        <Paper
          withBorder
          p="md"
          radius="md"
          style={{
            flex: '1 1 260px',
            minWidth: 260,
          }}
        >
          <Group justify="space-between" mb="md">
            <Text size="sm" fw={700} c="dimmed">
              {t('homepage.stats.today')}
            </Text>
            <Badge variant="filled" color={todaySolved === todayAttempted && todayAttempted > 0 ? 'green' : 'blue'} size="sm">
              {data.todayKey}
            </Badge>
          </Group>
          <Stack gap="md">
            <div>
              <Group justify="space-between" align="flex-start" mb={4}>
                <div style={{ flex: 1 }}>
                  <Text size="xs" c="dimmed" mb={2}>
                    {t('homepage.stats.todayAttempted')}
                  </Text>
                  <Text fw={700} size="xl" c="blue">
                    {todayAttempted}
                  </Text>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <Text size="xs" c="dimmed" mb={2}>
                    {t('homepage.stats.todaySolved')}
                  </Text>
                  <Text fw={700} size="xl" c="green">
                    {todaySolved}
                  </Text>
                </div>
              </Group>
            </div>
            <div
              style={{
                height: 1,
                background: 'var(--mantine-color-gray-3)',
                opacity: 0.5,
              }}
            />
            <div>
              <Group justify="space-between" align="flex-start" mb={4}>
                <div style={{ flex: 1 }}>
                  <Text size="xs" c="dimmed" mb={2}>
                    {t('homepage.stats.todaySubmissions')}
                  </Text>
                  <Text fw={700} size="xl" c="indigo">
                    {todaySubmissions}
                  </Text>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <Text size="xs" c="dimmed" mb={2}>
                    {t('homepage.stats.todayCorrectSubmissions')}
                  </Text>
                  <Text fw={700} size="xl" c="teal">
                    {todayCorrectSubmissions}
                  </Text>
                </div>
              </Group>
            </div>
            <div
              style={{
                height: 1,
                background: 'var(--mantine-color-gray-3)',
                opacity: 0.5,
              }}
            />
            <Group justify="center" mt="xs">
              <RingProgress
                size={100}
                thickness={12}
                sections={[{ value: todaySubmissionAccuracy, color: todaySubmissionAccuracy === 100 ? 'green' : 'blue' }]}
                label={
                  <Text size="xs" ta="center" fw={600}>
                    {t('homepage.stats.submissionAccuracy')}
                    <br />
                    <Text component="span" fw={700} size="lg">
                      {todaySubmissionAccuracy}%
                    </Text>
                  </Text>
                }
              />
            </Group>
            <div
              style={{
                height: 1,
                background: 'var(--mantine-color-gray-3)',
                opacity: 0.5,
              }}
            />
            {/* Accuracy by Difficulty */}
            <div>
              <Text size="xs" fw={600} mb="sm" c="dimmed">
                {t('homepage.stats.accuracyByDifficulty')}
              </Text>
              {data.accuracyByDifficulty.length === 0 ? (
                <Text size="xs" c="dimmed">
                  {t('homepage.stats.noData')}
                </Text>
              ) : (
                <Stack gap="xs">
                  {data.accuracyByDifficulty.map((item) => (
                    <div key={item.difficulty}>
                      <Group justify="space-between" align="center" mb={2}>
                        <Badge
                          color={
                            item.difficulty === 'Easy'
                              ? 'green'
                              : item.difficulty === 'Medium'
                              ? 'yellow'
                              : item.difficulty === 'Hard'
                              ? 'red'
                              : 'gray'
                          }
                          variant="light"
                          size="xs"
                        >
                          {t(`homepage.difficulty.${item.difficulty}`) || item.difficulty}
                        </Badge>
                        <Text size="xs" fw={600} c="violet">
                          {item.accuracy}%
                        </Text>
                      </Group>
                      <Group justify="space-between" align="center">
                        <Text size="xs" c="dimmed" style={{ fontSize: '10px' }}>
                          {item.solved}/{item.attempted}
                        </Text>
                        <RingProgress
                          size={30}
                          thickness={3}
                          sections={[{ value: item.accuracy, color: item.accuracy === 100 ? 'green' : 'blue' }]}
                        />
                      </Group>
                    </div>
                  ))}
                </Stack>
              )}
            </div>
            <div
              style={{
                height: 1,
                background: 'var(--mantine-color-gray-3)',
                opacity: 0.5,
              }}
            />
            {/* Accuracy by Tag */}
            <div>
              <Text size="xs" fw={600} mb="sm" c="dimmed">
                {t('homepage.stats.accuracyByTag')}
              </Text>
              {data.accuracyByTag.length === 0 ? (
                <Text size="xs" c="dimmed">
                  {t('homepage.stats.noData')}
                </Text>
              ) : (
                <Stack gap="xs" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {data.accuracyByTag.slice(0, 8).map((item) => (
                    <div key={item.tag}>
                      <Group justify="space-between" align="center" mb={2}>
                        <Badge color="blue" variant="light" size="xs">
                          {t(`tags.${item.tag}`) !== `tags.${item.tag}` ? t(`tags.${item.tag}`) : item.tag}
                        </Badge>
                        <Text size="xs" fw={600} c="violet">
                          {item.accuracy}%
                        </Text>
                      </Group>
                      <Group justify="space-between" align="center">
                        <Text size="xs" c="dimmed" style={{ fontSize: '10px' }}>
                          {item.solved}/{item.attempted}
                        </Text>
                        <RingProgress
                          size={30}
                          thickness={3}
                          sections={[{ value: item.accuracy, color: item.accuracy === 100 ? 'green' : 'blue' }]}
                        />
                      </Group>
                    </div>
                  ))}
                  {data.accuracyByTag.length > 8 && (
                    <Text size="xs" c="dimmed" ta="center" style={{ fontSize: '10px' }}>
                      {t('homepage.stats.more', { count: data.accuracyByTag.length - 8 })} {t('homepage.stats.tags')}
                    </Text>
                  )}
                </Stack>
              )}
            </div>
            <div
              style={{
                height: 1,
                background: 'var(--mantine-color-gray-3)',
                opacity: 0.5,
              }}
            />
            {/* Summary */}
            <div>
              <Text size="xs" fw={600} mb="sm" c="dimmed">
                {t('homepage.stats.summary')}
              </Text>
              <Stack gap="xs">
                <div>
                  <Group justify="space-between" align="flex-start" mb={2}>
                    <div style={{ flex: 1 }}>
                      <Text size="xs" c="dimmed" mb={1} style={{ fontSize: '10px' }}>
                        {t('homepage.stats.rangeAttempted')}
                      </Text>
                      <Text fw={700} size="sm" c="blue">
                        {data.totalAttempted}
                      </Text>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <Text size="xs" c="dimmed" mb={1} style={{ fontSize: '10px' }}>
                        {t('homepage.stats.rangeSolved')}
                      </Text>
                      <Text fw={700} size="sm" c="green">
                        {data.totalSolved}
                      </Text>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <Text size="xs" c="dimmed" mb={1} style={{ fontSize: '10px' }}>
                        {t('homepage.stats.accuracy')}
                      </Text>
                      <Text fw={700} size="sm" c="violet">
                        {data.accuracy}%
                      </Text>
                    </div>
                  </Group>
                </div>
                <div
                  style={{
                    height: 1,
                    background: 'var(--mantine-color-gray-3)',
                    opacity: 0.5,
                  }}
                />
                <div>
                  <Group justify="space-between" align="flex-start" mb={2}>
                    <div style={{ flex: 1 }}>
                      <Text size="xs" c="dimmed" mb={1} style={{ fontSize: '10px' }}>
                        {t('homepage.stats.rangeSubmissions')}
                      </Text>
                      <Text fw={700} size="sm" c="indigo">
                        {data.totalSubmissions}
                      </Text>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <Text size="xs" c="dimmed" mb={1} style={{ fontSize: '10px' }}>
                        {t('homepage.stats.rangeCorrectSubmissions')}
                      </Text>
                      <Text fw={700} size="sm" c="teal">
                        {data.totalCorrectSubmissions}
                      </Text>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <Text size="xs" c="dimmed" mb={1} style={{ fontSize: '10px' }}>
                        {t('homepage.stats.submissionAccuracy')}
                      </Text>
                      <Text fw={700} size="sm" c="violet">
                        {data.submissionAccuracy}%
                      </Text>
                    </div>
                  </Group>
                </div>
              </Stack>
            </div>
          </Stack>
        </Paper>

        <Paper withBorder p="sm" radius="md" style={{ flex: '2 1 420px', minWidth: 320 }}>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={600}>
              {t('homepage.stats.trend')}
            </Text>
            <Badge variant="light">{t('homepage.stats.unitProblems')}</Badge>
          </Group>
          <Stack gap="md">
            {/* Contribution Heatmap */}
            {data.daily.length > 0 && (
              <div>
                <Text size="xs" c="dimmed" mb={4}>
                  {t('homepage.stats.contributionHeatmap')}
                </Text>
                <Paper withBorder p="sm" radius="md" style={{ backgroundColor: 'var(--mantine-color-body)' }}>
                  <ContributionHeatmap
                    data={data.daily.map((d) => ({ date: d.date, value: d.submissions }))}
                    startDate={new Date(data.daily[0].date)}
                    endDate={new Date(data.daily[data.daily.length - 1].date)}
                  />
                </Paper>
              </div>
            )}
            <div>
              <Text size="xs" c="dimmed" mb={4}>
                {t('homepage.stats.attemptedTrend')}
              </Text>
              <SparkBarChart values={attemptedTrend} labels={labels} hideXAxis={range === '90' || range === '365'} />
            </div>
            <div>
              <Text size="xs" c="dimmed" mb={4}>
                {t('homepage.stats.solvedTrend')}
              </Text>
              <SparkBarChart values={solvedTrend} labels={labels} barColor="var(--mantine-color-green-filled)" hideXAxis={range === '90' || range === '365'} />
            </div>
            <div>
              <Text size="xs" c="dimmed" mb={4}>
                {t('homepage.stats.submissionsTrend')}
              </Text>
              <SparkBarChart values={submissionsTrend} labels={labels} barColor="var(--mantine-color-indigo-filled)" hideXAxis={range === '90' || range === '365'} />
            </div>
            <div>
              <Text size="xs" c="dimmed" mb={4}>
                {t('homepage.stats.correctSubmissionsTrend')}
              </Text>
              <SparkBarChart
                values={correctSubmissionsTrend}
                labels={labels}
                barColor="var(--mantine-color-teal-filled)"
                hideXAxis={range === '90' || range === '365'}
              />
            </div>
          </Stack>
        </Paper>
      </Group>

      <Paper withBorder p="sm" radius="md" mt="md">
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={600}>
            {t('homepage.stats.todayProblems')}
          </Text>
          <Badge variant="light" color="gray">
            {t('homepage.stats.uniqueProblemsTip')}
          </Badge>
        </Group>

        {data.todayProblems.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t('homepage.stats.empty')}
          </Text>
        ) : (
          <Stack gap={6}>
            {data.todayProblems.slice(0, 12).map((p) => {
              const meta = data.idToProblem.get(p.problemId);
              const title = meta
                ? meta.title[locale as 'en' | 'zh'] || meta.title.zh
                : p.problemId;
              return (
                <Group key={p.problemId} justify="space-between" wrap="nowrap">
                  <Text size="sm" lineClamp={1} style={{ flex: 1 }}>
                    <Link href={`/problems/${p.problemId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {title}
                    </Link>
                  </Text>
                  <Group gap={6} wrap="nowrap">
                    <Badge size="sm" variant="light" color={p.solved ? 'green' : 'red'}>
                      {p.solved ? t('homepage.stats.solved') : t('homepage.stats.unsolved')}
                    </Badge>
                    <Badge size="sm" variant="light" color="blue">
                      {t('homepage.stats.attempts')}: {p.attempts}
                    </Badge>
                  </Group>
                </Group>
              );
            })}
            {data.todayProblems.length > 12 && (
              <Text size="xs" c="dimmed">
                {t('homepage.stats.more', { count: data.todayProblems.length - 12 })}
              </Text>
            )}
          </Stack>
        )}
      </Paper>

      <Paper withBorder p="sm" radius="md" mt="md">
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={600}>
            {t('homepage.stats.recentSubmissions')}
          </Text>
          <Badge variant="light" color="gray">
            {t('homepage.stats.recentSubmissionsTip')}
          </Badge>
        </Group>

        {data.recentEvents.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t('homepage.stats.empty')}
          </Text>
        ) : (
          <Stack gap={6}>
            {data.recentEvents.slice(0, 20).map((e) => {
              const meta = data.idToProblem.get(e.problemId);
              const title = meta ? meta.title[locale as 'en' | 'zh'] || meta.title.zh : e.problemId;
              return (
                <Group key={e.id} justify="space-between" wrap="nowrap" align="center">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" lineClamp={1}>
                      <Link href={`/problems/${e.problemId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {title}
                      </Link>
                    </Text>
                    <Text size="xs" c="dimmed">
                      {new Date(e.ts).toLocaleString()}
                    </Text>
                  </div>

                  <Group gap={6} wrap="nowrap">
                    <Badge size="sm" variant="light" color={e.allPassed ? 'green' : 'red'}>
                      {e.allPassed ? t('homepage.stats.correct') : t('homepage.stats.wrong')}
                    </Badge>
                    <Badge size="sm" variant="light" color="blue">
                      {t('homepage.stats.tests')}: {e.passedTests}/{e.totalTests}
                    </Badge>
                    <Badge size="sm" variant="light" color="gray">
                      {t('homepage.stats.language')}: {e.language}
                    </Badge>
                    {typeof e.totalExecutionTimeMs === 'number' && (
                      <Badge size="sm" variant="light" color="violet">
                        {t('homepage.stats.execTime')}: {e.totalExecutionTimeMs}ms
                      </Badge>
                    )}
                  </Group>
                </Group>
              );
            })}
            {data.recentEvents.length > 20 && (
              <Text size="xs" c="dimmed">
                {t('homepage.stats.more', { count: data.recentEvents.length - 20 })}
              </Text>
            )}
          </Stack>
        )}
      </Paper>
    </Paper>
  );
}


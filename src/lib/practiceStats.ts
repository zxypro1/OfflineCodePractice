export type PracticeAttemptEvent = {
  id: string;
  ts: string; // ISO string
  problemId: string;
  language: string;
  totalTests: number;
  passedTests: number;
  allPassed: boolean;
  totalExecutionTimeMs?: number;
};

const STORAGE_KEY = 'practice-attempt-events-v1';
export const PRACTICE_STATS_UPDATED_EVENT = 'practice-stats-updated';
const MAX_EVENTS = 5000;

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadPracticeAttemptEvents(): PracticeAttemptEvent[] {
  if (typeof window === 'undefined') return [];
  const data = safeJsonParse<PracticeAttemptEvent[]>(
    window.localStorage.getItem(STORAGE_KEY)
  );
  if (!Array.isArray(data)) return [];

  // Basic sanitization
  return data
    .filter((e) => e && typeof e === 'object')
    .filter((e: any) => typeof e.id === 'string' && typeof e.ts === 'string' && typeof e.problemId === 'string')
    .slice(-MAX_EVENTS);
}

export function savePracticeAttemptEvents(events: PracticeAttemptEvent[]) {
  if (typeof window === 'undefined') return;
  const next = Array.isArray(events) ? events.slice(-MAX_EVENTS) : [];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearPracticeAttemptEvents() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function appendPracticeAttemptEvent(event: Omit<PracticeAttemptEvent, 'id' | 'ts'> & { ts?: string }) {
  if (typeof window === 'undefined') return;
  const nowIso = event.ts || new Date().toISOString();
  const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const nextEvent: PracticeAttemptEvent = {
    id,
    ts: nowIso,
    problemId: event.problemId,
    language: event.language,
    totalTests: event.totalTests,
    passedTests: event.passedTests,
    allPassed: event.allPassed,
    totalExecutionTimeMs: event.totalExecutionTimeMs,
  };

  const events = loadPracticeAttemptEvents();
  events.push(nextEvent);
  savePracticeAttemptEvents(events);
}

export function dateKeyLocal(isoTs: string): string {
  const d = new Date(isoTs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function lastNDaysKeys(n: number, now: Date = new Date()): string[] {
  const keys: string[] = [];
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    keys.push(`${y}-${m}-${day}`);
  }
  return keys;
}

export type DailyAgg = {
  date: string; // yyyy-mm-dd
  attempted: number; // unique problems attempted that day
  solved: number; // unique problems solved that day (any allPassed)
  submissions: number; // total attempts (events)
  correctSubmissions: number; // total correct attempts (allPassed events)
};

export function aggregateByDay(events: PracticeAttemptEvent[], dayKeys: string[]): DailyAgg[] {
  const byDay = new Map<
    string,
    { attemptedSet: Set<string>; solvedSet: Set<string>; submissions: number; correctSubmissions: number }
  >();
  for (const k of dayKeys) byDay.set(k, { attemptedSet: new Set(), solvedSet: new Set(), submissions: 0, correctSubmissions: 0 });

  for (const e of events) {
    const day = dateKeyLocal(e.ts);
    const bucket = byDay.get(day);
    if (!bucket) continue;
    bucket.attemptedSet.add(e.problemId);
    bucket.submissions += 1;
    if (e.allPassed) bucket.solvedSet.add(e.problemId);
    if (e.allPassed) bucket.correctSubmissions += 1;
  }

  return dayKeys.map((date) => {
    const bucket = byDay.get(date)!;
    return {
      date,
      attempted: bucket.attemptedSet.size,
      solved: bucket.solvedSet.size,
      submissions: bucket.submissions,
      correctSubmissions: bucket.correctSubmissions,
    };
  });
}

export function aggregateTodayProblems(events: PracticeAttemptEvent[], todayKey: string) {
  const map = new Map<
    string,
    { problemId: string; lastTs: string; attempted: boolean; solved: boolean; attempts: number }
  >();

  for (const e of events) {
    const day = dateKeyLocal(e.ts);
    if (day !== todayKey) continue;

    const prev = map.get(e.problemId);
    const next = {
      problemId: e.problemId,
      lastTs: prev ? (prev.lastTs > e.ts ? prev.lastTs : e.ts) : e.ts,
      attempted: true,
      solved: (prev?.solved || false) || e.allPassed,
      attempts: (prev?.attempts || 0) + 1,
    };
    map.set(e.problemId, next);
  }

  return Array.from(map.values()).sort((a, b) => (a.lastTs < b.lastTs ? 1 : -1));
}


export function buildProblemStatusIndex(events: PracticeAttemptEvent[]) {
  const map = new Map<string, { attempted: boolean; solved: boolean; lastTs: string }>();
  for (const e of events) {
    const prev = map.get(e.problemId);
    const lastTs = prev ? (prev.lastTs > e.ts ? prev.lastTs : e.ts) : e.ts;
    map.set(e.problemId, {
      attempted: true,
      solved: (prev?.solved || false) || e.allPassed,
      lastTs,
    });
  }
  return map;
}

export function getRecentAttemptEvents(events: PracticeAttemptEvent[], limit: number): PracticeAttemptEvent[] {
  const sorted = [...events].sort((a, b) => (a.ts < b.ts ? 1 : -1));
  return sorted.slice(0, Math.max(0, limit));
}

export type AccuracyByDifficulty = {
  difficulty: string;
  attempted: number;
  solved: number;
  accuracy: number;
};

export type AccuracyByTag = {
  tag: string;
  attempted: number;
  solved: number;
  accuracy: number;
};

export function calculateAccuracyByDifficulty(
  events: PracticeAttemptEvent[],
  problems: Map<string, { difficulty: string }>,
  dayKeys: string[]
): AccuracyByDifficulty[] {
  const byDifficulty = new Map<string, { attemptedSet: Set<string>; solvedSet: Set<string> }>();
  
  for (const e of events) {
    const day = dateKeyLocal(e.ts);
    if (!dayKeys.includes(day)) continue;
    
    const problem = problems.get(e.problemId);
    if (!problem) continue;
    
    const difficulty = problem.difficulty || 'Unknown';
    let bucket = byDifficulty.get(difficulty);
    if (!bucket) {
      bucket = { attemptedSet: new Set(), solvedSet: new Set() };
      byDifficulty.set(difficulty, bucket);
    }
    
    bucket.attemptedSet.add(e.problemId);
    if (e.allPassed) {
      bucket.solvedSet.add(e.problemId);
    }
  }
  
  const result: AccuracyByDifficulty[] = [];
  for (const [difficulty, bucket] of byDifficulty.entries()) {
    const attempted = bucket.attemptedSet.size;
    const solved = bucket.solvedSet.size;
    const accuracy = attempted === 0 ? 0 : Math.round((solved / attempted) * 100);
    result.push({ difficulty, attempted, solved, accuracy });
  }
  
  // Sort by difficulty order: Easy, Medium, Hard, then others
  const order = ['Easy', 'Medium', 'Hard'];
  return result.sort((a, b) => {
    const aIdx = order.indexOf(a.difficulty);
    const bIdx = order.indexOf(b.difficulty);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.difficulty.localeCompare(b.difficulty);
  });
}

export function calculateAccuracyByTag(
  events: PracticeAttemptEvent[],
  problems: Map<string, { tags?: string[] }>,
  dayKeys: string[]
): AccuracyByTag[] {
  const byTag = new Map<string, { attemptedSet: Set<string>; solvedSet: Set<string> }>();
  
  for (const e of events) {
    const day = dateKeyLocal(e.ts);
    if (!dayKeys.includes(day)) continue;
    
    const problem = problems.get(e.problemId);
    if (!problem || !problem.tags || problem.tags.length === 0) continue;
    
    for (const tag of problem.tags) {
      let bucket = byTag.get(tag);
      if (!bucket) {
        bucket = { attemptedSet: new Set(), solvedSet: new Set() };
        byTag.set(tag, bucket);
      }
      
      bucket.attemptedSet.add(e.problemId);
      if (e.allPassed) {
        bucket.solvedSet.add(e.problemId);
      }
    }
  }
  
  const result: AccuracyByTag[] = [];
  for (const [tag, bucket] of byTag.entries()) {
    const attempted = bucket.attemptedSet.size;
    const solved = bucket.solvedSet.size;
    const accuracy = attempted === 0 ? 0 : Math.round((solved / attempted) * 100);
    result.push({ tag, attempted, solved, accuracy });
  }
  
  // Sort by accuracy descending, then by tag name
  return result.sort((a, b) => {
    if (b.attempted === 0 && a.attempted === 0) return a.tag.localeCompare(b.tag);
    if (b.attempted === 0) return -1;
    if (a.attempted === 0) return 1;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return a.tag.localeCompare(b.tag);
  });
}

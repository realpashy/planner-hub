// ── Primitive union types ─────────────────────────────────────────────────────

export type HabitType = "check" | "count" | "duration";
export type HabitFrequency = "daily" | "weekdays" | "weekends" | "weekly" | "custom";
export type MoodLevel = 1 | 2 | 3 | 4 | 5;
export type HabitCategory =
  | "health"
  | "fitness"
  | "mindfulness"
  | "learning"
  | "productivity"
  | "social"
  | "creative"
  | "custom";

// ── Label / icon maps (i18n-ready) ────────────────────────────────────────────

export const HABIT_CATEGORY_LABELS: Record<HabitCategory, string> = {
  health: "صحة",
  fitness: "لياقة",
  mindfulness: "ذهنية",
  learning: "تعلّم",
  productivity: "إنتاجية",
  social: "اجتماعي",
  creative: "إبداع",
  custom: "مخصص",
};

export const HABIT_CATEGORY_ICONS: Record<HabitCategory, string> = {
  health: "❤️",
  fitness: "💪",
  mindfulness: "🧘",
  learning: "📚",
  productivity: "⚡",
  social: "🤝",
  creative: "🎨",
  custom: "⭐",
};

// Category accent colors (Tailwind classes) for visual variety
export const HABIT_CATEGORY_COLORS: Record<HabitCategory, string> = {
  health: "#ef4444",
  fitness: "#f97316",
  mindfulness: "#8b5cf6",
  learning: "#3b82f6",
  productivity: "#eab308",
  social: "#10b981",
  creative: "#ec4899",
  custom: "#6b7280",
};

export const HABIT_TYPE_LABELS: Record<HabitType, string> = {
  check: "إتمام",
  count: "تكرار",
  duration: "مدة",
};

export const HABIT_TYPE_ICONS: Record<HabitType, string> = {
  check: "✓",
  count: "🔢",
  duration: "⏱️",
};

export const MOOD_LABELS: Record<MoodLevel, string> = {
  1: "سيء جداً",
  2: "سيء",
  3: "عادي",
  4: "جيد",
  5: "ممتاز",
};

export const MOOD_EMOJIS: Record<MoodLevel, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "😊",
  5: "😄",
};

export const FREQUENCY_LABELS: Record<HabitFrequency, string> = {
  daily: "يومياً",
  weekdays: "أيام الأسبوع",
  weekends: "نهاية الأسبوع",
  weekly: "أسبوعياً",
  custom: "مخصص",
};

// ── Core interfaces ───────────────────────────────────────────────────────────

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  type: HabitType;
  targetValue?: number;
  targetUnit?: string;
  frequency: HabitFrequency;
  customDays?: number[]; // 0 = Sunday … 6 = Saturday
  icon?: string;
  reminderTime?: string; // "HH:MM"
  isArchived: boolean;
  order: number;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  value?: number;
  note?: string;
  createdAt: string;
}

export interface MoodLog {
  id: string;
  date: string; // YYYY-MM-DD
  mood: MoodLevel;
  note?: string;
  createdAt: string;
}

export interface HabitsData {
  habits: Habit[];
  logs: HabitLog[];
  moodLogs: MoodLog[];
  lastUpdated: string;
}

// ── Derived types ─────────────────────────────────────────────────────────────

export interface WeekCompletionPoint {
  date: string;
  label: string;
  rate: number; // 0–100
}

export interface HeatmapCell {
  date: string;
  count: number;
  rate: number; // 0–100
}

export interface HabitInsightCard {
  habitId: string;
  name: string;
  icon?: string;
  category: HabitCategory;
  streak: number;
  completionRate: number;
  totalLogs: number;
}

export interface MoodCorrelationPoint {
  date: string;
  mood: number;
  rate: number;
}

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "planner_hub_habits_v1";

// ── Private helpers ───────────────────────────────────────────────────────────

function nowIso() {
  return new Date().toISOString();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// ── Public helpers ────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function dateKeyFor(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function isHabitDueToday(habit: Habit, date?: Date): boolean {
  const d = date ?? new Date();
  const day = d.getDay(); // 0=Sun … 6=Sat
  switch (habit.frequency) {
    case "daily":
      return true;
    case "weekdays":
      return day >= 1 && day <= 5;
    case "weekends":
      return day === 0 || day === 6;
    case "weekly":
      return day === 1; // Monday anchor
    case "custom":
      return (habit.customDays ?? []).includes(day);
    default:
      return true;
  }
}

export function getHabitsForToday(data: HabitsData): Habit[] {
  return data.habits.filter((h) => !h.isArchived && isHabitDueToday(h)).sort((a, b) => a.order - b.order);
}

export function getCompletedTodayIds(data: HabitsData): Set<string> {
  const today = getTodayKey();
  const ids = new Set<string>();
  for (const log of data.logs) {
    if (log.date === today && log.completed) ids.add(log.habitId);
  }
  return ids;
}

export function getTodayLogValue(habitId: string, data: HabitsData): number {
  const today = getTodayKey();
  const log = data.logs.find((l) => l.habitId === habitId && l.date === today);
  return log?.value ?? 0;
}

export function getTodayCompletionRate(data: HabitsData): number {
  const todayHabits = getHabitsForToday(data);
  if (todayHabits.length === 0) return 0;
  const completed = getCompletedTodayIds(data);
  const count = todayHabits.filter((h) => completed.has(h.id)).length;
  return Math.round((count / todayHabits.length) * 100);
}

export function getTodayMood(data: HabitsData): MoodLevel | undefined {
  const today = getTodayKey();
  const log = data.moodLogs.find((l) => l.date === today);
  return log?.mood;
}

export function getHabitStreak(habitId: string, data: HabitsData): number {
  const habit = data.habits.find((h) => h.id === habitId);
  if (!habit) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Walk backward starting from yesterday
  for (let i = 1; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKeyFor(d);

    if (!isHabitDueToday(habit, d)) continue; // skip non-due days without breaking streak

    const log = data.logs.find((l) => l.habitId === habitId && l.date === key);
    if (log?.completed) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function getLongestStreak(habitId: string, data: HabitsData): number {
  const habit = data.habits.find((h) => h.id === habitId);
  if (!habit) return 0;

  const logsForHabit = data.logs
    .filter((l) => l.habitId === habitId && l.completed)
    .map((l) => l.date)
    .sort();

  if (logsForHabit.length === 0) return 0;

  let longest = 0;
  let current = 0;
  let prevDate: Date | null = null;

  for (const dateStr of logsForHabit) {
    const d = new Date(`${dateStr}T12:00:00`);
    if (!prevDate) {
      current = 1;
    } else {
      const diffDays = Math.round((d.getTime() - prevDate.getTime()) / 86400000);
      if (diffDays === 1) {
        current++;
      } else {
        current = 1;
      }
    }
    if (current > longest) longest = current;
    prevDate = d;
  }
  return longest;
}

export function getWeekCompletion(data: HabitsData, weekOffset = 0): WeekCompletionPoint[] {
  const result: WeekCompletionPoint[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i - weekOffset * 7);
    const key = dateKeyFor(d);
    const dueHabits = data.habits.filter((h) => !h.isArchived && isHabitDueToday(h, d));
    const completedCount = dueHabits.filter((h) =>
      data.logs.some((l) => l.habitId === h.id && l.date === key && l.completed),
    ).length;
    const rate = dueHabits.length > 0 ? Math.round((completedCount / dueHabits.length) * 100) : 0;
    result.push({
      date: key,
      label: d.toLocaleDateString("ar", { weekday: "short" }),
      rate,
    });
  }
  return result;
}

export function getMonthHeatmapData(
  data: HabitsData,
  habitId?: string,
  monthKey?: string,
): HeatmapCell[] {
  const targetMonth = monthKey ?? getTodayKey().slice(0, 7);
  const [year, month] = targetMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const result: HeatmapCell[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${targetMonth}-${String(day).padStart(2, "0")}`;
    const d = new Date(`${dateStr}T12:00:00`);

    const dueHabits = habitId
      ? data.habits.filter((h) => h.id === habitId && isHabitDueToday(h, d))
      : data.habits.filter((h) => !h.isArchived && isHabitDueToday(h, d));

    const completedCount = dueHabits.filter((h) =>
      data.logs.some((l) => l.habitId === h.id && l.date === dateStr && l.completed),
    ).length;

    result.push({
      date: dateStr,
      count: completedCount,
      rate: dueHabits.length > 0 ? Math.round((completedCount / dueHabits.length) * 100) : 0,
    });
  }
  return result;
}

export function getMoodCorrelation(data: HabitsData, days = 30): MoodCorrelationPoint[] {
  const result: MoodCorrelationPoint[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKeyFor(d);

    const moodLog = data.moodLogs.find((l) => l.date === key);
    const dueHabits = data.habits.filter((h) => !h.isArchived && isHabitDueToday(h, d));
    const completedCount = dueHabits.filter((h) =>
      data.logs.some((l) => l.habitId === h.id && l.date === key && l.completed),
    ).length;
    const rate = dueHabits.length > 0 ? Math.round((completedCount / dueHabits.length) * 100) : 0;

    if (moodLog) {
      result.push({ date: key, mood: moodLog.mood, rate });
    }
  }
  return result;
}

export function getBestStreakHabit(data: HabitsData): HabitInsightCard | null {
  const active = data.habits.filter((h) => !h.isArchived);
  if (active.length === 0) return null;

  let best: HabitInsightCard | null = null;

  for (const habit of active) {
    const streak = getHabitStreak(habit.id, data);
    const logs = data.logs.filter((l) => l.habitId === habit.id && l.completed);
    const totalDueDays = data.logs.filter((l) => l.habitId === habit.id).length;
    const rate = totalDueDays > 0 ? Math.round((logs.length / totalDueDays) * 100) : 0;

    const card: HabitInsightCard = {
      habitId: habit.id,
      name: habit.name,
      icon: habit.icon,
      category: habit.category,
      streak,
      completionRate: rate,
      totalLogs: logs.length,
    };

    if (!best || streak > best.streak || (streak === best.streak && rate > best.completionRate)) {
      best = card;
    }
  }
  return best;
}

// ── Sanitizers ────────────────────────────────────────────────────────────────

function sanitizeHabit(raw: unknown, index: number): Habit | null {
  const source = asRecord(raw);
  if (typeof source.name !== "string" || !source.name.trim()) return null;

  const validTypes: HabitType[] = ["check", "count", "duration"];
  const validFreqs: HabitFrequency[] = ["daily", "weekdays", "weekends", "weekly", "custom"];
  const validCats: HabitCategory[] = [
    "health", "fitness", "mindfulness", "learning", "productivity", "social", "creative", "custom",
  ];

  return {
    id: typeof source.id === "string" && source.id ? source.id : generateId(),
    name: source.name.trim(),
    category: validCats.includes(source.category as HabitCategory) ? (source.category as HabitCategory) : "custom",
    type: validTypes.includes(source.type as HabitType) ? (source.type as HabitType) : "check",
    targetValue: source.targetValue !== undefined ? Math.max(1, toNumber(source.targetValue)) : undefined,
    targetUnit: typeof source.targetUnit === "string" && source.targetUnit.trim() ? source.targetUnit.trim() : undefined,
    frequency: validFreqs.includes(source.frequency as HabitFrequency) ? (source.frequency as HabitFrequency) : "daily",
    customDays: Array.isArray(source.customDays)
      ? (source.customDays as unknown[]).filter((d): d is number => typeof d === "number")
      : undefined,
    icon: typeof source.icon === "string" && source.icon.trim() ? source.icon.trim() : undefined,
    reminderTime:
      typeof source.reminderTime === "string" && /^\d{2}:\d{2}$/.test(source.reminderTime)
        ? source.reminderTime
        : undefined,
    isArchived: Boolean(source.isArchived),
    order: typeof source.order === "number" ? source.order : index,
    createdAt: typeof source.createdAt === "string" && source.createdAt ? source.createdAt : nowIso(),
  };
}

function sanitizeHabitLog(raw: unknown): HabitLog | null {
  const source = asRecord(raw);
  if (typeof source.habitId !== "string" || !source.habitId) return null;
  if (typeof source.date !== "string" || !source.date) return null;

  return {
    id: typeof source.id === "string" && source.id ? source.id : generateId(),
    habitId: source.habitId,
    date: source.date,
    completed: Boolean(source.completed),
    value: source.value !== undefined ? Math.max(0, toNumber(source.value)) : undefined,
    note: typeof source.note === "string" && source.note.trim() ? source.note.trim() : undefined,
    createdAt: typeof source.createdAt === "string" && source.createdAt ? source.createdAt : nowIso(),
  };
}

function sanitizeMoodLog(raw: unknown): MoodLog | null {
  const source = asRecord(raw);
  if (typeof source.date !== "string" || !source.date) return null;
  const mood = toNumber(source.mood);
  if (mood < 1 || mood > 5) return null;

  return {
    id: typeof source.id === "string" && source.id ? source.id : generateId(),
    date: source.date,
    mood: mood as MoodLevel,
    note: typeof source.note === "string" && source.note.trim() ? source.note.trim() : undefined,
    createdAt: typeof source.createdAt === "string" && source.createdAt ? source.createdAt : nowIso(),
  };
}

export function sanitizeHabitsData(raw: unknown): HabitsData {
  if (!raw || typeof raw !== "object") return createEmptyHabitsData();
  const source = asRecord(raw);

  const habits = Array.isArray(source.habits)
    ? (source.habits.map((h, i) => sanitizeHabit(h, i)).filter(Boolean) as Habit[])
    : [];
  const logs = Array.isArray(source.logs)
    ? (source.logs.map(sanitizeHabitLog).filter(Boolean) as HabitLog[])
    : [];
  const moodLogs = Array.isArray(source.moodLogs)
    ? (source.moodLogs.map(sanitizeMoodLog).filter(Boolean) as MoodLog[])
    : [];

  return {
    habits: habits.sort((a, b) => a.order - b.order),
    logs: logs.sort((a, b) => b.date.localeCompare(a.date)),
    moodLogs: moodLogs.sort((a, b) => b.date.localeCompare(a.date)),
    lastUpdated: typeof source.lastUpdated === "string" && source.lastUpdated ? source.lastUpdated : nowIso(),
  };
}

export function createEmptyHabitsData(): HabitsData {
  return { habits: [], logs: [], moodLogs: [], lastUpdated: nowIso() };
}

// ── Load / Save ───────────────────────────────────────────────────────────────

export function loadHabitsData(): HabitsData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDemoHabitsData();
    return sanitizeHabitsData(JSON.parse(raw));
  } catch {
    return createDemoHabitsData();
  }
}

export function saveHabitsData(data: HabitsData) {
  const next = { ...sanitizeHabitsData(data), lastUpdated: nowIso() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

// ── Demo data ─────────────────────────────────────────────────────────────────

export function createDemoHabitsData(): HabitsData {
  const now = nowIso();
  const seeded = window.localStorage.getItem(STORAGE_KEY + "_seeded");
  if (seeded) return createEmptyHabitsData();

  const habits: Habit[] = [
    {
      id: "demo-h1",
      name: "شرب الماء",
      category: "health",
      type: "count",
      targetValue: 8,
      targetUnit: "أكواب",
      frequency: "daily",
      icon: "💧",
      isArchived: false,
      order: 0,
      createdAt: now,
    },
    {
      id: "demo-h2",
      name: "المشي",
      category: "fitness",
      type: "duration",
      targetValue: 30,
      targetUnit: "دقيقة",
      frequency: "weekdays",
      icon: "🚶",
      isArchived: false,
      order: 1,
      createdAt: now,
    },
    {
      id: "demo-h3",
      name: "التأمل والتنفس",
      category: "mindfulness",
      type: "check",
      frequency: "daily",
      icon: "🧘",
      isArchived: false,
      order: 2,
      createdAt: now,
    },
    {
      id: "demo-h4",
      name: "قراءة قبل النوم",
      category: "learning",
      type: "duration",
      targetValue: 20,
      targetUnit: "دقيقة",
      frequency: "daily",
      icon: "📚",
      isArchived: false,
      order: 3,
      createdAt: now,
    },
    {
      id: "demo-h5",
      name: "تمارين الصباح",
      category: "fitness",
      type: "check",
      frequency: "weekdays",
      icon: "🏋️",
      isArchived: false,
      order: 4,
      createdAt: now,
    },
  ];

  const logs: HabitLog[] = [];
  const moodLogs: MoodLog[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Seed 30 days of logs
  for (let i = 30; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = dateKeyFor(d);

    for (const habit of habits) {
      if (!isHabitDueToday(habit, d)) continue;
      const completed = Math.random() < 0.78;
      const log: HabitLog = {
        id: `demo-log-${habit.id}-${dateStr}`,
        habitId: habit.id,
        date: dateStr,
        completed,
        createdAt: now,
      };
      if (completed && (habit.type === "count" || habit.type === "duration") && habit.targetValue) {
        log.value = Math.round(habit.targetValue * (0.7 + Math.random() * 0.5));
      }
      logs.push(log);
    }

    // Mood log — weighted toward 3-4
    const moodWeights = [0.07, 0.13, 0.30, 0.35, 0.15];
    let rand = Math.random();
    let mood: MoodLevel = 3;
    for (let m = 0; m < moodWeights.length; m++) {
      rand -= moodWeights[m];
      if (rand <= 0) {
        mood = (m + 1) as MoodLevel;
        break;
      }
    }
    moodLogs.push({
      id: `demo-mood-${dateStr}`,
      date: dateStr,
      mood,
      createdAt: now,
    });
  }

  window.localStorage.setItem(STORAGE_KEY + "_seeded", "1");

  return {
    habits,
    logs,
    moodLogs,
    lastUpdated: now,
  };
}

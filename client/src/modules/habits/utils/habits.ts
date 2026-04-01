import type {
  CategoryBreakdownItem,
  HabitCategory,
  HabitDefinition,
  HabitFormValues,
  HabitLog,
  HabitTrackingMode,
  HabitsDashboardSummary,
  HabitsState,
  MoodValue,
  ReminderItem,
  TrendPoint,
} from "@/modules/habits/types";
import type { HabitsCoachPayload } from "@shared/ai/habits-coach";

export const HABITS_STORAGE_KEY = "planner-hub-habits-v1";
export const HABITS_REMINDER_SEEN_KEY = "planner-hub-habits-reminder-seen-v1";

export const HABIT_CATEGORY_META: Record<
  HabitCategory,
  {
    label: string;
    emoji: string;
    hint: string;
    chipClass: string;
    glowClass: string;
    chartColor: string;
  }
> = {
  health: {
    label: "صحة",
    emoji: "🥗",
    hint: "أكل، ماء، نوم، طاقة",
    chipClass: "border-emerald-500/25 text-emerald-300",
    glowClass: "shadow-[0_0_0_1px_rgba(16,185,129,0.16),0_0_22px_rgba(16,185,129,0.12)]",
    chartColor: "#34d399",
  },
  movement: {
    label: "حركة",
    emoji: "🏃",
    hint: "رياضة، مشي، نشاط",
    chipClass: "border-sky-500/25 text-sky-300",
    glowClass: "shadow-[0_0_0_1px_rgba(14,165,233,0.16),0_0_22px_rgba(14,165,233,0.12)]",
    chartColor: "#38bdf8",
  },
  mind: {
    label: "ذهن",
    emoji: "🧘",
    hint: "هدوء، مزاج، توازن",
    chipClass: "border-violet-500/25 text-violet-300",
    glowClass: "shadow-[0_0_0_1px_rgba(139,92,246,0.16),0_0_22px_rgba(139,92,246,0.12)]",
    chartColor: "#a78bfa",
  },
  learning: {
    label: "تعلّم",
    emoji: "📚",
    hint: "قراءة، مهارة، تطوير",
    chipClass: "border-amber-500/25 text-amber-300",
    glowClass: "shadow-[0_0_0_1px_rgba(245,158,11,0.16),0_0_22px_rgba(245,158,11,0.12)]",
    chartColor: "#fbbf24",
  },
  focus: {
    label: "تركيز",
    emoji: "🎯",
    hint: "جلسات عميقة وإنجاز",
    chipClass: "border-fuchsia-500/25 text-fuchsia-300",
    glowClass: "shadow-[0_0_0_1px_rgba(217,70,239,0.16),0_0_22px_rgba(217,70,239,0.12)]",
    chartColor: "#e879f9",
  },
  lifestyle: {
    label: "نمط الحياة",
    emoji: "✨",
    hint: "روتين يومي بسيط",
    chipClass: "border-primary/25 text-primary",
    glowClass: "shadow-[0_0_0_1px_rgba(149,223,30,0.16),0_0_22px_rgba(149,223,30,0.12)]",
    chartColor: "#95df1e",
  },
};

export const MOOD_OPTIONS: Array<{
  value: MoodValue;
  label: string;
  emoji: string;
  hint: string;
}> = [
  { value: "great", label: "رائع", emoji: "😄", hint: "طاقة عالية" },
  { value: "good", label: "جيد", emoji: "🙂", hint: "يوم متوازن" },
  { value: "steady", label: "مستقر", emoji: "😌", hint: "هادئ ومقبول" },
  { value: "low", label: "منخفض", emoji: "😕", hint: "تحتاج دفعة" },
  { value: "drained", label: "مرهق", emoji: "😮‍💨", hint: "خفف الضغط اليوم" },
];

export const HABIT_TYPE_OPTIONS = [
  { value: "binary", label: "مرة واحدة", hint: "علامة واحدة تكفي" },
  { value: "count", label: "عدد", hint: "للتتبع العددي" },
  { value: "duration", label: "مدة", hint: "وقت أو جلسة يومية" },
] as const;

export const HABIT_TRACKING_MODE_OPTIONS: Array<{
  value: HabitTrackingMode;
  label: string;
  hint: string;
}> = [
  { value: "check", label: "إنهاء بنقرة", hint: "ضع علامة عند إكمال الهدف" },
  { value: "progress", label: "تتبع تدريجي", hint: "زد التقدم حتى تصل للهدف" },
];

function safeWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

export function getTodayKey(reference = new Date()) {
  return reference.toISOString().split("T")[0];
}

export function createEmptyHabitsState(): HabitsState {
  return {
    habits: [],
    logs: [],
    moods: [],
    lastUpdated: new Date().toISOString(),
  };
}

export function loadHabitsState(): HabitsState {
  const win = safeWindow();
  if (!win) return createEmptyHabitsState();

  try {
    const raw = win.localStorage.getItem(HABITS_STORAGE_KEY);
    if (!raw) return createEmptyHabitsState();
    const parsed = JSON.parse(raw) as Partial<HabitsState>;
    return {
      habits: Array.isArray(parsed.habits)
        ? parsed.habits.map((habit) => normalizeHabitDefinition(habit as Partial<HabitDefinition>))
        : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      moods: Array.isArray(parsed.moods) ? parsed.moods : [],
      lastUpdated: parsed.lastUpdated ?? new Date().toISOString(),
    };
  } catch {
    return createEmptyHabitsState();
  }
}

export function saveHabitsState(state: HabitsState) {
  const win = safeWindow();
  if (!win) return;
  win.localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(state));
}

function getDefaultTrackingMode(type: HabitDefinition["type"]): HabitTrackingMode {
  if (type === "count") return "progress";
  if (type === "duration") return "check";
  return "check";
}

function normalizeHabitDefinition(habit: Partial<HabitDefinition>): HabitDefinition {
  const type = habit.type ?? "binary";
  return {
    id: habit.id ?? crypto.randomUUID(),
    name: habit.name ?? "",
    description: habit.description || undefined,
    category: habit.category ?? "health",
    type,
    trackingMode: habit.trackingMode ?? getDefaultTrackingMode(type),
    target: Math.max(1, Number(habit.target) || 1),
    unit: type === "binary" ? undefined : habit.unit || getDefaultUnit(type),
    emoji: habit.emoji || HABIT_CATEGORY_META[habit.category ?? "health"].emoji,
    reminderTime: habit.reminderTime ?? null,
    createdAt: habit.createdAt ?? new Date().toISOString(),
    updatedAt: habit.updatedAt ?? new Date().toISOString(),
  };
}

export function buildHabitFromValues(values: HabitFormValues, existingId?: string): HabitDefinition {
  const now = new Date().toISOString();
  return {
    id: existingId ?? crypto.randomUUID(),
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    category: values.category,
    type: values.type,
    trackingMode: values.type === "binary" ? "check" : values.trackingMode,
    target: Math.max(1, Number.parseInt(values.target || "1", 10) || 1),
    unit: values.type === "binary" ? undefined : values.unit.trim() || getDefaultUnit(values.type),
    emoji: values.emoji.trim() || HABIT_CATEGORY_META[values.category].emoji,
    reminderTime: values.reminderEnabled && values.reminderTime ? values.reminderTime : null,
    createdAt: now,
    updatedAt: now,
  };
}

export function getDefaultUnit(type: HabitDefinition["type"]) {
  if (type === "duration") return "دقيقة";
  if (type === "count") return "مرات";
  return "";
}

export function getHabitLog(logs: HabitLog[], habitId: string, date: string) {
  return logs.find((log) => log.habitId === habitId && log.date === date);
}

export function getHabitValueForDate(habit: HabitDefinition, logs: HabitLog[], date: string) {
  return getHabitLog(logs, habit.id, date)?.value ?? 0;
}

export function isHabitComplete(habit: HabitDefinition, value: number) {
  if (habit.type === "binary" || habit.trackingMode === "check") return value >= 1;
  return value >= habit.target;
}

export function upsertHabitLog(
  logs: HabitLog[],
  habit: HabitDefinition,
  date: string,
  nextValue: number,
) {
  const normalized = Math.max(0, nextValue);
  const completed = isHabitComplete(habit, normalized);
  const existing = getHabitLog(logs, habit.id, date);
  const now = new Date().toISOString();

  if (existing) {
    return logs.map((log) =>
      log.id === existing.id
        ? { ...log, value: normalized, completed, updatedAt: now }
        : log,
    );
  }

  return [
    ...logs,
    {
      id: crypto.randomUUID(),
      habitId: habit.id,
      date,
      value: normalized,
      completed,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function deleteHabitLogs(logs: HabitLog[], habitId: string) {
  return logs.filter((log) => log.habitId !== habitId);
}

export function getLastDays(count: number, reference = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(reference);
    date.setDate(reference.getDate() - (count - index - 1));
    return date;
  });
}

export function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("ar", { weekday: "short" }).format(date);
}

export function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("ar", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T00:00:00`));
}

export function getHabitStreak(habit: HabitDefinition, logs: HabitLog[], reference = new Date()) {
  let streak = 0;

  for (let offset = 0; offset < 120; offset += 1) {
    const date = new Date(reference);
    date.setDate(reference.getDate() - offset);
    const dateKey = getTodayKey(date);
    const value = getHabitValueForDate(habit, logs, dateKey);
    if (!isHabitComplete(habit, value)) break;
    streak += 1;
  }

  return streak;
}

export function getTodayCompletionSummary(state: HabitsState, reference = new Date()): HabitsDashboardSummary {
  const todayKey = getTodayKey(reference);
  const totalHabits = state.habits.length;
  const completedToday = state.habits.filter((habit) =>
    isHabitComplete(habit, getHabitValueForDate(habit, state.logs, todayKey)),
  ).length;
  const bestStreak = state.habits.reduce(
    (best, habit) => Math.max(best, getHabitStreak(habit, state.logs, reference)),
    0,
  );

  return {
    totalHabits,
    completedToday,
    progressPercent: totalHabits ? Math.round((completedToday / totalHabits) * 100) : 0,
    bestStreak,
    pendingCount: Math.max(totalHabits - completedToday, 0),
  };
}

export function getDashboardSummary(state = loadHabitsState()) {
  return getTodayCompletionSummary(state);
}

export function getTodayMood(state: HabitsState, reference = new Date()) {
  const todayKey = getTodayKey(reference);
  return state.moods.find((entry) => entry.date === todayKey)?.mood;
}

export function setMoodEntry(moods: HabitsState["moods"], mood: MoodValue, reference = new Date()) {
  const todayKey = getTodayKey(reference);
  const existing = moods.find((entry) => entry.date === todayKey);
  if (existing) {
    return moods.map((entry) => (entry.date === todayKey ? { ...entry, mood } : entry));
  }
  return [...moods, { date: todayKey, mood }];
}

export function formatHabitValue(habit: HabitDefinition, value: number) {
  if (habit.type === "binary") return value > 0 ? "تم" : "غير مكتمل";
  if (habit.trackingMode === "check") {
    return value > 0 ? "تم" : "بانتظار الإنجاز";
  }
  return `${value} / ${habit.target} ${habit.unit ?? ""}`.trim();
}

export function getHabitTargetLabel(habit: HabitDefinition) {
  if (habit.type === "binary") return "مرة واحدة";
  if (!habit.unit) return String(habit.target);
  return `${habit.target} ${habit.unit}`.trim();
}

type ReminderSeenMap = Record<string, string[]>;

function loadReminderSeenMap(): ReminderSeenMap {
  const win = safeWindow();
  if (!win) return {};
  try {
    const raw = win.localStorage.getItem(HABITS_REMINDER_SEEN_KEY);
    return raw ? (JSON.parse(raw) as ReminderSeenMap) : {};
  } catch {
    return {};
  }
}

function saveReminderSeenMap(next: ReminderSeenMap) {
  const win = safeWindow();
  if (!win) return;
  win.localStorage.setItem(HABITS_REMINDER_SEEN_KEY, JSON.stringify(next));
}

export function hasShownReminder(habitId: string, dateKey = getTodayKey()) {
  const seen = loadReminderSeenMap();
  return (seen[dateKey] ?? []).includes(habitId);
}

export function markReminderShown(habitId: string, dateKey = getTodayKey()) {
  const seen = loadReminderSeenMap();
  const current = new Set(seen[dateKey] ?? []);
  current.add(habitId);
  saveReminderSeenMap({ ...seen, [dateKey]: Array.from(current) });
}

export function getReminderItems(state: HabitsState, reference = new Date()): ReminderItem[] {
  const currentMinutes = reference.getHours() * 60 + reference.getMinutes();
  const todayKey = getTodayKey(reference);

  return state.habits
    .filter((habit) => habit.reminderTime)
    .filter((habit) => !isHabitComplete(habit, getHabitValueForDate(habit, state.logs, todayKey)))
    .map((habit) => {
      const [hour, minute] = (habit.reminderTime ?? "00:00").split(":").map(Number);
      const reminderMinutes = hour * 60 + minute;
      const isAttention = reminderMinutes <= currentMinutes;
      const tone: ReminderItem["tone"] = isAttention ? "attention" : "upcoming";

      return {
        id: habit.id,
        habitId: habit.id,
        title: habit.name,
        description: isAttention
          ? "لم يتم هذا التذكير بعد. جرّب إنهاءه الآن بخطوة سريعة."
          : `التذكير القادم عند ${habit.reminderTime}`,
        time: habit.reminderTime,
        tone,
      };
    })
    .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
}

export function buildWeeklyTrend(state: HabitsState, reference = new Date()): TrendPoint[] {
  return getLastDays(7, reference).map((date) => {
    const dateKey = getTodayKey(date);
    const total = state.habits.length;
    const completions = state.habits.filter((habit) =>
      isHabitComplete(habit, getHabitValueForDate(habit, state.logs, dateKey)),
    ).length;

    return {
      label: formatDayLabel(date),
      total,
      completions,
      percent: total ? Math.round((completions / total) * 100) : 0,
    };
  });
}

export function buildMonthlyTrend(state: HabitsState, reference = new Date()): TrendPoint[] {
  const points: TrendPoint[] = [];

  for (let week = 3; week >= 0; week -= 1) {
    const anchor = new Date(reference);
    anchor.setDate(reference.getDate() - week * 7);
    const bucketDays = getLastDays(7, anchor).filter((date) => date <= reference);
    const total = bucketDays.length * state.habits.length;
    const completions = bucketDays.reduce((sum, date) => {
      const dateKey = getTodayKey(date);
      return sum + state.habits.filter((habit) => isHabitComplete(habit, getHabitValueForDate(habit, state.logs, dateKey))).length;
    }, 0);

    points.push({
      label: `الأسبوع ${4 - week}`,
      total,
      completions,
      percent: total ? Math.round((completions / total) * 100) : 0,
    });
  }

  return points;
}

export function buildCategoryBreakdown(state: HabitsState, reference = new Date()): CategoryBreakdownItem[] {
  const weeklyTrendDays = getLastDays(7, reference).map(getTodayKey);

  return (Object.keys(HABIT_CATEGORY_META) as HabitCategory[]).map((category) => {
    const habits = state.habits.filter((habit) => habit.category === category);
    const completions = weeklyTrendDays.reduce((sum, dateKey) => {
      return (
        sum +
        habits.filter((habit) => isHabitComplete(habit, getHabitValueForDate(habit, state.logs, dateKey))).length
      );
    }, 0);

    return {
      key: category,
      label: HABIT_CATEGORY_META[category].label,
      completions,
      totalHabits: habits.length,
      color: HABIT_CATEGORY_META[category].chartColor,
    };
  }).filter((item) => item.totalHabits > 0);
}

export function getMonthlySummary(state: HabitsState, reference = new Date()) {
  const monthlyTrend = buildMonthlyTrend(state, reference);
  const weeklyTrend = buildWeeklyTrend(state, reference);
  const averagePercent = weeklyTrend.length
    ? Math.round(weeklyTrend.reduce((sum, point) => sum + point.percent, 0) / weeklyTrend.length)
    : 0;
  const totalCheckIns = monthlyTrend.reduce((sum, point) => sum + point.completions, 0);
  const bestDay = weeklyTrend.reduce((best, point) => (point.percent > best.percent ? point : best), {
    label: "اليوم",
    percent: 0,
    completions: 0,
    total: 0,
  });

  return {
    weeklyTrend,
    monthlyTrend,
    averagePercent,
    totalCheckIns,
    bestDay,
    categoryBreakdown: buildCategoryBreakdown(state, reference),
  };
}

export function getMoodBreakdown(state: HabitsState, reference = new Date()) {
  const recentDates = new Set(getLastDays(14, reference).map(getTodayKey));
  return MOOD_OPTIONS.map((option) => ({
    ...option,
    count: state.moods.filter((entry) => recentDates.has(entry.date) && entry.mood === option.value).length,
  })).filter((item) => item.count > 0);
}

export function buildHabitsCoachPayload(
  state: HabitsState,
  reference = new Date(),
): HabitsCoachPayload {
  const dashboard = getTodayCompletionSummary(state, reference);
  const insights = getMonthlySummary(state, reference);
  const reminders = getReminderItems(state, reference).slice(0, 3);
  const mood = getTodayMood(state, reference);
  const moodMeta = mood ? MOOD_OPTIONS.find((option) => option.value === mood) : null;
  const todayKey = getTodayKey(reference);

  return {
    generatedAt: new Date().toISOString(),
    totalHabits: dashboard.totalHabits,
    completedToday: dashboard.completedToday,
    pendingToday: dashboard.pendingCount,
    progressPercent: dashboard.progressPercent,
    bestStreak: dashboard.bestStreak,
    averagePercent: insights.averagePercent,
    bestDayLabel: insights.bestDay.label,
    bestDayPercent: insights.bestDay.percent,
    todayMoodLabel: moodMeta?.label ?? null,
    todayMoodHint: moodMeta?.hint ?? null,
    reminders: reminders.map((item) => ({
      title: item.title,
      time: item.time ?? null,
      tone: item.tone,
    })),
    habits: state.habits.slice(0, 8).map((habit) => {
      const categoryMeta = HABIT_CATEGORY_META[habit.category];
      const currentValue = getHabitValueForDate(habit, state.logs, todayKey);
      return {
        name: habit.name,
        categoryLabel: categoryMeta.label,
        emoji: habit.emoji ?? categoryMeta.emoji,
        completed: isHabitComplete(habit, currentValue),
        currentValue,
        target: habit.target,
        unit: habit.unit,
        streak: getHabitStreak(habit, state.logs, reference),
      };
    }),
    categoryBreakdown: insights.categoryBreakdown.map((item) => ({
      label: item.label,
      completions: item.completions,
      totalHabits: item.totalHabits,
    })),
    weeklyTrend: insights.weeklyTrend.map((item) => ({
      label: item.label,
      percent: item.percent,
    })),
  };
}

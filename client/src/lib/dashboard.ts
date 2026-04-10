import { type LucideIcon, AlarmClock, Banknote, CalendarClock, CheckCircle2, CircleDollarSign, LayoutGrid, Salad, Target } from "lucide-react";
import { getMonthlyTotals, loadBudgetData, saveBudgetData, type BudgetTransaction } from "@/lib/budget";
import { getAvailableBalance, getMonthStats, loadCashflowData } from "@/lib/cashflow";
import { getMealPlannerSummary, loadMealPlannerState, MEAL_TYPE_LABELS, type PlannerDay } from "@/lib/meal-planner";
import { getPlannerData, savePlannerData, type PlannerData } from "@/lib/storage";
import {
  getDashboardSummary as getHabitsSummary,
  getHabitValueForDate,
  getReminderItems,
  getTodayKey,
  loadHabitsState,
  MOOD_OPTIONS,
  saveHabitsState,
  upsertHabitLog,
} from "@/modules/habits/utils/habits";
import type { HabitDefinition } from "@/modules/habits/types";
import type { DashboardAssistantContext } from "@shared/ai/dashboard-assistant";

const DASHBOARD_PREFS_KEY = "planner_hub_dashboard_preferences_v1";
const DASHBOARD_ROUTE_HISTORY_KEY = "planner_hub_dashboard_route_history_v1";
const DASHBOARD_MEAL_FOCUS_KEY = "planner_hub_dashboard_meal_focus_v1";

export type DashboardWidgetKey =
  | "hero"
  | "focus"
  | "timeline"
  | "modules"
  | "actions"
  | "assistant"
  | "insights"
  | "recent";

export interface DashboardPreferences {
  visibleWidgets: Record<DashboardWidgetKey, boolean>;
}

export interface DashboardModuleCard {
  key: "planner" | "budget" | "habits" | "meal" | "cashflow";
  title: string;
  subtitle: string;
  href: string;
  accent: string;
  icon: LucideIcon;
  status: string;
  metrics: Array<{ label: string; value: string }>;
  cta: string;
}

export interface DashboardTimelineItem {
  id: string;
  title: string;
  subtitle: string;
  bucket: "morning" | "afternoon" | "evening";
  timeLabel: string;
  href: string;
  module: DashboardModuleCard["key"];
  status: "attention" | "upcoming" | "done";
  icon: string;
  actionable: boolean;
  targetId?: string;
}

export interface DashboardQuickAction {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
}

export interface DashboardRecentItem {
  path: string;
  label: string;
  visitedAt: string;
}

export interface DashboardViewModel {
  context: DashboardAssistantContext;
  isoDate: string;
  greeting: string;
  dateLabel: string;
  summaryLine: string;
  topPriorities: string[];
  overdueCount: number;
  atRiskHabits: string[];
  mealPrepLabel: string | null;
  financeAlert: string | null;
  timeline: DashboardTimelineItem[];
  moduleCards: DashboardModuleCard[];
  quickActions: DashboardQuickAction[];
  recentItems: DashboardRecentItem[];
  progressCards: Array<{ key: string; label: string; value: string; tone: string; hint: string }>;
}

export function getDefaultDashboardPreferences(): DashboardPreferences {
  return {
    visibleWidgets: {
      hero: true,
      focus: true,
      timeline: true,
      modules: true,
      actions: true,
      assistant: true,
      insights: true,
      recent: true,
    },
  };
}

export function loadDashboardPreferences() {
  if (typeof window === "undefined") return getDefaultDashboardPreferences();
  try {
    const raw = window.localStorage.getItem(DASHBOARD_PREFS_KEY);
    if (!raw) return getDefaultDashboardPreferences();
    const parsed = JSON.parse(raw) as Partial<DashboardPreferences>;
    return {
      ...getDefaultDashboardPreferences(),
      ...parsed,
      visibleWidgets: {
        ...getDefaultDashboardPreferences().visibleWidgets,
        ...(parsed.visibleWidgets ?? {}),
      },
    };
  } catch {
    return getDefaultDashboardPreferences();
  }
}

export function saveDashboardPreferences(preferences: DashboardPreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DASHBOARD_PREFS_KEY, JSON.stringify(preferences));
}

export function trackDashboardRoute(path: string, label: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(DASHBOARD_ROUTE_HISTORY_KEY);
    const current = raw ? (JSON.parse(raw) as DashboardRecentItem[]) : [];
    const next: DashboardRecentItem[] = [
      { path, label, visitedAt: new Date().toISOString() },
      ...current.filter((item) => item.path !== path),
    ].slice(0, 6);
    window.localStorage.setItem(DASHBOARD_ROUTE_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function loadDashboardRecentItems() {
  if (typeof window === "undefined") return [] as DashboardRecentItem[];
  try {
    const raw = window.localStorage.getItem(DASHBOARD_ROUTE_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as DashboardRecentItem[]) : [];
  } catch {
    return [];
  }
}

export function setDashboardMealFocus(dateISO: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DASHBOARD_MEAL_FOCUS_KEY, dateISO);
}

export function consumeDashboardMealFocus() {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(DASHBOARD_MEAL_FOCUS_KEY);
  if (!value) return null;
  window.localStorage.removeItem(DASHBOARD_MEAL_FOCUS_KEY);
  return value;
}

function formatCurrency(value: number) {
  const formatted = new Intl.NumberFormat("ar", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value));
  return `₪ ${formatted}`;
}

function formatArabicDate(date: Date) {
  return new Intl.DateTimeFormat("ar", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function getGreeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "صباح منظم";
  if (hour < 18) return "نهارك يحتاج تركيزًا ذكيًا";
  return "مساء هادئ لإغلاق اليوم";
}

function getTimelineBucket(hour: number): DashboardTimelineItem["bucket"] {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function timeLabelFromMealType(mealType: keyof typeof MEAL_TYPE_LABELS) {
  if (mealType === "breakfast") return "08:00";
  if (mealType === "lunch") return "13:30";
  if (mealType === "snack") return "16:30";
  return "19:30";
}

function parseTimeLabel(value: string) {
  const [hourString, minuteString] = value.split(":");
  const hour = Number(hourString) || 0;
  const minute = Number(minuteString) || 0;
  return { hour, minute, total: hour * 60 + minute };
}

function getMoodLabel() {
  const habits = loadHabitsState();
  const todayMood = habits.moods.find((entry) => entry.date === getTodayKey())?.mood;
  return MOOD_OPTIONS.find((option) => option.value === todayMood)?.label ?? null;
}

function getTodayMealDay() {
  const mealState = loadMealPlannerState();
  const todayIso = getTodayKey();
  return mealState.activePlan?.days.find((day) => day.dateISO === todayIso) ?? null;
}

function buildPlannerTimelineItems(planner: PlannerData, todayIso: string): DashboardTimelineItem[] {
  const eventItems = planner.events
    .filter((event) => event.date === todayIso)
    .map((event) => {
      const time = parseTimeLabel(event.time || "12:00");
      return {
        id: `planner-event-${event.id}`,
        title: event.title,
        subtitle: "من المخطط الأسبوعي",
        bucket: getTimelineBucket(time.hour),
        timeLabel: event.time || "—",
        href: `/weekly-planner?date=${todayIso}`,
        module: "planner" as const,
        status: "upcoming" as const,
        icon: event.icon || "🗓️",
        actionable: false,
        targetId: event.id,
      };
    });

  const taskItems = planner.tasks
    .filter((task) => !task.completed && (task.date === todayIso || task.deadline === todayIso))
    .map((task) => {
      const time = parseTimeLabel(task.deadlineTime || "10:00");
      return {
        id: `planner-task-${task.id}`,
        title: task.text,
        subtitle: task.deadline === todayIso ? "مهمة تحتاج إنهاء اليوم" : "مهمة اليوم",
        bucket: getTimelineBucket(time.hour),
        timeLabel: task.deadlineTime || "اليوم",
        href: `/weekly-planner?date=${todayIso}&task=${task.id}`,
        module: "planner" as const,
        status: task.deadline === todayIso ? ("attention" as const) : ("upcoming" as const),
        icon: "✅",
        actionable: true,
        targetId: task.id,
      };
    });

  return [...eventItems, ...taskItems];
}

function buildHabitsTimelineItems(todayIso: string): DashboardTimelineItem[] {
  const habitsState = loadHabitsState();
  return getReminderItems(habitsState)
    .slice(0, 4)
    .map((item) => {
      const time = parseTimeLabel(item.time || "08:00");
      return {
        id: `habit-${item.habitId}`,
        title: item.title,
        subtitle: item.description,
        bucket: getTimelineBucket(time.hour),
        timeLabel: item.time || "اليوم",
        href: `/habits?tab=habits&habit=${item.habitId}`,
        module: "habits" as const,
        status: item.tone === "attention" ? "attention" : "upcoming",
        icon: "🎯",
        actionable: true,
        targetId: item.habitId,
      };
    });
}

function buildMealsTimelineItems(day: PlannerDay | null): DashboardTimelineItem[] {
  if (!day) return [];
  return day.meals.map((meal) => {
    const timeLabel = timeLabelFromMealType(meal.mealType);
    const time = parseTimeLabel(timeLabel);
    return {
      id: `meal-${meal.id}`,
      title: meal.title,
      subtitle: MEAL_TYPE_LABELS[meal.mealType],
      bucket: getTimelineBucket(time.hour),
      timeLabel,
      href: `/meal?day=${day.dateISO}`,
      module: "meal" as const,
      status: "upcoming",
      icon: meal.icon || "🍽️",
      actionable: false,
      targetId: meal.id,
    };
  });
}

function buildCashflowTimelineItems(todayIso: string): DashboardTimelineItem[] {
  const cashflow = loadCashflowData();
  return cashflow.upcomingPayments
    .filter((payment) => payment.status === "pending" && payment.dueDate <= todayIso)
    .slice(0, 2)
    .map((payment) => ({
      id: `cashflow-${payment.id}`,
      title: payment.name,
      subtitle: "دفعة مالية تحتاج متابعة",
      bucket: "afternoon" as const,
      timeLabel: "17:00",
      href: `/cashflow?screen=upcoming`,
      module: "cashflow" as const,
      status: "attention" as const,
      icon: "💸",
      actionable: false,
      targetId: payment.id,
    }));
}

function buildModuleCards(): DashboardModuleCard[] {
  const todayIso = getTodayKey();
  const planner = getPlannerData();
  const budget = loadBudgetData();
  const habits = loadHabitsState();
  const mealState = loadMealPlannerState();
  const mealSummary = getMealPlannerSummary(mealState);
  const cashflow = loadCashflowData();
  const budgetTotals = getMonthlyTotals(budget.transactions, new Date().toISOString().slice(0, 7));
  const cashflowStats = getMonthStats(cashflow.transactions, new Date().toISOString().slice(0, 7));
  const habitsSummary = getHabitsSummary(habits);

  return [
    {
      key: "planner",
      title: "المخطط الأسبوعي",
      subtitle: "مهامك وأحداثك الأقرب لليوم",
      href: "/weekly-planner",
      accent: "from-sky-500/18 via-sky-500/5 to-transparent",
      icon: CalendarClock,
      status: planner.tasks.some((task) => !task.completed && task.date === todayIso) ? "جاهز لليوم" : "هادئ",
      metrics: [
        { label: "مهام مفتوحة", value: String(planner.tasks.filter((task) => !task.completed).length) },
        { label: "أحداث اليوم", value: String(planner.events.filter((event) => event.date === todayIso).length) },
      ],
      cta: "افتح أسبوعك",
    },
    {
      key: "budget",
      title: "الميزانية الشهرية",
      subtitle: "صرفك الحالي مقابل الحد الشهري",
      href: "/budget",
      accent: "from-fuchsia-500/16 via-fuchsia-500/6 to-transparent",
      icon: CircleDollarSign,
      status: budgetTotals.totalOutflow > budget.settings.monthlyLimit * 0.8 ? "يحتاج انتباهًا" : "ضمن المسار",
      metrics: [
        { label: "المصروف", value: formatCurrency(budgetTotals.totalOutflow) },
        { label: "المتبقي", value: formatCurrency(Math.max(budget.settings.monthlyLimit - budgetTotals.totalOutflow, 0)) },
      ],
      cta: "سجّل حركة",
    },
    {
      key: "habits",
      title: "متتبع العادات",
      subtitle: "تقدّم اليوم والسلسلة الأقوى",
      href: "/habits",
      accent: "from-primary/22 via-primary/7 to-transparent",
      icon: Target,
      status: habitsSummary.progressPercent >= 70 ? "زخم ممتاز" : "فرصة لتعزيز اليوم",
      metrics: [
        { label: "إنجاز اليوم", value: `${habitsSummary.progressPercent}%` },
        { label: "أفضل سلسلة", value: `${habitsSummary.bestStreak}` },
      ],
      cta: "أكمل عادة الآن",
    },
    {
      key: "meal",
      title: "مخطط الوجبات",
      subtitle: "وجبات اليوم والتحضير للأسبوع",
      href: "/meal",
      accent: "from-emerald-500/18 via-emerald-500/5 to-transparent",
      icon: Salad,
      status: mealSummary.plannedMeals > 0 ? "الخطة جاهزة" : "يحتاج تخطيطًا",
      metrics: [
        { label: "وجبات الأسبوع", value: String(mealSummary.plannedMeals) },
        { label: "أيام الماء", value: String(mealSummary.daysWithWaterTarget) },
      ],
      cta: "راجع اليوم الغذائي",
    },
    {
      key: "cashflow",
      title: "التدفق النقدي",
      subtitle: "لمحة سريعة على النقد والتنبيهات",
      href: "/cashflow",
      accent: "from-amber-500/18 via-amber-500/5 to-transparent",
      icon: Banknote,
      status: cashflow.upcomingPayments.some((payment) => payment.status === "pending") ? "دفعات معلقة" : "مستقر",
      metrics: [
        { label: "الرصيد", value: formatCurrency(getAvailableBalance(cashflow)) },
        { label: "صافي الشهر", value: formatCurrency(cashflowStats.net) },
      ],
      cta: "افتح التدفق النقدي",
    },
  ];
}

function getOverdueTasks(planner: PlannerData, todayIso: string) {
  return planner.tasks.filter((task) => !task.completed && ((task.deadline && task.deadline < todayIso) || task.date < todayIso));
}

function buildBudgetTransaction(
  current: ReturnType<typeof loadBudgetData>,
  type: BudgetTransaction["type"],
  title: string,
  amount: number,
  date: string,
) {
  const fallbackCategory =
    current.categories.find((category) => category.type === type)
    ?? current.categories[0];

  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    title: title.trim(),
    amount,
    date,
    subcategoryId: fallbackCategory?.id ?? "",
    note: "",
  } satisfies BudgetTransaction;
}

export function createDashboardTask(title: string, date: string, time?: string) {
  const planner = getPlannerData();
  const nextTask = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    date,
    text: title.trim(),
    completed: false,
    isWeekly: false,
    deadline: date,
    deadlineTime: time || undefined,
  };
  savePlannerData({
    ...planner,
    tasks: [nextTask, ...planner.tasks],
  });
  return nextTask;
}

export function logDashboardHabit(habitId: string) {
  const state = loadHabitsState();
  const habit = state.habits.find((entry) => entry.id === habitId);
  if (!habit) return null;
  const todayKey = getTodayKey();
  const currentValue = getHabitValueForDate(habit, state.logs, todayKey);
  const nextValue = habit.type === "binary" || habit.trackingMode === "check" ? 1 : Math.min(habit.target, currentValue + 1);
  const logs = upsertHabitLog(state.logs, habit, todayKey, nextValue);
  saveHabitsState({
    ...state,
    logs,
    lastUpdated: new Date().toISOString(),
  });
  return habit;
}

export function createDashboardBudgetTransaction(
  type: "income" | "expense",
  title: string,
  amount: number,
  date: string,
) {
  const budget = loadBudgetData();
  const transaction = buildBudgetTransaction(budget, type, title, amount, date);
  saveBudgetData({
    ...budget,
    transactions: [transaction, ...budget.transactions],
  });
  return transaction;
}

export function buildDashboardViewModel(): DashboardViewModel {
  const now = new Date();
  const todayIso = getTodayKey(now);
  const planner = getPlannerData();
  const habits = loadHabitsState();
  const mealState = loadMealPlannerState();
  const budget = loadBudgetData();
  const cashflow = loadCashflowData();

  const mealSummary = getMealPlannerSummary(mealState);
  const mealDay = getTodayMealDay();
  const habitsSummary = getHabitsSummary(habits);
  const reminders = getReminderItems(habits, now);
  const overdueTasks = getOverdueTasks(planner, todayIso);
  const monthKey = todayIso.slice(0, 7);
  const budgetTotals = getMonthlyTotals(budget.transactions, monthKey);
  const cashflowBalance = getAvailableBalance(cashflow);
  const cashflowPending = cashflow.upcomingPayments.filter((payment) => payment.status === "pending");
  const moodLabel = getMoodLabel();
  const topPriorities = [
    ...planner.tasks.filter((task) => !task.completed && task.date === todayIso).map((task) => task.text),
    ...overdueTasks.map((task) => task.text),
  ].slice(0, 3);
  const atRiskHabits = reminders.filter((item) => item.tone === "attention").map((item) => item.title).slice(0, 3);

  const financeAlert =
    budget.settings.monthlyLimit > 0 && budgetTotals.totalOutflow > budget.settings.monthlyLimit * 0.8
      ? "مصروفك الشهري يقترب من الحد الموضوع."
      : cashflowPending.some((payment) => payment.dueDate <= todayIso)
        ? "هناك دفعة مالية تحتاج متابعة اليوم."
        : null;

  const timeline = [
    ...buildPlannerTimelineItems(planner, todayIso),
    ...buildHabitsTimelineItems(todayIso),
    ...buildMealsTimelineItems(mealDay),
    ...buildCashflowTimelineItems(todayIso),
  ].sort((a, b) => parseTimeLabel(a.timeLabel === "اليوم" ? "12:00" : a.timeLabel).total - parseTimeLabel(b.timeLabel === "اليوم" ? "12:00" : b.timeLabel).total);

  const remainingBudget = Math.max(budget.settings.monthlyLimit - budgetTotals.totalOutflow, 0);
  const mealPrepLabel =
    mealSummary.plannedMeals > 0
      ? `لديك ${mealSummary.plannedMeals} وجبة مخططة هذا الأسبوع.`
      : null;

  const context: DashboardAssistantContext = {
    isoDate: todayIso,
    dateLabel: formatArabicDate(now),
    greeting: getGreeting(now),
    planner: {
      tasksToday: planner.tasks.filter((task) => !task.completed && task.date === todayIso).length,
      overdueTasks: overdueTasks.length,
      eventsToday: planner.events.filter((event) => event.date === todayIso).length,
      topPriorities,
    },
    habits: {
      totalHabits: habitsSummary.totalHabits,
      completedToday: habitsSummary.completedToday,
      pendingHabits: habitsSummary.pendingCount,
      progressPercent: habitsSummary.progressPercent,
      atRiskHabits,
      moodLabel,
    },
    meals: {
      mealsToday: mealDay?.meals.length ?? 0,
      weeklyMeals: mealSummary.plannedMeals,
      todayMealTitles: mealDay?.meals.map((meal) => meal.title).slice(0, 4) ?? [],
      prepLabel: mealPrepLabel,
    },
    budget: {
      spentThisMonth: budgetTotals.totalOutflow,
      monthlyLimit: budget.settings.monthlyLimit,
      remaining: remainingBudget,
      pressureLabel: budget.settings.monthlyLimit > 0 && budgetTotals.totalOutflow > budget.settings.monthlyLimit * 0.8 ? "مرتفع" : "مقبول",
    },
    cashflow: {
      availableBalance: cashflowBalance,
      pendingPayments: cashflowPending.length,
      warningLabel: financeAlert,
    },
  };

  return {
    context,
    isoDate: todayIso,
    greeting: getGreeting(now),
    dateLabel: formatArabicDate(now),
    summaryLine:
      habitsSummary.progressPercent >= 70
        ? "اليوم يبدو متوازنًا ويمكنك إغلاقه بثبات."
        : "اختر خطوة صغيرة الآن لتمنح اليوم زخمًا واضحًا.",
    topPriorities,
    overdueCount: overdueTasks.length,
    atRiskHabits,
    mealPrepLabel,
    financeAlert,
    timeline,
    moduleCards: buildModuleCards(),
    quickActions: [
      {
        key: "task",
        label: "إضافة مهمة",
        description: "أدخل مهمة سريعة لليوم",
        icon: CheckCircle2,
        accent: "from-sky-500/18 to-transparent",
      },
      {
        key: "habit",
        label: "تسجيل عادة",
        description: "أغلق عادة بنقرة واحدة",
        icon: Target,
        accent: "from-primary/18 to-transparent",
      },
      {
        key: "expense",
        label: "إضافة مصروف",
        description: "حركة مالية سريعة",
        icon: CircleDollarSign,
        accent: "from-rose-500/18 to-transparent",
      },
      {
        key: "income",
        label: "إضافة دخل",
        description: "سجّل دفعة جديدة",
        icon: Banknote,
        accent: "from-emerald-500/18 to-transparent",
      },
      {
        key: "meal",
        label: "تخطيط وجبة",
        description: "افتح اليوم الغذائي",
        icon: Salad,
        accent: "from-amber-500/18 to-transparent",
      },
      {
        key: "ai",
        label: "اسأل الذكاء",
        description: "تلخيص أو ترتيب سريع",
        icon: AlarmClock,
        accent: "from-fuchsia-500/18 to-transparent",
      },
    ],
    recentItems: loadDashboardRecentItems().filter((item) => item.path !== "/").slice(0, 4),
    progressCards: [
      {
        key: "today",
        label: "إنجاز اليوم",
        value: `${habitsSummary.progressPercent}%`,
        tone: "border-primary/20 text-primary",
        hint: `${habitsSummary.completedToday} من ${habitsSummary.totalHabits} عادات`,
      },
      {
        key: "budget",
        label: "استخدام الميزانية",
        value: budget.settings.monthlyLimit > 0 ? `${Math.min(100, Math.round((budgetTotals.totalOutflow / budget.settings.monthlyLimit) * 100))}%` : "0%",
        tone: "border-fuchsia-500/20 text-fuchsia-300",
        hint: `المتبقي ${formatCurrency(remainingBudget)}`,
      },
      {
        key: "meals",
        label: "وجبات الأسبوع",
        value: String(mealSummary.plannedMeals),
        tone: "border-emerald-500/20 text-emerald-300",
        hint: mealPrepLabel ?? "لا توجد خطة غذائية بعد",
      },
      {
        key: "cashflow",
        label: "تنبيهات مالية",
        value: String(cashflowPending.length),
        tone: "border-amber-500/20 text-amber-300",
        hint: financeAlert ?? "الوضع الحالي مستقر",
      },
    ],
  };
}

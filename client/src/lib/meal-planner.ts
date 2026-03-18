import { addDays, format } from "date-fns";

export type MealType = "breakfast" | "lunch" | "dinner";

export type MealStatus = "planned" | "done" | "leftover" | "eating_out" | "skipped";

export type MealGoal = "balanced" | "weight_loss" | "muscle_gain" | "family_routine";

export type MealActivityLevel = "low" | "moderate" | "high";

export type MealSnackPreference = "none" | "flexible" | "daily";

export interface PlannedMeal {
  id: string;
  dateISO: string;
  mealType: MealType;
  title: string;
  status: MealStatus;
  note?: string;
}

export interface MealDayMeta {
  dateISO: string;
  snackNote: string;
  prepNote: string;
  waterCups: number;
}

export interface MealPlannerProfile {
  goal: MealGoal;
  activityLevel: MealActivityLevel;
  snackPreference: MealSnackPreference;
  waterTargetCups: number;
  dietaryNotes: string;
  avoidIngredients: string;
  disclaimerAccepted: boolean;
}

export interface MealPlannerSettings {
  preferredWeekStart: "saturday" | "sunday";
}

export interface WeeklyMealPlan {
  weekStartISO: string;
  meals: PlannedMeal[];
}

export interface MealPlannerState {
  version: 2;
  settings: MealPlannerSettings;
  weekPlan: WeeklyMealPlan;
  dayMeta: MealDayMeta[];
  profile: MealPlannerProfile;
  recentMeals: string[];
}

export interface MealPlannerSummary {
  totalMeals: number;
  plannedMeals: number;
  completedMeals: number;
  emptyMeals: number;
  daysWithWaterTarget: number;
  weeklyWaterTotal: number;
  weeklyWaterTarget: number;
}

export const MEAL_PLANNER_STORAGE_KEY = "planner_hub_meal_planner_v2_basic";

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "فطور",
  lunch: "غداء",
  dinner: "عشاء",
};

export const MEAL_STATUS_LABELS: Record<MealStatus, string> = {
  planned: "مخططة",
  done: "تمت",
  leftover: "بقايا",
  eating_out: "خارج البيت",
  skipped: "تم التخطي",
};

export const PROFILE_GOAL_OPTIONS: Array<{ value: MealGoal; label: string }> = [
  { value: "balanced", label: "توازن عام" },
  { value: "weight_loss", label: "تنظيم الوزن" },
  { value: "muscle_gain", label: "دعم النشاط والكتلة" },
  { value: "family_routine", label: "روتين عائلي" },
];

export const PROFILE_ACTIVITY_OPTIONS: Array<{ value: MealActivityLevel; label: string }> = [
  { value: "low", label: "نشاط منخفض" },
  { value: "moderate", label: "نشاط متوسط" },
  { value: "high", label: "نشاط مرتفع" },
];

export const PROFILE_SNACK_OPTIONS: Array<{ value: MealSnackPreference; label: string }> = [
  { value: "none", label: "بدون سناك" },
  { value: "flexible", label: "حسب الحاجة" },
  { value: "daily", label: "سناك يومي" },
];

export const WEEKDAY_LABELS: Record<MealPlannerSettings["preferredWeekStart"], Array<{ key: string; label: string }>> = {
  saturday: [
    { key: "sat", label: "السبت" },
    { key: "sun", label: "الأحد" },
    { key: "mon", label: "الإثنين" },
    { key: "tue", label: "الثلاثاء" },
    { key: "wed", label: "الأربعاء" },
    { key: "thu", label: "الخميس" },
    { key: "fri", label: "الجمعة" },
  ],
  sunday: [
    { key: "sun", label: "الأحد" },
    { key: "mon", label: "الإثنين" },
    { key: "tue", label: "الثلاثاء" },
    { key: "wed", label: "الأربعاء" },
    { key: "thu", label: "الخميس" },
    { key: "fri", label: "الجمعة" },
    { key: "sat", label: "السبت" },
  ],
};

export function createId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getWeekStartISO(preferredWeekStart: MealPlannerSettings["preferredWeekStart"], date = new Date()) {
  const day = date.getDay();
  const offset = preferredWeekStart === "saturday" ? (day + 1) % 7 : day;
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - offset);
  return format(start, "yyyy-MM-dd");
}

export function getWeekDates(weekStartISO: string) {
  const start = new Date(`${weekStartISO}T00:00:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    return {
      date,
      dateISO: format(date, "yyyy-MM-dd"),
      dateLabel: format(date, "d/M"),
    };
  });
}

export function getWeekdayLabels(preferredWeekStart: MealPlannerSettings["preferredWeekStart"]) {
  return WEEKDAY_LABELS[preferredWeekStart];
}

export function getDefaultMealPlannerProfile(): MealPlannerProfile {
  return {
    goal: "balanced",
    activityLevel: "moderate",
    snackPreference: "flexible",
    waterTargetCups: 8,
    dietaryNotes: "",
    avoidIngredients: "",
    disclaimerAccepted: false,
  };
}

export function getDefaultMealPlannerSettings(): MealPlannerSettings {
  return {
    preferredWeekStart: "saturday",
  };
}

export function createEmptyWeek(weekStartISO: string): WeeklyMealPlan {
  return {
    weekStartISO,
    meals: [],
  };
}

export function createDefaultDayMeta(dateISO: string): MealDayMeta {
  return {
    dateISO,
    snackNote: "",
    prepNote: "",
    waterCups: 0,
  };
}

export function createDefaultMealPlannerState(now = new Date()): MealPlannerState {
  const settings = getDefaultMealPlannerSettings();
  const weekStartISO = getWeekStartISO(settings.preferredWeekStart, now);

  return {
    version: 2,
    settings,
    weekPlan: createEmptyWeek(weekStartISO),
    dayMeta: getWeekDates(weekStartISO).map((day) => createDefaultDayMeta(day.dateISO)),
    profile: getDefaultMealPlannerProfile(),
    recentMeals: [],
  };
}

function normalizeMealType(value: unknown): MealType {
  return value === "breakfast" || value === "lunch" || value === "dinner" ? value : "lunch";
}

function normalizeMealStatus(value: unknown): MealStatus {
  return value === "done" || value === "leftover" || value === "eating_out" || value === "skipped" || value === "planned"
    ? value
    : "planned";
}

function normalizeGoal(value: unknown): MealGoal {
  return value === "weight_loss" || value === "muscle_gain" || value === "family_routine" || value === "balanced"
    ? value
    : "balanced";
}

function normalizeActivity(value: unknown): MealActivityLevel {
  return value === "low" || value === "moderate" || value === "high" ? value : "moderate";
}

function normalizeSnackPreference(value: unknown): MealSnackPreference {
  return value === "none" || value === "flexible" || value === "daily" ? value : "flexible";
}

function normalizeProfile(value: unknown): MealPlannerProfile {
  const raw = (value && typeof value === "object" ? value : {}) as Partial<MealPlannerProfile>;
  return {
    goal: normalizeGoal(raw.goal),
    activityLevel: normalizeActivity(raw.activityLevel),
    snackPreference: normalizeSnackPreference(raw.snackPreference),
    waterTargetCups: typeof raw.waterTargetCups === "number" && Number.isFinite(raw.waterTargetCups)
      ? Math.max(1, Math.min(20, Math.round(raw.waterTargetCups)))
      : 8,
    dietaryNotes: typeof raw.dietaryNotes === "string" ? raw.dietaryNotes : "",
    avoidIngredients: typeof raw.avoidIngredients === "string" ? raw.avoidIngredients : "",
    disclaimerAccepted: Boolean(raw.disclaimerAccepted),
  };
}

function normalizeState(raw: unknown): MealPlannerState {
  const fallback = createDefaultMealPlannerState();
  const parsed = (raw && typeof raw === "object" ? raw : {}) as Partial<MealPlannerState>;

  if (parsed.version !== 2) {
    return fallback;
  }

  const settings = parsed.settings?.preferredWeekStart === "sunday"
    ? { preferredWeekStart: "sunday" as const }
    : { preferredWeekStart: "saturday" as const };

  const currentWeekStartISO = getWeekStartISO(settings.preferredWeekStart);
  const storedWeekStartISO = parsed.weekPlan?.weekStartISO;
  const activeWeekStartISO = storedWeekStartISO === currentWeekStartISO ? storedWeekStartISO : currentWeekStartISO;
  const weekDates = getWeekDates(activeWeekStartISO).map((item) => item.dateISO);
  const dayMetaByDate = new Map<string, MealDayMeta>();

  if (Array.isArray(parsed.dayMeta)) {
    for (const item of parsed.dayMeta) {
      if (!item || typeof item !== "object" || typeof item.dateISO !== "string") continue;
      dayMetaByDate.set(item.dateISO, {
        dateISO: item.dateISO,
        snackNote: typeof item.snackNote === "string" ? item.snackNote : "",
        prepNote: typeof item.prepNote === "string" ? item.prepNote : "",
        waterCups: typeof item.waterCups === "number" && Number.isFinite(item.waterCups)
          ? Math.max(0, Math.min(20, Math.round(item.waterCups)))
          : 0,
      });
    }
  }

  const meals = Array.isArray(parsed.weekPlan?.meals)
    ? parsed.weekPlan.meals
        .filter((meal) => meal && typeof meal.dateISO === "string" && weekDates.includes(meal.dateISO))
        .map((meal) => ({
          id: typeof meal.id === "string" && meal.id ? meal.id : createId(),
          dateISO: meal.dateISO,
          mealType: normalizeMealType(meal.mealType),
          title: typeof meal.title === "string" ? meal.title.trim() : "",
          status: normalizeMealStatus(meal.status),
          note: typeof meal.note === "string" ? meal.note : "",
        }))
        .filter((meal) => meal.title || meal.note || meal.status !== "planned")
    : [];

  return {
    version: 2,
    settings,
    weekPlan: {
      weekStartISO: activeWeekStartISO,
      meals,
    },
    dayMeta: weekDates.map((dateISO) => dayMetaByDate.get(dateISO) ?? createDefaultDayMeta(dateISO)),
    profile: normalizeProfile(parsed.profile),
    recentMeals: Array.isArray(parsed.recentMeals)
      ? parsed.recentMeals.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 12)
      : [],
  };
}

export function loadMealPlannerState(): MealPlannerState {
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(MEAL_PLANNER_STORAGE_KEY);
    if (raw) {
      try {
        return normalizeState(JSON.parse(raw));
      } catch {
        return createDefaultMealPlannerState();
      }
    }
  }

  return createDefaultMealPlannerState();
}

export function saveMealPlannerState(state: MealPlannerState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MEAL_PLANNER_STORAGE_KEY, JSON.stringify(state));
}

export function getDefaultMealTitle(mealType: MealType, status: MealStatus) {
  if (status === "leftover") return "بقايا";
  if (status === "eating_out") return "أكل خارج البيت";
  if (status === "skipped") return "تم التخطي";
  return MEAL_TYPE_LABELS[mealType];
}

export function getWaterTargetCups(profile: MealPlannerProfile) {
  const minimum = 8 + (profile.activityLevel === "moderate" ? 1 : profile.activityLevel === "high" ? 2 : 0);
  return Math.max(profile.waterTargetCups, minimum);
}

export function getMealPlannerSummary(state: MealPlannerState): MealPlannerSummary {
  const totalMeals = 7 * 3;
  const plannedMeals = state.weekPlan.meals.length;
  const completedMeals = state.weekPlan.meals.filter((meal) => meal.status === "done").length;
  const emptyMeals = Math.max(totalMeals - plannedMeals, 0);
  const weeklyWaterTotal = state.dayMeta.reduce((sum, day) => sum + day.waterCups, 0);
  const weeklyWaterTarget = getWaterTargetCups(state.profile) * 7;
  const daysWithWaterTarget = state.dayMeta.filter((day) => day.waterCups >= getWaterTargetCups(state.profile)).length;

  return {
    totalMeals,
    plannedMeals,
    completedMeals,
    emptyMeals,
    daysWithWaterTarget,
    weeklyWaterTotal,
    weeklyWaterTarget,
  };
}

export function getSnackSuggestion(profile: MealPlannerProfile) {
  if (profile.goal === "muscle_gain" || profile.activityLevel === "high") {
    return "يفضّل 1-2 سناك خفيف خلال اليوم حسب الجوع والنشاط.";
  }

  if (profile.goal === "weight_loss" || profile.activityLevel === "low") {
    return "يكفي عادة 0-1 سناك خفيف إذا احتجت بين الوجبات.";
  }

  return "سناك واحد خفيف يوميًا غالبًا مناسب للحفاظ على الروتين.";
}

export function getGuidanceItems(profile: MealPlannerProfile, summary: MealPlannerSummary) {
  if (!profile.disclaimerAccepted) {
    return [
      "فعّل الإقرار داخل الإعدادات لعرض التوجيهات الشخصية.",
      "يمكنك استخدام التخطيط الأسبوعي بالكامل حتى بدون تفعيل التوجيهات.",
    ];
  }

  const notes: string[] = [
    getSnackSuggestion(profile),
    `الهدف الأسبوعي للماء: ${summary.weeklyWaterTarget} أكواب تقريبًا، مع متابعة يومية قدرها ${getWaterTargetCups(profile)} أكواب.`,
  ];

  if (profile.avoidIngredients.trim()) {
    notes.push(`تجنّب هذه المكونات أثناء التخطيط: ${profile.avoidIngredients.trim()}.`);
  }

  if (profile.dietaryNotes.trim()) {
    notes.push(`ضع هذه الملاحظات في الحسبان أثناء ترتيب الوجبات: ${profile.dietaryNotes.trim()}.`);
  }

  return notes;
}

import { addDays, format } from "date-fns";

export type MealType = "breakfast" | "lunch" | "dinner";

export type MealStatus = "planned" | "done" | "leftover" | "eating_out" | "skipped";

export type MealGoal = "balanced" | "weight_loss" | "muscle_gain" | "family_routine";

export type MealActivityLevel = "low" | "moderate" | "high";

export type MealSnackPreference = "none" | "flexible" | "daily";

export interface MealSlot {
  mealType: MealType;
  title: string;
  status: MealStatus;
  note: string;
  updatedAt: string;
}

export interface MealDayPlan {
  dateISO: string;
  meals: MealSlot[];
  snackNote: string;
  prepNote: string;
  waterCups: number;
  updatedAt: string;
  isComplete: boolean;
}

export interface MealPlannerProfile {
  goal: MealGoal;
  activityLevel: MealActivityLevel;
  snackPreference: MealSnackPreference;
  waterTargetCups: number;
  dietaryNotes: string;
  avoidIngredients: string;
}

export interface MealPlannerSettings {
  rollingWindowDays: number;
  planningHorizonDays: number;
}

export interface MealPlannerState {
  version: 3;
  settings: MealPlannerSettings;
  plansByDate: Record<string, MealDayPlan>;
  profile: MealPlannerProfile;
  recentMeals: string[];
}

export interface MealPreset {
  id: string;
  title: string;
  description: string;
  meals: Partial<Record<MealType, { title: string; note?: string; status?: MealStatus }>>;
  snackNote?: string;
  prepNote?: string;
}

export interface MealPlannerSummary {
  totalMeals: number;
  plannedMeals: number;
  completedMeals: number;
  skippedMeals: number;
  eatingOutMeals: number;
  weeklyWaterTotal: number;
  weeklyWaterTarget: number;
  daysWithWaterTarget: number;
  completedDays: number;
  completionPercent: number;
}

export interface DashboardSeriesPoint {
  dateISO: string;
  label: string;
  plannedMeals: number;
  completedMeals: number;
  skippedMeals: number;
  eatingOutMeals: number;
  waterCups: number;
  waterLiters: number;
  waterTargetCups: number;
  waterTargetLiters: number;
  isToday: boolean;
}

export const MEAL_PLANNER_STORAGE_KEY = "planner_hub_meal_planner_v3_guided";

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

export const MEAL_PRESETS: MealPreset[] = [
  {
    id: "light",
    title: "خفيف",
    description: "يوم خفيف وسهل التحضير مع خيارات بسيطة.",
    meals: {
      breakfast: { title: "زبادي مع فاكهة", note: "أضف حفنة مكسرات إذا لزم", status: "planned" },
      lunch: { title: "سلطة مع بروتين خفيف", status: "planned" },
      dinner: { title: "شوربة وخبز محمص", status: "planned" },
    },
    snackNote: "فاكهة أو لبن خفيف",
    prepNote: "تحضير الخضار مساءً لتسهيل الغداء",
  },
  {
    id: "workday",
    title: "دوام طويل",
    description: "تنظيم يوم مزدحم مع خيارات عملية وسريعة.",
    meals: {
      breakfast: { title: "سندويش سريع + قهوة", status: "planned" },
      lunch: { title: "وجبة جاهزة من البيت", note: "يفضل تسخينها قبل الدوام", status: "planned" },
      dinner: { title: "وجبة سريعة التحضير", status: "planned" },
    },
    snackNote: "بار بروتين أو موزة",
    prepNote: "جهز الغداء في الليلة السابقة",
  },
  {
    id: "family",
    title: "عائلي",
    description: "ترتيب يوم يناسب الأسرة مع تحضير مسبق بسيط.",
    meals: {
      breakfast: { title: "بيض وخبز وخضار", status: "planned" },
      lunch: { title: "رز ودجاج وسلطة", status: "planned" },
      dinner: { title: "سندويشات أو شوربة خفيفة", status: "planned" },
    },
    snackNote: "خيار أو فواكه للأطفال",
    prepNote: "تتبيل الدجاج صباحًا أو الليلة السابقة",
  },
  {
    id: "quick",
    title: "سريع التحضير",
    description: "حلول جاهزة لأيام الزحمة بأقل مجهود.",
    meals: {
      breakfast: { title: "توست وجبن", status: "planned" },
      lunch: { title: "باستا سريعة", status: "planned" },
      dinner: { title: "سلطة تونة أو لفائف", status: "planned" },
    },
    snackNote: "مكسرات أو تمر",
    prepNote: "اختر وصفات أقل من 20 دقيقة",
  },
];

export function createId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getTodayISO(date = new Date()) {
  return format(date, "yyyy-MM-dd");
}

export function getDefaultMealPlannerProfile(): MealPlannerProfile {
  return {
    goal: "balanced",
    activityLevel: "moderate",
    snackPreference: "flexible",
    waterTargetCups: 8,
    dietaryNotes: "",
    avoidIngredients: "",
  };
}

export function getDefaultMealPlannerSettings(): MealPlannerSettings {
  return {
    rollingWindowDays: 7,
    planningHorizonDays: 14,
  };
}

export function createDefaultMealSlot(mealType: MealType): MealSlot {
  return {
    mealType,
    title: "",
    status: "planned",
    note: "",
    updatedAt: new Date().toISOString(),
  };
}

export function createDefaultDayPlan(dateISO: string): MealDayPlan {
  const now = new Date().toISOString();
  return {
    dateISO,
    meals: [
      createDefaultMealSlot("breakfast"),
      createDefaultMealSlot("lunch"),
      createDefaultMealSlot("dinner"),
    ],
    snackNote: "",
    prepNote: "",
    waterCups: 0,
    updatedAt: now,
    isComplete: false,
  };
}

export function createDefaultMealPlannerState(): MealPlannerState {
  return {
    version: 3,
    settings: getDefaultMealPlannerSettings(),
    plansByDate: {},
    profile: getDefaultMealPlannerProfile(),
    recentMeals: [],
  };
}

function normalizeMealType(value: unknown): MealType {
  return value === "breakfast" || value === "lunch" || value === "dinner" ? value : "lunch";
}

function normalizeMealStatus(value: unknown): MealStatus {
  return value === "planned" || value === "done" || value === "leftover" || value === "eating_out" || value === "skipped"
    ? value
    : "planned";
}

function normalizeGoal(value: unknown): MealGoal {
  return value === "balanced" || value === "weight_loss" || value === "muscle_gain" || value === "family_routine"
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
  };
}

function normalizeDayPlan(dateISO: string, value: unknown): MealDayPlan {
  const fallback = createDefaultDayPlan(dateISO);
  const raw = (value && typeof value === "object" ? value : {}) as Partial<MealDayPlan>;
  const mealByType = new Map<MealType, MealSlot>();

  if (Array.isArray(raw.meals)) {
    for (const meal of raw.meals) {
      if (!meal || typeof meal !== "object") continue;
      const rawMeal = meal as Partial<MealSlot>;
      const mealType = normalizeMealType(rawMeal.mealType);
      mealByType.set(mealType, {
        mealType,
        title: typeof rawMeal.title === "string" ? rawMeal.title : "",
        status: normalizeMealStatus(rawMeal.status),
        note: typeof rawMeal.note === "string" ? rawMeal.note : "",
        updatedAt: typeof rawMeal.updatedAt === "string" ? rawMeal.updatedAt : fallback.updatedAt,
      });
    }
  }

  return {
    dateISO,
    meals: ["breakfast", "lunch", "dinner"].map((mealType) => mealByType.get(mealType as MealType) ?? createDefaultMealSlot(mealType as MealType)),
    snackNote: typeof raw.snackNote === "string" ? raw.snackNote : "",
    prepNote: typeof raw.prepNote === "string" ? raw.prepNote : "",
    waterCups: typeof raw.waterCups === "number" && Number.isFinite(raw.waterCups) ? Math.max(0, Math.min(20, Math.round(raw.waterCups))) : 0,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : fallback.updatedAt,
    isComplete: Boolean(raw.isComplete),
  };
}

function normalizeState(raw: unknown): MealPlannerState {
  const fallback = createDefaultMealPlannerState();
  const parsed = (raw && typeof raw === "object" ? raw : {}) as Partial<MealPlannerState>;

  if (parsed.version !== 3) {
    return fallback;
  }

  const plansByDate: Record<string, MealDayPlan> = {};
  const rawPlans = parsed.plansByDate && typeof parsed.plansByDate === "object" ? parsed.plansByDate : {};
  for (const [dateISO, plan] of Object.entries(rawPlans)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) continue;
    plansByDate[dateISO] = normalizeDayPlan(dateISO, plan);
  }

  return {
    version: 3,
    settings: {
      rollingWindowDays: typeof parsed.settings?.rollingWindowDays === "number" ? Math.max(7, Math.min(14, Math.round(parsed.settings.rollingWindowDays))) : 7,
      planningHorizonDays: typeof parsed.settings?.planningHorizonDays === "number" ? Math.max(7, Math.min(21, Math.round(parsed.settings.planningHorizonDays))) : 14,
    },
    plansByDate,
    profile: normalizeProfile(parsed.profile),
    recentMeals: Array.isArray(parsed.recentMeals)
      ? parsed.recentMeals.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 18)
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

export function getFutureDates(startISO: string, count: number) {
  const start = new Date(`${startISO}T00:00:00`);
  return Array.from({ length: count }, (_, index) => {
    const date = addDays(start, index);
    return {
      dateISO: format(date, "yyyy-MM-dd"),
      weekdayLabel: date.toLocaleDateString("ar", { weekday: "short" }),
      dayLabel: format(date, "d/M"),
      fullLabel: date.toLocaleDateString("ar", { day: "numeric", month: "long" }),
    };
  });
}

export function getRollingDates(count = 7, referenceISO = getTodayISO()) {
  return getFutureDates(referenceISO, count);
}

export function getPlanningDates(count = 14, referenceISO = getTodayISO()) {
  return getFutureDates(referenceISO, count);
}

export function getDefaultMealTitle(mealType: MealType, status: MealStatus) {
  if (status === "leftover") return "بقايا";
  if (status === "eating_out") return "أكل خارج البيت";
  if (status === "skipped") return "تم التخطي";
  return MEAL_TYPE_LABELS[mealType];
}

export function cupsToLiters(cups: number) {
  return Number((cups * 0.25).toFixed(2));
}

export function formatLiters(cups: number) {
  return `${cupsToLiters(cups).toLocaleString("en-US")} لتر`;
}

export function getWaterTargetCups(profile: MealPlannerProfile) {
  const minimum = 8 + (profile.activityLevel === "moderate" ? 1 : profile.activityLevel === "high" ? 2 : 0);
  return Math.max(profile.waterTargetCups, minimum);
}

export function getWaterTargetLiters(profile: MealPlannerProfile) {
  return cupsToLiters(getWaterTargetCups(profile));
}

export function getDayPlan(state: MealPlannerState, dateISO: string) {
  return state.plansByDate[dateISO] ?? createDefaultDayPlan(dateISO);
}

export function countPlannedMeals(plan: MealDayPlan) {
  return plan.meals.filter((meal) => meal.title.trim().length > 0 || meal.status !== "planned" || meal.note.trim().length > 0).length;
}

export function countCompletedMeals(plan: MealDayPlan) {
  return plan.meals.filter((meal) => meal.status === "done").length;
}

export function getMealPlannerSummary(state: MealPlannerState, referenceISO = getTodayISO()) {
  const rollingDates = getRollingDates(state.settings.rollingWindowDays, referenceISO);
  const waterTargetCups = getWaterTargetCups(state.profile);

  let plannedMeals = 0;
  let completedMeals = 0;
  let skippedMeals = 0;
  let eatingOutMeals = 0;
  let weeklyWaterTotal = 0;
  let daysWithWaterTarget = 0;
  let completedDays = 0;

  for (const day of rollingDates) {
    const plan = getDayPlan(state, day.dateISO);
    plannedMeals += countPlannedMeals(plan);
    completedMeals += countCompletedMeals(plan);
    skippedMeals += plan.meals.filter((meal) => meal.status === "skipped").length;
    eatingOutMeals += plan.meals.filter((meal) => meal.status === "eating_out").length;
    weeklyWaterTotal += plan.waterCups;
    if (plan.waterCups >= waterTargetCups) daysWithWaterTarget += 1;
    if (plan.isComplete) completedDays += 1;
  }

  const totalMeals = rollingDates.length * 3;
  const completionPercent = totalMeals === 0 ? 0 : Math.round((completedMeals / totalMeals) * 100);

  return {
    totalMeals,
    plannedMeals,
    completedMeals,
    skippedMeals,
    eatingOutMeals,
    weeklyWaterTotal,
    weeklyWaterTarget: waterTargetCups * rollingDates.length,
    daysWithWaterTarget,
    completedDays,
    completionPercent,
  } satisfies MealPlannerSummary;
}

export function getSetupProgress(state: MealPlannerState, referenceISO = getTodayISO()) {
  const planningDates = getPlanningDates(state.settings.planningHorizonDays, referenceISO);
  const completedDays = planningDates.filter((day) => getDayPlan(state, day.dateISO).isComplete).length;
  const percent = planningDates.length === 0 ? 0 : Math.round((completedDays / planningDates.length) * 100);

  return {
    totalDays: planningDates.length,
    completedDays,
    percent,
  };
}

export function getDashboardSeries(state: MealPlannerState, referenceISO = getTodayISO()): DashboardSeriesPoint[] {
  const todayISO = referenceISO;
  const waterTargetCups = getWaterTargetCups(state.profile);

  return getRollingDates(state.settings.rollingWindowDays, referenceISO).map((day) => {
    const plan = getDayPlan(state, day.dateISO);
    return {
      dateISO: day.dateISO,
      label: day.weekdayLabel,
      plannedMeals: countPlannedMeals(plan),
      completedMeals: countCompletedMeals(plan),
      skippedMeals: plan.meals.filter((meal) => meal.status === "skipped").length,
      eatingOutMeals: plan.meals.filter((meal) => meal.status === "eating_out").length,
      waterCups: plan.waterCups,
      waterLiters: cupsToLiters(plan.waterCups),
      waterTargetCups,
      waterTargetLiters: cupsToLiters(waterTargetCups),
      isToday: day.dateISO === todayISO,
    };
  });
}

export function getGuidanceItems(profile: MealPlannerProfile, summary: MealPlannerSummary) {
  const items = [
    profile.goal === "muscle_gain" || profile.activityLevel === "high"
      ? "حافظ على 1-2 سناك خفيف خلال اليوم إذا كان نشاطك مرتفعًا."
      : profile.goal === "weight_loss" || profile.activityLevel === "low"
        ? "يكفي غالبًا 0-1 سناك خفيف بين الوجبات حسب الجوع."
        : "سناك واحد خفيف يوميًا مناسب لمعظم الأيام المتوازنة.",
    `هدف الماء اليومي المقترح هو ${getWaterTargetCups(profile)} أكواب (${getWaterTargetLiters(profile).toLocaleString("en-US")} لتر).`,
    `أكملت ${summary.completedDays} أيام من نافذة العرض الحالية، ويمكنك تحسين الإيقاع اليومي بإقفال اليوم بعد المراجعة.`,
  ];

  if (profile.avoidIngredients.trim()) {
    items.push(`تذكير شخصي: تجنّب ${profile.avoidIngredients.trim()} أثناء توزيع الوجبات.`);
  }

  if (profile.dietaryNotes.trim()) {
    items.push(`ملاحظة إضافية: ${profile.dietaryNotes.trim()}.`);
  }

  return items;
}

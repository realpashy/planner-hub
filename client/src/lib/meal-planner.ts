import { addDays, format, startOfWeek, subWeeks } from "date-fns";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MealStatus = "planned" | "done" | "leftover" | "eating_out" | "skipped";
export type MealSource = "custom" | "favorite" | "template" | "leftover" | "eating_out" | "copied" | "autofill";
export type PrepEffort = "low" | "medium" | "high";
export type WeeklyPlanningStyle = "full_custom" | "copy_last_week" | "same_breakfast_daily" | "alternating_lunches" | "low_effort_week" | "autofill_empty";
export type WeeklyPreferenceMode = "simple" | "family" | "budget" | "high_protein" | "balanced" | "low_prep";
export type MealGoal = "balanced" | "weight_loss" | "muscle_gain" | "family_routine";
export type MealActivityLevel = "low" | "moderate" | "high";
export type MealSnackPreference = "none" | "flexible" | "daily";

export interface MealSlot {
  id: string;
  mealType: MealType;
  title: string;
  note: string;
  status: MealStatus;
  source: MealSource;
  prepEffort: PrepEffort;
  categoryTags: string[];
  ingredientSummary: string;
  prepMinutes: number;
  updatedAt: string;
}

export interface MealDayPlan {
  dateISO: string;
  meals: MealSlot[];
  waterActualCups: number;
  waterTargetCups: number;
  notes: string;
  prepNote: string;
  prepLoad: PrepEffort;
  shoppingReady: boolean;
  leftoversAvailable: boolean;
  copiedFromDateISO?: string;
  updatedAt: string;
}

export interface MealFavorite {
  id: string;
  title: string;
  mealType: MealType;
  note: string;
  source: MealSource;
  prepEffort: PrepEffort;
  categoryTags: string[];
  ingredientSummary: string;
  prepMinutes: number;
}

export interface MealDayTemplate {
  id: string;
  name: string;
  description: string;
  prepLoad: PrepEffort;
  shoppingReady: boolean;
  leftoversAvailable: boolean;
  notes: string;
  prepNote: string;
  meals: Partial<Record<MealType, Omit<MealSlot, "id" | "mealType" | "updatedAt">>>;
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
  weekStartsOn: 0 | 1 | 6;
}

export interface MealPlannerState {
  version: 4;
  settings: MealPlannerSettings;
  plansByDate: Record<string, MealDayPlan>;
  profile: MealPlannerProfile;
  recentMeals: string[];
  favorites: MealFavorite[];
  templates: MealDayTemplate[];
}

export interface MealPlannerDayInfo {
  dateISO: string;
  weekdayLabel: string;
  weekdayLong: string;
  dayLabel: string;
  fullLabel: string;
  isToday: boolean;
}

export interface MealPlannerSummary {
  totalMeals: number;
  plannedMeals: number;
  completedMeals: number;
  emptyMeals: number;
  repeatedMealsCount: number;
  weeklyWaterTotal: number;
  weeklyWaterTarget: number;
  daysWithWaterTarget: number;
  daysFullyPlanned: number;
  daysPartiallyPlanned: number;
  groceryLoadDays: number;
  leftoverOpportunities: number;
  prepHeavyDays: number;
  copiedDays: number;
  templateMeals: number;
  shoppingReadyDays: number;
  completionPercent: number;
  adherenceStreak: number;
  emptyDinners: number;
  completedDays: number;
  eatingOutMeals: number;
  skippedMeals: number;
  busiestPrepDay: string | null;
  mostRepeatedCategory: string | null;
}

export interface ShoppingItem {
  id: string;
  label: string;
  count: number;
  days: string[];
  mealTitles: string[];
}

export interface WeeklyRecommendation {
  id: string;
  title: string;
  body: string;
  tone: "info" | "success" | "warning";
}

export interface WeeklySetupOption {
  value: WeeklyPlanningStyle | WeeklyPreferenceMode;
  label: string;
  description: string;
}

const WEEK_STARTS_ON: 0 = 0;
export const MEAL_PLANNER_STORAGE_KEY = "planner_hub_meal_planner_v4_weekly";
export const MEAL_TYPE_LABELS: Record<MealType, string> = { breakfast: "فطور", lunch: "غداء", dinner: "عشاء", snack: "سناك" };
export const MEAL_STATUS_LABELS: Record<MealStatus, string> = { planned: "مخطط", done: "تم", leftover: "بقايا", eating_out: "خارج المنزل", skipped: "تم التخطي" };
export const MEAL_SOURCE_LABELS: Record<MealSource, string> = { custom: "مخصص", favorite: "مفضلة", template: "قالب", leftover: "بقايا", eating_out: "خارج المنزل", copied: "منسوخ", autofill: "تعبئة ذكية" };
export const PREP_EFFORT_LABELS: Record<PrepEffort, string> = { low: "خفيف", medium: "متوسط", high: "مرتفع" };
export const PROFILE_GOAL_OPTIONS = [{ value: "balanced", label: "توازن عام" }, { value: "weight_loss", label: "تنظيم الوزن" }, { value: "muscle_gain", label: "دعم النشاط والكتلة" }, { value: "family_routine", label: "روتين عائلي" }] satisfies Array<{ value: MealGoal; label: string }>;
export const PROFILE_ACTIVITY_OPTIONS = [{ value: "low", label: "نشاط منخفض" }, { value: "moderate", label: "نشاط متوسط" }, { value: "high", label: "نشاط مرتفع" }] satisfies Array<{ value: MealActivityLevel; label: string }>;
export const PROFILE_SNACK_OPTIONS = [{ value: "none", label: "بدون سناك" }, { value: "flexible", label: "حسب الحاجة" }, { value: "daily", label: "سناك يومي" }] satisfies Array<{ value: MealSnackPreference; label: string }>;
export const WEEKLY_STYLE_OPTIONS: WeeklySetupOption[] = [
  { value: "full_custom", label: "تخصيص كامل", description: "ابدأ أسبوعًا فارغًا مع هيكل جاهز فقط." },
  { value: "copy_last_week", label: "نسخ الأسبوع الماضي", description: "إعادة استخدام نفس الهيكل اليومي مع تحديثه لاحقًا." },
  { value: "same_breakfast_daily", label: "فطور ثابت يوميًا", description: "تثبيت الفطور وتسريع بقية اليوم." },
  { value: "alternating_lunches", label: "غداء متناوب", description: "وجبتا غداء تتبادلان على مدار الأسبوع." },
  { value: "low_effort_week", label: "أسبوع منخفض الجهد", description: "خيارات سريعة مع تحضير أقل." },
  { value: "autofill_empty", label: "ملء الخانات الفارغة", description: "الحفاظ على الموجود وإكمال ما ينقص فقط." },
];
export const WEEKLY_MODE_OPTIONS: WeeklySetupOption[] = [
  { value: "simple", label: "بسيط", description: "وجبات مباشرة بدون تعقيد." },
  { value: "family", label: "عائلي", description: "يناسب البيت والمشاركة." },
  { value: "budget", label: "اقتصادي", description: "تقليل الهدر والمشتريات." },
  { value: "high_protein", label: "عالي البروتين", description: "دعم الشبع والبروتين." },
  { value: "balanced", label: "متوازن", description: "تنويع أعلى وتوزيع أهدأ." },
  { value: "low_prep", label: "قليل التحضير", description: "تحضير أسرع وأخف." },
];

const DEFAULT_TEMPLATE_SPECS = [
  {
    id: "template_low_prep",
    name: "أسبوع خفيف التحضير",
    description: "حل سريع لأيام الدوام أو التعب.",
    prepLoad: "low" as PrepEffort,
    shoppingReady: true,
    leftoversAvailable: true,
    notes: "يعتمد على إعادة الاستخدام والوصفات السريعة.",
    prepNote: "حضّر الخضار والبروتين مرة واحدة في بداية الأسبوع.",
    meals: {
      breakfast: { title: "زبادي وفاكهة", source: "template", prepEffort: "low", categoryTags: ["خفيف"], ingredientSummary: "زبادي, فاكهة" },
      lunch: { title: "وعاء أرز مع بروتين", source: "template", prepEffort: "medium", categoryTags: ["عملي"], ingredientSummary: "أرز, دجاج, خضار" },
      dinner: { title: "شوربة وسندويش", source: "template", prepEffort: "low", categoryTags: ["منزلي"], ingredientSummary: "شوربة, خبز" },
      snack: { title: "تمر أو مكسرات", source: "template", prepEffort: "low", categoryTags: ["سريع"], ingredientSummary: "تمر, مكسرات" },
    },
  },
  {
    id: "template_family",
    name: "يوم عائلي",
    description: "وجبات مشتركة مع ضغط شراء أوضح.",
    prepLoad: "medium" as PrepEffort,
    shoppingReady: false,
    leftoversAvailable: true,
    notes: "مناسب لليوم الذي فيه غداء مركزي للعائلة.",
    prepNote: "اختصر التحضير بتجهيز الصوصات والمقبلات مسبقًا.",
    meals: {
      breakfast: { title: "بيض وخبز وخضار", source: "template", prepEffort: "medium", categoryTags: ["عائلي"], ingredientSummary: "بيض, خبز, خضار" },
      lunch: { title: "رز ودجاج وسلطة", source: "template", prepEffort: "high", categoryTags: ["وجبة رئيسية"], ingredientSummary: "رز, دجاج, سلطة" },
      dinner: { title: "سندويشات من بقايا الغداء", source: "leftover", prepEffort: "low", categoryTags: ["بقايا"], ingredientSummary: "خبز, دجاج" },
      snack: { title: "فاكهة موسمية", source: "template", prepEffort: "low", categoryTags: ["خفيف"], ingredientSummary: "فاكهة" },
    },
  },
] as const;

export function createId() { return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`; }
export function getTodayISO(date = new Date()) { return format(date, "yyyy-MM-dd"); }
export function cupsToLiters(cups: number) { return Number((cups * 0.25).toFixed(2)); }
export function formatLiters(cups: number) { return `${cupsToLiters(cups).toLocaleString("en-US")} لتر`; }
export function getDefaultMealPlannerProfile(): MealPlannerProfile { return { goal: "balanced", activityLevel: "moderate", snackPreference: "flexible", waterTargetCups: 8, dietaryNotes: "", avoidIngredients: "" }; }
export function getWaterTargetCups(profile: MealPlannerProfile) { const minimum = 8 + (profile.activityLevel === "moderate" ? 1 : profile.activityLevel === "high" ? 2 : 0); return Math.max(profile.waterTargetCups, minimum); }
export function getWaterTargetLiters(profile: MealPlannerProfile) { return cupsToLiters(getWaterTargetCups(profile)); }
export function getDefaultMealPlannerSettings(): MealPlannerSettings { return { weekStartsOn: WEEK_STARTS_ON }; }
export function createDefaultMealSlot(mealType: MealType): MealSlot {
  return { id: createId(), mealType, title: "", note: "", status: "planned", source: "custom", prepEffort: "low", categoryTags: [], ingredientSummary: "", prepMinutes: mealType === "breakfast" ? 10 : mealType === "snack" ? 5 : 20, updatedAt: new Date().toISOString() };
}
export function createDefaultDayPlan(dateISO: string, waterTargetCups = 8): MealDayPlan {
  const now = new Date().toISOString();
  return { dateISO, meals: ["breakfast", "lunch", "dinner", "snack"].map((mealType) => createDefaultMealSlot(mealType as MealType)), waterActualCups: 0, waterTargetCups, notes: "", prepNote: "", prepLoad: "low", shoppingReady: false, leftoversAvailable: false, updatedAt: now };
}

function createDefaultTemplates(): MealDayTemplate[] {
  return DEFAULT_TEMPLATE_SPECS.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    prepLoad: template.prepLoad,
    shoppingReady: template.shoppingReady,
    leftoversAvailable: template.leftoversAvailable,
    notes: template.notes,
    prepNote: template.prepNote,
    meals: Object.fromEntries(Object.entries(template.meals).map(([mealType, meal]) => [mealType, { title: meal.title, note: "", status: "planned", source: meal.source as MealSource, prepEffort: meal.prepEffort as PrepEffort, categoryTags: [...meal.categoryTags], ingredientSummary: meal.ingredientSummary, prepMinutes: 15 }])) as MealDayTemplate["meals"],
  }));
}

export function createDefaultMealPlannerState(): MealPlannerState {
  return { version: 4, settings: getDefaultMealPlannerSettings(), plansByDate: {}, profile: getDefaultMealPlannerProfile(), recentMeals: [], favorites: [], templates: createDefaultTemplates() };
}

function normalizeMealType(value: unknown): MealType { return value === "breakfast" || value === "lunch" || value === "dinner" || value === "snack" ? value : "lunch"; }
function normalizeMealStatus(value: unknown): MealStatus { return value === "planned" || value === "done" || value === "leftover" || value === "eating_out" || value === "skipped" ? value : "planned"; }
function normalizeMealSource(value: unknown): MealSource { return value === "custom" || value === "favorite" || value === "template" || value === "leftover" || value === "eating_out" || value === "copied" || value === "autofill" ? value : "custom"; }
function normalizePrepEffort(value: unknown): PrepEffort { return value === "low" || value === "medium" || value === "high" ? value : "low"; }
function normalizeGoal(value: unknown): MealGoal { return value === "balanced" || value === "weight_loss" || value === "muscle_gain" || value === "family_routine" ? value : "balanced"; }
function normalizeActivity(value: unknown): MealActivityLevel { return value === "low" || value === "moderate" || value === "high" ? value : "moderate"; }
function normalizeSnackPreference(value: unknown): MealSnackPreference { return value === "none" || value === "flexible" || value === "daily" ? value : "flexible"; }
function sanitizeTags(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()).slice(0, 5) : []; }

function normalizeMealSlot(raw: unknown, mealType: MealType): MealSlot {
  const data = (raw && typeof raw === "object" ? raw : {}) as Partial<MealSlot>;
  return {
    id: typeof data.id === "string" ? data.id : createId(),
    mealType,
    title: typeof data.title === "string" ? data.title : "",
    note: typeof data.note === "string" ? data.note : "",
    status: normalizeMealStatus(data.status),
    source: normalizeMealSource(data.source),
    prepEffort: normalizePrepEffort(data.prepEffort),
    categoryTags: sanitizeTags(data.categoryTags),
    ingredientSummary: typeof data.ingredientSummary === "string" ? data.ingredientSummary : "",
    prepMinutes: typeof data.prepMinutes === "number" && Number.isFinite(data.prepMinutes) ? Math.max(0, Math.min(180, Math.round(data.prepMinutes))) : 15,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString(),
  };
}

function normalizeProfile(raw: unknown): MealPlannerProfile {
  const data = (raw && typeof raw === "object" ? raw : {}) as Partial<MealPlannerProfile>;
  return {
    goal: normalizeGoal(data.goal),
    activityLevel: normalizeActivity(data.activityLevel),
    snackPreference: normalizeSnackPreference(data.snackPreference),
    waterTargetCups: typeof data.waterTargetCups === "number" && Number.isFinite(data.waterTargetCups) ? Math.max(1, Math.min(20, Math.round(data.waterTargetCups))) : 8,
    dietaryNotes: typeof data.dietaryNotes === "string" ? data.dietaryNotes : "",
    avoidIngredients: typeof data.avoidIngredients === "string" ? data.avoidIngredients : "",
  };
}

function normalizeDayPlan(dateISO: string, raw: unknown, waterTargetCups = 8): MealDayPlan {
  const fallback = createDefaultDayPlan(dateISO, waterTargetCups);
  const data = (raw && typeof raw === "object" ? raw : {}) as Partial<MealDayPlan>;
  const mealByType = new Map<MealType, MealSlot>();
  if (Array.isArray(data.meals)) {
    for (const meal of data.meals) {
      if (!meal || typeof meal !== "object") continue;
      const slot = meal as Partial<MealSlot>;
      const mealType = normalizeMealType(slot.mealType);
      mealByType.set(mealType, normalizeMealSlot(slot, mealType));
    }
  }
  return {
    dateISO,
    meals: ["breakfast", "lunch", "dinner", "snack"].map((mealType) => mealByType.get(mealType as MealType) ?? createDefaultMealSlot(mealType as MealType)),
    waterActualCups: typeof data.waterActualCups === "number" && Number.isFinite(data.waterActualCups) ? Math.max(0, Math.min(20, Math.round(data.waterActualCups))) : fallback.waterActualCups,
    waterTargetCups: typeof data.waterTargetCups === "number" && Number.isFinite(data.waterTargetCups) ? Math.max(1, Math.min(20, Math.round(data.waterTargetCups))) : waterTargetCups,
    notes: typeof data.notes === "string" ? data.notes : "",
    prepNote: typeof data.prepNote === "string" ? data.prepNote : "",
    prepLoad: normalizePrepEffort(data.prepLoad),
    shoppingReady: Boolean(data.shoppingReady),
    leftoversAvailable: Boolean(data.leftoversAvailable),
    copiedFromDateISO: typeof data.copiedFromDateISO === "string" ? data.copiedFromDateISO : undefined,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : fallback.updatedAt,
  };
}

function normalizeFavorite(raw: unknown): MealFavorite | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<MealFavorite>;
  return {
    id: typeof data.id === "string" ? data.id : createId(),
    title: typeof data.title === "string" ? data.title : "",
    mealType: normalizeMealType(data.mealType),
    note: typeof data.note === "string" ? data.note : "",
    source: normalizeMealSource(data.source),
    prepEffort: normalizePrepEffort(data.prepEffort),
    categoryTags: sanitizeTags(data.categoryTags),
    ingredientSummary: typeof data.ingredientSummary === "string" ? data.ingredientSummary : "",
    prepMinutes: typeof data.prepMinutes === "number" && Number.isFinite(data.prepMinutes) ? Math.max(0, Math.min(180, Math.round(data.prepMinutes))) : 15,
  };
}

function normalizeTemplate(raw: unknown): MealDayTemplate | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<MealDayTemplate>;
  const meals: MealDayTemplate["meals"] = {};
  if (data.meals && typeof data.meals === "object") {
    for (const [key, value] of Object.entries(data.meals)) {
      const mealType = normalizeMealType(key);
      const slot = normalizeMealSlot({ ...value, mealType }, mealType);
      meals[mealType] = { title: slot.title, note: slot.note, status: slot.status, source: slot.source, prepEffort: slot.prepEffort, categoryTags: slot.categoryTags, ingredientSummary: slot.ingredientSummary, prepMinutes: slot.prepMinutes };
    }
  }
  return {
    id: typeof data.id === "string" ? data.id : createId(),
    name: typeof data.name === "string" ? data.name : "قالب جديد",
    description: typeof data.description === "string" ? data.description : "",
    prepLoad: normalizePrepEffort(data.prepLoad),
    shoppingReady: Boolean(data.shoppingReady),
    leftoversAvailable: Boolean(data.leftoversAvailable),
    notes: typeof data.notes === "string" ? data.notes : "",
    prepNote: typeof data.prepNote === "string" ? data.prepNote : "",
    meals,
  };
}

function normalizeState(raw: unknown): MealPlannerState {
  const fallback = createDefaultMealPlannerState();
  const parsed = (raw && typeof raw === "object" ? raw : {}) as Partial<MealPlannerState>;
  if (parsed.version !== 4) return fallback;
  const profile = normalizeProfile(parsed.profile);
  const waterTarget = getWaterTargetCups(profile);
  const plansByDate: Record<string, MealDayPlan> = {};
  if (parsed.plansByDate && typeof parsed.plansByDate === "object") {
    for (const [dateISO, plan] of Object.entries(parsed.plansByDate)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) continue;
      plansByDate[dateISO] = normalizeDayPlan(dateISO, plan, waterTarget);
    }
  }
  return {
    version: 4,
    settings: { weekStartsOn: parsed.settings?.weekStartsOn === 1 || parsed.settings?.weekStartsOn === 6 ? parsed.settings.weekStartsOn : WEEK_STARTS_ON },
    plansByDate,
    profile,
    recentMeals: Array.isArray(parsed.recentMeals) ? parsed.recentMeals.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 24) : [],
    favorites: Array.isArray(parsed.favorites)
      ? parsed.favorites
          .map(normalizeFavorite)
          .filter((item): item is MealFavorite => item !== null && item.title.trim().length > 0)
          .slice(0, 36)
      : [],
    templates: Array.isArray(parsed.templates) ? parsed.templates.map(normalizeTemplate).filter((item): item is MealDayTemplate => Boolean(item)).slice(0, 24) : createDefaultTemplates(),
  };
}

export function loadMealPlannerState(): MealPlannerState {
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(MEAL_PLANNER_STORAGE_KEY);
    if (raw) {
      try { return normalizeState(JSON.parse(raw)); } catch { return createDefaultMealPlannerState(); }
    }
  }
  return createDefaultMealPlannerState();
}

export function saveMealPlannerState(state: MealPlannerState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MEAL_PLANNER_STORAGE_KEY, JSON.stringify(state));
}

export function getWeekDates(referenceISO = getTodayISO()): MealPlannerDayInfo[] {
  const start = startOfWeek(new Date(`${referenceISO}T00:00:00`), { weekStartsOn: WEEK_STARTS_ON });
  const todayISO = getTodayISO();
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    const dateISO = format(date, "yyyy-MM-dd");
    return {
      dateISO,
      weekdayLabel: date.toLocaleDateString("ar", { weekday: "short" }),
      weekdayLong: date.toLocaleDateString("ar", { weekday: "long" }),
      dayLabel: date.toLocaleDateString("ar", { day: "numeric", month: "short" }),
      fullLabel: date.toLocaleDateString("ar", { weekday: "long", day: "numeric", month: "long" }),
      isToday: dateISO === todayISO,
    };
  });
}

export function getPreviousWeekDates(referenceISO = getTodayISO()) {
  const start = startOfWeek(new Date(`${referenceISO}T00:00:00`), { weekStartsOn: WEEK_STARTS_ON });
  return getWeekDates(format(subWeeks(start, 1), "yyyy-MM-dd"));
}

export function getDayPlan(state: MealPlannerState, dateISO: string) { return state.plansByDate[dateISO] ?? createDefaultDayPlan(dateISO, getWaterTargetCups(state.profile)); }
export function countPlannedMeals(plan: MealDayPlan) { return plan.meals.filter((meal) => meal.title.trim().length > 0 || meal.status !== "planned" || meal.note.trim().length > 0).length; }
export function countCompletedMeals(plan: MealDayPlan) { return plan.meals.filter((meal) => meal.status === "done").length; }
export function getMealCompletionPercent(plan: MealDayPlan) { return Math.round((countPlannedMeals(plan) / plan.meals.length) * 100); }

export function getMealSuggestions(state: MealPlannerState, dateISO: string, mealType: MealType) {
  const currentWeek = getWeekDates(dateISO);
  const titles = new Set<string>();
  const suggestions: Array<{ title: string; source: MealSource; tags: string[] }> = [];
  for (const favorite of state.favorites) {
    if (favorite.mealType !== mealType || titles.has(favorite.title)) continue;
    titles.add(favorite.title);
    suggestions.push({ title: favorite.title, source: "favorite", tags: favorite.categoryTags });
  }
  for (const template of state.templates) {
    const meal = template.meals[mealType];
    if (!meal?.title || titles.has(meal.title)) continue;
    titles.add(meal.title);
    suggestions.push({ title: meal.title, source: "template", tags: meal.categoryTags ?? [] });
  }
  for (const day of currentWeek) {
    if (day.dateISO === dateISO) continue;
    const slot = getDayPlan(state, day.dateISO).meals.find((meal) => meal.mealType === mealType);
    if (!slot?.title.trim() || titles.has(slot.title)) continue;
    titles.add(slot.title);
    suggestions.push({ title: slot.title, source: slot.source, tags: slot.categoryTags });
  }
  for (const title of state.recentMeals) {
    if (titles.has(title)) continue;
    titles.add(title);
    suggestions.push({ title, source: "custom", tags: [] });
  }
  return suggestions.slice(0, 6);
}

function countDuplicateTitles(titles: string[]) {
  const counts = new Map<string, number>();
  for (const title of titles) counts.set(title, (counts.get(title) ?? 0) + 1);
  return Array.from(counts.values()).reduce((sum, count) => sum + Math.max(0, count - 1), 0);
}

function getMostRepeatedCategory(plans: MealDayPlan[]) {
  const counts = new Map<string, number>();
  for (const plan of plans) {
    for (const meal of plan.meals) {
      for (const tag of meal.categoryTags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  let topCategory: string | null = null;
  let topCount = 0;
  for (const [tag, count] of Array.from(counts.entries())) {
    if (count > topCount) { topCategory = tag; topCount = count; }
  }
  return topCategory;
}

export function parseIngredientSummary(value: string) {
  return value.split(/[،,]/).map((item) => item.trim()).filter(Boolean);
}

export function getWeeklyShoppingItems(state: MealPlannerState, referenceISO = getTodayISO()): ShoppingItem[] {
  const dayInfos = getWeekDates(referenceISO);
  const itemMap = new Map<string, ShoppingItem>();
  for (const day of dayInfos) {
    const plan = getDayPlan(state, day.dateISO);
    for (const meal of plan.meals) {
      for (const ingredient of parseIngredientSummary(meal.ingredientSummary)) {
        const key = ingredient.toLowerCase();
        const existing = itemMap.get(key);
        if (existing) {
          existing.count += 1;
          if (!existing.days.includes(day.weekdayLabel)) existing.days.push(day.weekdayLabel);
          if (meal.title && !existing.mealTitles.includes(meal.title)) existing.mealTitles.push(meal.title);
        } else {
          itemMap.set(key, { id: createId(), label: ingredient, count: 1, days: [day.weekdayLabel], mealTitles: meal.title ? [meal.title] : [] });
        }
      }
    }
  }
  return Array.from(itemMap.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ar"));
}

export function getMealPlannerSummary(state: MealPlannerState, referenceISO = getTodayISO()): MealPlannerSummary {
  const days = getWeekDates(referenceISO);
  const plans = days.map((day) => getDayPlan(state, day.dateISO));
  const totalMeals = plans.length * 4;
  const plannedMeals = plans.reduce((sum, plan) => sum + countPlannedMeals(plan), 0);
  const completedMeals = plans.reduce((sum, plan) => sum + countCompletedMeals(plan), 0);
  const skippedMeals = plans.reduce((sum, plan) => sum + plan.meals.filter((meal) => meal.status === "skipped").length, 0);
  const eatingOutMeals = plans.reduce((sum, plan) => sum + plan.meals.filter((meal) => meal.status === "eating_out").length, 0);
  const weeklyWaterTotal = plans.reduce((sum, plan) => sum + plan.waterActualCups, 0);
  const weeklyWaterTarget = plans.reduce((sum, plan) => sum + plan.waterTargetCups, 0);
  const daysWithWaterTarget = plans.filter((plan) => plan.waterActualCups >= plan.waterTargetCups).length;
  const daysFullyPlanned = plans.filter((plan) => countPlannedMeals(plan) === plan.meals.length).length;
  const daysPartiallyPlanned = plans.filter((plan) => countPlannedMeals(plan) > 0 && countPlannedMeals(plan) < plan.meals.length).length;
  const groceryLoadDays = plans.filter((plan) => parseIngredientSummary(plan.meals.map((meal) => meal.ingredientSummary).join(",")).length >= 5).length;
  const leftoverOpportunities = plans.filter((plan) => plan.leftoversAvailable || plan.meals.some((meal) => meal.source === "leftover" || meal.status === "leftover")).length;
  const prepHeavyDays = plans.filter((plan) => plan.prepLoad === "high").length;
  const copiedDays = plans.filter((plan) => Boolean(plan.copiedFromDateISO)).length;
  const templateMeals = plans.reduce((sum, plan) => sum + plan.meals.filter((meal) => meal.source === "template").length, 0);
  const shoppingReadyDays = plans.filter((plan) => plan.shoppingReady).length;
  const emptyMeals = totalMeals - plannedMeals;
  const emptyDinners = plans.reduce((sum, plan) => sum + (plan.meals.find((meal) => meal.mealType === "dinner")?.title.trim() ? 0 : 1), 0);
  const repeatedMealsCount = countDuplicateTitles(plans.flatMap((plan) => plan.meals.map((meal) => meal.title.trim()).filter(Boolean)));
  const completionPercent = totalMeals === 0 ? 0 : Math.round((plannedMeals / totalMeals) * 100);
  let adherenceStreak = 0;
  for (const plan of plans) {
    if (countPlannedMeals(plan) >= 3) adherenceStreak += 1; else break;
  }
  let busiestPrepDay: string | null = null;
  let highestLoad = -1;
  plans.forEach((plan, index) => {
    const load = plan.meals.reduce((sum, meal) => sum + meal.prepMinutes, 0);
    if (load > highestLoad) { highestLoad = load; busiestPrepDay = days[index]?.weekdayLabel ?? null; }
  });
  return {
    totalMeals, plannedMeals, completedMeals, emptyMeals, repeatedMealsCount, weeklyWaterTotal, weeklyWaterTarget, daysWithWaterTarget,
    daysFullyPlanned, daysPartiallyPlanned, groceryLoadDays, leftoverOpportunities, prepHeavyDays, copiedDays, templateMeals, shoppingReadyDays,
    completionPercent, adherenceStreak, emptyDinners, completedDays: daysFullyPlanned, eatingOutMeals, skippedMeals, busiestPrepDay,
    mostRepeatedCategory: getMostRepeatedCategory(plans),
  };
}

export function getWeeklyRecommendations(state: MealPlannerState, referenceISO = getTodayISO()): WeeklyRecommendation[] {
  const days = getWeekDates(referenceISO);
  const plans = days.map((day) => ({ day, plan: getDayPlan(state, day.dateISO) }));
  const summary = getMealPlannerSummary(state, referenceISO);
  const recommendations: WeeklyRecommendation[] = [];
  if (summary.emptyDinners > 0) recommendations.push({ id: "empty_dinners", title: "عشاءات ناقصة", body: `ما زال لديك ${summary.emptyDinners} خانات عشاء فارغة هذا الأسبوع. ابدأ بملئها لأنها الأكثر تأثيرًا على التسوق والتحضير.`, tone: "warning" });
  const monday = plans.find((entry) => entry.day.weekdayLong.includes("الاثنين"));
  const friday = plans.find((entry) => entry.day.weekdayLong.includes("الجمعة"));
  if (monday && friday && countPlannedMeals(monday.plan) >= 3 && countPlannedMeals(friday.plan) <= 1) recommendations.push({ id: "copy_monday_to_friday", title: "إعادة استخدام يوم قوي", body: "الاثنين مضبوط بشكل جيد، ويمكن نسخه بسهولة إلى الجمعة لتقليل وقت التخطيط.", tone: "info" });
  if (summary.repeatedMealsCount >= 4) recommendations.push({ id: "repetition_high", title: "تكرار مرتفع", body: "هناك تكرار ملحوظ في الوجبات هذا الأسبوع. جرّب تبديل وجبتين على الأقل لتوازن أفضل.", tone: "warning" });
  if (summary.groceryLoadDays >= 2) recommendations.push({ id: "shopping_cluster", title: "ضغط مشتريات", body: "هناك أكثر من يوم يتطلب مشتريات كثيرة. دمج المكونات بين يومين سيخفف الجهد.", tone: "info" });
  const similarDays = plans.find((entry, index) => {
    const next = plans[index + 1];
    if (!next) return false;
    const currentIngredients = new Set(parseIngredientSummary(entry.plan.meals.map((meal) => meal.ingredientSummary).join(",")));
    const nextIngredients = parseIngredientSummary(next.plan.meals.map((meal) => meal.ingredientSummary).join(","));
    return nextIngredients.some((ingredient) => currentIngredients.has(ingredient));
  });
  if (similarDays) recommendations.push({ id: "ingredient_overlap", title: "تداخل ذكي في المكونات", body: `${similarDays.day.weekdayLabel} يشترك في مكونات مع اليوم التالي، وهذا مناسب لتقليل هدر التسوق.`, tone: "success" });
  if (recommendations.length === 0) recommendations.push({ id: "good_week", title: "الأسبوع متوازن", body: "الخطة الأسبوعية تبدو متماسكة. ركّز الآن على رفع الماء وإغلاق الخانات الفارغة الصغيرة.", tone: "success" });
  return recommendations.slice(0, 5);
}

export function getDefaultMealTitle(mealType: MealType, status: MealStatus) {
  if (status === "leftover") return "بقايا";
  if (status === "eating_out") return "خارج المنزل";
  if (status === "skipped") return "تم التخطي";
  return MEAL_TYPE_LABELS[mealType];
}

function getMealBank(mode: WeeklyPreferenceMode): Record<MealType, string[]> {
  return {
    breakfast: mode === "budget" ? ["فول وخبز", "بيض وتوست", "زبادي وشوفان"] : mode === "family" ? ["فطور عربي مشترك", "بيض وخبز للعائلة", "لبنة وخضار"] : mode === "high_protein" ? ["بيض وجبن قريش", "زبادي يوناني", "ساندويش ديك رومي"] : ["شوفان وفاكهة", "بيض وخبز كامل", "زبادي مع مكسرات"],
    lunch: mode === "budget" ? ["مجدرة وسلطة", "أرز وخضار", "باستا بصلصة طماطم"] : mode === "family" ? ["رز ودجاج وسلطة", "صينية خضار مع لحم", "مقلوبة خفيفة"] : mode === "high_protein" ? ["دجاج مشوي وأرز", "تونة وسلطة", "لحم وخضار"] : ["أرز ودجاج", "سمك وخضار", "مكرونة متوازنة"],
    dinner: mode === "low_prep" ? ["شوربة جاهزة", "ساندويش سريع", "سلطة تونة"] : mode === "budget" ? ["بقايا الغداء", "سندويش جبنة", "شوربة عدس"] : ["شوربة وسلطة", "سندويش خفيف", "بطاطا وبروتين خفيف"],
    snack: mode === "high_protein" ? ["لبن بروتين", "بيض مسلوق", "مكسرات"] : ["فاكهة", "زبادي", "مكسرات"],
  };
}

export function buildGeneratedWeekPlans(state: MealPlannerState, referenceISO: string, style: WeeklyPlanningStyle, mode: WeeklyPreferenceMode) {
  const currentWeek = getWeekDates(referenceISO);
  const previousWeek = getPreviousWeekDates(referenceISO);
  const mealBank = getMealBank(mode);
  const nextPlans: Record<string, MealDayPlan> = {};
  currentWeek.forEach((day, index) => {
    const currentPlan = getDayPlan(state, day.dateISO);
    const basePlan = createDefaultDayPlan(day.dateISO, getWaterTargetCups(state.profile));
    let nextPlan: MealDayPlan = { ...basePlan, notes: currentPlan.notes, prepNote: currentPlan.prepNote, shoppingReady: currentPlan.shoppingReady, leftoversAvailable: currentPlan.leftoversAvailable, prepLoad: currentPlan.prepLoad };
    if (style === "copy_last_week") {
      const previousPlan = getDayPlan(state, previousWeek[index]?.dateISO ?? day.dateISO);
      nextPlan = { ...previousPlan, dateISO: day.dateISO, updatedAt: new Date().toISOString(), copiedFromDateISO: previousWeek[index]?.dateISO };
    } else {
      nextPlan.meals = nextPlan.meals.map((meal) => {
        const originalMeal = currentPlan.meals.find((slot) => slot.mealType === meal.mealType) ?? meal;
        const bankItems = mealBank[meal.mealType];
        const fallbackTitle = bankItems[index % bankItems.length] ?? "";
        if (style === "full_custom") return meal;
        if (style === "autofill_empty" && (originalMeal.title.trim() || originalMeal.note.trim())) return { ...originalMeal, updatedAt: new Date().toISOString() };
        if (style === "same_breakfast_daily" && meal.mealType === "breakfast") return { ...meal, title: bankItems[0] ?? fallbackTitle, source: "autofill", prepEffort: mode === "low_prep" ? "low" : "medium", ingredientSummary: "خبز, لبنة, فاكهة", updatedAt: new Date().toISOString() };
        if (style === "alternating_lunches" && meal.mealType === "lunch") return { ...meal, title: bankItems[index % 2], source: "autofill", prepEffort: mode === "low_prep" ? "low" : "medium", ingredientSummary: mode === "budget" ? "أرز, عدس, خضار" : "بروتين, خضار, نشويات", updatedAt: new Date().toISOString() };
        if (style === "low_effort_week") return { ...meal, title: getMealBank("low_prep")[meal.mealType][index % 3], source: "autofill", prepEffort: "low", ingredientSummary: meal.mealType === "dinner" ? "شوربة, خبز" : meal.mealType === "lunch" ? "وعاء جاهز, خضار" : "مكونات سريعة", updatedAt: new Date().toISOString() };
        return { ...meal, title: originalMeal.title.trim() || fallbackTitle, note: originalMeal.note, source: originalMeal.title.trim() ? originalMeal.source : "autofill", prepEffort: mode === "low_prep" ? "low" : mode === "family" ? "medium" : originalMeal.prepEffort, ingredientSummary: originalMeal.ingredientSummary || (meal.mealType === "snack" ? "فاكهة, مكسرات" : "بروتين, خضار"), updatedAt: new Date().toISOString() };
      });
    }
    if (style !== "full_custom") {
      nextPlan.prepLoad = mode === "low_prep" || style === "low_effort_week" ? "low" : mode === "family" ? "high" : "medium";
      nextPlan.shoppingReady = style === "copy_last_week" ? currentPlan.shoppingReady : mode !== "family";
      nextPlan.leftoversAvailable = mode === "budget" || style === "low_effort_week";
      nextPlan.prepNote = nextPlan.prepNote || (mode === "family" ? "حضّر المكونات الرئيسية ليلة سابقة." : "نسّق الوجبات المتشابهة لتقليل الجهد.");
    }
    nextPlans[day.dateISO] = { ...nextPlan, dateISO: day.dateISO, updatedAt: new Date().toISOString() };
  });
  return nextPlans;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MealSource = "ai" | "basic" | "manual";
export type MealSwapMode = "similar" | "higher_protein" | "faster" | "vegetarian" | "refresh";
export type PlanTier = "free" | "pro" | "admin";
export type PlannerViewState = "onboarding" | "loading" | "planner";
export type PlannerDataStatus = "idle" | "loading" | "ready" | "error";
export type SexType = "male" | "female";
export type GoalType = "lose_weight" | "maintain" | "gain" | "eat_healthier";
export type ActivityLevel = "low" | "moderate" | "high";
export type CookingTime = "short" | "medium" | "long";
export type SkillLevel = "beginner" | "intermediate" | "advanced";
export type DietType = "any" | "high_protein" | "keto" | "mediterranean" | "vegetarian" | "vegan" | "balanced";
export type MealGoal = "balanced" | "weight_loss" | "muscle_gain" | "family_routine";
export type MealActivityLevel = "low" | "moderate" | "high";
export type MealSnackPreference = "none" | "flexible" | "daily";

export const JERUSALEM_TIMEZONE = "Asia/Jerusalem";
export const MEAL_PLANNER_STORAGE_KEY = "planner_hub_meal_planner_v6";

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "الفطور",
  lunch: "الغداء",
  dinner: "العشاء",
  snack: "السناك",
};

export const DIET_LABELS: Record<DietType, string> = {
  any: "مرن",
  high_protein: "عالي البروتين",
  keto: "كيتو",
  mediterranean: "متوسطي",
  vegetarian: "نباتي",
  vegan: "نباتي صرف",
  balanced: "متوازن",
};

export const GOAL_LABELS: Record<GoalType, string> = {
  lose_weight: "تقليل الوزن",
  maintain: "المحافظة",
  gain: "زيادة صحية",
  eat_healthier: "أكل صحي أكثر",
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  low: "منخفض",
  moderate: "متوسط",
  high: "مرتفع",
};

export const COOKING_TIME_LABELS: Record<CookingTime, string> = {
  short: "سريع",
  medium: "متوسط",
  long: "مرن",
};

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
};

const ARABIC_WEEKDAY_LABELS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const ARABIC_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export interface PlannerPreferences {
  dietType: DietType;
  mealsPerDay: 2 | 3 | 4;
  snacks: boolean;
  cuisinePreferences: string[];
  allergies: string[];
  dislikedIngredients: string[];
  dislikedMeals: string[];
  foodRules: string[];
  ingredientsAtHome: string[];
  goal: GoalType;
  caloriesTarget: number;
  age: number | null;
  sex: SexType;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: ActivityLevel;
  workout: boolean;
  cookingTime: CookingTime;
  skillLevel: SkillLevel;
  repeatMeals: boolean;
  leftovers: boolean;
  maxIngredients: number;
  quickMealsPreference: boolean;
  busyDays: string[];
  fastingEnabled: boolean;
  fastingWindow: string;
  additionalNotes?: string;
}

export interface MealPlannerProfile {
  goal: MealGoal;
  activityLevel: MealActivityLevel;
  snackPreference: MealSnackPreference;
  waterTargetCups: number;
  dietaryNotes: string;
  avoidIngredients: string;
}

export interface MealPlanMeal {
  id: string;
  mealType: MealType;
  title: string;
  icon: string;
  ingredients: string[];
  steps: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterCups: number;
  tags: string[];
  reason: string;
  shortTip: string;
  source: MealSource;
  image: string;
  imageType: "emoji" | "static" | "generated" | "upload" | "local";
  imageSource: string;
  repeated: boolean;
  reusedIngredient: boolean;
}

export interface GroceryListItem {
  key: string;
  label: string;
  quantity: string;
  checked: boolean;
  count: number;
}

export interface GroceryGroup {
  key: string;
  title: string;
  items: GroceryListItem[];
}

export interface DayNutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterCups: number;
}

export interface PlannerDay {
  dateISO: string;
  dayName: string;
  dateLabel: string;
  busyDay: boolean;
  aiTip: string;
  notes: string;
  status: "ready" | "light" | "busy";
  meals: MealPlanMeal[];
  nutrition: DayNutritionSummary;
}

export interface PlannerSuggestionBundle {
  nutritionInsight: string;
  habitSuggestion: string;
  supplementPlaceholder: string;
}

export interface WeeklyPlanRecord {
  id: string;
  weekStart: string;
  version: number;
  isActive: boolean;
  source: "ai" | "basic";
  summary: string;
  days: PlannerDay[];
  grocery: GroceryGroup[];
  suggestions: PlannerSuggestionBundle;
  usage: {
    monthlyGenerationsUsed: number;
    swapsUsed: number;
    dayRegenerationsUsed: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PlannerLimits {
  generationsPerMonth: number | null;
  dayRegenerationsPerMonth: number | null;
  mealSwapsPerMonth: number | null;
}

export interface PlannerServerState {
  role: string;
  tier: PlanTier;
  timezone: string;
  preferences: PlannerPreferences;
  savedPreferences: PlannerPreferences | null;
  activePlan: WeeklyPlanRecord | null;
  limits: PlannerLimits;
  plannerState: PlannerViewState;
}

export interface MealPlannerState {
  version: 6;
  preferences: PlannerPreferences;
  savedPreferences: PlannerPreferences | null;
  activePlan: WeeklyPlanRecord | null;
  role: string;
  tier: PlanTier;
  timezone: string;
  viewState: PlannerViewState;
  dataStatus: PlannerDataStatus;
  lastError: string | null;
}

export interface PlannerDayMeta {
  dateISO: string;
  dayName: string;
  dateLabel: string;
  isToday: boolean;
}

export interface PlannerDashboardSummary {
  totalCalories: number;
  averageCalories: number;
  totalProtein: number;
  totalWater: number;
  completionPercent: number;
  remainingDays: number;
}

export interface MealPlannerSummary {
  totalMeals: number;
  plannedMeals: number;
  completedDays: number;
  daysWithWaterTarget: number;
}

export const PROFILE_GOAL_OPTIONS = [
  { value: "balanced", label: "توازن عام" },
  { value: "weight_loss", label: "تقليل الوزن" },
  { value: "muscle_gain", label: "دعم النشاط" },
  { value: "family_routine", label: "روتين عائلي" },
] satisfies Array<{ value: MealGoal; label: string }>;

export const PROFILE_ACTIVITY_OPTIONS = [
  { value: "low", label: "منخفض" },
  { value: "moderate", label: "متوسط" },
  { value: "high", label: "مرتفع" },
] satisfies Array<{ value: MealActivityLevel; label: string }>;

export const PROFILE_SNACK_OPTIONS = [
  { value: "none", label: "بدون" },
  { value: "flexible", label: "مرن" },
  { value: "daily", label: "يومي" },
] satisfies Array<{ value: MealSnackPreference; label: string }>;

function formatJerusalemParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: JERUSALEM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return { year, month, day };
}

export function getJerusalemTodayISO(date = new Date()) {
  const { year, month, day } = formatJerusalemParts(date);
  return `${year}-${month}-${day}`;
}

function isoToUtcDate(dateISO: string) {
  return new Date(`${dateISO}T12:00:00Z`);
}

function addDaysISO(dateISO: string, days: number) {
  const date = isoToUtcDate(dateISO);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getWeekStartISO(referenceISO = getJerusalemTodayISO()) {
  const date = isoToUtcDate(referenceISO);
  return addDaysISO(referenceISO, -date.getUTCDay());
}

export function getActiveWeekDates(referenceISO = getJerusalemTodayISO()) {
  const date = isoToUtcDate(referenceISO);
  const currentDay = date.getUTCDay();
  return Array.from({ length: 7 - currentDay }, (_, index) => {
    const dateISO = addDaysISO(referenceISO, index);
    const displayDate = isoToUtcDate(dateISO);
    return {
      dateISO,
      dayName: ARABIC_WEEKDAY_LABELS[displayDate.getUTCDay()],
      dateLabel: `${displayDate.getUTCDate()} ${ARABIC_MONTHS[displayDate.getUTCMonth()]}`,
      isToday: index === 0,
    } satisfies PlannerDayMeta;
  });
}

export function getDefaultPreferences(): PlannerPreferences {
  return {
    dietType: "balanced",
    mealsPerDay: 3,
    snacks: true,
    cuisinePreferences: [],
    allergies: [],
    dislikedIngredients: [],
    dislikedMeals: [],
    foodRules: [],
    ingredientsAtHome: [],
    goal: "eat_healthier",
    caloriesTarget: 1900,
    age: null,
    sex: "male",
    heightCm: null,
    weightKg: null,
    activityLevel: "moderate",
    workout: false,
    cookingTime: "medium",
    skillLevel: "beginner",
    repeatMeals: true,
    leftovers: true,
    maxIngredients: 8,
    quickMealsPreference: true,
    busyDays: [],
    fastingEnabled: false,
    fastingWindow: "12:00 - 20:00",
    additionalNotes: "",
  };
}

export function createDefaultMealPlannerState(): MealPlannerState {
  return {
    version: 6,
    preferences: getDefaultPreferences(),
    savedPreferences: null,
    activePlan: null,
    role: "user",
    tier: "free",
    timezone: JERUSALEM_TIMEZONE,
    viewState: "onboarding",
    dataStatus: "idle",
    lastError: null,
  };
}

export function loadMealPlannerState() {
  if (typeof window === "undefined") return createDefaultMealPlannerState();
  try {
    const raw = window.localStorage.getItem(MEAL_PLANNER_STORAGE_KEY);
    if (!raw) return createDefaultMealPlannerState();
    const parsed = JSON.parse(raw) as MealPlannerState;
    return parsed.version === 6 ? parsed : createDefaultMealPlannerState();
  } catch {
    return createDefaultMealPlannerState();
  }
}

export function saveMealPlannerState(state: MealPlannerState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MEAL_PLANNER_STORAGE_KEY, JSON.stringify(state));
}

export function normalizeStringList(input: string[]) {
  return input.map((item) => item.trim()).filter(Boolean).slice(0, 10);
}

export function normalizePreferences(preferences: PlannerPreferences): PlannerPreferences {
  return {
    ...preferences,
    cuisinePreferences: normalizeStringList(preferences.cuisinePreferences),
    allergies: normalizeStringList(preferences.allergies),
    dislikedIngredients: normalizeStringList(preferences.dislikedIngredients),
    dislikedMeals: normalizeStringList(preferences.dislikedMeals),
    foodRules: normalizeStringList(preferences.foodRules),
    ingredientsAtHome: normalizeStringList(preferences.ingredientsAtHome),
    busyDays: normalizeStringList(preferences.busyDays),
    additionalNotes: typeof preferences.additionalNotes === "string" ? preferences.additionalNotes.trim().slice(0, 280) : "",
    caloriesTarget: Math.max(1200, Math.min(4000, Math.round(preferences.caloriesTarget || 1900))),
    maxIngredients: Math.max(4, Math.min(12, Math.round(preferences.maxIngredients || 8))),
    age: preferences.age ? Math.max(13, Math.min(90, Math.round(preferences.age))) : null,
    heightCm: preferences.heightCm ? Math.max(120, Math.min(230, Math.round(preferences.heightCm))) : null,
    weightKg: preferences.weightKg ? Math.max(35, Math.min(250, Math.round(preferences.weightKg))) : null,
  };
}

export function applyServerState(input: PlannerServerState): MealPlannerState {
  return {
    version: 6,
    preferences: normalizePreferences(input.preferences),
    savedPreferences: input.savedPreferences ? normalizePreferences(input.savedPreferences) : null,
    activePlan: input.activePlan ? enrichPlan(input.activePlan) : null,
    role: input.role,
    tier: input.tier,
    timezone: input.timezone || JERUSALEM_TIMEZONE,
    viewState: input.plannerState,
    dataStatus: "ready",
    lastError: null,
  };
}

export function cupsToLiters(cups: number) {
  return Number((cups * 0.25).toFixed(2));
}

export function formatWater(cups: number) {
  return `${cups} كوب • ${cupsToLiters(cups)} لتر`;
}

export function calculateBMI(heightCm: number | null, weightKg: number | null) {
  if (!heightCm || !weightKg) return null;
  const meters = heightCm / 100;
  return Number((weightKg / (meters * meters)).toFixed(1));
}

export function getBMIFeedback(bmi: number | null) {
  if (bmi === null) return "أدخل الطول والوزن لرؤية المؤشر.";
  if (bmi < 18.5) return "المؤشر منخفض نسبيًا، لذلك سنحافظ على وجبات مشبعة.";
  if (bmi < 25) return "المؤشر متوازن، وسنحافظ على توزيع يومي مريح.";
  if (bmi < 30) return "سنركز على أطباق خفيفة ومشبعة تدعم الاستمرارية.";
  return "سنراعي خيارات أبسط وأوضح لتخفيف الحمل اليومي.";
}

function detectGroup(label: string) {
  const value = label.toLowerCase();
  if (/(chicken|beef|turkey|tuna|salmon|fish|eggs|protein|yogurt|cheese)/.test(value)) return "protein";
  if (/(rice|bread|oats|pasta|potato|quinoa|tortilla)/.test(value)) return "carbs";
  if (/(tomato|cucumber|spinach|lettuce|broccoli|pepper|onion|avocado|banana|berries|fruit)/.test(value)) return "produce";
  return "pantry";
}

const GROUP_LABELS: Record<string, string> = {
  protein: "البروتينات",
  carbs: "الحبوب والكربوهيدرات",
  produce: "الخضار والفواكه",
  pantry: "أساسيات المطبخ",
};

function toEmojiForMealType(mealType: MealType) {
  if (mealType === "breakfast") return "🍳";
  if (mealType === "lunch") return "🥗";
  if (mealType === "dinner") return "🍲";
  return "🥤";
}

function normalizeMeal(rawMeal: Partial<MealPlanMeal> & Record<string, unknown>, index: number): MealPlanMeal {
  const mealType = (rawMeal.mealType as MealType | undefined) ?? "lunch";
  return {
    id: String(rawMeal.id ?? `${mealType}_${index}_${Math.random().toString(36).slice(2, 8)}`),
    mealType,
    title: String(rawMeal.title ?? ""),
    icon:
      typeof rawMeal.icon === "string" && rawMeal.icon.trim()
        ? rawMeal.icon
        : typeof rawMeal.image === "string" && rawMeal.imageType === "emoji"
          ? rawMeal.image
          : toEmojiForMealType(mealType),
    ingredients: Array.isArray(rawMeal.ingredients) ? rawMeal.ingredients.map(String).filter(Boolean) : [],
    steps: Array.isArray(rawMeal.steps) ? rawMeal.steps.map(String).filter(Boolean) : [],
    calories: Number(rawMeal.calories ?? 0),
    protein: Number(rawMeal.protein ?? 0),
    carbs: Number(rawMeal.carbs ?? 0),
    fat: Number(rawMeal.fat ?? 0),
    waterCups: Number(rawMeal.waterCups ?? 2),
    tags: Array.isArray(rawMeal.tags) ? rawMeal.tags.map(String).filter(Boolean).slice(0, 4) : [],
    reason: String(rawMeal.reason ?? ""),
    shortTip: String(rawMeal.shortTip ?? ""),
    source: rawMeal.source === "manual" ? "manual" : rawMeal.source === "basic" ? "basic" : "ai",
    image: typeof rawMeal.image === "string" && rawMeal.image.trim() ? rawMeal.image : toEmojiForMealType(mealType),
    imageType:
      rawMeal.imageType === "static" || rawMeal.imageType === "generated" || rawMeal.imageType === "upload" || rawMeal.imageType === "local"
        ? rawMeal.imageType
        : "emoji",
    imageSource: typeof rawMeal.imageSource === "string" ? rawMeal.imageSource : "planner-generated",
    repeated: Boolean(rawMeal.repeated),
    reusedIngredient: Boolean(rawMeal.reusedIngredient),
  };
}

function normalizeDay(rawDay: Partial<PlannerDay> & Record<string, unknown>, index: number): PlannerDay {
  const dateISO = String(rawDay.dateISO ?? getActiveWeekDates(getJerusalemTodayISO())[index]?.dateISO ?? getJerusalemTodayISO());
  const date = isoToUtcDate(dateISO);
  const meals = Array.isArray(rawDay.meals)
    ? rawDay.meals.map((meal, mealIndex) => normalizeMeal((meal ?? {}) as unknown as Record<string, unknown>, mealIndex))
    : [];
  const nutrition = {
    calories: meals.reduce((sum, meal) => sum + meal.calories, 0),
    protein: meals.reduce((sum, meal) => sum + meal.protein, 0),
    carbs: meals.reduce((sum, meal) => sum + meal.carbs, 0),
    fat: meals.reduce((sum, meal) => sum + meal.fat, 0),
    waterCups: Number(rawDay.nutrition && typeof rawDay.nutrition === "object" ? (rawDay.nutrition as unknown as Record<string, unknown>).waterCups : rawDay.waterTargetCups ?? 8),
  };
  const busyDay = Boolean(rawDay.busyDay);
  return {
    dateISO,
    dayName: typeof rawDay.dayName === "string" && rawDay.dayName.trim() ? rawDay.dayName : ARABIC_WEEKDAY_LABELS[date.getUTCDay()],
    dateLabel:
      typeof rawDay.dateLabel === "string" && rawDay.dateLabel.trim()
        ? rawDay.dateLabel
        : `${date.getUTCDate()} ${ARABIC_MONTHS[date.getUTCMonth()]}`,
    busyDay,
    aiTip: String(rawDay.aiTip ?? rawDay.tip ?? ""),
    notes: String(rawDay.notes ?? ""),
    status: busyDay ? "busy" : meals.length >= 3 ? "ready" : "light",
    meals,
    nutrition,
  };
}

function markRepeats(days: PlannerDay[]) {
  const mealCounts = new Map<string, number>();
  const ingredientCounts = new Map<string, number>();

  for (const day of days) {
    for (const meal of day.meals) {
      mealCounts.set(meal.title, (mealCounts.get(meal.title) ?? 0) + 1);
      for (const ingredient of meal.ingredients) {
        ingredientCounts.set(ingredient.toLowerCase(), (ingredientCounts.get(ingredient.toLowerCase()) ?? 0) + 1);
      }
    }
  }

  return days.map((day) => ({
    ...day,
    meals: day.meals.map((meal) => ({
      ...meal,
      icon: meal.icon || toEmojiForMealType(meal.mealType),
      repeated: (mealCounts.get(meal.title) ?? 0) > 1,
      reusedIngredient: meal.ingredients.some((ingredient) => (ingredientCounts.get(ingredient.toLowerCase()) ?? 0) > 1),
    })),
  }));
}

export function buildGroceryGroups(days: PlannerDay[]) {
  const merged = new Map<string, GroceryListItem>();
  for (const day of days) {
    for (const meal of day.meals) {
      for (const ingredient of meal.ingredients) {
        const label = ingredient.trim();
        if (!label) continue;
        const key = label.toLowerCase();
        const existing = merged.get(key);
        if (existing) {
          existing.count += 1;
          existing.quantity = existing.count > 1 ? `${existing.count}x` : existing.quantity;
        } else {
          merged.set(key, {
            key,
            label,
            quantity: "1x",
            checked: false,
            count: 1,
          });
        }
      }
    }
  }

  const groups = new Map<string, GroceryGroup>();
  for (const item of Array.from(merged.values())) {
    const groupKey = detectGroup(item.label);
    if (!groups.has(groupKey)) {
      groups.set(groupKey, { key: groupKey, title: GROUP_LABELS[groupKey], items: [] });
    }
    groups.get(groupKey)!.items.push(item);
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    items: group.items.sort((a, b) => a.label.localeCompare(b.label)),
  }));
}

function buildPlanSuggestions(plan: WeeklyPlanRecord): PlannerSuggestionBundle {
  const proteinHeavy = plan.days.some((day) => day.nutrition.protein >= 100);
  const hydrationLow = plan.days.some((day) => day.nutrition.waterCups < 8);
  return {
    nutritionInsight: proteinHeavy ? "في أيام معيّنة البروتين قوي، فحافظ على التوازن مع الخضار." : "إضافة مصدر بروتين ثابت سترفع ثبات الشبع خلال الأسبوع.",
    habitSuggestion: hydrationLow ? "قسّم الماء على اليوم بدل شربه دفعة واحدة." : "جهّز عنصرًا واحدًا مسبقًا لتبسيط منتصف الأسبوع.",
    supplementPlaceholder: "مكان مخصص لاحقًا لاقتراحات المكملات عند تفعيلها.",
  };
}

export function enrichPlan(plan: WeeklyPlanRecord): WeeklyPlanRecord {
  const activeDates = new Set(getActiveWeekDates(getJerusalemTodayISO()).map((day) => day.dateISO));
  const normalizedDays = Array.isArray(plan.days)
    ? plan.days.map((day, index) => normalizeDay((day ?? {}) as unknown as Record<string, unknown>, index))
    : [];
  const days = markRepeats(normalizedDays.filter((day) => activeDates.has(day.dateISO)));
  return {
    ...plan,
    days,
    grocery: buildGroceryGroups(days),
    suggestions: plan.suggestions ?? buildPlanSuggestions({ ...plan, days, grocery: [], suggestions: { nutritionInsight: "", habitSuggestion: "", supplementPlaceholder: "" } }),
  };
}

export function getDashboardSummary(plan: WeeklyPlanRecord | null): PlannerDashboardSummary {
  if (!plan) {
    return {
      totalCalories: 0,
      averageCalories: 0,
      totalProtein: 0,
      totalWater: 0,
      completionPercent: 0,
      remainingDays: 0,
    };
  }
  const totals = plan.days.reduce(
    (acc, day) => {
      acc.totalCalories += day.nutrition.calories;
      acc.totalProtein += day.nutrition.protein;
      acc.totalWater += day.nutrition.waterCups;
      acc.mealCount += day.meals.length;
      acc.filled += day.meals.filter((meal) => Boolean(meal.title.trim())).length;
      return acc;
    },
    { totalCalories: 0, totalProtein: 0, totalWater: 0, mealCount: 0, filled: 0 },
  );
  return {
    totalCalories: totals.totalCalories,
    averageCalories: plan.days.length ? Math.round(totals.totalCalories / plan.days.length) : 0,
    totalProtein: totals.totalProtein,
    totalWater: totals.totalWater,
    completionPercent: totals.mealCount ? Math.round((totals.filled / totals.mealCount) * 100) : 0,
    remainingDays: plan.days.length,
  };
}

export function getMealPlannerSummary(state: MealPlannerState | null | undefined): MealPlannerSummary {
  const plan = state?.activePlan ?? null;
  if (!plan) {
    return { totalMeals: 0, plannedMeals: 0, completedDays: 0, daysWithWaterTarget: 0 };
  }

  const totalMeals = plan.days.reduce((sum, day) => sum + day.meals.length, 0);
  const plannedMeals = plan.days.reduce((sum, day) => sum + day.meals.filter((meal) => Boolean(meal.title.trim())).length, 0);
  const completedDays = plan.days.filter((day) => day.meals.every((meal) => Boolean(meal.title.trim()))).length;
  const daysWithWaterTarget = plan.days.filter((day) => day.nutrition.waterCups >= 8).length;

  return { totalMeals, plannedMeals, completedDays, daysWithWaterTarget };
}

export function getUsageSummary(plan: WeeklyPlanRecord | null, limits: PlannerLimits) {
  return {
    generationsLeft:
      limits.generationsPerMonth === null
        ? null
        : Math.max(0, limits.generationsPerMonth - (plan?.usage.monthlyGenerationsUsed ?? 0)),
    dayRegenerationsLeft:
      limits.dayRegenerationsPerMonth === null
        ? null
        : Math.max(0, limits.dayRegenerationsPerMonth - (plan?.usage.dayRegenerationsUsed ?? 0)),
    swapsLeft:
      limits.mealSwapsPerMonth === null ? null : Math.max(0, limits.mealSwapsPerMonth - (plan?.usage.swapsUsed ?? 0)),
  };
}

export function getDefaultLimitsForTier(tier: PlanTier): PlannerLimits {
  if (tier === "admin") {
    return { generationsPerMonth: null, dayRegenerationsPerMonth: null, mealSwapsPerMonth: null };
  }
  return { generationsPerMonth: 2, dayRegenerationsPerMonth: 5, mealSwapsPerMonth: 10 };
}

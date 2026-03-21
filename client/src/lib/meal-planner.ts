import { addDays, format, startOfWeek } from "date-fns";
import { mealDataset } from "@/lib/meal-dataset";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MealStatus = "planned" | "done" | "skipped" | "eating_out";
export type MealSource = "generated" | "favorite" | "manual" | "copied";
export type PrepEffort = "low" | "medium" | "high";
export type BudgetLevel = "low" | "medium" | "high";
export type DietType = "any" | "balanced" | "high_protein" | "keto" | "mediterranean" | "vegetarian" | "vegan" | "low_carb" | "budget";
export type MealGoal = "balanced" | "weight_loss" | "muscle_gain" | "family_routine";
export type MealActivityLevel = "low" | "moderate" | "high";
export type MealSnackPreference = "none" | "flexible" | "daily";
export type MealImageType = "emoji" | "static" | "generated" | "upload" | "local";

export interface MealCatalogItem {
  id: string;
  title: string;
  mealType: MealType;
  dietTypes: DietType[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  effortLevel: PrepEffort;
  budgetLevel: BudgetLevel;
  ingredients: string[];
  exclusions: string[];
  tags: string[];
  image: string;
  imageType: MealImageType;
  imageSource: string;
  isFavorite?: boolean;
  isTemplate?: boolean;
}

export interface MealSlot {
  id: string;
  mealType: MealType;
  title: string;
  note: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  ingredients: string[];
  prepEffort: PrepEffort;
  budgetLevel: BudgetLevel;
  status: MealStatus;
  source: MealSource;
  image: string;
  imageType: MealImageType;
  imageSource: string;
  catalogItemId?: string;
  active: boolean;
  updatedAt: string;
}

export interface MealDayPlan {
  dateISO: string;
  meals: MealSlot[];
  waterActualCups: number;
  waterTargetCups: number;
  notes: string;
  updatedAt: string;
}

export interface MealFavorite {
  id: string;
  title: string;
  mealType: MealType;
  calories: number;
  tags: string[];
  image: string;
  imageType: MealImageType;
  imageSource: string;
  ingredients: string[];
}

export interface MealPlannerProfile {
  goal: MealGoal;
  activityLevel: MealActivityLevel;
  snackPreference: MealSnackPreference;
  waterTargetCups: number;
  dietaryNotes: string;
  avoidIngredients: string;
}

export interface MealPlannerPreferences {
  dietType: DietType;
  caloriesTarget: number;
  mealsPerDay: 2 | 3 | 4;
  exclusions: string[];
  budgetFriendly: boolean;
  lowEffort: boolean;
  preferVariety: boolean;
  allowRepetition: boolean;
  sameBreakfastDaily: boolean;
}

export interface MealPlannerSettings {
  weekStartsOn: 0 | 1 | 6;
}

export interface MealPlannerState {
  version: 5;
  settings: MealPlannerSettings;
  profile: MealPlannerProfile;
  preferences: MealPlannerPreferences;
  plansByDate: Record<string, MealDayPlan>;
  hasGeneratedPlan: boolean;
  recentMeals: string[];
  favorites: MealFavorite[];
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
  weeklyWaterTotal: number;
  weeklyWaterTarget: number;
  daysWithWaterTarget: number;
  completionPercent: number;
  averageCaloriesPerDay: number;
  totalWeeklyCalories: number;
  repeatedMealsCount: number;
  daysFullyPlanned: number;
  daysPartiallyPlanned: number;
  completedDays: number;
  groceryLoad: number;
  leftoverOpportunities: number;
}

export interface ShoppingItem {
  id: string;
  label: string;
  count: number;
  linkedDays: string[];
}

export interface WeeklyRecommendation {
  id: string;
  title: string;
  body: string;
  tone: "info" | "success" | "warning";
}

export interface WeekChartPoint {
  day: string;
  calories: number;
  water: number;
  completion: number;
}

const WEEK_STARTS_ON: 0 = 0;
export const MEAL_PLANNER_STORAGE_KEY = "planner_hub_meal_planner_v5_mobile_weekly";

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "فطور",
  lunch: "غداء",
  dinner: "عشاء",
  snack: "سناك",
};

export const MEAL_STATUS_LABELS: Record<MealStatus, string> = {
  planned: "مخطط",
  done: "تم",
  skipped: "تخطي",
  eating_out: "خارج المنزل",
};

export const MEAL_SOURCE_LABELS: Record<MealSource, string> = {
  generated: "مولد",
  favorite: "مفضلة",
  manual: "مخصص",
  copied: "منسوخ",
};

export const PREP_EFFORT_LABELS: Record<PrepEffort, string> = {
  low: "خفيف",
  medium: "متوسط",
  high: "مرتفع",
};

export const DIET_TYPE_LABELS: Record<DietType, string> = {
  any: "Any",
  balanced: "Balanced",
  high_protein: "High Protein",
  keto: "Keto",
  mediterranean: "Mediterranean",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  low_carb: "Low Carb",
  budget: "Budget",
};

export const PROFILE_GOAL_OPTIONS = [
  { value: "balanced", label: "توازن عام" },
  { value: "weight_loss", label: "تنظيم الوزن" },
  { value: "muscle_gain", label: "دعم النشاط" },
  { value: "family_routine", label: "روتين عائلي" },
] satisfies Array<{ value: MealGoal; label: string }>;

export const PROFILE_ACTIVITY_OPTIONS = [
  { value: "low", label: "نشاط منخفض" },
  { value: "moderate", label: "نشاط متوسط" },
  { value: "high", label: "نشاط مرتفع" },
] satisfies Array<{ value: MealActivityLevel; label: string }>;

export const PROFILE_SNACK_OPTIONS = [
  { value: "none", label: "بدون سناك" },
  { value: "flexible", label: "مرن" },
  { value: "daily", label: "يومي" },
] satisfies Array<{ value: MealSnackPreference; label: string }>;

const MEAL_CATALOG_LEGACY_UNUSED: MealCatalogItem[] = [
  { id: "b1", title: "بيض مع أفوكادو وتوست", mealType: "breakfast", dietTypes: ["any", "high_protein", "mediterranean", "keto"], calories: 420, protein: 24, carbs: 26, fat: 24, effortLevel: "low", budgetLevel: "medium", ingredients: ["بيض", "أفوكادو", "توست"], exclusions: [], tags: ["protein", "quick", "morning"], image: "🍳", imageType: "emoji", imageSource: "local-catalog" },
  { id: "b2", title: "زبادي يوناني مع توت", mealType: "breakfast", dietTypes: ["any", "high_protein", "vegetarian"], calories: 340, protein: 22, carbs: 28, fat: 12, effortLevel: "low", budgetLevel: "medium", ingredients: ["زبادي", "توت", "جرانولا"], exclusions: [], tags: ["quick", "protein"], image: "🥣", imageType: "emoji", imageSource: "local-catalog" },
  { id: "b3", title: "شوفان بالفواكه", mealType: "breakfast", dietTypes: ["any", "mediterranean", "vegetarian", "vegan"], calories: 360, protein: 12, carbs: 50, fat: 10, effortLevel: "low", budgetLevel: "low", ingredients: ["شوفان", "موز", "حليب نباتي"], exclusions: ["dairy"], tags: ["budget", "fiber"], image: "🥛", imageType: "emoji", imageSource: "local-catalog" },
  { id: "b4", title: "لفائف تركي وجبن", mealType: "breakfast", dietTypes: ["any", "high_protein"], calories: 395, protein: 29, carbs: 24, fat: 18, effortLevel: "low", budgetLevel: "medium", ingredients: ["تورتيلا", "تركي", "جبن"], exclusions: ["gluten"], tags: ["protein", "office"], image: "🌯", imageType: "emoji", imageSource: "local-catalog" },
  { id: "b5", title: "طبق حمص وخضار", mealType: "breakfast", dietTypes: ["any", "mediterranean", "vegetarian", "vegan"], calories: 410, protein: 15, carbs: 42, fat: 18, effortLevel: "low", budgetLevel: "low", ingredients: ["حمص", "خيار", "خبز عربي"], exclusions: ["gluten"], tags: ["budget", "family"], image: "🧆", imageType: "emoji", imageSource: "local-catalog" },
  { id: "l1", title: "سلطة دجاج مشوي", mealType: "lunch", dietTypes: ["any", "high_protein", "keto", "mediterranean"], calories: 510, protein: 38, carbs: 16, fat: 26, effortLevel: "medium", budgetLevel: "medium", ingredients: ["دجاج", "خس", "خيار", "زيت زيتون"], exclusions: [], tags: ["protein", "quick", "salad"], image: "🥗", imageType: "emoji", imageSource: "local-catalog" },
  { id: "l2", title: "وعاء أرز وسلمون", mealType: "lunch", dietTypes: ["any", "high_protein", "mediterranean"], calories: 630, protein: 34, carbs: 55, fat: 24, effortLevel: "medium", budgetLevel: "high", ingredients: ["أرز", "سلمون", "خضار"], exclusions: ["fish"], tags: ["protein", "omega"], image: "🍱", imageType: "emoji", imageSource: "local-catalog" },
  { id: "l3", title: "باستا متوسطية بالخضار", mealType: "lunch", dietTypes: ["any", "mediterranean", "vegetarian"], calories: 560, protein: 18, carbs: 72, fat: 20, effortLevel: "medium", budgetLevel: "low", ingredients: ["باستا", "طماطم", "زيتون", "فلفل"], exclusions: ["gluten"], tags: ["budget", "family"], image: "🍝", imageType: "emoji", imageSource: "local-catalog" },
  { id: "l4", title: "كاري حمص وجوز هند", mealType: "lunch", dietTypes: ["any", "vegetarian", "vegan"], calories: 540, protein: 17, carbs: 58, fat: 22, effortLevel: "medium", budgetLevel: "low", ingredients: ["حمص", "حليب جوز الهند", "أرز"], exclusions: [], tags: ["vegan", "budget"], image: "🍛", imageType: "emoji", imageSource: "local-catalog" },
  { id: "l5", title: "لحم بقري مع بطاطا", mealType: "lunch", dietTypes: ["any", "high_protein", "keto"], calories: 640, protein: 36, carbs: 30, fat: 34, effortLevel: "high", budgetLevel: "high", ingredients: ["لحم", "بطاطا", "فاصوليا"], exclusions: ["beef"], tags: ["protein", "hearty"], image: "🥩", imageType: "emoji", imageSource: "local-catalog" },
  { id: "l6", title: "شاورما دجاج منزلية", mealType: "lunch", dietTypes: ["any", "high_protein", "mediterranean"], calories: 590, protein: 33, carbs: 44, fat: 22, effortLevel: "medium", budgetLevel: "medium", ingredients: ["دجاج", "خبز", "لبن", "خس"], exclusions: ["gluten"], tags: ["family", "popular"], image: "🌯", imageType: "emoji", imageSource: "local-catalog" },
  { id: "l7", title: "كوسا محشية خفيفة", mealType: "lunch", dietTypes: ["any", "mediterranean"], calories: 530, protein: 28, carbs: 34, fat: 24, effortLevel: "high", budgetLevel: "medium", ingredients: ["كوسا", "رز", "لحم"], exclusions: ["beef"], tags: ["home", "traditional"], image: "🥒", imageType: "emoji", imageSource: "local-catalog" },
  { id: "d1", title: "شوربة عدس وخبز", mealType: "dinner", dietTypes: ["any", "mediterranean", "vegetarian", "vegan"], calories: 420, protein: 16, carbs: 50, fat: 12, effortLevel: "low", budgetLevel: "low", ingredients: ["عدس", "خبز", "جزر"], exclusions: ["gluten"], tags: ["budget", "comfort"], image: "🍲", imageType: "emoji", imageSource: "local-catalog" },
  { id: "d2", title: "سمك مشوي وخضار", mealType: "dinner", dietTypes: ["any", "high_protein", "keto", "mediterranean"], calories: 480, protein: 34, carbs: 16, fat: 24, effortLevel: "medium", budgetLevel: "high", ingredients: ["سمك", "خضار", "ليمون"], exclusions: ["fish"], tags: ["protein", "light"], image: "🐟", imageType: "emoji", imageSource: "local-catalog" },
  { id: "d3", title: "بيتزا خضار سريعة", mealType: "dinner", dietTypes: ["any", "vegetarian"], calories: 610, protein: 20, carbs: 68, fat: 26, effortLevel: "medium", budgetLevel: "medium", ingredients: ["عجينة", "جبن", "خضار"], exclusions: ["gluten"], tags: ["family", "comfort"], image: "🍕", imageType: "emoji", imageSource: "local-catalog" },
  { id: "d4", title: "سلطة تونة وذرة", mealType: "dinner", dietTypes: ["any", "high_protein", "mediterranean"], calories: 430, protein: 31, carbs: 20, fat: 18, effortLevel: "low", budgetLevel: "medium", ingredients: ["تونة", "ذرة", "خس"], exclusions: ["fish"], tags: ["quick", "protein"], image: "🥬", imageType: "emoji", imageSource: "local-catalog" },
  { id: "d5", title: "برغر ديك رومي مع بطاطا", mealType: "dinner", dietTypes: ["any", "high_protein"], calories: 580, protein: 35, carbs: 38, fat: 24, effortLevel: "medium", budgetLevel: "medium", ingredients: ["ديك رومي", "خبز", "بطاطا"], exclusions: ["gluten"], tags: ["protein", "family"], image: "🍔", imageType: "emoji", imageSource: "local-catalog" },
  { id: "d6", title: "وعاء كينوا وخضار", mealType: "dinner", dietTypes: ["any", "mediterranean", "vegetarian", "vegan"], calories: 470, protein: 14, carbs: 52, fat: 18, effortLevel: "low", budgetLevel: "medium", ingredients: ["كينوا", "خضار", "حمص"], exclusions: [], tags: ["vegan", "light"], image: "🥙", imageType: "emoji", imageSource: "local-catalog" },
  { id: "s1", title: "تفاح وزبدة الفول", mealType: "snack", dietTypes: ["any", "vegetarian", "vegan"], calories: 210, protein: 6, carbs: 22, fat: 11, effortLevel: "low", budgetLevel: "low", ingredients: ["تفاح", "زبدة فول سوداني"], exclusions: ["nuts"], tags: ["snack", "quick"], image: "🍎", imageType: "emoji", imageSource: "local-catalog" },
  { id: "s2", title: "مكسرات وتمور", mealType: "snack", dietTypes: ["any", "mediterranean", "vegetarian", "vegan", "keto"], calories: 180, protein: 5, carbs: 16, fat: 11, effortLevel: "low", budgetLevel: "medium", ingredients: ["مكسرات", "تمر"], exclusions: ["nuts"], tags: ["snack", "energy"], image: "🥜", imageType: "emoji", imageSource: "local-catalog" },
  { id: "s3", title: "مخفوق بروتين", mealType: "snack", dietTypes: ["any", "high_protein", "vegetarian"], calories: 220, protein: 24, carbs: 12, fat: 8, effortLevel: "low", budgetLevel: "medium", ingredients: ["حليب", "بروتين", "موز"], exclusions: ["dairy"], tags: ["protein", "snack"], image: "🥤", imageType: "emoji", imageSource: "local-catalog" },
];

const MEAL_CATALOG: MealCatalogItem[] = mealDataset.map((item) => ({
  id: item.id,
  title: item.title,
  mealType: item.mealType,
  dietTypes: [...item.dietTypes],
  calories: item.calories,
  protein: item.protein,
  carbs: item.carbs,
  fat: item.fat,
  effortLevel: item.effort,
  budgetLevel: item.budget,
  ingredients: [...item.ingredients],
  exclusions: [...item.exclusions],
  tags: [...item.tags],
  image: item.image,
  imageType: item.imageType === "local" ? "local" : item.imageType,
  imageSource: item.imageSource,
  isFavorite: item.isFavorite,
  isTemplate: item.isTemplate,
}));

export function createId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getTodayISO(date = new Date()) {
  return format(date, "yyyy-MM-dd");
}

export function cupsToLiters(cups: number) {
  return Number((cups * 0.25).toFixed(2));
}

export function formatLiters(cups: number) {
  return `${cupsToLiters(cups).toLocaleString("en-US")} لتر`;
}

export function getDefaultMealPlannerProfile(): MealPlannerProfile {
  return { goal: "balanced", activityLevel: "moderate", snackPreference: "flexible", waterTargetCups: 8, dietaryNotes: "", avoidIngredients: "" };
}

export function getWaterTargetCups(profile: MealPlannerProfile) {
  const minimum = 8 + (profile.activityLevel === "moderate" ? 1 : profile.activityLevel === "high" ? 2 : 0);
  return Math.max(profile.waterTargetCups, minimum);
}

export function getWaterTargetLiters(profile: MealPlannerProfile) {
  return cupsToLiters(getWaterTargetCups(profile));
}

export function getDefaultMealPlannerPreferences(): MealPlannerPreferences {
  return { dietType: "any", caloriesTarget: 1900, mealsPerDay: 3, exclusions: [], budgetFriendly: false, lowEffort: false, preferVariety: true, allowRepetition: true, sameBreakfastDaily: false };
}

export function getDefaultMealPlannerSettings(): MealPlannerSettings {
  return { weekStartsOn: WEEK_STARTS_ON };
}

export function createEmptyMealSlot(mealType: MealType, active = true): MealSlot {
  return {
    id: createId(),
    mealType,
    title: "",
    note: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    tags: [],
    ingredients: [],
    prepEffort: "low",
    budgetLevel: "low",
    status: "planned",
    source: "manual",
    image: mealType === "breakfast" ? "🍳" : mealType === "lunch" ? "🍽️" : mealType === "dinner" ? "🍲" : "🥤",
    imageType: "emoji",
    imageSource: "local-placeholder",
    active,
    updatedAt: new Date().toISOString(),
  };
}

function getActiveMealTypes(mealsPerDay: 2 | 3 | 4): MealType[] {
  if (mealsPerDay === 2) return ["lunch", "dinner"];
  if (mealsPerDay === 3) return ["breakfast", "lunch", "dinner"];
  return ["breakfast", "lunch", "dinner", "snack"];
}

export function createDefaultDayPlan(dateISO: string, preferences = getDefaultMealPlannerPreferences(), waterTargetCups = 8): MealDayPlan {
  const activeMealTypes = new Set(getActiveMealTypes(preferences.mealsPerDay));
  return {
    dateISO,
    meals: (["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((mealType) => createEmptyMealSlot(mealType, activeMealTypes.has(mealType))),
    waterActualCups: 0,
    waterTargetCups,
    notes: "",
    updatedAt: new Date().toISOString(),
  };
}

export function createDefaultMealPlannerState(): MealPlannerState {
  return {
    version: 5,
    settings: getDefaultMealPlannerSettings(),
    profile: getDefaultMealPlannerProfile(),
    preferences: getDefaultMealPlannerPreferences(),
    plansByDate: {},
    hasGeneratedPlan: false,
    recentMeals: [],
    favorites: [],
  };
}

function sanitizeStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 8) : [];
}

function normalizeDietType(value: unknown): DietType {
  return value === "any" || value === "balanced" || value === "high_protein" || value === "keto" || value === "mediterranean" || value === "vegetarian" || value === "vegan" || value === "low_carb" || value === "budget" ? value : "any";
}
function normalizeMealType(value: unknown): MealType { return value === "breakfast" || value === "lunch" || value === "dinner" || value === "snack" ? value : "lunch"; }
function normalizeMealStatus(value: unknown): MealStatus { return value === "planned" || value === "done" || value === "skipped" || value === "eating_out" ? value : "planned"; }
function normalizeMealSource(value: unknown): MealSource { return value === "generated" || value === "favorite" || value === "manual" || value === "copied" ? value : "manual"; }
function normalizePrepEffort(value: unknown): PrepEffort { return value === "low" || value === "medium" || value === "high" ? value : "low"; }
function normalizeBudgetLevel(value: unknown): BudgetLevel { return value === "low" || value === "medium" || value === "high" ? value : "low"; }
function normalizeGoal(value: unknown): MealGoal { return value === "balanced" || value === "weight_loss" || value === "muscle_gain" || value === "family_routine" ? value : "balanced"; }
function normalizeActivity(value: unknown): MealActivityLevel { return value === "low" || value === "moderate" || value === "high" ? value : "moderate"; }
function normalizeSnackPreference(value: unknown): MealSnackPreference { return value === "none" || value === "flexible" || value === "daily" ? value : "flexible"; }

function normalizeProfile(raw: unknown): MealPlannerProfile {
  const data = (raw && typeof raw === "object" ? raw : {}) as Partial<MealPlannerProfile>;
  return {
    goal: normalizeGoal(data.goal),
    activityLevel: normalizeActivity(data.activityLevel),
    snackPreference: normalizeSnackPreference(data.snackPreference),
    waterTargetCups: typeof data.waterTargetCups === "number" ? Math.max(1, Math.min(20, Math.round(data.waterTargetCups))) : 8,
    dietaryNotes: typeof data.dietaryNotes === "string" ? data.dietaryNotes : "",
    avoidIngredients: typeof data.avoidIngredients === "string" ? data.avoidIngredients : "",
  };
}

function normalizePreferences(raw: unknown): MealPlannerPreferences {
  const data = (raw && typeof raw === "object" ? raw : {}) as Partial<MealPlannerPreferences>;
  return {
    dietType: normalizeDietType(data.dietType),
    caloriesTarget: typeof data.caloriesTarget === "number" ? Math.max(1200, Math.min(4000, Math.round(data.caloriesTarget))) : 1900,
    mealsPerDay: data.mealsPerDay === 2 || data.mealsPerDay === 4 ? data.mealsPerDay : 3,
    exclusions: sanitizeStringArray(data.exclusions),
    budgetFriendly: Boolean(data.budgetFriendly),
    lowEffort: Boolean(data.lowEffort),
    preferVariety: data.preferVariety !== false,
    allowRepetition: data.allowRepetition !== false,
    sameBreakfastDaily: Boolean(data.sameBreakfastDaily),
  };
}

function normalizeMealSlot(raw: unknown, fallback: MealSlot): MealSlot {
  const data = (raw && typeof raw === "object" ? raw : {}) as Partial<MealSlot>;
  return {
    id: typeof data.id === "string" ? data.id : fallback.id,
    mealType: normalizeMealType(data.mealType ?? fallback.mealType),
    title: typeof data.title === "string" ? data.title : fallback.title,
    note: typeof data.note === "string" ? data.note : "",
    calories: typeof data.calories === "number" ? Math.max(0, Math.round(data.calories)) : fallback.calories,
    protein: typeof data.protein === "number" ? Math.max(0, Math.round(data.protein)) : fallback.protein,
    carbs: typeof data.carbs === "number" ? Math.max(0, Math.round(data.carbs)) : fallback.carbs,
    fat: typeof data.fat === "number" ? Math.max(0, Math.round(data.fat)) : fallback.fat,
    tags: sanitizeStringArray(data.tags),
    ingredients: sanitizeStringArray(data.ingredients),
    prepEffort: normalizePrepEffort(data.prepEffort),
    budgetLevel: normalizeBudgetLevel(data.budgetLevel),
    status: normalizeMealStatus(data.status),
    source: normalizeMealSource(data.source),
    image: typeof data.image === "string" ? data.image : fallback.image,
    imageType: data.imageType === "emoji" || data.imageType === "static" || data.imageType === "generated" || data.imageType === "upload" || data.imageType === "local" ? data.imageType : fallback.imageType,
    imageSource: typeof data.imageSource === "string" ? data.imageSource : fallback.imageSource,
    catalogItemId: typeof data.catalogItemId === "string" ? data.catalogItemId : undefined,
    active: typeof data.active === "boolean" ? data.active : fallback.active,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : fallback.updatedAt,
  };
}

function normalizeDayPlan(dateISO: string, raw: unknown, preferences: MealPlannerPreferences, waterTargetCups: number): MealDayPlan {
  const fallback = createDefaultDayPlan(dateISO, preferences, waterTargetCups);
  const data = (raw && typeof raw === "object" ? raw : {}) as Partial<MealDayPlan>;
  const mealsByType = new Map<MealType, MealSlot>();
  if (Array.isArray(data.meals)) {
    for (const meal of data.meals) {
      if (!meal || typeof meal !== "object") continue;
      const mealType = normalizeMealType((meal as Partial<MealSlot>).mealType);
      const base = fallback.meals.find((entry) => entry.mealType === mealType) ?? createEmptyMealSlot(mealType);
      mealsByType.set(mealType, normalizeMealSlot(meal, base));
    }
  }
  return {
    dateISO,
    meals: fallback.meals.map((slot) => mealsByType.get(slot.mealType) ?? slot),
    waterActualCups: typeof data.waterActualCups === "number" ? Math.max(0, Math.min(20, Math.round(data.waterActualCups))) : fallback.waterActualCups,
    waterTargetCups: typeof data.waterTargetCups === "number" ? Math.max(1, Math.min(20, Math.round(data.waterTargetCups))) : fallback.waterTargetCups,
    notes: typeof data.notes === "string" ? data.notes : "",
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : fallback.updatedAt,
  };
}

function normalizeFavorite(raw: unknown): MealFavorite | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<MealFavorite>;
  if (typeof data.title !== "string" || !data.title.trim()) return null;
  return {
    id: typeof data.id === "string" ? data.id : createId(),
    title: data.title,
    mealType: normalizeMealType(data.mealType),
    calories: typeof data.calories === "number" ? Math.max(0, Math.round(data.calories)) : 0,
    tags: sanitizeStringArray(data.tags),
    image: typeof data.image === "string" ? data.image : "🍽️",
    imageType: data.imageType === "emoji" || data.imageType === "static" || data.imageType === "generated" || data.imageType === "upload" || data.imageType === "local" ? data.imageType : "emoji",
    imageSource: typeof data.imageSource === "string" ? data.imageSource : "local-catalog",
    ingredients: sanitizeStringArray(data.ingredients),
  };
}

function normalizeState(raw: unknown): MealPlannerState {
  const parsed = (raw && typeof raw === "object" ? raw : {}) as Partial<MealPlannerState>;
  if (parsed.version !== 5) return createDefaultMealPlannerState();
  const profile = normalizeProfile(parsed.profile);
  const preferences = normalizePreferences(parsed.preferences);
  const waterTarget = getWaterTargetCups(profile);
  const plansByDate: Record<string, MealDayPlan> = {};
  if (parsed.plansByDate && typeof parsed.plansByDate === "object") {
    for (const [dateISO, plan] of Object.entries(parsed.plansByDate)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
        plansByDate[dateISO] = normalizeDayPlan(dateISO, plan, preferences, waterTarget);
      }
    }
  }
  return {
    version: 5,
    settings: { weekStartsOn: parsed.settings?.weekStartsOn === 1 || parsed.settings?.weekStartsOn === 6 ? parsed.settings.weekStartsOn : 0 },
    profile,
    preferences,
    plansByDate,
    hasGeneratedPlan: Boolean(parsed.hasGeneratedPlan),
    recentMeals: sanitizeStringArray(parsed.recentMeals).slice(0, 24),
    favorites: Array.isArray(parsed.favorites) ? parsed.favorites.map(normalizeFavorite).filter((item): item is MealFavorite => item !== null).slice(0, 30) : [],
  };
}

export function loadMealPlannerState(): MealPlannerState {
  if (typeof window === "undefined") return createDefaultMealPlannerState();
  const raw = window.localStorage.getItem(MEAL_PLANNER_STORAGE_KEY);
  if (!raw) return createDefaultMealPlannerState();
  try {
    return normalizeState(JSON.parse(raw));
  } catch {
    return createDefaultMealPlannerState();
  }
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

export function getCatalog() {
  return MEAL_CATALOG;
}

export function getDayPlan(state: MealPlannerState, dateISO: string) {
  return state.plansByDate[dateISO] ?? createDefaultDayPlan(dateISO, state.preferences, getWaterTargetCups(state.profile));
}

function activeMeals(plan: MealDayPlan) {
  return plan.meals.filter((meal) => meal.active);
}

export function countPlannedMeals(plan: MealDayPlan) {
  return activeMeals(plan).filter((meal) => meal.title.trim()).length;
}

export function countCompletedMeals(plan: MealDayPlan) {
  return activeMeals(plan).filter((meal) => meal.status === "done").length;
}

export function getMealCompletionPercent(plan: MealDayPlan) {
  const total = activeMeals(plan).length;
  return total === 0 ? 0 : Math.round((countPlannedMeals(plan) / total) * 100);
}

function createMealFromCatalog(item: MealCatalogItem, mealType: MealType, active: boolean, source: MealSource = "generated"): MealSlot {
  return {
    id: createId(),
    mealType,
    title: item.title,
    note: "",
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    tags: item.tags,
    ingredients: item.ingredients,
    prepEffort: item.effortLevel,
    budgetLevel: item.budgetLevel,
    status: "planned",
    source,
    image: item.image,
    imageType: item.imageType,
    imageSource: item.imageSource,
    catalogItemId: item.id,
    active,
    updatedAt: new Date().toISOString(),
  };
}

function matchesDiet(item: MealCatalogItem, dietType: DietType) {
  return dietType === "any" ? item.dietTypes.includes("any") || item.dietTypes.length > 0 : item.dietTypes.includes(dietType);
}

function normalizeExclusions(exclusions: string[]) {
  return exclusions.map((entry) => entry.trim().toLowerCase()).filter(Boolean);
}

function matchesExclusions(item: MealCatalogItem, exclusions: string[]) {
  if (!exclusions.length) return true;
  const normalizedIngredients = item.ingredients.map((entry) => entry.toLowerCase());
  const normalizedExcluded = item.exclusions.map((entry) => entry.toLowerCase());
  return !exclusions.some((entry) => normalizedIngredients.includes(entry) || normalizedExcluded.includes(entry));
}

function matchesBudget(item: MealCatalogItem, budgetFriendly: boolean) {
  return !budgetFriendly || item.budgetLevel !== "high";
}

function matchesEffort(item: MealCatalogItem, lowEffort: boolean) {
  return !lowEffort || item.effortLevel !== "high";
}

function targetCaloriesForMeal(preferences: MealPlannerPreferences, mealType: MealType) {
  if (preferences.mealsPerDay === 2) {
    return mealType === "lunch" ? preferences.caloriesTarget * 0.45 : mealType === "dinner" ? preferences.caloriesTarget * 0.55 : 0;
  }
  if (preferences.mealsPerDay === 3) {
    return mealType === "breakfast" ? preferences.caloriesTarget * 0.25 : mealType === "lunch" ? preferences.caloriesTarget * 0.4 : mealType === "dinner" ? preferences.caloriesTarget * 0.35 : 0;
  }
  return mealType === "breakfast" ? preferences.caloriesTarget * 0.22 : mealType === "lunch" ? preferences.caloriesTarget * 0.33 : mealType === "dinner" ? preferences.caloriesTarget * 0.3 : preferences.caloriesTarget * 0.15;
}

function sortCandidatePool(items: MealCatalogItem[], targetCalories: number, usedTitles: Set<string>, preferences: MealPlannerPreferences) {
  return [...items].sort((a, b) => {
    const aRepeatedPenalty = !preferences.allowRepetition && usedTitles.has(a.title) ? 2000 : 0;
    const bRepeatedPenalty = !preferences.allowRepetition && usedTitles.has(b.title) ? 2000 : 0;
    const aVarietyPenalty = preferences.preferVariety && usedTitles.has(a.title) ? 500 : 0;
    const bVarietyPenalty = preferences.preferVariety && usedTitles.has(b.title) ? 500 : 0;
    return Math.abs(a.calories - targetCalories) + aRepeatedPenalty + aVarietyPenalty - (Math.abs(b.calories - targetCalories) + bRepeatedPenalty + bVarietyPenalty);
  });
}

export function getFilteredCatalog(preferences: MealPlannerPreferences, profile: MealPlannerProfile, mealType?: MealType) {
  const exclusions = normalizeExclusions([...preferences.exclusions, ...profile.avoidIngredients.split(/[،,]/).map((item) => item.trim()).filter(Boolean)]);
  return MEAL_CATALOG.filter((item) => {
    if (mealType && item.mealType !== mealType) return false;
    return matchesDiet(item, preferences.dietType) && matchesExclusions(item, exclusions) && matchesBudget(item, preferences.budgetFriendly) && matchesEffort(item, preferences.lowEffort);
  });
}

function pickCatalogItem(state: MealPlannerState, mealType: MealType, usedTitles: Set<string>) {
  const pool = getFilteredCatalog(state.preferences, state.profile, mealType);
  const sorted = sortCandidatePool(pool, targetCaloriesForMeal(state.preferences, mealType), usedTitles, state.preferences);
  return sorted[0] ?? MEAL_CATALOG.find((item) => item.mealType === mealType) ?? null;
}

export function buildGeneratedWeekPlans(state: MealPlannerState, referenceISO = getTodayISO()) {
  const days = getWeekDates(referenceISO);
  const usedTitles = new Set<string>();
  const repeatedBreakfast = state.preferences.sameBreakfastDaily ? pickCatalogItem(state, "breakfast", usedTitles) : null;
  return Object.fromEntries(days.map((day, index) => {
    const emptyDay = createDefaultDayPlan(day.dateISO, state.preferences, getWaterTargetCups(state.profile));
    const meals = emptyDay.meals.map((slot) => {
      if (!slot.active) return slot;
      const item = slot.mealType === "breakfast" && repeatedBreakfast ? repeatedBreakfast : pickCatalogItem(state, slot.mealType, usedTitles);
      if (!item) return slot;
      if (!state.preferences.allowRepetition || state.preferences.preferVariety) usedTitles.add(item.title);
      return createMealFromCatalog(item, slot.mealType, true);
    });
    return [
      day.dateISO,
      {
        ...emptyDay,
        meals,
        waterTargetCups: getWaterTargetCups(state.profile),
        waterActualCups: Math.max(0, Math.round(getWaterTargetCups(state.profile) * 0.5)),
        notes: index === 0 ? "ابدأ بالأطباق الأسهل هذا الأسبوع للحفاظ على الزخم." : "",
        updatedAt: new Date().toISOString(),
      } satisfies MealDayPlan,
    ];
  })) as Record<string, MealDayPlan>;
}

export function buildReplacementMeal(state: MealPlannerState, mealType: MealType, currentTitle?: string, existingTitles: string[] = []) {
  const usedTitles = new Set(existingTitles.filter((title) => title !== currentTitle));
  const candidate = pickCatalogItem(state, mealType, usedTitles);
  return candidate ? createMealFromCatalog(candidate, mealType, true) : createEmptyMealSlot(mealType, true);
}

export function getMealSuggestions(state: MealPlannerState, mealType: MealType) {
  const favorites = state.favorites.filter((favorite) => favorite.mealType === mealType).map((favorite) => ({ title: favorite.title, source: "favorite" as MealSource, tags: favorite.tags, image: favorite.image }));
  const catalog = getFilteredCatalog(state.preferences, state.profile, mealType).slice(0, 6).map((item) => ({ title: item.title, source: "generated" as MealSource, tags: item.tags, image: item.image }));
  return [...favorites, ...catalog].slice(0, 8);
}

export function getMealPlannerSummary(state: MealPlannerState, referenceISO = getTodayISO()): MealPlannerSummary {
  const plans = getWeekDates(referenceISO).map((day) => getDayPlan(state, day.dateISO));
  const totalMeals = plans.reduce((sum, plan) => sum + activeMeals(plan).length, 0);
  const plannedMeals = plans.reduce((sum, plan) => sum + countPlannedMeals(plan), 0);
  const completedMeals = plans.reduce((sum, plan) => sum + countCompletedMeals(plan), 0);
  const weeklyWaterTotal = plans.reduce((sum, plan) => sum + plan.waterActualCups, 0);
  const weeklyWaterTarget = plans.reduce((sum, plan) => sum + plan.waterTargetCups, 0);
  const daysWithWaterTarget = plans.filter((plan) => plan.waterActualCups >= plan.waterTargetCups).length;
  const daysFullyPlanned = plans.filter((plan) => activeMeals(plan).length > 0 && countPlannedMeals(plan) === activeMeals(plan).length).length;
  const daysPartiallyPlanned = plans.filter((plan) => countPlannedMeals(plan) > 0 && countPlannedMeals(plan) < activeMeals(plan).length).length;
  const totalWeeklyCalories = plans.reduce((sum, plan) => sum + activeMeals(plan).reduce((mealSum, meal) => mealSum + meal.calories, 0), 0);
  const titles = plans.flatMap((plan) => activeMeals(plan).map((meal) => meal.title.trim()).filter(Boolean));
  const repeats = new Map<string, number>();
  titles.forEach((title) => repeats.set(title, (repeats.get(title) ?? 0) + 1));
  return {
    totalMeals,
    plannedMeals,
    completedMeals,
    emptyMeals: Math.max(0, totalMeals - plannedMeals),
    weeklyWaterTotal,
    weeklyWaterTarget,
    daysWithWaterTarget,
    completionPercent: totalMeals === 0 ? 0 : Math.round((plannedMeals / totalMeals) * 100),
    averageCaloriesPerDay: Math.round(totalWeeklyCalories / 7),
    totalWeeklyCalories,
    repeatedMealsCount: Array.from(repeats.values()).reduce((sum, count) => sum + Math.max(0, count - 1), 0),
    daysFullyPlanned,
    daysPartiallyPlanned,
    completedDays: daysFullyPlanned,
    groceryLoad: getWeeklyShoppingItems(state, referenceISO).length,
    leftoverOpportunities: Array.from(repeats.values()).filter((count) => count > 1).length,
  };
}

export function getWeeklyShoppingItems(state: MealPlannerState, referenceISO = getTodayISO()): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>();
  for (const day of getWeekDates(referenceISO)) {
    const plan = getDayPlan(state, day.dateISO);
    for (const meal of activeMeals(plan).filter((entry) => entry.title.trim())) {
      for (const ingredient of meal.ingredients) {
        const key = ingredient.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
          if (!existing.linkedDays.includes(day.weekdayLabel)) existing.linkedDays.push(day.weekdayLabel);
        } else {
          map.set(key, { id: createId(), label: ingredient, count: 1, linkedDays: [day.weekdayLabel] });
        }
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ar"));
}

export function getWeeklyRecommendations(state: MealPlannerState, referenceISO = getTodayISO()): WeeklyRecommendation[] {
  const summary = getMealPlannerSummary(state, referenceISO);
  const days = getWeekDates(referenceISO).map((day) => ({ day, plan: getDayPlan(state, day.dateISO) }));
  const recs: WeeklyRecommendation[] = [];
  const strongDay = days.find((entry) => countPlannedMeals(entry.plan) >= Math.max(2, activeMeals(entry.plan).length - 1));
  const emptyDinnerDays = days.filter((entry) => !(entry.plan.meals.find((meal) => meal.mealType === "dinner" && meal.active)?.title.trim())).length;
  if (strongDay) recs.push({ id: "reuse-strong", title: "إعادة استخدام يوم قوي", body: `${strongDay.day.weekdayLong} مرتب جيدًا ويمكن نسخه ليوم أضعف لتسريع الأسبوع.`, tone: "success" });
  if (emptyDinnerDays > 0) recs.push({ id: "empty-dinners", title: "عشاءات ناقصة", body: `ما زالت ${emptyDinnerDays} خانات عشاء غير مكتملة هذا الأسبوع.`, tone: "warning" });
  if (summary.repeatedMealsCount >= 4) recs.push({ id: "repeat-high", title: "تكرار أعلى من اللازم", body: "هناك تكرار ملحوظ في الوجبات. بدّل وجبة أو وجبتين للحفاظ على التنوع.", tone: "info" });
  if (summary.weeklyWaterTotal < Math.round(summary.weeklyWaterTarget * 0.7)) recs.push({ id: "water-low", title: "الماء أقل من المستهدف", body: "إضافة تذكير بسيط بعد الفطور والغداء قد ترفع التقدم بسرعة.", tone: "warning" });
  if (summary.groceryLoad >= 10) recs.push({ id: "grocery-load", title: "ضغط مشتريات مرتفع", body: "جرّب توحيد الغداء بين يومين لتقليل عدد المكونات المطلوبة.", tone: "info" });
  if (!recs.length) recs.push({ id: "balanced", title: "الأسبوع متوازن", body: "الخطة واضحة ومتوازنة. ركّز الآن على التتبع اليومي وإنهاء اللمسات الصغيرة.", tone: "success" });
  return recs.slice(0, 4);
}

export function getWeekChartData(state: MealPlannerState, referenceISO = getTodayISO()): WeekChartPoint[] {
  return getWeekDates(referenceISO).map((day) => {
    const plan = getDayPlan(state, day.dateISO);
    return {
      day: day.weekdayLabel,
      calories: activeMeals(plan).reduce((sum, meal) => sum + meal.calories, 0),
      water: plan.waterActualCups,
      completion: getMealCompletionPercent(plan),
    };
  });
}

import { format } from "date-fns";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type MealSource = "recipe" | "custom" | "leftover" | "eating_out" | "skipped";

export interface Ingredient {
  id: string;
  displayName: string;
  normalizedName: string;
  quantity: number;
  unit?: string;
  category:
    | "خضار"
    | "فواكه"
    | "لحوم ودجاج"
    | "ألبان"
    | "حبوب ومعلبات"
    | "بهارات"
    | "مخبوزات"
    | "مجمدات"
    | "أخرى";
  isStaple?: boolean;
}

export interface MealRecipe {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  prepMinutes?: number;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  isFavorite?: boolean;
}

export interface PlannedMeal {
  id: string;
  dateISO: string;
  mealType: MealType;
  source: MealSource;
  recipeId?: string;
  customTitle?: string;
  notes?: string;
  leftoversPortions?: number;
  usesLeftoversFromMealId?: string;
  linkedTaskIds?: string[];
}

export interface PantryItem {
  id: string;
  name: string;
  defaultCategory: Ingredient["category"];
  isEnabled: boolean;
}

export interface ShoppingListItem {
  id: string;
  ingredientId?: string;
  displayName: string;
  normalizedName: string;
  quantity: number;
  unit?: string;
  category: Ingredient["category"];
  checked: boolean;
  fromMealIds: string[];
  isManual?: boolean;
}

export interface MealPlannerSettings {
  householdSize: number;
  defaultServings: number;
  excludeStaplesByDefault: boolean;
  dietaryTags: string[];
  dislikedIngredients: string[];
  preferredWeekStart: "saturday" | "sunday";
  enabledMealTypes: MealType[];
}

export interface WeeklyMealPlan {
  weekStartISO: string;
  meals: PlannedMeal[];
}

export interface RecentMeal {
  id: string;
  title: string;
  mealType: MealType;
  source: MealSource;
  recipeId?: string;
  lastUsedISO: string;
}

export interface WeekSummary {
  totalSlots: number;
  plannedMeals: number;
  emptySlots: number;
  shoppingItemsCount: number;
  favoriteRecipesUsed: number;
}

export interface MealPlannerState {
  settings: MealPlannerSettings;
  weekPlan: WeeklyMealPlan;
  recipes: MealRecipe[];
  favorites: string[];
  recentMeals: RecentMeal[];
  pantry: PantryItem[];
  shoppingList: ShoppingListItem[];
}

export const MEAL_PLANNER_STORAGE_KEY = "planner_hub_meal_planner_v1";

export function createId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getWeekStartISO(preferredWeekStart: MealPlannerSettings["preferredWeekStart"], date = new Date()) {
  const day = date.getDay(); // 0 = Sunday
  const offset = preferredWeekStart === "saturday"
    ? (day === 6 ? 0 : (day + 1) % 7 + 1) // simple heuristic for now
    : day;
  const start = new Date(date);
  start.setDate(date.getDate() - offset);
  return format(start, "yyyy-MM-dd");
}

export function getDefaultSettings(): MealPlannerSettings {
  return {
    householdSize: 2,
    defaultServings: 2,
    excludeStaplesByDefault: true,
    dietaryTags: [],
    dislikedIngredients: [],
    preferredWeekStart: "saturday",
    enabledMealTypes: ["breakfast", "lunch", "dinner", "snack"],
  };
}

export function getDefaultPantry(): PantryItem[] {
  return [
    { id: createId(), name: "زيت", defaultCategory: "بهارات", isEnabled: true },
    { id: createId(), name: "ملح", defaultCategory: "بهارات", isEnabled: true },
    { id: createId(), name: "سكر", defaultCategory: "حبوب ومعلبات", isEnabled: true },
    { id: createId(), name: "رز", defaultCategory: "حبوب ومعلبات", isEnabled: true },
    { id: createId(), name: "معكرونة", defaultCategory: "حبوب ومعلبات", isEnabled: true },
    { id: createId(), name: "بيض", defaultCategory: "ألبان", isEnabled: true },
    { id: createId(), name: "خبز", defaultCategory: "مخبوزات", isEnabled: true },
    { id: createId(), name: "حليب", defaultCategory: "ألبان", isEnabled: true },
  ];
}

export function normalizeIngredientName(name: string): string {
  let n = name.trim();
  // توحيد المسافات
  n = n.replace(/\s+/g, " ");
  // توحيد بعض الحروف العربية الشائعة
  n = n.replace(/[إأآا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
  // إزالة التشكيل البسيط إن وُجد
  n = n.replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED]/g, "");
  return n.toLowerCase();
}

export const ARABIC_DAYS: { key: string; label: string }[] = [
  { key: "sat", label: "السبت" },
  { key: "sun", label: "الأحد" },
  { key: "mon", label: "الإثنين" },
  { key: "tue", label: "الثلاثاء" },
  { key: "wed", label: "الأربعاء" },
  { key: "thu", label: "الخميس" },
  { key: "fri", label: "الجمعة" },
];

export function createEmptyWeek(weekStartISO: string): WeeklyMealPlan {
  return {
    weekStartISO,
    meals: [],
  };
}

export function getSeedRecipes(): MealRecipe[] {
  return [
    {
      id: "seed_shakshuka",
      title: "شكشوكة خفيفة مع خبز بلدي",
      description: "بيض مع صلصة طماطم وفلفل خفيفة لوجبة فطور أو عشاء سريعة.",
      imageUrl: "",
      category: "فطور",
      tags: ["سريع", "اقتصادي", "مناسب للعائلة", "فطور"],
      prepMinutes: 20,
      servings: 2,
      ingredients: [
        {
          id: "ing_tomato",
          displayName: "طماطم مفرومة",
          normalizedName: normalizeIngredientName("طماطم"),
          quantity: 3,
          unit: "حبة",
          category: "خضار",
        },
        {
          id: "ing_egg",
          displayName: "بيض",
          normalizedName: normalizeIngredientName("بيض"),
          quantity: 4,
          unit: "حبة",
          category: "ألبان",
        },
        {
          id: "ing_bread",
          displayName: "خبز بلدي",
          normalizedName: normalizeIngredientName("خبز"),
          quantity: 2,
          unit: "رغيف",
          category: "مخبوزات",
        },
      ],
      steps: [
        "سخّن القليل من الزيت في مقلاة.",
        "أضف الطماطم والفلفل والبهارات واتركها حتى تطرى.",
        "اكسر البيض فوق الصلصة واتركه حتى ينضج حسب الرغبة.",
        "قدّم مع خبز بلدي دافئ.",
      ],
      isFavorite: false,
    },
    {
      id: "seed_chicken_tray",
      title: "صينية دجاج مع خضار في الفرن",
      description: "وجبة غداء عائلية صحية يمكن استخدام بقاياها لليوم التالي.",
      imageUrl: "",
      category: "غداء",
      tags: ["صحي", "مناسب للعائلة", "دجاج", "تحضير مسبق"],
      prepMinutes: 30,
      servings: 4,
      ingredients: [
        {
          id: "ing_chicken",
          displayName: "قطع دجاج",
          normalizedName: normalizeIngredientName("دجاج"),
          quantity: 1,
          unit: "كغ",
          category: "لحوم ودجاج",
        },
        {
          id: "ing_potato",
          displayName: "بطاطا",
          normalizedName: normalizeIngredientName("بطاطا"),
          quantity: 4,
          unit: "حبة",
          category: "خضار",
        },
      ],
      steps: [
        "سخّن الفرن على حرارة متوسطة.",
        "رتّب الدجاج والخضار في صينية مع الزيت والبهارات.",
        "اخبز حتى ينضج الدجاج وتتحمّر الخضار.",
      ],
      isFavorite: false,
    },
  ];
}

export function generateShoppingList(params: {
  plan: WeeklyMealPlan;
  recipes: MealRecipe[];
  pantry: PantryItem[];
  existing: ShoppingListItem[];
  options?: { excludePantryStaples?: boolean };
}): ShoppingListItem[] {
  const { plan, recipes, pantry, existing, options } = params;
  const excludeStaples = options?.excludePantryStaples ?? true;

  const manualItems = existing.filter((item) => item.isManual);
  const autoItemsFromMeals = existing.filter((item) => !item.isManual);

  const pantryNormalized = new Set(
    pantry
      .filter((p) => p.isEnabled)
      .map((p) => normalizeIngredientName(p.name)),
  );

  const aggregated = new Map<
    string,
    {
      ingredientId?: string;
      displayName: string;
      normalizedName: string;
      quantity: number;
      unit?: string;
      category: Ingredient["category"];
      fromMealIds: Set<string>;
    }
  >();

  const recipeById = new Map(recipes.map((r) => [r.id, r]));

  for (const meal of plan.meals) {
    if (meal.source !== "recipe" || !meal.recipeId) continue;
    const recipe = recipeById.get(meal.recipeId);
    if (!recipe) continue;

    for (const ing of recipe.ingredients) {
      const key = ing.normalizedName || normalizeIngredientName(ing.displayName);
      if (excludeStaples && pantryNormalized.has(key)) {
        continue;
      }
      const existingAgg = aggregated.get(key);
      if (existingAgg) {
        existingAgg.quantity += ing.quantity;
        existingAgg.fromMealIds.add(meal.id);
      } else {
        aggregated.set(key, {
          ingredientId: ing.id,
          displayName: ing.displayName,
          normalizedName: key,
          quantity: ing.quantity,
          unit: ing.unit,
          category: ing.category,
          fromMealIds: new Set([meal.id]),
        });
      }
    }
  }

  const autoItems: ShoppingListItem[] = Array.from(aggregated.values()).map(
    (item) => {
      // حاول إعادة استخدام عنصر أوتو موجود بنفس normalizedName للحفاظ على checked
      const match = autoItemsFromMeals.find(
        (existingItem) => existingItem.normalizedName === item.normalizedName,
      );
      return {
        id: match?.id ?? createId(),
        ingredientId: item.ingredientId,
        displayName: item.displayName,
        normalizedName: item.normalizedName,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        checked: match?.checked ?? false,
        fromMealIds: Array.from(item.fromMealIds),
        isManual: false,
      };
    },
  );

  return [...autoItems, ...manualItems];
}

export function suggestLeftovers(
  plan: WeeklyMealPlan,
  targetDateISO: string,
  mealType: MealType,
): PlannedMeal[] {
  const targetDate = new Date(targetDateISO);
  const previousMeals = plan.meals
    .filter((meal) => new Date(meal.dateISO) < targetDate)
    .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());

  const suggestions: PlannedMeal[] = [];

  for (const meal of previousMeals) {
    if (meal.mealType !== mealType && mealType !== "lunch") continue;
    if (meal.source === "skipped" || meal.source === "eating_out") continue;

    const hasLeftoversFlag = (meal.leftoversPortions ?? 0) > 0;
    const isRecipeMultiServings =
      meal.source === "recipe" &&
      !!meal.recipeId;

    if (hasLeftoversFlag || isRecipeMultiServings) {
      suggestions.push(meal);
    }

    if (suggestions.length >= 3) break;
  }

  return suggestions;
}

export function getWeekSummary(
  plan: WeeklyMealPlan,
  enabledMealTypes: MealType[],
  shoppingItems: ShoppingListItem[],
  favorites: string[],
): WeekSummary {
  const totalDays = 7;
  const totalSlots = enabledMealTypes.length * totalDays;
  const plannedMeals = plan.meals.length;
  const emptySlots = Math.max(totalSlots - plannedMeals, 0);
  const shoppingItemsCount = shoppingItems.length;

  const favoriteRecipesUsed = plan.meals.filter(
    (meal) => meal.recipeId && favorites.includes(meal.recipeId),
  ).length;

  return {
    totalSlots,
    plannedMeals,
    emptySlots,
    shoppingItemsCount,
    favoriteRecipesUsed,
  };
}

export function getAutoFillSuggestions(_state: MealPlannerState) {
  return [];
}

export function getShoppingOptimizationSuggestions(_state: MealPlannerState) {
  return [];
}

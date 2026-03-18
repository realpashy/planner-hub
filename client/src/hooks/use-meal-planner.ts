import { useEffect, useMemo, useState } from "react";
import {
  MEAL_PLANNER_STORAGE_KEY,
  MealPlannerSettings,
  MealPlannerState,
  WeekSummary,
  RecentMeal,
  ShoppingListItem,
  PlannedMeal,
  createId,
  loadMealPlannerState,
  normalizeIngredientName,
  generateShoppingList,
} from "@/lib/meal-planner";

function computeSummary(state: MealPlannerState): WeekSummary {
  const enabledTypes = state.settings.enabledMealTypes;
  const totalDays = 7;
  const totalSlots = enabledTypes.length * totalDays;
  const plannedMeals = state.weekPlan.meals.length;
  const emptySlots = Math.max(totalSlots - plannedMeals, 0);
  const shoppingItemsCount = state.shoppingList.length;

  const favoriteRecipesUsed = state.weekPlan.meals.filter(
    (meal) => meal.recipeId && state.favorites.includes(meal.recipeId),
  ).length;

  return { totalSlots, plannedMeals, emptySlots, shoppingItemsCount, favoriteRecipesUsed };
}

export function useMealPlanner() {
  const [state, setState] = useState<MealPlannerState>(() => loadMealPlannerState());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MEAL_PLANNER_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const summary = useMemo(() => computeSummary(state), [state]);

  const updateSettings = (partial: Partial<MealPlannerSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...partial },
    }));
  };

  const addToRecents = (
    base: PlannedMeal,
    recipes: MealPlannerState["recipes"],
    prevRecents: RecentMeal[],
  ): RecentMeal[] => {
    const title =
      base.source === "recipe"
        ? recipes.find((r) => r.id === base.recipeId)?.title || "وجبة من وصفة"
        : base.customTitle || "وجبة سريعة";

    const recent: RecentMeal = {
      id: base.id,
      title,
      mealType: base.mealType,
      source: base.source,
      recipeId: base.recipeId,
      lastUsedISO: base.dateISO,
    };

    return [recent, ...prevRecents.filter((r) => r.id !== recent.id)].slice(0, 20);
  };

  const upsertMeal = (meal: Omit<PlannedMeal, "id"> & { id?: string }) => {
    setState((prev) => {
      const id = meal.id || createId();
      const nextMeal: PlannedMeal = { ...meal, id };
      const exists = prev.weekPlan.meals.some((m) => m.id === id);
      const weekPlan: WeeklyMealPlan = {
        ...prev.weekPlan,
        meals: exists
          ? prev.weekPlan.meals.map((m) => (m.id === id ? nextMeal : m))
          : [...prev.weekPlan.meals, nextMeal],
      };

      const recentMeals = addToRecents(nextMeal, prev.recipes, prev.recentMeals);

      const shoppingList = generateShoppingList({
        plan: weekPlan,
        recipes: prev.recipes,
        pantry: prev.pantry,
        existing: prev.shoppingList,
        options: { excludePantryStaples: prev.settings.excludeStaplesByDefault },
      });

      return { ...prev, weekPlan, recentMeals, shoppingList };
    });
  };

  const clearMeal = (mealId: string) => {
    setState((prev) => {
      const weekPlan: WeeklyMealPlan = {
        ...prev.weekPlan,
        meals: prev.weekPlan.meals.filter((m) => m.id !== mealId),
      };

      const shoppingList = generateShoppingList({
        plan: weekPlan,
        recipes: prev.recipes,
        pantry: prev.pantry,
        existing: prev.shoppingList,
        options: { excludePantryStaples: prev.settings.excludeStaplesByDefault },
      });

      return { ...prev, weekPlan, shoppingList };
    });
  };

  const addShoppingItem = (name: string, category: ShoppingListItem["category"] = "أخرى") => {
    if (!name.trim()) return;
    setState((prev) => ({
      ...prev,
      shoppingList: [
        ...prev.shoppingList,
        {
          id: createId(),
          displayName: name.trim(),
          normalizedName: normalizeIngredientName(name),
          quantity: 1,
          category,
          checked: false,
          fromMealIds: [],
          isManual: true,
        },
      ],
    }));
  };

  const toggleShoppingItemChecked = (id: string) => {
    setState((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    }));
  };

  const removeShoppingItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.filter((item) => item.id !== id),
    }));
  };

  const updatePantryItem = (id: string, partial: Partial<PantryItem>) => {
    setState((prev) => ({
      ...prev,
      pantry: prev.pantry.map((item) =>
        item.id === id ? { ...item, ...partial } : item,
      ),
    }));
  };

  const regenerateShoppingList = () => {
    setState((prev) => ({
      ...prev,
      shoppingList: generateShoppingList({
        plan: prev.weekPlan,
        recipes: prev.recipes,
        pantry: prev.pantry,
        existing: prev.shoppingList,
        options: { excludePantryStaples: prev.settings.excludeStaplesByDefault },
      }),
    }));
  };

  const quickAddMeal = (
    dateISO: string,
    mealType: MealType,
    title: string,
  ) => {
    if (!title.trim()) return;
    upsertMeal({
      dateISO,
      mealType,
      source: "custom",
      customTitle: title.trim(),
    });
  };

  const addRecipeMeal = (
    dateISO: string,
    mealType: MealType,
    recipeId: string,
  ) => {
    upsertMeal({
      dateISO,
      mealType,
      source: "recipe",
      recipeId,
    });
  };

  const markMealAsLeftover = (
    dateISO: string,
    mealType: MealType,
    sourceMealId?: string,
  ) => {
    upsertMeal({
      dateISO,
      mealType,
      source: "leftover",
      usesLeftoversFromMealId: sourceMealId,
    });
  };

  const markMealAsEatingOut = (dateISO: string, mealType: MealType) => {
    upsertMeal({
      dateISO,
      mealType,
      source: "eating_out",
    });
  };

  const markMealAsSkipped = (dateISO: string, mealType: MealType) => {
    upsertMeal({
      dateISO,
      mealType,
      source: "skipped",
    });
  };

  const copyDay = (fromDateISO: string, toDateISO: string) => {
    if (fromDateISO === toDateISO) return;
    setState((prev) => {
      const sourceMeals = prev.weekPlan.meals.filter(
        (m) => m.dateISO === fromDateISO,
      );
      if (sourceMeals.length === 0) return prev;

      const remainingMeals = prev.weekPlan.meals.filter(
        (m) => m.dateISO !== toDateISO,
      );

      const clonedMeals: PlannedMeal[] = sourceMeals.map((meal) => ({
        ...meal,
        id: createId(),
        dateISO: toDateISO,
      }));

      const weekPlan: WeeklyMealPlan = {
        ...prev.weekPlan,
        meals: [...remainingMeals, ...clonedMeals],
      };

      const shoppingList = generateShoppingList({
        plan: weekPlan,
        recipes: prev.recipes,
        pantry: prev.pantry,
        existing: prev.shoppingList,
        options: { excludePantryStaples: prev.settings.excludeStaplesByDefault },
      });

      const recentMeals = clonedMeals.reduce(
        (acc, meal) => addToRecents(meal, prev.recipes, acc),
        prev.recentMeals,
      );

      return { ...prev, weekPlan, shoppingList, recentMeals };
    });
  };

  const toggleFavoriteRecipe = (recipeId: string) => {
    setState((prev) => {
      const favorites = prev.favorites.includes(recipeId)
        ? prev.favorites.filter((id) => id !== recipeId)
        : [...prev.favorites, recipeId];
      return { ...prev, favorites };
    });
  };

  return {
    state,
    summary,
    updateSettings,
    upsertMeal,
    clearMeal,
    addShoppingItem,
    toggleShoppingItemChecked,
    removeShoppingItem,
    updatePantryItem,
    regenerateShoppingList,
    quickAddMeal,
    addRecipeMeal,
    markMealAsLeftover,
    markMealAsEatingOut,
    markMealAsSkipped,
    copyDay,
    toggleFavoriteRecipe,
  };
}


import { useEffect, useMemo, useState } from "react";
import {
  createDefaultDayMeta,
  createId,
  getDefaultMealTitle,
  getGuidanceItems,
  getMealPlannerSummary,
  getWaterTargetCups,
  getWeekDates,
  loadMealPlannerState,
  saveMealPlannerState,
  type MealDayMeta,
  type MealPlannerProfile,
  type MealPlannerState,
  type MealStatus,
  type MealType,
  type PlannedMeal,
} from "@/lib/meal-planner";

function pushRecentTitle(recentMeals: string[], title: string) {
  const normalized = title.trim();
  if (!normalized) return recentMeals;
  return [normalized, ...recentMeals.filter((item) => item !== normalized)].slice(0, 12);
}

function sanitizeMeal(meal: PlannedMeal) {
  const title = meal.title.trim();
  const note = meal.note?.trim() || "";

  if (!title && !note && meal.status === "planned") {
    return null;
  }

  return {
    ...meal,
    title,
    note,
  };
}

function upsertMeal(
  meals: PlannedMeal[],
  dateISO: string,
  mealType: MealType,
  mutate: (current: PlannedMeal) => PlannedMeal,
) {
  const existing = meals.find((meal) => meal.dateISO === dateISO && meal.mealType === mealType);
  const base: PlannedMeal = existing ?? {
    id: createId(),
    dateISO,
    mealType,
    title: "",
    status: "planned",
    note: "",
  };

  const next = sanitizeMeal(mutate(base));
  const remaining = meals.filter((meal) => !(meal.dateISO === dateISO && meal.mealType === mealType));

  return next ? [...remaining, next] : remaining;
}

function updateDayMetaEntry(dayMeta: MealDayMeta[], dateISO: string, partial: Partial<MealDayMeta>) {
  const existing = dayMeta.find((day) => day.dateISO === dateISO) ?? createDefaultDayMeta(dateISO);
  const next: MealDayMeta = {
    ...existing,
    ...partial,
    dateISO,
    snackNote: (partial.snackNote ?? existing.snackNote).trim(),
    prepNote: (partial.prepNote ?? existing.prepNote).trim(),
    waterCups: Math.max(0, Math.min(20, Math.round(partial.waterCups ?? existing.waterCups))),
  };

  return [...dayMeta.filter((day) => day.dateISO !== dateISO), next].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}

export function useMealPlanner() {
  const [state, setState] = useState<MealPlannerState>(() => loadMealPlannerState());

  useEffect(() => {
    if (typeof window === "undefined") return;
    saveMealPlannerState(state);
  }, [state]);

  const weekDates = useMemo(() => getWeekDates(state.weekPlan.weekStartISO), [state.weekPlan.weekStartISO]);
  const summary = useMemo(() => getMealPlannerSummary(state), [state]);
  const recentMealTitles = useMemo(() => state.recentMeals, [state.recentMeals]);
  const waterTargetCups = useMemo(() => getWaterTargetCups(state.profile), [state.profile]);
  const guidanceItems = useMemo(() => getGuidanceItems(state.profile, summary), [state.profile, summary]);

  const setMealTitle = (dateISO: string, mealType: MealType, title: string) => {
    setState((prev) => {
      const trimmed = title.trimStart();
      return {
        ...prev,
        weekPlan: {
          ...prev.weekPlan,
          meals: upsertMeal(prev.weekPlan.meals, dateISO, mealType, (current) => ({
            ...current,
            title: trimmed,
            status: current.status === "planned" ? "planned" : current.status,
          })),
        },
        recentMeals: title.trim() ? pushRecentTitle(prev.recentMeals, title) : prev.recentMeals,
      };
    });
  };

  const setMealStatus = (dateISO: string, mealType: MealType, status: MealStatus) => {
    setState((prev) => ({
      ...prev,
      weekPlan: {
        ...prev.weekPlan,
        meals: upsertMeal(prev.weekPlan.meals, dateISO, mealType, (current) => ({
          ...current,
          status,
          title: current.title.trim() || getDefaultMealTitle(mealType, status),
        })),
      },
      recentMeals: pushRecentTitle(prev.recentMeals, getDefaultMealTitle(mealType, status)),
    }));
  };

  const setMealNote = (dateISO: string, mealType: MealType, note: string) => {
    setState((prev) => ({
      ...prev,
      weekPlan: {
        ...prev.weekPlan,
        meals: upsertMeal(prev.weekPlan.meals, dateISO, mealType, (current) => ({
          ...current,
          note,
        })),
      },
    }));
  };

  const toggleMealDone = (dateISO: string, mealType: MealType) => {
    setState((prev) => ({
      ...prev,
      weekPlan: {
        ...prev.weekPlan,
        meals: upsertMeal(prev.weekPlan.meals, dateISO, mealType, (current) => {
          const nextStatus: MealStatus = current.status === "done" ? "planned" : "done";
          return {
            ...current,
            status: nextStatus,
            title: current.title.trim() || getDefaultMealTitle(mealType, nextStatus),
          };
        }),
      },
    }));
  };

  const updateDayMeta = (dateISO: string, partial: Partial<MealDayMeta>) => {
    setState((prev) => ({
      ...prev,
      dayMeta: updateDayMetaEntry(prev.dayMeta, dateISO, partial),
    }));
  };

  const copyDay = (fromDateISO: string, toDateISO: string) => {
    if (fromDateISO === toDateISO) return;

    setState((prev) => {
      const sourceMeals = prev.weekPlan.meals.filter((meal) => meal.dateISO === fromDateISO);
      const sourceMeta = prev.dayMeta.find((day) => day.dateISO === fromDateISO) ?? createDefaultDayMeta(fromDateISO);
      const copiedTitles = sourceMeals.map((meal) => meal.title).filter(Boolean);

      return {
        ...prev,
        weekPlan: {
          ...prev.weekPlan,
          meals: [
            ...prev.weekPlan.meals.filter((meal) => meal.dateISO !== toDateISO),
            ...sourceMeals.map((meal) => ({
              ...meal,
              id: createId(),
              dateISO: toDateISO,
            })),
          ].sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.mealType.localeCompare(b.mealType)),
        },
        dayMeta: updateDayMetaEntry(prev.dayMeta, toDateISO, {
          snackNote: sourceMeta.snackNote,
          prepNote: sourceMeta.prepNote,
          waterCups: sourceMeta.waterCups,
        }),
        recentMeals: copiedTitles.reduce((acc, title) => pushRecentTitle(acc, title), prev.recentMeals),
      };
    });
  };

  const copyMealToDay = (fromDateISO: string, toDateISO: string, mealType: MealType) => {
    if (fromDateISO === toDateISO) return;

    setState((prev) => {
      const sourceMeal = prev.weekPlan.meals.find((meal) => meal.dateISO === fromDateISO && meal.mealType === mealType);
      if (!sourceMeal) return prev;

      return {
        ...prev,
        weekPlan: {
          ...prev.weekPlan,
          meals: [
            ...prev.weekPlan.meals.filter((meal) => !(meal.dateISO === toDateISO && meal.mealType === mealType)),
            {
              ...sourceMeal,
              id: createId(),
              dateISO: toDateISO,
            },
          ].sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.mealType.localeCompare(b.mealType)),
        },
        recentMeals: pushRecentTitle(prev.recentMeals, sourceMeal.title),
      };
    });
  };

  const clearMeal = (dateISO: string, mealType: MealType) => {
    setState((prev) => ({
      ...prev,
      weekPlan: {
        ...prev.weekPlan,
        meals: prev.weekPlan.meals.filter((meal) => !(meal.dateISO === dateISO && meal.mealType === mealType)),
      },
    }));
  };

  const clearDay = (dateISO: string) => {
    setState((prev) => ({
      ...prev,
      weekPlan: {
        ...prev.weekPlan,
        meals: prev.weekPlan.meals.filter((meal) => meal.dateISO !== dateISO),
      },
      dayMeta: updateDayMetaEntry(prev.dayMeta, dateISO, createDefaultDayMeta(dateISO)),
    }));
  };

  const updateProfile = (partial: Partial<MealPlannerProfile>) => {
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        ...partial,
        dietaryNotes: (partial.dietaryNotes ?? prev.profile.dietaryNotes).trimStart(),
        avoidIngredients: (partial.avoidIngredients ?? prev.profile.avoidIngredients).trimStart(),
        waterTargetCups: Math.max(1, Math.min(20, Math.round(partial.waterTargetCups ?? prev.profile.waterTargetCups))),
      },
    }));
  };

  return {
    state,
    summary,
    weekDates,
    recentMealTitles,
    waterTargetCups,
    guidanceItems,
    setMealTitle,
    setMealStatus,
    setMealNote,
    toggleMealDone,
    updateDayMeta,
    copyDay,
    copyMealToDay,
    clearMeal,
    clearDay,
    updateProfile,
  };
}

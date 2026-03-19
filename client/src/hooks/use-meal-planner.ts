import { useEffect, useMemo, useState } from "react";
import {
  createDefaultDayPlan,
  getDashboardSeries,
  getDayPlan,
  getDefaultMealTitle,
  getGuidanceItems,
  getMealPlannerSummary,
  getPlanningDates,
  getRollingDates,
  getSetupProgress,
  getTodayISO,
  getWaterTargetCups,
  getWaterTargetLiters,
  loadMealPlannerState,
  MEAL_PRESETS,
  saveMealPlannerState,
  type MealDayPlan,
  type MealPlannerProfile,
  type MealPlannerState,
  type MealStatus,
  type MealType,
} from "@/lib/meal-planner";

function pushRecentTitle(recentMeals: string[], title: string) {
  const normalized = title.trim();
  if (!normalized) return recentMeals;
  return [normalized, ...recentMeals.filter((item) => item !== normalized)].slice(0, 18);
}

export function useMealPlanner() {
  const [state, setState] = useState<MealPlannerState>(() => loadMealPlannerState());
  const todayISO = useMemo(() => getTodayISO(), []);
  const [selectedSetupDay, setSelectedSetupDayState] = useState(todayISO);

  useEffect(() => {
    saveMealPlannerState(state);
  }, [state]);

  const rollingDays = useMemo(
    () => getRollingDates(state.settings.rollingWindowDays, todayISO),
    [state.settings.rollingWindowDays, todayISO],
  );
  const planningDays = useMemo(
    () => getPlanningDates(state.settings.planningHorizonDays, todayISO),
    [state.settings.planningHorizonDays, todayISO],
  );
  const viewSummary = useMemo(() => getMealPlannerSummary(state, todayISO), [state, todayISO]);
  const dashboardSeries = useMemo(() => getDashboardSeries(state, todayISO), [state, todayISO]);
  const setupProgress = useMemo(() => getSetupProgress(state, todayISO), [state, todayISO]);
  const waterTargetCups = useMemo(() => getWaterTargetCups(state.profile), [state.profile]);
  const waterTargetLiters = useMemo(() => getWaterTargetLiters(state.profile), [state.profile]);
  const guidanceItems = useMemo(() => getGuidanceItems(state.profile, viewSummary), [state.profile, viewSummary]);

  const getPlan = (dateISO: string) => getDayPlan(state, dateISO);

  const patchDayPlan = (dateISO: string, mutate: (current: MealDayPlan) => MealDayPlan) => {
    setState((prev) => {
      const current = getDayPlan(prev, dateISO);
      const next = {
        ...mutate(current),
        dateISO,
        updatedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        plansByDate: {
          ...prev.plansByDate,
          [dateISO]: next,
        },
      };
    });
  };

  const setSelectedSetupDay = (dateISO: string) => {
    setSelectedSetupDayState(dateISO);
  };

  const updateMeal = (
    dateISO: string,
    mealType: MealType,
    patch: Partial<MealDayPlan["meals"][number]>,
  ) => {
    patchDayPlan(dateISO, (current) => ({
      ...current,
      meals: current.meals.map((meal) =>
        meal.mealType === mealType
          ? {
              ...meal,
              ...patch,
              title: (patch.title ?? meal.title).trimStart(),
              note: (patch.note ?? meal.note).trimStart(),
              updatedAt: new Date().toISOString(),
            }
          : meal,
      ),
    }));
  };

  const setMealTitle = (dateISO: string, mealType: MealType, title: string) => {
    updateMeal(dateISO, mealType, { title });
    if (title.trim()) {
      setState((prev) => ({ ...prev, recentMeals: pushRecentTitle(prev.recentMeals, title) }));
    }
  };

  const setMealStatus = (dateISO: string, mealType: MealType, status: MealStatus) => {
    patchDayPlan(dateISO, (current) => ({
      ...current,
      meals: current.meals.map((meal) =>
        meal.mealType === mealType
          ? {
              ...meal,
              status,
              title: meal.title.trim() || getDefaultMealTitle(mealType, status),
              updatedAt: new Date().toISOString(),
            }
          : meal,
      ),
    }));
  };

  const setMealNote = (dateISO: string, mealType: MealType, note: string) => {
    updateMeal(dateISO, mealType, { note });
  };

  const updateDayFields = (dateISO: string, patch: Partial<MealDayPlan>) => {
    patchDayPlan(dateISO, (current) => ({
      ...current,
      ...patch,
      snackNote: (patch.snackNote ?? current.snackNote).trimStart(),
      prepNote: (patch.prepNote ?? current.prepNote).trimStart(),
      waterCups: typeof patch.waterCups === "number"
        ? Math.max(0, Math.min(20, Math.round(patch.waterCups)))
        : current.waterCups,
    }));
  };

  const saveDayPlan = (dateISO: string) => {
    patchDayPlan(dateISO, (current) => ({
      ...current,
      isComplete: current.isComplete,
    }));
  };

  const markDayComplete = (dateISO: string, isComplete = true) => {
    patchDayPlan(dateISO, (current) => ({
      ...current,
      isComplete,
    }));
  };

  const copyDay = (fromDateISO: string, toDateISO: string) => {
    if (fromDateISO === toDateISO) return;
    const source = getPlan(fromDateISO);
    setState((prev) => ({
      ...prev,
      plansByDate: {
        ...prev.plansByDate,
        [toDateISO]: {
          ...source,
          dateISO: toDateISO,
          updatedAt: new Date().toISOString(),
          isComplete: false,
        },
      },
      recentMeals: source.meals.reduce((acc, meal) => pushRecentTitle(acc, meal.title), prev.recentMeals),
    }));
  };

  const copyMeals = (fromDateISO: string, toDateISO: string, mealTypes: MealType[]) => {
    if (fromDateISO === toDateISO || mealTypes.length === 0) return;
    const source = getPlan(fromDateISO);
    patchDayPlan(toDateISO, (current) => ({
      ...current,
      meals: current.meals.map((meal) =>
        mealTypes.includes(meal.mealType)
          ? {
              ...source.meals.find((sourceMeal) => sourceMeal.mealType === meal.mealType)!,
              updatedAt: new Date().toISOString(),
            }
          : meal,
      ),
      isComplete: false,
    }));

    setState((prev) => ({
      ...prev,
      recentMeals: source.meals
        .filter((meal) => mealTypes.includes(meal.mealType))
        .reduce((acc, meal) => pushRecentTitle(acc, meal.title), prev.recentMeals),
    }));
  };

  const applyPreset = (dateISO: string, presetId: string) => {
    const preset = MEAL_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    patchDayPlan(dateISO, (current) => ({
      ...current,
      meals: current.meals.map((meal) => {
        const presetMeal = preset.meals[meal.mealType];
        if (!presetMeal) return meal;
        return {
          ...meal,
          title: presetMeal.title,
          note: presetMeal.note ?? "",
          status: presetMeal.status ?? "planned",
          updatedAt: new Date().toISOString(),
        };
      }),
      snackNote: preset.snackNote ?? current.snackNote,
      prepNote: preset.prepNote ?? current.prepNote,
      isComplete: false,
    }));

    setState((prev) => ({
      ...prev,
      recentMeals: Object.values(preset.meals).reduce(
        (acc, meal) => (meal?.title ? pushRecentTitle(acc, meal.title) : acc),
        prev.recentMeals,
      ),
    }));
  };

  const goToNextDay = (fromDateISO = selectedSetupDay) => {
    const currentIndex = planningDays.findIndex((day) => day.dateISO === fromDateISO);
    const nextDate = currentIndex >= 0 ? planningDays[currentIndex + 1] : undefined;
    if (nextDate) {
      setSelectedSetupDayState(nextDate.dateISO);
      return nextDate.dateISO;
    }
    return null;
  };

  const updateProfile = (patch: Partial<MealPlannerProfile>) => {
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        ...patch,
        waterTargetCups: typeof patch.waterTargetCups === "number"
          ? Math.max(1, Math.min(20, Math.round(patch.waterTargetCups)))
          : prev.profile.waterTargetCups,
        dietaryNotes: (patch.dietaryNotes ?? prev.profile.dietaryNotes).trimStart(),
        avoidIngredients: (patch.avoidIngredients ?? prev.profile.avoidIngredients).trimStart(),
      },
    }));
  };

  useEffect(() => {
    if (planningDays.some((day) => day.dateISO === selectedSetupDay)) return;
    setSelectedSetupDayState(todayISO);
  }, [planningDays, selectedSetupDay, todayISO]);

  return {
    state,
    todayISO,
    rollingDays,
    planningDays,
    selectedSetupDay,
    recentMeals: state.recentMeals,
    waterTargetCups,
    waterTargetLiters,
    guidanceItems,
    viewSummary,
    dashboardSeries,
    setupProgress,
    getPlan,
    setSelectedSetupDay,
    setMealTitle,
    setMealStatus,
    setMealNote,
    updateDayFields,
    saveDayPlan,
    markDayComplete,
    copyDay,
    copyMeals,
    applyPreset,
    goToNextDay,
    updateProfile,
  };
}

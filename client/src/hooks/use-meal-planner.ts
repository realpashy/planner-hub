import { useEffect, useMemo, useState } from "react";
import {
  buildGeneratedWeekPlans,
  buildReplacementMeal,
  createId,
  createDefaultMealPlannerState,
  getDayPlan,
  getMealPlannerSummary,
  getMealSuggestions,
  getTodayISO,
  getWaterTargetCups,
  getWaterTargetLiters,
  getWeekChartData,
  getActiveWeekDates,
  getWeeklyRecommendations,
  getWeeklyShoppingItems,
  loadMealPlannerState,
  pruneMealPlannerState,
  saveMealPlannerState,
  type MealDayPlan,
  type MealFavorite,
  type MealPlannerPreferences,
  type MealPlannerProfile,
  type MealPlannerState,
  type MealStatus,
  type MealType,
} from "@/lib/meal-planner";
import {
  aiMealToMealSlot,
  applyAiDayToPlan,
  applyAiWeekToState,
  deleteMealPlanRemote,
  editMealWithAi,
  fetchMealPlannerQuota,
  generateWeekWithAi,
  regenerateDayWithAi,
  type MealPlannerQuotaResponse,
} from "@/lib/ai/meal-planner-ai";

function pushRecentTitle(recentMeals: string[], title: string) {
  const normalized = title.trim();
  if (!normalized) return recentMeals;
  return [normalized, ...recentMeals.filter((item) => item !== normalized)].slice(0, 24);
}

export function useMealPlanner() {
  const [state, setState] = useState<MealPlannerState>(() => pruneMealPlannerState(loadMealPlannerState()));
  const [quota, setQuota] = useState<MealPlannerQuotaResponse | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [limitReached, setLimitReached] = useState(false);
  const todayISO = useMemo(() => getTodayISO(), []);

  useEffect(() => {
    saveMealPlannerState(pruneMealPlannerState(state, todayISO));
  }, [state]);

  useEffect(() => {
    setState((prev) => pruneMealPlannerState(prev, todayISO));
  }, [todayISO]);

  useEffect(() => {
    let mounted = true;
    fetchMealPlannerQuota()
      .then((result) => {
        if (mounted) setQuota(result);
      })
      .catch(() => null)
      .finally(() => {
        if (mounted) setQuotaLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const weekDays = useMemo(() => getActiveWeekDates(todayISO), [todayISO]);
  const weekSummary = useMemo(() => getMealPlannerSummary(state, todayISO), [state, todayISO]);
  const recommendations = useMemo(() => getWeeklyRecommendations(state, todayISO), [state, todayISO]);
  const shoppingItems = useMemo(() => getWeeklyShoppingItems(state, todayISO), [state, todayISO]);
  const chartData = useMemo(() => getWeekChartData(state, todayISO), [state, todayISO]);
  const waterTargetCups = useMemo(() => getWaterTargetCups(state.profile), [state.profile]);
  const waterTargetLiters = useMemo(() => getWaterTargetLiters(state.profile), [state.profile]);
  const hasActivePlan = state.hasGeneratedPlan && weekSummary.plannedMeals > 0;

  const refreshQuota = async () => {
    try {
      const next = await fetchMealPlannerQuota();
      setQuota(next);
      return next;
    } finally {
      setQuotaLoading(false);
    }
  };

  const patchDay = (dateISO: string, mutate: (current: MealDayPlan) => MealDayPlan) => {
    setState((prev) => {
      const current = getDayPlan(prev, dateISO);
      return pruneMealPlannerState({
        ...prev,
        plansByDate: {
          ...prev.plansByDate,
          [dateISO]: {
            ...mutate(current),
            dateISO,
            updatedAt: new Date().toISOString(),
          },
        },
      }, todayISO);
    });
  };

  const generateWeeklyPlan = async () => {
    try {
      const result = await generateWeekWithAi(state.preferences, state.plansByDate);
      setState((prev) => pruneMealPlannerState(applyAiWeekToState(prev, result.plan.days, state.preferences), todayISO));
      await refreshQuota();
      setLimitReached(false);
      return { provider: result.quota.provider, quota: result.quota };
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("429")) {
        setLimitReached(true);
        await refreshQuota().catch(() => null);
      }
      setState((prev) => pruneMealPlannerState({
        ...prev,
        hasGeneratedPlan: true,
        plansByDate: {
          ...prev.plansByDate,
          ...buildGeneratedWeekPlans(prev, todayISO),
        },
      }, todayISO));
      return { provider: "local" as const };
    }
  };

  const updatePreferences = (patch: Partial<MealPlannerPreferences>) => {
    setState((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...patch,
        caloriesTarget:
          typeof patch.caloriesTarget === "number"
            ? Math.max(1200, Math.min(4000, Math.round(patch.caloriesTarget)))
            : prev.preferences.caloriesTarget,
        exclusions: Array.isArray(patch.exclusions)
          ? patch.exclusions.map((item) => item.trim()).filter(Boolean).slice(0, 8)
          : prev.preferences.exclusions,
      },
    }));
  };

  const updateProfile = (patch: Partial<MealPlannerProfile>) => {
    setState((prev) => {
      const profile = {
        ...prev.profile,
        ...patch,
        waterTargetCups:
          typeof patch.waterTargetCups === "number"
            ? Math.max(1, Math.min(20, Math.round(patch.waterTargetCups)))
            : prev.profile.waterTargetCups,
      };
      const waterTarget = getWaterTargetCups(profile);
      const plansByDate = Object.fromEntries(
        Object.entries(prev.plansByDate).map(([dateISO, plan]) => [
          dateISO,
          {
            ...plan,
            waterTargetCups: waterTarget,
          },
        ]),
      );
      return pruneMealPlannerState({
        ...prev,
        profile,
        plansByDate,
      }, todayISO);
    });
  };

  const updateMeal = (
    dateISO: string,
    mealType: MealType,
    patch: Partial<MealDayPlan["meals"][number]>,
  ) => {
    patchDay(dateISO, (current) => ({
      ...current,
      meals: current.meals.map((meal) => {
        if (meal.mealType !== mealType) return meal;
        return {
          ...meal,
          ...patch,
          title: typeof patch.title === "string" ? patch.title : meal.title,
          note: typeof patch.note === "string" ? patch.note : meal.note,
          tags: Array.isArray(patch.tags) ? patch.tags.filter(Boolean).slice(0, 5) : meal.tags,
          ingredients: Array.isArray(patch.ingredients) ? patch.ingredients.filter(Boolean).slice(0, 8) : meal.ingredients,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    if (typeof patch.title === "string" && patch.title.trim()) {
      setState((prev) => ({
        ...prev,
        recentMeals: pushRecentTitle(prev.recentMeals, patch.title ?? ""),
      }));
    }
  };

  const setMealStatus = (dateISO: string, mealType: MealType, status: MealStatus) => {
    updateMeal(dateISO, mealType, { status, title: status === "eating_out" ? "خارج المنزل" : undefined });
  };

  const regenerateMeal = async (dateISO: string, mealType: MealType) => {
    const currentMeal = getDayPlan(state, dateISO).meals.find((meal) => meal.mealType === mealType);
    if (!currentMeal) return { provider: "local" as const };
    try {
      const result = await editMealWithAi({
        dateISO,
        mealType,
        existingMeal: currentMeal as unknown as Record<string, unknown>,
        editRequest: "Replace this meal with a suitable alternative.",
      });
      const nextMeal = aiMealToMealSlot(result.meal, currentMeal.active);
      setState((prev) => {
        const currentPlan = getDayPlan(prev, dateISO);
        return pruneMealPlannerState({
          ...prev,
          plansByDate: {
            ...prev.plansByDate,
            [dateISO]: {
              ...currentPlan,
              meals: currentPlan.meals.map((meal) => (meal.mealType === mealType ? nextMeal : meal)),
              updatedAt: new Date().toISOString(),
            },
          },
          recentMeals: pushRecentTitle(prev.recentMeals, nextMeal.title),
        }, todayISO);
      });
      await refreshQuota();
      setLimitReached(false);
      return { provider: result.quota.provider, quota: result.quota };
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("429")) {
        setLimitReached(true);
        await refreshQuota().catch(() => null);
      }
      setState((prev) => {
        const allTitles = weekDays.flatMap((day) => getDayPlan(prev, day.dateISO).meals.map((meal) => meal.title).filter(Boolean));
        const current = getDayPlan(prev, dateISO).meals.find((meal) => meal.mealType === mealType);
        const nextMeal = buildReplacementMeal(prev, mealType, current?.title, allTitles);
        const currentPlan = getDayPlan(prev, dateISO);
        return pruneMealPlannerState({
          ...prev,
          plansByDate: {
            ...prev.plansByDate,
            [dateISO]: {
              ...currentPlan,
              meals: currentPlan.meals.map((meal) => (meal.mealType === mealType ? nextMeal : meal)),
              updatedAt: new Date().toISOString(),
            },
          },
          recentMeals: pushRecentTitle(prev.recentMeals, nextMeal.title),
        }, todayISO);
      });
      return { provider: "local" as const };
    }
  };

  const regenerateDay = async (dateISO: string) => {
    const currentPlan = getDayPlan(state, dateISO);
    try {
      const result = await regenerateDayWithAi({
        dateISO,
        existingDay: currentPlan as unknown as Record<string, unknown>,
        preferences: state.preferences,
      });
      setState((prev) => {
        const basePlan = getDayPlan(prev, dateISO);
        return pruneMealPlannerState({
          ...prev,
          plansByDate: {
            ...prev.plansByDate,
            [dateISO]: applyAiDayToPlan(basePlan, result.day, prev.preferences),
          },
        }, todayISO);
      });
      await refreshQuota();
      setLimitReached(false);
      return { provider: result.quota.provider, quota: result.quota };
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("429")) {
        setLimitReached(true);
        await refreshQuota().catch(() => null);
      }
      setState((prev) => pruneMealPlannerState({
        ...prev,
        plansByDate: {
          ...prev.plansByDate,
          [dateISO]: buildGeneratedWeekPlans(prev, dateISO)[dateISO],
        },
      }, todayISO));
      return { provider: "local" as const };
    }
  };

  const applyMealToDays = (fromDateISO: string, mealType: MealType, targetDateISOs: string[]) => {
    setState((prev) => {
      const sourceMeal = getDayPlan(prev, fromDateISO).meals.find((meal) => meal.mealType === mealType);
      if (!sourceMeal) return prev;
      const nextPlans = { ...prev.plansByDate };
      targetDateISOs.forEach((dateISO) => {
        if (dateISO === fromDateISO) return;
        const current = getDayPlan(prev, dateISO);
        nextPlans[dateISO] = {
          ...current,
          meals: current.meals.map((meal) =>
            meal.mealType === mealType
              ? { ...sourceMeal, id: createId(), source: "copied", updatedAt: new Date().toISOString() }
              : meal,
          ),
          updatedAt: new Date().toISOString(),
        };
      });
      return pruneMealPlannerState({
        ...prev,
        plansByDate: nextPlans,
      }, todayISO);
    });
  };

  const copyDayToDays = (fromDateISO: string, targetDateISOs: string[]) => {
    setState((prev) => {
      const source = getDayPlan(prev, fromDateISO);
      const nextPlans = { ...prev.plansByDate };
      targetDateISOs.forEach((dateISO) => {
        if (dateISO === fromDateISO) return;
        nextPlans[dateISO] = {
          ...source,
          dateISO,
          meals: source.meals.map((meal) => ({ ...meal, id: createId(), source: meal.title ? "copied" : meal.source })),
          updatedAt: new Date().toISOString(),
        };
      });
      return pruneMealPlannerState({
        ...prev,
        plansByDate: nextPlans,
      }, todayISO);
    });
  };

  const updateDay = (dateISO: string, patch: Partial<MealDayPlan>) => {
    patchDay(dateISO, (current) => ({
      ...current,
      ...patch,
      notes: typeof patch.notes === "string" ? patch.notes : current.notes,
      waterActualCups:
        typeof patch.waterActualCups === "number"
          ? Math.max(0, Math.min(20, Math.round(patch.waterActualCups)))
          : current.waterActualCups,
    }));
  };

  const saveMealAsFavorite = (dateISO: string, mealType: MealType) => {
    setState((prev) => {
      const meal = getDayPlan(prev, dateISO).meals.find((item) => item.mealType === mealType);
      if (!meal || !meal.title.trim()) return prev;
      if (prev.favorites.some((favorite) => favorite.title === meal.title && favorite.mealType === meal.mealType)) {
        return prev;
      }
      const nextFavorite: MealFavorite = {
        id: createId(),
        title: meal.title,
        mealType: meal.mealType,
        calories: meal.calories,
        tags: meal.tags,
        image: meal.image,
        imageType: meal.imageType,
        imageSource: meal.imageSource,
        ingredients: meal.ingredients,
      };
      return {
        ...prev,
        favorites: [nextFavorite, ...prev.favorites].slice(0, 30),
      };
    });
  };

  const applyFavoriteToMeal = (dateISO: string, mealType: MealType, favoriteId: string) => {
    const favorite = state.favorites.find((item) => item.id === favoriteId && item.mealType === mealType);
    if (!favorite) return;
    updateMeal(dateISO, mealType, {
      title: favorite.title,
      calories: favorite.calories,
      tags: favorite.tags,
      image: favorite.image,
      imageType: favorite.imageType,
      imageSource: favorite.imageSource,
      ingredients: favorite.ingredients,
      source: "favorite",
    });
  };

  const resetPlan = async (mode: "meals" | "all") => {
    await deleteMealPlanRemote(mode).catch(() => null);
    setState((prev) => {
      if (mode === "all") return createDefaultMealPlannerState();
      return pruneMealPlannerState({
        ...prev,
        plansByDate: {},
        hasGeneratedPlan: false,
      }, todayISO);
    });
    await refreshQuota().catch(() => null);
  };

  return {
    state,
    todayISO,
    weekDays,
    weekSummary,
    recommendations,
    shoppingItems,
    chartData,
    waterTargetCups,
    waterTargetLiters,
    hasActivePlan,
    quota,
    quotaLoading,
    limitReached,
    setLimitReached,
    getPlan: (dateISO: string) => getDayPlan(state, dateISO),
    getSuggestions: (mealType: MealType) => getMealSuggestions(state, mealType),
    updatePreferences,
    updateProfile,
    generateWeeklyPlan,
    updateMeal,
    setMealStatus,
    regenerateMeal,
    regenerateDay,
    applyMealToDays,
    copyDayToDays,
    updateDay,
    saveMealAsFavorite,
    applyFavoriteToMeal,
    resetPlan,
    refreshQuota,
  };
}

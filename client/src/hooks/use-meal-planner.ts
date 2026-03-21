import { useEffect, useMemo, useState } from "react";
import {
  buildGeneratedWeekPlans,
  createDefaultDayPlan,
  createId,
  getDayPlan,
  getDefaultMealTitle,
  getMealPlannerSummary,
  getMealSuggestions,
  getPreviousWeekDates,
  getTodayISO,
  getWaterTargetCups,
  getWaterTargetLiters,
  getWeekDates,
  getWeeklyRecommendations,
  getWeeklyShoppingItems,
  loadMealPlannerState,
  saveMealPlannerState,
  type MealDayPlan,
  type MealDayTemplate,
  type MealFavorite,
  type MealPlannerProfile,
  type MealPlannerState,
  type MealSource,
  type MealStatus,
  type MealType,
  type PrepEffort,
  type WeeklyPlanningStyle,
  type WeeklyPreferenceMode,
} from "@/lib/meal-planner";

function pushRecentTitle(recentMeals: string[], title: string) {
  const normalized = title.trim();
  if (!normalized) return recentMeals;
  return [normalized, ...recentMeals.filter((item) => item !== normalized)].slice(0, 24);
}

export function useMealPlanner() {
  const [state, setState] = useState<MealPlannerState>(() => loadMealPlannerState());
  const todayISO = useMemo(() => getTodayISO(), []);

  useEffect(() => {
    saveMealPlannerState(state);
  }, [state]);

  const weekDays = useMemo(() => getWeekDates(todayISO), [todayISO]);
  const previousWeekDays = useMemo(() => getPreviousWeekDates(todayISO), [todayISO]);
  const weekSummary = useMemo(() => getMealPlannerSummary(state, todayISO), [state, todayISO]);
  const shoppingItems = useMemo(() => getWeeklyShoppingItems(state, todayISO), [state, todayISO]);
  const recommendations = useMemo(() => getWeeklyRecommendations(state, todayISO), [state, todayISO]);
  const waterTargetCups = useMemo(() => getWaterTargetCups(state.profile), [state.profile]);
  const waterTargetLiters = useMemo(() => getWaterTargetLiters(state.profile), [state.profile]);

  const getPlan = (dateISO: string) => getDayPlan(state, dateISO);
  const getSuggestions = (dateISO: string, mealType: MealType) => getMealSuggestions(state, dateISO, mealType);

  const patchDayPlan = (dateISO: string, mutate: (current: MealDayPlan) => MealDayPlan) => {
    setState((prev) => {
      const current = getDayPlan(prev, dateISO);
      const mutated = mutate(current);
      const next = {
        ...mutated,
        dateISO,
        waterTargetCups: mutated.waterTargetCups || getWaterTargetCups(prev.profile),
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

  const setMealFields = (
    dateISO: string,
    mealType: MealType,
    patch: Partial<MealDayPlan["meals"][number]>,
  ) => {
    setState((prev) => {
      const current = getDayPlan(prev, dateISO);
      const nextMeals = current.meals.map((meal) => {
        if (meal.mealType !== mealType) return meal;
        return {
          ...meal,
          ...patch,
          title: typeof patch.title === "string" ? patch.title.trimStart() : meal.title,
          note: typeof patch.note === "string" ? patch.note.trimStart() : meal.note,
          ingredientSummary: typeof patch.ingredientSummary === "string" ? patch.ingredientSummary.trimStart() : meal.ingredientSummary,
          categoryTags: Array.isArray(patch.categoryTags) ? patch.categoryTags.filter(Boolean).slice(0, 5) : meal.categoryTags,
          prepMinutes: typeof patch.prepMinutes === "number" ? Math.max(0, Math.min(180, Math.round(patch.prepMinutes))) : meal.prepMinutes,
          updatedAt: new Date().toISOString(),
        };
      });

      const updatedTitle = nextMeals.find((meal) => meal.mealType === mealType)?.title ?? "";
      return {
        ...prev,
        plansByDate: {
          ...prev.plansByDate,
          [dateISO]: {
            ...current,
            meals: nextMeals,
            updatedAt: new Date().toISOString(),
          },
        },
        recentMeals: updatedTitle.trim() ? pushRecentTitle(prev.recentMeals, updatedTitle) : prev.recentMeals,
      };
    });
  };

  const setMealStatus = (dateISO: string, mealType: MealType, status: MealStatus) => {
    setMealFields(dateISO, mealType, {
      status,
      source: status === "eating_out" ? "eating_out" : status === "leftover" ? "leftover" : undefined,
      title: getPlan(dateISO).meals.find((meal) => meal.mealType === mealType)?.title.trim() || getDefaultMealTitle(mealType, status),
    });
  };

  const updateDayFields = (dateISO: string, patch: Partial<MealDayPlan>) => {
    patchDayPlan(dateISO, (current) => ({
      ...current,
      ...patch,
      notes: typeof patch.notes === "string" ? patch.notes.trimStart() : current.notes,
      prepNote: typeof patch.prepNote === "string" ? patch.prepNote.trimStart() : current.prepNote,
      waterActualCups: typeof patch.waterActualCups === "number" ? Math.max(0, Math.min(20, Math.round(patch.waterActualCups))) : current.waterActualCups,
      waterTargetCups: typeof patch.waterTargetCups === "number" ? Math.max(1, Math.min(20, Math.round(patch.waterTargetCups))) : current.waterTargetCups,
    }));
  };

  const copyDayToDays = (fromDateISO: string, targetDateISOs: string[]) => {
    setState((prev) => {
      const source = getDayPlan(prev, fromDateISO);
      const nextPlans = { ...prev.plansByDate };
      for (const dateISO of targetDateISOs) {
        if (dateISO === fromDateISO) continue;
        nextPlans[dateISO] = {
          ...source,
          dateISO,
          copiedFromDateISO: fromDateISO,
          updatedAt: new Date().toISOString(),
          meals: source.meals.map((meal) => ({ ...meal, id: createId(), source: meal.title.trim() ? "copied" : meal.source, updatedAt: new Date().toISOString() })),
        };
      }
      return {
        ...prev,
        plansByDate: nextPlans,
        recentMeals: source.meals.reduce((acc, meal) => pushRecentTitle(acc, meal.title), prev.recentMeals),
      };
    });
  };

  const copyMealToDays = (fromDateISO: string, mealType: MealType, targetDateISOs: string[]) => {
    setState((prev) => {
      const source = getDayPlan(prev, fromDateISO).meals.find((meal) => meal.mealType === mealType);
      if (!source) return prev;
      const nextPlans = { ...prev.plansByDate };
      for (const dateISO of targetDateISOs) {
        if (dateISO === fromDateISO) continue;
        const current = getDayPlan(prev, dateISO);
        nextPlans[dateISO] = {
          ...current,
          meals: current.meals.map((meal) =>
            meal.mealType === mealType
              ? { ...source, id: createId(), source: "copied", updatedAt: new Date().toISOString() }
              : meal,
          ),
          copiedFromDateISO: fromDateISO,
          updatedAt: new Date().toISOString(),
        };
      }
      return {
        ...prev,
        plansByDate: nextPlans,
        recentMeals: pushRecentTitle(prev.recentMeals, source.title),
      };
    });
  };

  const autofillEmptySlots = (mealType?: MealType) => {
    setState((prev) => {
      const generated = buildGeneratedWeekPlans(prev, todayISO, "autofill_empty", "balanced");
      const nextPlans = { ...prev.plansByDate };
      for (const day of weekDays) {
        const current = getDayPlan(prev, day.dateISO);
        const generatedPlan = generated[day.dateISO];
        nextPlans[day.dateISO] = {
          ...current,
          meals: current.meals.map((meal) => {
            if (mealType && meal.mealType !== mealType) return meal;
            if (meal.title.trim()) return meal;
            return generatedPlan.meals.find((generatedMeal) => generatedMeal.mealType === meal.mealType) ?? meal;
          }),
          updatedAt: new Date().toISOString(),
        };
      }
      return { ...prev, plansByDate: nextPlans };
    });
  };

  const generateWeek = (style: WeeklyPlanningStyle, mode: WeeklyPreferenceMode) => {
    setState((prev) => ({
      ...prev,
      plansByDate: {
        ...prev.plansByDate,
        ...buildGeneratedWeekPlans(prev, todayISO, style, mode),
      },
    }));
  };

  const copyFromPreviousWeek = () => generateWeek("copy_last_week", "balanced");

  const clearDay = (dateISO: string) => {
    setState((prev) => {
      const current = getDayPlan(prev, dateISO);
      return {
        ...prev,
        plansByDate: {
          ...prev.plansByDate,
          [dateISO]: createDefaultDayPlan(dateISO, current.waterTargetCups),
        },
      };
    });
  };

  const clearMeal = (dateISO: string, mealType: MealType) => {
    patchDayPlan(dateISO, (current) => ({
      ...current,
      meals: current.meals.map((meal) => (meal.mealType === mealType ? createDefaultDayPlan(dateISO, current.waterTargetCups).meals.find((slot) => slot.mealType === mealType)! : meal)),
    }));
  };

  const markDayEatingOut = (dateISO: string) => {
    patchDayPlan(dateISO, (current) => ({
      ...current,
      meals: current.meals.map((meal) => ({
        ...meal,
        title: meal.title.trim() || "خارج المنزل",
        source: "eating_out",
        status: "eating_out",
        updatedAt: new Date().toISOString(),
      })),
    }));
  };

  const saveMealAsFavorite = (dateISO: string, mealType: MealType) => {
    setState((prev) => {
      const meal = getDayPlan(prev, dateISO).meals.find((slot) => slot.mealType === mealType);
      if (!meal || !meal.title.trim() || prev.favorites.some((favorite) => favorite.title === meal.title && favorite.mealType === meal.mealType)) return prev;
      const favorite: MealFavorite = {
        id: createId(),
        title: meal.title,
        mealType: meal.mealType,
        note: meal.note,
        source: "favorite",
        prepEffort: meal.prepEffort,
        categoryTags: [...meal.categoryTags],
        ingredientSummary: meal.ingredientSummary,
        prepMinutes: meal.prepMinutes,
      };
      return { ...prev, favorites: [favorite, ...prev.favorites].slice(0, 36) };
    });
  };

  const applyFavoriteToMeal = (dateISO: string, mealType: MealType, favoriteId: string) => {
    const favorite = state.favorites.find((item) => item.id === favoriteId);
    if (!favorite) return;
    setMealFields(dateISO, mealType, {
      title: favorite.title,
      note: favorite.note,
      source: "favorite",
      prepEffort: favorite.prepEffort,
      categoryTags: favorite.categoryTags,
      ingredientSummary: favorite.ingredientSummary,
      prepMinutes: favorite.prepMinutes,
      status: "planned",
    });
  };

  const saveDayAsTemplate = (dateISO: string) => {
    setState((prev) => {
      const plan = getDayPlan(prev, dateISO);
      const template: MealDayTemplate = {
        id: createId(),
        name: `قالب ${new Date(`${dateISO}T00:00:00`).toLocaleDateString("ar", { weekday: "long" })}`,
        description: "تم حفظه من خطة الأسبوع الحالية.",
        prepLoad: plan.prepLoad,
        shoppingReady: plan.shoppingReady,
        leftoversAvailable: plan.leftoversAvailable,
        notes: plan.notes,
        prepNote: plan.prepNote,
        meals: Object.fromEntries(
          plan.meals.map((meal) => [
            meal.mealType,
            {
              title: meal.title,
              note: meal.note,
              status: meal.status,
              source: "template" as MealSource,
              prepEffort: meal.prepEffort,
              categoryTags: meal.categoryTags,
              ingredientSummary: meal.ingredientSummary,
              prepMinutes: meal.prepMinutes,
            },
          ]),
        ) as MealDayTemplate["meals"],
      };
      return { ...prev, templates: [template, ...prev.templates].slice(0, 24) };
    });
  };

  const applyTemplateToDays = (templateId: string, targetDateISOs: string[]) => {
    setState((prev) => {
      const template = prev.templates.find((item) => item.id === templateId);
      if (!template) return prev;
      const nextPlans = { ...prev.plansByDate };
      for (const dateISO of targetDateISOs) {
        const current = getDayPlan(prev, dateISO);
        nextPlans[dateISO] = {
          ...current,
          prepLoad: template.prepLoad,
          shoppingReady: template.shoppingReady,
          leftoversAvailable: template.leftoversAvailable,
          notes: template.notes,
          prepNote: template.prepNote,
          updatedAt: new Date().toISOString(),
          meals: current.meals.map((meal) => {
            const sourceMeal = template.meals[meal.mealType];
            if (!sourceMeal) return meal;
            return {
              ...meal,
              ...sourceMeal,
              id: createId(),
              source: "template",
              updatedAt: new Date().toISOString(),
            };
          }),
        };
      }
      return { ...prev, plansByDate: nextPlans };
    });
  };

  const updateProfile = (patch: Partial<MealPlannerProfile>) => {
    setState((prev) => {
      const profile = {
        ...prev.profile,
        ...patch,
        waterTargetCups: typeof patch.waterTargetCups === "number" ? Math.max(1, Math.min(20, Math.round(patch.waterTargetCups))) : prev.profile.waterTargetCups,
        dietaryNotes: typeof patch.dietaryNotes === "string" ? patch.dietaryNotes.trimStart() : prev.profile.dietaryNotes,
        avoidIngredients: typeof patch.avoidIngredients === "string" ? patch.avoidIngredients.trimStart() : prev.profile.avoidIngredients,
      };
      const target = getWaterTargetCups(profile);
      const nextPlans = { ...prev.plansByDate };
      for (const day of weekDays) {
        const current = getDayPlan(prev, day.dateISO);
        nextPlans[day.dateISO] = { ...current, waterTargetCups: current.waterTargetCups || target };
      }
      return { ...prev, profile, plansByDate: nextPlans };
    });
  };

  return {
    state,
    todayISO,
    weekDays,
    previousWeekDays,
    weekSummary,
    shoppingItems,
    recommendations,
    waterTargetCups,
    waterTargetLiters,
    getPlan,
    getSuggestions,
    setMealFields,
    setMealStatus,
    updateDayFields,
    copyDayToDays,
    copyMealToDays,
    autofillEmptySlots,
    generateWeek,
    copyFromPreviousWeek,
    clearDay,
    clearMeal,
    markDayEatingOut,
    saveMealAsFavorite,
    applyFavoriteToMeal,
    saveDayAsTemplate,
    applyTemplateToDays,
    updateProfile,
  };
}

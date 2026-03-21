import type { AiDayPlan, AiMeal, AiQuotaDecision } from "@shared/ai/ai-types";
import { apiRequest } from "@/lib/queryClient";
import {
  createDefaultDayPlan,
  createDefaultMealPlannerState,
  createId,
  getWaterTargetCups,
  type MealDayPlan,
  type MealPlannerPreferences,
  type MealPlannerState,
  type MealType,
} from "@/lib/meal-planner";

export interface MealPlannerQuotaResponse {
  tier: "free" | "pro" | "admin";
  role: string;
  aiEnabled: boolean;
  entitlements: {
    mealPlanner: {
      basic: boolean;
      aiGeneration: boolean;
      realtimeAiSuggestions: boolean;
      smartOptimization: boolean;
    };
    dashboard: {
      advancedInsights: boolean;
    };
  };
  remainingFullGenerationsToday: number | null;
  remainingLightEditsToday: number | null;
  remainingFullGenerationsMonth: number | null;
  remainingLightEditsMonth: number | null;
}

export function aiMealToMealSlot(meal: AiMeal, active = true) {
  return {
    id: createId(),
    mealType: meal.mealType,
    title: meal.title,
    note: meal.shortNote || "",
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    tags: meal.tags,
    ingredients: meal.ingredients,
    prepEffort: "medium" as const,
    budgetLevel: "medium" as const,
    status: "planned" as const,
    source: "generated" as const,
    image: meal.image,
    imageType: meal.imageType,
    imageSource: meal.imageSource,
    active,
    updatedAt: new Date().toISOString(),
  };
}

export function applyAiDayToPlan(
  basePlan: MealDayPlan,
  day: AiDayPlan,
  preferences: MealPlannerPreferences,
): MealDayPlan {
  const activeMealTypes = new Set(basePlan.meals.filter((meal) => meal.active).map((meal) => meal.mealType));
  const aiMealsByType = new Map(day.meals.map((meal) => [meal.mealType, meal]));
  return {
    ...basePlan,
    dateISO: day.dateISO,
    meals: basePlan.meals.map((meal) => {
      const next = aiMealsByType.get(meal.mealType);
      if (!next) {
        return {
          ...meal,
          active: activeMealTypes.has(meal.mealType),
          updatedAt: new Date().toISOString(),
        };
      }
      return aiMealToMealSlot(next, activeMealTypes.has(next.mealType));
    }),
    waterTargetCups: day.waterTargetCups || getWaterTargetCups(createDefaultMealPlannerState().profile),
    notes: day.notes || "",
    updatedAt: new Date().toISOString(),
  };
}

export function applyAiWeekToState(
  prev: MealPlannerState,
  days: AiDayPlan[],
  preferences: MealPlannerPreferences,
) {
  const nextPlansByDate = { ...prev.plansByDate };
  for (const day of days) {
    const basePlan = prev.plansByDate[day.dateISO] ?? createDefaultDayPlan(day.dateISO, preferences, getWaterTargetCups(prev.profile));
    nextPlansByDate[day.dateISO] = applyAiDayToPlan(basePlan, day, preferences);
  }
  return {
    ...prev,
    preferences,
    plansByDate: nextPlansByDate,
    hasGeneratedPlan: true,
    recentMeals: days.flatMap((day) => day.meals.map((meal) => meal.title)).slice(0, 24),
  };
}

export async function fetchMealPlannerQuota() {
  const response = await fetch("/api/meal-planner/quota", { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch meal planner quota");
  return (await response.json()) as MealPlannerQuotaResponse;
}

export async function generateWeekWithAi(preferences: MealPlannerPreferences, existingPlan?: unknown) {
  const response = await apiRequest("POST", "/api/meal-planner/generate-week", { preferences, existingPlan });
  return (await response.json()) as {
    plan: { summary: string; days: AiDayPlan[] };
    usage: { inputTokens: number; outputTokens: number };
    quota: AiQuotaDecision;
  };
}

export async function editMealWithAi(payload: {
  dateISO: string;
  mealType: MealType;
  existingMeal: Record<string, unknown>;
  editRequest: string;
}) {
  const response = await apiRequest("POST", "/api/meal-planner/edit-meal", payload);
  return (await response.json()) as {
    meal: AiMeal;
    usage: { inputTokens: number; outputTokens: number };
    quota: AiQuotaDecision;
  };
}

export async function regenerateDayWithAi(payload: {
  dateISO: string;
  existingDay: Record<string, unknown>;
  preferences: MealPlannerPreferences;
}) {
  const response = await apiRequest("POST", "/api/meal-planner/regenerate-day", payload);
  return (await response.json()) as {
    day: AiDayPlan;
    usage: { inputTokens: number; outputTokens: number };
    quota: AiQuotaDecision;
  };
}

export async function deleteMealPlanRemote(mode: "meals" | "all") {
  const response = await apiRequest("POST", "/api/meal-planner/delete-plan", { mode });
  return response.json();
}

import type { AiDayPlan, AiMeal } from "@shared/ai/ai-types";
import { apiRequest } from "@/lib/queryClient";
import type {
  MealPlanMeal,
  PlannerLimits,
  PlannerPreferences,
  PlannerServerState,
  WeeklyPlanRecord,
  MealType,
} from "@/lib/meal-planner";

export interface PlannerUsageResponse {
  activePlan: WeeklyPlanRecord | null;
  limits: PlannerLimits;
  role: string;
  tier: "free" | "pro" | "admin";
}

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
  remainingDayRegenerationsMonth?: number | null;
}

async function readJsonBody<T>(response: Response, fallbackMessage: string) {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(fallbackMessage);
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : fallbackMessage);
  }
}

export function aiMealToPlannerMeal(meal: AiMeal): MealPlanMeal {
  return {
    id: `${meal.mealType}_${meal.title}_${Math.random().toString(36).slice(2, 8)}`,
    mealType: meal.mealType,
    title: meal.title,
    icon: meal.imageType === "emoji" ? meal.image : meal.mealType === "breakfast" ? "🍳" : meal.mealType === "lunch" ? "🥗" : meal.mealType === "dinner" ? "🍲" : "🥤",
    ingredients: meal.ingredients,
    steps: meal.steps,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    waterCups: 2,
    tags: meal.tags,
    reason: meal.reason,
    shortTip: meal.shortTip,
    source: "ai",
    image: meal.image,
    imageType: meal.imageType,
    imageSource: meal.imageSource,
    repeated: false,
    reusedIngredient: false,
  };
}

export async function fetchMealPlannerState() {
  const response = await fetch("/api/meal-planner/state", { credentials: "include" });
  if (!response.ok) {
    throw new Error((await response.text()) || "Failed to load meal planner state");
  }
  return await readJsonBody<PlannerServerState>(response, "Failed to load meal planner state");
}

export async function fetchMealPlannerQuota() {
  const response = await fetch("/api/meal-planner/quota", { credentials: "include" });
  if (!response.ok) {
    throw new Error((await response.text()) || "Failed to load meal planner quota");
  }
  return await readJsonBody<MealPlannerQuotaResponse>(response, "Failed to load meal planner quota");
}

export async function saveMealPlannerPreferences(preferences: PlannerPreferences) {
  const response = await apiRequest("POST", "/api/meal-planner/preferences", { preferences });
  return await readJsonBody<{ ok: true; preferences: PlannerPreferences }>(response, "Failed to save preferences");
}

export async function generateWeekWithAi(preferences: PlannerPreferences, replaceCurrent = false) {
  const response = await apiRequest("POST", "/api/meal-planner/generate-week", { preferences, replaceCurrent });
  return await readJsonBody<{
    state: PlannerServerState;
    provider: "openai";
    source: "ai";
    debug?: string | null;
    cached?: boolean;
  }>(response, "تعذر قراءة استجابة التوليد من الخادم.");
}

export async function editMealWithAi(payload: {
  dateISO: string;
  mealType: MealType;
  existingMeal: Record<string, unknown>;
  editRequest: string;
}) {
  const response = await apiRequest("POST", "/api/meal-planner/edit-meal", payload);
  return await readJsonBody<{
    meal: AiMeal;
    activePlan: WeeklyPlanRecord;
    provider: "openai";
    source: "ai";
    debug?: string | null;
  }>(response, "تعذر قراءة استجابة تعديل الوجبة.");
}

export async function regenerateDayWithAi(payload: {
  dateISO: string;
  existingDay: Record<string, unknown>;
  preferences: PlannerPreferences;
}) {
  const response = await apiRequest("POST", "/api/meal-planner/regenerate-day", payload);
  return await readJsonBody<{
    day: AiDayPlan;
    activePlan: WeeklyPlanRecord;
    provider: "openai";
    source: "ai";
    debug?: string | null;
  }>(response, "تعذر قراءة استجابة إعادة توليد اليوم.");
}

export async function deleteMealPlanRemote(mode: "meals" | "all") {
  const response = await apiRequest("POST", "/api/meal-planner/delete-plan", { mode });
  return await readJsonBody<{ ok: true; state: PlannerServerState }>(response, "Failed to delete meal plan");
}

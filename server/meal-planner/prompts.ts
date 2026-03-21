import type { FeatureAccessMap } from "@shared/plans/plan-tiers";
import type { MealPlannerUserContext } from "@shared/ai/ai-types";

export function buildWeeklyGenerationPrompt(
  userContext: MealPlannerUserContext,
  preferences: Record<string, unknown>,
  tierFeatures: FeatureAccessMap,
) {
  return [
    "Generate a weekly meal plan as strict JSON only.",
    "Be concise and cost-aware.",
    "Respect preferences, exclusions, calories, meals per day, and saved user context.",
    "Use short notes only when helpful.",
    `User tier: ${userContext.tier}.`,
    `Realtime suggestions enabled: ${tierFeatures.mealPlanner.realtimeAiSuggestions}.`,
    `Smart optimization enabled: ${tierFeatures.mealPlanner.smartOptimization}.`,
    `User context: ${JSON.stringify(userContext)}.`,
    `Preferences: ${JSON.stringify(preferences)}.`,
    "Return exactly 7 days with meals, calories, macros, ingredient summaries, tags, and image placeholders.",
  ].join("\n");
}

export function buildMealEditPrompt(
  existingMeal: Record<string, unknown>,
  editRequest: string,
  userContext: MealPlannerUserContext,
) {
  return [
    "Edit one meal and return strict JSON only.",
    "Keep the response compact and practical.",
    `User context: ${JSON.stringify(userContext)}.`,
    `Existing meal: ${JSON.stringify(existingMeal)}.`,
    `Edit request: ${editRequest}.`,
  ].join("\n");
}

export function buildDayRegenerationPrompt(
  existingDay: Record<string, unknown>,
  userContext: MealPlannerUserContext,
  preferences: Record<string, unknown>,
) {
  return [
    "Regenerate one day in a weekly meal plan and return strict JSON only.",
    `User context: ${JSON.stringify(userContext)}.`,
    `Preferences: ${JSON.stringify(preferences)}.`,
    `Existing day context: ${JSON.stringify(existingDay)}.`,
  ].join("\n");
}

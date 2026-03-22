import type { FeatureAccessMap } from "../../shared/plans/plan-tiers.ts";
import type { MealPlannerUserContext } from "../../shared/ai/ai-types.ts";

function compactJson(value: unknown) {
  return JSON.stringify(value);
}

export function buildWeeklyGenerationPrompt(
  userContext: MealPlannerUserContext,
  preferences: Record<string, unknown>,
  tierFeatures: FeatureAccessMap,
  activeDates: string[],
) {
  return [
    "Generate a meal plan in Arabic for Planner Hub.",
    "Return strict JSON only. No markdown. No explanation outside schema.",
    "Be token efficient and concise.",
    "Generate meals only for these dates:",
    compactJson(activeDates),
    "Rules:",
    "- Respect preferences and saved context.",
    "- Keep titles short and practical.",
    "- Ingredients max 8 items.",
    "- Steps max 3 short steps.",
    "- Reason max 12 to 15 words.",
    "- Keep tip and notes short.",
    "- Keep tags short and scan-friendly.",
    `Tier: ${userContext.tier}.`,
    `Realtime suggestions enabled: ${tierFeatures.mealPlanner.realtimeAiSuggestions}.`,
    `Smart optimization enabled: ${tierFeatures.mealPlanner.smartOptimization}.`,
    `User context: ${compactJson(userContext)}.`,
    `Preferences: ${compactJson(preferences)}.`,
  ].join("\n");
}

export function buildMealEditPrompt(
  existingMeal: Record<string, unknown>,
  editRequest: string,
  userContext: MealPlannerUserContext,
) {
  return [
    "Edit one meal for Planner Hub in Arabic.",
    "Return strict JSON only.",
    "Keep it compact and practical.",
    "Rules:",
    "- Ingredients max 8 items.",
    "- Steps max 3 short steps.",
    "- Reason max 12 to 15 words.",
    "- Keep tags short.",
    `User context: ${compactJson(userContext)}.`,
    `Existing meal: ${compactJson(existingMeal)}.`,
    `Requested change: ${editRequest}.`,
  ].join("\n");
}

export function buildDayRegenerationPrompt(
  existingDay: Record<string, unknown>,
  userContext: MealPlannerUserContext,
  preferences: Record<string, unknown>,
) {
  return [
    "Regenerate one day only for Planner Hub in Arabic.",
    "Return strict JSON only.",
    "Keep the result concise and aligned with the rest of the week.",
    "Rules:",
    "- Keep meals practical and varied.",
    "- Ingredients max 8 items per meal.",
    "- Steps max 3 short steps per meal.",
    "- Reason max 12 to 15 words.",
    "- Keep the day tip short.",
    `User context: ${compactJson(userContext)}.`,
    `Preferences: ${compactJson(preferences)}.`,
    `Existing day context: ${compactJson(existingDay)}.`,
  ].join("\n");
}

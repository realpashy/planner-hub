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
    "Internal enum values must stay in English: breakfast, lunch, dinner, snack.",
    "Generate meals only for these dates:",
    compactJson(activeDates),
    "Rules:",
    "- Respect preferences and saved context.",
    "- Use any additional notes only if they materially improve the first plan.",
    "- Keep titles short and practical.",
    "- Generate exactly the number of meals requested in preferences when possible.",
    "- Ingredients max 6 items.",
    "- Steps max 2 very short steps.",
    "- Reason max 12 to 15 words.",
    "- Keep tip and notes extremely short.",
    "- Keep tags max 2 and scan-friendly.",
    "- Use one-line ingredients and steps, not detailed prose.",
    "- Omit optional fields if they add no value.",
    "- Prefer icon-friendly meals and emoji thumbnails over photo-heavy outputs.",
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
    "Internal mealType enum must stay in English.",
    "Rules:",
    "- Ingredients max 6 items.",
    "- Steps max 2 very short steps.",
    "- Reason max 12 to 15 words.",
    "- Keep tags max 2 and short.",
    "- Omit optional fields if they add no value.",
    "- Prefer emoji or simple placeholder visuals over photos.",
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
    "Internal mealType enum must stay in English: breakfast, lunch, dinner, snack.",
    "Rules:",
    "- Keep meals practical and varied.",
    "- Generate exactly the number of meals requested in preferences when possible.",
    "- Ingredients max 6 items per meal.",
    "- Steps max 2 very short steps per meal.",
    "- Reason max 12 to 15 words.",
    "- Keep the day tip short.",
    "- Omit optional fields if they add no value.",
    "- Prefer emoji or simple placeholder visuals over photos.",
    `User context: ${compactJson(userContext)}.`,
    `Preferences: ${compactJson(preferences)}.`,
    `Existing day context: ${compactJson(existingDay)}.`,
  ].join("\n");
}

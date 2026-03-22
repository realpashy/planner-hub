import type { FeatureAccessMap } from "../../shared/plans/plan-tiers.ts";
import type { MealPlannerUserContext } from "../../shared/ai/ai-types.ts";

function compactJson(value: unknown) {
  return JSON.stringify(value);
}

function compactText(value: unknown, maxLength = 140) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function compactArray(values: unknown, limit: number) {
  return Array.isArray(values) ? values.filter(Boolean).slice(0, limit) : [];
}

function compactWeeklyContext(userContext: MealPlannerUserContext) {
  return {
    timezone: userContext.timezone,
    tier: userContext.tier,
    dietaryNotes: compactText(userContext.dietaryNotes, 140),
    avoidIngredients: compactArray(userContext.avoidIngredients, 6),
    recentMeals: compactArray(userContext.recentMeals, 4),
    favorites: compactArray(userContext.favorites, 4).map((item) =>
      typeof item === "object" && item
        ? {
            title: compactText((item as { title?: unknown }).title, 28),
            mealType: compactText((item as { mealType?: unknown }).mealType, 16),
          }
        : item,
    ),
    savedPlanSummaries: compactArray(userContext.savedPlanSummaries, 3),
  };
}

function compactPreferences(preferences: Record<string, unknown>) {
  return {
    ...preferences,
    cuisinePreferences: compactArray(preferences.cuisinePreferences, 6),
    allergies: compactArray(preferences.allergies, 6),
    dislikedIngredients: compactArray(preferences.dislikedIngredients, 6),
    dislikedMeals: compactArray(preferences.dislikedMeals, 5),
    foodRules: compactArray(preferences.foodRules, 6),
    ingredientsAtHome: compactArray(preferences.ingredientsAtHome, 6),
    busyDays: compactArray(preferences.busyDays, 4),
    additionalNotes: compactText(preferences.additionalNotes, 160),
  };
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
    "- Keep summary under 18 Arabic words.",
    "- Keep each day tip under 10 Arabic words.",
    "- Ingredients max 6 items.",
    "- Steps max 2 very short steps.",
    "- Reason max 12 to 15 words.",
    "- Round macros to simple integers.",
    "- Prefer icon-friendly meals and emoji thumbnails over photo-heavy outputs.",
    `Tier: ${userContext.tier}. Smart optimization: ${tierFeatures.mealPlanner.smartOptimization}.`,
    `User context: ${compactJson(compactWeeklyContext(userContext))}.`,
    `Preferences: ${compactJson(compactPreferences(preferences))}.`,
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
    "- Keep the replacement materially different but still practical.",
    "- Prefer emoji or simple placeholder visuals over photos.",
    `User context: ${compactJson(compactWeeklyContext(userContext))}.`,
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
    "- Prefer emoji or simple placeholder visuals over photos.",
    `User context: ${compactJson(compactWeeklyContext(userContext))}.`,
    `Preferences: ${compactJson(compactPreferences(preferences))}.`,
    `Existing day context: ${compactJson(existingDay)}.`,
  ].join("\n");
}

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
    language: userContext.language,
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

function resolvePlannerLanguage(language?: string) {
  if (language === "he") return "Hebrew";
  if (language === "en") return "English";
  return "Arabic";
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
  const plannerLanguage = resolvePlannerLanguage(userContext.language);
  return [
    `Generate a meal plan in ${plannerLanguage} for Planner Hub.`,
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
    "- Keep summary under 18 words.",
    "- Keep each day tip under 10 words.",
    "- Ingredients max 6 items.",
    `- All user-facing titles, ingredients, reasons, tips, and notes must be in ${plannerLanguage}.`,
    `- Use supermarket-ready canonical ingredient names in ${plannerLanguage}, not noisy preparation variants.`,
    "- Merge near-equivalent grocery variants mentally before naming ingredients when the shopping distinction is not essential.",
    "- Example: treat حمص / حمص معلب / حمّص معلب مصفّى as one grocery item unless the distinction truly matters.",
    "- Steps max 2 very short steps.",
    "- Reason max 12 to 15 words.",
    "- Round macros to simple integers.",
    "- Prefer icon-friendly meals and emoji thumbnails over photo-heavy outputs.",
    `Tier: ${userContext.tier}. Smart optimization: ${tierFeatures.mealPlanner.smartOptimization}.`,
    `User context: ${compactJson(compactWeeklyContext(userContext))}.`,
    `Preferences: ${compactJson(compactPreferences(preferences))}.`,
  ].join("\n");
}

export function buildSingleDayGenerationPrompt(
  dateISO: string,
  userContext: MealPlannerUserContext,
  preferences: Record<string, unknown>,
  activeDates: string[],
) {
  const plannerLanguage = resolvePlannerLanguage(userContext.language);
  return [
    `Generate one meal-planner day in ${plannerLanguage} for Planner Hub.`,
    "Return strict JSON only.",
    "Do not generate a full week.",
    "Internal mealType enum values must stay in English: breakfast, lunch, dinner, snack.",
    `Generate only for date: ${dateISO}.`,
    `Visible active range: ${compactJson(activeDates)}.`,
    "Rules:",
    "- Respect preferences and saved context.",
    "- Keep the day practical and easy to shop.",
    `- All user-facing titles, ingredients, reasons, tips, and notes must be in ${plannerLanguage}.`,
    `- Use supermarket-ready canonical ingredient names in ${plannerLanguage}, not noisy preparation variants.`,
    "- Merge near-equivalent grocery variants mentally before naming ingredients when the shopping distinction is not essential.",
    "- Generate exactly the requested meals count when possible.",
    "- Keep the day tip under 10 words.",
    "- Keep notes under 12 words or leave empty.",
    "- Ingredients max 6 items per meal.",
    "- Steps max 2 very short steps per meal.",
    "- Reason max 12 to 15 words.",
    "- Tags max 2 short tags per meal.",
    "- Keep macros as simple rounded integers.",
    "- Prefer emoji-friendly visual placeholders over photos.",
    `User context: ${compactJson(compactWeeklyContext(userContext))}.`,
    `Preferences: ${compactJson(compactPreferences(preferences))}.`,
  ].join("\n");
}

export function buildMealEditPrompt(
  existingMeal: Record<string, unknown>,
  editRequest: string,
  userContext: MealPlannerUserContext,
) {
  const plannerLanguage = resolvePlannerLanguage(userContext.language);
  return [
    `Edit one meal for Planner Hub in ${plannerLanguage}.`,
    "Return strict JSON only.",
    "Keep it compact and practical.",
    "Internal mealType enum must stay in English.",
    "Rules:",
    "- Ingredients max 6 items.",
    `- All user-facing titles, ingredients, reasons, tips, and notes must be in ${plannerLanguage}.`,
    `- Use supermarket-ready canonical ingredient names in ${plannerLanguage}, not noisy preparation variants.`,
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
  const plannerLanguage = resolvePlannerLanguage(userContext.language);
  return [
    `Regenerate one day only for Planner Hub in ${plannerLanguage}.`,
    "Return strict JSON only.",
    "Keep the result concise and aligned with the rest of the week.",
    "Internal mealType enum must stay in English: breakfast, lunch, dinner, snack.",
    "Rules:",
    "- Keep meals practical and varied.",
    `- All user-facing titles, ingredients, reasons, tips, and notes must be in ${plannerLanguage}.`,
    `- Use supermarket-ready canonical ingredient names in ${plannerLanguage}, not noisy preparation variants.`,
    "- Merge near-equivalent grocery variants mentally before naming ingredients when the shopping distinction is not essential.",
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

export function buildGroceryOrganizationPrompt(
  days: Array<{
    dateISO: string;
    meals: Array<{
      mealType: string;
      title: string;
      ingredients: string[];
    }>;
  }>,
  userContext: MealPlannerUserContext,
) {
  const plannerLanguage = resolvePlannerLanguage(userContext.language);
  const groceryInput = days.map((day) => ({
    dateISO: day.dateISO,
    meals: day.meals.map((meal) => ({
      mealType: meal.mealType,
      title: compactText(meal.title, 40),
      ingredients: compactArray(meal.ingredients, 8),
    })),
  }));

  return [
    `Organize one weekly grocery list in ${plannerLanguage} for Planner Hub.`,
    "Return strict JSON only.",
    "You are organizing a supermarket-ready shopping list, not rewriting the weekly plan.",
    "Rules:",
    `- All grocery titles and quantities must be in ${plannerLanguage}.`,
    "- Consolidate equivalent or near-equivalent ingredient variants into one human-friendly grocery item.",
    "- Remove preparation-only noise when it is not essential for shopping.",
    "- Group all items into these fixed supermarket keys only: produce, dairy_fridge, meats, pantry, bakery, frozen, snacks, spices.",
    "- Each group title must match the output language naturally.",
    "- Each item needs a short stable key, a shopper-friendly label, and one compact quantity string.",
    "- Do not duplicate items across groups.",
    "- Prefer one merged item over several slightly different variants.",
    "- Example: treat حمص / حمص معلب / حمّص معلب مصفّى as one grocery item unless the difference matters for shopping.",
    `Weekly ingredients source: ${compactJson(groceryInput)}.`,
  ].join("\n");
}

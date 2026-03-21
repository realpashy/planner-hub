import { addDays, format, startOfWeek } from "date-fns";
import type {
  AiDayPlan,
  AiMeal,
  AiProviderUsage,
  AiWeekPlan,
  EditMealAiInput,
  GenerateWeekAiInput,
  RegenerateDayAiInput,
} from "@shared/ai/ai-types";
import { getMealDataset, type DatasetMeal } from "./catalog";

function normalizeExclusions(input: unknown) {
  return Array.isArray(input)
    ? input.map((item) => String(item).trim().toLowerCase()).filter(Boolean)
    : [];
}

function getMealsPerDay(preferences: Record<string, unknown>) {
  const value = Number(preferences.mealsPerDay ?? 3);
  return value === 2 || value === 3 || value === 4 ? value : 3;
}

function getTargetCalories(preferences: Record<string, unknown>, mealType: AiMeal["mealType"]) {
  const total = Math.max(1200, Math.min(4000, Number(preferences.caloriesTarget ?? 1900)));
  const mealsPerDay = getMealsPerDay(preferences);
  if (mealsPerDay === 2) {
    return mealType === "lunch" ? total * 0.45 : mealType === "dinner" ? total * 0.55 : 0;
  }
  if (mealsPerDay === 3) {
    return mealType === "breakfast" ? total * 0.25 : mealType === "lunch" ? total * 0.4 : mealType === "dinner" ? total * 0.35 : 0;
  }
  return mealType === "breakfast" ? total * 0.22 : mealType === "lunch" ? total * 0.33 : mealType === "dinner" ? total * 0.3 : total * 0.15;
}

function matchesDiet(item: DatasetMeal, dietType: string) {
  return dietType === "any" ? true : item.dietTypes.includes(dietType);
}

function filterCatalog(dataset: DatasetMeal[], preferences: Record<string, unknown>, mealType?: DatasetMeal["mealType"]) {
  const exclusions = normalizeExclusions(preferences.exclusions);
  const dietType = String(preferences.dietType ?? "any");
  const budgetFriendly = Boolean(preferences.budgetFriendly);
  const lowEffort = Boolean(preferences.lowEffort);
  return dataset.filter((item) => {
    if (mealType && item.mealType !== mealType) return false;
    if (!matchesDiet(item, dietType)) return false;
    if (budgetFriendly && item.budget === "high") return false;
    if (lowEffort && item.effort === "high") return false;
    return !exclusions.some((entry) => item.ingredients.some((ingredient) => ingredient.toLowerCase().includes(entry)) || item.exclusions.some((x) => x.toLowerCase().includes(entry)));
  });
}

function sortPool(pool: DatasetMeal[], targetCalories: number, usedTitles: Set<string>, preferVariety: boolean, allowRepetition: boolean) {
  return [...pool].sort((a, b) => {
    const aPenalty = (!allowRepetition && usedTitles.has(a.title) ? 2000 : 0) + (preferVariety && usedTitles.has(a.title) ? 400 : 0);
    const bPenalty = (!allowRepetition && usedTitles.has(b.title) ? 2000 : 0) + (preferVariety && usedTitles.has(b.title) ? 400 : 0);
    return Math.abs(a.calories - targetCalories) + aPenalty - (Math.abs(b.calories - targetCalories) + bPenalty);
  });
}

function toAiMeal(item: DatasetMeal): AiMeal {
  return {
    mealType: item.mealType,
    title: item.title,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    tags: item.tags.slice(0, 6),
    ingredients: item.ingredients.slice(0, 10),
    shortNote: item.tags.slice(0, 2).join(" • "),
    image: item.image,
    imageType: item.imageType,
    imageSource: item.imageSource,
  };
}

function getWeekDays(referenceDate = new Date()) {
  const start = startOfWeek(referenceDate, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export async function generateWeeklyPlanLocal(input: GenerateWeekAiInput): Promise<{ plan: AiWeekPlan; usage: AiProviderUsage }> {
  const dataset = await getMealDataset();
  const mealsPerDay = getMealsPerDay(input.preferences);
  const mealTypes: AiMeal["mealType"][] =
    mealsPerDay === 2
      ? ["lunch", "dinner"]
      : mealsPerDay === 3
        ? ["breakfast", "lunch", "dinner"]
        : ["breakfast", "lunch", "dinner", "snack"];
  const usedTitles = new Set<string>();
  const preferVariety = input.preferences.preferVariety !== false;
  const allowRepetition = input.preferences.allowRepetition !== false;
  const sameBreakfastDaily = Boolean(input.preferences.sameBreakfastDaily);
  const breakfastPool = filterCatalog(dataset, input.preferences, "breakfast");
  const recurringBreakfast = sameBreakfastDaily ? sortPool(breakfastPool, getTargetCalories(input.preferences, "breakfast"), usedTitles, preferVariety, allowRepetition)[0] : null;
  const days = getWeekDays().map((day, index) => {
    const meals = mealTypes.map((mealType) => {
      const pool = filterCatalog(dataset, input.preferences, mealType);
      const item =
        mealType === "breakfast" && recurringBreakfast
          ? recurringBreakfast
          : sortPool(pool, getTargetCalories(input.preferences, mealType), usedTitles, preferVariety, allowRepetition)[0] ?? pool[0] ?? dataset.find((entry) => entry.mealType === mealType)!;
      usedTitles.add(item.title);
      return toAiMeal(item);
    });
    return {
      dateISO: format(day, "yyyy-MM-dd"),
      meals,
      waterTargetCups: Math.max(8, Number(input.userContext.timezone ? 8 : 8)),
      notes: index === 0 ? "ابدأ بالأطباق الأسرع هذا الأسبوع للحفاظ على الاستمرارية." : "",
    } satisfies AiDayPlan;
  });

  return {
    plan: {
      summary: "خطة أسبوعية متوازنة تم توليدها محليًا مع مراعاة تفضيلاتك الحالية.",
      days,
    },
    usage: { inputTokens: 0, outputTokens: 0 },
  };
}

export async function editMealLocal(input: EditMealAiInput): Promise<{ meal: AiMeal; usage: AiProviderUsage }> {
  const dataset = await getMealDataset();
  const existingMealType = String(input.existingMeal.mealType || "lunch") as AiMeal["mealType"];
  const pool = filterCatalog(dataset, { dietType: "any", exclusions: input.userContext.avoidIngredients ?? [] }, existingMealType);
  const request = input.editRequest.toLowerCase();
  const candidate =
    pool.find((item) => request && (item.title.toLowerCase().includes(request) || item.tags.some((tag) => tag.toLowerCase().includes(request)))) ??
    pool[0] ??
    dataset.find((item) => item.mealType === existingMealType)!;
  return {
    meal: toAiMeal(candidate),
    usage: { inputTokens: 0, outputTokens: 0 },
  };
}

export async function regenerateDayLocal(input: RegenerateDayAiInput): Promise<{ day: AiDayPlan; usage: AiProviderUsage }> {
  const week = await generateWeeklyPlanLocal({
    action: "generate_week",
    preferences: input.preferences,
    userContext: input.userContext,
  });
  const sameDate = String(input.existingDay.dateISO || week.plan.days[0]?.dateISO || "");
  const day = week.plan.days.find((entry) => entry.dateISO === sameDate) ?? week.plan.days[0];
  return {
    day,
    usage: week.usage,
  };
}

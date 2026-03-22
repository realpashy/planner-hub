import type {
  AiDayPlan,
  AiMeal,
  AiProviderUsage,
  AiWeekPlan,
  EditMealAiInput,
  GenerateWeekAiInput,
  RegenerateDayAiInput,
} from "../../shared/ai/ai-types";
import { getMealDataset, type DatasetMeal } from "./catalog";

function normalizeList(input: unknown) {
  return Array.isArray(input)
    ? input.map((item) => String(item).trim().toLowerCase()).filter(Boolean)
    : [];
}

function getMealsPerDay(preferences: Record<string, unknown>) {
  const base = Number(preferences.mealsPerDay ?? 3);
  const snacks = Boolean(preferences.snacks);
  if (base <= 2) return ["breakfast", "dinner"] as const;
  if (base === 3 && !snacks) return ["breakfast", "lunch", "dinner"] as const;
  return ["breakfast", "lunch", "dinner", "snack"] as const;
}

function getMealTargetCalories(preferences: Record<string, unknown>, mealType: AiMeal["mealType"]) {
  const total = Math.max(1200, Math.min(4000, Number(preferences.caloriesTarget ?? 1900)));
  const split = getMealsPerDay(preferences);
  const portion =
    split.length === 2
      ? mealType === "breakfast"
        ? 0.45
        : 0.55
      : split.length === 3
        ? mealType === "breakfast"
          ? 0.25
          : mealType === "lunch"
            ? 0.4
            : 0.35
        : mealType === "breakfast"
          ? 0.22
          : mealType === "lunch"
            ? 0.32
            : mealType === "dinner"
              ? 0.28
              : 0.18;
  return Math.round(total * portion);
}

function matchesDiet(item: DatasetMeal, dietType: string) {
  return dietType === "any" ? true : item.dietTypes.includes(dietType);
}

function matchesRestrictions(item: DatasetMeal, restrictions: string[]) {
  if (!restrictions.length) return true;
  const haystack = [...item.ingredients, ...item.exclusions, ...item.tags, item.title]
    .join(" ")
    .toLowerCase();
  return !restrictions.some((entry) => haystack.includes(entry));
}

function getPool(dataset: DatasetMeal[], preferences: Record<string, unknown>, mealType: DatasetMeal["mealType"]) {
  const restrictions = [
    ...normalizeList(preferences.allergies),
    ...normalizeList(preferences.dislikedIngredients),
    ...normalizeList(preferences.dislikedMeals),
    ...normalizeList(preferences.exclusions),
  ];
  const dietType = String(preferences.dietType ?? "any");
  const lowEffort = Boolean(preferences.lowEffort) || preferences.cookingTime === "short";
  return dataset.filter((item) => {
    if (item.mealType !== mealType) return false;
    if (!matchesDiet(item, dietType)) return false;
    if (!matchesRestrictions(item, restrictions)) return false;
    if (lowEffort && item.effort === "high") return false;
    if (Boolean(preferences.budgetFriendly) && item.budget === "high") return false;
    return true;
  });
}

function scoreMeal(item: DatasetMeal, targetCalories: number, mode: string, busyDay: boolean, usedTitles: Set<string>) {
  let score = Math.abs(item.calories - targetCalories);
  if (busyDay && item.effort === "high") score += 180;
  if (mode === "high_protein") score -= item.protein * 3;
  if (mode === "vegetarian" && item.dietTypes.includes("vegetarian")) score -= 90;
  if (mode === "faster") score += item.effort === "high" ? 150 : item.effort === "medium" ? 35 : -50;
  if (usedTitles.has(item.title)) score += 95;
  return score;
}

function chooseMeal(
  pool: DatasetMeal[],
  targetCalories: number,
  mode: "default" | "higher_protein" | "faster" | "vegetarian" | "similar",
  busyDay: boolean,
  usedTitles: Set<string>,
) {
  const ranked = [...pool].sort(
    (a, b) => scoreMeal(a, targetCalories, mode, busyDay, usedTitles) - scoreMeal(b, targetCalories, mode, busyDay, usedTitles),
  );
  return ranked[0] ?? pool[0];
}

function mealReason(item: DatasetMeal, busyDay: boolean) {
  if (busyDay && item.effort === "low") return "يناسب اليوم المزدحم ويقلل وقت التحضير.";
  if (item.protein >= 28) return "يدعم الشبع ويعزز البروتين خلال اليوم.";
  if (item.tags.includes("make_ahead")) return "يسهّل التخطيط ويقلل ضغط الطبخ لاحقًا.";
  return "يحافظ على توازن يومك ويستخدم مكونات عملية.";
}

function toAiMeal(item: DatasetMeal, busyDay: boolean): AiMeal {
  return {
    mealType: item.mealType,
    title: item.title,
    ingredients: item.ingredients.slice(0, 8),
    steps: [
      "جهّز المكونات الأساسية.",
      item.effort === "low" ? "اطبخ أو قدّم مباشرة." : "اطبخ ثم قدّم الطبق دافئًا.",
      "قدّم مع إضافة خفيفة مناسبة.",
    ].slice(0, item.effort === "low" ? 2 : 3),
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    tags: item.tags.slice(0, 4),
    reason: mealReason(item, busyDay),
    shortTip: busyDay ? "اليوم مزدحم، فاخترنا طبقًا سريع التحضير." : "وجبة متوازنة تناسب نسق الأسبوع.",
    image: item.image,
    imageType: item.imageType,
    imageSource: item.imageSource,
  };
}

function getWaterTarget(preferences: Record<string, unknown>) {
  const activity = String(preferences.activityLevel ?? "moderate");
  const base = 8;
  if (activity === "high") return 11;
  if (activity === "low") return 8;
  return 9;
}

function getDayTip(busyDay: boolean, meals: AiMeal[]) {
  if (busyDay) return "ركّز على التحضير السريع والوجبات المباشرة اليوم.";
  if (meals.some((meal) => meal.tags.includes("protein"))) return "في هذا اليوم تم دعم البروتين بشكل أوضح.";
  return "وزّع الماء على اليوم لتحافظ على الإيقاع.";
}

export async function generateWeeklyPlanLocal(input: GenerateWeekAiInput): Promise<{ plan: AiWeekPlan; usage: AiProviderUsage }> {
  const dataset = await getMealDataset();
  const busyDays = new Set(normalizeList(input.preferences.busyDays));
  const mealTypes = getMealsPerDay(input.preferences);
  const usedTitles = new Set<string>();
  const days = input.activeDates.map((dateISO) => {
    const weekday = new Date(`${dateISO}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }).toLowerCase();
    const busyDay = busyDays.has(weekday);
    const meals = mealTypes.map((mealType) => {
      const pool = getPool(dataset, input.preferences, mealType);
      const meal =
        chooseMeal(pool, getMealTargetCalories(input.preferences, mealType), "default", busyDay, usedTitles) ??
        dataset.find((item) => item.mealType === mealType)!;
      usedTitles.add(meal.title);
      return toAiMeal(meal, busyDay);
    });
    return {
      dateISO,
      tip: getDayTip(busyDay, meals),
      notes: busyDay ? "تم تبسيط اليوم لأنه يوم مزدحم." : "",
      waterTargetCups: getWaterTarget(input.preferences),
      meals,
    } satisfies AiDayPlan;
  });

  return {
    plan: {
      summary: "خطة أساسية متوازنة مبنية محليًا وفق تفضيلاتك الحالية.",
      insights: [
        "ابدأ بالأيام الأبسط ثم ثبّت الإيقاع قبل التعديلات الكثيرة.",
        "ركّز على الماء بين الوجبات لدعم الاستمرارية.",
      ],
      days,
    },
    usage: { inputTokens: 0, outputTokens: 0 },
  };
}

export async function editMealLocal(input: EditMealAiInput): Promise<{ meal: AiMeal; usage: AiProviderUsage }> {
  const dataset = await getMealDataset();
  const mealType = String(input.existingMeal.mealType || "lunch") as AiMeal["mealType"];
  const request = input.editRequest.toLowerCase();
  const pool = dataset.filter((item) => item.mealType === mealType);
  const mode =
    request.includes("protein") ? "higher_protein" :
    request.includes("vegetarian") ? "vegetarian" :
    request.includes("fast") || request.includes("quick") ? "faster" :
    request.includes("similar") ? "similar" :
    "default";

  const currentCalories = Number(input.existingMeal.calories ?? 450);
  const choice = chooseMeal(pool, currentCalories, mode, false, new Set([String(input.existingMeal.title || "")])) ?? pool[0];
  return {
    meal: toAiMeal(choice, false),
    usage: { inputTokens: 0, outputTokens: 0 },
  };
}

export async function regenerateDayLocal(input: RegenerateDayAiInput): Promise<{ day: AiDayPlan; usage: AiProviderUsage }> {
  const result = await generateWeeklyPlanLocal({
    action: "generate_week",
    preferences: input.preferences,
    activeDates: [String(input.existingDay.dateISO || new Date().toISOString().slice(0, 10))],
    userContext: input.userContext,
  });

  return {
    day: result.plan.days[0],
    usage: result.usage,
  };
}

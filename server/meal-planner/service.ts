import { z } from "zod";
import type { AiActionType, GenerateWeekAiInput, MealPlannerUserContext } from "../../shared/ai/ai-types.ts";
import { estimateAiCostUsd } from "../../shared/ai/ai-costs.ts";
import { DEFAULT_AI_FEATURE_FLAGS } from "../../shared/ai/ai-feature-flags.ts";
import { getModuleEntitlements } from "../../shared/modules/module-entitlements.ts";
import { getPlanTierConfig } from "../../shared/plans/feature-access.ts";
import {
  createMealPlanVersion,
  deactivateActiveMealPlan,
  getActiveMealPlan,
  getCloudData,
  getMealPlannerDebugLog,
  getFeatureFlags as getPersistedFeatureFlags,
  getLatestMealPlan,
  getOrCreateAiUsageRows,
  getOrCreateProfile,
  getSavedMealPlanContext,
  incrementAiUsage,
  recordOverLimitAttempt,
  replaceMealPlannerDebugLog,
  saveMealPlannerPreferences,
  saveSavedMealPlan,
  updateMealPlanVersion,
} from "../persistence.ts";
import { editMealAI, generateWeeklyPlanAI, regenerateDayAI } from "./openai-provider.ts";

const generateWeekInputSchema = z.object({
  preferences: z.record(z.unknown()),
  replaceCurrent: z.boolean().optional(),
});

const editMealInputSchema = z.object({
  dateISO: z.string(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  existingMeal: z.record(z.unknown()),
  editRequest: z.string().min(1),
});

const regenerateDayInputSchema = z.object({
  dateISO: z.string(),
  existingDay: z.record(z.unknown()),
  preferences: z.record(z.unknown()),
});

const updateGroceryItemInputSchema = z.object({
  itemKey: z.string().min(1),
  removed: z.boolean(),
});

function todayKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function currentMonthKey(todayISO = todayKey()) {
  return todayISO.slice(0, 7);
}

function isoToDate(dateISO: string) {
  return new Date(`${dateISO}T12:00:00Z`);
}

function addDays(dateISO: string, delta: number) {
  const date = isoToDate(dateISO);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function currentWeekStart(todayISO = todayKey()) {
  return addDays(todayISO, -isoToDate(todayISO).getUTCDay());
}

function activeDates(todayISO = todayKey()) {
  const today = isoToDate(todayISO);
  return Array.from({ length: 7 - today.getUTCDay() }, (_, index) => addDays(todayISO, index));
}

function defaultPreferences() {
  return {
    dietType: "balanced",
    mealsPerDay: 3,
    snacks: true,
    cuisinePreferences: [],
    allergies: [],
    dislikedIngredients: [],
    dislikedMeals: [],
    foodRules: [],
    ingredientsAtHome: [],
    goal: "eat_healthier",
    caloriesTarget: 1900,
    age: null,
    sex: "male",
    heightCm: null,
    weightKg: null,
    activityLevel: "moderate",
    workout: false,
    cookingTime: "medium",
    skillLevel: "beginner",
    repeatMeals: true,
    leftovers: true,
    maxIngredients: 8,
    quickMealsPreference: true,
    busyDays: [],
    fastingEnabled: false,
    fastingWindow: "12:00 - 20:00",
    additionalNotes: "",
  };
}

function getLimits(role: string) {
  if (role === "admin" || role === "super_admin") {
    return { generationsPerMonth: null, dayRegenerationsPerMonth: null, mealSwapsPerMonth: null };
  }
  return { generationsPerMonth: 2, dayRegenerationsPerMonth: 5, mealSwapsPerMonth: 10 };
}

function featureFlagBoolean(flags: Record<string, unknown>, key: keyof typeof DEFAULT_AI_FEATURE_FLAGS) {
  const value = flags[key];
  return typeof value === "boolean" ? value : DEFAULT_AI_FEATURE_FLAGS[key];
}

function toUsageData(usageData: Record<string, unknown> | null | undefined) {
  return {
    monthlyGenerationsUsed: Number(usageData?.monthlyGenerationsUsed ?? 0),
    swapsUsed: Number(usageData?.swapsUsed ?? 0),
    dayRegenerationsUsed: Number(usageData?.dayRegenerationsUsed ?? 0),
    monthKey: String(usageData?.monthKey ?? currentMonthKey()),
  };
}

function planRowToClient(
  row: Awaited<ReturnType<typeof getActiveMealPlan>>,
  monthlyUsage?: {
    fullGenerationsUsed: number;
    lightEditsUsed: number;
    dayRegenerationsUsed: number;
    mealSwapsUsed: number;
  },
) {
  if (!row) return null;
  const planData = row.planData ?? {};
  return {
    id: row.id,
    weekStart: row.weekStart,
    version: row.version,
    isActive: row.isActive,
    source: "ai" as const,
    summary: String(planData.summary ?? ""),
    days: Array.isArray(planData.days) ? planData.days : [],
    grocery: Array.isArray(planData.grocery) ? planData.grocery : [],
    suggestions: planData.suggestions && typeof planData.suggestions === "object"
      ? planData.suggestions
      : {
          nutritionInsight: "",
          habitSuggestion: "",
          supplementPlaceholder: "مكان مخصص لاحقًا لاقتراحات المكملات.",
        },
    removedGroceryKeys: Array.isArray(planData.removedGroceryKeys) ? planData.removedGroceryKeys.map(String) : [],
    usage: {
      monthlyGenerationsUsed: monthlyUsage?.fullGenerationsUsed ?? Number(row.usageData.monthlyGenerationsUsed ?? 0),
      swapsUsed: monthlyUsage?.mealSwapsUsed ?? Number(row.usageData.swapsUsed ?? 0),
      dayRegenerationsUsed: monthlyUsage?.dayRegenerationsUsed ?? Number(row.usageData.dayRegenerationsUsed ?? 0),
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function normalizeSavedPreferences(raw: unknown) {
  return raw && typeof raw === "object" ? { ...defaultPreferences(), ...(raw as Record<string, unknown>) } : defaultPreferences();
}

function preferencesSignature(value: Record<string, unknown>) {
  const stable = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(stable);
    if (input && typeof input === "object") {
      return Object.keys(input as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = stable((input as Record<string, unknown>)[key]);
          return acc;
        }, {});
    }
    return input;
  };
  return JSON.stringify(stable(value));
}

async function buildUserContext(userId: string, timezoneFallback = "Asia/Jerusalem"): Promise<MealPlannerUserContext> {
  const profile = await getOrCreateProfile(userId, "user");
  const cloudData = await getCloudData(userId);
  const savedPlanSummaries = await getSavedMealPlanContext(userId);
  const latestPlan = await getLatestMealPlan(userId);
  const mealData = (cloudData.mealData && typeof cloudData.mealData === "object" ? cloudData.mealData : {}) as Record<string, any>;
  const favorites = Array.isArray(mealData.favorites) ? mealData.favorites : [];
  const recentMeals = latestPlan?.planData?.days && Array.isArray((latestPlan.planData as Record<string, any>).days)
    ? ((latestPlan.planData as Record<string, any>).days as Array<Record<string, any>>)
        .flatMap((day) => (Array.isArray(day.meals) ? day.meals : []))
        .map((meal) => String((meal as Record<string, unknown>).title ?? ""))
        .filter(Boolean)
        .slice(0, 12)
    : [];

  return {
    timezone: profile.timezone || timezoneFallback,
    tier: profile.planTier,
    dietaryNotes: [
      typeof mealData.preferences?.foodRules?.join === "function" ? mealData.preferences.foodRules.join(", ") : "",
      typeof mealData.preferences?.additionalNotes === "string" ? mealData.preferences.additionalNotes : "",
    ]
      .filter(Boolean)
      .join(". "),
    avoidIngredients: Array.isArray(mealData.preferences?.dislikedIngredients)
      ? mealData.preferences.dislikedIngredients.map(String).slice(0, 6)
      : [],
    recentMeals: recentMeals.slice(0, 4),
    favorites: favorites.slice(0, 4).map((item: any) => ({
      title: String(item.title || ""),
      mealType: String(item.mealType || ""),
      tags: Array.isArray(item.tags) ? item.tags.map(String).slice(0, 2) : [],
    })),
    savedPlanSummaries: savedPlanSummaries.slice(0, 3),
  };
}

async function getProviderDecision(userId: string, action: AiActionType) {
  const profile = await getOrCreateProfile(userId, "user");
  const flags = await getPersistedFeatureFlags();
  const aiEnabled = profile.aiEnabled && featureFlagBoolean(flags, "meal_planner.ai_enabled");
  const isAdmin = profile.role === "admin" || profile.role === "super_admin" || profile.planTier === "admin";
  const dateKey = todayKey();
  const monthKey = currentMonthKey(dateKey);
  const usageRows = await getOrCreateAiUsageRows(userId, dateKey, monthKey);
  const limits = getLimits(profile.role);
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);

  return {
    profile,
    isAdmin,
    usageRows,
    quota: {
      allowed: aiEnabled && hasOpenAiKey,
      tier: profile.planTier,
      provider: "openai" as const,
      reason: !aiEnabled ? "ai_disabled" : !hasOpenAiKey ? "feature_disabled" : undefined,
      isAdmin,
      usesCreditPack: false,
      remainingFullGenerationsToday: null,
      remainingLightEditsToday: null,
      remainingFullGenerationsMonth: limits.generationsPerMonth === null ? null : Math.max(0, limits.generationsPerMonth - usageRows.monthly.fullGenerationsUsed),
      remainingLightEditsMonth: limits.mealSwapsPerMonth === null ? null : Math.max(0, limits.mealSwapsPerMonth - usageRows.monthly.mealSwapsUsed),
      action,
    },
  };
}

function buildSuggestions(plan: Record<string, unknown>) {
  const insights = Array.isArray(plan.insights) ? plan.insights.map(String) : [];
  return {
    nutritionInsight: insights[0] ?? "حافظ على مصدر بروتين واضح في منتصف اليوم.",
    habitSuggestion: insights[1] ?? "جهّز عنصرًا واحدًا مسبقًا لتسهيل الأسبوع.",
    supplementPlaceholder: "مكان مخصص لاحقًا لاقتراحات المكملات عند تفعيلها.",
  };
}

function buildStoredPlan(plan: Record<string, unknown>) {
  return {
    summary: String(plan.summary ?? ""),
    days: Array.isArray(plan.days) ? plan.days : [],
    grocery: [],
    removedGroceryKeys: [],
    suggestions: buildSuggestions(plan),
  };
}

function createDebugLogEntry(stage: string, message: string) {
  return {
    id: `${stage}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    stage,
    message,
    createdAt: new Date().toISOString(),
  };
}

async function buildPlannerStateForUser(userId: string) {
  const [profile, cloudData, usageRows, debugLog] = await Promise.all([
    getOrCreateProfile(userId, "user"),
    getCloudData(userId),
    getOrCreateAiUsageRows(userId, todayKey(), currentMonthKey()),
    getMealPlannerDebugLog(userId),
  ]);
  const weekStart = currentWeekStart();
  const rawActivePlan = await getActiveMealPlan(userId, weekStart);
  const activePlan = rawActivePlan?.source === "ai" ? rawActivePlan : rawActivePlan;
  const mealData = cloudData.mealData && typeof cloudData.mealData === "object" ? (cloudData.mealData as Record<string, unknown>) : {};
  const savedPreferences = normalizeSavedPreferences(mealData.preferences);
  const plannerState = activePlan ? "planner" : "onboarding";

  return {
    role: profile.role,
    tier: profile.planTier,
    timezone: profile.timezone || "Asia/Jerusalem",
    preferences: activePlan?.preferences ? normalizeSavedPreferences(activePlan.preferences) : savedPreferences,
    savedPreferences,
    activePlan: planRowToClient(activePlan, usageRows.monthly),
    limits: getLimits(profile.role),
    plannerState,
    adminDebugLog: profile.role === "admin" || profile.role === "super_admin" ? debugLog : [],
  };
}

export async function getMealPlannerStateForUser(userId: string) {
  return buildPlannerStateForUser(userId);
}

export async function saveMealPlannerPreferencesForUser(userId: string, preferences: unknown) {
  await saveMealPlannerPreferences(userId, preferences);
  return buildPlannerStateForUser(userId);
}

export async function getAiQuotaStatus(userId: string) {
  const { profile, usageRows, quota } = await getProviderDecision(userId, "generate_week");
  const limits = getLimits(profile.role);
  return {
    tier: profile.planTier,
    role: profile.role,
    aiEnabled: quota.allowed,
    entitlements: getModuleEntitlements(profile.planTier),
    remainingFullGenerationsToday: null,
    remainingLightEditsToday: null,
    remainingFullGenerationsMonth: limits.generationsPerMonth === null ? null : Math.max(0, limits.generationsPerMonth - usageRows.monthly.fullGenerationsUsed),
    remainingLightEditsMonth: limits.mealSwapsPerMonth === null ? null : Math.max(0, limits.mealSwapsPerMonth - usageRows.monthly.mealSwapsUsed),
    remainingDayRegenerationsMonth: limits.dayRegenerationsPerMonth === null ? null : Math.max(0, limits.dayRegenerationsPerMonth - usageRows.monthly.dayRegenerationsUsed),
  };
}

export async function generateWeekForUser(userId: string, body: unknown) {
  const parsed = generateWeekInputSchema.parse(body);
  const { profile, usageRows, quota, isAdmin } = await getProviderDecision(userId, "generate_week");
  const weekStart = currentWeekStart();

  if (!quota.allowed) {
    throw Object.assign(new Error("Meal planner AI is currently unavailable."), { status: 503, code: "MEAL_PLANNER_AI_UNAVAILABLE" });
  }

  if (!isAdmin && usageRows.monthly.fullGenerationsUsed >= 2) {
    await recordOverLimitAttempt(userId);
    throw Object.assign(new Error("Plan generation limit reached"), { status: 429, code: "PLAN_GENERATION_LIMIT" });
  }

  await saveMealPlannerPreferences(userId, parsed.preferences);
  const currentPlan = await getActiveMealPlan(userId, weekStart);
  const nextSignature = preferencesSignature(normalizeSavedPreferences(parsed.preferences));
  const currentSignature = currentPlan ? preferencesSignature(normalizeSavedPreferences(currentPlan.preferences)) : null;
  if (currentPlan && currentPlan.source === "ai" && currentSignature === nextSignature && !parsed.replaceCurrent) {
    const cachedDebugLog = [
      createDebugLogEntry("generate_week_cached", "Returned cached AI plan for identical week and preferences."),
    ];
    await replaceMealPlannerDebugLog(userId, cachedDebugLog);
    return {
      state: await buildPlannerStateForUser(userId),
      provider: "openai" as const,
      source: "ai" as const,
      debug: profile.role === "admin" || profile.role === "super_admin" ? "Returned cached AI plan for identical week and preferences." : null,
      activePlan: planRowToClient(currentPlan, usageRows.monthly),
      cached: true,
    };
  }

  const userContext = await buildUserContext(userId, profile.timezone);
  const generationDebugLog = [
    createDebugLogEntry("generate_week_started", `Starting AI generation for week ${weekStart}`),
  ];
  await replaceMealPlannerDebugLog(userId, generationDebugLog);

  const result = await generateWeeklyPlanAI(
    {
      action: "generate_week",
      preferences: parsed.preferences,
      activeDates: activeDates(),
      userContext,
    } satisfies GenerateWeekAiInput,
    {
      onProgress: async (progress) => {
        generationDebugLog.unshift(createDebugLogEntry(progress.stage, progress.message));
        if (!progress.stage.startsWith("weekly_day_")) {
          await replaceMealPlannerDebugLog(userId, generationDebugLog);
        }
      },
    },
  ).catch(async (error) => {
    generationDebugLog.unshift(
      createDebugLogEntry("generate_week_failed", error instanceof Error ? error.message : "Meal planner AI failed to generate the week."),
    );
    await replaceMealPlannerDebugLog(userId, generationDebugLog);
    throw Object.assign(new Error(error instanceof Error ? error.message : "Meal planner AI failed to generate the week."), {
      status: 502,
      code: "MEAL_PLANNER_GENERATION_FAILED",
    });
  });

  const planData = buildStoredPlan(result.plan as unknown as Record<string, unknown>);
  const created = await createMealPlanVersion(userId, {
    weekStart,
    preferences: parsed.preferences,
    planData,
    usageData: toUsageData({
      monthlyGenerationsUsed: usageRows.monthly.fullGenerationsUsed + 1,
      swapsUsed: usageRows.monthly.mealSwapsUsed,
      dayRegenerationsUsed: usageRows.monthly.dayRegenerationsUsed,
      monthKey: currentMonthKey(),
    }),
    source: "ai",
  });

  await incrementAiUsage({
    userId,
    actionType: "generate_week",
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    estimatedCostUsd: estimateAiCostUsd(result.usage.inputTokens, result.usage.outputTokens),
    useCreditPack: false,
  });

  await saveSavedMealPlan(userId, {
    weekKey: `${weekStart}:${nextSignature}`,
    preferences: parsed.preferences,
    planData,
    source: "ai",
  });

  generationDebugLog.unshift(
    createDebugLogEntry(
      "generate_week_succeeded",
      `OpenAI ${result.meta.model} in ${result.meta.elapsedMs}ms • prompt ${result.usage.inputTokens} • completion ${result.usage.outputTokens}`,
    ),
  );
  await replaceMealPlannerDebugLog(userId, generationDebugLog);

  return {
    state: await buildPlannerStateForUser(userId),
    provider: "openai" as const,
    source: "ai" as const,
    debug:
      profile.role === "admin" || profile.role === "super_admin"
        ? `OpenAI ${result.meta.model} in ${result.meta.elapsedMs}ms • prompt ${result.usage.inputTokens} • completion ${result.usage.outputTokens} • budget ${result.meta.completionBudget}`
        : null,
    activePlan: planRowToClient(created, {
      ...usageRows.monthly,
      fullGenerationsUsed: usageRows.monthly.fullGenerationsUsed + 1,
    }),
  };
}

export async function editMealForUser(userId: string, body: unknown) {
  const parsed = editMealInputSchema.parse(body);
  const weekStart = currentWeekStart();
  const plan = await getActiveMealPlan(userId, weekStart);
  if (!plan) throw Object.assign(new Error("No active plan"), { status: 404 });

  const { profile, usageRows, quota, isAdmin } = await getProviderDecision(userId, "replace_meal");
  const limits = getLimits(profile.role);

  if (!quota.allowed) {
    throw Object.assign(new Error("Meal planner AI is currently unavailable."), { status: 503, code: "MEAL_PLANNER_AI_UNAVAILABLE" });
  }

  if (!isAdmin && limits.mealSwapsPerMonth !== null && usageRows.monthly.mealSwapsUsed >= limits.mealSwapsPerMonth) {
    await recordOverLimitAttempt(userId);
    throw Object.assign(new Error("Meal swap limit reached"), { status: 429, code: "PLAN_SWAP_LIMIT" });
  }

  const userContext = await buildUserContext(userId, profile.timezone);
  const result = await editMealAI({
    action: "replace_meal",
    existingMeal: parsed.existingMeal,
    editRequest: parsed.editRequest,
    userContext,
  }).catch((error) => {
    throw Object.assign(new Error(error instanceof Error ? error.message : "Meal planner AI failed to regenerate the meal."), {
      status: 502,
      code: "MEAL_PLANNER_MEAL_FAILED",
    });
  });

  const nextPlanData = { ...(plan.planData as Record<string, any>) };
  nextPlanData.days = Array.isArray(nextPlanData.days)
    ? nextPlanData.days.map((day: Record<string, any>) => {
        if (String(day.dateISO) !== parsed.dateISO) return day;
        return {
          ...day,
          meals: Array.isArray(day.meals)
            ? day.meals.map((meal: Record<string, any>) => (String(meal.mealType) === parsed.mealType ? result.meal : meal))
            : day.meals,
        };
      })
    : [];

  const updated = await updateMealPlanVersion(plan.id, {
    planData: nextPlanData,
    usageData: toUsageData({
      monthlyGenerationsUsed: usageRows.monthly.fullGenerationsUsed,
      swapsUsed: usageRows.monthly.mealSwapsUsed + 1,
      dayRegenerationsUsed: usageRows.monthly.dayRegenerationsUsed,
      monthKey: currentMonthKey(),
    }),
  });

  await incrementAiUsage({
    userId,
    actionType: "replace_meal",
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    estimatedCostUsd: estimateAiCostUsd(result.usage.inputTokens, result.usage.outputTokens),
    useCreditPack: false,
  });

  return {
    meal: result.meal,
    activePlan: planRowToClient(updated, {
      ...usageRows.monthly,
      mealSwapsUsed: usageRows.monthly.mealSwapsUsed + 1,
    }),
    provider: "openai" as const,
    source: "ai" as const,
    debug:
      profile.role === "admin" || profile.role === "super_admin"
        ? `OpenAI ${result.usage.inputTokens}/${result.usage.outputTokens} tokens • ${result.meta.elapsedMs}ms`
        : null,
  };
}

export async function regenerateDayForUser(userId: string, body: unknown) {
  const parsed = regenerateDayInputSchema.parse(body);
  const weekStart = currentWeekStart();
  const plan = await getActiveMealPlan(userId, weekStart);
  if (!plan) throw Object.assign(new Error("No active plan"), { status: 404 });

  const { profile, usageRows, quota, isAdmin } = await getProviderDecision(userId, "regenerate_day");
  const limits = getLimits(profile.role);

  if (!quota.allowed) {
    throw Object.assign(new Error("Meal planner AI is currently unavailable."), { status: 503, code: "MEAL_PLANNER_AI_UNAVAILABLE" });
  }

  if (!isAdmin && limits.dayRegenerationsPerMonth !== null && usageRows.monthly.dayRegenerationsUsed >= limits.dayRegenerationsPerMonth) {
    await recordOverLimitAttempt(userId);
    throw Object.assign(new Error("Day regeneration limit reached"), { status: 429, code: "PLAN_DAY_LIMIT" });
  }

  const userContext = await buildUserContext(userId, profile.timezone);
  const result = await regenerateDayAI({
    action: "regenerate_day",
    existingDay: parsed.existingDay,
    preferences: parsed.preferences,
    userContext,
  }).catch((error) => {
    throw Object.assign(new Error(error instanceof Error ? error.message : "Meal planner AI failed to regenerate the day."), {
      status: 502,
      code: "MEAL_PLANNER_DAY_FAILED",
    });
  });

  const nextPlanData = { ...(plan.planData as Record<string, any>) };
  nextPlanData.days = Array.isArray(nextPlanData.days)
    ? nextPlanData.days.map((day: Record<string, any>) => (String(day.dateISO) === parsed.dateISO ? result.day : day))
    : [];

  const updated = await updateMealPlanVersion(plan.id, {
    planData: nextPlanData,
    usageData: toUsageData({
      monthlyGenerationsUsed: usageRows.monthly.fullGenerationsUsed,
      swapsUsed: usageRows.monthly.mealSwapsUsed,
      dayRegenerationsUsed: usageRows.monthly.dayRegenerationsUsed + 1,
      monthKey: currentMonthKey(),
    }),
  });

  await incrementAiUsage({
    userId,
    actionType: "regenerate_day",
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    estimatedCostUsd: estimateAiCostUsd(result.usage.inputTokens, result.usage.outputTokens),
    useCreditPack: false,
  });

  return {
    day: result.day,
    activePlan: planRowToClient(updated, {
      ...usageRows.monthly,
      dayRegenerationsUsed: usageRows.monthly.dayRegenerationsUsed + 1,
    }),
    provider: "openai" as const,
    source: "ai" as const,
    debug:
      profile.role === "admin" || profile.role === "super_admin"
        ? `OpenAI ${result.usage.inputTokens}/${result.usage.outputTokens} tokens • ${result.meta.elapsedMs}ms`
        : null,
  };
}

export async function updateGroceryItemForUser(userId: string, body: unknown) {
  const parsed = updateGroceryItemInputSchema.parse(body);
  const weekStart = currentWeekStart();
  const plan = await getActiveMealPlan(userId, weekStart);
  if (!plan) throw Object.assign(new Error("No active plan"), { status: 404 });

  const nextPlanData = { ...(plan.planData as Record<string, any>) };
  const currentRemoved = Array.isArray(nextPlanData.removedGroceryKeys)
    ? nextPlanData.removedGroceryKeys.map(String)
    : [];
  const nextRemoved = parsed.removed
    ? Array.from(new Set([...currentRemoved, parsed.itemKey.toLowerCase()]))
    : currentRemoved.filter((itemKey: string) => itemKey !== parsed.itemKey.toLowerCase());

  nextPlanData.removedGroceryKeys = nextRemoved;

  const updated = await updateMealPlanVersion(plan.id, {
    planData: nextPlanData,
    usageData: plan.usageData,
  });

  return {
    state: await buildPlannerStateForUser(userId),
    activePlan: planRowToClient(updated),
  };
}

export async function deleteMealPlanForUser(userId: string, mode: "meals" | "all") {
  await deactivateActiveMealPlan(userId, currentWeekStart());
  if (mode === "all") {
    await saveMealPlannerPreferences(userId, defaultPreferences());
  }
  return buildPlannerStateForUser(userId);
}

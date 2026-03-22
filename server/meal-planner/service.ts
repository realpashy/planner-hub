import { z } from "zod";
import type { AiActionType, GenerateWeekAiInput, MealPlannerUserContext } from "../../shared/ai/ai-types";
import { estimateAiCostUsd } from "../../shared/ai/ai-costs";
import { getPlanTierConfig } from "../../shared/plans/feature-access";
import { getModuleEntitlements } from "../../shared/modules/module-entitlements";
import { DEFAULT_AI_FEATURE_FLAGS } from "../../shared/ai/ai-feature-flags";
import {
  consumeAiCreditPack,
  createMealPlanVersion,
  deactivateActiveMealPlan,
  getActiveMealPlan,
  getCloudData,
  getFeatureFlags as getPersistedFeatureFlags,
  getLatestMealPlan,
  getOrCreateAiUsageRows,
  getOrCreateProfile,
  getSavedMealPlanContext,
  incrementAiUsage,
  recordOverLimitAttempt,
  saveMealPlannerPreferences,
  updateMealPlanVersion,
  countMealPlanVersionsForWeek,
} from "../persistence";
import { editMealLocal, generateWeeklyPlanLocal, regenerateDayLocal } from "./local-provider";
import { editMealAI, generateWeeklyPlanAI, regenerateDayAI } from "./openai-provider";

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
  };
}

function getLimits(role: string) {
  if (role === "admin" || role === "super_admin") {
    return { generationsPerWeek: null, dayRegenerationsPerPlan: null, mealSwapsPerPlan: null };
  }
  return { generationsPerWeek: 2, dayRegenerationsPerPlan: 5, mealSwapsPerPlan: 10 };
}

function featureFlagBoolean(flags: Record<string, unknown>, key: keyof typeof DEFAULT_AI_FEATURE_FLAGS) {
  const value = flags[key];
  return typeof value === "boolean" ? value : DEFAULT_AI_FEATURE_FLAGS[key];
}

function toUsageData(
  usageData: Record<string, unknown> | null | undefined,
  weeklyGenerationsUsed: number,
  overrides?: Partial<{ swapsUsed: number; dayRegenerationsUsed: number }>,
) {
  return {
    weeklyGenerationsUsed,
    swapsUsed: overrides?.swapsUsed ?? Number(usageData?.swapsUsed ?? 0),
    dayRegenerationsUsed: overrides?.dayRegenerationsUsed ?? Number(usageData?.dayRegenerationsUsed ?? 0),
  };
}

function planRowToClient(row: Awaited<ReturnType<typeof getActiveMealPlan>>) {
  if (!row) return null;
  const planData = row.planData ?? {};
  const usageData = row.usageData ?? {};
  return {
    id: row.id,
    weekStart: row.weekStart,
    version: row.version,
    isActive: row.isActive,
    source: row.source === "ai" ? "ai" : "basic",
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
    usage: {
      weeklyGenerationsUsed: Number(usageData.weeklyGenerationsUsed ?? row.version),
      swapsUsed: Number(usageData.swapsUsed ?? 0),
      dayRegenerationsUsed: Number(usageData.dayRegenerationsUsed ?? 0),
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function normalizeSavedPreferences(raw: unknown) {
  return raw && typeof raw === "object" ? { ...defaultPreferences(), ...(raw as Record<string, unknown>) } : defaultPreferences();
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
    dietaryNotes: typeof mealData.preferences?.foodRules?.join === "function" ? mealData.preferences.foodRules.join(", ") : "",
    avoidIngredients: Array.isArray(mealData.preferences?.dislikedIngredients)
      ? mealData.preferences.dislikedIngredients.map(String)
      : [],
    recentMeals,
    favorites: favorites.slice(0, 8).map((item: any) => ({
      title: String(item.title || ""),
      mealType: String(item.mealType || ""),
      tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    })),
    savedPlanSummaries,
  };
}

async function getProviderDecision(userId: string, action: AiActionType) {
  const profile = await getOrCreateProfile(userId, "user");
  const flags = await getPersistedFeatureFlags();
  const aiEnabled = profile.aiEnabled && featureFlagBoolean(flags, "meal_planner.ai_enabled");
  const forceLocal = featureFlagBoolean(flags, "meal_planner.force_local_generation");
  const provider = !aiEnabled || forceLocal || !process.env.OPENAI_API_KEY ? "local" : "openai";
  const isAdmin = profile.role === "admin" || profile.role === "super_admin" || profile.planTier === "admin";

  const dateKey = todayKey();
  const monthKey = dateKey.slice(0, 7);
  const usageRows = await getOrCreateAiUsageRows(userId, dateKey, monthKey);
  const limits = getPlanTierConfig(profile.planTier);
  const remainingFullToday = limits.fullGenerationsPerDay === null ? null : Math.max(0, limits.fullGenerationsPerDay - usageRows.daily.fullGenerationsUsed);
  const remainingLightToday = limits.lightEditsPerDay === null ? null : Math.max(0, limits.lightEditsPerDay - usageRows.daily.lightEditsUsed);
  const remainingFullMonth = limits.fullGenerationsPerMonth === null ? null : Math.max(0, limits.fullGenerationsPerMonth - usageRows.monthly.fullGenerationsUsed);
  const remainingLightMonth = limits.lightEditsPerMonth === null ? null : Math.max(0, limits.lightEditsPerMonth - usageRows.monthly.lightEditsUsed);
  const creditBalance = await consumeAiCreditPack(userId, "peek");

  return {
    profile,
    provider,
    isAdmin,
    quota: {
      allowed: true,
      tier: profile.planTier,
      provider,
      isAdmin,
      usesCreditPack: false,
      remainingFullGenerationsToday: remainingFullToday,
      remainingLightEditsToday: remainingLightToday,
      remainingFullGenerationsMonth: remainingFullMonth,
      remainingLightEditsMonth: remainingLightMonth,
      creditBalance,
      action,
    },
  };
}

function buildSuggestions(plan: Record<string, unknown>, source: "ai" | "basic") {
  const insights = Array.isArray(plan.insights) ? plan.insights.map(String) : [];
  return {
    nutritionInsight: insights[0] ?? (source === "ai" ? "حافظ على مصدر بروتين واضح في منتصف اليوم." : "الخطة الأساسية تركز على التوازن والبساطة."),
    habitSuggestion: insights[1] ?? "جهّز عنصرًا واحدًا مسبقًا لتسهيل الأسبوع.",
    supplementPlaceholder: "مكان مخصص لاحقًا لاقتراحات المكملات عند تفعيلها.",
  };
}

function buildStoredPlan(plan: Record<string, unknown>, source: "ai" | "basic") {
  return {
    summary: String(plan.summary ?? ""),
    days: Array.isArray(plan.days) ? plan.days : [],
    grocery: [],
    suggestions: buildSuggestions(plan, source),
  };
}

async function buildPlannerStateForUser(userId: string) {
  const [profile, cloudData] = await Promise.all([getOrCreateProfile(userId, "user"), getCloudData(userId)]);
  const weekStart = currentWeekStart();
  const activePlan = await getActiveMealPlan(userId, weekStart);
  const mealData = cloudData.mealData && typeof cloudData.mealData === "object" ? (cloudData.mealData as Record<string, unknown>) : {};
  const savedPreferences = normalizeSavedPreferences(mealData.preferences);
  const plannerState = activePlan ? "planner" : "onboarding";

  return {
    role: profile.role,
    tier: profile.planTier,
    timezone: profile.timezone || "Asia/Jerusalem",
    preferences: activePlan?.preferences ? normalizeSavedPreferences(activePlan.preferences) : savedPreferences,
    savedPreferences,
    activePlan: planRowToClient(activePlan),
    limits: getLimits(profile.role),
    plannerState,
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
  const state = await buildPlannerStateForUser(userId);
  const plan = state.activePlan;
  const limits = state.limits;
  return {
    tier: state.tier,
    role: state.role,
    aiEnabled: true,
    entitlements: getModuleEntitlements(state.tier),
    remainingFullGenerationsToday: limits.generationsPerWeek === null ? null : Math.max(0, limits.generationsPerWeek - (plan?.usage.weeklyGenerationsUsed ?? 0)),
    remainingLightEditsToday: limits.mealSwapsPerPlan === null ? null : Math.max(0, limits.mealSwapsPerPlan - (plan?.usage.swapsUsed ?? 0)),
    remainingFullGenerationsMonth: null,
    remainingLightEditsMonth: limits.dayRegenerationsPerPlan === null ? null : Math.max(0, limits.dayRegenerationsPerPlan - (plan?.usage.dayRegenerationsUsed ?? 0)),
  };
}

export async function generateWeekForUser(userId: string, body: unknown) {
  const parsed = generateWeekInputSchema.parse(body);
  const { profile, provider, isAdmin } = await getProviderDecision(userId, "generate_week");
  const weekStart = currentWeekStart();
  const versionInfo = await countMealPlanVersionsForWeek(userId, weekStart);

  if (!isAdmin && versionInfo.count >= 2) {
    await recordOverLimitAttempt(userId);
    throw Object.assign(new Error("Plan generation limit reached"), { status: 429, code: "PLAN_GENERATION_LIMIT" });
  }

  await saveMealPlannerPreferences(userId, parsed.preferences);
  const userContext = await buildUserContext(userId, profile.timezone);
  const activeRange = activeDates();

  let result: Awaited<ReturnType<typeof generateWeeklyPlanAI | typeof generateWeeklyPlanLocal>>;
  let debug: string | null = null;
  let source: "ai" | "basic" = provider === "openai" ? "ai" : "basic";

  if (provider === "openai") {
    try {
      result = await generateWeeklyPlanAI({
        action: "generate_week",
        preferences: parsed.preferences,
        activeDates: activeRange,
        userContext,
      } satisfies GenerateWeekAiInput);
    } catch (error) {
      debug = error instanceof Error ? error.message : String(error);
      result = await generateWeeklyPlanLocal({
        action: "generate_week",
        preferences: parsed.preferences,
        activeDates: activeRange,
        userContext,
      } satisfies GenerateWeekAiInput);
      source = "basic";
    }
  } else {
    result = await generateWeeklyPlanLocal({
      action: "generate_week",
      preferences: parsed.preferences,
      activeDates: activeRange,
      userContext,
    } satisfies GenerateWeekAiInput);
    source = "basic";
  }

  if (provider === "openai" && source === "ai") {
    await incrementAiUsage({
      userId,
      actionType: "generate_week",
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      estimatedCostUsd: estimateAiCostUsd(result.usage.inputTokens, result.usage.outputTokens),
      useCreditPack: false,
    });
  }

  const planData = buildStoredPlan(result.plan as unknown as Record<string, unknown>, source);
  const created = await createMealPlanVersion(userId, {
    weekStart,
    preferences: parsed.preferences,
    planData,
    usageData: toUsageData(undefined, versionInfo.maxVersion + 1, {
      swapsUsed: 0,
      dayRegenerationsUsed: 0,
    }),
    source,
  });

  return {
    state: await buildPlannerStateForUser(userId),
    provider: source === "ai" ? "openai" : "local",
    source,
    debug: profile.role === "admin" || profile.role === "super_admin" ? debug : null,
    activePlan: planRowToClient(created),
  };
}

export async function editMealForUser(userId: string, body: unknown) {
  const parsed = editMealInputSchema.parse(body);
  const weekStart = currentWeekStart();
  const plan = await getActiveMealPlan(userId, weekStart);
  if (!plan) throw Object.assign(new Error("No active plan"), { status: 404 });

  const { profile, provider, isAdmin } = await getProviderDecision(userId, "replace_meal");
  const limits = getLimits(profile.role);
  const swapsUsed = Number(plan.usageData.swapsUsed ?? 0);
  if (!isAdmin && limits.mealSwapsPerPlan !== null && swapsUsed >= limits.mealSwapsPerPlan) {
    await recordOverLimitAttempt(userId);
    throw Object.assign(new Error("Meal swap limit reached"), { status: 429, code: "PLAN_SWAP_LIMIT" });
  }

  const userContext = await buildUserContext(userId, profile.timezone);
  let result: Awaited<ReturnType<typeof editMealAI | typeof editMealLocal>>;
  let debug: string | null = null;
  let source: "ai" | "basic" = provider === "openai" ? "ai" : "basic";

  if (provider === "openai") {
    try {
      result = await editMealAI({
        action: "replace_meal",
        existingMeal: parsed.existingMeal,
        editRequest: parsed.editRequest,
        userContext,
      });
    } catch (error) {
      debug = error instanceof Error ? error.message : String(error);
      result = await editMealLocal({
        action: "replace_meal",
        existingMeal: parsed.existingMeal,
        editRequest: parsed.editRequest,
        userContext,
      });
      source = "basic";
    }
  } else {
    result = await editMealLocal({
      action: "replace_meal",
      existingMeal: parsed.existingMeal,
      editRequest: parsed.editRequest,
      userContext,
    });
    source = "basic";
  }

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
    usageData: toUsageData(plan.usageData, Number(plan.usageData.weeklyGenerationsUsed ?? plan.version), {
      swapsUsed: swapsUsed + 1,
    }),
  });

  if (provider === "openai" && source === "ai") {
    await incrementAiUsage({
      userId,
      actionType: "replace_meal",
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      estimatedCostUsd: estimateAiCostUsd(result.usage.inputTokens, result.usage.outputTokens),
      useCreditPack: false,
    });
  }

  return {
    meal: result.meal,
    activePlan: planRowToClient(updated),
    provider: source === "ai" ? "openai" : "local",
    source,
    debug: profile.role === "admin" || profile.role === "super_admin" ? debug : null,
  };
}

export async function regenerateDayForUser(userId: string, body: unknown) {
  const parsed = regenerateDayInputSchema.parse(body);
  const weekStart = currentWeekStart();
  const plan = await getActiveMealPlan(userId, weekStart);
  if (!plan) throw Object.assign(new Error("No active plan"), { status: 404 });

  const { profile, provider, isAdmin } = await getProviderDecision(userId, "regenerate_day");
  const limits = getLimits(profile.role);
  const dayRegenerationsUsed = Number(plan.usageData.dayRegenerationsUsed ?? 0);
  if (!isAdmin && limits.dayRegenerationsPerPlan !== null && dayRegenerationsUsed >= limits.dayRegenerationsPerPlan) {
    await recordOverLimitAttempt(userId);
    throw Object.assign(new Error("Day regeneration limit reached"), { status: 429, code: "PLAN_DAY_LIMIT" });
  }

  const userContext = await buildUserContext(userId, profile.timezone);
  let result: Awaited<ReturnType<typeof regenerateDayAI | typeof regenerateDayLocal>>;
  let debug: string | null = null;
  let source: "ai" | "basic" = provider === "openai" ? "ai" : "basic";

  if (provider === "openai") {
    try {
      result = await regenerateDayAI({
        action: "regenerate_day",
        existingDay: parsed.existingDay,
        preferences: parsed.preferences,
        userContext,
      });
    } catch (error) {
      debug = error instanceof Error ? error.message : String(error);
      result = await regenerateDayLocal({
        action: "regenerate_day",
        existingDay: parsed.existingDay,
        preferences: parsed.preferences,
        userContext,
      });
      source = "basic";
    }
  } else {
    result = await regenerateDayLocal({
      action: "regenerate_day",
      existingDay: parsed.existingDay,
      preferences: parsed.preferences,
      userContext,
    });
    source = "basic";
  }

  const nextPlanData = { ...(plan.planData as Record<string, any>) };
  nextPlanData.days = Array.isArray(nextPlanData.days)
    ? nextPlanData.days.map((day: Record<string, any>) => (String(day.dateISO) === parsed.dateISO ? result.day : day))
    : [];

  const updated = await updateMealPlanVersion(plan.id, {
    planData: nextPlanData,
    usageData: toUsageData(plan.usageData, Number(plan.usageData.weeklyGenerationsUsed ?? plan.version), {
      dayRegenerationsUsed: dayRegenerationsUsed + 1,
    }),
  });

  if (provider === "openai" && source === "ai") {
    await incrementAiUsage({
      userId,
      actionType: "regenerate_day",
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      estimatedCostUsd: estimateAiCostUsd(result.usage.inputTokens, result.usage.outputTokens),
      useCreditPack: false,
    });
  }

  return {
    day: result.day,
    activePlan: planRowToClient(updated),
    provider: source === "ai" ? "openai" : "local",
    source,
    debug: profile.role === "admin" || profile.role === "super_admin" ? debug : null,
  };
}

export async function deleteMealPlanForUser(userId: string, mode: "meals" | "all") {
  await deactivateActiveMealPlan(userId, currentWeekStart());
  if (mode === "all") {
    await saveMealPlannerPreferences(userId, defaultPreferences());
  }
  return buildPlannerStateForUser(userId);
}

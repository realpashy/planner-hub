import { z } from "zod";
import { estimateAiCostUsd } from "@shared/ai/ai-costs";
import { isFullGenerationAction, isLightEditAction } from "@shared/ai/ai-limits";
import type {
  AiActionType,
  AiDayPlan,
  AiMeal,
  AiProviderType,
  AiQuotaDecision,
  GenerateWeekAiInput,
  MealPlannerUserContext,
} from "@shared/ai/ai-types";
import { getModuleEntitlements } from "@shared/modules/module-entitlements";
import { getPlanTierConfig, resolvePlanTier } from "@shared/plans/feature-access";
import { DEFAULT_AI_FEATURE_FLAGS } from "@shared/ai/ai-feature-flags";
import {
  consumeAiCreditPack,
  getCloudData,
  getFeatureFlags,
  getOrCreateAiUsageRows,
  getOrCreateProfile,
  getSavedMealPlanContext,
  incrementAiUsage,
  saveSavedMealPlan,
} from "../persistence";
import { editMealLocal, generateWeeklyPlanLocal, regenerateDayLocal } from "./local-provider";
import { editMealAI, generateWeeklyPlanAI, regenerateDayAI } from "./openai-provider";

const generateWeekInputSchema = z.object({
  preferences: z.record(z.unknown()),
  existingPlan: z.record(z.unknown()).optional(),
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

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getQuotaRemainder(limit: number | null, used: number) {
  return limit === null ? null : Math.max(0, limit - used);
}

function featureFlagBoolean(flags: Record<string, unknown>, key: keyof typeof DEFAULT_AI_FEATURE_FLAGS) {
  const value = flags[key];
  return typeof value === "boolean" ? value : DEFAULT_AI_FEATURE_FLAGS[key];
}

async function buildUserContext(userId: string, timezoneFallback = "Asia/Jerusalem"): Promise<MealPlannerUserContext> {
  const profile = await getOrCreateProfile(userId, "user");
  const cloudData = await getCloudData(userId);
  const savedPlanSummaries = await getSavedMealPlanContext(userId);
  const mealData = (cloudData.mealData && typeof cloudData.mealData === "object" ? cloudData.mealData : {}) as Record<string, any>;
  const favorites = Array.isArray(mealData.favorites) ? mealData.favorites : [];
  const recentMeals = Array.isArray(mealData.recentMeals) ? mealData.recentMeals.map(String).slice(0, 12) : [];

  return {
    timezone: profile.timezone || timezoneFallback,
    tier: resolvePlanTier(profile.planTier),
    dietaryNotes: typeof mealData.profile?.dietaryNotes === "string" ? mealData.profile.dietaryNotes : "",
    avoidIngredients: typeof mealData.profile?.avoidIngredients === "string"
      ? mealData.profile.avoidIngredients.split(/[،,]/).map((item: string) => item.trim()).filter(Boolean)
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

export async function getAiQuotaStatus(userId: string) {
  const profile = await getOrCreateProfile(userId, "user");
  const tier = resolvePlanTier(profile.planTier);
  const limits = getPlanTierConfig(tier);
  const [usageRows, flags] = await Promise.all([
    getOrCreateAiUsageRows(userId, dayKey(), monthKey()),
    getFeatureFlags(),
  ]);
  const remainingFullToday = getQuotaRemainder(limits.fullGenerationsPerDay, usageRows.daily.fullGenerationsUsed);
  const remainingLightToday = getQuotaRemainder(limits.lightEditsPerDay, usageRows.daily.lightEditsUsed);
  const remainingFullMonth = getQuotaRemainder(limits.fullGenerationsPerMonth, usageRows.monthly.fullGenerationsUsed);
  const remainingLightMonth = getQuotaRemainder(limits.lightEditsPerMonth, usageRows.monthly.lightEditsUsed);

  return {
    tier,
    role: profile.role,
    aiEnabled: profile.aiEnabled && featureFlagBoolean(flags, "meal_planner.ai_enabled"),
    entitlements: getModuleEntitlements(tier),
    remainingFullGenerationsToday: remainingFullToday,
    remainingLightEditsToday: remainingLightToday,
    remainingFullGenerationsMonth: remainingFullMonth,
    remainingLightEditsMonth: remainingLightMonth,
  };
}

async function decideQuota(userId: string, action: AiActionType): Promise<AiQuotaDecision> {
  const profile = await getOrCreateProfile(userId, "user");
  const tier = resolvePlanTier(profile.planTier);
  const config = getPlanTierConfig(tier);
  const [usageRows, flags] = await Promise.all([
    getOrCreateAiUsageRows(userId, dayKey(), monthKey()),
    getFeatureFlags(),
  ]);
  const isAdmin = profile.role === "admin" || profile.role === "super_admin" || tier === "admin";
  const aiEnabled = profile.aiEnabled && featureFlagBoolean(flags, "meal_planner.ai_enabled") && config.aiEnabled;
  const forceLocal = featureFlagBoolean(flags, "meal_planner.force_local_generation");
  const provider: AiProviderType = !aiEnabled || forceLocal ? "local" : "openai";

  const remainingFullToday = getQuotaRemainder(config.fullGenerationsPerDay, usageRows.daily.fullGenerationsUsed);
  const remainingLightToday = getQuotaRemainder(config.lightEditsPerDay, usageRows.daily.lightEditsUsed);
  const remainingFullMonth = getQuotaRemainder(config.fullGenerationsPerMonth, usageRows.monthly.fullGenerationsUsed);
  const remainingLightMonth = getQuotaRemainder(config.lightEditsPerMonth, usageRows.monthly.lightEditsUsed);
  const creditBalance = await consumeAiCreditPack(userId, "peek");

  if (isAdmin) {
    return {
      allowed: true,
      tier: "admin",
      provider,
      isAdmin: true,
      usesCreditPack: false,
      remainingFullGenerationsToday: null,
      remainingLightEditsToday: null,
      remainingFullGenerationsMonth: null,
      remainingLightEditsMonth: null,
    };
  }

  if (!aiEnabled) {
    return {
      allowed: false,
      tier,
      provider: "local",
      reason: "ai_disabled",
      isAdmin: false,
      usesCreditPack: false,
      remainingFullGenerationsToday: remainingFullToday,
      remainingLightEditsToday: remainingLightToday,
      remainingFullGenerationsMonth: remainingFullMonth,
      remainingLightEditsMonth: remainingLightMonth,
    };
  }

  const needsFull = isFullGenerationAction(action);
  const needsLight = isLightEditAction(action);
  const baseAllowed =
    (needsFull ? (remainingFullToday === null || remainingFullToday > 0) && (remainingFullMonth === null || remainingFullMonth > 0) : true) &&
    (needsLight ? (remainingLightToday === null || remainingLightToday > 0) && (remainingLightMonth === null || remainingLightMonth > 0) : true);

  if (baseAllowed || provider === "local") {
    return {
      allowed: true,
      tier,
      provider,
      isAdmin: false,
      usesCreditPack: false,
      remainingFullGenerationsToday: remainingFullToday,
      remainingLightEditsToday: remainingLightToday,
      remainingFullGenerationsMonth: remainingFullMonth,
      remainingLightEditsMonth: remainingLightMonth,
    };
  }

  const hasPack =
    (needsFull && creditBalance.extraFullGenerations > 0) ||
    (needsLight && creditBalance.extraLightEdits > 0);

  return {
    allowed: hasPack,
    tier,
    provider,
    reason: hasPack ? undefined : "quota_exhausted",
    isAdmin: false,
    usesCreditPack: hasPack,
    remainingFullGenerationsToday: remainingFullToday,
    remainingLightEditsToday: remainingLightToday,
    remainingFullGenerationsMonth: remainingFullMonth,
    remainingLightEditsMonth: remainingLightMonth,
  };
}

export async function generateWeekForUser(userId: string, body: unknown) {
  const parsed = generateWeekInputSchema.parse(body);
  const quota = await decideQuota(userId, "generate_week");
  const userContext = await buildUserContext(userId);

  if (!quota.allowed && quota.provider === "openai") {
    throw Object.assign(new Error("AI quota exhausted"), { status: 429, code: "AI_LIMIT_REACHED", quota });
  }

  const input: GenerateWeekAiInput = {
    action: "generate_week",
    preferences: parsed.preferences,
    userContext,
  };

  const result =
    quota.provider === "openai"
      ? await generateWeeklyPlanAI(input)
      : await generateWeeklyPlanLocal(input);

  const estimatedCostUsd = estimateAiCostUsd(result.usage.inputTokens, result.usage.outputTokens);
  await incrementAiUsage({
    userId,
    actionType: "generate_week",
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    estimatedCostUsd,
    useCreditPack: quota.usesCreditPack && quota.provider === "openai",
  });
  await saveSavedMealPlan(userId, {
    weekKey: dayKey(),
    preferences: parsed.preferences,
    planData: result.plan,
    source: quota.provider,
  });

  return { ...result, quota };
}

export async function editMealForUser(userId: string, body: unknown) {
  const parsed = editMealInputSchema.parse(body);
  const quota = await decideQuota(userId, "replace_meal");
  const userContext = await buildUserContext(userId);
  if (!quota.allowed && quota.provider === "openai") {
    throw Object.assign(new Error("AI quota exhausted"), { status: 429, code: "AI_LIMIT_REACHED", quota });
  }
  const result =
    quota.provider === "openai"
      ? await editMealAI({
          action: "replace_meal",
          existingMeal: parsed.existingMeal,
          editRequest: parsed.editRequest,
          userContext,
        })
      : await editMealLocal({
          action: "replace_meal",
          existingMeal: parsed.existingMeal,
          editRequest: parsed.editRequest,
          userContext,
        });
  await incrementAiUsage({
    userId,
    actionType: "replace_meal",
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    estimatedCostUsd: estimateAiCostUsd(result.usage.inputTokens, result.usage.outputTokens),
    useCreditPack: quota.usesCreditPack && quota.provider === "openai",
  });
  return { ...result, quota };
}

export async function regenerateDayForUser(userId: string, body: unknown) {
  const parsed = regenerateDayInputSchema.parse(body);
  const quota = await decideQuota(userId, "regenerate_day");
  const userContext = await buildUserContext(userId);
  if (!quota.allowed && quota.provider === "openai") {
    throw Object.assign(new Error("AI quota exhausted"), { status: 429, code: "AI_LIMIT_REACHED", quota });
  }
  const result =
    quota.provider === "openai"
      ? await regenerateDayAI({
          action: "regenerate_day",
          existingDay: parsed.existingDay,
          preferences: parsed.preferences,
          userContext,
        })
      : await regenerateDayLocal({
          action: "regenerate_day",
          existingDay: parsed.existingDay,
          preferences: parsed.preferences,
          userContext,
        });
  await incrementAiUsage({
    userId,
    actionType: "regenerate_day",
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    estimatedCostUsd: estimateAiCostUsd(result.usage.inputTokens, result.usage.outputTokens),
    useCreditPack: quota.usesCreditPack && quota.provider === "openai",
  });
  return { ...result, quota };
}

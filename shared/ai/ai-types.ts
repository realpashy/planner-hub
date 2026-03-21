import { z } from "zod";
import type { ProductPlanTier } from "../plans/plan-tiers";

export type AiActionType =
  | "generate_week"
  | "regenerate_week"
  | "regenerate_day"
  | "replace_meal"
  | "calorie_rebalance"
  | "recommendation";

export type AiProviderType = "local" | "openai";

export interface AiUsageSnapshot {
  fullGenerationsUsed: number;
  lightEditsUsed: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUsd: number;
}

export interface AiQuotaDecision {
  allowed: boolean;
  tier: ProductPlanTier;
  provider: AiProviderType;
  reason?: "quota_exhausted" | "feature_disabled" | "ai_disabled";
  isAdmin: boolean;
  usesCreditPack: boolean;
  remainingFullGenerationsToday: number | null;
  remainingLightEditsToday: number | null;
  remainingFullGenerationsMonth: number | null;
  remainingLightEditsMonth: number | null;
}

export interface MealPlannerUserContext {
  timezone: string;
  tier: ProductPlanTier;
  dietaryNotes?: string;
  avoidIngredients?: string[];
  recentMeals: string[];
  favorites: Array<{
    title: string;
    mealType: string;
    tags: string[];
  }>;
  savedPlanSummaries: Array<{
    weekKey: string;
    source: string;
  }>;
}

export interface MealMacroSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const aiMealSchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  title: z.string().min(1),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  tags: z.array(z.string()).max(6).default([]),
  ingredients: z.array(z.string()).max(10).default([]),
  shortNote: z.string().max(180).default(""),
  image: z.string().default("🍽️"),
  imageType: z.enum(["emoji", "static", "generated", "upload", "local"]).default("emoji"),
  imageSource: z.string().default("ai-generated-placeholder"),
});

export const aiDaySchema = z.object({
  dateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meals: z.array(aiMealSchema).min(1).max(4),
  waterTargetCups: z.number().int().min(1).max(20),
  notes: z.string().max(220).default(""),
});

export const aiWeekPlanSchema = z.object({
  summary: z.string().max(220),
  days: z.array(aiDaySchema).length(7),
});

export type AiMeal = z.infer<typeof aiMealSchema>;
export type AiDayPlan = z.infer<typeof aiDaySchema>;
export type AiWeekPlan = z.infer<typeof aiWeekPlanSchema>;

export interface AiProviderUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface GenerateWeekAiInput {
  action: "generate_week" | "regenerate_week";
  preferences: Record<string, unknown>;
  userContext: MealPlannerUserContext;
}

export interface EditMealAiInput {
  action: "replace_meal" | "calorie_rebalance";
  existingMeal: Record<string, unknown>;
  editRequest: string;
  userContext: MealPlannerUserContext;
}

export interface RegenerateDayAiInput {
  action: "regenerate_day";
  existingDay: Record<string, unknown>;
  preferences: Record<string, unknown>;
  userContext: MealPlannerUserContext;
}

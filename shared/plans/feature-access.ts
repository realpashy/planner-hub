import { DEFAULT_PLAN_TIER, PLAN_TIER_CONFIG, type ProductPlanTier } from "./plan-tiers";

export function resolvePlanTier(value: unknown): ProductPlanTier {
  return value === "free" || value === "pro" || value === "admin" ? value : DEFAULT_PLAN_TIER;
}

export function getPlanTierConfig(tier: unknown) {
  return PLAN_TIER_CONFIG[resolvePlanTier(tier)];
}

export function hasFeatureAccess<
  TCategory extends keyof (typeof PLAN_TIER_CONFIG)["free"]["access"],
  TFeature extends keyof (typeof PLAN_TIER_CONFIG)["free"]["access"][TCategory],
>(tier: unknown, category: TCategory, feature: TFeature) {
  return Boolean(getPlanTierConfig(tier).access[category][feature]);
}

export const DEFAULT_AI_FEATURE_FLAGS = {
  "meal_planner.ai_enabled": true,
  "meal_planner.force_local_generation": false,
  "meal_planner.admin_dashboard_enabled": true,
  "product.upgrade_cta_enabled": true,
  "product.credit_packs_enabled": false,
} as const;

export type AiFeatureFlagKey = keyof typeof DEFAULT_AI_FEATURE_FLAGS;

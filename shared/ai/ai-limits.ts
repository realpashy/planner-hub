import { getPlanTierConfig } from "../plans/feature-access";
import type { AiActionType } from "./ai-types";

export function isFullGenerationAction(action: AiActionType) {
  return action === "generate_week" || action === "regenerate_week";
}

export function isLightEditAction(action: AiActionType) {
  return action === "regenerate_day" || action === "replace_meal" || action === "calorie_rebalance" || action === "recommendation";
}

export function getPlanLimits(tier: unknown) {
  const config = getPlanTierConfig(tier);
  return {
    aiEnabled: config.aiEnabled,
    fullGenerationsPerDay: config.fullGenerationsPerDay,
    lightEditsPerDay: config.lightEditsPerDay,
    fullGenerationsPerMonth: config.fullGenerationsPerMonth,
    lightEditsPerMonth: config.lightEditsPerMonth,
  };
}

import { hasFeatureAccess } from "../plans/feature-access";

export function getModuleEntitlements(tier: unknown) {
  return {
    mealPlanner: {
      basic: hasFeatureAccess(tier, "mealPlanner", "basic"),
      aiGeneration: hasFeatureAccess(tier, "mealPlanner", "aiGeneration"),
      realtimeAiSuggestions: hasFeatureAccess(tier, "mealPlanner", "realtimeAiSuggestions"),
      smartOptimization: hasFeatureAccess(tier, "mealPlanner", "smartOptimization"),
    },
    dashboard: {
      advancedInsights: hasFeatureAccess(tier, "dashboard", "advancedInsights"),
    },
  };
}

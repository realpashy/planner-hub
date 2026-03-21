export const FUTURE_MODULE_UPGRADES = {
  mealPlanner: {
    placeholders: [
      "mealPlanner.realtimeAiSuggestions",
      "mealPlanner.smartOptimization",
      "mealPlanner.crossWeekSuggestions",
    ],
    todo: "Add richer personalized AI meal optimization without changing quota primitives.",
  },
  weeklyPlanner: {
    placeholders: ["weeklyPlanner.aiAssist"],
    todo: "Reuse the same AI quota counters with planner-specific action types later.",
  },
  budgeting: {
    placeholders: ["budgeting.aiAssist"],
    todo: "Add cost-aware receipt and forecast flows behind the same tier system.",
  },
  assistant: {
    placeholders: ["assistant.crossModuleIntelligence"],
    todo: "Unify module context retrieval once cross-module assistant work starts.",
  },
} as const;

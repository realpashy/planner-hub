export interface ProductRoadmapModule {
  id: string;
  label: string;
  freeFeatures: string[];
  proFeatures: string[];
  futureAiFeatures: string[];
  notImplementedFlags: string[];
}

export const PRODUCT_ROADMAP: ProductRoadmapModule[] = [
  {
    id: "meal-planner",
    label: "Meal Planner",
    freeFeatures: [
      "Local weekly generation",
      "Manual editing and copy flows",
      "Saved weekly plans",
      "Basic analytics and shopping summary",
    ],
    proFeatures: [
      "Higher AI quota",
      "Realtime AI meal suggestions",
      "Smart weekly optimization",
      "Advanced dashboard insights",
    ],
    futureAiFeatures: [
      "Adaptive weekly balancing",
      "Macro-aware optimization",
      "Routine learning",
      "Cross-week meal suggestions",
      "Grocery optimization",
      "Seasonal recommendations",
    ],
    notImplementedFlags: [
      "mealPlanner.realtimeAiSuggestions",
      "mealPlanner.smartOptimization",
      "dashboard.advancedInsights",
    ],
  },
  {
    id: "weekly-planner",
    label: "Weekly Planner",
    freeFeatures: ["Manual planning", "Local templates", "Core dashboard"],
    proFeatures: ["AI scheduling assist", "Conflict detection", "Smarter suggestions"],
    futureAiFeatures: ["Cross-module routine planning", "Adaptive prioritization"],
    notImplementedFlags: ["weeklyPlanner.aiAssist"],
  },
  {
    id: "budgeting",
    label: "Budgeting",
    freeFeatures: ["Manual budgeting", "Receipt parsing", "Basic reporting"],
    proFeatures: ["AI categorization", "Forecasting", "Advanced insights"],
    futureAiFeatures: ["Anomaly detection", "Cross-module budget guidance"],
    notImplementedFlags: ["budgeting.aiAssist"],
  },
  {
    id: "habit-tracker",
    label: "Habit Tracker",
    freeFeatures: ["Manual habit logging", "Basic streaks"],
    proFeatures: ["AI habit coaching", "Insight summaries"],
    futureAiFeatures: ["Adaptive routines", "Cross-module nudges"],
    notImplementedFlags: ["habits.aiAssist"],
  },
  {
    id: "shopping",
    label: "Shopping / Grocery",
    freeFeatures: ["Derived grocery list", "Manual item management"],
    proFeatures: ["AI grocery grouping", "Smart substitutions"],
    futureAiFeatures: ["Price-aware optimization", "Pantry-aware suggestions"],
    notImplementedFlags: ["shopping.aiAssist"],
  },
  {
    id: "assistant",
    label: "Cross-module AI Assistant",
    freeFeatures: ["Not enabled"],
    proFeatures: ["Shared intelligence layer"],
    futureAiFeatures: ["Cross-module recommendations", "Unified lifestyle suggestions"],
    notImplementedFlags: ["assistant.crossModuleIntelligence"],
  },
];

export type ProductPlanTier = "free" | "pro" | "admin";

export type FeatureAccessMap = {
  mealPlanner: {
    basic: boolean;
    aiGeneration: boolean;
    realtimeAiSuggestions: boolean;
    smartOptimization: boolean;
  };
  dashboard: {
    advancedInsights: boolean;
  };
  weeklyPlanner: {
    aiAssist: boolean;
  };
  budgeting: {
    aiAssist: boolean;
  };
  habits: {
    aiAssist: boolean;
  };
  shopping: {
    aiAssist: boolean;
  };
  assistant: {
    crossModuleIntelligence: boolean;
  };
};

export interface PlanTierConfig {
  id: ProductPlanTier;
  label: string;
  aiEnabled: boolean;
  fullGenerationsPerDay: number | null;
  lightEditsPerDay: number | null;
  fullGenerationsPerMonth: number | null;
  lightEditsPerMonth: number | null;
  access: FeatureAccessMap;
}

const ALL_ACCESS: FeatureAccessMap = {
  mealPlanner: {
    basic: true,
    aiGeneration: true,
    realtimeAiSuggestions: true,
    smartOptimization: true,
  },
  dashboard: {
    advancedInsights: true,
  },
  weeklyPlanner: {
    aiAssist: true,
  },
  budgeting: {
    aiAssist: true,
  },
  habits: {
    aiAssist: true,
  },
  shopping: {
    aiAssist: true,
  },
  assistant: {
    crossModuleIntelligence: true,
  },
};

export const PLAN_TIER_CONFIG: Record<ProductPlanTier, PlanTierConfig> = {
  free: {
    id: "free",
    label: "Free",
    aiEnabled: true,
    fullGenerationsPerDay: 1,
    lightEditsPerDay: 6,
    fullGenerationsPerMonth: 20,
    lightEditsPerMonth: 80,
    access: {
      mealPlanner: {
        basic: true,
        aiGeneration: true,
        realtimeAiSuggestions: false,
        smartOptimization: false,
      },
      dashboard: {
        advancedInsights: false,
      },
      weeklyPlanner: {
        aiAssist: false,
      },
      budgeting: {
        aiAssist: false,
      },
      habits: {
        aiAssist: false,
      },
      shopping: {
        aiAssist: false,
      },
      assistant: {
        crossModuleIntelligence: false,
      },
    },
  },
  pro: {
    id: "pro",
    label: "Pro",
    aiEnabled: true,
    fullGenerationsPerDay: 2,
    lightEditsPerDay: 10,
    fullGenerationsPerMonth: 30,
    lightEditsPerMonth: 120,
    access: {
      mealPlanner: {
        basic: true,
        aiGeneration: true,
        realtimeAiSuggestions: true,
        smartOptimization: true,
      },
      dashboard: {
        advancedInsights: true,
      },
      weeklyPlanner: {
        aiAssist: true,
      },
      budgeting: {
        aiAssist: true,
      },
      habits: {
        aiAssist: true,
      },
      shopping: {
        aiAssist: true,
      },
      assistant: {
        crossModuleIntelligence: false,
      },
    },
  },
  admin: {
    id: "admin",
    label: "Admin",
    aiEnabled: true,
    fullGenerationsPerDay: null,
    lightEditsPerDay: null,
    fullGenerationsPerMonth: null,
    lightEditsPerMonth: null,
    access: ALL_ACCESS,
  },
};

export const DEFAULT_PLAN_TIER: ProductPlanTier = "free";

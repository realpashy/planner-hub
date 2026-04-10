import { z } from "zod";

export const dashboardAssistantActionSchema = z.enum([
  "generateDashboardInsight",
  "reprioritizeDay",
  "simplifyPlan",
  "spotRisks",
]);

export const dashboardAssistantContextSchema = z.object({
  isoDate: z.string(),
  dateLabel: z.string(),
  greeting: z.string(),
  planner: z.object({
    tasksToday: z.number(),
    overdueTasks: z.number(),
    eventsToday: z.number(),
    topPriorities: z.array(z.string()).max(5),
  }),
  habits: z.object({
    totalHabits: z.number(),
    completedToday: z.number(),
    pendingHabits: z.number(),
    progressPercent: z.number(),
    atRiskHabits: z.array(z.string()).max(5),
    moodLabel: z.string().nullable(),
  }),
  meals: z.object({
    mealsToday: z.number(),
    weeklyMeals: z.number(),
    todayMealTitles: z.array(z.string()).max(6),
    prepLabel: z.string().nullable(),
  }),
  budget: z.object({
    spentThisMonth: z.number(),
    monthlyLimit: z.number(),
    remaining: z.number(),
    pressureLabel: z.string(),
  }),
  cashflow: z.object({
    availableBalance: z.number(),
    pendingPayments: z.number(),
    warningLabel: z.string().nullable(),
  }),
});

export const dashboardAssistantResultSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  bullets: z.array(z.string()).min(2).max(4),
  bestNextAction: z.object({
    type: z.enum(["planner", "habits", "budget", "meal", "cashflow"]),
    label: z.string(),
    href: z.string(),
    targetId: z.string().optional(),
  }),
  generatedAt: z.string(),
  source: z.enum(["openai", "fallback"]),
});

export const dashboardAssistantRequestSchema = z.object({
  action: dashboardAssistantActionSchema,
  context: dashboardAssistantContextSchema,
});

export type DashboardAssistantAction = z.infer<typeof dashboardAssistantActionSchema>;
export type DashboardAssistantContext = z.infer<typeof dashboardAssistantContextSchema>;
export type DashboardAssistantResult = z.infer<typeof dashboardAssistantResultSchema>;
export type DashboardAssistantRequest = z.infer<typeof dashboardAssistantRequestSchema>;

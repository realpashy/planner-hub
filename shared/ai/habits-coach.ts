import { z } from "zod";

export const habitsCoachHabitSchema = z.object({
  name: z.string().min(1).max(72),
  categoryLabel: z.string().min(1).max(32),
  emoji: z.string().max(8).default("✨"),
  completed: z.boolean(),
  currentValue: z.number().nonnegative(),
  target: z.number().positive(),
  unit: z.string().max(24).optional(),
  streak: z.number().int().nonnegative(),
});

export const habitsCoachReminderSchema = z.object({
  title: z.string().min(1).max(72),
  time: z.string().max(16).optional().nullable(),
  tone: z.enum(["upcoming", "attention"]),
});

export const habitsCoachCategorySchema = z.object({
  label: z.string().min(1).max(32),
  completions: z.number().int().nonnegative(),
  totalHabits: z.number().int().nonnegative(),
});

export const habitsCoachTrendPointSchema = z.object({
  label: z.string().min(1).max(24),
  percent: z.number().min(0).max(100),
});

export const habitsCoachPayloadSchema = z.object({
  generatedAt: z.string().min(1),
  totalHabits: z.number().int().nonnegative(),
  completedToday: z.number().int().nonnegative(),
  pendingToday: z.number().int().nonnegative(),
  progressPercent: z.number().min(0).max(100),
  bestStreak: z.number().int().nonnegative(),
  averagePercent: z.number().min(0).max(100),
  bestDayLabel: z.string().min(1).max(32),
  bestDayPercent: z.number().min(0).max(100),
  todayMoodLabel: z.string().max(32).optional().nullable(),
  todayMoodHint: z.string().max(48).optional().nullable(),
  reminders: z.array(habitsCoachReminderSchema).max(3),
  habits: z.array(habitsCoachHabitSchema).max(8),
  categoryBreakdown: z.array(habitsCoachCategorySchema).max(6),
  weeklyTrend: z.array(habitsCoachTrendPointSchema).max(7),
});

export const habitsCoachResponseSchema = z.object({
  headline: z.string().min(1).max(90),
  overview: z.string().min(1).max(220),
  momentumLabel: z.string().min(1).max(48),
  winCondition: z.string().min(1).max(96),
  watchOut: z.string().min(1).max(96),
  focusHabits: z.array(z.string().min(1).max(56)).min(1).max(3),
  actions: z.array(z.string().min(1).max(88)).min(2).max(3),
  encouragement: z.string().min(1).max(140),
  generatedAt: z.string().min(1),
  source: z.enum(["openai", "fallback"]).default("openai"),
});

export type HabitsCoachPayload = z.infer<typeof habitsCoachPayloadSchema>;
export type HabitsCoachResponse = z.infer<typeof habitsCoachResponseSchema>;

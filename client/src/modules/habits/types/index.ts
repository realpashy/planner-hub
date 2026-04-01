export type HabitType = "binary" | "count" | "duration";
export type HabitTrackingMode = "check" | "progress";

export type HabitCategory =
  | "health"
  | "mind"
  | "movement"
  | "learning"
  | "focus"
  | "lifestyle";

export type MoodValue = "great" | "good" | "steady" | "low" | "drained";

export interface HabitDefinition {
  id: string;
  name: string;
  description?: string;
  category: HabitCategory;
  type: HabitType;
  trackingMode: HabitTrackingMode;
  target: number;
  unit?: string;
  emoji?: string;
  reminderTime?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  value: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MoodLog {
  date: string;
  mood: MoodValue;
}

export interface HabitsState {
  habits: HabitDefinition[];
  logs: HabitLog[];
  moods: MoodLog[];
  lastUpdated: string;
}

export interface ReminderItem {
  id: string;
  habitId: string;
  title: string;
  description: string;
  time?: string | null;
  tone: "upcoming" | "attention";
}

export interface TrendPoint {
  label: string;
  percent: number;
  completions: number;
  total: number;
}

export interface CategoryBreakdownItem {
  key: HabitCategory;
  label: string;
  completions: number;
  totalHabits: number;
  color: string;
}

export interface HabitsDashboardSummary {
  totalHabits: number;
  completedToday: number;
  progressPercent: number;
  bestStreak: number;
  pendingCount: number;
}

export interface HabitFormValues {
  name: string;
  description: string;
  category: HabitCategory;
  type: HabitType;
  trackingMode: HabitTrackingMode;
  target: string;
  unit: string;
  emoji: string;
  reminderEnabled: boolean;
  reminderTime: string;
}

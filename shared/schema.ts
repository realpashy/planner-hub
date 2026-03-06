import { z } from "zod";

export const settingsSchema = z.object({
  language: z.enum(['ar', 'he']).default('ar'),
  theme: z.enum(['light', 'dark']).default('light'),
});

export const dayTagSchema = z.object({
  id: z.string(),
  date: z.string(), // ISO date YYYY-MM-DD
  text: z.string(),
});

export const eventSchema = z.object({
  id: z.string(),
  date: z.string(),
  time: z.string(),
  title: z.string(),
  icon: z.string().optional(),
});

export const taskSchema = z.object({
  id: z.string(),
  date: z.string(),
  text: z.string(),
  completed: z.boolean(),
  isWeekly: z.boolean().default(false),
  deadline: z.string().optional(),
});

export const habitSchema = z.object({
  id: z.string(),
  name: z.string(),
  completedDates: z.array(z.string()), // Array of ISO dates
});

export const noteSchema = z.object({
  id: z.string(),
  date: z.string(),
  content: z.string(),
});

export type Settings = z.infer<typeof settingsSchema>;
export type DayTag = z.infer<typeof dayTagSchema>;
export type EventItem = z.infer<typeof eventSchema>;
export type TaskItem = z.infer<typeof taskSchema>;
export type HabitItem = z.infer<typeof habitSchema>;
export type NoteItem = z.infer<typeof noteSchema>;

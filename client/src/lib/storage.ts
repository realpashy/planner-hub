import type { Settings, DayTag, EventItem, TaskItem, HabitItem, NoteItem } from "@shared/schema";

export interface PlannerData {
  settings: Settings;
  tags: DayTag[];
  events: EventItem[];
  tasks: TaskItem[];
  habits: HabitItem[];
  notes: NoteItem[];
}

const STORAGE_KEY = "planner_hub_data";
const ONBOARDED_KEY = "planner_hub_onboarded";

const DEFAULT_DATA: PlannerData = {
  settings: { language: 'ar', theme: 'light' },
  tags: [],
  events: [],
  tasks: [],
  habits: [],
  notes: []
};

export function isOnboarded(): boolean {
  if (localStorage.getItem(ONBOARDED_KEY) === "true") return true;
  if (localStorage.getItem(STORAGE_KEY)) {
    setOnboarded();
    return true;
  }
  return false;
}

export function setOnboarded(): void {
  localStorage.setItem(ONBOARDED_KEY, "true");
}

export function getPlannerData(): PlannerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_DATA;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse local storage, using default", e);
    return DEFAULT_DATA;
  }
}

export function savePlannerData(data: PlannerData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearPlannerData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ONBOARDED_KEY);
}

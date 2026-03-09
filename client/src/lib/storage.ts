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
  settings: { language: "ar", theme: "light" },
  tags: [],
  events: [],
  tasks: [],
  habits: [],
  notes: [],
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function sanitizePlannerData(value: unknown): PlannerData {
  const raw = (value && typeof value === "object" ? value : {}) as Partial<PlannerData> & {
    settings?: Partial<Settings>;
  };

  return {
    settings: {
      language: raw.settings?.language === "he" ? "he" : "ar",
      theme: raw.settings?.theme === "dark" ? "dark" : "light",
    },
    tags: asArray<DayTag>(raw.tags),
    events: asArray<EventItem>(raw.events),
    tasks: asArray<TaskItem>(raw.tasks),
    habits: asArray<HabitItem>(raw.habits),
    notes: asArray<NoteItem>(raw.notes),
  };
}

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

    const parsed = JSON.parse(raw);
    const safe = sanitizePlannerData(parsed);
    return safe;
  } catch (e) {
    console.error("Failed to parse local storage, using default", e);
    return DEFAULT_DATA;
  }
}

export function savePlannerData(data: PlannerData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizePlannerData(data)));
}

export function clearPlannerData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ONBOARDED_KEY);
}

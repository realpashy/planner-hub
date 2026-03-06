import { v4 as uuidv4 } from "uuid";
import type { Settings, DayTag, EventItem, TaskItem, HabitItem, NoteItem } from "@shared/schema";
import { formatISODate } from "./date-utils";

export interface PlannerData {
  settings: Settings;
  tags: DayTag[];
  events: EventItem[];
  tasks: TaskItem[];
  habits: HabitItem[];
  notes: NoteItem[];
}

const STORAGE_KEY = "planner_hub_data";

const DEFAULT_DATA: PlannerData = {
  settings: { language: 'ar', theme: 'light' },
  tags: [],
  events: [],
  tasks: [],
  habits: [],
  notes: []
};

// Generate realistic seed data for the current week
function generateSeedData(): PlannerData {
  const today = new Date();
  const isoToday = formatISODate(today);
  
  return {
    settings: { language: 'ar', theme: 'light' },
    tags: [
      { id: uuidv4(), date: isoToday, text: 'يوم التركيز' },
      { id: uuidv4(), date: isoToday, text: 'تطوير الذات' }
    ],
    events: [
      { id: uuidv4(), date: isoToday, time: '10:00', title: 'اجتماع فريق العمل', icon: '📅' },
      { id: uuidv4(), date: isoToday, time: '14:30', title: 'تمرين رياضي', icon: '💪' },
      { id: uuidv4(), date: isoToday, time: '18:00', title: 'تسوق للمنزل', icon: '🛒' }
    ],
    tasks: [
      { id: uuidv4(), date: isoToday, text: 'قراءة 20 صفحة من كتاب', completed: false, isWeekly: false },
      { id: uuidv4(), date: isoToday, text: 'مراجعة ميزانية الشهر', completed: true, isWeekly: false },
      { id: uuidv4(), date: isoToday, text: 'إرسال التقرير الأسبوعي', completed: false, isWeekly: true }
    ],
    habits: [
      { id: uuidv4(), name: 'شرب 2 لتر ماء', completedDates: [] },
      { id: uuidv4(), name: 'التأمل 10 دقائق', completedDates: [isoToday] }
    ],
    notes: [
      { id: uuidv4(), date: isoToday, content: 'اليوم كان مثمراً، غداً سأركز أكثر على مهام البرمجة.' }
    ]
  };
}

export function getPlannerData(): PlannerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = generateSeedData();
      savePlannerData(seed);
      return seed;
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

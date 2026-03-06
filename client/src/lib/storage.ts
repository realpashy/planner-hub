import { v4 as uuidv4 } from "uuid";
import type { Settings, DayTag, EventItem, TaskItem, HabitItem, NoteItem } from "@shared/schema";
import { formatISODate, getWeekDays } from "./date-utils";

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

function generateSeedData(): PlannerData {
  const today = new Date();
  const weekDays = getWeekDays(today);
  const isoToday = formatISODate(today);
  const isoDays = weekDays.map(d => formatISODate(d));

  const weekStartISO = isoDays[0];

  return {
    settings: { language: 'ar', theme: 'light' },
    tags: [
      { id: uuidv4(), date: isoToday, text: 'تركيز عالي' },
      { id: uuidv4(), date: isoToday, text: 'تطوير الذات' },
      { id: uuidv4(), date: isoDays[1], text: 'يوم رياضي' },
    ],
    events: [
      { id: uuidv4(), date: isoToday, time: '09:00', title: 'اجتماع فريق العمل', icon: '📅' },
      { id: uuidv4(), date: isoToday, time: '14:30', title: 'تمرين رياضي في النادي', icon: '💪' },
      { id: uuidv4(), date: isoToday, time: '18:00', title: 'تسوق للمنزل', icon: '🛒' },
      { id: uuidv4(), date: isoDays[1], time: '10:00', title: 'دراسة البرمجة', icon: '📚' },
      { id: uuidv4(), date: isoDays[2], time: '11:00', title: 'لقاء مع صديق', icon: '📅' },
      { id: uuidv4(), date: isoDays[3], time: '16:00', title: 'عشاء عائلي', icon: '🍽️' },
    ],
    tasks: [
      { id: uuidv4(), date: isoToday, text: 'قراءة 20 صفحة من كتاب', completed: false, isWeekly: false },
      { id: uuidv4(), date: isoToday, text: 'مراجعة ميزانية الشهر', completed: true, isWeekly: false },
      { id: uuidv4(), date: isoToday, text: 'تنظيم المكتب', completed: false, isWeekly: false },
      { id: uuidv4(), date: isoDays[1], text: 'إرسال التقرير للمدير', completed: false, isWeekly: false },
      { id: uuidv4(), date: isoDays[2], text: 'شراء هدية عيد الميلاد', completed: true, isWeekly: false },
      { id: uuidv4(), date: isoDays[3], text: 'ترتيب الملابس', completed: false, isWeekly: false },
      { id: uuidv4(), date: weekStartISO, text: 'إرسال التقرير الأسبوعي', completed: false, isWeekly: true },
      { id: uuidv4(), date: weekStartISO, text: 'تنظيف المنزل بالكامل', completed: false, isWeekly: true },
      { id: uuidv4(), date: weekStartISO, text: 'التسجيل في دورة جديدة', completed: true, isWeekly: true },
    ],
    habits: [
      { id: uuidv4(), name: 'شرب 2 لتر ماء', completedDates: [isoToday, isoDays[1]] },
      { id: uuidv4(), name: 'التأمل 10 دقائق', completedDates: [isoToday] },
      { id: uuidv4(), name: 'مشي 30 دقيقة', completedDates: [isoDays[0], isoDays[1], isoDays[2]] },
    ],
    notes: [
      { id: uuidv4(), date: isoToday, content: 'اليوم كان مثمراً جداً. أنجزت معظم المهام المخطط لها وشعرت بالإنتاجية.' },
      { id: uuidv4(), date: isoDays[1], content: 'يجب التركيز أكثر على المشاريع الجانبية هذا الأسبوع.' },
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

export function clearPlannerData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

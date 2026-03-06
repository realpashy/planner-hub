import { v4 as uuidv4 } from "uuid";
import { formatISODate, getWeekDays } from "./date-utils";
import type { PlannerData } from "./storage";

export interface Template {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
}

export const TEMPLATES: Template[] = [
  {
    id: "sports",
    name: "الرياضة واللياقة",
    description: "جدول تمارين وتتبع عادات صحية وتغذية متوازنة",
    emoji: "💪",
    color: "emerald",
  },
  {
    id: "productivity",
    name: "الإنتاجية والعمل",
    description: "تنظيم مهام العمل واجتماعات وأولويات الأسبوع",
    emoji: "🚀",
    color: "blue",
  },
  {
    id: "student",
    name: "الدراسة والتعلم",
    description: "جدول دراسي ومواعيد امتحانات ومراجعة المواد",
    emoji: "📚",
    color: "violet",
  },
  {
    id: "wellness",
    name: "الصحة النفسية",
    description: "تأمل وعادات يومية وأهداف للتوازن النفسي",
    emoji: "🧘",
    color: "amber",
  },
  {
    id: "blank",
    name: "ابدأ من الصفر",
    description: "صفحة بيضاء لتبني خطتك بنفسك",
    emoji: "✨",
    color: "slate",
  },
];

function getEmptyData(): PlannerData {
  return {
    settings: { language: "ar", theme: "light" },
    tags: [],
    events: [],
    tasks: [],
    habits: [],
    notes: [],
  };
}

export function generateTemplateData(templateId: string): PlannerData {
  if (templateId === "blank") return getEmptyData();

  const today = new Date();
  const weekDays = getWeekDays(today);
  const isoToday = formatISODate(today);
  const isoDays = weekDays.map((d) => formatISODate(d));
  const weekStartISO = isoDays[0];
  const todayIdx = weekDays.findIndex(
    (d) => formatISODate(d) === isoToday
  );
  const nextDayISO = isoDays[Math.min(todayIdx + 1, 6)];
  const dayAfterISO = isoDays[Math.min(todayIdx + 2, 6)];

  switch (templateId) {
    case "sports":
      return {
        settings: { language: "ar", theme: "light" },
        tags: [
          { id: uuidv4(), date: isoToday, text: "يوم ساق" },
          { id: uuidv4(), date: nextDayISO, text: "يوم راحة نشيطة" },
          { id: uuidv4(), date: dayAfterISO, text: "يوم صدر وكتف" },
        ],
        events: [
          { id: uuidv4(), date: isoToday, time: "06:30", title: "تمرين الساق في الجيم" },
          { id: uuidv4(), date: isoToday, time: "08:00", title: "تحضير وجبة بروتين" },
          { id: uuidv4(), date: nextDayISO, time: "07:00", title: "جري في الحديقة 5 كم" },
          { id: uuidv4(), date: dayAfterISO, time: "06:30", title: "تمرين صدر وكتف" },
          { id: uuidv4(), date: isoDays[5], time: "09:00", title: "مباراة كرة قدم مع الأصدقاء" },
        ],
        tasks: [
          { id: uuidv4(), date: isoToday, text: "تسجيل القياسات الأسبوعية (الوزن والمحيط)", completed: false, isWeekly: false },
          { id: uuidv4(), date: isoToday, text: "شراء مكملات غذائية", completed: false, isWeekly: false },
          { id: uuidv4(), date: nextDayISO, text: "تحضير وجبات الأسبوع مسبقا", completed: false, isWeekly: false },
          { id: uuidv4(), date: dayAfterISO, text: "حجز موعد مع أخصائي تغذية", completed: false, isWeekly: false },
          { id: uuidv4(), date: weekStartISO, text: "تجديد اشتراك النادي الرياضي", completed: false, isWeekly: true },
          { id: uuidv4(), date: weekStartISO, text: "تحديث خطة التمارين الشهرية", completed: false, isWeekly: true },
        ],
        habits: [
          { id: uuidv4(), name: "شرب 3 لتر ماء", completedDates: [isoToday] },
          { id: uuidv4(), name: "تمارين إطالة 15 دقيقة", completedDates: [] },
          { id: uuidv4(), name: "وجبة بروتين متكاملة", completedDates: [isoToday] },
          { id: uuidv4(), name: "نوم 7 ساعات", completedDates: [] },
          { id: uuidv4(), name: "مشي 10,000 خطوة", completedDates: [] },
        ],
        notes: [
          { id: uuidv4(), date: isoToday, content: "الهدف هذا الأسبوع: زيادة أوزان تمارين الساق تدريجيا والحفاظ على النظام الغذائي." },
        ],
      };

    case "productivity":
      return {
        settings: { language: "ar", theme: "light" },
        tags: [
          { id: uuidv4(), date: isoToday, text: "تسليم المشروع" },
          { id: uuidv4(), date: isoToday, text: "مراجعة الأولويات" },
          { id: uuidv4(), date: nextDayISO, text: "تخطيط الربع القادم" },
        ],
        events: [
          { id: uuidv4(), date: isoToday, time: "09:00", title: "اجتماع الفريق الصباحي" },
          { id: uuidv4(), date: isoToday, time: "11:00", title: "مكالمة مع العميل" },
          { id: uuidv4(), date: isoToday, time: "14:00", title: "مراجعة تقدم المشروع" },
          { id: uuidv4(), date: nextDayISO, time: "10:00", title: "جلسة عصف ذهني للأفكار الجديدة" },
          { id: uuidv4(), date: dayAfterISO, time: "13:00", title: "عرض تقديمي للإدارة" },
          { id: uuidv4(), date: isoDays[4], time: "16:00", title: "تقييم أداء الفريق" },
        ],
        tasks: [
          { id: uuidv4(), date: isoToday, text: "إنهاء التقرير الشهري", completed: false, isWeekly: false },
          { id: uuidv4(), date: isoToday, text: "الرد على رسائل البريد المتراكمة", completed: false, isWeekly: false },
          { id: uuidv4(), date: isoToday, text: "تحديث ملف المشروع", completed: false, isWeekly: false },
          { id: uuidv4(), date: nextDayISO, text: "إعداد العرض التقديمي", completed: false, isWeekly: false },
          { id: uuidv4(), date: dayAfterISO, text: "مراجعة العقد مع المحامي", completed: false, isWeekly: false },
          { id: uuidv4(), date: weekStartISO, text: "إرسال التقرير الأسبوعي للمدير", completed: false, isWeekly: true },
          { id: uuidv4(), date: weekStartISO, text: "تنظيم ملفات المشاريع على الكلاود", completed: false, isWeekly: true },
          { id: uuidv4(), date: weekStartISO, text: "متابعة الفواتير المستحقة", completed: false, isWeekly: true },
        ],
        habits: [
          { id: uuidv4(), name: "مراجعة قائمة المهام صباحا", completedDates: [isoToday] },
          { id: uuidv4(), name: "قراءة 20 دقيقة", completedDates: [] },
          { id: uuidv4(), name: "شرب 2 لتر ماء", completedDates: [] },
          { id: uuidv4(), name: "تدوين 3 إنجازات اليوم", completedDates: [] },
        ],
        notes: [
          { id: uuidv4(), date: isoToday, content: "أولوية قصوى: تسليم المشروع قبل نهاية الأسبوع. يجب التنسيق مع فريق التصميم." },
        ],
      };

    case "student":
      return {
        settings: { language: "ar", theme: "light" },
        tags: [
          { id: uuidv4(), date: isoToday, text: "مراجعة الرياضيات" },
          { id: uuidv4(), date: nextDayISO, text: "تسليم البحث" },
          { id: uuidv4(), date: dayAfterISO, text: "اختبار الفيزياء" },
        ],
        events: [
          { id: uuidv4(), date: isoToday, time: "08:00", title: "محاضرة الرياضيات" },
          { id: uuidv4(), date: isoToday, time: "10:30", title: "معمل الفيزياء" },
          { id: uuidv4(), date: isoToday, time: "14:00", title: "جلسة دراسة جماعية" },
          { id: uuidv4(), date: nextDayISO, time: "09:00", title: "محاضرة البرمجة" },
          { id: uuidv4(), date: nextDayISO, time: "13:00", title: "ساعة مكتبية مع الدكتور" },
          { id: uuidv4(), date: dayAfterISO, time: "08:30", title: "اختبار فيزياء نصفي" },
        ],
        tasks: [
          { id: uuidv4(), date: isoToday, text: "حل تمارين الفصل الخامس رياضيات", completed: false, isWeekly: false },
          { id: uuidv4(), date: isoToday, text: "كتابة ملخص محاضرة اليوم", completed: false, isWeekly: false },
          { id: uuidv4(), date: nextDayISO, text: "تسليم بحث اللغة العربية", completed: false, isWeekly: false },
          { id: uuidv4(), date: nextDayISO, text: "مراجعة كود مشروع البرمجة", completed: false, isWeekly: false },
          { id: uuidv4(), date: dayAfterISO, text: "مراجعة نهائية للفيزياء", completed: false, isWeekly: false },
          { id: uuidv4(), date: weekStartISO, text: "تنظيم ملاحظات جميع المواد", completed: false, isWeekly: true },
          { id: uuidv4(), date: weekStartISO, text: "التسجيل لدورة تقوية في الرياضيات", completed: false, isWeekly: true },
        ],
        habits: [
          { id: uuidv4(), name: "دراسة ساعتين متواصلتين", completedDates: [] },
          { id: uuidv4(), name: "مراجعة المحاضرات قبل النوم", completedDates: [isoToday] },
          { id: uuidv4(), name: "قراءة 15 صفحة من مرجع", completedDates: [] },
          { id: uuidv4(), name: "شرب 2 لتر ماء", completedDates: [] },
          { id: uuidv4(), name: "نوم قبل 11 مساء", completedDates: [] },
        ],
        notes: [
          { id: uuidv4(), date: isoToday, content: "التركيز هذا الأسبوع على الفيزياء. الاختبار النصفي يشمل الفصول 1-5. لا أنسى مراجعة القوانين." },
        ],
      };

    case "wellness":
      return {
        settings: { language: "ar", theme: "light" },
        tags: [
          { id: uuidv4(), date: isoToday, text: "يوم هادئ" },
          { id: uuidv4(), date: isoToday, text: "التركيز على الذات" },
          { id: uuidv4(), date: nextDayISO, text: "طاقة إيجابية" },
        ],
        events: [
          { id: uuidv4(), date: isoToday, time: "07:00", title: "جلسة تأمل صباحية" },
          { id: uuidv4(), date: isoToday, time: "10:00", title: "مشي في الطبيعة" },
          { id: uuidv4(), date: isoToday, time: "18:00", title: "يوغا مسائية" },
          { id: uuidv4(), date: nextDayISO, time: "08:00", title: "موعد مع المعالج النفسي" },
          { id: uuidv4(), date: dayAfterISO, time: "17:00", title: "لقاء مع صديق مقرب" },
          { id: uuidv4(), date: isoDays[5], time: "09:00", title: "ورشة تنمية ذاتية" },
        ],
        tasks: [
          { id: uuidv4(), date: isoToday, text: "كتابة 3 أشياء ممتن لها", completed: false, isWeekly: false },
          { id: uuidv4(), date: isoToday, text: "تنظيم مساحة العمل", completed: false, isWeekly: false },
          { id: uuidv4(), date: nextDayISO, text: "تحضير وجبة صحية جديدة", completed: false, isWeekly: false },
          { id: uuidv4(), date: dayAfterISO, text: "الابتعاد عن الشاشات ساعتين", completed: false, isWeekly: false },
          { id: uuidv4(), date: weekStartISO, text: "قراءة كتاب عن تطوير الذات", completed: false, isWeekly: true },
          { id: uuidv4(), date: weekStartISO, text: "ترتيب غرفة النوم بالكامل", completed: false, isWeekly: true },
        ],
        habits: [
          { id: uuidv4(), name: "تأمل 10 دقائق", completedDates: [isoToday] },
          { id: uuidv4(), name: "تدوين المشاعر في دفتر", completedDates: [] },
          { id: uuidv4(), name: "شرب 2 لتر ماء", completedDates: [isoToday] },
          { id: uuidv4(), name: "نوم 8 ساعات", completedDates: [] },
          { id: uuidv4(), name: "المشي 20 دقيقة", completedDates: [] },
          { id: uuidv4(), name: "قراءة 10 صفحات", completedDates: [] },
        ],
        notes: [
          { id: uuidv4(), date: isoToday, content: "اليوم أركز على راحتي النفسية. لا مهام مرهقة. فقط ما يجلب السلام الداخلي والهدوء." },
        ],
      };

    default:
      return getEmptyData();
  }
}

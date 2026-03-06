import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isSameWeek, addWeeks, subWeeks, getWeekOfMonth } from "date-fns";

const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const AR_DAYS_SHORT = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const AR_DAYS_FULL = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const AR_WEEKS = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"];

const HE_MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const HE_DAYS_SHORT = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const HE_WEEKS = ["הראשון", "השני", "השלישי", "הרביעי", "החמישי", "השישי"];

export function getArabicMonth(date: Date): string {
  return AR_MONTHS[date.getMonth()];
}

export function getArabicDayShort(date: Date): string {
  return AR_DAYS_SHORT[date.getDay()];
}

export function getArabicDayFull(date: Date): string {
  return AR_DAYS_FULL[date.getDay()];
}

export function getArabicDay(date: Date): string {
  return AR_DAYS_FULL[date.getDay()];
}

export function formatDayDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function formatISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getWeekHeader(date: Date, lang: string = 'ar'): string {
  const weekNum = getWeekOfMonth(date, { weekStartsOn: 0 });

  if (lang === 'he') {
    const weekText = HE_WEEKS[weekNum - 1] || "האחרון";
    const monthText = HE_MONTHS[date.getMonth()];
    const start = startOfWeek(date, { weekStartsOn: 0 });
    const end = endOfWeek(date, { weekStartsOn: 0 });
    return `השבוע ${weekText} של ${monthText} (${start.getDate()}-${end.getDate()}) ${date.getFullYear()}`;
  }

  const weekText = AR_WEEKS[weekNum - 1] || "الأخير";
  const monthText = AR_MONTHS[date.getMonth()];
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  return `الأسبوع ${weekText} من شهر ${monthText} (${start.getDate()}-${end.getDate()}) ${date.getFullYear()}`;
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export function getDayShortName(date: Date, lang: string = 'ar'): string {
  if (lang === 'he') return HE_DAYS_SHORT[date.getDay()];
  return AR_DAYS_SHORT[date.getDay()];
}

export function isInSameWeek(d1: Date, d2: Date): boolean {
  return isSameWeek(d1, d2, { weekStartsOn: 0 });
}

export { isSameDay, addWeeks, subWeeks };

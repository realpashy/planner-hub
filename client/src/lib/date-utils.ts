import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, addWeeks, subWeeks, startOfMonth, getWeeksInMonth, getWeekOfMonth } from "date-fns";

// We use hardcoded Arabic arrays to enforce Latin digits for numbers.
const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const AR_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const AR_WEEKS = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"];

export function getArabicMonth(date: Date): string {
  return AR_MONTHS[date.getMonth()];
}

export function getArabicDay(date: Date): string {
  return AR_DAYS[date.getDay()];
}

export function formatDayDate(date: Date): string {
  // Enforces latin digits e.g., "06/03/2026"
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function formatISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getWeekHeader(date: Date): string {
  const weekNum = getWeekOfMonth(date, { weekStartsOn: 0 }); // 0 = Sunday
  const weekText = AR_WEEKS[weekNum - 1] || "الأخير";
  const monthText = getArabicMonth(date);
  
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  
  return `الأسبوع ${weekText} من شهر ${monthText} (${start.getDate()}-${end.getDate()}) ${date.getFullYear()}`;
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export { isSameDay, addWeeks, subWeeks };

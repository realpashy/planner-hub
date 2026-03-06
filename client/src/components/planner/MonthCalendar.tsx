import { useState } from "react";
import { isSameDay, getWeekDays, formatISODate } from "@/lib/date-utils";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay, isSameWeek } from "date-fns";

const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const DAY_HEADERS = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

export function MonthCalendar({ selectedDate, onSelectDate }: { selectedDate: Date, onSelectDate: (d: Date) => void }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const firstDayOfWeek = getDay(daysInMonth[0]);
  const paddingDays = Array.from({ length: firstDayOfWeek }).map((_, i) => i);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-xl border border-slate-100 w-72" data-testid="month-calendar">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors"
          data-testid="button-prev-month"
        >
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
        <span className="font-bold text-sm text-slate-800">
          {AR_MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors"
          data-testid="button-next-month"
        >
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1 text-center text-[10px] font-bold text-slate-400">
        {DAY_HEADERS.map((d, i) => <div key={i} className="py-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {paddingDays.map(i => <div key={`pad-${i}`} className="h-7" />)}
        {daysInMonth.map(date => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          const isSelectedWeek = isSameWeek(date, selectedDate, { weekStartsOn: 0 });

          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelectDate(date)}
              className={`
                h-7 w-7 mx-auto rounded-lg text-xs font-semibold transition-all flex items-center justify-center
                ${isSelected
                  ? 'bg-primary text-white shadow-sm'
                  : isToday
                    ? 'bg-primary/10 text-primary font-bold'
                    : isSelectedWeek
                      ? 'bg-primary/5 text-primary/80'
                      : 'text-slate-600 hover:bg-slate-100'}
              `}
              data-testid={`calendar-day-${formatISODate(date)}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

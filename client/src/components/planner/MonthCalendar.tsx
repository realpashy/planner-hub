import React, { useState } from "react";
import { formatDayDate, getWeekHeader, isSameDay } from "@/lib/date-utils";
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon } from "lucide-react";
import { startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay, format } from "date-fns";

export function MonthCalendar({ selectedDate, onSelectDate }: { selectedDate: Date, onSelectDate: (d: Date) => void }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));
  
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const firstDayOfWeek = getDay(daysInMonth[0]); // 0 = Sun
  const paddingDays = Array.from({ length: firstDayOfWeek }).map((_, i) => i);

  return (
    <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 w-80">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-50 rounded-full">
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
        <div className="font-bold text-lg text-slate-800 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-primary" />
          {format(currentMonth, "MMMM yyyy")}
        </div>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-50 rounded-full">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-slate-400">
        {["ح", "ن", "ث", "ر", "خ", "ج", "س"].map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {paddingDays.map(i => <div key={`pad-${i}`} className="h-8" />)}
        {daysInMonth.map(date => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelectDate(date)}
              className={`
                h-8 rounded-full text-sm font-semibold transition-all flex items-center justify-center
                ${isSelected ? 'bg-primary text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'}
                ${isToday && !isSelected ? 'ring-2 ring-primary/30 ring-inset' : ''}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

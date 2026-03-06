import { useRef, useEffect } from "react";
import { getDayShortName, isSameDay, formatISODate } from "@/lib/date-utils";
import { motion } from "framer-motion";
import type { TaskItem } from "@shared/schema";

interface DayStripProps {
  days: Date[];
  selectedDate: Date;
  onSelect: (date: Date) => void;
  tasks?: TaskItem[];
}

export function DayStrip({ days, selectedDate, onSelect, tasks = [] }: DayStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDate, days]);

  function getDayProgress(date: Date): { completed: number; total: number } {
    const iso = formatISODate(date);
    const dayTasks = tasks.filter(t => t.date === iso && !t.isWeekly);
    const completed = dayTasks.filter(t => t.completed).length;
    return { completed, total: dayTasks.length };
  }

  return (
    <div className="relative" data-testid="day-strip">
      <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none rounded-l-2xl" />
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none rounded-r-2xl" />

      <div
        ref={scrollRef}
        className="flex overflow-x-auto hide-scrollbar gap-2 px-3 py-2 snap-x-mandatory"
        dir="rtl"
      >
        {days.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          const { completed, total } = getDayProgress(date);
          const allDone = total > 0 && completed === total;

          return (
            <motion.button
              key={date.toISOString()}
              data-selected={isSelected}
              data-testid={`day-button-${date.getDay()}`}
              onClick={() => onSelect(date)}
              whileTap={{ scale: 0.95 }}
              className={`
                flex-shrink-0 snap-center flex flex-col items-center justify-center
                w-[4.25rem] h-[5rem] rounded-2xl transition-all duration-200 relative
                ${isSelected
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : isToday
                    ? 'bg-primary/8 text-primary border-2 border-primary/25'
                    : 'bg-slate-50 text-slate-600 border border-slate-100/80 hover:border-primary/20 hover:bg-primary/5'}
              `}
            >
              <span className={`text-[11px] font-semibold mb-0.5 ${isSelected ? 'text-white/75' : isToday ? 'text-primary/70' : 'text-slate-400'}`}>
                {getDayShortName(date)}
              </span>
              <span className={`text-xl font-bold leading-none ${isSelected ? 'text-white' : ''}`}>
                {date.getDate()}
              </span>

              {total > 0 && (
                <div className={`flex gap-0.5 mt-1.5`}>
                  {allDone ? (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-green-300' : 'bg-green-500'}`} />
                  ) : (
                    <>
                      <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/60' : 'bg-slate-300'}`} />
                      <div className={`w-1 h-1 rounded-full ${completed >= 1 ? (isSelected ? 'bg-white' : 'bg-primary') : (isSelected ? 'bg-white/30' : 'bg-slate-200')}`} />
                    </>
                  )}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

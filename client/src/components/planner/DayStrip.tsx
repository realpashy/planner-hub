import { useRef, useEffect } from "react";
import { getDayShortName, isSameDay, formatISODate } from "@/lib/date-utils";
import { motion } from "framer-motion";
import type { TaskItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DayStripProps {
  days: Date[];
  selectedDate: Date;
  onSelect: (date: Date) => void;
  tasks?: TaskItem[];
}

export function DayStrip({ days, selectedDate, onSelect, tasks = [] }: DayStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedKey = selectedDate.toISOString();
  useEffect(() => {
    if (scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector('[data-selected="true"]') as HTMLElement;
      if (selectedEl) {
        const container = scrollRef.current;
        const scrollLeft = selectedEl.offsetLeft - container.offsetWidth / 2 + selectedEl.offsetWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [selectedKey]);

  function getDayProgress(date: Date): { completed: number; total: number } {
    const iso = formatISODate(date);
    const dayTasks = tasks.filter(t => t.date === iso && !t.isWeekly);
    const completed = dayTasks.filter(t => t.completed).length;
    return { completed, total: dayTasks.length };
  }

  return (
    <div className="weekly-day-strip-wrap relative" data-testid="day-strip">
      <div
        ref={scrollRef}
        className="weekly-day-strip hide-scrollbar snap-x-mandatory flex justify-center gap-3 overflow-x-auto py-4 md:gap-4"
        dir="rtl"
      >
        {days.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          const { completed, total } = getDayProgress(date);
          const allDone = total > 0 && completed === total;

          return (
            <motion.div key={date.toISOString()} whileTap={{ scale: 0.95 }} className="flex-shrink-0 snap-center">
              <Button
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={cn(
                  "flex h-24 w-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 font-bold transition-all duration-200 md:h-28 md:w-24",
                  isSelected && "border-blue-500 bg-blue-600 text-white shadow-xl shadow-blue-500/30 hover:bg-blue-700",
                  !isSelected && isToday && "border-blue-400 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-300",
                  !isSelected && !isToday && "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                )}
                onClick={() => onSelect(date)}
                data-selected={isSelected}
                data-testid={`day-button-${date.getDay()}`}
              >
                <span className={cn("text-xs font-bold uppercase tracking-wider", isSelected && "text-blue-100 opacity-90")}>
                  {getDayShortName(date)}
                </span>
                <span className={cn("text-2xl font-extrabold leading-none md:text-3xl", isSelected && "text-white")}>
                  {date.getDate()}
                </span>
                {total > 0 && (
                  <div className="mt-2 flex gap-1">
                    {allDone ? (
                      <div className={cn("h-2 w-2 rounded-full", isSelected ? "bg-green-300" : "bg-green-500")} />
                    ) : (
                      <>
                        <div className={cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-blue-200/60" : "bg-slate-400/50")} />
                        <div className={cn("h-1.5 w-1.5 rounded-full", completed >= 1 ? (isSelected ? "bg-blue-200" : "bg-blue-500") : (isSelected ? "bg-blue-200/30" : "bg-slate-300"))} />
                      </>
                    )}
                  </div>
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}




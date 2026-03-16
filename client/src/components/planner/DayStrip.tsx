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
        className="weekly-day-strip flex overflow-x-auto hide-scrollbar gap-2 md:gap-3 py-2 snap-x-mandatory justify-center"
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
                  "flex flex-col items-center justify-center w-[4.5rem] h-[5.5rem] md:w-[5.5rem] md:h-[6.5rem] rounded-2xl gap-0.5 transition-all duration-200",
                  isSelected && "shadow-lg shadow-primary/30",
                  !isSelected && isToday && "bg-primary/10 text-primary border-2 border-primary/25 hover:bg-primary/15",
                  !isSelected && !isToday && "bg-muted hover:border-primary/20 hover:bg-primary/5"
                )}
                onClick={() => onSelect(date)}
                data-selected={isSelected}
                data-testid={`day-button-${date.getDay()}`}
              >
                <span className={cn("text-xs md:text-sm font-semibold", isSelected && "text-primary-foreground/75", !isSelected && isToday && "text-primary/70", !isSelected && !isToday && "text-muted-foreground")}>
                  {getDayShortName(date)}
                </span>
                <span className="text-xl md:text-2xl font-bold leading-none">
                  {date.getDate()}
                </span>
                {total > 0 && (
                  <div className="flex gap-0.5 mt-1.5">
                    {allDone ? (
                      <div className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-green-300" : "bg-green-500")} />
                    ) : (
                      <>
                        <div className={cn("w-1 h-1 rounded-full", isSelected ? "bg-primary-foreground/60" : "bg-muted-foreground/50")} />
                        <div className={cn("w-1 h-1 rounded-full", completed >= 1 ? (isSelected ? "bg-primary-foreground" : "bg-primary") : (isSelected ? "bg-primary-foreground/30" : "bg-muted"))} />
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




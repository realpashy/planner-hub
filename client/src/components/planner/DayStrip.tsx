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
        className="weekly-day-strip flex snap-x-mandatory justify-center gap-2 overflow-x-auto py-2 hide-scrollbar md:gap-3"
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
                  "flex h-[5.4rem] w-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-[calc(var(--radius)+0.6rem)] border transition-all duration-200 md:h-[6.1rem] md:w-[5.2rem]",
                  isSelected && "border-primary/30 bg-primary text-primary-foreground shadow-[0_18px_36px_-20px_rgba(149,223,30,0.55)]",
                  !isSelected && isToday && "border-primary/20 bg-primary/[0.1] text-primary hover:border-primary/35 hover:bg-primary/[0.14]",
                  !isSelected && !isToday && "border-border/80 bg-card/[0.92] text-foreground hover:border-primary/20 hover:bg-muted"
                )}
                onClick={() => onSelect(date)}
                data-selected={isSelected}
                data-testid={`day-button-${date.getDay()}`}
              >
                <span className={cn("text-xs font-semibold md:text-sm", isSelected && "text-primary-foreground/75", !isSelected && isToday && "text-primary/80", !isSelected && !isToday && "text-muted-foreground")}>
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
                        <div className={cn("h-1 w-1 rounded-full", isSelected ? "bg-primary-foreground/60" : "bg-muted-foreground/50")} />
                        <div className={cn("h-1 w-1 rounded-full", completed >= 1 ? (isSelected ? "bg-primary-foreground" : "bg-primary") : (isSelected ? "bg-primary-foreground/30" : "bg-muted"))} />
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




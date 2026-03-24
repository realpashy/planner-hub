import { useMemo, useState } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isSameDay, isSameMonth, startOfMonth, subMonths } from "date-fns";
import { he } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DAY_HEADERS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

interface CashflowDateFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function formatDateValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function CashflowDateField({
  value,
  onChange,
  placeholder = "בחר תאריך",
  className,
}: CashflowDateFieldProps) {
  const selectedDate = useMemo(() => (value ? new Date(`${value}T12:00:00`) : new Date()), [value]);
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(selectedDate));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const paddingDays = Array.from({ length: getDay(monthStart) });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-12 w-full rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-card/[0.88] px-3.5 text-right text-base font-semibold shadow-[var(--app-shadow)] hover:bg-muted/60",
            className,
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 pe-2 text-right">
            <span className="truncate">
              {value ? format(selectedDate, "d MMMM yyyy", { locale: he }) : placeholder}
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[19rem] rounded-[calc(var(--radius)+0.5rem)] border-border/70 bg-popover/[0.98] p-4 shadow-xl backdrop-blur-xl" dir="rtl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[calc(var(--radius)+0.25rem)] border border-border/60 bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="text-sm font-black text-foreground">
              {format(currentMonth, "LLLL yyyy", { locale: he })}
            </div>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[calc(var(--radius)+0.25rem)] border border-border/60 bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-muted-foreground">
            {DAY_HEADERS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, index) => (
              <div key={`pad-${index}`} className="h-9" />
            ))}
            {monthDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    onChange(formatDateValue(day));
                    setOpen(false);
                  }}
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-[calc(var(--radius)+0.25rem)] text-sm font-semibold transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-[var(--app-shadow)]"
                      : isToday
                        ? "border border-primary/25 bg-primary/[0.08] text-primary"
                        : "text-foreground hover:bg-muted/70",
                    !isCurrentMonth && "opacity-40",
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

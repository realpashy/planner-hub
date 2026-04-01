import { motion } from "framer-motion";
import { Check, Minus, Pencil, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { HabitDefinition } from "@/modules/habits/types";
import {
  HABIT_CATEGORY_META,
  formatHabitValue,
  getHabitValueForDate,
  isHabitComplete,
} from "@/modules/habits/utils/habits";

interface HabitCardProps {
  habit: HabitDefinition;
  todayKey: string;
  logs: { habitId: string; date: string; value: number }[];
  streak: number;
  highlighted?: boolean;
  onToggle: () => void;
  onAdjust: (value: number) => void;
  onEdit: () => void;
}

export function HabitCard({
  habit,
  todayKey,
  logs,
  streak,
  highlighted = false,
  onToggle,
  onAdjust,
  onEdit,
}: HabitCardProps) {
  const category = HABIT_CATEGORY_META[habit.category];
  const currentValue = getHabitValueForDate(habit, logs as never, todayKey);
  const completed = isHabitComplete(habit, currentValue);
  const progress =
    habit.type === "binary"
      ? completed
        ? 100
        : 0
      : Math.min(100, Math.round((currentValue / habit.target) * 100));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "surface-shell rounded-[calc(var(--radius)+0.75rem)] border p-4 text-right transition-all duration-200 scroll-mt-28",
        completed ? "border-primary/30 bg-primary/[0.05]" : "border-border/70",
        highlighted ? "border-primary/45 shadow-[0_0_0_1px_rgba(149,223,30,0.25),0_0_24px_rgba(149,223,30,0.12)]" : "",
      )}
      id={`habit-card-${habit.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                <span>{category.label}</span>
                <span>{category.emoji}</span>
              </div>
              <p className="text-base font-black text-foreground">{habit.name}</p>
              {habit.description ? (
                <p className="text-xs leading-6 text-muted-foreground">{habit.description}</p>
              ) : null}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-[calc(var(--radius)+0.375rem)]"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">سلسلة حالية: {streak} أيام</span>
                <span className="text-foreground">{formatHabitValue(habit, currentValue)}</span>
              </div>
              <Progress
                value={progress}
                className="h-2.5 rounded-full bg-background/70 [&>div]:bg-[linear-gradient(90deg,#95df1e,#34d399,#38bdf8)]"
              />
            </div>

          {habit.type === "binary" || habit.trackingMode === "check" ? (
            <div className="space-y-2">
              {habit.type !== "binary" ? (
                <div className="rounded-[calc(var(--radius)+0.35rem)] border border-border/70 bg-background/55 px-3.5 py-2.5 text-right">
                  <p className="text-[11px] font-semibold text-muted-foreground">الهدف اليومي</p>
                  <div className="mt-1 flex items-baseline justify-start gap-1 text-right">
                    <span className="text-sm font-black text-foreground">{habit.target}</span>
                    <span className="text-sm font-semibold text-muted-foreground">{habit.unit}</span>
                  </div>
                </div>
              ) : null}
            <Button
              variant={completed ? "secondary" : "default"}
              className={cn(
                "w-full rounded-[calc(var(--radius)+0.45rem)]",
                completed
                  ? "border-primary/20 bg-primary/[0.1] text-primary hover:bg-primary/[0.14]"
                  : "",
              )}
              onClick={onToggle}
            >
              <Check className="h-4 w-4" />
              {completed ? "تم اليوم" : "وضع علامة اليوم"}
            </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-[calc(var(--radius)+0.45rem)] border border-border/70 bg-background/55 p-2">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-[calc(var(--radius)+0.35rem)]"
                onClick={() => onAdjust(currentValue + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <div className="space-y-1 text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="cashflow-number text-lg font-black text-foreground">{currentValue}</span>
                  <span className="text-sm font-semibold text-muted-foreground">{habit.unit}</span>
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  الهدف اليومي {habit.target} {habit.unit}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-[calc(var(--radius)+0.35rem)]"
                onClick={() => onAdjust(Math.max(0, currentValue - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div
          className={cn(
            "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[calc(var(--radius)+0.5rem)] border bg-background/70 text-xl",
            category.chipClass,
            category.glowClass,
          )}
        >
          <span>{habit.emoji ?? category.emoji}</span>
        </div>
      </div>

      {completed ? (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1 text-[11px] font-semibold text-primary"
        >
          <Zap className="h-3.5 w-3.5" />
          إنجاز جميل لهذا اليوم
        </motion.div>
      ) : null}
    </motion.div>
  );
}

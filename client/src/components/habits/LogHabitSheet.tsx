import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Habit, type HabitLog, generateId, getTodayKey } from "@/lib/habits";

interface LogHabitSheetProps {
  open: boolean;
  habit: Habit | null;
  existingLog?: HabitLog | null;
  onClose: () => void;
  onSave: (log: HabitLog) => void;
}

export function LogHabitSheet({ open, habit, existingLog, onClose, onSave }: LogHabitSheetProps) {
  const [value, setValue] = useState(0);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setValue(existingLog?.value ?? (habit?.targetValue ?? 1));
    setNote(existingLog?.note ?? "");
  }, [open, existingLog, habit]);

  if (!habit) return null;

  const target = habit.targetValue ?? 1;
  const unit = habit.targetUnit ?? (habit.type === "duration" ? "دقيقة" : "مرة");

  function handleSave() {
    if (!habit) return;
    const timestamp = new Date().toISOString();
    const log: HabitLog = {
      id: existingLog?.id ?? generateId(),
      habitId: habit.id,
      date: getTodayKey(),
      completed: value >= target,
      value,
      note: note.trim() || undefined,
      createdAt: existingLog?.createdAt ?? timestamp,
    };
    onSave(log);
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="bottom"
        dir="rtl"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          "max-h-[55dvh] rounded-t-[1.25rem] border-t border-border/60 p-0 bg-popover",
          "md:mx-auto md:mb-4 md:max-w-[50vw] md:rounded-[calc(var(--radius)+1rem)] md:border",
          "bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.04),transparent_40%)]",
          "dark:bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.10),transparent_40%),linear-gradient(180deg,rgba(30,30,30,0.99),rgba(22,22,22,0.99))]",
          "[&>button]:left-4 [&>button]:right-auto [&>button]:top-4",
        )}
      >
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-border/60" />
        </div>
        <SheetHeader className="px-5 pb-2 pt-1 text-right">
          <SheetTitle className="flex items-center justify-end gap-2">
            <span>{habit.name}</span>
            {habit.icon && <span className="text-xl">{habit.icon}</span>}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 px-5 pb-7">
          {/* Target reminder */}
          <p className="text-right text-xs text-muted-foreground">
            الهدف:{" "}
            <span className="habits-number font-black text-foreground">{target}</span> {unit}
          </p>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-5">
            <motion.button
              type="button"
              whileTap={{ scale: 0.82 }}
              onClick={() => setValue((v) => Math.max(0, v - 1))}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border/60 bg-muted/50 text-foreground transition-colors hover:bg-muted"
            >
              <Minus className="h-4 w-4" />
            </motion.button>

            <div className="min-w-[5rem] text-center">
              <span className="habits-number text-4xl font-black tabular-nums text-foreground">{value}</span>
              <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{unit}</p>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.82 }}
              onClick={() => setValue((v) => v + 1)}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-violet-500/50 bg-violet-500/[0.12] text-violet-600 dark:text-violet-300 transition-colors hover:bg-violet-500/[0.18]"
            >
              <Plus className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-muted/60">
              <motion.div
                className="h-full rounded-full bg-violet-500"
                animate={{ width: `${Math.min(100, (value / target) * 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {value >= target && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-right text-xs font-bold text-violet-600 dark:text-violet-300"
              >
                🎉 وصلت للهدف!
              </motion.p>
            )}
          </div>

          {/* Note */}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ملاحظة (اختياري)"
            dir="rtl"
            rows={2}
            className={cn(
              "w-full resize-none rounded-[calc(var(--radius)+0.25rem)] border border-border/70 bg-card/[0.88] px-3.5 py-3",
              "text-right text-sm font-medium placeholder:text-muted-foreground/60",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
              "dark:bg-card/[0.50]",
            )}
          />

          <Button
            onClick={handleSave}
            size="lg"
            className="w-full rounded-[calc(var(--radius)+0.5rem)] bg-violet-600 font-bold text-white hover:bg-violet-700 border-violet-500/50"
          >
            حفظ
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

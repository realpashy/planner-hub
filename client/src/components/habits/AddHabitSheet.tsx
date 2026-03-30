import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  type Habit,
  type HabitType,
  type HabitFrequency,
  type HabitCategory,
  HABIT_CATEGORY_LABELS,
  HABIT_CATEGORY_ICONS,
  HABIT_TYPE_LABELS,
  FREQUENCY_LABELS,
  generateId,
  getTodayKey,
} from "@/lib/habits";

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: HabitCategory[] = [
  "health", "fitness", "mindfulness", "learning", "productivity", "social", "creative", "custom",
];

const TYPES: HabitType[] = ["check", "count", "duration"];

const FREQUENCIES: HabitFrequency[] = ["daily", "weekdays", "weekends", "weekly", "custom"];

const EMOJI_PICKER = [
  "💧", "🚶", "🧘", "📚", "🏋️", "🎯", "💪", "🍎",
  "🌙", "☀️", "🧠", "✍️", "🎵", "🌱", "💊", "🛏️",
  "🏃", "🧹", "🍳", "🎨",
];

const DAY_LABELS = ["أح", "إث", "ثل", "أر", "خم", "جم", "سب"];

// ── Sheet shell ───────────────────────────────────────────────────────────────

function SheetShell({
  children,
  open,
  onClose,
  title,
}: {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  title: string;
}) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="bottom"
        dir="rtl"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          "max-h-[92dvh] overflow-y-auto rounded-t-[1.25rem] border-t border-border/60 p-0 bg-popover",
          "md:mx-auto md:mb-4 md:max-w-[60vw] md:rounded-[calc(var(--radius)+1rem)] md:border",
          "bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.04),transparent_40%)]",
          "dark:bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.10),transparent_40%),linear-gradient(180deg,rgba(30,30,30,0.99),rgba(22,22,22,0.99))]",
          "[&>button]:left-4 [&>button]:right-auto [&>button]:top-4",
        )}
      >
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-border/60" />
        </div>
        <SheetHeader className="px-5 pb-2 pt-1 text-right">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface AddHabitSheetProps {
  open: boolean;
  initialHabit?: Habit | null;
  onClose: () => void;
  onSave: (habit: Habit) => void;
  onDelete?: (habitId: string) => void;
}

export function AddHabitSheet({ open, initialHabit, onClose, onSave, onDelete }: AddHabitSheetProps) {
  const isEditing = Boolean(initialHabit);

  // Step 1 fields
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<HabitCategory>("health");
  const [type, setType] = useState<HabitType>("check");

  // Step 2 fields
  const [targetValue, setTargetValue] = useState("");
  const [targetUnit, setTargetUnit] = useState("");
  const [frequency, setFrequency] = useState<HabitFrequency>("daily");
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [icon, setIcon] = useState<string>("");
  const [reminderTime, setReminderTime] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setStep(1);
      setError("");
      return;
    }
    if (initialHabit) {
      setName(initialHabit.name);
      setCategory(initialHabit.category);
      setType(initialHabit.type);
      setTargetValue(initialHabit.targetValue?.toString() ?? "");
      setTargetUnit(initialHabit.targetUnit ?? "");
      setFrequency(initialHabit.frequency);
      setCustomDays(initialHabit.customDays ?? []);
      setIcon(initialHabit.icon ?? "");
      setReminderTime(initialHabit.reminderTime ?? "");
    } else {
      setName("");
      setCategory("health");
      setType("check");
      setTargetValue("");
      setTargetUnit("");
      setFrequency("daily");
      setCustomDays([]);
      setIcon("");
      setReminderTime("");
    }
  }, [initialHabit, open]);

  function handleNext() {
    if (!name.trim()) {
      setError("أدخل اسم العادة");
      return;
    }
    setError("");
    setStep(2);
  }

  function handleSave() {
    if (!name.trim()) {
      setStep(1);
      setError("أدخل اسم العادة");
      return;
    }

    const timestamp = new Date().toISOString();
    const habit: Habit = {
      id: initialHabit?.id ?? generateId(),
      name: name.trim(),
      category,
      type,
      targetValue: (type === "count" || type === "duration") && targetValue ? Math.max(1, Number(targetValue) || 1) : undefined,
      targetUnit: targetUnit.trim() || undefined,
      frequency,
      customDays: frequency === "custom" ? customDays : undefined,
      icon: icon || undefined,
      reminderTime: reminderTime || undefined,
      isArchived: initialHabit?.isArchived ?? false,
      order: initialHabit?.order ?? 999,
      createdAt: initialHabit?.createdAt ?? timestamp,
    };
    onSave(habit);
    onClose();
  }

  const title = isEditing ? "تعديل العادة" : "إضافة عادة جديدة";

  return (
    <SheetShell open={open} onClose={onClose} title={title}>
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="space-y-5 px-5 pb-7"
          >
            {/* Step indicator */}
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-muted-foreground">الخطوة 1 من 2</span>
              <div className="flex gap-1">
                <div className="h-1.5 w-6 rounded-full bg-violet-500" />
                <div className="h-1.5 w-6 rounded-full bg-border/60" />
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label className="text-right text-sm font-bold">اسم العادة</Label>
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="مثل: قراءة 20 دقيقة"
                dir="rtl"
                className="h-12 text-right font-semibold placeholder:font-normal"
                autoComplete="off"
              />
              {error && <p className="text-xs text-destructive text-right">{error}</p>}
            </div>

            {/* Category grid */}
            <div className="space-y-2">
              <Label className="text-right text-sm font-bold">الفئة</Label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-[calc(var(--radius)+0.25rem)] border p-2.5 text-center transition-all",
                      category === cat
                        ? "border-violet-500/50 bg-violet-500/[0.12] text-violet-700 dark:text-violet-300"
                        : "border-border/50 bg-muted/40 text-muted-foreground hover:border-border",
                    )}
                  >
                    <span className="text-xl leading-none">{HABIT_CATEGORY_ICONS[cat]}</span>
                    <span className="text-[10px] font-bold leading-tight">{HABIT_CATEGORY_LABELS[cat]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Type selector */}
            <div className="space-y-2">
              <Label className="text-right text-sm font-bold">نوع التتبع</Label>
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "rounded-[calc(var(--radius)+0.25rem)] border p-3 text-center transition-all",
                      type === t
                        ? "border-violet-500/50 bg-violet-500/[0.12] text-violet-700 dark:text-violet-300"
                        : "border-border/50 bg-muted/40 text-muted-foreground hover:border-border",
                    )}
                  >
                    <p className="text-xs font-black">{HABIT_TYPE_LABELS[t]}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {t === "check" ? "✓ / ✗" : t === "count" ? "1, 2, 3..." : "دقائق"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleNext}
              size="lg"
              className="w-full rounded-[calc(var(--radius)+0.5rem)] bg-violet-600 font-bold text-white hover:bg-violet-700 border-violet-500/50"
            >
              التالي
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="space-y-5 px-5 pb-7"
          >
            {/* Step indicator */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-violet-600 dark:text-violet-300 hover:underline"
              >
                ← رجوع
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">الخطوة 2 من 2</span>
                <div className="flex gap-1">
                  <div className="h-1.5 w-6 rounded-full bg-violet-500/40" />
                  <div className="h-1.5 w-6 rounded-full bg-violet-500" />
                </div>
              </div>
            </div>

            {/* Target (count / duration) */}
            {(type === "count" || type === "duration") && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-right text-sm font-bold">
                    {type === "count" ? "عدد المرات" : "عدد الدقائق"}
                  </Label>
                  <Input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder={type === "count" ? "8" : "30"}
                    dir="ltr"
                    className="h-12 text-center font-black text-lg"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-right text-sm font-bold">الوحدة</Label>
                  <Input
                    value={targetUnit}
                    onChange={(e) => setTargetUnit(e.target.value)}
                    placeholder={type === "count" ? "أكواب" : "دقيقة"}
                    dir="rtl"
                    className="h-12 text-right font-semibold"
                  />
                </div>
              </div>
            )}

            {/* Frequency */}
            <div className="space-y-2">
              <Label className="text-right text-sm font-bold">التكرار</Label>
              <div className="flex flex-wrap gap-2 justify-end">
                {FREQUENCIES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all",
                      frequency === f
                        ? "border-violet-500/50 bg-violet-500/[0.15] text-violet-700 dark:text-violet-300"
                        : "border-border/50 bg-muted/40 text-muted-foreground hover:border-border",
                    )}
                  >
                    {FREQUENCY_LABELS[f]}
                  </button>
                ))}
              </div>
              {/* Custom days */}
              <AnimatePresence>
                {frequency === "custom" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex justify-end gap-1.5 pt-2">
                      {DAY_LABELS.map((d, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() =>
                            setCustomDays((prev) =>
                              prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
                            )
                          }
                          className={cn(
                            "h-8 w-8 rounded-full border text-[11px] font-bold transition-all",
                            customDays.includes(i)
                              ? "border-violet-500/50 bg-violet-500/[0.15] text-violet-700 dark:text-violet-300"
                              : "border-border/50 bg-muted/40 text-muted-foreground",
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Icon picker */}
            <div className="space-y-2">
              <Label className="text-right text-sm font-bold">الأيقونة (اختياري)</Label>
              <div className="grid grid-cols-10 gap-1.5">
                {EMOJI_PICKER.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setIcon(icon === e ? "" : e)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border text-base transition-all",
                      icon === e
                        ? "border-violet-500/50 bg-violet-500/[0.15]"
                        : "border-border/40 bg-muted/30 hover:border-border",
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Reminder time */}
            <div className="space-y-2">
              <Label className="text-right text-sm font-bold">وقت التذكير (اختياري)</Label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className={cn(
                  "h-12 w-full rounded-[calc(var(--radius)+0.25rem)] border border-border/70 bg-card/[0.88] px-3.5 text-right text-sm font-semibold",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                  "dark:bg-card/[0.50]",
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {onDelete && initialHabit && (
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 rounded-[calc(var(--radius)+0.5rem)] border-destructive/50 text-destructive hover:bg-destructive/[0.08]"
                  onClick={() => { onDelete(initialHabit.id); onClose(); }}
                >
                  حذف
                </Button>
              )}
              <Button
                onClick={handleSave}
                size="lg"
                className={cn(
                  "rounded-[calc(var(--radius)+0.5rem)] bg-violet-600 font-bold text-white hover:bg-violet-700 border-violet-500/50",
                  onDelete && initialHabit ? "flex-1" : "w-full",
                )}
              >
                {isEditing ? "حفظ التغييرات" : "حفظ العادة"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SheetShell>
  );
}

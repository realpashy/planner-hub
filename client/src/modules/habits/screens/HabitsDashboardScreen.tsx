import { useEffect, useMemo } from "react";
import { CalendarClock, Plus, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AI_LockedCard } from "@/modules/habits/components/AI_LockedCard";
import { HabitCard } from "@/modules/habits/components/HabitCard";
import { MoodSelector } from "@/modules/habits/components/MoodSelector";
import { ProgressRing } from "@/modules/habits/components/ProgressRing";
import { ReminderBanner } from "@/modules/habits/components/ReminderBanner";
import type {
  HabitDefinition,
  HabitsState,
  MoodValue,
  ReminderItem,
} from "@/modules/habits/types";
import { getHabitStreak, getHabitValueForDate, isHabitComplete } from "@/modules/habits/utils/habits";

interface HabitsDashboardScreenProps {
  state: HabitsState;
  todayKey: string;
  progressPercent: number;
  completedToday: number;
  totalHabits: number;
  pendingCount: number;
  bestStreak: number;
  reminders: ReminderItem[];
  todayMood?: MoodValue;
  onAddHabit: () => void;
  onOpenHabits: () => void;
  onEditHabit: (habit: HabitDefinition) => void;
  onToggleHabit: (habit: HabitDefinition) => void;
  onAdjustHabit: (habit: HabitDefinition, value: number) => void;
  onSetMood: (mood: MoodValue) => void;
  highlightedHabitId?: string | null;
}

export function HabitsDashboardScreen({
  state,
  todayKey,
  progressPercent,
  completedToday,
  totalHabits,
  pendingCount,
  bestStreak,
  reminders,
  todayMood,
  onAddHabit,
  onOpenHabits,
  onEditHabit,
  onToggleHabit,
  onAdjustHabit,
  onSetMood,
  highlightedHabitId,
}: HabitsDashboardScreenProps) {
  const sortedHabits = useMemo(
    () =>
      [...state.habits].sort((a, b) => {
        const aComplete = isHabitComplete(a, getHabitValueForDate(a, state.logs, todayKey));
        const bComplete = isHabitComplete(b, getHabitValueForDate(b, state.logs, todayKey));
        if (aComplete !== bComplete) return aComplete ? 1 : -1;
        return a.name.localeCompare(b.name, "ar");
      }),
    [state.habits, state.logs, todayKey],
  );

  useEffect(() => {
    if (!highlightedHabitId) return;
    const element = document.getElementById(`habit-card-${highlightedHabitId}`);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedHabitId]);
  return (
    <div className="space-y-5">
      <Card className="surface-shell overflow-hidden rounded-[calc(var(--radius)+1rem)] border-primary/15">
        <CardContent className="p-5 pt-5 md:p-6 md:pt-6">
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4 text-right">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1 text-[11px] font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                متابعة يومية سريعة
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-black leading-tight text-foreground md:text-4xl">
                  لوحة واحدة تكفي لترى يومك بوضوح
                </p>
                <p className="max-w-xl text-sm leading-7 text-muted-foreground">
                  أنجز عاداتك اليوم، سجّل مزاجك بسرعة، واترك الرؤى للأسبوع والشهر دون تعقيد أو شعور بالضغط.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[calc(var(--radius)+0.45rem)] border border-border/70 bg-background/55 p-3 text-right">
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius)+0.35rem)] border border-primary/20 bg-background/70 text-primary shadow-[0_0_0_1px_rgba(149,223,30,0.16),0_0_16px_rgba(149,223,30,0.12)]">
                    <Target className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">المتبقي اليوم</p>
                  <p className="cashflow-number mt-1 text-2xl font-black text-foreground">{pendingCount}</p>
                </div>
                <div className="rounded-[calc(var(--radius)+0.45rem)] border border-border/70 bg-background/55 p-3 text-right">
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius)+0.35rem)] border border-sky-500/20 bg-background/70 text-sky-300 shadow-[0_0_0_1px_rgba(14,165,233,0.16),0_0_16px_rgba(14,165,233,0.12)]">
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">أفضل سلسلة</p>
                  <p className="cashflow-number mt-1 text-2xl font-black text-foreground">{bestStreak}</p>
                </div>
                <div className="rounded-[calc(var(--radius)+0.45rem)] border border-border/70 bg-background/55 p-3 text-right">
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius)+0.35rem)] border border-emerald-500/20 bg-background/70 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.16),0_0_16px_rgba(16,185,129,0.12)]">
                    <Plus className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">العادات المفعّلة</p>
                  <p className="cashflow-number mt-1 text-2xl font-black text-foreground">{totalHabits}</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-start gap-2.5">
                <Button onClick={onAddHabit}>
                  <Plus className="h-4 w-4" />
                  إضافة عادة
                </Button>
                <Button variant="outline" onClick={onOpenHabits}>
                  عرض كل العادات
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-center lg:justify-end">
                <ProgressRing
                  value={progressPercent}
                  label="إنجاز اليوم"
                  sublabel={`${completedToday} من ${totalHabits || 0} عادات`}
                  size={156}
                />
              </div>
              <div className="rounded-[calc(var(--radius)+0.55rem)] border border-border/70 bg-background/55 p-4 text-right">
                <p className="text-xs font-semibold text-muted-foreground">تركيز اليوم</p>
                <p className="mt-1 text-sm font-black text-foreground">
                  {pendingCount > 0
                    ? `أغلق ${Math.min(pendingCount, 2)} عادة الآن لتشعر بزخم واضح لبقية اليوم.`
                    : "اليوم تحت السيطرة. حافظ فقط على الإيقاع نفسه."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <MoodSelector value={todayMood} onChange={onSetMood} />
      <ReminderBanner reminders={reminders} />

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3 text-right">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-foreground">عادات اليوم</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              كل عادة مصممة لتُنجز بخطوة واضحة وسريعة.
            </p>
          </div>
          <div className="icon-chip h-11 w-11 rounded-[calc(var(--radius)+0.375rem)] border-primary/20 bg-primary/[0.1] text-primary">
            <span className="text-lg">✅</span>
          </div>
        </div>

        {state.habits.length ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {sortedHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                todayKey={todayKey}
                logs={state.logs}
                streak={getHabitStreak(habit, state.logs)}
                highlighted={highlightedHabitId === habit.id}
                onToggle={() => onToggleHabit(habit)}
                onAdjust={(value) => onAdjustHabit(habit, value)}
                onEdit={() => onEditHabit(habit)}
              />
            ))}
          </div>
        ) : (
          <div className="surface-subtle rounded-[calc(var(--radius)+0.85rem)] border-dashed border-border/60 p-6 text-right">
            <p className="text-lg font-black text-foreground">ابدأ بعادة واحدة فقط</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              أبسط بداية أفضل من لوحة مزدحمة. أضف عادة سهلة، واسمح للسلسلة أن تبدأ بهدوء.
            </p>
            <Button className="mt-4" onClick={onAddHabit}>
              <Plus className="h-4 w-4" />
              إضافة أول عادة
            </Button>
          </div>
        )}
      </div>

      <AI_LockedCard />
    </div>
  );
}

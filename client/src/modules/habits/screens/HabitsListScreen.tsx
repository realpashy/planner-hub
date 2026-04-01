import { useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HabitCard } from "@/modules/habits/components/HabitCard";
import type { HabitDefinition, HabitsState } from "@/modules/habits/types";
import {
  HABIT_CATEGORY_META,
  getHabitValueForDate,
  getHabitStreak,
  isHabitComplete,
} from "@/modules/habits/utils/habits";

interface HabitsListScreenProps {
  state: HabitsState;
  todayKey: string;
  highlightedHabitId?: string | null;
  onCreate: () => void;
  onEdit: (habit: HabitDefinition) => void;
  onToggleHabit: (habit: HabitDefinition) => void;
  onAdjustHabit: (habit: HabitDefinition, value: number) => void;
}

export function HabitsListScreen({
  state,
  todayKey,
  highlightedHabitId,
  onCreate,
  onEdit,
  onToggleHabit,
  onAdjustHabit,
}: HabitsListScreenProps) {
  const categorySummary = (Object.keys(HABIT_CATEGORY_META) as Array<keyof typeof HABIT_CATEGORY_META>)
    .map((key) => ({
      key,
      label: HABIT_CATEGORY_META[key].label,
      count: state.habits.filter((habit) => habit.category === key).length,
      habits: state.habits
        .filter((habit) => habit.category === key)
        .sort((a, b) => {
          const aComplete = isHabitComplete(a, getHabitValueForDate(a, state.logs, todayKey));
          const bComplete = isHabitComplete(b, getHabitValueForDate(b, state.logs, todayKey));
          if (aComplete !== bComplete) return aComplete ? 1 : -1;
          return a.name.localeCompare(b.name, "ar");
        }),
    }))
    .filter((item) => item.count > 0);

  useEffect(() => {
    if (!highlightedHabitId) return;
    const element = document.getElementById(`habit-card-${highlightedHabitId}`);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedHabitId]);

  return (
    <div className="space-y-5">
      <div className="surface-shell rounded-[calc(var(--radius)+0.9rem)] p-5 text-right">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-foreground">كل العادات</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              إدارة أوضح للعادات الحالية، مع تقسيم بصري بسيط حسب الفئة حتى تصل لأي عادة بسرعة.
            </p>
          </div>
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
            إضافة عادة
          </Button>
        </div>

        {categorySummary.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {categorySummary.map((item) => (
              <div
                key={item.key}
                className="rounded-[calc(var(--radius)+0.4rem)] border border-border/70 bg-background/60 px-3.5 py-3 text-right"
              >
                <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-lg font-black text-foreground">{item.count}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {state.habits.length ? (
        <div className="space-y-4">
          {categorySummary.map((group) => (
            <div key={group.key} className="surface-subtle rounded-[calc(var(--radius)+0.75rem)] p-4">
              <div className="mb-4 flex items-start justify-between gap-3 text-right">
                <div className="space-y-1">
                  <p className="text-lg font-black text-foreground">{group.label}</p>
                  <p className="text-xs leading-6 text-muted-foreground">{group.count} عادات ضمن هذه الفئة</p>
                </div>
                <div className="icon-chip h-11 w-11 rounded-[calc(var(--radius)+0.375rem)] border-primary/20 bg-background/70 text-primary">
                  <span className="text-lg">{HABIT_CATEGORY_META[group.key].emoji}</span>
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                {group.habits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    todayKey={todayKey}
                    logs={state.logs}
                    streak={getHabitStreak(habit, state.logs)}
                    highlighted={highlightedHabitId === habit.id}
                    onToggle={() => onToggleHabit(habit)}
                    onAdjust={(value) => onAdjustHabit(habit, value)}
                    onEdit={() => onEdit(habit)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="surface-subtle rounded-[calc(var(--radius)+0.85rem)] border-dashed border-border/60 p-6 text-right">
          <p className="text-lg font-black text-foreground">لا توجد عادات بعد</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            ابدأ بعادة أو اثنتين فقط، ثم أضف المزيد عندما يصبح الإيقاع ثابتًا.
          </p>
          <Button className="mt-4" onClick={onCreate}>
            <Plus className="h-4 w-4" />
            إنشاء عادة
          </Button>
        </div>
      )}
    </div>
  );
}

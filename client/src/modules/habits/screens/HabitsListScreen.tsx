import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HabitCard } from "@/modules/habits/components/HabitCard";
import type { HabitDefinition, HabitsState } from "@/modules/habits/types";
import {
  HABIT_CATEGORY_META,
  getHabitStreak,
} from "@/modules/habits/utils/habits";

interface HabitsListScreenProps {
  state: HabitsState;
  todayKey: string;
  onCreate: () => void;
  onEdit: (habit: HabitDefinition) => void;
  onToggleHabit: (habit: HabitDefinition) => void;
  onAdjustHabit: (habit: HabitDefinition, value: number) => void;
}

export function HabitsListScreen({
  state,
  todayKey,
  onCreate,
  onEdit,
  onToggleHabit,
  onAdjustHabit,
}: HabitsListScreenProps) {
  const categorySummary = (
    Object.keys(HABIT_CATEGORY_META) as Array<keyof typeof HABIT_CATEGORY_META>
  )
    .map((key) => ({
      key,
      label: HABIT_CATEGORY_META[key].label,
      count: state.habits.filter((habit) => habit.category === key).length,
    }))
    .filter((item) => item.count > 0);

  return (
    <div className="space-y-5">
      <div className="surface-shell rounded-[calc(var(--radius)+0.9rem)] p-5 text-right">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-foreground">كل العادات</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              مساحة بسيطة لإدارة العادات الحالية، تعديلها، أو حذف ما لم يعد يخدمك.
            </p>
          </div>
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
            إضافة عادة
          </Button>
        </div>

        {categorySummary.length ? (
          <div className="mt-4 flex flex-wrap justify-start gap-2">
            {categorySummary.map((item) => (
              <div
                key={item.key}
                className="rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-semibold text-muted-foreground"
              >
                {item.label} • {item.count}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {state.habits.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {state.habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              todayKey={todayKey}
              logs={state.logs}
              streak={getHabitStreak(habit, state.logs)}
              onToggle={() => onToggleHabit(habit)}
              onAdjust={(value) => onAdjustHabit(habit, value)}
              onEdit={() => onEdit(habit)}
            />
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

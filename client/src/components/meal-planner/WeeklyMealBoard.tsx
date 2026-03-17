import { addDays, format } from "date-fns";
import { ARABIC_DAYS, MealType, PlannedMeal } from "@/lib/meal-planner";
import { WeekSummary } from "@/lib/meal-planner";
import { Card } from "@/components/ui/card";
import { DayMealCard } from "./DayMealCard";

interface WeeklyMealBoardProps {
  weekStartISO: string;
  meals: PlannedMeal[];
  summary: WeekSummary;
  onCopyDay: (fromDateISO: string, toDateISO: string) => void;
  onSlotAction: (
    dateISO: string,
    mealType: MealType,
    action:
      | "pick"
      | "quickText"
      | "leftover"
      | "eatingOut"
      | "skip"
      | "clear",
  ) => void;
}

export function WeeklyMealBoard({
  weekStartISO,
  meals,
  summary,
  onCopyDay,
  onSlotAction,
}: WeeklyMealBoardProps) {
  const start = new Date(weekStartISO);

  return (
    <section className="space-y-3" dir="rtl">
      <Card className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              عدد الخانات المخططة:{" "}
              <span className="font-semibold text-foreground">
                {summary.plannedMeals}/{summary.totalSlots}
              </span>
            </span>
            <span className="hidden md:inline">•</span>
            <span>الخانات الفارغة: {summary.emptySlots}</span>
          </div>
          <span className="text-[11px]">
            يمكنك نسخ اليوم السابق أو تعديل الخانات بسرعة من البطاقات أدناه.
          </span>
        </div>
      </Card>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {ARABIC_DAYS.map((day, index) => {
          const date = addDays(start, index);
          const dateISO = format(date, "yyyy-MM-dd");
          const dateLabel = format(date, "d LLLL", { locale: undefined });
          const dayMeals = meals.filter((m) => m.dateISO === dateISO);
          const prevDateISO =
            index === 0 ? dateISO : format(addDays(start, index - 1), "yyyy-MM-dd");

          return (
            <DayMealCard
              key={day.key}
              dayLabel={day.label}
              dateLabel={dateLabel}
              dayMeals={dayMeals}
              onCopyFromPrevious={() => {
                if (dayMeals.length === 0 && prevDateISO !== dateISO) {
                  onCopyDay(prevDateISO, dateISO);
                }
              }}
              onSlotAction={(mealType, action) =>
                onSlotAction(dateISO, mealType, action)
              }
            />
          );
        })}
      </div>
    </section>
  );
}


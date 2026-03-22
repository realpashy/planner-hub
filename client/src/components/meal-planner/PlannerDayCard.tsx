import { motion } from "framer-motion";
import { Apple, Coffee, Flame, Salad, Soup } from "lucide-react";
import { cn } from "@/lib/utils";
import { type MealPlanMeal, type PlannerDay } from "@/lib/meal-planner";

interface PlannerDayCardProps {
  day: PlannerDay;
  selected?: boolean;
  onOpen: () => void;
}

function getMealIcon(meal: MealPlanMeal) {
  if (meal.mealType === "breakfast") return Coffee;
  if (meal.mealType === "lunch") return Salad;
  if (meal.mealType === "dinner") return Soup;
  return Apple;
}

function MacroPill({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-semibold text-foreground dark:bg-white/5">
      {value}
    </span>
  );
}

export function PlannerDayCard({ day, selected = false, onOpen }: PlannerDayCardProps) {
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      onClick={onOpen}
      dir="rtl"
      className={cn(
        "w-full rounded-[1.5rem] border bg-white/84 p-5 text-right shadow-[0_14px_36px_rgba(15,23,42,0.05)] transition-all dark:bg-slate-950/78 dark:shadow-[0_18px_46px_rgba(2,6,23,0.42)]",
        selected
          ? "border-primary/25 shadow-[0_18px_48px_rgba(99,102,241,0.12)] dark:shadow-[0_22px_54px_rgba(99,102,241,0.14)]"
          : "border-white/60 hover:border-primary/15 dark:border-white/10",
      )}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground dark:bg-white/5">
            {day.dateLabel}
          </div>
          <div className="text-right">
            <h3 className="text-xl font-black tracking-tight text-foreground">{day.dayName}</h3>
            {day.busyDay ? <p className="mt-1 text-xs text-muted-foreground">يوم خفيف التحضير ومناسب للضغط اليومي.</p> : null}
          </div>
        </div>

        <div className="space-y-2">
          {day.meals.map((meal) => {
            const Icon = getMealIcon(meal);
            return (
              <div key={meal.id} className="flex items-center justify-between gap-3 rounded-[1rem] bg-slate-900/[0.025] px-3 py-2.5 dark:bg-white/[0.04]">
                <p className="line-clamp-1 text-sm font-medium text-foreground">{meal.title}</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs font-semibold">{meal.mealType === "breakfast" ? "فطور" : meal.mealType === "lunch" ? "غداء" : meal.mealType === "dinner" ? "عشاء" : "سناك"}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground shadow-sm dark:bg-slate-950/70">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <MacroPill value={`${day.meals.length} وجبات`} />
          <MacroPill value={`${day.nutrition.calories} kcal`} />
          <MacroPill value={`${day.nutrition.protein}غ بروتين`} />
          <MacroPill value={`${day.nutrition.carbs}غ كربوهيدرات`} />
          <MacroPill value={`${day.nutrition.fat}غ دهون`} />
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground dark:bg-white/5">
            <Flame className="h-3.5 w-3.5 text-primary" />
            تفاصيل اليوم
          </span>
        </div>
      </div>
    </motion.button>
  );
}

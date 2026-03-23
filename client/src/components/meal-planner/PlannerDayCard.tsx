import { motion } from "framer-motion";
import { Apple, Coffee, Salad, Soup } from "lucide-react";
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
    <span className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-[var(--app-shadow)]">
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
        "w-full rounded-[calc(var(--radius)+0.9rem)] border p-4 text-right shadow-xl transition-all",
        selected
          ? "border-primary/25 bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.14),transparent_28%),linear-gradient(180deg,rgba(43,43,43,0.98),rgba(32,32,32,0.98))] shadow-2xl"
          : "border-border/80 bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.08),transparent_28%),linear-gradient(180deg,rgba(39,39,39,0.98),rgba(28,28,28,0.98))] hover:border-primary/15 hover:shadow-2xl",
      )}
    >
      <div className="space-y-3.5">
        <div className="rtl-meta-row">
          <div className="stat-chip rounded-full px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            {day.busyDay ? "إيقاع أخف لهذا اليوم" : "خطة يومية واضحة"}
          </div>
          <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_6px_rgba(149,223,30,0.08)]" />
        </div>

        <div className="rtl-title-row items-start">
          <div className="space-y-1 text-right flex-1">
            <h3 className="text-xl font-black tracking-tight text-foreground">{day.dayName}</h3>
            {day.busyDay ? <p className="text-xs text-muted-foreground">يوم خفيف التحضير ومناسب للضغط اليومي.</p> : null}
          </div>
          <div className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary shadow-[var(--app-shadow)]">
            {day.dateLabel}
          </div>
        </div>

        <div className="space-y-1.5 rounded-[calc(var(--radius)+0.5rem)] border border-border/70 bg-background/45 p-2.5 shadow-[var(--app-shadow)]">
          {day.meals.map((meal, index) => {
            const Icon = getMealIcon(meal);
            return (
              <div
                key={meal.id}
                className={cn(
                  "rtl-title-row items-center rounded-[calc(var(--radius)+0.25rem)] px-2 py-2",
                  index !== day.meals.length - 1 && "border-b border-dashed border-slate-200/70 dark:border-slate-700/60",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold text-foreground">{meal.title}</p>
                </div>
                <div className="inline-flex shrink-0 items-center gap-2 text-muted-foreground">
                  <span className="text-[11px] font-semibold">{meal.mealType === "breakfast" ? "فطور" : meal.mealType === "lunch" ? "غداء" : meal.mealType === "dinner" ? "عشاء" : "سناك"}</span>
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-[calc(var(--radius)+0.25rem)] border shadow-[var(--app-shadow)]",
                      meal.mealType === "breakfast" && "border-amber-500/20 bg-amber-500/[0.12] text-amber-700 dark:text-amber-300",
                      meal.mealType === "lunch" && "border-emerald-500/20 bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300",
                      meal.mealType === "dinner" && "border-primary/20 bg-primary/[0.12] text-primary",
                      meal.mealType === "snack" && "border-rose-500/20 bg-rose-500/[0.12] text-rose-700 dark:text-rose-300",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap justify-end gap-1.5">
          <MacroPill value={`${day.meals.length} وجبات`} />
          <MacroPill value={`${day.nutrition.calories} kcal`} />
          <MacroPill value={`${day.nutrition.protein}غ بروتين`} />
          <MacroPill value={`${day.nutrition.carbs}غ كربوهيدرات`} />
          <MacroPill value={`${day.nutrition.fat}غ دهون`} />
        </div>

        <div className="rtl-title-row rounded-[calc(var(--radius)+0.375rem)] border border-primary/15 bg-primary/[0.08] px-3 py-2.5">
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">عرض اليوم والتعديل الخفيف</p>
            <p className="text-[11px] leading-5 text-muted-foreground">افتح التفاصيل لمراجعة الوجبات بسرعة.</p>
          </div>
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-[calc(var(--radius)+0.25rem)] border border-primary/20 bg-primary text-primary-foreground shadow-[var(--app-shadow)]">
            <Soup className="h-4 w-4" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

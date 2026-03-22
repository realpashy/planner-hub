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
    <span className="inline-flex items-center rounded-full border border-border/60 bg-white/80 px-3 py-1 text-xs font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:bg-white/5">
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
        "w-full rounded-[1.5rem] border p-5 text-right shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-all dark:shadow-[0_20px_50px_rgba(2,6,23,0.42)]",
        selected
          ? "border-indigo-300/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,242,255,0.92))] shadow-[0_20px_52px_rgba(99,102,241,0.12)] dark:border-indigo-400/25 dark:bg-[linear-gradient(180deg,rgba(49,46,129,0.22),rgba(15,23,42,0.88))]"
          : "border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.9))] hover:border-indigo-200/80 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.9),rgba(15,23,42,0.8))]",
      )}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.08)]" />
          <div className="text-xs font-semibold text-muted-foreground">{day.busyDay ? "إيقاع أخف لهذا اليوم" : "خطة يومية واضحة"}</div>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="text-right">
            <h3 className="text-xl font-black tracking-tight text-foreground">{day.dayName}</h3>
            {day.busyDay ? <p className="mt-1 text-xs text-muted-foreground">يوم خفيف التحضير ومناسب للضغط اليومي.</p> : null}
          </div>
          <div className="rounded-full border border-border/60 bg-white/80 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:bg-white/5">
            {day.dateLabel}
          </div>
        </div>

        <div className="space-y-2 rounded-[1.1rem] bg-slate-900/[0.025] p-3 dark:bg-white/[0.04]">
          {day.meals.map((meal) => {
            const Icon = getMealIcon(meal);
            return (
              <div key={meal.id} className="flex items-center justify-between gap-3 rounded-[0.95rem] px-2 py-2">
                <p className="line-clamp-1 text-sm font-medium text-foreground">{meal.title}</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs font-semibold">{meal.mealType === "breakfast" ? "فطور" : meal.mealType === "lunch" ? "غداء" : meal.mealType === "dinner" ? "عشاء" : "سناك"}</span>
                  <span className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full shadow-sm",
                    meal.mealType === "breakfast" && "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
                    meal.mealType === "lunch" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
                    meal.mealType === "dinner" && "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200",
                    meal.mealType === "snack" && "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
                  )}>
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
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-white/80 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:bg-white/5">
            <Flame className="h-3.5 w-3.5 text-primary" />
            تفاصيل اليوم
          </span>
        </div>
      </div>
    </motion.button>
  );
}

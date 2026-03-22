import { motion } from "framer-motion";
import { Apple, Coffee, Salad, Soup, Clock, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { type MealPlanMeal, type PlannerDay } from "@/lib/meal-planner";
import { Button } from "@/components/ui/button";

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

function getMealTypeColor(mealType: string) {
  const colors = {
    breakfast: "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/15 dark:text-amber-200",
    lunch: "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/15 dark:text-emerald-200",
    dinner: "border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/15 dark:text-indigo-200",
    snack: "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/15 dark:text-rose-200",
  };
  return colors[mealType as keyof typeof colors] || colors.snack;
}

export function PlannerDayCard({ day, selected = false, onOpen }: PlannerDayCardProps) {
  const totalCalories = day.nutrition.calories;
  const totalProtein = day.nutrition.protein;

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      dir="rtl"
      className={cn(
        "group relative w-full overflow-hidden rounded-3xl border-2 shadow-lg transition-all duration-300",
        selected
          ? "border-lime-400 bg-gradient-to-br from-lime-50 to-white shadow-xl dark:border-lime-500/50 dark:from-slate-900 dark:to-slate-800"
          : "border-slate-200 bg-white hover:border-lime-300 hover:shadow-2xl dark:border-slate-700 dark:bg-slate-800 dark:hover:border-lime-500/50"
      )}
    >
      {/* Decorative accent bar */}
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", selected ? "from-lime-400 to-lime-500" : "from-slate-300 to-slate-200")} />

      <div className="space-y-5 p-6 text-right">
        {/* Day Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{day.dayName}</h3>
            {day.busyDay && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                <Clock className="h-3 w-3" />
                يوم مزدحم
              </div>
            )}
          </div>
          <div className="rounded-xl border-2 border-lime-300 bg-lime-100 px-3 py-2 text-xs font-bold text-lime-700 dark:border-lime-500/50 dark:bg-lime-950/50 dark:text-lime-300">
            {day.dateLabel}
          </div>
        </div>

        {/* Meals List */}
        <div className="space-y-2 rounded-2xl border-2 border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-700/50 dark:from-slate-700/30 dark:to-slate-800/20">
          {day.meals.map((meal, index) => {
            const Icon = getMealIcon(meal);
            const mealTypeLabels = {
              breakfast: "فطور",
              lunch: "غداء",
              dinner: "عشاء",
              snack: "سناك",
            };
            const label = mealTypeLabels[meal.mealType as keyof typeof mealTypeLabels] || "وجبة";

            return (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5",
                  index !== day.meals.length - 1 && "border-b border-slate-200 dark:border-slate-600/50"
                )}
              >
                <div className="flex-1 text-right">
                  <p className="line-clamp-1 font-semibold text-slate-900 dark:text-white">{meal.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                </div>
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-md", getMealTypeColor(meal.mealType))}>
                  <Icon className="h-4 w-4" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Nutrition Stats - Prominent Display */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-red-50 to-orange-50 p-3 text-center dark:border-slate-700 dark:from-red-950/30 dark:to-orange-950/30"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white shadow-md mx-auto mb-1">
              <Flame className="h-4 w-4" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">السعرات</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{totalCalories}</p>
            <p className="text-xs text-slate-500">kcal</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-lime-50 to-emerald-50 p-3 text-center dark:border-slate-700 dark:from-lime-950/30 dark:to-emerald-950/30"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-500 text-white shadow-md mx-auto mb-1">
              <span className="text-xs font-bold">P</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">البروتين</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{totalProtein}</p>
            <p className="text-xs text-slate-500">غرام</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-3 text-center dark:border-slate-700 dark:from-indigo-950/30 dark:to-blue-950/30"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-md mx-auto mb-1">
              <span className="text-xs font-bold">C</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">الكربوهيدرات</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{day.nutrition.carbs}</p>
            <p className="text-xs text-slate-500">غرام</p>
          </motion.div>
        </div>

        {/* CTA Button */}
        <Button
          className={cn(
            "w-full rounded-xl font-bold text-base transition-all duration-300",
            "bg-gradient-to-r from-lime-400 to-lime-500 text-slate-900 hover:from-lime-500 hover:to-lime-600 hover:shadow-lg"
          )}
          size="lg"
        >
          {selected ? "تعديل اليوم" : "عرض التفاصيل"}
        </Button>
      </div>
    </motion.button>
  );
}

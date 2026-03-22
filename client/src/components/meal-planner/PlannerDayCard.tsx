import { motion } from "framer-motion";
import { Apple, Coffee, Salad, Soup, Clock, Flame, ChevronRight } from "lucide-react";
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
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      dir="rtl"
      className={cn(
        "group relative w-full overflow-hidden rounded-3xl border-2 shadow-xl transition-all duration-300",
        selected
          ? "border-lime-400 bg-gradient-to-br from-lime-50 to-white shadow-2xl dark:border-lime-500/50 dark:from-slate-900 dark:to-slate-800"
          : "border-slate-200 bg-white hover:border-lime-300 hover:shadow-2xl dark:border-slate-700 dark:bg-slate-800 dark:hover:border-lime-500/50"
      )}
    >
      {/* Premium accent gradient bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "absolute inset-x-0 top-0 h-1.5 origin-left",
          selected ? "bg-gradient-to-r from-lime-400 via-lime-500 to-lime-600" : "bg-gradient-to-r from-slate-300 to-slate-200"
        )}
      />

      <div className="space-y-6 p-7 text-right">
        {/* Day Header with Badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Day name */}
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">{day.dayName}</h3>

            {/* Busy day badge if needed */}
            {day.busyDay && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3.5 py-1.5 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
              >
                <Clock className="h-3.5 w-3.5" />
                يوم مزدحم - وجبات خفيفة
              </motion.div>
            )}
          </div>

          {/* Date badge in lime */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl border-2 border-lime-300 bg-gradient-to-br from-lime-100 to-lime-50 font-bold text-lime-700 shadow-md dark:border-lime-500/50 dark:from-lime-950/60 dark:to-lime-900/40 dark:text-lime-300"
          >
            <span className="text-2xl">{day.dateLabel.split(" ")[0]}</span>
            <span className="text-xs">{day.dateLabel.split(" ").slice(1).join(" ")}</span>
          </motion.div>
        </div>

        {/* Meals Section with premium styling */}
        <div className="space-y-1 rounded-2xl border-2 border-slate-100 bg-gradient-to-br from-slate-50/80 to-white p-5 dark:border-slate-700/50 dark:from-slate-700/20 dark:to-slate-800/10">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            الوجبات ({day.meals.length})
          </p>
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
                transition={{ delay: 0.15 + index * 0.08 }}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all",
                  index !== day.meals.length - 1 && "border-b border-slate-200/60 dark:border-slate-600/30"
                )}
              >
                <div className="flex-1 text-right">
                  <p className="line-clamp-1 font-semibold text-slate-900 dark:text-white">{meal.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{meal.calories} kcal</p>
                </div>
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-md", getMealTypeColor(meal.mealType))}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Nutrition Stats - Premium Grid */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50/50 p-4 text-center shadow-md dark:border-orange-400/20 dark:from-orange-950/30 dark:to-red-950/20"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md mx-auto mb-2">
              <Flame className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">السعرات</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalCalories}</p>
            <p className="text-xs text-slate-500">kcal</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl border-2 border-lime-200 bg-gradient-to-br from-lime-50 to-emerald-50/50 p-4 text-center shadow-md dark:border-lime-400/20 dark:from-lime-950/30 dark:to-emerald-950/20"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-lime-500 to-emerald-500 text-white shadow-md mx-auto mb-2">
              <span className="text-sm font-bold">P</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">البروتين</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalProtein}</p>
            <p className="text-xs text-slate-500">غرام</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50/50 p-4 text-center shadow-md dark:border-indigo-400/20 dark:from-indigo-950/30 dark:to-blue-950/20"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-md mx-auto mb-2">
              <span className="text-sm font-bold">C</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">الكربوهيدرات</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{day.nutrition.carbs}</p>
            <p className="text-xs text-slate-500">غرام</p>
          </motion.div>
        </div>

        {/* Premium CTA Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            className={cn(
              "w-full rounded-2xl font-bold text-base transition-all duration-300 py-6 h-auto shadow-lg",
              selected
                ? "bg-gradient-to-r from-lime-500 to-lime-600 text-white hover:from-lime-600 hover:to-lime-700 hover:shadow-xl"
                : "bg-gradient-to-r from-lime-400 to-lime-500 text-slate-900 hover:from-lime-500 hover:to-lime-600 hover:shadow-xl"
            )}
            size="lg"
          >
            <span className="flex items-center justify-center gap-2">
              {selected ? "تعديل اليوم" : "عرض التفاصيل"}
              <ChevronRight className="h-5 w-5" />
            </span>
          </Button>
        </motion.div>
      </div>
    </motion.button>
  );
}

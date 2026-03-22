import { AnimatePresence, motion } from "framer-motion";
import { CalendarHeart, Droplets, Flame, RefreshCcw, Sparkles } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { PlannerMealCard } from "@/components/meal-planner/PlannerMealCard";
import { PlannerMetaBadge } from "@/components/meal-planner/PlannerMetaBadge";
import { PlannerStatPill } from "@/components/meal-planner/PlannerStatPill";
import { formatWater, type MealSwapMode, type PlannerDay } from "@/lib/meal-planner";

interface PlannerDayDrawerProps {
  day: PlannerDay | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expandedMealId: string | null;
  onToggleMeal: (mealId: string) => void;
  onRegenerateDay: (dateISO: string) => void;
  onSwapMeal: (dateISO: string, mealType: string, mode: MealSwapMode) => void;
  onRegenerateMeal: (dateISO: string, mealType: string) => void;
  workingAction: "swap" | "regenerate" | "delete" | null;
}

export function PlannerDayDrawer({
  day,
  open,
  onOpenChange,
  expandedMealId,
  onToggleMeal,
  onRegenerateDay,
  onSwapMeal,
  onRegenerateMeal,
  workingAction,
}: PlannerDayDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l border-white/10 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.96))] p-0 sm:max-w-2xl dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,0.96))]"
        dir="rtl"
      >
        {day ? (
          <div className="relative min-h-full">
            <div className="sticky top-0 z-20 border-b border-white/50 bg-white/80 px-5 py-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
              <div className="space-y-4 text-right">
                <div className="flex items-start justify-between gap-3">
                  <InteractiveButton
                    type="button"
                    className="rounded-[1.1rem] bg-primary px-4 shadow-[0_14px_34px_rgba(99,102,241,0.22)]"
                    loading={workingAction === "regenerate"}
                    onClick={() => onRegenerateDay(day.dateISO)}
                  >
                    إعادة توليد اليوم
                    <RefreshCcw className="h-4 w-4" />
                  </InteractiveButton>
                  <div className="space-y-2">
                    <div className="flex flex-wrap justify-end gap-2">
                      <PlannerMetaBadge icon={CalendarHeart} label={day.dayName} tone="accent" />
                      <PlannerMetaBadge icon={Sparkles} label={day.status === "busy" ? "إيقاع أخف" : "منظّم"} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-foreground">{day.dateLabel}</h3>
                      <p className="text-sm leading-7 text-muted-foreground">{day.aiTip}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <PlannerStatPill icon={Flame} label="السعرات" value={`${day.nutrition.calories} kcal`} tone="accent" />
                  <PlannerStatPill icon={Sparkles} label="البروتين" value={`${day.nutrition.protein} غ`} />
                  <PlannerStatPill icon={Droplets} label="الماء" value={formatWater(day.nutrition.waterCups)} />
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="relative pe-5">
                <div className="absolute right-[0.45rem] top-4 bottom-4 w-px bg-gradient-to-b from-primary/20 via-border to-transparent" />
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {day.meals.map((meal) => (
                      <motion.div key={meal.id} layout className="relative">
                        <div className="absolute right-0 top-8 z-10 h-3 w-3 rounded-full border border-primary/20 bg-primary" />
                        <div className="pr-6">
                          <PlannerMealCard
                            meal={meal}
                            expanded={expandedMealId === meal.id}
                            onToggle={() => onToggleMeal(meal.id)}
                            onSwap={(mode) => onSwapMeal(day.dateISO, meal.mealType, mode)}
                            onRegenerateMeal={() => onRegenerateMeal(day.dateISO, meal.mealType)}
                            loading={workingAction === "swap"}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

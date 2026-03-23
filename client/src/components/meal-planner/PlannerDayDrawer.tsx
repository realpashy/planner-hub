import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Flame, Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PlannerMealCard } from "@/components/meal-planner/PlannerMealCard";
import { type MealSwapMode, type PlannerDay } from "@/lib/meal-planner";

interface PlannerDayDrawerProps {
  day: PlannerDay | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expandedMealId: string | null;
  onToggleMeal: (mealId: string) => void;
  onSwapMeal: (dateISO: string, mealType: string, mode: MealSwapMode) => void;
  onRegenerateMeal: (dateISO: string, mealType: string) => void;
  remainingMealActions: number | null;
  workingAction: "swap" | "delete" | "regenerate" | null;
}

function SummaryChip({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center border border-border/70 bg-muted px-3 py-1 text-xs font-semibold text-foreground shadow-[var(--app-shadow)] rounded-[5px]">
      {value}
    </span>
  );
}

export function PlannerDayDrawer({
  day,
  open,
  onOpenChange,
  expandedMealId,
  onToggleMeal,
  onSwapMeal,
  onRegenerateMeal,
  remainingMealActions,
  workingAction,
}: PlannerDayDrawerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="meal-surface-popup flex max-h-[88vh] w-[min(92vw,68rem)] max-w-[68rem] flex-col gap-0 overflow-hidden rounded-[calc(var(--radius)+0.8rem)] p-0"
      >
        {day ? (
          <div className="premium-scrollbar min-h-full overflow-y-auto">
            <div className="sticky top-0 z-20 border-b border-border/80 bg-background/[0.92] px-5 py-5 backdrop-blur-xl">
              <div className="space-y-4 text-right">
                <div className="space-y-2 text-right">
                  <div className="flex justify-start">
                    <span className="meal-label-surface border-primary/20 bg-primary/[0.12] text-primary">
                      {day.dayName}
                      <CalendarDays className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground md:text-3xl">{day.dateLabel}</h3>
                    <p className="mt-1 text-sm leading-7 text-muted-foreground">{day.notes || day.aiTip}</p>
                  </div>
                </div>

                <div className="rtl-chip-row">
                  <SummaryChip value={`${day.nutrition.calories} kcal`} />
                  <SummaryChip value={`${day.nutrition.protein}غ بروتين`} />
                  <SummaryChip value={`${day.nutrition.carbs}غ كربوهيدرات`} />
                  <SummaryChip value={`${day.nutrition.fat}غ دهون`} />
                  <SummaryChip value={`${day.meals.length} وجبات`} />
                </div>

                <div className="flex justify-start">
                  <p className="meal-note-surface inline-flex items-center gap-2 py-2">
                    افتح أي وجبة لتعديلها أو تبديلها بسرعة.
                    <Sparkles className="h-4 w-4 text-primary" />
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="space-y-4">
                <div className="flex items-center justify-start gap-3 text-right">
                  <div className="meal-label-surface text-muted-foreground">
                    {day.meals.length} وجبات
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
                    <Flame className="h-4 w-4 text-primary" />
                    تفاصيل الوجبات
                  </div>
                </div>

                <div className="relative pr-8">
                  <div className="absolute bottom-4 right-4 top-4 w-px bg-border/70" />
                  <div className="space-y-4">
                    <AnimatePresence initial={false}>
                      {day.meals.map((meal) => (
                        <motion.div key={meal.id} layout className="relative">
                          <div className="absolute right-[10px] top-7 z-10 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/10" />
                          <div className="pr-8">
                            <PlannerMealCard
                              meal={meal}
                              expanded={expandedMealId === meal.id}
                              onToggle={() => onToggleMeal(meal.id)}
                              onSwap={(mode) => onSwapMeal(day.dateISO, meal.mealType, mode)}
                              onRegenerateMeal={() => onRegenerateMeal(day.dateISO, meal.mealType)}
                              remainingActions={remainingMealActions}
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
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

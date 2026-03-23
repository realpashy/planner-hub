import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Flame, Sparkles } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
  workingAction: "swap" | "delete" | "regenerate" | null;
}

function SummaryChip({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/70 bg-muted px-3 py-1 text-xs font-semibold text-foreground shadow-[var(--app-shadow)]">
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
  workingAction,
}: PlannerDayDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l border-border/80 bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.1),transparent_22%),linear-gradient(180deg,rgba(32,32,32,0.98),rgba(23,23,23,0.98))] p-0 shadow-[0_28px_80px_rgba(0,0,0,0.34)] sm:max-w-[40rem]"
        dir="rtl"
      >
        {day ? (
          <div className="min-h-full">
            <div className="sticky top-0 z-20 border-b border-border/80 bg-background/[0.92] px-5 py-5 backdrop-blur-xl">
              <div className="space-y-4 text-right">
                <div className="space-y-2 text-right">
                  <div className="flex justify-end">
                    <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.12] px-3 py-1 text-xs font-semibold text-primary shadow-[var(--app-shadow)]">
                      {day.dayName}
                      <CalendarDays className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground md:text-3xl">{day.dateLabel}</h3>
                    <p className="mt-1 text-sm leading-7 text-muted-foreground">{day.notes || day.aiTip}</p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-1.5">
                  <SummaryChip value={`${day.nutrition.calories} kcal`} />
                  <SummaryChip value={`${day.nutrition.protein}غ بروتين`} />
                  <SummaryChip value={`${day.nutrition.carbs}غ كربوهيدرات`} />
                  <SummaryChip value={`${day.nutrition.fat}غ دهون`} />
                  <SummaryChip value={`${day.meals.length} وجبات`} />
                </div>

                <div className="flex justify-end">
                  <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    افتح أي وجبة لتعديلها أو تبديلها بسرعة.
                    <Sparkles className="h-4 w-4 text-primary" />
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="space-y-4">
                <div className="rtl-title-row items-center">
                  <div className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
                    <Flame className="h-4 w-4 text-primary" />
                    تفاصيل الوجبات
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">{day.meals.length} وجبات</div>
                </div>

                <div className="relative pr-5">
                  <div className="absolute right-[0.45rem] top-4 bottom-4 w-px bg-border/70" />
                  <div className="space-y-4">
                    <AnimatePresence initial={false}>
                      {day.meals.map((meal) => (
                        <motion.div key={meal.id} layout className="relative">
                          <div className="absolute right-0 top-7 z-10 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/10" />
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
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

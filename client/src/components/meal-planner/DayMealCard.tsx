import { Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MealType, PlannedMeal } from "@/lib/meal-planner";
import { MealSlotCard } from "./MealSlotCard";

const MEAL_TYPES_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

interface DayMealCardProps {
  dayLabel: string;
  dateLabel: string;
  dayMeals: PlannedMeal[];
  onCopyFromPrevious: () => void;
  onSlotAction: (
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

export function DayMealCard({
  dayLabel,
  dateLabel,
  dayMeals,
  onCopyFromPrevious,
  onSlotAction,
}: DayMealCardProps) {
  return (
    <Card className="h-full rounded-3xl border border-slate-200/80 bg-card/90 shadow-sm" dir="rtl">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <div className="text-right space-y-0.5">
          <CardTitle className="text-sm font-semibold text-foreground">
            {dayLabel}
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">{dateLabel}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 rounded-xl px-2 text-[11px] text-muted-foreground hover:text-foreground"
          onClick={onCopyFromPrevious}
        >
          <Copy className="ml-1 h-3.5 w-3.5" />
          نسخ من اليوم السابق
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 pb-3">
        <div className="grid grid-cols-1 gap-2">
          {MEAL_TYPES_ORDER.map((type) => {
            const meal = dayMeals.find((m) => m.mealType === type) || null;
            return (
              <MealSlotCard
                key={type}
                mealType={type}
                meal={meal}
                onPick={() => onSlotAction(type, "pick")}
                onQuickText={() => onSlotAction(type, "quickText")}
                onMarkLeftover={() => onSlotAction(type, "leftover")}
                onMarkEatingOut={() => onSlotAction(type, "eatingOut")}
                onSkip={() => onSlotAction(type, "skip")}
                onClear={() => onSlotAction(type, "clear")}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


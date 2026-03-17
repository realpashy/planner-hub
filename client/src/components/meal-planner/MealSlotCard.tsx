import { MoreHorizontal, Plus, UtensilsCrossed, Flame, MoonStar, Coffee } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { MealType, PlannedMeal } from "@/lib/meal-planner";

const MEAL_TYPE_LABEL: Record<MealType, string> = {
  breakfast: "فطور",
  lunch: "غداء",
  dinner: "عشاء",
  snack: "سناك",
};

interface MealSlotCardProps {
  mealType: MealType;
  meal: PlannedMeal | null;
  onPick: () => void;
  onQuickText: () => void;
  onMarkLeftover: () => void;
  onMarkEatingOut: () => void;
  onSkip: () => void;
  onClear: () => void;
}

export function MealSlotCard({
  mealType,
  meal,
  onPick,
  onQuickText,
  onMarkLeftover,
  onMarkEatingOut,
  onSkip,
  onClear,
}: MealSlotCardProps) {
  const toneIcon =
    mealType === "breakfast" ? Coffee : mealType === "dinner" ? MoonStar : UtensilsCrossed;

  const label = MEAL_TYPE_LABEL[mealType];

  const content =
    meal == null ? (
      <span className="text-xs text-muted-foreground">اضغط لاختيار وجبة</span>
    ) : (
      <div className="space-y-1.5 text-right">
        <p className="text-xs font-medium text-foreground line-clamp-2">
          {meal.customTitle || (meal.source === "recipe" ? "وصفة محفوظة" : "وجبة")}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-1">
          {meal.source === "recipe" && (
            <Badge variant="outline" className="border-emerald-200 text-[10px] text-emerald-700">
              وصفة
            </Badge>
          )}
          {meal.source === "custom" && (
            <Badge variant="outline" className="border-sky-200 text-[10px] text-sky-700">
              مخصّصة
            </Badge>
          )}
          {meal.source === "leftover" && (
            <Badge variant="outline" className="border-amber-200 text-[10px] text-amber-700">
              بقايا
            </Badge>
          )}
          {meal.source === "eating_out" && (
            <Badge variant="outline" className="border-pink-200 text-[10px] text-pink-700">
              أكل خارج البيت
            </Badge>
          )}
          {meal.source === "skipped" && (
            <Badge variant="outline" className="border-slate-200 text-[10px] text-slate-600">
              متخطّاة
            </Badge>
          )}
        </div>
      </div>
    );

  return (
    <Card className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-card/80 p-3 shadow-sm" dir="rtl">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
            {toneIcon && <toneIcon className="h-3.5 w-3.5" />}
          </div>
          <span className="text-[11px] font-semibold text-foreground">{label}</span>
        </div>
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-muted-foreground hover:bg-muted"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="text-xs" dir="rtl">
            <DropdownMenuItem onSelect={onPick}>اختيار وصفة</DropdownMenuItem>
            <DropdownMenuItem onSelect={onQuickText}>وجبة نصّية سريعة</DropdownMenuItem>
            <DropdownMenuItem onSelect={onMarkLeftover}>استخدام بقايا</DropdownMenuItem>
            <DropdownMenuItem onSelect={onMarkEatingOut}>أكل خارج البيت</DropdownMenuItem>
            <DropdownMenuItem onSelect={onSkip}>تخطي هذه الوجبة</DropdownMenuItem>
            {meal && (
              <DropdownMenuItem onSelect={onClear} className="text-destructive">
                مسح الخانة
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <button
        type="button"
        className="flex flex-1 items-center justify-between gap-2 rounded-xl border border-dashed border-slate-200/80 bg-slate-50/70 px-2.5 py-2 text-right transition-colors hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/5"
        onClick={onPick}
      >
        <div className="flex-1 min-w-0">{content}</div>
        {!meal && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Plus className="h-3.5 w-3.5" />
          </div>
        )}
      </button>
    </Card>
  );
}


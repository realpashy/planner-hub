import { Badge } from "@/components/ui/badge";
import { InteractiveCard } from "@/components/ui/interactive-card";
import { cn } from "@/lib/utils";
import type { MealSlot } from "@/lib/meal-planner";
import { MEAL_TYPE_LABELS } from "@/lib/meal-planner";
import { MealMedia } from "@/components/meal-planner/MealMedia";

interface MealCardProps {
  meal: MealSlot;
  compact?: boolean;
  interactive?: boolean;
  selected?: boolean;
  onClick?: () => void;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}

export function MealCard({
  meal,
  compact = false,
  interactive = false,
  selected = false,
  onClick,
  actions,
  meta,
}: MealCardProps) {
  const content = (
    <div className={cn("flex items-start gap-3 text-right", compact ? "p-3" : "p-4")}>
      <MealMedia
        image={meal.image}
        imageType={meal.imageType}
        imageSource={meal.imageSource}
        alt={meal.title || MEAL_TYPE_LABELS[meal.mealType]}
        size={compact ? "sm" : "md"}
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] font-semibold">
                {MEAL_TYPE_LABELS[meal.mealType]}
              </Badge>
              <p className="truncate text-sm font-bold text-foreground">
                {meal.title || `أضف ${MEAL_TYPE_LABELS[meal.mealType]}`}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {meal.calories ? `${meal.calories} kcal` : "جاهزة للتعديل السريع"}
            </p>
          </div>
          {actions ? <div onClick={(event) => event.stopPropagation()}>{actions}</div> : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {meal.tags.slice(0, compact ? 2 : 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag.replaceAll("_", " ")}
            </span>
          ))}
        </div>
        {meta}
      </div>
    </div>
  );

  return (
    <InteractiveCard
      interactive={interactive}
      selected={selected}
      className={cn("overflow-hidden border-border/70 bg-background/80", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      {content}
    </InteractiveCard>
  );
}

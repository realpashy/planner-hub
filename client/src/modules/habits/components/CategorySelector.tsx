import { cn } from "@/lib/utils";
import type { HabitCategory } from "@/modules/habits/types";
import { HABIT_CATEGORY_META } from "@/modules/habits/utils/habits";

interface CategorySelectorProps {
  value: HabitCategory;
  onChange: (value: HabitCategory) => void;
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
      {(Object.keys(HABIT_CATEGORY_META) as HabitCategory[]).map((categoryKey) => {
        const category = HABIT_CATEGORY_META[categoryKey];
        const active = value === categoryKey;

        return (
          <button
            key={categoryKey}
            type="button"
            onClick={() => onChange(categoryKey)}
            className={cn(
              "rounded-[calc(var(--radius)+0.375rem)] border px-3.5 py-3 text-right transition-all duration-200",
              active
                ? `bg-background/70 ${category.chipClass} ${category.glowClass}`
                : "border-border/70 bg-background/55 text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-bold">{category.label}</p>
                <p className="text-[11px] leading-5 text-muted-foreground">{category.hint}</p>
              </div>
              <span className="text-xl leading-none">{category.emoji}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

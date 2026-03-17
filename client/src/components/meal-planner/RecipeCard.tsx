import { Heart, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MealRecipe } from "@/lib/meal-planner";
import { cn } from "@/lib/utils";

interface RecipeCardProps {
  recipe: MealRecipe;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenDetail: () => void;
}

export function RecipeCard({
  recipe,
  isFavorite,
  onToggleFavorite,
  onOpenDetail,
}: RecipeCardProps) {
  return (
    <Card
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-card/90 shadow-sm"
      dir="rtl"
    >
      <button
        type="button"
        onClick={onOpenDetail}
        className="relative h-32 w-full overflow-hidden bg-gradient-to-l from-emerald-50 via-sky-50 to-amber-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950"
      >
        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground">
          صورة وصفة لطيفة هنا
        </div>
      </button>
      <CardContent className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0 space-y-0.5 text-right">
            <p className="truncate text-sm font-semibold text-foreground">
              {recipe.title}
            </p>
            <p className="line-clamp-2 text-[11px] text-muted-foreground leading-5">
              {recipe.description || "وصفة بدون وصف تفصيلي بعد."}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border text-pink-500 transition-colors",
              isFavorite
                ? "border-pink-400 bg-pink-50 dark:border-pink-500/60 dark:bg-pink-500/10"
                : "border-slate-200 bg-background hover:border-pink-300 hover:bg-pink-50/70 dark:border-slate-700 dark:hover:border-pink-500/60 dark:hover:bg-pink-500/10",
            )}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-pink-500")} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
          {typeof recipe.prepMinutes === "number" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
              <Clock className="h-3 w-3" />
              <span>{recipe.prepMinutes} دقيقة</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
            حصص: {recipe.servings}
          </span>
        </div>

        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1 text-[10px] text-muted-foreground">
            {recipe.tags.slice(0, 4).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="rounded-full border-slate-200 px-2 py-0.5 dark:border-slate-700"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full rounded-2xl text-xs"
            type="button"
            onClick={onOpenDetail}
          >
            عرض التفاصيل وإضافة لوجبة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


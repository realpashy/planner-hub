import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { InteractiveCard } from "@/components/ui/interactive-card";
import { MealMedia } from "@/components/meal-planner/MealMedia";
import { MEAL_TYPE_LABELS, type MealPlanMeal } from "@/lib/meal-planner";
import { ChevronDown, RefreshCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MealCardProps {
  meal: MealPlanMeal;
  expanded?: boolean;
  onToggle?: () => void;
  onSwap?: () => void;
}

function renderTag(tag: string) {
  if (tag.includes("protein")) return "🥩 عالي البروتين";
  if (tag.includes("quick") || tag.includes("fast")) return "⚡ سريع";
  if (tag.includes("light")) return "🥗 خفيف";
  return tag.replaceAll("_", " ");
}

export function MealCard({ meal, expanded = false, onToggle, onSwap }: MealCardProps) {
  return (
    <motion.div layout>
      <InteractiveCard className="overflow-hidden border-border/70 bg-background/85">
        <button
          type="button"
          onClick={onToggle}
          className="w-full text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <motion.div layout className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <MealMedia
                  image={meal.image}
                  imageType={meal.imageType}
                  imageSource={meal.imageSource}
                  alt={meal.title}
                  size="sm"
                />
                <div className="space-y-1 text-right">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] font-semibold">
                      {MEAL_TYPE_LABELS[meal.mealType]}
                    </Badge>
                    {meal.repeated ? (
                      <Badge className="rounded-full border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                        مكرر
                      </Badge>
                    ) : null}
                    {meal.reusedIngredient ? (
                      <Badge className="rounded-full border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        مكونات معاد استخدامها
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm font-bold text-foreground sm:text-base">{meal.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {meal.calories} kcal • {meal.protein} بروتين • {meal.waterCups} أكواب ماء
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <InteractiveButton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl px-3"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSwap?.();
                  }}
                >
                  <RefreshCcw className="h-4 w-4" />
                  تبديل
                </InteractiveButton>
                <div className="rounded-full bg-muted p-2 text-muted-foreground">
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expanded && "rotate-180")} />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {meal.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border/70 bg-background/80 px-2 py-1 text-[10px] font-medium text-muted-foreground"
                >
                  {renderTag(tag)}
                </span>
              ))}
            </div>
          </motion.div>
        </button>

        {expanded ? (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border/60 bg-muted/25 px-4 py-4"
          >
            <div className="grid gap-4 text-right sm:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-foreground">المكونات</p>
                  <div className="flex flex-wrap gap-1.5">
                    {meal.ingredients.map((ingredient) => (
                      <Badge key={ingredient} variant="secondary" className="rounded-full px-2 py-1 text-[11px]">
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-foreground">خطوات سريعة</p>
                  <div className="space-y-1.5 text-xs leading-6 text-muted-foreground">
                    {meal.steps.map((step, index) => (
                      <p key={step}>{index + 1}. {step}</p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-border/70 bg-background/80 p-3">
                  <p className="text-xs font-bold text-foreground">لماذا هذه الوجبة؟</p>
                  <div className="mt-2 flex items-start gap-2 text-xs leading-6 text-muted-foreground">
                    <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                    <p>{meal.reason}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 p-3 text-xs leading-6 text-muted-foreground">
                  <p><span className="font-bold text-foreground">الكربوهيدرات:</span> {meal.carbs}غ</p>
                  <p><span className="font-bold text-foreground">الدهون:</span> {meal.fat}غ</p>
                  <p><span className="font-bold text-foreground">التلميح:</span> {meal.shortTip}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </InteractiveCard>
    </motion.div>
  );
}

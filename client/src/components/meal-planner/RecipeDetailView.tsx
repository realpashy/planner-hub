import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { MealRecipe } from "@/lib/meal-planner";

interface RecipeDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: MealRecipe | null;
  onAddToPlan: () => void;
}

export function RecipeDetailView({
  open,
  onOpenChange,
  recipe,
  onAddToPlan,
}: RecipeDetailViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-h-[90vh] max-w-xl overflow-y-auto rounded-3xl px-4 py-4 sm:px-6 sm:py-5"
      >
        {recipe && (
          <>
            <DialogHeader className="text-right space-y-1.5">
              <DialogTitle className="text-lg font-semibold">
                {recipe.title}
              </DialogTitle>
              <DialogDescription className="text-xs leading-6">
                {recipe.description || "وصفة بدون وصف تفصيلي حتى الآن."}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-3 h-40 w-full overflow-hidden rounded-2xl bg-gradient-to-l from-emerald-50 via-sky-50 to-amber-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950" />

            <div className="mt-4 space-y-3 text-right text-xs">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5">
                  الفئة: {recipe.category || "غير مصنّفة"}
                </Badge>
                {recipe.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="rounded-full px-2 py-0.5 text-[11px]"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              <Separator />

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">المكوّنات</h3>
                {recipe.ingredients.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    لم تتم إضافة مكوّنات لهذه الوصفة بعد.
                  </p>
                ) : (
                  <ul className="space-y-1.5 text-[11px] leading-6">
                    {recipe.ingredients.map((ing) => (
                      <li key={ing.id} className="rtl-row items-baseline gap-2">
                        <span className="budget-value-left tabular-nums min-w-[54px] text-xs text-muted-foreground">
                          {ing.quantity} {ing.unit || ""}
                        </span>
                        <span className="flex-1">{ing.displayName}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">الخطوات</h3>
                {recipe.steps.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    لم تتم إضافة خطوات لهذه الوصفة بعد.
                  </p>
                ) : (
                  <ol className="space-y-1.5 text-[11px] leading-6">
                    {recipe.steps.map((step, index) => (
                      <li key={index} className="rtl-row items-start gap-2">
                        <span className="mt-0.5 h-5 w-5 rounded-full bg-emerald-100 text-center text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          {index + 1}
                        </span>
                        <span className="flex-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t pt-3">
              <Button
                className="h-10 w-full rounded-2xl text-sm"
                type="button"
                onClick={onAddToPlan}
              >
                إضافة هذه الوصفة لوجبة
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}


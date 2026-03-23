import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeInfo, ChevronDown, RefreshCcw, Sparkles, Wand2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type MealPlanMeal, type MealSwapMode } from "@/lib/meal-planner";

interface PlannerMealCardProps {
  meal: MealPlanMeal;
  expanded: boolean;
  onToggle: () => void;
  onSwap: (mode: MealSwapMode) => void;
  onRegenerateMeal: () => void;
  remainingActions: number | null;
  loading?: boolean;
}

const SWAP_OPTIONS: Array<{ key: MealSwapMode; label: string; description: string }> = [
  { key: "similar", label: "خيار مشابه", description: "يحافظ على نفس نمط الوجبة مع اقتراح قريب." },
  { key: "higher_protein", label: "بروتين أعلى", description: "يرفع البروتين مع بقاء الوجبة عملية ومشبعة." },
  { key: "faster", label: "تحضير أسرع", description: "نسخة أسرع وأسهل عندما يكون اليوم مزدحمًا." },
  { key: "vegetarian", label: "خيار نباتي", description: "بديل نباتي يحافظ على توازن اليوم." },
];

function labelForMealType(mealType: MealPlanMeal["mealType"]) {
  if (mealType === "breakfast") return "فطور";
  if (mealType === "lunch") return "غداء";
  if (mealType === "dinner") return "عشاء";
  return "سناك";
}

function MiniStat({ value, icon }: { value: string; icon?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-border/70 bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-[var(--app-shadow)]">
      {icon ? <span className="text-sm leading-none">{icon}</span> : null}
      {value}
    </span>
  );
}

export function PlannerMealCard({
  meal,
  expanded,
  onToggle,
  onSwap,
  onRegenerateMeal,
  remainingActions,
  loading = false,
}: PlannerMealCardProps) {
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<MealSwapMode | null>(null);

  const handleConfirmAction = () => {
    if (!selectedMode || loading) return;
    if (selectedMode === "refresh") {
      onRegenerateMeal();
    } else {
      onSwap(selectedMode);
    }
    setActionDialogOpen(false);
    setSelectedMode(null);
  };

  return (
    <>
      <motion.article layout className="meal-surface-card rounded-[calc(var(--radius)+0.65rem)] p-4 shadow-lg">
        <div className="space-y-3.5 text-right">
          <div className="flex items-start justify-start gap-3">
            <div className="min-w-0 flex-1 space-y-2 text-right">
              <div className="rtl-chip-row">
                <span className="meal-label-surface border-primary/20 bg-primary/[0.12] text-primary">{labelForMealType(meal.mealType)}</span>
                {meal.repeated ? <span className="meal-label-surface border-amber-500/20 bg-amber-500/[0.12] text-amber-700 dark:text-amber-300">مكرر</span> : null}
                {meal.reusedIngredient ? <span className="meal-label-surface border-emerald-500/20 bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300">مكونات مشتركة</span> : null}
              </div>
              <div>
                <h4 className="text-lg font-black text-foreground">{meal.title}</h4>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">{meal.ingredients.slice(0, 3).join(" • ")}</p>
              </div>
            </div>

            <InteractiveButton
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 rounded-[5px] border-border/80 bg-background/75 px-3"
              loading={loading}
              onClick={() => {
                setSelectedMode("similar");
                setActionDialogOpen(true);
              }}
            >
              تبديل
              <Wand2 className="h-4 w-4" />
            </InteractiveButton>
          </div>

          <div className="rtl-chip-row">
            <MiniStat icon="🔥" value={`${meal.calories} kcal`} />
            <MiniStat icon="💪" value={`${meal.protein}غ بروتين`} />
            <MiniStat icon="🌾" value={`${meal.carbs}غ كربوهيدرات`} />
            <MiniStat icon="🥑" value={`${meal.fat}غ دهون`} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/80 text-muted-foreground dark:bg-white/5">
                    <BadgeInfo className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[14rem] text-right leading-6" dir="rtl">
                  {meal.reason}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="grid gap-2 text-right sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
            <div className="flex justify-start">
              <button type="button" onClick={onToggle} className="inline-flex items-center gap-2 rounded-[5px] px-2 py-1 text-sm font-semibold text-primary hover:bg-primary/[0.08]">
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                {expanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}
              </button>
            </div>
            {meal.shortTip ? <p className="meal-note-surface py-2 text-xs leading-6">{meal.shortTip}</p> : null}
          </div>

          <AnimatePresence initial={false}>
            {expanded ? (
              <motion.div
                key={`${meal.id}_details`}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-4 border-t border-border/70 pt-4">
                  <div className="space-y-1 text-right">
                    <div className="text-sm font-black text-foreground">تفاصيل الوجبة</div>
                    <div className="text-xs font-semibold text-muted-foreground">المكونات والخطوات والمغذيات</div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
                    <div className="space-y-3 text-right">
                      <div>
                        <p className="text-sm font-bold text-foreground">المكونات</p>
                        <div className="rtl-chip-row mt-2">
                          {meal.ingredients.map((ingredient) => (
                            <span key={ingredient} className="rounded-[5px] border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-foreground shadow-[var(--app-shadow)]">
                              {ingredient}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">خطوات التحضير</p>
                        <div className="mt-2 space-y-2 text-sm leading-7 text-muted-foreground">
                          {meal.steps.map((step, index) => (
                            <p key={step}>
                              {index + 1}. {step}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 text-right">
                      <div className="rounded-[5px] border border-primary/15 bg-primary/[0.08] p-4">
                        <p className="text-sm font-bold text-foreground">لماذا هذه الوجبة؟</p>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">{meal.reason}</p>
                      </div>
                      <div className="rounded-[5px] border border-primary/15 bg-primary/[0.06] p-4">
                        <p className="text-sm font-bold text-foreground">نظرة سريعة</p>
                        <div className="rtl-chip-row mt-3">
                          <MiniStat icon="💪" value={`${meal.protein}غ بروتين`} />
                          <MiniStat icon="🌾" value={`${meal.carbs}غ كربوهيدرات`} />
                          <MiniStat icon="🥑" value={`${meal.fat}غ دهون`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.article>

      <Dialog
        open={actionDialogOpen}
        onOpenChange={(open) => {
          setActionDialogOpen(open);
          if (!open) setSelectedMode(null);
        }}
      >
        <DialogContent dir="rtl" className="meal-surface-popup max-w-xl rounded-[5px] p-0">
          <div className="space-y-5 p-5 text-right">
            <DialogHeader className="space-y-2 text-right">
              <div className="flex items-center justify-start gap-2">
                <span className="meal-label-surface border-primary/20 bg-primary/[0.12] text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  تعديل الوجبة
                </span>
              </div>
              <DialogTitle className="text-right text-xl font-black">اختر طريقة التبديل أو التجديد</DialogTitle>
              <DialogDescription className="text-right leading-7">
                المتبقي من التعديلات السريعة هذا الشهر: <span className="font-black text-foreground">{remainingActions ?? "غير محدود"}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2 sm:grid-cols-2">
              {SWAP_OPTIONS.map((option) => {
                const active = selectedMode === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedMode(option.key)}
                    className={`rounded-[5px] border px-3 py-3 text-right transition-all ${active ? "border-primary/35 bg-primary/[0.12] text-foreground shadow-[var(--app-shadow)]" : "border-border/80 bg-background/75 text-foreground hover:border-primary/20 hover:bg-primary/[0.05]"}`}
                  >
                    <div className="space-y-1 text-right">
                      <div className="text-sm font-bold">{option.label}</div>
                      <div className="text-xs leading-6 text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setSelectedMode("refresh")}
                className={`rounded-[5px] border px-3 py-3 text-right transition-all sm:col-span-2 ${selectedMode === "refresh" ? "border-primary/35 bg-primary/[0.12] text-foreground shadow-[var(--app-shadow)]" : "border-border/80 bg-background/75 text-foreground hover:border-primary/20 hover:bg-primary/[0.05]"}`}
              >
                <div className="flex items-start justify-start gap-3 text-right">
                  <div className="min-w-0 flex-1 space-y-1 text-right">
                    <div className="text-sm font-bold">تجديد الوجبة الحالية</div>
                    <div className="text-xs leading-6 text-muted-foreground">ينشئ اقتراحًا جديدًا لنفس نوع الوجبة داخل هذا اليوم.</div>
                  </div>
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] border border-primary/20 bg-primary text-primary-foreground shadow-[var(--app-shadow)] dark:bg-primary/[0.12] dark:text-primary">
                    <RefreshCcw className="h-4 w-4" />
                  </span>
                </div>
              </button>
            </div>

            <DialogFooter className="border-t border-border/70 pt-4">
              <InteractiveButton
                type="button"
                variant="outline"
                className="rounded-[5px]"
                onClick={() => {
                  setActionDialogOpen(false);
                  setSelectedMode(null);
                }}
              >
                إلغاء
              </InteractiveButton>
              <InteractiveButton type="button" className="rounded-[5px]" disabled={!selectedMode} loading={loading} onClick={handleConfirmAction}>
                {selectedMode === "refresh" ? "تأكيد التجديد" : "تأكيد التبديل"}
                <Wand2 className="h-4 w-4" />
              </InteractiveButton>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { AnimatePresence, motion } from "framer-motion";
import { Apple, BadgeInfo, ChevronDown, Coffee, RefreshCcw, Salad, Soup, Wand2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type MealPlanMeal, type MealSwapMode } from "@/lib/meal-planner";

interface PlannerMealCardProps {
  meal: MealPlanMeal;
  expanded: boolean;
  onToggle: () => void;
  onSwap: (mode: MealSwapMode) => void;
  onRegenerateMeal: () => void;
  loading?: boolean;
}

const SWAP_OPTIONS: Array<{ key: MealSwapMode; label: string }> = [
  { key: "similar", label: "خيار مشابه" },
  { key: "higher_protein", label: "بروتين أعلى" },
  { key: "faster", label: "تحضير أسرع" },
  { key: "vegetarian", label: "خيار نباتي" },
];

function getMealIcon(mealType: MealPlanMeal["mealType"]) {
  if (mealType === "breakfast") return Coffee;
  if (mealType === "lunch") return Salad;
  if (mealType === "dinner") return Soup;
  return Apple;
}

function labelForMealType(mealType: MealPlanMeal["mealType"]) {
  if (mealType === "breakfast") return "فطور";
  if (mealType === "lunch") return "غداء";
  if (mealType === "dinner") return "عشاء";
  return "سناك";
}

function MiniStat({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-semibold text-foreground dark:bg-white/5">
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
  loading = false,
}: PlannerMealCardProps) {
  const Icon = getMealIcon(meal.mealType);

  return (
    <motion.article
      layout
      className="rounded-[1.25rem] border border-white/60 bg-white/84 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-950/78 dark:shadow-[0_18px_38px_rgba(2,6,23,0.4)]"
    >
      <div className="space-y-4 text-right">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <InteractiveButton
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-slate-900/[0.04] dark:bg-white/10"
              loading={loading}
              onClick={onRegenerateMeal}
            >
              <RefreshCcw className="h-4 w-4" />
            </InteractiveButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InteractiveButton type="button" variant="outline" size="sm" className="rounded-full px-3">
                  تبديل
                  <Wand2 className="h-4 w-4" />
                </InteractiveButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-44 rounded-2xl">
                <div dir="rtl">
                  {SWAP_OPTIONS.map((option) => (
                    <DropdownMenuItem key={option.key} onClick={() => onSwap(option.key)} className="cursor-pointer justify-end text-right">
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-start gap-3">
            <div className="space-y-2 text-right">
              <div className="flex flex-wrap justify-end gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{labelForMealType(meal.mealType)}</span>
                {meal.repeated ? <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">مكرر</span> : null}
                {meal.reusedIngredient ? <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">مكونات مشتركة</span> : null}
              </div>
              <div>
                <h4 className="text-lg font-black text-foreground">{meal.title}</h4>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">{meal.ingredients.slice(0, 3).join(" • ")}</p>
              </div>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <MiniStat value={`${meal.calories} kcal`} />
          <MiniStat value={`${meal.protein}غ بروتين`} />
          <MiniStat value={`${meal.carbs}غ كربوهيدرات`} />
          <MiniStat value={`${meal.fat}غ دهون`} />
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

        <div className="flex items-center justify-between">
          <button type="button" onClick={onToggle} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            {expanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}
          </button>
          {meal.shortTip ? <p className="text-xs text-muted-foreground">{meal.shortTip}</p> : <span />}
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
              <div className="grid gap-4 border-t border-border/60 pt-4 md:grid-cols-[1fr_1fr]">
                <div className="space-y-3 text-right">
                  <div>
                    <p className="text-sm font-bold text-foreground">المكونات</p>
                    <div className="mt-2 flex flex-wrap justify-end gap-2">
                      {meal.ingredients.map((ingredient) => (
                        <span key={ingredient} className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-foreground dark:bg-white/5">
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">خطوات التحضير</p>
                    <div className="mt-2 space-y-2 text-sm leading-7 text-muted-foreground">
                      {meal.steps.map((step, index) => (
                        <p key={step}>{index + 1}. {step}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-right">
                  <div className="rounded-[1rem] bg-slate-900/[0.025] p-4 dark:bg-white/[0.04]">
                    <p className="text-sm font-bold text-foreground">لماذا هذه الوجبة؟</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{meal.reason}</p>
                  </div>
                  <div className="rounded-[1rem] bg-slate-900/[0.025] p-4 dark:bg-white/[0.04]">
                    <p className="text-sm font-bold text-foreground">نظرة سريعة</p>
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <MiniStat value={`${meal.protein}غ بروتين`} />
                      <MiniStat value={`${meal.carbs}غ كربوهيدرات`} />
                      <MiniStat value={`${meal.fat}غ دهون`} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

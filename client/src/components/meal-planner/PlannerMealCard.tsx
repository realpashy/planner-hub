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
    <span className="inline-flex items-center rounded-full border border-border/70 bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-[var(--app-shadow)]">
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
      className="rounded-[calc(var(--radius)+0.65rem)] border border-border/80 bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.08),transparent_22%),linear-gradient(180deg,rgba(40,40,40,0.98),rgba(31,31,31,0.98))] p-4 shadow-lg"
    >
      <div className="space-y-3.5 text-right">
        <div className="rtl-title-row items-start">
          <div className="flex flex-1 items-start gap-3">
            <div className="space-y-2 text-right flex-1">
              <div className="flex flex-wrap justify-end gap-2">
                <span className="rounded-full border border-primary/20 bg-primary/[0.12] px-3 py-1 text-xs font-semibold text-primary">{labelForMealType(meal.mealType)}</span>
                {meal.repeated ? <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.12] px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">مكرر</span> : null}
                {meal.reusedIngredient ? <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.12] px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">مكونات مشتركة</span> : null}
              </div>
              <div>
                <h4 className="text-lg font-black text-foreground">{meal.title}</h4>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">{meal.ingredients.slice(0, 3).join(" • ")}</p>
              </div>
            </div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background/70 text-primary shadow-[var(--app-shadow)]">
              <Icon className="h-5 w-5" />
            </span>
          </div>

          <div className="inline-flex items-center gap-2 shrink-0">
            <InteractiveButton
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-[calc(var(--radius)+0.25rem)] bg-background/70 text-muted-foreground hover:text-foreground"
              loading={loading}
              onClick={onRegenerateMeal}
            >
              <RefreshCcw className="h-4 w-4" />
            </InteractiveButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InteractiveButton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full border-border/80 bg-background/75 px-3"
                >
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

        <div className="rtl-title-row items-center">
          {meal.shortTip ? <p className="text-xs text-muted-foreground flex-1">{meal.shortTip}</p> : <span className="flex-1" />}
          <button type="button" onClick={onToggle} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            {expanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </button>
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
                <div className="rtl-title-row items-center">
                  <div className="text-sm font-black text-foreground">تفاصيل الوجبة</div>
                  <div className="text-xs font-semibold text-muted-foreground">المكونات والخطوات والمغذيات</div>
                </div>
                <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
                  <div className="space-y-3 text-right">
                    <div>
                      <p className="text-sm font-bold text-foreground">المكونات</p>
                      <div className="mt-2 flex flex-wrap justify-end gap-2">
                        {meal.ingredients.map((ingredient) => (
                          <span key={ingredient} className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-foreground shadow-[var(--app-shadow)]">
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
                    <div className="rounded-[calc(var(--radius)+0.375rem)] border border-primary/15 bg-primary/[0.08] p-4">
                      <p className="text-sm font-bold text-foreground">لماذا هذه الوجبة؟</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{meal.reason}</p>
                    </div>
                    <div className="rounded-[calc(var(--radius)+0.375rem)] border border-emerald-500/15 bg-emerald-500/[0.06] p-4">
                      <p className="text-sm font-bold text-foreground">نظرة سريعة</p>
                      <div className="mt-3 flex flex-wrap justify-end gap-1.5">
                        <MiniStat value={`${meal.protein}غ بروتين`} />
                        <MiniStat value={`${meal.carbs}غ كربوهيدرات`} />
                        <MiniStat value={`${meal.fat}غ دهون`} />
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
  );
}

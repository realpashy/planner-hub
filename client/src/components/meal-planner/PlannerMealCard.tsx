import { AnimatePresence, motion } from "framer-motion";
import { BadgeInfo, ChevronDown, RefreshCcw, Repeat2, Sparkles, Wand2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MealMedia } from "@/components/meal-planner/MealMedia";
import { MEAL_TYPE_LABELS, type MealPlanMeal, type MealSwapMode } from "@/lib/meal-planner";
import { cn } from "@/lib/utils";

interface PlannerMealCardProps {
  meal: MealPlanMeal;
  expanded: boolean;
  onToggle: () => void;
  onSwap: (mode: MealSwapMode) => void;
  onRegenerateMeal: () => void;
  loading?: boolean;
}

const SWAP_OPTIONS: Array<{ key: MealSwapMode; label: string }> = [
  { key: "similar", label: "سعرات مشابهة" },
  { key: "higher_protein", label: "بروتين أعلى" },
  { key: "faster", label: "أسرع" },
  { key: "vegetarian", label: "نباتي" },
];

function renderTag(tag: string) {
  if (tag.includes("protein")) return "عالي البروتين";
  if (tag.includes("quick") || tag.includes("fast")) return "سريع";
  if (tag.includes("light")) return "خفيف";
  return tag.replaceAll("_", " ");
}

export function PlannerMealCard({
  meal,
  expanded,
  onToggle,
  onSwap,
  onRegenerateMeal,
  loading = false,
}: PlannerMealCardProps) {
  return (
    <motion.article layout className="relative rounded-[1.55rem] border border-white/55 bg-white/80 p-4 shadow-[0_16px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-950/75 dark:shadow-[0_16px_44px_rgba(2,6,23,0.42)]">
      <div className="absolute inset-y-4 right-0 w-px bg-gradient-to-b from-transparent via-border/70 to-transparent" />
      <div className="space-y-3 text-right">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InteractiveButton type="button" variant="outline" size="sm" className="h-9 rounded-2xl border-border/60 bg-background/80 px-3 dark:bg-slate-950/60">
                  تبديل سريع
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
            <InteractiveButton
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-2xl bg-slate-900/[0.04] dark:bg-white/10"
              loading={loading}
              onClick={onRegenerateMeal}
            >
              <RefreshCcw className="h-4 w-4" />
            </InteractiveButton>
          </div>

          <div className="flex items-center gap-3">
            <div className="space-y-1 text-right">
              <div className="flex flex-wrap justify-end gap-2">
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                  {MEAL_TYPE_LABELS[meal.mealType]}
                </span>
                {meal.repeated ? (
                  <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                    مكرر
                  </span>
                ) : null}
                {meal.reusedIngredient ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                    مكونات مشتركة
                  </span>
                ) : null}
              </div>
              <p className="text-base font-black text-foreground">{meal.title}</p>
              <p className="text-xs text-muted-foreground">{meal.calories} kcal • {meal.protein}غ بروتين • {meal.carbs}غ كربوهيدرات</p>
            </div>
            <MealMedia image={meal.image} imageType={meal.imageType} imageSource={meal.imageSource} alt={meal.title} size="sm" />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {meal.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full border border-border/60 bg-background/75 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground dark:bg-slate-950/50">
              {renderTag(tag)}
            </span>
          ))}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/15">
                  <BadgeInfo className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[14rem] text-right leading-6" dir="rtl">
                {meal.reason}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center justify-between">
          <button type="button" onClick={onToggle} className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expanded && "rotate-180")} />
            {expanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}
          </button>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/[0.03] px-3 py-1.5 text-[11px] text-muted-foreground dark:bg-white/6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {meal.shortTip}
          </div>
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
              <div className="grid gap-4 border-t border-border/60 pt-4 md:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-foreground">المكونات</p>
                    <div className="mt-2 flex flex-wrap justify-end gap-2">
                      {meal.ingredients.map((ingredient) => (
                        <span key={ingredient} className="rounded-full border border-border/60 bg-background/75 px-3 py-1 text-[11px] font-medium text-foreground dark:bg-slate-950/50">
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">خطوات قصيرة</p>
                    <div className="mt-2 space-y-1.5 text-xs leading-6 text-muted-foreground">
                      {meal.steps.map((step, index) => (
                        <p key={step}>
                          {index + 1}. {step}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-[1.2rem] border border-border/55 bg-background/75 p-3 text-xs leading-6 text-muted-foreground dark:bg-slate-950/50">
                    <p className="font-bold text-foreground">لماذا هذه الوجبة؟</p>
                    <p className="mt-2">{meal.reason}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-border/55 bg-background/75 p-3 text-xs leading-6 text-muted-foreground dark:bg-slate-950/50">
                    <p><span className="font-bold text-foreground">الدهون:</span> {meal.fat}غ</p>
                    <p><span className="font-bold text-foreground">الماء:</span> {meal.waterCups} أكواب</p>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                      <Wand2 className="h-3 w-3" />
                      محسوبة لتبقى موجزة وسهلة التنفيذ
                    </div>
                    {(meal.repeated || meal.reusedIngredient) ? (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                        <Repeat2 className="h-3 w-3" />
                        {meal.repeated ? "وجبة مكررة لتقليل التشتت" : "تعيد استخدام مكونات موجودة"}
                      </div>
                    ) : null}
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

import type { ComponentType } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Droplets, Flame, RefreshCcw, Sparkles, UtensilsCrossed, Zap } from "lucide-react";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { cn } from "@/lib/utils";
import { formatWater, type PlannerDay } from "@/lib/meal-planner";

interface PlannerDayCardProps {
  day: PlannerDay;
  selected?: boolean;
  onOpen: () => void;
  onRegenerate: () => void;
  regenerating?: boolean;
}

function compactStat(icon: ComponentType<{ className?: string }>, value: string) {
  const Icon = icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-foreground dark:bg-slate-950/50">
      <Icon className="h-3.5 w-3.5 text-primary" />
      {value}
    </span>
  );
}

export function PlannerDayCard({
  day,
  selected = false,
  onOpen,
  onRegenerate,
  regenerating = false,
}: PlannerDayCardProps) {
  const completion = day.meals.length ? Math.round((day.meals.filter((meal) => meal.title.trim()).length / day.meals.length) * 100) : 0;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.988 }}
      dir="rtl"
      className={cn(
        "group relative overflow-hidden rounded-[1.75rem] border bg-white/78 p-4 text-right shadow-[0_18px_46px_rgba(15,23,42,0.06)] backdrop-blur transition-all dark:bg-slate-950/72 dark:shadow-[0_20px_54px_rgba(2,6,23,0.46)]",
        selected
          ? "border-primary/30 shadow-[0_26px_62px_rgba(99,102,241,0.16)] ring-1 ring-primary/18 dark:shadow-[0_26px_72px_rgba(99,102,241,0.18)]"
          : "border-white/55 dark:border-white/10",
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l from-primary/90 via-sky-400/80 to-emerald-400/80", selected ? "opacity-100" : "opacity-60")} />
      <div className="space-y-3 pt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <InteractiveButton
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-2xl bg-slate-900/[0.04] dark:bg-white/10"
              loading={regenerating}
              onClick={onRegenerate}
            >
              <RefreshCcw className="h-4 w-4" />
            </InteractiveButton>
          </div>
          <div className="space-y-1 text-right">
            <div className="flex flex-wrap justify-end gap-2">
              {day.busyDay ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  <Zap className="h-3.5 w-3.5" />
                  مزدحم
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                {completion}% جاهز
              </span>
            </div>
            <p className="text-lg font-black tracking-tight text-foreground">{day.dayName}</p>
            <p className="text-xs text-muted-foreground">{day.dateLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {compactStat(UtensilsCrossed, `${day.meals.length} وجبات`)}
          {compactStat(Flame, `${day.nutrition.calories} kcal`)}
          {compactStat(Sparkles, `${day.nutrition.protein}غ بروتين`)}
          {compactStat(Droplets, formatWater(day.nutrition.waterCups))}
        </div>

        <div className="flex items-start gap-2 rounded-[1.15rem] bg-slate-900/[0.03] px-3 py-2.5 dark:bg-white/6">
          <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
          <p className="line-clamp-2 text-xs leading-6 text-muted-foreground">{day.aiTip}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{day.status === "busy" ? "تجهيز خفيف لليوم" : "توازن اليوم"}</span>
            <span>{completion}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-900/[0.06] dark:bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(16,185,129,0.75),rgba(99,102,241,0.92))]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <InteractiveButton type="button" variant="ghost" size="sm" className="h-9 rounded-2xl px-3 text-primary" onClick={onOpen}>
            <ChevronLeft className="h-4 w-4" />
            فتح التفاصيل
          </InteractiveButton>
          <div className="flex items-center gap-1">
            {day.meals.slice(0, 4).map((meal) => (
              <span key={meal.id} className="flex h-8 w-8 items-center justify-center rounded-2xl bg-background text-sm shadow-sm dark:bg-slate-950/60">
                {meal.icon || "🍽️"}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

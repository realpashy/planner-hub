import { motion } from "framer-motion";
import { Activity, Droplets, Flame, RefreshCcw, Sparkles, TimerReset, Wand2 } from "lucide-react";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { PlannerMetaBadge } from "@/components/meal-planner/PlannerMetaBadge";
import { PlannerMiniChart } from "@/components/meal-planner/PlannerMiniChart";
import { PlannerStatPill } from "@/components/meal-planner/PlannerStatPill";
import { formatWater, type PlannerDashboardSummary, type WeeklyPlanRecord } from "@/lib/meal-planner";

interface PlannerHeroOverviewProps {
  plan: WeeklyPlanRecord;
  summary: PlannerDashboardSummary;
  usage: {
    generationsLeft: number | null;
    dayRegenerationsLeft: number | null;
    swapsLeft: number | null;
  };
  onRegenerateWeek: () => void;
  generating: boolean;
}

export function PlannerHeroOverview({
  plan,
  summary,
  usage,
  onRegenerateWeek,
  generating,
}: PlannerHeroOverviewProps) {
  const stripValues = plan.days.map((day) => day.nutrition.protein);
  const waterPercent = Math.max(12, Math.min(100, Math.round((summary.totalWater / Math.max(1, plan.days.length * 8)) * 100)));

  return (
    <motion.section
      layout
      className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.15),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.92))] p-5 shadow-[0_28px_90px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.14),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.94))] dark:shadow-[0_32px_100px_rgba(2,6,23,0.56)] md:p-6"
      dir="rtl"
    >
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.2),transparent_28%,transparent_72%,rgba(255,255,255,0.16))] dark:bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_32%,transparent_68%,rgba(255,255,255,0.03))]" />
      <div className="relative grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-3 text-right">
              <div className="flex flex-wrap justify-end gap-2">
                <PlannerMetaBadge icon={Wand2} label="خطة ذكية" tone="accent" />
                <PlannerMetaBadge icon={TimerReset} label={`الإصدار ${plan.version}`} />
                <PlannerMetaBadge icon={Sparkles} label={`${usage.generationsLeft ?? "∞"} توليد هذا الشهر`} tone="success" />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight text-foreground md:text-[2.35rem]">مركز أسبوعك الغذائي</h2>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{plan.summary}</p>
              </div>
            </div>

            <InteractiveButton
              type="button"
              className="min-h-12 rounded-[1.25rem] bg-primary px-5 shadow-[0_16px_36px_rgba(99,102,241,0.24)]"
              loading={generating}
              onClick={onRegenerateWeek}
            >
              إعادة توليد الأسبوع
              <RefreshCcw className="h-4 w-4" />
            </InteractiveButton>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <PlannerStatPill icon={Flame} label="السعرات" value={`${summary.averageCalories} kcal`} tone="accent" />
            <PlannerStatPill icon={Activity} label="البروتين" value={`${summary.totalProtein} غ`} />
            <PlannerStatPill icon={Droplets} label="الترطيب" value={formatWater(summary.totalWater)} />
            <PlannerStatPill icon={TimerReset} label="الأيام المتبقية" value={`${summary.remainingDays} أيام`} />
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_0.9fr]">
            <div className="rounded-[1.5rem] border border-white/60 bg-white/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted-foreground">شريط البروتين الأسبوعي</p>
                  <p className="text-sm font-bold text-foreground">يتبع الأيام الحالية فقط</p>
                </div>
                <PlannerMetaBadge icon={Activity} label="إشارة سريعة" tone="accent" />
              </div>
              <PlannerMiniChart values={stripValues} className="mt-3" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted-foreground">إعادة الأيام</p>
                  <p className="mt-1 text-2xl font-black text-foreground">{usage.dayRegenerationsLeft ?? "∞"}</p>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted-foreground">تبديل الوجبات</p>
                  <p className="mt-1 text-2xl font-black text-foreground">{usage.swapsLeft ?? "∞"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[1.65rem] border border-primary/12 bg-primary/[0.07] p-4 dark:border-primary/20 dark:bg-primary/[0.12]">
            <div className="flex items-center justify-between">
              <PlannerMetaBadge icon={Droplets} label="مؤشر الترطيب" tone="accent" />
              <div className="text-right">
                <p className="text-xs text-muted-foreground">التقدم الحالي</p>
                <p className="text-lg font-black text-foreground">{waterPercent}%</p>
              </div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-primary/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${waterPercent}%` }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="h-full rounded-full bg-[linear-gradient(90deg,rgba(56,189,248,0.9),rgba(99,102,241,0.92))]"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-[1.65rem] border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <PlannerMetaBadge icon={Sparkles} label="رؤية AI" tone="accent" />
              <p className="text-xs text-muted-foreground">ملاحظات سريعة</p>
            </div>
            <div className="space-y-2">
              <div className="rounded-[1.25rem] border border-border/50 bg-background/70 px-3 py-2.5 text-sm leading-6 text-foreground dark:bg-slate-950/50">
                {plan.suggestions.nutritionInsight}
              </div>
              <div className="rounded-[1.25rem] border border-border/50 bg-background/70 px-3 py-2.5 text-sm leading-6 text-foreground dark:bg-slate-950/50">
                {plan.suggestions.habitSuggestion}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

import { Flame, Layers3, Salad, Sparkles } from "lucide-react";
import { PlannerMetaBadge } from "@/components/meal-planner/PlannerMetaBadge";
import { PlannerStatPill } from "@/components/meal-planner/PlannerStatPill";
import { type PlannerDashboardSummary, type WeeklyPlanRecord } from "@/lib/meal-planner";

interface PlannerHeroOverviewProps {
  plan: WeeklyPlanRecord;
  summary: PlannerDashboardSummary;
}

export function PlannerHeroOverview({ plan, summary }: PlannerHeroOverviewProps) {
  return (
    <section
      className="rounded-[1.5rem] border border-indigo-200/70 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,242,255,0.92))] p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] dark:border-indigo-400/20 dark:bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.24),transparent_24%),linear-gradient(180deg,rgba(30,41,59,0.96),rgba(15,23,42,0.9))] dark:shadow-[0_24px_60px_rgba(2,6,23,0.48)]"
      dir="rtl"
    >
      <div className="space-y-4 text-right">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex justify-end">
              <PlannerMetaBadge icon={Sparkles} label="ملخص الأسبوع" tone="accent" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">نظرة سريعة على أسبوعك الغذائي</h2>
              <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">{plan.summary}</p>
            </div>
          </div>
          <div className="shrink-0 rounded-full border border-indigo-200/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-indigo-400/20 dark:bg-white/10 dark:text-slate-300">
            {summary.plannedDays} أيام مخططة
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <PlannerStatPill icon={Layers3} label="الأيام المخططة" value={`${summary.plannedDays} أيام`} tone="accent" />
          <PlannerStatPill icon={Flame} label="متوسط السعرات" value={`${summary.averageCalories} kcal`} tone="neutral" />
          <PlannerStatPill icon={Sparkles} label="متوسط البروتين" value={`${summary.averageProtein} غ`} tone="neutral" />
          <PlannerStatPill icon={Salad} label="متوسط الوجبات" value={`${summary.averageMealsPerDay} يوميًا`} tone="soft" />
        </div>

        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
          تذكير: احرص على شرب الماء يوميًا — التوصية العامة غالبًا 6–8 أكواب أو حسب احتياجك.
        </p>
      </div>
    </section>
  );
}

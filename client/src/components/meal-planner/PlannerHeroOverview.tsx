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
      className="rounded-[1.5rem] border border-white/60 bg-white/82 p-5 shadow-[0_16px_42px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-950/78 dark:shadow-[0_22px_58px_rgba(2,6,23,0.44)]"
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
              <p className="mt-1 text-sm leading-7 text-muted-foreground">{plan.summary}</p>
            </div>
          </div>
          <div className="shrink-0 rounded-full border border-border/60 bg-background/80 px-3 py-2 text-xs font-semibold text-muted-foreground dark:bg-white/5">
            {summary.plannedDays} أيام مخططة
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <PlannerStatPill icon={Layers3} label="الأيام المخططة" value={`${summary.plannedDays} أيام`} tone="soft" />
          <PlannerStatPill icon={Flame} label="متوسط السعرات" value={`${summary.averageCalories} kcal`} />
          <PlannerStatPill icon={Sparkles} label="متوسط البروتين" value={`${summary.averageProtein} غ`} />
          <PlannerStatPill icon={Salad} label="متوسط الوجبات" value={`${summary.averageMealsPerDay} يوميًا`} tone="soft" />
        </div>

        <p className="text-sm leading-7 text-muted-foreground">
          تذكير: احرص على شرب الماء يوميًا — التوصية العامة غالبًا 6–8 أكواب أو حسب احتياجك.
        </p>
      </div>
    </section>
  );
}

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
      className="surface-subtle rounded-[calc(var(--radius)+0.9rem)] p-5"
      dir="rtl"
    >
      <div className="space-y-5 text-right">
        <div className="rtl-title-row items-start">
          <div className="space-y-3 flex-1">
            <PlannerMetaBadge icon={Sparkles} label="ملخص الأسبوع" tone="accent" className="w-fit" />
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-foreground">نظرة سريعة على أسبوعك الغذائي</h2>
              <p className="mt-1 text-sm leading-7 text-muted-foreground">{plan.summary}</p>
            </div>
          </div>
          <div className="meal-label-surface shrink-0 text-foreground">
            {summary.plannedDays} أيام مخططة
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PlannerStatPill icon={Layers3} label="الأيام المخططة" value={`${summary.plannedDays} أيام`} tone="accent" />
          <PlannerStatPill icon={Flame} label="متوسط السعرات" value={`${summary.averageCalories} kcal`} tone="neutral" />
          <PlannerStatPill icon={Sparkles} label="متوسط البروتين" value={`${summary.averageProtein} غ`} tone="accent" />
          <PlannerStatPill icon={Salad} label="متوسط الوجبات" value={`${summary.averageMealsPerDay} يوميًا`} tone="soft" />
        </div>

        <p className="meal-note-surface">
          تذكير: احرص على شرب الماء يوميًا — التوصية العامة غالبًا 6–8 أكواب أو حسب احتياجك.
        </p>
      </div>
    </section>
  );
}

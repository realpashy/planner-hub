import { motion } from "framer-motion";
import { Flame, Layers3, Salad, TrendingUp } from "lucide-react";
import { type PlannerDashboardSummary, type WeeklyPlanRecord } from "@/lib/meal-planner";

interface PlannerHeroOverviewProps {
  plan: WeeklyPlanRecord;
  summary: PlannerDashboardSummary;
}

interface StatCardProps {
  icon: any;
  label: string;
  value: string | number;
  trend?: { direction: "up" | "down"; percentage: number };
  description?: string;
  index: number;
}

function StatCard({ icon: Icon, label, value, trend, description, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-lg transition-all hover:shadow-xl hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
    >
      <div className="space-y-4">
        {/* Header with icon */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{label}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 text-white shadow-md">
            <Icon className="h-5 w-5" />
          </div>
        </div>

        {/* Main value with trend */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{value}</span>
            {trend && (
              <div
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${
                  trend.direction === "up"
                    ? "bg-lime-100 text-lime-700 dark:bg-lime-950/50 dark:text-lime-300"
                    : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                }`}
              >
                <TrendingUp className={`h-3 w-3 ${trend.direction === "down" && "rotate-180"}`} />
                {trend.direction === "down" ? "-" : "+"}
                {trend.percentage}%
              </div>
            )}
          </div>
          {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      </div>
    </motion.div>
  );
}

export function PlannerHeroOverview({ plan, summary }: PlannerHeroOverviewProps) {
  // Calculate some trend indicators (mock for now - can be enhanced with real data)
  const trends = {
    days: { direction: "up" as const, percentage: 12 },
    calories: { direction: "up" as const, percentage: 8 },
    protein: { direction: "up" as const, percentage: 5 },
    meals: { direction: "down" as const, percentage: 3 },
  };

  return (
    <section className="space-y-6" dir="rtl">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-3xl border-2 border-lime-200/50 bg-gradient-to-r from-lime-50 to-white p-6 shadow-lg dark:border-lime-900/30 dark:from-slate-900 dark:to-slate-800"
      >
        <div className="space-y-3 text-right">
          <div className="inline-flex items-center gap-2 rounded-full bg-lime-100 px-3 py-1 text-sm font-bold text-lime-700 dark:bg-lime-950/50 dark:text-lime-300">
            <span className="h-2 w-2 rounded-full bg-lime-500" />
            ملخص الأسبوع الغذائي
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{plan.summary || "خطتك الغذائية جاهزة"}</h2>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            تابعي تقدمك وحققي أهدافك الغذائية هذا الأسبوع بخطة محفزة ومتوازنة.
          </p>
        </div>
      </motion.div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Layers3}
          label="الأيام المخططة"
          value={`${summary.plannedDays} أيام`}
          trend={trends.days}
          description="مقارنة بالأسبوع الماضي"
          index={0}
        />
        <StatCard
          icon={Flame}
          label="متوسط السعرات"
          value={`${summary.averageCalories} kcal`}
          trend={trends.calories}
          description="لكل يوم"
          index={1}
        />
        <StatCard
          icon={Salad}
          label="متوسط البروتين"
          value={`${summary.averageProtein}غ`}
          trend={trends.protein}
          description="للتغذية المثلى"
          index={2}
        />
        <StatCard
          icon={Flame}
          label="متوسط الوجبات"
          value={`${summary.averageMealsPerDay} يوميًا`}
          trend={trends.meals}
          description="توزيع منتظم"
          index={3}
        />
      </div>

      {/* Tip Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="rounded-2xl border-l-4 border-lime-500 bg-lime-50/50 p-4 dark:border-lime-400 dark:bg-lime-950/20"
      >
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          💡 <span className="font-bold text-lime-700 dark:text-lime-300">نصيحة:</span> احرص على شرب 6-8 أكواب ماء يوميًا لأفضل النتائج.
        </p>
      </motion.div>
    </section>
  );
}

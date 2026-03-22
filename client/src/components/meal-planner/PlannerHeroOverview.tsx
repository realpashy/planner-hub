import { motion } from "framer-motion";
import { Flame, Layers3, Salad, TrendingUp, ChevronRight } from "lucide-react";
import { type PlannerDashboardSummary, type WeeklyPlanRecord } from "@/lib/meal-planner";
import { Button } from "@/components/ui/button";

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
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:border-lime-300 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900 dark:hover:border-lime-500"
    >
      {/* Decorative accent line */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-lime-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative space-y-5">
        {/* Icon and label */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
          </div>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 + 0.1 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-400 to-lime-500 shadow-lg"
          >
            <Icon className="h-6 w-6 text-white" />
          </motion.div>
        </div>

        {/* Main value with trend */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{value}</span>
            {trend && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                  trend.direction === "up"
                    ? "bg-lime-100 text-lime-700 dark:bg-lime-950/60 dark:text-lime-300"
                    : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                }`}
              >
                <TrendingUp className={`h-3.5 w-3.5 ${trend.direction === "down" && "rotate-180"}`} />
                {trend.direction === "down" ? "-" : "+"}
                {trend.percentage}%
              </motion.div>
            )}
          </div>
          {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      </div>
    </motion.div>
  );
}

export function PlannerHeroOverview({ plan, summary }: PlannerHeroOverviewProps) {
  // Calculate trend indicators
  const trends = {
    days: { direction: "up" as const, percentage: 12 },
    calories: { direction: "up" as const, percentage: 8 },
    protein: { direction: "up" as const, percentage: 5 },
    meals: { direction: "down" as const, percentage: 3 },
  };

  return (
    <section className="space-y-8" dir="rtl">
      {/* Premium Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="overflow-hidden rounded-3xl border-2 border-lime-200/60 bg-gradient-to-r from-lime-50 via-white to-lime-50 p-8 shadow-xl dark:border-lime-900/40 dark:from-slate-900/80 dark:via-slate-800 dark:to-slate-900/80"
      >
        <div className="space-y-4 text-right">
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full bg-lime-100/80 px-4 py-2 text-sm font-bold text-lime-700 dark:bg-lime-950/60 dark:text-lime-300"
          >
            <div className="h-2.5 w-2.5 rounded-full bg-lime-500 animate-pulse" />
            ملخص الخطة الغذائية الأسبوعية
          </motion.div>

          {/* Main heading */}
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white md:text-4xl">
            {plan.summary || "خطتك الغذائية جاهزة"}
          </h2>

          {/* Description */}
          <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
            تابعي تقدمك الغذائي وحققي أهدافك هذا الأسبوع بخطة محفّزة وموازنة بناءً على احتياجاتك الشخصية.
          </p>
        </div>
      </motion.div>

      {/* Premium Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          value={`${summary.averageCalories}`}
          trend={trends.calories}
          description="kcal/يوم"
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
          label="الوجبات يوميًا"
          value={`${summary.averageMealsPerDay}`}
          trend={trends.meals}
          description="توزيع منتظم"
          index={3}
        />
      </div>

      {/* Tips and CTA Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tip Box 1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="rounded-2xl border-l-4 border-lime-500 bg-lime-50/50 p-5 dark:border-lime-400 dark:bg-lime-950/20"
        >
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            <span className="font-bold text-lime-700 dark:text-lime-300">💡 نصيحة:</span> اشربي 6-8 أكواب ماء يوميًا لأفضل النتائج والامتصاص الغذائي.
          </p>
        </motion.div>

        {/* Tip Box 2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.3 }}
          className="rounded-2xl border-l-4 border-blue-500 bg-blue-50/50 p-5 dark:border-blue-400 dark:bg-blue-950/20"
        >
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            <span className="font-bold text-blue-700 dark:text-blue-300">🎯 هدف:</span> حاولي الالتزام بأوقات الوجبات لتحسين الهضم والطاقة.
          </p>
        </motion.div>

        {/* Action Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="rounded-2xl border-2 border-lime-300 bg-gradient-to-br from-lime-100 to-lime-50 p-5 dark:border-lime-500/50 dark:from-lime-950/30 dark:to-lime-900/20"
        >
          <p className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-300">
            هل تريدين خطة جديدة؟
          </p>
          <Button className="w-full gap-2 rounded-xl bg-lime-500 font-bold text-white hover:bg-lime-600">
            إنشاء خطة جديدة
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

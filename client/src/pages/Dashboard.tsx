import { useMemo } from "react";
import { Link } from "wouter";
import {
  Activity,
  ArrowLeft,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Heart,
  LayoutGrid,
  ListTodo,
  LucideIcon,
  Map,
  Sparkles,
  Target,
  Utensils,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getPlannerData } from "@/lib/storage";
import {
  formatAmount,
  getCurrentMonthKey,
  getMonthlyTotals,
  loadBudgetData,
} from "@/lib/budget";
import { getMealPlannerSummary, loadMealPlannerState } from "@/lib/meal-planner";

type ModuleStat = {
  label: string;
  value: string;
  note: string;
};

type ActiveModule = {
  id: string;
  href: string;
  title: string;
  description: string;
  helper: string;
  icon: LucideIcon;
  accentClass: string;
  iconClass: string;
  badgeClass: string;
  highlights: string[];
  stats: [ModuleStat, ModuleStat];
  ctaLabel: string;
};

type UpcomingModule = {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  iconClass: string;
};

type OverviewMetric = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  iconClass: string;
};

const countFormatter = new Intl.NumberFormat("ar");

function formatCount(value: number) {
  return countFormatter.format(value);
}

function DashboardMetricCard({ metric }: { metric: OverviewMetric }) {
  const Icon = metric.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border-2 border-slate-100 bg-white/90 p-4 text-right shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-800/90"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{metric.label}</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{metric.value}</p>
          <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">{metric.note}</p>
        </div>
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2", metric.iconClass)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
}

function ActiveModuleCard({ module, index }: { module: ActiveModule; index: number }) {
  const Icon = module.icon;

  return (
    <Link
      href={module.href}
      className="group block h-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      data-testid={`link-module-${module.id}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 + index * 0.08, duration: 0.4 }}
        className="h-full"
      >
        <div
          className="relative h-full overflow-hidden rounded-3xl border-2 bg-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 dark:bg-slate-800"
          style={{
            borderColor: module.accentClass.includes('blue') ? '#93c5fd' : module.accentClass.includes('emerald') ? '#86efac' : '#fbbf24'
          }}
          data-testid={`module-card-${module.id}`}
        >
          {/* Gradient header background */}
          <div className={cn("absolute inset-x-0 top-0 h-32 opacity-95", module.accentClass)} />

          <div className="relative space-y-6 p-6">
            {/* Icon and badge area */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-100 to-green-50 px-3 py-1.5 dark:from-green-950 dark:to-green-900">
                  <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-300" />
                  <span className="text-xs font-bold text-green-700 dark:text-green-300">جاهز الآن</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{module.title}</h3>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {module.description}
                  </p>
                </div>
              </div>
              <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 shadow-lg", module.iconClass)}>
                <Icon className="h-8 w-8" />
              </div>
            </div>

            {/* Highlights/tags */}
            <div className="flex flex-wrap justify-start gap-2">
              {module.highlights.map((highlight) => (
                <span
                  key={highlight}
                  className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                >
                  {highlight}
                </span>
              ))}
            </div>

            {/* Stats grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              {module.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border-2 border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 text-right dark:border-slate-600 dark:from-slate-700/50 dark:to-slate-800"
                >
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{stat.value}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{stat.note}</p>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 transition-all duration-300 group-hover:border-slate-300 group-hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700/30 dark:group-hover:bg-slate-700/50">
              <div className="text-right">
                <p className="font-semibold text-slate-900 dark:text-white">{module.ctaLabel}</p>
                <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">{module.helper}</p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition-transform duration-300 group-hover:scale-110 group-hover:-translate-x-1 dark:bg-white dark:text-slate-900">
                <ArrowLeft className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function UpcomingModuleCard({ module, index }: { module: UpcomingModule; index: number }) {
  const Icon = module.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 + index * 0.08, duration: 0.4 }}
      className="h-full"
    >
      <div className="relative h-full overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-6 shadow-md transition-all hover:shadow-lg hover:border-slate-300 dark:border-slate-600 dark:from-slate-800 dark:to-slate-900 dark:hover:border-slate-500">
        <div className="flex h-full flex-col gap-4 text-right">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-slate-200 to-slate-100 px-3 py-1 dark:from-slate-700 dark:to-slate-800">
                <Sparkles className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">قريبًا</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{module.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-400">{module.desc}</p>
              </div>
            </div>
            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2", module.iconClass)}>
              <Icon className="h-6 w-6" />
            </div>
          </div>

          {/* Small lock indicator at bottom */}
          <div className="mt-auto flex items-center justify-start gap-2 rounded-full bg-white/70 px-3 py-2 dark:bg-slate-700/70">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600">
              <Clock3 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">قيد التطوير</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const auth = useAuth();

  const { activeModules, overviewMetrics, upcomingModules } = useMemo(() => {
    const plannerData = getPlannerData();
    const plannerOpenTasks = plannerData.tasks.filter((task) => !task.completed).length;
    const plannerCompletedTasks = plannerData.tasks.filter((task) => task.completed).length;
    const plannerEvents = plannerData.events.length;
    const plannerHabits = plannerData.habits.length;

    const budgetData = loadBudgetData();
    const currentMonthKey = getCurrentMonthKey();
    const monthTotals = getMonthlyTotals(budgetData.transactions, currentMonthKey);
    const currentMonthLabel = new Intl.DateTimeFormat("ar", {
      month: "long",
      year: "numeric",
    }).format(new Date(`${currentMonthKey}-01T00:00:00`));

    const mealState = loadMealPlannerState();
    const mealSummary = getMealPlannerSummary(mealState);

    const active: ActiveModule[] = [
      {
        id: "planner",
        href: "/weekly-planner",
        title: "المخطط الأسبوعي",
        description: "لوحة يومية وأسبوعية لترتيب المهام، الأحداث، العادات، والملاحظات من شاشة واحدة.",
        helper: "ادخلي مباشرة إلى أسبوعك الحالي وابدئي من يومك.",
        icon: Calendar,
        accentClass: "from-primary/20 via-primary/8 to-transparent",
        iconClass: "border-primary/15 bg-primary/10 text-primary",
        badgeClass: "border-primary/20 bg-primary/10 text-primary",
        highlights: ["المهام اليومية", "الأحداث والمواعيد", "العادات والملاحظات"],
        stats: [
          {
            label: "مهام مفتوحة",
            value: formatCount(plannerOpenTasks),
            note: plannerCompletedTasks > 0
              ? `${formatCount(plannerCompletedTasks)} مهام مكتملة`
              : "ابدئي بإضافة أول مهمة",
          },
          {
            label: "أحداث وعادات",
            value: formatCount(plannerEvents + plannerHabits),
            note: `${formatCount(plannerEvents)} أحداث • ${formatCount(plannerHabits)} عادات`,
          },
        ],
        ctaLabel: "افتح المخطط",
      },
      {
        id: "budget",
        href: "/budget",
        title: "الميزانيّة الشهرية",
        description: "مركز مالي أوضح لمتابعة الدخل والمصروفات والفواتير والأهداف الادخارية خلال الشهر.",
        helper: "راجعي أرقام الشهر الحالي وانتقلي بسرعة إلى التفاصيل.",
        icon: Wallet,
        accentClass: "from-emerald-500/22 via-emerald-500/8 to-transparent",
        iconClass: "border-emerald-500/15 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
        badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        highlights: ["دخل ومصروفات", "فواتير وديون", "أهداف ادخار"],
        stats: [
          {
            label: "صافي الشهر",
            value: formatAmount(monthTotals.net, budgetData.settings.currency),
            note: currentMonthLabel,
          },
          {
            label: "إجمالي التدفق الخارج",
            value: formatAmount(monthTotals.totalOutflow, budgetData.settings.currency),
            note: "يشمل المصروفات والفواتير والادخار",
          },
        ],
        ctaLabel: "افتح الميزانية",
      },
      {
        id: "meal",
        href: "/meal",
        title: "تخطيط الوجبات",
        description: "لوحة أسبوعية أساسية لتعبئة الوجبات الرئيسية، السناك الخفيف، الماء، وملاحظات التحضير بسرعة.",
        helper: "ادخلي إلى عرض الأسبوع أو ابدئي الإعداد خطوة بخطوة من يومك الحالي.",
        icon: Utensils,
        accentClass: "from-pink-500/20 via-pink-500/8 to-transparent",
        iconClass: "border-pink-500/15 bg-pink-500/10 text-pink-600 dark:text-pink-300",
        badgeClass: "border-pink-500/20 bg-pink-500/10 text-pink-700 dark:text-pink-300",
        highlights: ["عرض يبدأ من اليوم", "إعداد موجّه", "ماء بالأكواب واللتر"],
        stats: [
          {
            label: "خانات مخططة",
            value: `${formatCount(mealSummary.plannedMeals)}/${formatCount(mealSummary.totalMeals)}`,
            note: `${formatCount(mealSummary.totalMeals - mealSummary.plannedMeals)} خانات متبقية هذا الأسبوع`,
          },
          {
            label: "إيقاع الأسبوع",
            value: `${formatCount(mealSummary.completedDays)}/7`,
            note: `${formatCount(mealSummary.daysWithWaterTarget)}/7 أيام حققت هدف الماء`,
          },
        ],
        ctaLabel: "افتح الوجبات",
      },
    ];

    const metrics: OverviewMetric[] = [
      {
        label: "موديولات جاهزة الآن",
        value: formatCount(active.length),
        note: "نقطة دخول موحّدة للموديولات الأساسية",
        icon: LayoutGrid,
        iconClass: "border-primary/15 bg-primary/10 text-primary",
      },
      {
        label: "متابعة هذا الأسبوع",
        value: formatCount(plannerOpenTasks + (mealSummary.totalMeals - mealSummary.plannedMeals)),
        note: "مهام مفتوحة وخانات وجبات غير مخططة",
        icon: Clock3,
        iconClass: "border-amber-500/15 bg-amber-500/10 text-amber-600 dark:text-amber-300",
      },
      {
        label: "الوضع الحالي",
        value: formatAmount(monthTotals.net, budgetData.settings.currency),
        note: "صافي الميزانية للشهر الحالي",
        icon: CheckCircle2,
        iconClass: "border-emerald-500/15 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
      },
    ];

    const upcoming: UpcomingModule[] = [
      {
        id: "habits",
        title: "العادات",
        desc: "تجربة مخصصة لتتبّع العادات وبناء الاستمرارية.",
        icon: Activity,
        iconClass: "border-orange-500/15 bg-orange-500/10 text-orange-600 dark:text-orange-300",
      },
      {
        id: "life",
        title: "منظم الحياة",
        desc: "مساحة أوسع لترتيب الجوانب الشخصية والروتين اليومي.",
        icon: Heart,
        iconClass: "border-rose-500/15 bg-rose-500/10 text-rose-600 dark:text-rose-300",
      },
      {
        id: "monthly",
        title: "التخطيط الشهري",
        desc: "عرض شهري شامل للأهداف، المواعيد، والتوزيع العام.",
        icon: CalendarDays,
        iconClass: "border-sky-500/15 bg-sky-500/10 text-sky-600 dark:text-sky-300",
      },
      {
        id: "goals",
        title: "أهداف السنة",
        desc: "متابعة الرؤية السنوية وتقسيمها إلى أهداف قابلة للتنفيذ.",
        icon: Target,
        iconClass: "border-violet-500/15 bg-violet-500/10 text-violet-600 dark:text-violet-300",
      },
      {
        id: "tasks",
        title: "تتبع المهام",
        desc: "لوحة مركّزة لإدارة المهام عبر الموديولات المختلفة.",
        icon: ListTodo,
        iconClass: "border-cyan-500/15 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300",
      },
      {
        id: "travel",
        title: "مخطط السفر",
        desc: "تجربة منظمة للرحلات والحجوزات والمهام قبل السفر.",
        icon: Map,
        iconClass: "border-amber-500/15 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      },
    ];

    return {
      activeModules: active,
      overviewMetrics: metrics,
      upcomingModules: upcoming,
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-white px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 sm:px-6 lg:px-8" dir="rtl">
      {/* Decorative backgrounds */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-gradient-to-l from-blue-300/20 to-transparent blur-3xl dark:from-blue-900/20" />
        <div className="absolute top-1/3 left-1/4 h-96 w-96 rounded-full bg-gradient-to-r from-indigo-300/15 to-transparent blur-3xl dark:from-indigo-900/20" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-10">
        {/* Header with better spacing */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3 rounded-2xl border border-blue-200/50 bg-white/60 px-4 py-3 backdrop-blur dark:border-blue-900/50 dark:bg-blue-950/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">لوحة التحكم الرئيسية</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 rounded-2xl border border-slate-200/60 bg-white/60 p-2 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/60"
          >
            <ThemeToggle />
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl px-4 py-2 font-semibold"
              onClick={() => auth.logout()}
            >
              خروج
            </Button>
          </motion.div>
        </div>

        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="overflow-hidden rounded-3xl border border-blue-200/30 bg-gradient-to-l from-blue-600 to-indigo-700 shadow-2xl dark:border-blue-900/50 dark:from-indigo-950 dark:to-blue-950"
        >
          <div className="relative px-6 py-8 sm:px-8 sm:py-12 md:px-12 md:py-16">
            {/* Accent overlay */}
            <div className="pointer-events-none absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent" />
            </div>

            <div className="relative space-y-6 text-right text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur border border-white/30">
                <LayoutGrid className="h-4 w-4" />
                <span className="text-sm font-bold">{formatCount(activeModules.length)} موديولات جاهزة</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
                  ابدئي من
                  <br />
                  <span className="inline-block bg-gradient-to-l from-yellow-200 to-yellow-100 bg-clip-text text-transparent">الموديول المناسب</span>
                </h1>
                <p className="max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl">
                  أدوات منظّمة وسريعة لكل احتياجاتك: خطط أسبوعية، ميزانيات شهرية، وجداول طعام ذكيّة.
                </p>
              </div>

              <div className="flex flex-wrap justify-start gap-3 pt-4">
                {activeModules.map((module) => (
                  <Button
                    key={module.id}
                    asChild
                    className="rounded-xl bg-white text-blue-700 font-bold hover:bg-blue-50 shadow-lg"
                    size="lg"
                  >
                    <Link href={module.href}>{module.title}</Link>
                  </Button>
                ))}
              </div>
            </div>

            {/* Metric cards on the right side */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:absolute lg:right-8 lg:top-1/2 lg:mt-0 lg:w-72 lg:-translate-y-1/2 lg:grid-cols-1">
              {overviewMetrics.map((metric) => (
                <DashboardMetricCard key={metric.label} metric={metric} />
              ))}
            </div>
          </div>
        </motion.section>

        {/* Active Modules Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="border-b-2 border-slate-200 pb-6 text-right dark:border-slate-700">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">الموديولات الجاهزة</h2>
            <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
              اختاري أداة وابدئي مباشرة - كل موديول مصمّم لكي تحققي أهدافك بسرعة وسهولة.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3" data-testid="modules-grid">
            {activeModules.map((module, index) => (
              <ActiveModuleCard key={module.id} module={module} index={index} />
            ))}
          </div>
        </motion.section>

        {/* Upcoming Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-6"
        >
          <div className="border-b-2 border-slate-200 pb-6 text-right dark:border-slate-700">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">قادم قريبًا</h2>
            <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
              موديولات إضافية قيد التطوير لإكمال منصتك الشاملة.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {upcomingModules.map((module, index) => (
              <UpcomingModuleCard key={module.id} module={module} index={index} />
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}

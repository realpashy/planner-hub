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
    <div className="surface-subtle rounded-[calc(var(--radius)+0.75rem)] p-4 text-right">
      <div className="rtl-title-row">
        <div className="space-y-1.5 flex-1">
          <p className="text-xs font-semibold text-muted-foreground">{metric.label}</p>
          <p className="text-xl font-black text-foreground md:text-2xl">{metric.value}</p>
          <p className="text-xs leading-6 text-muted-foreground">{metric.note}</p>
        </div>
        <div className={cn("icon-chip h-11 w-11 shrink-0 rounded-[calc(var(--radius)+0.375rem)]", metric.iconClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ActiveModuleCard({ module, index }: { module: ActiveModule; index: number }) {
  const Icon = module.icon;

  return (
    <Link
      href={module.href}
      className="group block h-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      data-testid={`link-module-${module.id}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 + index * 0.06 }}
        className="h-full"
      >
        <Card
          className="surface-shell relative h-full overflow-hidden rounded-[calc(var(--radius)+0.85rem)] border-border/80 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-primary/25 group-hover:shadow-2xl"
          data-testid={`module-card-${module.id}`}
        >
          <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-28 opacity-100", module.accentClass)} />

          <CardHeader className="relative gap-5 pb-4 text-right">
            <div className="rtl-title-row">
              <div className="space-y-3 flex-1">
                <Badge className={cn("rounded-full border px-3 py-1 text-[11px] font-semibold", module.badgeClass)}>
                  جاهز الآن
                </Badge>
                <div className="space-y-2">
                  <CardTitle className="text-xl md:text-2xl">{module.title}</CardTitle>
                  <CardDescription className="max-w-md text-sm leading-6 text-muted-foreground">
                    {module.description}
                  </CardDescription>
                </div>
              </div>
              <div className={cn("icon-chip h-14 w-14 shrink-0 rounded-[calc(var(--radius)+0.5rem)]", module.iconClass)}>
                <Icon className="h-6 w-6" />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              {module.highlights.map((highlight) => (
                <Badge
                  key={highlight}
                  variant="secondary"
                  className="rounded-full border-border/70 bg-background/70 px-3 py-1 text-[11px] font-medium text-foreground"
                >
                  {highlight}
                </Badge>
              ))}
            </div>
          </CardHeader>

          <CardContent className="relative space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {module.stats.map((stat) => (
                <div key={stat.label} className="surface-subtle rounded-[calc(var(--radius)+0.5rem)] p-4 text-right">
                  <p className="text-xs font-semibold text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-lg font-extrabold text-foreground">{stat.value}</p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">{stat.note}</p>
                </div>
              ))}
            </div>

            <div className="rtl-title-row rounded-[calc(var(--radius)+0.5rem)] border border-dashed border-border/70 bg-muted/65 p-4 text-right transition-colors group-hover:border-primary/30">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{module.ctaLabel}</p>
                <p className="text-xs leading-6 text-muted-foreground">{module.helper}</p>
              </div>
              <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[calc(var(--radius)+0.375rem)] border border-primary/20 bg-primary text-primary-foreground transition-transform duration-300 group-hover:-translate-x-1">
                <ArrowLeft className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

function UpcomingModuleCard({ module, index }: { module: UpcomingModule; index: number }) {
  const Icon = module.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.32 + index * 0.04 }}
      className="h-full"
    >
      <Card className="surface-subtle h-full rounded-[calc(var(--radius)+0.75rem)] border-dashed border-border/70">
        <CardContent className="flex h-full flex-col gap-4 p-5 text-right">
          <div className="rtl-title-row">
            <div className="space-y-2 flex-1">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] font-semibold">
                قريبًا
              </Badge>
              <div>
                <h3 className="text-base font-bold text-foreground">{module.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{module.desc}</p>
              </div>
            </div>
            <div className={cn("icon-chip h-11 w-11 shrink-0 rounded-[calc(var(--radius)+0.375rem)]", module.iconClass)}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
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
        accentClass: "bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.18),transparent_56%)]",
        iconClass: "border-primary/20 bg-primary/[0.12] text-primary",
        badgeClass: "border-primary/20 bg-primary/[0.12] text-primary",
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
        accentClass: "bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_56%)]",
        iconClass: "border-emerald-500/20 bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300",
        badgeClass: "border-emerald-500/20 bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300",
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
        accentClass: "bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.14),transparent_56%)]",
        iconClass: "border-pink-500/20 bg-pink-500/[0.12] text-pink-600 dark:text-pink-300",
        badgeClass: "border-pink-500/20 bg-pink-500/[0.12] text-pink-700 dark:text-pink-300",
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
        iconClass: "border-primary/20 bg-primary/[0.12] text-primary",
      },
      {
        label: "متابعة هذا الأسبوع",
        value: formatCount(plannerOpenTasks + (mealSummary.totalMeals - mealSummary.plannedMeals)),
        note: "مهام مفتوحة وخانات وجبات غير مخططة",
        icon: Clock3,
        iconClass: "border-amber-500/20 bg-amber-500/[0.12] text-amber-600 dark:text-amber-300",
      },
      {
        label: "الوضع الحالي",
        value: formatAmount(monthTotals.net, budgetData.settings.currency),
        note: "صافي الميزانية للشهر الحالي",
        icon: CheckCircle2,
        iconClass: "border-emerald-500/20 bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300",
      },
    ];

    const upcoming: UpcomingModule[] = [
      {
        id: "habits",
        title: "العادات",
        desc: "تجربة مخصصة لتتبّع العادات وبناء الاستمرارية.",
        icon: Activity,
        iconClass: "border-orange-500/20 bg-orange-500/[0.12] text-orange-600 dark:text-orange-300",
      },
      {
        id: "life",
        title: "منظم الحياة",
        desc: "مساحة أوسع لترتيب الجوانب الشخصية والروتين اليومي.",
        icon: Heart,
        iconClass: "border-rose-500/20 bg-rose-500/[0.12] text-rose-600 dark:text-rose-300",
      },
      {
        id: "monthly",
        title: "التخطيط الشهري",
        desc: "عرض شهري شامل للأهداف، المواعيد، والتوزيع العام.",
        icon: CalendarDays,
        iconClass: "border-sky-500/20 bg-sky-500/[0.12] text-sky-600 dark:text-sky-300",
      },
      {
        id: "goals",
        title: "أهداف السنة",
        desc: "متابعة الرؤية السنوية وتقسيمها إلى أهداف قابلة للتنفيذ.",
        icon: Target,
        iconClass: "border-violet-500/20 bg-violet-500/[0.12] text-violet-600 dark:text-violet-300",
      },
      {
        id: "tasks",
        title: "تتبع المهام",
        desc: "لوحة مركّزة لإدارة المهام عبر الموديولات المختلفة.",
        icon: ListTodo,
        iconClass: "border-cyan-500/20 bg-cyan-500/[0.12] text-cyan-600 dark:text-cyan-300",
      },
      {
        id: "travel",
        title: "مخطط السفر",
        desc: "تجربة منظمة للرحلات والحجوزات والمهام قبل السفر.",
        icon: Map,
        iconClass: "border-amber-500/20 bg-amber-500/[0.12] text-amber-700 dark:text-amber-300",
      },
    ];

    return {
      activeModules: active,
      overviewMetrics: metrics,
      upcomingModules: upcoming,
    };
  }, []);

  return (
    <div className="app-shell relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.12),transparent_52%),radial-gradient(circle_at_top_left,rgba(255,255,255,0.04),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.13),transparent_46%),radial-gradient(circle_at_top_left,rgba(255,255,255,0.02),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-32 h-72 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.2),transparent)] dark:bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.015),transparent)]" />

      <div className="relative mx-auto max-w-6xl space-y-8">
        <div className="rtl-meta-row flex-col gap-3 sm:flex-row">
          <div className="accent-shell rtl-actions-inline self-start rounded-full px-4 py-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>لوحة تحكم أوضح للوصول السريع إلى أدواتك</span>
          </div>
          <div className="surface-shell rtl-actions-inline self-start rounded-[calc(var(--radius)+0.5rem)] p-2">
            <ThemeToggle />
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl px-4"
              onClick={() => auth.logout()}
            >
              خروج
            </Button>
          </div>
        </div>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Card className="surface-shell overflow-hidden rounded-[calc(var(--radius)+1rem)] border-border/80 shadow-xl">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.2fr,0.95fr] lg:items-center lg:p-8">
              <div className="space-y-5 text-right">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.12] px-3 py-1.5 text-xs font-semibold text-primary">
                  <LayoutGrid className="h-4 w-4" />
                  <span>{formatCount(activeModules.length)} موديولات جاهزة الآن</span>
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl font-extrabold leading-tight text-foreground md:text-5xl">
                    ابدئي من الموديول المناسب في <span className="text-primary">Planner Hub</span>
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                    تحسينات الدخول أصبحت تركّز على الوضوح والسرعة: بطاقات أغنى بالمعلومة، تسلسل بصري أقوى،
                    واختصارات مباشرة للموديولات التي تعمل فعليًا الآن.
                  </p>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  {activeModules.map((module) => (
                    <Button
                      key={module.id}
                      asChild
                      variant="outline"
                      className="min-h-11 rounded-[calc(var(--radius)+0.375rem)] border-border/80 bg-background/75 px-4 text-sm font-semibold"
                    >
                      <Link href={module.href}>{module.title}</Link>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {overviewMetrics.map((metric) => (
                  <DashboardMetricCard key={metric.label} metric={metric} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <section className="space-y-4">
          <div className="rtl-meta-row flex-col gap-2 sm:flex-row sm:items-end">
            <div className="rtl-title-stack">
              <h2 className="text-2xl font-extrabold text-foreground">الموديولات الجاهزة</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                بطاقات دخول أوضح لكل موديول مع ملخّص سريع يساعدك تختاري من أين تبدئين.
              </p>
            </div>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-xs font-semibold">
              جاهز للاستخدام الآن
            </Badge>
          </div>

          <div className="grid gap-5 lg:grid-cols-3" data-testid="modules-grid">
            {activeModules.map((module, index) => (
              <ActiveModuleCard key={module.id} module={module} index={index} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="rtl-title-stack">
            <h2 className="text-xl font-extrabold text-foreground">لاحقًا في Planner Hub</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              الموديولات القادمة ما زالت واضحة في المشهد العام، لكن دون أن تزاحم الأدوات الجاهزة.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {upcomingModules.map((module, index) => (
              <UpcomingModuleCard key={module.id} module={module} index={index} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

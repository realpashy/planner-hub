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
  LogOut,
  LucideIcon,
  Map,
  Sparkles,
  Target,
  TrendingUp,
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
import {
  loadCashflowData,
  getAvailableBalance,
  getMonthStats,
  getCurrentMonthKey as getCashflowMonthKey,
  formatCashflowAmount,
} from "@/lib/cashflow";

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
    <div className="surface-shell rounded-[calc(var(--radius)+0.75rem)] p-5 text-right">
      <div className="rtl-title-row">
        <div className="space-y-1.5 flex-1">
          <p className="text-xs font-semibold text-muted-foreground">{metric.label}</p>
          <p className="text-2xl font-black text-foreground">{metric.value}</p>
          <p className="text-xs leading-5 text-muted-foreground">{metric.note}</p>
        </div>
        <div className={cn("icon-chip h-12 w-12 shrink-0 rounded-[calc(var(--radius)+0.5rem)]", metric.iconClass)}>
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
          className="surface-shell relative h-full overflow-hidden rounded-[calc(var(--radius)+0.85rem)] border-border/80 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-primary/30 group-hover:shadow-2xl"
          data-testid={`module-card-${module.id}`}
        >
          <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-36", module.accentClass)} />

          <CardHeader className="relative gap-5 pb-4 text-right">
            <div className="rtl-title-row">
              <div className="space-y-3 flex-1">
                <Badge className={cn("rounded-full border px-3 py-1 text-[11px] font-semibold", module.badgeClass)}>
                  جاهز الآن
                </Badge>
                <div className="space-y-2">
                  <CardTitle className="text-xl md:text-2xl">{module.title}</CardTitle>
                  <CardDescription className="max-w-md text-sm leading-6">
                    {module.description}
                  </CardDescription>
                </div>
              </div>
              <div className={cn("icon-chip h-14 w-14 shrink-0 rounded-[calc(var(--radius)+0.5rem)]", module.iconClass)}>
                <Icon className="h-6 w-6" />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              {module.highlights.map((h) => (
                <Badge
                  key={h}
                  variant="secondary"
                  className="rounded-full px-3 py-1 text-[11px] font-medium"
                >
                  {h}
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
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{stat.note}</p>
                </div>
              ))}
            </div>

            <div className="rtl-title-row rounded-[calc(var(--radius)+0.5rem)] border border-dashed border-border/60 bg-muted/50 p-4 text-right transition-colors group-hover:border-primary/35 group-hover:bg-primary/[0.03]">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{module.ctaLabel}</p>
                <p className="text-xs leading-5 text-muted-foreground">{module.helper}</p>
              </div>
              <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[calc(var(--radius)+0.375rem)] bg-primary text-primary-foreground transition-transform duration-300 group-hover:-translate-x-1">
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
      <Card className="surface-subtle h-full rounded-[calc(var(--radius)+0.75rem)] border-dashed border-border/60">
        <CardContent className="flex h-full flex-col p-5 text-right">
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
    const plannerOpenTasks = plannerData.tasks.filter((t) => !t.completed).length;
    const plannerCompletedTasks = plannerData.tasks.filter((t) => t.completed).length;
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

    const cashflowData = loadCashflowData();
    const cashflowBalance = getAvailableBalance(cashflowData);
    const cashflowMonthKey = getCashflowMonthKey();
    const cashflowMonthStats = getMonthStats(cashflowData.transactions, cashflowMonthKey);
    const pendingPaymentsCount = cashflowData.upcomingPayments.filter(
      (p) => p.status === "pending" && p.dueDate >= new Date().toISOString().split("T")[0],
    ).length;

    const active: ActiveModule[] = [
      {
        id: "planner",
        href: "/weekly-planner",
        title: "المخطط الأسبوعي",
        description: "لوحة يومية وأسبوعية لترتيب المهام، الأحداث، العادات، والملاحظات من شاشة واحدة.",
        helper: "ادخلي مباشرة إلى أسبوعك الحالي وابدئي من يومك.",
        icon: Calendar,
        // Light: very soft tint. Dark: richer glow.
        accentClass: "bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.07),transparent_56%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.17),transparent_56%)]",
        iconClass: "border-primary/20 bg-primary/[0.12] text-primary",
        badgeClass: "border-primary/20 bg-primary/[0.1] text-primary dark:bg-primary/[0.15]",
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
        accentClass: "bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.07),transparent_56%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_56%)]",
        iconClass: "border-emerald-500/20 bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300",
        badgeClass: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-700 dark:bg-emerald-500/[0.15] dark:text-emerald-300",
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
        accentClass: "bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.07),transparent_56%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.15),transparent_56%)]",
        iconClass: "border-pink-500/20 bg-pink-500/[0.12] text-pink-600 dark:text-pink-300",
        badgeClass: "border-pink-500/20 bg-pink-500/[0.08] text-pink-700 dark:bg-pink-500/[0.15] dark:text-pink-300",
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
      {
        id: "cashflow",
        href: "/cashflow",
        title: "תזרים מזומנים",
        description: "מרכז תזרים פשוט לעסק הישראלי — יתרה, הכנסות, הוצאות, תשלומים קרובים ושותפים במסך אחד.",
        helper: "עדכן את היתרה, הוסף הכנסה או הוצאה, ועקוב אחרי התשלומים הקרובים.",
        icon: TrendingUp,
        accentClass: "bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.07),transparent_56%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_56%)]",
        iconClass: "border-sky-500/20 bg-sky-500/[0.12] text-sky-600 dark:text-sky-300",
        badgeClass: "border-sky-500/20 bg-sky-500/[0.08] text-sky-700 dark:bg-sky-500/[0.15] dark:text-sky-300",
        highlights: ["יתרה ותזרים", "הכנסות והוצאות", "תשלומים עתידיים"],
        stats: [
          {
            label: "יתרה זמינה",
            value: formatCashflowAmount(cashflowBalance, cashflowData.settings.currency),
            note: `נטו החודש: ${formatCashflowAmount(cashflowMonthStats.net, cashflowData.settings.currency)}`,
          },
          {
            label: "תשלומים ממתינים",
            value: formatCount(pendingPaymentsCount),
            note: pendingPaymentsCount > 0 ? "תשלומים עתידיים פתוחים" : "אין תשלומים ממתינים",
          },
        ],
        ctaLabel: "פתח תזרים",
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
      { id: "habits", title: "العادات", desc: "تجربة مخصصة لتتبّع العادات وبناء الاستمرارية.", icon: Activity, iconClass: "border-orange-500/20 bg-orange-500/[0.12] text-orange-600 dark:text-orange-300" },
      { id: "life", title: "منظم الحياة", desc: "مساحة أوسع لترتيب الجوانب الشخصية والروتين اليومي.", icon: Heart, iconClass: "border-rose-500/20 bg-rose-500/[0.12] text-rose-600 dark:text-rose-300" },
      { id: "monthly", title: "التخطيط الشهري", desc: "عرض شهري شامل للأهداف، المواعيد، والتوزيع العام.", icon: CalendarDays, iconClass: "border-sky-500/20 bg-sky-500/[0.12] text-sky-600 dark:text-sky-300" },
      { id: "goals", title: "أهداف السنة", desc: "متابعة الرؤية السنوية وتقسيمها إلى أهداف قابلة للتنفيذ.", icon: Target, iconClass: "border-violet-500/20 bg-violet-500/[0.12] text-violet-600 dark:text-violet-300" },
      { id: "tasks", title: "تتبع المهام", desc: "لوحة مركّزة لإدارة المهام عبر الموديولات المختلفة.", icon: ListTodo, iconClass: "border-cyan-500/20 bg-cyan-500/[0.12] text-cyan-600 dark:text-cyan-300" },
      { id: "travel", title: "مخطط السفر", desc: "تجربة منظمة للرحلات والحجوزات والمهام قبل السفر.", icon: Map, iconClass: "border-amber-500/20 bg-amber-500/[0.12] text-amber-700 dark:text-amber-300" },
    ];

    return { activeModules: active, overviewMetrics: metrics, upcomingModules: upcoming };
  }, []);

  return (
    <div className="app-shell" dir="rtl">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      {/* justify-between with dir="rtl": first child → visual RIGHT, second → visual LEFT */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">

          {/* Brand — first in DOM → visual RIGHT in RTL ✓ */}
          <div className="flex items-center gap-2">
            {/* Icon first → visual RIGHT of brand (reading-start side) */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <span className="text-xl font-black tracking-tight text-foreground">Planner Hub</span>
          </div>

          {/* Actions — second in DOM → visual LEFT in RTL ✓ */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 rounded-xl px-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => auth.logout()}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">خروج</span>
            </Button>
          </div>

        </div>
      </nav>

      {/* ── Page content ───────────────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">

        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-5 text-right"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.07] px-3.5 py-1.5 text-xs font-semibold text-primary dark:bg-primary/[0.13]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{formatCount(activeModules.length)} موديولات جاهزة الآن</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl lg:text-[3.25rem]">
              ابدئي من الموديول المناسب في{" "}
              <span className="text-primary">Planner Hub</span>
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
              تحسينات الدخول أصبحت تركّز على الوضوح والسرعة: بطاقات أغنى بالمعلومة، تسلسل بصري أقوى،
              واختصارات مباشرة للموديولات التي تعمل فعليًا الآن.
            </p>
          </div>

          {/* Quick-access links — justify-start = visual RIGHT in RTL ✓ */}
          <div className="flex flex-wrap justify-start gap-2.5">
            {activeModules.map((module) => (
              <Button
                key={module.id}
                asChild
                variant="outline"
                size="sm"
                className="rounded-[calc(var(--radius)+0.375rem)] border-border/70 bg-background/80 px-4 font-semibold hover:border-primary/30 hover:bg-primary/[0.05]"
              >
                <Link href={module.href}>{module.title}</Link>
              </Button>
            ))}
          </div>
        </motion.section>

        {/* Overview metrics — 3-column strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.35 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {overviewMetrics.map((metric) => (
            <DashboardMetricCard key={metric.label} metric={metric} />
          ))}
        </motion.div>

        {/* Active modules */}
        <section className="space-y-4">
          <div className="rtl-title-stack">
            <h2 className="text-2xl font-extrabold text-foreground">الموديولات الجاهزة</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              بطاقات دخول أوضح لكل موديول مع ملخّص سريع يساعدك تختاري من أين تبدئين.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3" data-testid="modules-grid">
            {activeModules.map((module, index) => (
              <ActiveModuleCard key={module.id} module={module} index={index} />
            ))}
          </div>
        </section>

        {/* Upcoming modules */}
        <section className="space-y-4 pb-12">
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

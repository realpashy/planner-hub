import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpLeft,
  Bot,
  CalendarClock,
  LayoutGrid,
  Loader2,
  Sparkles,
  Target,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useAuth } from "@/lib/auth";
import {
  buildDashboardViewModel,
  createDashboardBudgetTransaction,
  createDashboardTask,
  loadDashboardPreferences,
  logDashboardHabit,
  type DashboardModuleCard,
  type DashboardQuickAction,
  type DashboardTrendPoint,
} from "@/lib/dashboard";
import {
  getDashboardContextHash,
  loadCachedDashboardBrief,
  requestDashboardAssistant,
  saveCachedDashboardBrief,
} from "@/lib/ai/dashboard-assistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { loadHabitsState } from "@/modules/habits/utils/habits";
import { getPlannerData, savePlannerData } from "@/lib/storage";
import type { DashboardAssistantAction, DashboardAssistantResult } from "@shared/ai/dashboard-assistant";

type QuickActionKey = DashboardQuickAction["key"] | null;

const SECTION_REVEAL = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.42, ease: "easeOut" as const },
};

function SectionHeader({
  kicker,
  title,
  description,
  icon: Icon,
  action,
}: {
  kicker?: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex items-start justify-start gap-3 text-right">
        <div className="icon-chip h-11 w-11 rounded-[calc(var(--radius)+0.45rem)]">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="space-y-2 text-right">
          {kicker ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {kicker}
            </div>
          ) : null}
          <div>
            <h2 className="text-xl font-black text-foreground md:text-2xl">{title}</h2>
            <p className="mt-1 text-sm leading-7 text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      {action}
    </div>
  );
}

function DashboardChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: DashboardTrendPoint }>;
}) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-[calc(var(--radius)+0.5rem)] bg-[#121212]/95 px-3 py-2 text-right shadow-[0_18px_40px_rgba(0,0,0,0.42)] backdrop-blur-xl">
      <p className="text-xs font-semibold text-muted-foreground">{point.label}</p>
      <p className="mt-1 text-sm font-black text-foreground">{point.value}</p>
      {typeof point.secondary === "number" ? (
        <p className="mt-1 text-[11px] text-muted-foreground">المرجع {Math.round(point.secondary)}</p>
      ) : null}
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta?: string;
  tone: string;
}) {
  return (
    <motion.div whileHover={{ y: -4 }} className="surface-subtle rounded-[calc(var(--radius)+0.9rem)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 text-right">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="habits-number text-[2.15rem] font-black leading-none text-foreground">{value}</p>
        </div>
        {delta ? (
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", tone, "bg-black/10 dark:bg-white/5")}>
            {delta}
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}

function ModuleChart({
  card,
  budgetSeries,
  cashflowSeries,
  habitsSeries,
}: {
  card: DashboardModuleCard;
  budgetSeries: DashboardTrendPoint[];
  cashflowSeries: DashboardTrendPoint[];
  habitsSeries: DashboardTrendPoint[];
}) {
  if (card.key === "budget") {
    return (
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={budgetSeries}>
            <defs>
              <linearGradient id="budget-home-glow" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#c2fe4c" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#c2fe4c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <Tooltip content={<DashboardChartTooltip />} />
            <Area type="monotone" dataKey="value" stroke="#c2fe4c" strokeWidth={3} fill="url(#budget-home-glow)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (card.key === "cashflow") {
    return (
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={cashflowSeries}>
            <Tooltip content={<DashboardChartTooltip />} />
            <Line type="monotone" dataKey="value" stroke="#a68cff" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (card.key === "habits") {
    return (
      <div className="flex items-center justify-start gap-4">
        <div className="h-24 w-24 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              data={[{ value: Number(card.metrics[0]?.value.replace("%", "")) || 0 }]}
              startAngle={210}
              endAngle={-30}
              innerRadius="72%"
              outerRadius="100%"
              barSize={10}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={999} fill="#c2fe4c" background={{ fill: "rgba(255,255,255,0.06)" }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-2">
          {habitsSeries.slice(-3).map((point) => (
            <div key={point.label} className="rounded-[calc(var(--radius)+0.45rem)] bg-black/[0.045] px-2 py-3 text-center dark:bg-white/[0.04]">
              <p className="text-xs text-muted-foreground">{point.label}</p>
              <p className="mt-2 habits-number text-sm font-black text-foreground">{point.value}%</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {card.metrics.map((metric) => (
        <div key={metric.label} className="rounded-[calc(var(--radius)+0.5rem)] bg-black/[0.045] p-3 text-right dark:bg-white/[0.04]">
          <p className="text-xs font-semibold text-muted-foreground">{metric.label}</p>
          <p className="mt-2 text-lg font-black text-foreground">{metric.value}</p>
        </div>
      ))}
    </div>
  );
}

function ModuleShortcutCard({
  card,
  budgetSeries,
  cashflowSeries,
  habitsSeries,
}: {
  card: DashboardModuleCard;
  budgetSeries: DashboardTrendPoint[];
  cashflowSeries: DashboardTrendPoint[];
  habitsSeries: DashboardTrendPoint[];
}) {
  const Icon = card.icon;

  return (
    <Link href={card.href} className="group block h-full outline-none">
      <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.996 }} className="h-full">
        <Card className="surface-shell relative h-full overflow-hidden">
          <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b", card.accent)} />
          <CardContent className="relative space-y-5 p-6">
            <div className="flex items-start justify-between gap-4">
              <ArrowUpLeft className="mt-1 h-4.5 w-4.5 text-primary transition-transform duration-200 group-hover:-translate-x-1 group-hover:-translate-y-1" />
              <div className="flex items-start gap-3 text-right">
                <div className="icon-chip h-12 w-12 rounded-[calc(var(--radius)+0.55rem)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="soft-badge">{card.status}</div>
                  <div>
                    <p className="text-xl font-black text-foreground">{card.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{card.subtitle}</p>
                  </div>
                </div>
              </div>
            </div>

            <ModuleChart card={card} budgetSeries={budgetSeries} cashflowSeries={cashflowSeries} habitsSeries={habitsSeries} />

            <div className="soft-panel px-4 py-3 text-right">
              <p className="text-sm font-semibold text-foreground">{card.cta}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

export default function Dashboard() {
  const auth = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [refreshToken, setRefreshToken] = useState(0);
  const [openQuickAction, setOpenQuickAction] = useState<QuickActionKey>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskTime, setTaskTime] = useState("");
  const [financeTitle, setFinanceTitle] = useState("");
  const [financeAmount, setFinanceAmount] = useState("");
  const [financeDate, setFinanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [habitId, setHabitId] = useState("");
  const [assistantResult, setAssistantResult] = useState<DashboardAssistantResult | null>(null);
  const [dailyBrief, setDailyBrief] = useState<DashboardAssistantResult | null>(null);
  const preferences = useMemo(() => loadDashboardPreferences(), [refreshToken]);
  const viewModel = useMemo(() => buildDashboardViewModel(), [refreshToken]);
  const habitsState = useMemo(() => loadHabitsState(), [refreshToken]);
  const pendingHabits = useMemo(
    () =>
      habitsState.habits.filter((habit) => {
        const todayValue = habitsState.logs.find((log) => log.habitId === habit.id && log.date === viewModel.isoDate)?.value ?? 0;
        return todayValue < 1;
      }),
    [habitsState, viewModel.isoDate],
  );
  const dashboardContextHash = useMemo(() => getDashboardContextHash(viewModel.context), [viewModel.context]);

  const assistantMutation = useMutation({
    mutationFn: async (action: DashboardAssistantAction) => requestDashboardAssistant(action, viewModel.context),
    onSuccess: (result, action) => {
      if (action === "generateDashboardInsight") {
        saveCachedDashboardBrief(viewModel.isoDate, dashboardContextHash, result);
        setDailyBrief(result);
      }
      setAssistantResult(result);
    },
    onError: (error) => {
      toast({
        title: "تعذر تحديث المساعد الآن",
        description: error instanceof Error ? error.message : "حاول مرة أخرى بعد قليل.",
        duration: 3000,
      });
    },
  });

  useEffect(() => {
    const cached = loadCachedDashboardBrief(viewModel.isoDate, dashboardContextHash);
    if (cached) {
      setDailyBrief(cached);
      return;
    }
    assistantMutation.mutate("generateDashboardInsight");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewModel.isoDate, dashboardContextHash]);

  const heroQuickActions = useMemo(
    () => viewModel.quickActions.filter((action) => ["task", "habit", "expense"].includes(action.key)).slice(0, 3),
    [viewModel.quickActions],
  );

  const heroAction = useMemo(() => {
    if (viewModel.overdueCount > 0 || viewModel.topPriorities.length > 0) {
      return {
        label: viewModel.overdueCount > 0 ? "رتّب المهام المتأخرة" : "افتح أولويات اليوم",
        href: "/weekly-planner",
      };
    }
    if (viewModel.atRiskHabits.length > 0) {
      return { label: "أكمل عاداتك اليوم", href: "/habits" };
    }
    if (viewModel.financeAlert) {
      return { label: "راجع وضعك المالي", href: "/budget" };
    }
    return { label: "استكمل من آخر نقطة", href: viewModel.recentItems[0]?.path || "/weekly-planner" };
  }, [viewModel]);

  const insightsFeed = useMemo(() => {
    const rows = [
      ...viewModel.topPriorities.slice(0, 2).map((item, index) => ({
        key: `priority-${index}`,
        label: "أولوية اليوم",
        value: item,
        tone: "text-sky-300",
        href: "/weekly-planner",
      })),
      ...viewModel.atRiskHabits.slice(0, 2).map((item, index) => ({
        key: `habit-${index}`,
        label: "عادة تحتاج إغلاقًا",
        value: item,
        tone: "text-primary",
        href: "/habits",
      })),
    ];

    if (viewModel.financeAlert) {
      rows.push({
        key: "finance-alert",
        label: "إشارة مالية",
        value: viewModel.financeAlert,
        tone: "text-[#ffb69f]",
        href: "/cashflow",
      });
    }

    if (viewModel.recentItems[0]) {
      rows.push({
        key: "recent",
        label: "العودة السريعة",
        value: viewModel.recentItems[0].label,
        tone: "text-[#c6b8ff]",
        href: viewModel.recentItems[0].path,
      });
    }

    return rows.slice(0, 5);
  }, [viewModel]);

  const closeQuickAction = () => {
    setOpenQuickAction(null);
    setTaskTitle("");
    setTaskTime("");
    setFinanceTitle("");
    setFinanceAmount("");
    setFinanceDate(new Date().toISOString().slice(0, 10));
    setHabitId("");
  };

  const handleQuickActionSubmit = () => {
    if (openQuickAction === "task") {
      if (!taskTitle.trim()) return;
      createDashboardTask(taskTitle, viewModel.isoDate, taskTime || undefined);
      toast({ title: "تمت إضافة المهمة", description: "أصبحت المهمة في المخطط الأسبوعي مباشرة.", duration: 2500 });
      setRefreshToken((value) => value + 1);
      closeQuickAction();
      return;
    }

    if (openQuickAction === "habit") {
      if (!habitId) return;
      const habit = logDashboardHabit(habitId);
      if (habit) {
        toast({ title: "تم تسجيل العادة", description: `${habit.name} تقدمت اليوم.`, duration: 2500 });
        setRefreshToken((value) => value + 1);
      }
      closeQuickAction();
      return;
    }

    if (openQuickAction === "expense" || openQuickAction === "income") {
      const amount = Number(financeAmount);
      if (!financeTitle.trim() || !Number.isFinite(amount) || amount <= 0) return;
      createDashboardBudgetTransaction(openQuickAction, financeTitle, amount, financeDate);
      toast({
        title: openQuickAction === "expense" ? "تم تسجيل المصروف" : "تم تسجيل الدخل",
        description: "الحركة ظهرت في الميزانية الشهرية.",
        duration: 2500,
      });
      setRefreshToken((value) => value + 1);
      closeQuickAction();
    }
  };

  const handlePlannerQuickClose = () => {
    const planner = getPlannerData();
    const nextTask = planner.tasks.find((task) => !task.completed && (task.date === viewModel.isoDate || task.deadline === viewModel.isoDate));
    if (!nextTask) {
      setLocation("/weekly-planner");
      return;
    }

    savePlannerData({
      ...planner,
      tasks: planner.tasks.map((task) => (task.id === nextTask.id ? { ...task, completed: true } : task)),
    });
    setRefreshToken((value) => value + 1);
    toast({
      title: "تم إغلاق المهمة التالية",
      description: "حدّثنا لوحة اليوم مباشرة.",
      duration: 2200,
    });
  };

  const displayName = auth.user?.displayName?.split(" ")[0] || "صاحب الخطة";
  const assistantView = assistantResult || dailyBrief;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6" dir="rtl">
      {preferences.visibleWidgets.hero ? (
        <motion.section {...SECTION_REVEAL}>
          <Card className="ai-surface overflow-hidden">
            <CardContent className="relative p-6 md:p-8">
              <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                <div className="space-y-6 text-right">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-start gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-primary/14 px-3 py-1 text-xs font-semibold text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                        {viewModel.greeting}
                      </span>
                      <span className="rounded-full bg-white/6 px-3 py-1 text-xs font-medium text-muted-foreground">
                        {viewModel.dateLabel}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-[#c6b8ff]">لوحة تشغيلك اليومية</p>
                      <h1 className="text-3xl font-black leading-tight text-foreground md:text-5xl">
                        مرحبًا {displayName}، هذا هو يومك في أبسط وأوضح صورة.
                      </h1>
                      <p className="max-w-3xl text-sm leading-8 text-muted-foreground md:text-base">
                        سطح منزلي واحد يختصر ما يجب حسمه الآن، يوصلك إلى وحداتك الأساسية بسرعة، ويعرض فقط الإشارات البيانية التي تساعدك على القرار.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="surface-subtle rounded-[calc(var(--radius)+0.9rem)] p-4 text-right">
                      <p className="text-xs font-semibold text-[#c6b8ff]">القراءة الحالية</p>
                      <p className="mt-2 text-xl font-black text-foreground">
                        {assistantView?.headline || "يومك منظم، واللوحة هنا لتقودك من القرار إلى التنفيذ."}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {assistantView?.summary || viewModel.summaryLine}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button
                        className="h-12 rounded-[calc(var(--radius)+0.55rem)] px-5 text-sm font-bold shadow-[0_0_18px_rgba(194,254,76,0.16)]"
                        onClick={() => setLocation(heroAction.href)}
                      >
                        {heroAction.label}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 rounded-[calc(var(--radius)+0.55rem)] px-5 text-sm font-semibold"
                        onClick={handlePlannerQuickClose}
                      >
                        إغلاق مهمة سريعة
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {heroQuickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <motion.button
                          key={action.key}
                          whileHover={{ y: -3 }}
                          whileTap={{ scale: 0.995 }}
                          className="surface-subtle rounded-[calc(var(--radius)+0.8rem)] p-4 text-right"
                          onClick={() => setOpenQuickAction(action.key)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <ArrowUpLeft className="mt-1 h-4 w-4 text-primary" />
                            <div className="flex items-start gap-3">
                              <div className="icon-chip h-10 w-10 rounded-[calc(var(--radius)+0.45rem)]">
                                <Icon className="h-4.5 w-4.5" />
                              </div>
                              <div className="space-y-1 text-right">
                                <p className="text-sm font-black text-foreground">{action.label}</p>
                                <p className="text-xs leading-6 text-muted-foreground">{action.description}</p>
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="surface-subtle rounded-[calc(var(--radius)+1rem)] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-semibold text-primary">
                        متصل بالوحدات
                      </span>
                      <div className="text-right">
                        <p className="text-lg font-black text-foreground">ما يحتاج انتباهك الآن</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          إشارات قصيرة تعيدك إلى الوحدة المناسبة بدل تكديس لوحات تحكم صغيرة.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {insightsFeed.map((item) => (
                        <Link
                          key={item.key}
                          href={item.href}
                          className="block rounded-[calc(var(--radius)+0.65rem)] bg-black/[0.045] px-4 py-3 transition-colors hover:bg-black/[0.07] dark:bg-white/[0.045] dark:hover:bg-white/[0.06]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <ArrowUpLeft className={cn("mt-1 h-4 w-4", item.tone)} />
                            <div className="space-y-1 text-right">
                              <p className={cn("text-xs font-semibold", item.tone)}>{item.label}</p>
                              <p className="text-sm leading-6 text-foreground">{item.value}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    {viewModel.progressCards.slice(0, 2).map((card) => (
                      <div key={card.key} className="surface-subtle rounded-[calc(var(--radius)+0.75rem)] p-4 text-right">
                        <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
                        <p className="mt-2 habits-number text-3xl font-black text-foreground">{card.value}</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.hint}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      ) : null}

      <motion.section {...SECTION_REVEAL}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {viewModel.heroStats.map((stat) => (
            <KpiCard key={stat.key} label={stat.label} value={stat.value} delta={stat.delta} tone={stat.tone} />
          ))}
        </div>
      </motion.section>

      {preferences.visibleWidgets.modules ? (
        <motion.section {...SECTION_REVEAL}>
          <div className="space-y-5">
            <SectionHeader
              kicker="اختصارات تشغيلية"
              title="الوحدات الأساسية"
              description="أربع بوابات واضحة مع قراءة حية سريعة بدل شبكة مزدحمة أو واجهات متساوية الوزن."
              icon={LayoutGrid}
            />

            <div className="grid gap-4 xl:grid-cols-2">
              {viewModel.moduleCards.map((card) => (
                <ModuleShortcutCard
                  key={card.key}
                  card={card}
                  budgetSeries={viewModel.budgetSeries}
                  cashflowSeries={viewModel.cashflowSeries}
                  habitsSeries={viewModel.habitsSeries}
                />
              ))}
            </div>
          </div>
        </motion.section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        {preferences.visibleWidgets.insights ? (
          <motion.section {...SECTION_REVEAL}>
            <Card className="surface-shell h-full overflow-hidden">
              <CardContent className="space-y-5 p-6">
                <SectionHeader
                  kicker="الرسوم المهمة فقط"
                  title="النبض التشغيلي"
                  description="قراءة مركزة للتقدم، الصرف، والتدفق النقدي بدون تحويل الصفحة إلى غرفة مراقبة."
                  icon={Target}
                />

                <div className="grid gap-4">
                  <div className="surface-subtle rounded-[calc(var(--radius)+0.9rem)] p-4 text-right">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <p className="habits-number text-3xl font-black text-foreground">
                        {Math.min(100, Math.round((viewModel.context.budget.spentThisMonth / Math.max(viewModel.context.budget.monthlyLimit || 1, 1)) * 100))}%
                      </p>
                      <div className="text-right">
                        <p className="text-lg font-black text-foreground">مسار الميزانية</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">هل يصعد الإنفاق بوتيرة صحية خلال أسابيع الشهر؟</p>
                      </div>
                    </div>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={viewModel.budgetSeries}>
                          <defs>
                            <linearGradient id="dashboard-budget-insight" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#c2fe4c" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="#c2fe4c" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                          <Tooltip content={<DashboardChartTooltip />} />
                          <Area type="monotone" dataKey="value" stroke="#c2fe4c" strokeWidth={3} fill="url(#dashboard-budget-insight)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_0.88fr]">
                    <div className="surface-subtle rounded-[calc(var(--radius)+0.9rem)] p-4 text-right">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <p className="cashflow-number text-3xl font-black text-primary">
                          {viewModel.moduleCards.find((card) => card.key === "cashflow")?.metrics[0]?.value}
                        </p>
                        <div className="text-right">
                          <p className="text-lg font-black text-foreground">زخم التدفق النقدي</p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">إشارة أسبوعية سريعة على الميل العام للأيام الأخيرة.</p>
                        </div>
                      </div>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={viewModel.cashflowSeries}>
                            <Tooltip content={<DashboardChartTooltip />} />
                            <Line type="monotone" dataKey="value" stroke="#a68cff" strokeWidth={3} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="surface-subtle rounded-[calc(var(--radius)+0.9rem)] p-4">
                      <div className="flex items-center justify-start gap-4">
                        <div className="h-24 w-24 shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                              data={[{ value: viewModel.context.habits.progressPercent }]}
                              startAngle={210}
                              endAngle={-30}
                              innerRadius="72%"
                              outerRadius="100%"
                              barSize={10}
                            >
                              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                              <RadialBar dataKey="value" cornerRadius={999} fill="#c2fe4c" background={{ fill: "rgba(255,255,255,0.06)" }} />
                            </RadialBarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 text-right">
                          <p className="text-lg font-black text-foreground">اتساق العادات</p>
                          <p className="habits-number text-4xl font-black text-primary">{viewModel.context.habits.progressPercent}%</p>
                          <p className="text-sm leading-6 text-muted-foreground">مؤشر مباشر لمستوى الإغلاق اليومي الحالي.</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {viewModel.habitsSeries.slice(-3).map((point) => (
                          <div key={point.label} className="rounded-[calc(var(--radius)+0.45rem)] bg-black/[0.045] px-2 py-3 text-center dark:bg-white/[0.04]">
                            <p className="text-xs text-muted-foreground">{point.label}</p>
                            <p className="mt-2 habits-number text-sm font-black text-foreground">{point.value}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        ) : null}

        <div className="space-y-6">
          <motion.section {...SECTION_REVEAL}>
            <Card className="surface-shell">
              <CardContent className="space-y-5 p-6">
                <SectionHeader
                  kicker="الوصلات التي تهم"
                  title="اربط الإشارة بالفعل"
                  description="كل سطر هنا يعيدك مباشرة إلى مكان التنفيذ الصحيح داخل Planner Hub."
                  icon={CalendarClock}
                />

                <div className="space-y-3">
                  {insightsFeed.length ? (
                    insightsFeed.map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        className="block rounded-[calc(var(--radius)+0.7rem)] bg-black/[0.045] px-4 py-4 transition-colors hover:bg-black/[0.07] dark:bg-white/[0.045] dark:hover:bg-white/[0.06]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <ArrowUpLeft className={cn("mt-1 h-4.5 w-4.5", item.tone)} />
                          <div className="space-y-1 text-right">
                            <p className={cn("text-xs font-semibold", item.tone)}>{item.label}</p>
                            <p className="text-sm leading-6 text-foreground">{item.value}</p>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="surface-subtle rounded-[calc(var(--radius)+0.7rem)] p-4 text-right text-sm leading-7 text-muted-foreground">
                      لا توجد إشارات ملحّة الآن. يمكنك الانتقال مباشرة إلى الوحدة التي تريد متابعتها.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {preferences.visibleWidgets.assistant ? (
            <motion.section {...SECTION_REVEAL}>
              <Card className="ai-surface overflow-hidden">
                <CardContent className="space-y-5 p-6">
                  <SectionHeader
                    kicker="ثانوي ومفيد"
                    title="مساعد الذكاء"
                    description="يبقى حاضرًا كأداة دعم سريعة، لا كمنطقة رئيسية تزاحم الصفحة."
                    icon={Bot}
                    action={
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-[calc(var(--radius)+0.45rem)] px-4 text-sm"
                        onClick={() => assistantMutation.mutate("generateDashboardInsight")}
                        disabled={assistantMutation.isPending}
                      >
                        {assistantMutation.isPending && assistantMutation.variables === "generateDashboardInsight" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-primary" />
                        )}
                        لخّص اليوم
                      </Button>
                    }
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    {([
                      ["reprioritizeDay", "أعد ترتيب اليوم"],
                      ["spotRisks", "اكشف المخاطر"],
                    ] as Array<[DashboardAssistantAction, string]>).map(([action, label]) => (
                      <Button
                        key={action}
                        type="button"
                        variant="outline"
                        className="h-11 justify-between rounded-[calc(var(--radius)+0.5rem)]"
                        onClick={() => assistantMutation.mutate(action)}
                        disabled={assistantMutation.isPending}
                      >
                        {assistantMutation.isPending && assistantMutation.variables === action ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-primary" />
                        )}
                        {label}
                      </Button>
                    ))}
                  </div>

                  <div className="rounded-[calc(var(--radius)+0.8rem)] bg-black/[0.045] p-5 text-right shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] dark:bg-white/[0.045] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                    <p className="text-lg font-black text-foreground">
                      {assistantView?.headline || "ماذا يحتاج يومك الآن؟"}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {assistantView?.summary || "شغّل المساعد عندما تحتاج إعادة ترتيب سريعة أو كشفًا للمخاطر قبل الانتقال إلى الوحدة المناسبة."}
                    </p>

                    {(assistantView?.bullets?.length ?? 0) > 0 ? (
                      <div className="mt-4 space-y-2">
                        {assistantView?.bullets.slice(0, 2).map((bullet) => (
                          <div key={bullet} className="flex items-start justify-between gap-3 rounded-[calc(var(--radius)+0.5rem)] bg-black/[0.06] px-3 py-3 dark:bg-black/18">
                            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <p className="text-sm leading-6 text-foreground">{bullet}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {assistantView?.bestNextAction ? (
                      <div className="mt-4 flex justify-start">
                        <Button
                          className="h-11 rounded-[calc(var(--radius)+0.55rem)] px-5 font-bold"
                          onClick={() => setLocation(assistantView.bestNextAction!.href)}
                        >
                          افتح الخطوة التالية
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          ) : null}
        </div>
      </div>

      <Dialog open={openQuickAction !== null} onOpenChange={(open) => !open && closeQuickAction()}>
        <DialogContent dir="rtl" className="max-w-lg text-right">
          <DialogHeader className="text-right">
            <DialogTitle className="text-right text-2xl font-black">
              {openQuickAction === "task"
                ? "إضافة مهمة سريعة"
                : openQuickAction === "habit"
                  ? "تسجيل عادة"
                  : openQuickAction === "expense"
                    ? "إضافة مصروف"
                    : openQuickAction === "income"
                      ? "إضافة دخل"
                      : ""}
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {openQuickAction === "task" ? (
              <motion.div key="task" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <Input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="عنوان المهمة" className="h-12 text-right" />
                <Input value={taskTime} onChange={(event) => setTaskTime(event.target.value)} placeholder="وقت اختياري مثل 11:00" className="h-12 text-right" />
              </motion.div>
            ) : null}

            {openQuickAction === "habit" ? (
              <motion.div key="habit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <Select value={habitId} onValueChange={setHabitId}>
                  <SelectTrigger className="h-12 text-right">
                    <SelectValue placeholder="اختر عادة غير مكتملة" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {pendingHabits.map((habit) => (
                      <SelectItem key={habit.id} value={habit.id}>{habit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            ) : null}

            {openQuickAction === "expense" || openQuickAction === "income" ? (
              <motion.div key="finance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <Input value={financeTitle} onChange={(event) => setFinanceTitle(event.target.value)} placeholder="عنوان الحركة" className="h-12 text-right" />
                <Input value={financeAmount} onChange={(event) => setFinanceAmount(event.target.value)} placeholder="المبلغ" className="h-12 text-right" />
                <Input value={financeDate} onChange={(event) => setFinanceDate(event.target.value)} type="date" className="h-12 text-right" />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="flex justify-start gap-3 pt-2">
            <Button variant="outline" className="h-11 rounded-[calc(var(--radius)+0.45rem)] px-4" onClick={closeQuickAction}>
              إلغاء
            </Button>
            <Button className="h-11 rounded-[calc(var(--radius)+0.45rem)] px-4" onClick={handleQuickActionSubmit}>
              تنفيذ الآن
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlarmClock,
  ArrowUpLeft,
  Bot,
  CalendarClock,
  Check,
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
  setDashboardMealFocus,
  type DashboardModuleCard,
  type DashboardQuickAction,
  type DashboardTimelineItem,
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
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.45, ease: "easeOut" as const },
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
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 text-right">
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

function HeroStatCard({
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
    <motion.div whileHover={{ y: -4 }} className="surface-subtle rounded-[calc(var(--radius)+0.8rem)] p-5">
      <div className="space-y-4 text-right">
        {delta ? <p className={cn("text-sm font-semibold", tone)}>{delta}</p> : null}
        <div>
          <p className="habits-number text-[2.2rem] font-black leading-none text-foreground">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </motion.div>
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

function TimelineCard({
  item,
  onQuickToggle,
}: {
  item: DashboardTimelineItem;
  onQuickToggle: (item: DashboardTimelineItem) => void;
}) {
  return (
    <Link href={item.href} className="block">
      <motion.div whileHover={{ y: -3, x: -1 }} whileTap={{ scale: 0.995 }} className="group surface-subtle relative overflow-hidden rounded-[calc(var(--radius)+0.8rem)] px-4 py-4">
        <div className="absolute left-0 top-4 h-[70%] w-[3px] rounded-full bg-white/6">
          <div
            className={cn(
              "absolute inset-y-0 left-0 w-full rounded-full",
              item.status === "attention"
                ? "bg-[#ff9c7e]"
                : item.status === "done"
                  ? "bg-primary"
                  : "bg-[#a68cff]",
            )}
          />
        </div>

        <div className="grid items-center gap-4 md:grid-cols-[18%_1fr_18%]">
          <div className="flex items-center justify-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[calc(var(--radius)+0.55rem)] bg-white/[0.05] text-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              {item.icon}
            </div>
          </div>

          <div className="space-y-3 text-right">
            <div className="space-y-1">
              <p className="text-base font-black text-foreground">{item.title}</p>
              <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{item.timeLabel}</span>
                <span>{item.subtitle}</span>
              </div>
            </div>
            {item.actionable ? (
              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-[calc(var(--radius)+0.4rem)] bg-white/[0.05]"
                  onClick={(event) => {
                    event.preventDefault();
                    onQuickToggle(item);
                  }}
                >
                  <Check className="h-4 w-4" />
                  إنجاز سريع
                </Button>
              </div>
            ) : null}
          </div>

          <div className="space-y-2 text-left">
            <p className="text-xs font-semibold text-muted-foreground">
              {item.module === "planner"
                ? "المخطط"
                : item.module === "habits"
                  ? "العادات"
                  : item.module === "meal"
                    ? "الوجبات"
                    : item.module === "budget"
                      ? "الميزانية"
                      : "النقدي"}
            </p>
            <div
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold",
                item.status === "attention"
                  ? "bg-[#ff9c7e]/15 text-[#ffb69f]"
                  : item.status === "done"
                    ? "bg-primary/15 text-primary"
                    : "bg-[#a68cff]/14 text-[#c6b8ff]",
              )}
            >
              {item.status === "attention" ? "يتطلب انتباهًا" : item.status === "done" ? "مكتمل" : "قادم"}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function ModuleChart({ card, budgetSeries, cashflowSeries, habitsSeries }: {
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
              <linearGradient id="budget-glow" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#c2fe4c" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#c2fe4c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <Tooltip content={<DashboardChartTooltip />} />
            <Area type="monotone" dataKey="value" stroke="#c2fe4c" strokeWidth={3} fill="url(#budget-glow)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (card.key === "cashflow") {
    return (
      <div className="h-24">
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
      <div className="flex h-28 items-center justify-between gap-4">
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
            <div key={point.label} className="rounded-[calc(var(--radius)+0.45rem)] bg-white/[0.04] px-2 py-3 text-center">
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
        <div key={metric.label} className="rounded-[calc(var(--radius)+0.5rem)] bg-white/[0.04] p-3 text-right">
          <p className="text-xs font-semibold text-muted-foreground">{metric.label}</p>
          <p className="mt-2 text-lg font-black text-foreground">{metric.value}</p>
        </div>
      ))}
    </div>
  );
}

function ModuleCard({
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
              <div className="flex items-start gap-3 text-right">
                <div className="icon-chip h-12 w-12 rounded-[calc(var(--radius)+0.55rem)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="inline-flex rounded-full bg-white/[0.05] px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                    {card.status}
                  </div>
                  <div>
                    <p className="text-xl font-black text-foreground">{card.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{card.subtitle}</p>
                  </div>
                </div>
              </div>
              <ArrowUpLeft className="h-4.5 w-4.5 text-primary transition-transform duration-200 group-hover:-translate-x-1 group-hover:-translate-y-1" />
            </div>

            <ModuleChart card={card} budgetSeries={budgetSeries} cashflowSeries={cashflowSeries} habitsSeries={habitsSeries} />

            <div className="rounded-[calc(var(--radius)+0.55rem)] bg-white/[0.04] px-4 py-3 text-right">
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
  const [mealDay, setMealDay] = useState(new Date().toISOString().slice(0, 10));
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

  const groupedTimeline = useMemo(
    () => ({
      morning: viewModel.timeline.filter((item) => item.bucket === "morning"),
      afternoon: viewModel.timeline.filter((item) => item.bucket === "afternoon"),
      evening: viewModel.timeline.filter((item) => item.bucket === "evening"),
    }),
    [viewModel.timeline],
  );

  const handlePlannerToggle = (item: DashboardTimelineItem) => {
    const planner = getPlannerData();
    if (!item.targetId) return;
    savePlannerData({
      ...planner,
      tasks: planner.tasks.map((task) => (task.id === item.targetId ? { ...task, completed: true } : task)),
    });
    setRefreshToken((value) => value + 1);
    toast({
      title: "تم تحديث المهمة",
      description: "أغلقناها مباشرة من لوحة اليوم.",
      duration: 2200,
    });
  };

  const handleTimelineQuickToggle = (item: DashboardTimelineItem) => {
    if (item.module === "planner") {
      handlePlannerToggle(item);
      return;
    }
    if (item.module === "habits" && item.targetId) {
      const habit = logDashboardHabit(item.targetId);
      if (habit) {
        setRefreshToken((value) => value + 1);
        toast({
          title: "تم تسجيل العادة",
          description: `${habit.name} أُغلقت من الجدول الموحد.`,
          duration: 2200,
        });
      }
    }
  };

  const closeQuickAction = () => {
    setOpenQuickAction(null);
    setTaskTitle("");
    setTaskTime("");
    setFinanceTitle("");
    setFinanceAmount("");
    setFinanceDate(new Date().toISOString().slice(0, 10));
    setHabitId("");
    setMealDay(new Date().toISOString().slice(0, 10));
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
      return;
    }

    if (openQuickAction === "meal") {
      setDashboardMealFocus(mealDay);
      closeQuickAction();
      setLocation(`/meal?day=${mealDay}`);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-7" dir="rtl">
      {preferences.visibleWidgets.hero ? (
        <motion.section {...SECTION_REVEAL}>
          <div className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
            <Card className="ai-surface overflow-hidden">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="icon-chip h-12 w-12 rounded-[calc(var(--radius)+0.55rem)]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="space-y-2 text-right">
                    <p className="text-sm font-semibold text-[#c6b8ff]">مساعد الذكاء الاصطناعي</p>
                    <h2 className="text-3xl font-black text-foreground">أفضل خطوة الآن</h2>
                  </div>
                </div>

                <div className="rounded-[calc(var(--radius)+0.8rem)] bg-[#a68cff]/18 px-5 py-6 text-right shadow-[inset_0_0_0_1px_rgba(166,140,255,0.2)]">
                  <p className="text-base leading-8 text-foreground">
                    {dailyBrief?.summary || "نراجع يومك الآن ونبني أفضل اقتراح سريع قبل ضغط المساء."}
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="h-12 w-full rounded-[calc(var(--radius)+0.55rem)] text-base font-bold"
                  onClick={() => setLocation(dailyBrief?.bestNextAction.href || "/weekly-planner")}
                >
                  تطبيق الاقتراح
                </Button>
              </CardContent>
            </Card>

            <Card className="hero-mesh overflow-hidden">
              <CardContent className="space-y-6 p-6 md:p-8">
                <div className="flex flex-wrap items-center justify-start gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#a68cff]/14 px-3 py-1 text-xs font-semibold text-[#c6b8ff]">
                    أسبوع منظم
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/14 px-3 py-1 text-xs font-semibold text-primary">
                    نشط الآن
                  </div>
                </div>

                <div className="space-y-3 text-right">
                  <p className="text-sm font-semibold text-muted-foreground">{viewModel.dateLabel}</p>
                  <h1 className="text-4xl font-black leading-tight text-foreground md:text-[3.65rem]">
                    مرحبًا{auth.user?.displayName ? `، ${auth.user.displayName}` : ""}
                  </h1>
                  <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
                    {dailyBrief?.headline || `${viewModel.greeting}. ${viewModel.summaryLine}`}
                  </p>
                </div>

                <div className="flex flex-wrap justify-start gap-3">
                  <Button
                    className="neon-glow h-12 rounded-[calc(var(--radius)+0.65rem)] px-6 text-base font-black"
                    onClick={() => document.getElementById("dashboard-timeline")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  >
                    ابدأ يومي
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 rounded-[calc(var(--radius)+0.65rem)] px-6 text-base font-bold"
                    onClick={() => setOpenQuickAction("task")}
                  >
                    أضف مهمة الآن
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>
      ) : null}

      {preferences.visibleWidgets.hero ? (
        <motion.section {...SECTION_REVEAL}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {viewModel.heroStats.map((stat) => (
              <HeroStatCard key={stat.key} label={stat.label} value={stat.value} delta={stat.delta} tone={stat.tone} />
            ))}
          </div>
        </motion.section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          {preferences.visibleWidgets.focus ? (
            <motion.section {...SECTION_REVEAL}>
              <Card className="surface-shell">
                <CardContent className="space-y-5 p-6">
                  <SectionHeader
                    kicker="قراءة قصيرة لليوم"
                    title="نبض اليوم"
                    description="ما الذي يحتاج انتباهك الآن دون أن تغرق في كل التفاصيل دفعة واحدة."
                    icon={Target}
                  />

                  <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="surface-subtle rounded-[calc(var(--radius)+0.8rem)] p-5 text-right">
                      <p className="text-base font-black text-foreground">أهم ثلاث نقاط الآن</p>
                      <div className="mt-4 space-y-3">
                        {viewModel.topPriorities.length ? viewModel.topPriorities.map((item) => (
                          <div key={item} className="rounded-[calc(var(--radius)+0.55rem)] bg-white/[0.05] px-4 py-3 text-sm font-semibold text-foreground">
                            {item}
                          </div>
                        )) : (
                          <p className="text-sm text-muted-foreground">لا توجد أولويات ثقيلة لليوم.</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <div className="surface-subtle rounded-[calc(var(--radius)+0.8rem)] p-4 text-right">
                        <p className="text-sm font-semibold text-muted-foreground">المهام المتأخرة</p>
                        <p className="mt-2 habits-number text-3xl font-black text-[#ff9c7e]">{viewModel.overdueCount}</p>
                      </div>
                      <div className="surface-subtle rounded-[calc(var(--radius)+0.8rem)] p-4 text-right">
                        <p className="text-sm font-semibold text-muted-foreground">العادات المهددة</p>
                        <p className="mt-2 text-base font-black text-foreground">{viewModel.atRiskHabits[0] || "لا يوجد خطر مرتفع"}</p>
                      </div>
                      {(viewModel.mealPrepLabel || viewModel.financeAlert) ? (
                        <div className="surface-subtle rounded-[calc(var(--radius)+0.8rem)] p-4 text-right">
                          <p className="text-sm font-semibold text-muted-foreground">إشارة سريعة</p>
                          <p className="mt-2 text-sm leading-7 text-foreground">{viewModel.financeAlert || viewModel.mealPrepLabel}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          ) : null}

          {preferences.visibleWidgets.timeline ? (
            <motion.section id="dashboard-timeline" {...SECTION_REVEAL}>
              <Card className="surface-shell">
                <CardContent className="space-y-5 p-6">
                  <SectionHeader
                    title="التدفق الزمني لليوم"
                    description="خط واحد يجمع المهم من المخطط والعادات والوجبات والتنبيهات المالية."
                    icon={CalendarClock}
                    action={<div className="hidden rounded-full bg-white/[0.05] px-3 py-1 text-xs font-semibold text-muted-foreground md:inline-flex">اليوم</div>}
                  />

                  <div className="grid gap-4 lg:grid-cols-3">
                    {([
                      ["morning", "الفترة الصباحية", "☀️"],
                      ["afternoon", "فترة الظهيرة", "🟣"],
                      ["evening", "الفترة المسائية", "🌙"],
                    ] as const).map(([bucket, label, emoji]) => (
                      <div key={bucket} className="space-y-3">
                        <div className="flex items-center justify-start gap-2 text-right">
                          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-lg">
                            {emoji}
                          </div>
                          <p className="text-lg font-black text-foreground">{label}</p>
                        </div>
                        <div className="space-y-3">
                          {groupedTimeline[bucket].length ? groupedTimeline[bucket].map((item) => (
                            <TimelineCard key={item.id} item={item} onQuickToggle={handleTimelineQuickToggle} />
                          )) : (
                            <div className="surface-subtle rounded-[calc(var(--radius)+0.7rem)] p-4 text-right text-sm text-muted-foreground">
                              لا توجد عناصر ظاهرة هنا.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          ) : null}
        </div>

        <div className="space-y-6">
          {preferences.visibleWidgets.actions ? (
            <motion.section {...SECTION_REVEAL}>
              <Card className="surface-shell">
                <CardContent className="space-y-5 p-6">
                  <SectionHeader
                    title="إجراءات سريعة"
                    description="كل ما تحتاجه للبدء أو الإنقاذ السريع بدون فتح مسارات طويلة."
                    icon={Sparkles}
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    {viewModel.quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <motion.button
                          key={action.key}
                          whileHover={{ y: -3 }}
                          whileTap={{ scale: 0.995 }}
                          className="surface-subtle relative overflow-hidden rounded-[calc(var(--radius)+0.8rem)] p-4 text-right"
                          onClick={() => {
                            if (action.key === "ai") {
                              document.getElementById("dashboard-ai-widget")?.scrollIntoView({ behavior: "smooth", block: "start" });
                              return;
                            }
                            setOpenQuickAction(action.key);
                          }}
                        >
                          <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b", action.accent)} />
                          <div className="relative flex items-start justify-between gap-4">
                            <div className="icon-chip h-11 w-11 rounded-[calc(var(--radius)+0.45rem)]">
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <div className="space-y-1 text-right">
                              <p className="text-sm font-black text-foreground">{action.label}</p>
                              <p className="text-xs leading-6 text-muted-foreground">{action.description}</p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          ) : null}

          {preferences.visibleWidgets.assistant ? (
            <motion.section id="dashboard-ai-widget" {...SECTION_REVEAL}>
              <Card className="ai-surface overflow-hidden">
                <CardContent className="space-y-5 p-6">
                  <SectionHeader
                    kicker="ذكاء مختصر"
                    title="مساعد الذكاء"
                    description="نتائج قصيرة، عملية، وقابلة للتنفيذ مباشرة من لوحة اليوم."
                    icon={Bot}
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    {([
                      ["generateDashboardInsight", "لخّص يومي"],
                      ["reprioritizeDay", "أعد ترتيب اليوم"],
                      ["simplifyPlan", "بسّط خطتي"],
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

                  <div className="rounded-[calc(var(--radius)+0.8rem)] bg-white/[0.045] p-5 text-right shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                    <p className="text-lg font-black text-foreground">
                      {assistantResult?.headline || dailyBrief?.headline || "ماذا يحتاج يومك الآن؟"}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {assistantResult?.summary || dailyBrief?.summary || "يمكنك توليد قراءة سريعة لليوم أو إعادة ترتيب الأولويات بدون فتح محادثة طويلة."}
                    </p>

                    <div className="mt-4 space-y-2">
                      {(assistantResult?.bullets || dailyBrief?.bullets || []).map((bullet) => (
                        <div key={bullet} className="flex items-start justify-between gap-3 rounded-[calc(var(--radius)+0.5rem)] bg-black/18 px-3 py-3">
                          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <p className="text-sm leading-6 text-foreground">{bullet}</p>
                        </div>
                      ))}
                    </div>

                    {(assistantResult?.bestNextAction || dailyBrief?.bestNextAction) ? (
                      <div className="mt-4 flex justify-start">
                        <Button
                          className="h-11 rounded-[calc(var(--radius)+0.55rem)] px-5 font-bold"
                          onClick={() => setLocation((assistantResult?.bestNextAction || dailyBrief?.bestNextAction)!.href)}
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

      {preferences.visibleWidgets.modules ? (
        <motion.section {...SECTION_REVEAL}>
          <div className="space-y-5">
            <SectionHeader
              title="الوحدات الأساسية"
              description="كل وحدة تعرض لك حالتها الحية الآن بدل أن تكون مجرد بوابة تنقل."
              icon={LayoutGrid}
            />

            <div className="grid gap-4 xl:grid-cols-2">
              {viewModel.moduleCards.map((card) => (
                <ModuleCard
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

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        {preferences.visibleWidgets.insights ? (
          <motion.section {...SECTION_REVEAL}>
            <Card className="surface-shell h-full">
              <CardContent className="space-y-5 p-6">
                <SectionHeader
                  title="التقدم والرؤى"
                  description="قراءة بصرية سريعة لمسار العادات والميزانية والتدفق النقدي."
                  icon={Target}
                />

                <div className="grid gap-4">
                  <div className="surface-subtle rounded-[calc(var(--radius)+0.8rem)] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="h-28 w-28 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart data={[{ value: viewModel.context.habits.progressPercent }]} startAngle={210} endAngle={-30} innerRadius="72%" outerRadius="100%" barSize={12}>
                            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                            <RadialBar dataKey="value" cornerRadius={999} fill="#c2fe4c" background={{ fill: "rgba(255,255,255,0.06)" }} />
                          </RadialBarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 text-right">
                        <p className="text-xl font-black text-foreground">اتساق العادات</p>
                        <p className="habits-number text-4xl font-black text-primary">{viewModel.context.habits.progressPercent}%</p>
                        <p className="text-sm leading-7 text-muted-foreground">المستوى اليومي الحالي مع قراءة سريعة لأيام الأسبوع الأخير.</p>
                      </div>
                    </div>
                  </div>

                  <div className="surface-subtle rounded-[calc(var(--radius)+0.8rem)] p-4 text-right">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-lg font-black text-foreground">الميزانية الشهرية</p>
                      <p className="habits-number text-3xl font-black text-foreground">
                        {Math.min(100, Math.round((viewModel.context.budget.spentThisMonth / Math.max(viewModel.context.budget.monthlyLimit || 1, 1)) * 100))}%
                      </p>
                    </div>
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={viewModel.budgetSeries}>
                          <defs>
                            <linearGradient id="insights-budget" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#c2fe4c" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="#c2fe4c" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                          <Tooltip content={<DashboardChartTooltip />} />
                          <Area type="monotone" dataKey="value" stroke="#c2fe4c" strokeWidth={3} fill="url(#insights-budget)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        ) : null}

        <div className="space-y-6">
          {preferences.visibleWidgets.recent ? (
            <motion.section {...SECTION_REVEAL}>
              <Card className="surface-shell">
                <CardContent className="space-y-5 p-6">
                  <SectionHeader
                    title="أكمل من حيث توقفت"
                    description="وصول سريع إلى آخر أماكن العمل داخل Planner Hub."
                    icon={AlarmClock}
                  />
                  <div className="space-y-3">
                    {viewModel.recentItems.length ? viewModel.recentItems.map((item) => (
                      <Link
                        key={item.path + item.visitedAt}
                        href={item.path}
                        className="block rounded-[calc(var(--radius)+0.65rem)] bg-white/[0.045] px-4 py-3 text-right transition-colors hover:bg-white/[0.07]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <ArrowUpLeft className="h-4.5 w-4.5 text-primary" />
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Intl.DateTimeFormat("ar", { hour: "numeric", minute: "numeric", day: "numeric", month: "short" }).format(new Date(item.visitedAt))}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )) : (
                      <div className="surface-subtle rounded-[calc(var(--radius)+0.65rem)] p-4 text-right text-sm text-muted-foreground">
                        لا يوجد سجل حديث بعد. سيظهر هنا آخر ما فتحته داخل الوحدات.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          ) : null}

          <motion.section {...SECTION_REVEAL}>
            <Card className="surface-shell">
              <CardContent className="space-y-5 p-6">
                <SectionHeader
                  title="تدفق النقد"
                  description="إشارة بصرية سريعة للميل العام خلال الأيام الأخيرة."
                  icon={Wallet}
                />
                <div className="surface-subtle rounded-[calc(var(--radius)+0.8rem)] p-4 text-right">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-lg font-black text-foreground">الرصيد المتاح</p>
                    <p className="cashflow-number text-3xl font-black text-primary">{viewModel.moduleCards.find((card) => card.key === "cashflow")?.metrics[0]?.value}</p>
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
              </CardContent>
            </Card>
          </motion.section>
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
                      : openQuickAction === "meal"
                        ? "تخطيط وجبة"
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

            {openQuickAction === "meal" ? (
              <motion.div key="meal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <Input value={mealDay} onChange={(event) => setMealDay(event.target.value)} type="date" className="h-12 text-right" />
                <p className="text-sm leading-6 text-muted-foreground">سنفتح لك اليوم المختار مباشرة داخل مخطط الوجبات لمتابعة التحرير من هناك.</p>
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

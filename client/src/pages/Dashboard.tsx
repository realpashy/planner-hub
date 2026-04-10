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
  CircleDollarSign,
  LayoutGrid,
  Loader2,
  Salad,
  Sparkles,
  Target,
  TriangleAlert,
} from "lucide-react";
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
} from "@/lib/dashboard";
import {
  getDashboardContextHash,
  loadCachedDashboardBrief,
  requestDashboardAssistant,
  saveCachedDashboardBrief,
} from "@/lib/ai/dashboard-assistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { loadHabitsState } from "@/modules/habits/utils/habits";
import { getPlannerData, savePlannerData } from "@/lib/storage";
import type { DashboardAssistantAction, DashboardAssistantResult } from "@shared/ai/dashboard-assistant";

type QuickActionKey = DashboardQuickAction["key"] | null;

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
    <div className="rtl-title-row items-start">
      <div className="space-y-2 flex-1">
        {kicker ? (
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {kicker}
          </div>
        ) : null}
        <div className="space-y-1">
          <h2 className="text-xl font-black text-foreground md:text-2xl">{title}</h2>
          <p className="text-sm leading-7 text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
      <div className="icon-chip h-12 w-12 rounded-[calc(var(--radius)+0.45rem)]">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

function ModuleCard({ card }: { card: DashboardModuleCard }) {
  const Icon = card.icon;
  return (
    <Link href={card.href} className="group block h-full outline-none">
      <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.995 }} className="h-full">
        <Card className="surface-shell relative h-full overflow-hidden rounded-[calc(var(--radius)+1rem)] border-border/70">
          <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b", card.accent)} />
          <CardHeader className="relative gap-5 text-right">
            <div className="rtl-title-row">
              <div className="space-y-2 flex-1">
                <div className="inline-flex w-fit rounded-full border border-border/70 bg-background/65 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                  {card.status}
                </div>
                <div>
                  <CardTitle className="text-xl">{card.title}</CardTitle>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{card.subtitle}</p>
                </div>
              </div>
              <div className="icon-chip h-12 w-12 rounded-[calc(var(--radius)+0.45rem)]">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {card.metrics.map((metric) => (
                <div key={metric.label} className="surface-subtle rounded-[calc(var(--radius)+0.45rem)] p-3 text-right">
                  <p className="text-xs font-semibold text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 text-lg font-black text-foreground">{metric.value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-[calc(var(--radius)+0.45rem)] border border-border/70 bg-background/55 px-4 py-3">
              <ArrowUpLeft className="h-4.5 w-4.5 text-primary transition-transform duration-200 group-hover:-translate-x-1 group-hover:-translate-y-1" />
              <p className="text-sm font-bold text-foreground">{card.cta}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

function TimelineItemCard({
  item,
  onQuickToggle,
}: {
  item: DashboardTimelineItem;
  onQuickToggle: (item: DashboardTimelineItem) => void;
}) {
  return (
    <Link href={item.href} className="block">
      <motion.div whileHover={{ y: -3 }} className="surface-shell rounded-[calc(var(--radius)+0.75rem)] border-border/70 p-4">
        <div className="grid items-center gap-4 md:grid-cols-[18%_1fr_auto]">
          <div className="flex items-center justify-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[calc(var(--radius)+0.4rem)] border border-primary/25 bg-background/70 text-xl shadow-[0_0_0_1px_rgba(149,223,30,0.12),0_0_18px_rgba(149,223,30,0.12)]">
              {item.icon}
            </div>
          </div>
          <div className="space-y-3 text-right">
            <div className="space-y-1">
              <p className="text-sm font-black leading-tight text-foreground">{item.title}</p>
              <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{item.timeLabel}</span>
                <span>{item.subtitle}</span>
              </div>
            </div>
            {item.actionable ? (
              <div className="flex justify-start">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-[calc(var(--radius)+0.35rem)] border-primary/25 bg-primary/[0.08] text-primary"
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
            <p className="text-xs font-semibold text-muted-foreground">{item.module === "planner" ? "المخطط" : item.module === "habits" ? "العادات" : item.module === "meal" ? "الوجبات" : item.module === "budget" ? "الميزانية" : "النقدي"}</p>
            <div
              className={cn(
                "rounded-full px-2 py-1 text-[10px] font-semibold",
                item.status === "attention"
                  ? "bg-amber-500/[0.15] text-amber-300"
                  : item.status === "done"
                    ? "bg-emerald-500/[0.15] text-emerald-300"
                    : "bg-sky-500/[0.15] text-sky-300",
              )}
            >
              {item.status === "attention" ? "يتطلب انتباهًا" : item.status === "done" ? "مكتمل" : "قادم اليوم"}
            </div>
          </div>
        </div>
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
  const dashboardContextHash = useMemo(
    () => getDashboardContextHash(viewModel.context),
    [viewModel.context],
  );

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

  const groupedTimeline = useMemo(() => ({
    morning: viewModel.timeline.filter((item) => item.bucket === "morning"),
    afternoon: viewModel.timeline.filter((item) => item.bucket === "afternoon"),
    evening: viewModel.timeline.filter((item) => item.bucket === "evening"),
  }), [viewModel.timeline]);

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
    <div className="mx-auto max-w-[1600px] space-y-6" dir="rtl">
      {preferences.visibleWidgets.hero ? (
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="surface-shell relative overflow-hidden rounded-[calc(var(--radius)+1.2rem)] border-primary/15">
            <div className="premium-header-glow premium-header-glow-primary" />
            <CardContent className="relative p-6 md:p-8">
              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-5 text-right">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1 text-xs font-semibold text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    {viewModel.dateLabel}
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
                      {viewModel.greeting}
                      {auth.user?.displayName ? `، ${auth.user.displayName}` : ""}
                    </h1>
                    <p className="max-w-3xl text-base leading-8 text-muted-foreground">
                      {dailyBrief?.summary || viewModel.summaryLine}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-start gap-3">
                    <Button
                      className="h-12 rounded-[calc(var(--radius)+0.55rem)] px-5 font-bold"
                      onClick={() => document.getElementById("dashboard-timeline")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    >
                      ابدأ يومي الآن
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 rounded-[calc(var(--radius)+0.55rem)] px-5 font-bold"
                      onClick={() => setOpenQuickAction("task")}
                    >
                      إضافة مهمة
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="surface-subtle rounded-[calc(var(--radius)+0.75rem)] p-4 text-right">
                    <p className="text-xs font-semibold text-muted-foreground">ملخص اليوم</p>
                    <p className="mt-2 text-xl font-black text-foreground">
                      {dailyBrief?.headline || "جاري تجهيز الملخص..."}
                    </p>
                    {assistantMutation.isPending && !dailyBrief ? (
                      <div className="mt-3 h-16 animate-pulse rounded-[calc(var(--radius)+0.35rem)] bg-muted/80" />
                    ) : (
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {dailyBrief?.bullets?.[0] || "نجمع الإشارات الأهم من يومك ووحداتك الآن."}
                      </p>
                    )}
                  </div>
                  <div className="surface-subtle rounded-[calc(var(--radius)+0.75rem)] p-4 text-right">
                    <p className="text-xs font-semibold text-muted-foreground">أفضل خطوة تالية</p>
                    <p className="mt-2 text-lg font-black text-foreground">
                      {dailyBrief?.bestNextAction.label || "مراجعة أولويات اليوم"}
                    </p>
                    <Button
                      variant="ghost"
                      className="mt-3 h-10 rounded-[calc(var(--radius)+0.35rem)] px-3 font-semibold text-primary"
                      onClick={() => setLocation(dailyBrief?.bestNextAction.href || "/weekly-planner")}
                    >
                      افتح الآن
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          {preferences.visibleWidgets.focus ? (
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
              <Card className="surface-shell rounded-[calc(var(--radius)+1rem)] border-border/70">
                <CardContent className="space-y-5 p-6">
                  <SectionHeader
                    kicker="ما الذي يحتاج انتباهك اليوم"
                    title="تركيز اليوم"
                    description="قراءة سريعة لما يجب أن يتحرك الآن بدون إغراقك بالتفاصيل."
                    icon={Target}
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="surface-subtle rounded-[calc(var(--radius)+0.55rem)] p-4 text-right">
                      <p className="text-sm font-black text-foreground">أولويات اليوم</p>
                      <div className="mt-3 space-y-2">
                        {viewModel.topPriorities.length ? viewModel.topPriorities.map((item) => (
                          <div key={item} className="rounded-[calc(var(--radius)+0.35rem)] border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground">{item}</div>
                        )) : <p className="text-sm text-muted-foreground">لا توجد أولويات ثقيلة لليوم.</p>}
                      </div>
                    </div>
                    <div className="surface-subtle rounded-[calc(var(--radius)+0.55rem)] p-4 text-right">
                      <p className="text-sm font-black text-foreground">نقاط تحتاج متابعة</p>
                      <div className="mt-3 space-y-3 text-sm">
                        <div className="flex items-start justify-between gap-3 rounded-[calc(var(--radius)+0.35rem)] border border-border/60 bg-background/60 px-3 py-2">
                          <span className="font-bold text-foreground">{viewModel.overdueCount}</span>
                          <span className="text-muted-foreground">مهام متأخرة</span>
                        </div>
                        <div className="flex items-start justify-between gap-3 rounded-[calc(var(--radius)+0.35rem)] border border-border/60 bg-background/60 px-3 py-2">
                          <span className="font-bold text-foreground">{viewModel.atRiskHabits.length}</span>
                          <span className="text-muted-foreground">عادات مهددة اليوم</span>
                        </div>
                        {viewModel.mealPrepLabel ? <p className="rounded-[calc(var(--radius)+0.35rem)] border border-border/60 bg-background/60 px-3 py-2 text-muted-foreground">{viewModel.mealPrepLabel}</p> : null}
                        {viewModel.financeAlert ? <p className="rounded-[calc(var(--radius)+0.35rem)] border border-amber-500/25 bg-amber-500/[0.07] px-3 py-2 text-amber-300">{viewModel.financeAlert}</p> : null}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          ) : null}

          {preferences.visibleWidgets.timeline ? (
            <motion.section id="dashboard-timeline" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <Card className="surface-shell rounded-[calc(var(--radius)+1rem)] border-border/70">
                <CardContent className="space-y-5 p-6">
                  <SectionHeader
                    title="الجدول الموحد لليوم"
                    description="خط زمني واحد يجمع المهم من المهام والعادات والوجبات والتنبيهات المالية."
                    icon={CalendarClock}
                  />
                  {(["morning", "afternoon", "evening"] as const).map((bucket) => (
                    <div key={bucket} className="space-y-3">
                      <div className="inline-flex w-fit rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {bucket === "morning" ? "الصباح" : bucket === "afternoon" ? "بعد الظهر" : "المساء"}
                      </div>
                      <div className="space-y-3">
                        {groupedTimeline[bucket].length ? groupedTimeline[bucket].map((item) => (
                          <TimelineItemCard key={item.id} item={item} onQuickToggle={handleTimelineQuickToggle} />
                        )) : (
                          <div className="surface-subtle rounded-[calc(var(--radius)+0.55rem)] p-4 text-right text-sm text-muted-foreground">
                            لا توجد عناصر ظاهرة في هذا الجزء من اليوم.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.section>
          ) : null}

          {preferences.visibleWidgets.modules ? (
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <div className="space-y-4">
                <SectionHeader
                  title="نظرة على الوحدات"
                  description="بطاقات تفاعلية تعطيك لقطة مفيدة ثم تنقلك مباشرة إلى العمق."
                  icon={LayoutGrid}
                />
                <div className="grid gap-4 xl:grid-cols-2">
                  {viewModel.moduleCards.map((card) => (
                    <ModuleCard key={card.key} card={card} />
                  ))}
                </div>
              </div>
            </motion.section>
          ) : null}
        </div>
        <div className="space-y-6">
          {preferences.visibleWidgets.actions ? (
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
              <Card className="surface-shell rounded-[calc(var(--radius)+1rem)] border-border/70">
                <CardContent className="space-y-5 p-6">
                  <SectionHeader
                    title="إجراءات سريعة"
                    description="اختصارات واضحة تقلل الاحتكاك اليومي وتفتح التدفق من أول نقرة."
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
                          className="surface-subtle relative overflow-hidden rounded-[calc(var(--radius)+0.7rem)] border-border/70 p-4 text-right"
                          onClick={() => {
                            if (action.key === "ai") {
                              document.getElementById("dashboard-ai-widget")?.scrollIntoView({ behavior: "smooth", block: "start" });
                              return;
                            }
                            setOpenQuickAction(action.key);
                          }}
                        >
                          <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b", action.accent)} />
                          <div className="relative rtl-title-row">
                            <div className="space-y-1 flex-1">
                              <p className="text-sm font-black text-foreground">{action.label}</p>
                              <p className="text-xs leading-6 text-muted-foreground">{action.description}</p>
                            </div>
                            <div className="icon-chip h-11 w-11 rounded-[calc(var(--radius)+0.4rem)]">
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap justify-start gap-3">
                    <Button variant="outline" className="h-11 rounded-[calc(var(--radius)+0.45rem)] px-4 font-bold" onClick={() => setLocation("/weekly-planner?dashboardAction=reset")}>
                      إعادة ضبط الأسبوع
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          ) : null}

          {preferences.visibleWidgets.assistant ? (
            <motion.section id="dashboard-ai-widget" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="surface-shell rounded-[calc(var(--radius)+1rem)] border-primary/15">
                <CardContent className="space-y-5 p-6">
                  <SectionHeader
                    kicker="مساعد ذكي مختصر"
                    title="مساعد اليوم"
                    description="اقتراحات قصيرة ومفيدة من واقع يومك، بدون تشتيت أو دردشة طويلة."
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
                        className="h-11 justify-between rounded-[calc(var(--radius)+0.45rem)] px-4 font-bold"
                        onClick={() => assistantMutation.mutate(action)}
                        disabled={assistantMutation.isPending}
                      >
                        {assistantMutation.isPending && assistantMutation.variables === action ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                        {label}
                      </Button>
                    ))}
                  </div>
                  <div className="surface-subtle rounded-[calc(var(--radius)+0.65rem)] border-primary/15 p-4 text-right">
                    <p className="text-sm font-black text-foreground">{assistantResult?.headline || dailyBrief?.headline || "ماذا يحتاج يومك الآن؟"}</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {assistantResult?.summary || dailyBrief?.summary || "يمكنك توليد قراءة سريعة لليوم، إعادة ترتيب الأولويات، أو تبسيط الخطة عند الشعور بالازدحام."}
                    </p>
                    <div className="mt-4 space-y-2">
                      {(assistantResult?.bullets || dailyBrief?.bullets || []).map((bullet) => (
                        <div key={bullet} className="flex items-start justify-between gap-3 rounded-[calc(var(--radius)+0.35rem)] border border-border/60 bg-background/55 px-3 py-2">
                          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <p className="flex-1 text-sm leading-6 text-foreground">{bullet}</p>
                        </div>
                      ))}
                    </div>
                    {(assistantResult?.bestNextAction || dailyBrief?.bestNextAction) ? (
                      <div className="mt-4 flex justify-start">
                        <Button
                          className="h-11 rounded-[calc(var(--radius)+0.45rem)] px-4 font-bold"
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

          {preferences.visibleWidgets.insights ? (
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
              <Card className="surface-shell rounded-[calc(var(--radius)+1rem)] border-border/70">
                <CardContent className="space-y-5 p-6">
                  <SectionHeader
                    title="التقدم والرؤى"
                    description="مؤشرات سريعة تبقيك واعيًا للإيقاع بدل الغرق في الرسوم الثقيلة."
                    icon={Target}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {viewModel.progressCards.map((card) => (
                      <div key={card.key} className="surface-subtle rounded-[calc(var(--radius)+0.55rem)] p-4 text-right">
                        <div className="flex items-start justify-between gap-3">
                          <p className={cn("text-lg font-black", card.tone)}>{card.value}</p>
                          <div className="text-right">
                            <p className="text-sm font-black text-foreground">{card.label}</p>
                            <p className="mt-1 text-xs leading-6 text-muted-foreground">{card.hint}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          ) : null}

          {preferences.visibleWidgets.recent ? (
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <Card className="surface-shell rounded-[calc(var(--radius)+1rem)] border-border/70">
                <CardContent className="space-y-5 p-6">
                  <SectionHeader
                    title="أكمل من حيث توقفت"
                    description="وصول سريع إلى آخر أماكن العمل داخل Planner Hub."
                    icon={AlarmClock}
                  />
                  <div className="space-y-3">
                    {viewModel.recentItems.length ? viewModel.recentItems.map((item) => (
                      <Link key={item.path + item.visitedAt} href={item.path} className="block rounded-[calc(var(--radius)+0.5rem)] border border-border/60 bg-background/60 px-4 py-3 text-right transition-colors hover:border-primary/20 hover:bg-muted/60">
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
                      <div className="surface-subtle rounded-[calc(var(--radius)+0.55rem)] p-4 text-right text-sm text-muted-foreground">
                        لم يبدأ سجل الاستخدام بعد. بمجرد تنقلك داخل الوحدات سيظهر هنا آخر ما عملت عليه.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          ) : null}
        </div>
      </div>

      <Dialog open={openQuickAction !== null} onOpenChange={(open) => !open && closeQuickAction()}>
        <DialogContent dir="rtl" className="surface-shell max-w-lg rounded-[calc(var(--radius)+1rem)] border-border/80 text-right">
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

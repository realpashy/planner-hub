import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  BrainCircuit,
  Home,
  LayoutGrid,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useHabitsTracker } from "@/modules/habits/hooks/useHabitsTracker";
import { AIScreen } from "@/modules/habits/screens/AIScreen";
import { HabitFormScreen } from "@/modules/habits/screens/HabitFormScreen";
import { HabitsDashboardScreen } from "@/modules/habits/screens/HabitsDashboardScreen";
import { HabitsListScreen } from "@/modules/habits/screens/HabitsListScreen";
import { InsightsScreen } from "@/modules/habits/screens/InsightsScreen";
import type { HabitDefinition, HabitFormValues } from "@/modules/habits/types";
import { hasShownReminder, markReminderShown } from "@/modules/habits/utils/habits";
import { useAppShell } from "@/components/layout/AppShell";

type HabitsTab = "dashboard" | "habits" | "insights" | "ai";

const TAB_ITEMS: Array<{
  key: HabitsTab;
  label: string;
  icon: React.ElementType;
}> = [
  { key: "dashboard", label: "الرئيسية", icon: LayoutGrid },
  { key: "habits", label: "العادات", icon: ListChecks },
  { key: "insights", label: "الرؤى", icon: BrainCircuit },
  { key: "ai", label: "المدرب الذكي", icon: Bot },
];

export default function HabitsTracker() {
  const { hasShell } = useAppShell();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState<HabitsTab>("dashboard");
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitDefinition | null>(null);
  const [highlightedHabitId, setHighlightedHabitId] = useState<string | null>(null);
  const {
    state,
    todayKey,
    currentDate,
    dashboard,
    reminders,
    insights,
    todayMood,
    saveHabit,
    deleteHabit,
    setHabitValue,
    toggleHabit,
    setMood,
  } = useHabitsTracker();
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTab]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextTab = params.get("tab") as HabitsTab | null;
    const highlighted = params.get("habit");
    if (nextTab && TAB_ITEMS.some((item) => item.key === nextTab)) {
      setActiveTab(nextTab);
    }
    if (highlighted) {
      setHighlightedHabitId(highlighted);
    }
  }, [location]);

  useEffect(() => {
    if (!highlightedHabitId) return;
    const timeout = window.setTimeout(() => setHighlightedHabitId(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [highlightedHabitId]);

  useEffect(() => {
    const dueReminders = reminders.filter(
      (item) => item.tone === "attention" && !hasShownReminder(item.habitId, todayKey),
    );
    if (!dueReminders.length) return;

    dueReminders.forEach((reminder) => {
      markReminderShown(reminder.habitId, todayKey);
      toast({
        title: `تذكير: ${reminder.title}`,
        description: reminder.description,
        duration: 5000,
        action: (
          <ToastAction
            altText="فتح العادة"
            onClick={() => {
              setActiveTab("habits");
              setHighlightedHabitId(reminder.habitId);
            }}
          >
            فتح العادة
          </ToastAction>
        ),
      });
    });
  }, [reminders, toast, todayKey]);

  const currentTabLabel = useMemo(
    () => TAB_ITEMS.find((item) => item.key === activeTab)?.label ?? "الرئيسية",
    [activeTab],
  );

  const openCreate = () => {
    setEditingHabit(null);
    setFormOpen(true);
  };

  const openEdit = (habit: HabitDefinition) => {
    setEditingHabit(habit);
    setFormOpen(true);
  };

  const openHabitFromAi = (habitName: string) => {
    const target = state.habits.find((habit) => habit.name === habitName);
    if (!target) return;
    setActiveTab("habits");
    setHighlightedHabitId(target.id);
  };

  const handleSaveHabit = (values: HabitFormValues, habit?: HabitDefinition) => {
    saveHabit(values, habit);
    toast({
      title: habit ? "تم تحديث العادة" : "تمت إضافة العادة",
      description: habit
        ? "التغييرات ظهرت مباشرة في لوحة اليوم."
        : "العادة الجديدة أصبحت جاهزة للاستخدام اليومي.",
      duration: 3000,
    });
  };

  const handleDeleteHabit = (habitId: string) => {
    deleteHabit(habitId);
    toast({
      title: "تم حذف العادة",
      description: "تمت إزالة العادة وسجلها من هذه الوحدة.",
      duration: 3000,
    });
  };

  const activeScreen = useMemo(() => {
    if (activeTab === "dashboard") {
      return (
        <HabitsDashboardScreen
          state={state}
          todayKey={todayKey}
          progressPercent={dashboard.progressPercent}
          completedToday={dashboard.completedToday}
          totalHabits={dashboard.totalHabits}
          pendingCount={dashboard.pendingCount}
          bestStreak={dashboard.bestStreak}
          reminders={reminders}
          todayMood={todayMood}
          onAddHabit={openCreate}
          onOpenHabits={() => setActiveTab("habits")}
          onEditHabit={openEdit}
          onToggleHabit={toggleHabit}
          onAdjustHabit={setHabitValue}
          onSetMood={setMood}
          highlightedHabitId={highlightedHabitId}
        />
      );
    }

    if (activeTab === "habits") {
      return (
        <HabitsListScreen
          state={state}
          todayKey={todayKey}
          highlightedHabitId={highlightedHabitId}
          onCreate={openCreate}
          onEdit={openEdit}
          onToggleHabit={toggleHabit}
          onAdjustHabit={setHabitValue}
        />
      );
    }

    if (activeTab === "insights") {
      return (
        <InsightsScreen
          state={state}
          averagePercent={insights.averagePercent}
          totalCheckIns={insights.totalCheckIns}
          bestDayLabel={insights.bestDay.label}
          bestDayPercent={insights.bestDay.percent}
          weeklyTrend={insights.weeklyTrend}
          monthlyTrend={insights.monthlyTrend}
          categoryBreakdown={insights.categoryBreakdown}
        />
      );
    }

    return <AIScreen state={state} onAddHabit={openCreate} onOpenHabit={openHabitFromAi} />;
  }, [
    activeTab,
    currentDate,
    dashboard.bestStreak,
    dashboard.completedToday,
    dashboard.pendingCount,
    dashboard.progressPercent,
    dashboard.totalHabits,
    insights.averagePercent,
    insights.bestDay.label,
    insights.bestDay.percent,
    insights.categoryBreakdown,
    insights.monthlyTrend,
    insights.totalCheckIns,
    insights.weeklyTrend,
    highlightedHabitId,
    reminders,
    openHabitFromAi,
    setHabitValue,
    setMood,
    state,
    todayKey,
    todayMood,
    toggleHabit,
  ]);

  return (
    <div className="app-shell min-h-screen" dir="rtl">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 text-right">
            <div className="icon-chip h-10 w-10 rounded-[calc(var(--radius)+0.4rem)] border-primary/20 bg-primary/[0.14] text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-start gap-2 text-xs font-semibold text-muted-foreground">
                {!hasShell ? (
                  <>
                    <Link href="/" className="inline-flex items-center gap-1 text-primary transition-colors hover:text-primary/80">
                      <Home className="h-3.5 w-3.5" />
                      الرئيسية
                    </Link>
                    <span className="text-muted-foreground/60">/</span>
                  </>
                ) : null}
                <span>{currentTabLabel}</span>
              </div>
              <p className="text-lg font-black tracking-tight text-foreground">متتبع العادات</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/">
              <button className="flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius)+0.35rem)] border border-border/70 bg-background/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="surface-shell rounded-[calc(var(--radius)+1rem)] border-primary/15 p-5 text-right"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1 text-[11px] font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                استخدام يومي سريع
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-black leading-tight text-foreground md:text-4xl">
                  عادات واضحة، إنجاز أسرع، واستمرارية بدون ضغط
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                  هذا الموديول مبني لروتين يومي سريع: افتح الشاشة، أنجز عاداتك، حدّد المزاج،
                  واغلق اليوم بإحساس واضح بدل التشتت أو اللوم.
                </p>
              </div>
            </div>

            <Button className="shrink-0" onClick={openCreate}>
              <Sparkles className="h-4 w-4" />
              إضافة عادة
            </Button>
          </div>
        </motion.section>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as HabitsTab)} dir="rtl">
          <TabsList className="grid w-full grid-cols-2 gap-1 rounded-[calc(var(--radius)+0.6rem)] p-1 md:grid-cols-4">
            {TAB_ITEMS.map(({ key, label, icon: Icon }) => (
              <TabsTrigger
                key={key}
                value={key}
                className="flex flex-row-reverse items-center justify-center gap-2 rounded-[calc(var(--radius)+0.25rem)] py-2.5 text-right"
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-5"
          >
            {activeScreen}
          </motion.div>
        </AnimatePresence>
      </div>

      <HabitFormScreen
        open={formOpen}
        habit={editingHabit}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
      />
    </div>
  );
}

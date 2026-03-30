import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, ArrowLeft, BarChart3, Home, ListChecks, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HabitsOverview } from "@/components/habits/HabitsOverview";
import { HabitsManage } from "@/components/habits/HabitsManage";
import { HabitsInsights } from "@/components/habits/HabitsInsights";
import { HabitsAI } from "@/components/habits/HabitsAI";
import { AddHabitSheet } from "@/components/habits/AddHabitSheet";
import { LogHabitSheet } from "@/components/habits/LogHabitSheet";
import {
  type Habit,
  type HabitLog,
  type HabitsData,
  type MoodLevel,
  generateId,
  getTodayKey,
  loadHabitsData,
  saveHabitsData,
} from "@/lib/habits";
import { pullCloudToLocal, pushLocalToCloud } from "@/lib/cloud-sync";

// ── Navigation ────────────────────────────────────────────────────────────────

type ScreenKey = "overview" | "manage" | "insights" | "ai";

interface NavItem {
  key: ScreenKey;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { key: "overview", label: "الرئيسية", icon: Home },
  { key: "manage", label: "عاداتي", icon: ListChecks },
  { key: "insights", label: "الإحصائيات", icon: BarChart3 },
  { key: "ai", label: "الذكاء", icon: Sparkles },
];

const SCREEN_TITLES: Record<ScreenKey, string> = {
  overview: "متتبع العادات",
  manage: "عاداتي",
  insights: "الإحصائيات",
  ai: "المدرب الذكي",
};

// ── Page component ────────────────────────────────────────────────────────────

export default function HabitsTracker() {
  const [data, setData] = useState<HabitsData>(() => loadHabitsData());
  const [screen, setScreen] = useState<ScreenKey>("overview");
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showLogHabit, setShowLogHabit] = useState(false);
  const [logTargetHabit, setLogTargetHabit] = useState<Habit | null>(null);
  const [logTargetExisting, setLogTargetExisting] = useState<HabitLog | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const currentTabLabel = NAV_ITEMS.find((item) => item.key === screen)?.label ?? SCREEN_TITLES[screen];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "auto" });

    let active = true;
    pullCloudToLocal()
      .then(() => {
        if (active) setData(loadHabitsData());
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [screen]);

  const updateData = useCallback((updater: (prev: HabitsData) => HabitsData) => {
    setData((prev) => {
      const next = { ...updater(prev), lastUpdated: new Date().toISOString() };
      saveHabitsData(next);
      pushLocalToCloud().catch(() => null);
      return next;
    });
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSaveHabit(habit: Habit) {
    updateData((prev) => {
      const exists = prev.habits.some((h) => h.id === habit.id);
      const habits = exists
        ? prev.habits.map((h) => (h.id === habit.id ? habit : h))
        : [...prev.habits, { ...habit, order: prev.habits.length }];
      return { ...prev, habits };
    });
    setEditingHabit(null);
  }

  function handleDeleteHabit(habitId: string) {
    updateData((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== habitId),
      logs: prev.logs.filter((l) => l.habitId !== habitId),
    }));
    setEditingHabit(null);
  }

  function handleArchiveHabit(habitId: string) {
    updateData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) =>
        h.id === habitId ? { ...h, isArchived: true } : h,
      ),
    }));
  }

  function handleUnarchiveHabit(habitId: string) {
    updateData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) =>
        h.id === habitId ? { ...h, isArchived: false } : h,
      ),
    }));
  }

  function handleToggleHabit(habitId: string, completed: boolean) {
    updateData((prev) => {
      const today = getTodayKey();
      const timestamp = new Date().toISOString();
      const existing = prev.logs.find((l) => l.habitId === habitId && l.date === today);

      if (existing) {
        return {
          ...prev,
          logs: prev.logs.map((l) =>
            l.habitId === habitId && l.date === today
              ? { ...l, completed, createdAt: timestamp }
              : l,
          ),
        };
      }

      const newLog: HabitLog = {
        id: generateId(),
        habitId,
        date: today,
        completed,
        createdAt: timestamp,
      };
      return { ...prev, logs: [newLog, ...prev.logs] };
    });
  }

  function handleLogHabit(habit: Habit) {
    const today = getTodayKey();
    const existing = data.logs.find((l) => l.habitId === habit.id && l.date === today) ?? null;
    setLogTargetHabit(habit);
    setLogTargetExisting(existing);
    setShowLogHabit(true);
  }

  // For count type: called from inline +/- buttons — opens the log sheet
  function handleInlineLog(habit: Habit) {
    handleLogHabit(habit);
  }

  function handleSaveLog(log: HabitLog) {
    updateData((prev) => {
      const exists = prev.logs.some((l) => l.habitId === log.habitId && l.date === log.date);
      if (exists) {
        return {
          ...prev,
          logs: prev.logs.map((l) =>
            l.habitId === log.habitId && l.date === log.date ? log : l,
          ),
        };
      }
      return { ...prev, logs: [log, ...prev.logs] };
    });
  }

  function handleMoodSelect(mood: MoodLevel) {
    updateData((prev) => {
      const today = getTodayKey();
      const timestamp = new Date().toISOString();
      const exists = prev.moodLogs.some((l) => l.date === today);
      if (exists) {
        return {
          ...prev,
          moodLogs: prev.moodLogs.map((l) =>
            l.date === today ? { ...l, mood, createdAt: timestamp } : l,
          ),
        };
      }
      return {
        ...prev,
        moodLogs: [{ id: generateId(), date: today, mood, createdAt: timestamp }, ...prev.moodLogs],
      };
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="app-shell flex min-h-screen flex-col" dir="rtl">
      {/* Top nav */}
      <nav className="sticky top-0 z-50 shrink-0 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex w-full items-center justify-between px-4 py-3 md:max-w-[60vw] md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/[0.15] text-violet-600 dark:text-violet-300">
              <Activity className="h-4 w-4" />
            </div>
            <div className="space-y-0.5 text-right">
              <div className="font-hebrew flex items-center justify-end gap-2 text-xs font-semibold text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setScreen("overview")}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-primary transition-colors hover:bg-primary/[0.08]"
                >
                  <Home className="h-3.5 w-3.5" />
                  الرئيسية
                </button>
                <span className="text-muted-foreground/70">/</span>
                <span>{currentTabLabel}</span>
              </div>
              <span className="font-hebrew block text-base font-black tracking-tight text-foreground">
                {SCREEN_TITLES[screen]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/">
              <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Screen content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-24">
        <div className="mx-auto w-full px-4 py-5 md:max-w-[60vw] md:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {screen === "overview" && (
                <HabitsOverview
                  data={data}
                  onToggleHabit={handleToggleHabit}
                  onLogHabit={handleLogHabit}
                  onAddHabit={() => setShowAddHabit(true)}
                  onMoodSelect={handleMoodSelect}
                />
              )}
              {screen === "manage" && (
                <HabitsManage
                  data={data}
                  onAddHabit={() => setShowAddHabit(true)}
                  onEditHabit={(habit) => setEditingHabit(habit)}
                  onDeleteHabit={handleDeleteHabit}
                  onArchiveHabit={handleArchiveHabit}
                  onUnarchiveHabit={handleUnarchiveHabit}
                />
              )}
              {screen === "insights" && <HabitsInsights data={data} />}
              {screen === "ai" && <HabitsAI />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="safe-area-bottom fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex w-full items-center justify-around px-2 py-2 md:max-w-[60vw] md:px-6">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = screen === key;
            return (
              <button
                key={key}
                onClick={() => setScreen(key)}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-[calc(var(--radius)+0.25rem)] px-3 py-2 transition-all duration-200",
                  isActive
                    ? "text-violet-600 dark:text-violet-300"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-[calc(var(--radius))] transition-all duration-200",
                    isActive ? "bg-violet-500/[0.15]" : "bg-transparent",
                  )}
                >
                  <Icon className={cn("h-5 w-5 transition-all", isActive && "scale-110")} />
                </div>
                <span className={cn("text-[10px] font-semibold leading-none", isActive && "font-bold")}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sheets */}
      <AddHabitSheet
        open={showAddHabit}
        onClose={() => setShowAddHabit(false)}
        onSave={handleSaveHabit}
      />
      <AddHabitSheet
        open={Boolean(editingHabit)}
        initialHabit={editingHabit}
        onClose={() => setEditingHabit(null)}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
      />
      <LogHabitSheet
        open={showLogHabit}
        habit={logTargetHabit}
        existingLog={logTargetExisting}
        onClose={() => { setShowLogHabit(false); setLogTargetHabit(null); setLogTargetExisting(null); }}
        onSave={handleSaveLog}
      />
    </div>
  );
}

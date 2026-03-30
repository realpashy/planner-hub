import { useMemo } from "react";
import { Plus, Minus, Clock, Sparkles, Lock, Flame } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  type Habit,
  type HabitsData,
  type MoodLevel,
  MOOD_EMOJIS,
  MOOD_LABELS,
  HABIT_CATEGORY_COLORS,
  getHabitsForToday,
  getCompletedTodayIds,
  getTodayCompletionRate,
  getTodayMood,
  getTodayLogValue,
  getHabitStreak,
} from "@/lib/habits";

interface HabitsOverviewProps {
  data: HabitsData;
  onToggleHabit: (habitId: string, completed: boolean) => void;
  onLogHabit: (habit: Habit) => void;
  onAddHabit: () => void;
  onMoodSelect: (mood: MoodLevel) => void;
}

// ── SVG Progress Ring ────────────────────────────────────────────────────────

const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ProgressRing({ rate }: { rate: number }) {
  const offset = RING_CIRCUMFERENCE - (rate / 100) * RING_CIRCUMFERENCE;

  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="block">
      {/* Track */}
      <circle
        cx="60"
        cy="60"
        r={RING_RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        className="text-violet-500/[0.15]"
      />
      {/* Progress */}
      <motion.circle
        cx="60"
        cy="60"
        r={RING_RADIUS}
        fill="none"
        strokeWidth="8"
        strokeLinecap="round"
        stroke="#8b5cf6"
        strokeDasharray={RING_CIRCUMFERENCE}
        initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        transform="rotate(-90 60 60)"
      />
    </svg>
  );
}

// ── Habit check button ────────────────────────────────────────────────────────

function HabitCheckButton({ completed, onToggle }: { completed: boolean; onToggle: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.82 }}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200",
        completed
          ? "border-violet-500 bg-violet-500 text-white"
          : "border-border/60 bg-muted/40 text-transparent hover:border-violet-400/60",
      )}
    >
      <AnimatePresence mode="wait">
        {completed ? (
          <motion.svg
            key="check"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
          >
            <motion.path
              d="M3 9 L7.5 13.5 L15 5"
              fill="none"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
          </motion.svg>
        ) : (
          <motion.div key="empty" className="h-4 w-4" />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ── Habit card ────────────────────────────────────────────────────────────────

interface HabitCardProps {
  habit: Habit;
  completed: boolean;
  logValue: number;
  streak: number;
  index: number;
  onToggle: () => void;
  onLog: () => void;
}

function HabitCard({ habit, completed, logValue, streak, index, onToggle, onLog }: HabitCardProps) {
  const catColor = HABIT_CATEGORY_COLORS[habit.category];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: completed ? 0.65 : 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <div
        className={cn(
          "surface-shell flex items-center gap-3 overflow-hidden rounded-[calc(var(--radius)+0.625rem)] p-3.5",
          completed && "bg-muted/50",
        )}
      >
        {/* Color bar */}
        <div className="h-10 w-1 shrink-0 rounded-full" style={{ backgroundColor: catColor }} />

        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[calc(var(--radius)+0.25rem)] bg-muted/60 text-xl">
          {habit.icon ?? "⭐"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 text-right">
          <p
            className={cn(
              "truncate font-bold transition-all duration-300",
              completed ? "text-muted-foreground line-through decoration-muted-foreground/60" : "text-foreground",
            )}
          >
            {habit.name}
          </p>
          <div className="mt-0.5 flex items-center justify-end gap-2">
            {/* Count / duration progress */}
            {(habit.type === "count" || habit.type === "duration") && habit.targetValue ? (
              <span className="text-xs text-muted-foreground">
                <span className="habits-number">{logValue}</span>
                {" / "}
                <span className="habits-number">{habit.targetValue}</span>
                {habit.targetUnit ? ` ${habit.targetUnit}` : ""}
              </span>
            ) : null}
            {/* Streak badge */}
            {streak >= 3 && (
              <span className="flex items-center gap-0.5 rounded-full bg-orange-500/[0.12] px-1.5 py-0.5 text-[10px] font-black text-orange-500">
                <Flame className="h-2.5 w-2.5" />
                {streak}
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        {habit.type === "check" ? (
          <HabitCheckButton completed={completed} onToggle={onToggle} />
        ) : habit.type === "duration" ? (
          <motion.button
            type="button"
            onClick={onLog}
            whileTap={{ scale: 0.88 }}
            className={cn(
              "flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-all",
              completed
                ? "border-violet-500/40 bg-violet-500/[0.12] text-violet-600 dark:text-violet-300"
                : "border-border/60 bg-muted/40 text-foreground hover:border-violet-400/60",
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            سجّل
          </motion.button>
        ) : (
          // Count type — inline stepper
          <div className="flex items-center gap-1">
            <motion.button
              type="button"
              whileTap={{ scale: 0.82 }}
              onClick={() => {
                const next = Math.max(0, logValue - 1);
                onLog();
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/50 text-muted-foreground transition-colors hover:bg-muted"
            >
              <Minus className="h-3 w-3" />
            </motion.button>
            <span className="habits-number min-w-[1.75rem] text-center text-sm font-black tabular-nums text-foreground">
              {logValue}
            </span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.82 }}
              onClick={() => {
                onLog();
              }}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                completed
                  ? "border-violet-500/40 bg-violet-500/[0.12] text-violet-500"
                  : "border-violet-500/30 bg-violet-500/[0.08] text-violet-600 dark:text-violet-400 hover:bg-violet-500/[0.15]",
              )}
            >
              <Plus className="h-3 w-3" />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function HabitsOverview({ data, onToggleHabit, onLogHabit, onAddHabit, onMoodSelect }: HabitsOverviewProps) {
  const todayHabits = useMemo(() => getHabitsForToday(data), [data]);
  const completedIds = useMemo(() => getCompletedTodayIds(data), [data]);
  const completionRate = useMemo(() => getTodayCompletionRate(data), [data]);
  const todayMood = useMemo(() => getTodayMood(data), [data]);

  const today = new Date().toLocaleDateString("ar", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const completedCount = todayHabits.filter((h) => completedIds.has(h.id)).length;

  return (
    <div className="space-y-4">
      {/* Greeting + date */}
      <div className="text-right">
        <p className="text-xs font-semibold text-muted-foreground">{today}</p>
        <h1 className="text-2xl font-black tracking-tight text-foreground">مرحباً، يوم جديد! 🌅</h1>
      </div>

      {/* Mood selector + Ring row */}
      <div
        className={cn(
          "surface-shell flex items-center gap-4 rounded-[calc(var(--radius)+1rem)] p-4",
          "bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.06),transparent_50%)]",
          "dark:bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.14),transparent_50%)]",
        )}
      >
        {/* Progress ring */}
        <div className="relative shrink-0">
          <ProgressRing rate={completionRate} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="habits-number text-2xl font-black leading-none text-violet-600 dark:text-violet-300">
              {completionRate}%
            </span>
            <span className="mt-0.5 text-[9px] font-bold text-muted-foreground">إنجاز</span>
          </div>
        </div>

        {/* Right side: mood + stat */}
        <div className="flex-1 min-w-0 text-right">
          <p className="mb-2 text-xs font-bold text-muted-foreground">كيف حالك اليوم؟</p>
          {/* Mood row */}
          <div className="flex items-center justify-end gap-1.5">
            {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => {
              const isActive = todayMood === level;
              return (
                <motion.button
                  key={level}
                  type="button"
                  onClick={() => onMoodSelect(level)}
                  whileTap={{ scale: 0.78 }}
                  animate={{ scale: isActive ? 1.2 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  title={MOOD_LABELS[level]}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-lg transition-all",
                    isActive
                      ? "ring-2 ring-violet-500/50 bg-violet-500/[0.12] shadow-sm"
                      : "bg-muted/50 hover:bg-muted/80",
                  )}
                >
                  {MOOD_EMOJIS[level]}
                </motion.button>
              );
            })}
          </div>

          {/* Stat bar */}
          <p className="mt-2.5 text-xs font-semibold text-muted-foreground">
            <span className="habits-number font-black text-foreground">{completedCount}</span>
            {" / "}
            <span className="habits-number">{todayHabits.length}</span>
            {" عادة اليوم"}
          </p>
        </div>
      </div>

      {/* Today's habits */}
      {todayHabits.length === 0 ? (
        <div className="surface-subtle flex flex-col items-center gap-3 rounded-[calc(var(--radius)+0.625rem)] py-10 text-center">
          <span className="text-4xl">🌱</span>
          <div>
            <p className="font-bold text-foreground">لا توجد عادات اليوم</p>
            <p className="mt-0.5 text-sm text-muted-foreground">ابدأ بإضافة عاداتك اليومية</p>
          </div>
          <button
            type="button"
            onClick={onAddHabit}
            className="mt-1 rounded-full border border-violet-500/30 bg-violet-500/[0.1] px-4 py-2 text-sm font-bold text-violet-700 dark:text-violet-300 transition-all hover:bg-violet-500/[0.15]"
          >
            + إضافة عادة
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {todayHabits.map((habit, index) => {
            const completed = completedIds.has(habit.id);
            const logValue = getTodayLogValue(habit.id, data);
            const streak = getHabitStreak(habit.id, data);

            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                completed={completed}
                logValue={logValue}
                streak={streak}
                index={index}
                onToggle={() => onToggleHabit(habit.id, !completed)}
                onLog={() => onLogHabit(habit)}
              />
            );
          })}
        </div>
      )}

      {/* AI teaser card */}
      <div
        className={cn(
          "surface-shell relative overflow-hidden rounded-[calc(var(--radius)+0.75rem)] p-4",
          "bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.12),transparent_60%)]",
          "dark:bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_60%)]",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0 text-right">
            <div className="mb-1 flex items-center justify-end gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-300">
                ميزة مميزة
              </span>
              <Lock className="h-2.5 w-2.5 text-violet-500" />
            </div>
            <p className="font-black text-foreground">مدرب ذكي بالذكاء الاصطناعي</p>
            <p className="mt-0.5 text-xs text-muted-foreground">تحليلات شخصية وتوصيات يومية — قريباً</p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[calc(var(--radius)+0.5rem)] border border-violet-500/20 bg-violet-500/[0.12]">
            <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  type HabitsData,
  HABIT_CATEGORY_LABELS,
  HABIT_CATEGORY_ICONS,
  MOOD_EMOJIS,
  getWeekCompletion,
  getMonthHeatmapData,
  getMoodCorrelation,
  getBestStreakHabit,
  getHabitStreak,
  getLongestStreak,
} from "@/lib/habits";

type Period = "week" | "month" | "year";

interface HabitsInsightsProps {
  data: HabitsData;
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-popover px-3 py-2 text-right shadow-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="habits-number text-sm font-black text-violet-600 dark:text-violet-300">
        {payload[0]?.value ?? 0}%
      </p>
    </div>
  );
}

// ── Heatmap ───────────────────────────────────────────────────────────────────

function MonthHeatmap({ data, monthKey }: { data: HabitsData; monthKey?: string }) {
  const cells = useMemo(() => getMonthHeatmapData(data, undefined, monthKey), [data, monthKey]);
  const today = new Date().toISOString().split("T")[0];

  // Determine padding before first cell
  const firstDate = cells[0]?.date;
  const firstDayOfWeek = firstDate ? new Date(`${firstDate}T12:00:00`).getDay() : 0;
  const paddingCells = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const DAY_LABELS = ["أح", "إث", "ثل", "أر", "خم", "جم", "سب"];

  function cellColor(rate: number) {
    if (rate === 0) return "bg-muted/50";
    if (rate < 25) return "bg-violet-500/[0.15]";
    if (rate < 50) return "bg-violet-500/[0.30]";
    if (rate < 75) return "bg-violet-500/[0.50]";
    return "bg-violet-500/[0.80]";
  }

  return (
    <div className="space-y-2">
      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[9px] font-bold text-muted-foreground/70">
            {d}
          </div>
        ))}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {paddingCells.map((i) => (
          <div key={`pad-${i}`} className="habits-heatmap-cell" />
        ))}
        {cells.map((cell) => (
          <div
            key={cell.date}
            title={`${cell.date}: ${cell.rate}%`}
            className={cn(
              "habits-heatmap-cell rounded-[3px] transition-all",
              cellColor(cell.rate),
              cell.date === today && "ring-1 ring-violet-500/60 ring-offset-1 ring-offset-background",
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ── Per-habit mini cards ──────────────────────────────────────────────────────

function HabitInsightList({ data }: { data: HabitsData }) {
  const activeHabits = data.habits.filter((h) => !h.isArchived);

  if (activeHabits.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {activeHabits.slice(0, 6).map((habit) => {
        const streak = getHabitStreak(habit.id, data);
        const longest = getLongestStreak(habit.id, data);
        const completedLogs = data.logs.filter((l) => l.habitId === habit.id && l.completed).length;
        const totalLogs = data.logs.filter((l) => l.habitId === habit.id).length;
        const rate = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0;

        return (
          <div key={habit.id} className="surface-subtle flex items-center gap-3 rounded-[calc(var(--radius)+0.375rem)] p-3.5">
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[calc(var(--radius)+0.125rem)] bg-muted/60 text-xl">
              {habit.icon ?? HABIT_CATEGORY_ICONS[habit.category]}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-right">
              <p className="truncate font-bold text-sm text-foreground">{habit.name}</p>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                <motion.div
                  className="h-full rounded-full bg-violet-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${rate}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                <span className="habits-number font-black text-foreground">{rate}%</span> إتمام
              </p>
            </div>

            {/* Streak */}
            <div className="shrink-0 text-right">
              <p className="habits-number text-lg font-black leading-none text-orange-500">{streak}</p>
              <p className="text-[9px] text-muted-foreground">حالي</p>
              <p className="habits-number mt-0.5 text-xs font-bold text-muted-foreground">{longest}</p>
              <p className="text-[9px] text-muted-foreground">أطول</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function HabitsInsights({ data }: HabitsInsightsProps) {
  const [period, setPeriod] = useState<Period>("week");

  const weekData = useMemo(() => getWeekCompletion(data, 0), [data]);
  const moodData = useMemo(() => getMoodCorrelation(data, 30), [data]);
  const bestHabit = useMemo(() => getBestStreakHabit(data), [data]);

  const PERIODS: { key: Period; label: string }[] = [
    { key: "week", label: "الأسبوع" },
    { key: "month", label: "الشهر" },
    { key: "year", label: "السنة" },
  ];

  return (
    <div className="space-y-5">
      {/* Period toggle */}
      <div className="flex justify-end">
        <div className="flex gap-1 rounded-full border border-border/60 bg-muted/60 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200",
                period === p.key
                  ? "bg-card text-violet-700 dark:text-violet-300 shadow-sm border border-violet-500/25"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Completion chart */}
      <div className="surface-shell rounded-[calc(var(--radius)+0.75rem)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold text-muted-foreground">نسبة الإنجاز اليومي</p>
          <p className="text-sm font-black text-violet-600 dark:text-violet-300">
            الأسبوع الحالي
          </p>
        </div>
        <div dir="ltr" className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weekData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#violetGrad)"
                dot={{ fill: "#8b5cf6", r: 3, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Month heatmap */}
      <div className="surface-shell rounded-[calc(var(--radius)+0.75rem)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-sm bg-violet-500/[0.80]" /> أكثر
            <span className="h-2.5 w-2.5 rounded-sm bg-violet-500/[0.15]" /> أقل
            <span className="h-2.5 w-2.5 rounded-sm bg-muted/50" /> لا يوجد
          </div>
          <p className="text-sm font-black text-violet-600 dark:text-violet-300">الخريطة الحرارية</p>
        </div>
        <MonthHeatmap data={data} />
      </div>

      {/* Best habit card */}
      {bestHabit && (
        <div
          className={cn(
            "surface-shell rounded-[calc(var(--radius)+0.75rem)] p-4",
            "bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.08),transparent_50%)]",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0 text-right">
              <p className="text-xs font-bold text-muted-foreground">أفضل عادة</p>
              <p className="mt-0.5 font-black text-foreground">{bestHabit.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                <span className="habits-number font-black text-orange-500">{bestHabit.streak}</span> يوم متتالي
                {" · "}
                <span className="habits-number font-black text-violet-600 dark:text-violet-300">{bestHabit.completionRate}%</span> إتمام
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[calc(var(--radius)+0.5rem)] bg-orange-500/[0.12] text-3xl">
              {bestHabit.icon ?? HABIT_CATEGORY_ICONS[bestHabit.category]}
            </div>
          </div>
        </div>
      )}

      {/* Mood correlation chart */}
      {moodData.length >= 3 && (
        <div className="surface-shell rounded-[calc(var(--radius)+0.75rem)] p-4">
          <div className="mb-3 text-right">
            <p className="text-sm font-black text-foreground">المزاج والإنجاز</p>
            <p className="text-xs text-muted-foreground">العلاقة بين مزاجك ونسبة إتمام عاداتك</p>
          </div>
          <div dir="ltr" className="h-[130px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" hide />
                <YAxis yAxisId="mood" domain={[0, 5]} hide />
                <YAxis yAxisId="rate" domain={[0, 100]} hide />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const mood = payload.find((p) => p.dataKey === "mood")?.value as number | undefined;
                    const rate = payload.find((p) => p.dataKey === "rate")?.value as number | undefined;
                    return (
                      <div className="rounded-lg border border-border/60 bg-popover px-3 py-2 text-right shadow-lg space-y-1">
                        {mood !== undefined && (
                          <p className="text-xs font-semibold">{MOOD_EMOJIS[mood as 1]} {mood}/5</p>
                        )}
                        {rate !== undefined && (
                          <p className="habits-number text-xs font-bold text-violet-600 dark:text-violet-300">{rate}%</p>
                        )}
                      </div>
                    );
                  }}
                />
                <Line yAxisId="mood" type="monotone" dataKey="mood" stroke="#f97316" strokeWidth={1.5} dot={false} />
                <Line yAxisId="rate" type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-end gap-4 text-[10px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-0.5 w-4 rounded-full bg-violet-500 inline-block" /> إنجاز %</span>
            <span className="flex items-center gap-1"><span className="h-0.5 w-4 rounded-full bg-orange-500 inline-block" /> مزاج</span>
          </div>
        </div>
      )}

      {/* Per-habit breakdown */}
      <div>
        <p className="mb-3 text-right text-sm font-black text-foreground">تفاصيل العادات</p>
        <HabitInsightList data={data} />
      </div>
    </div>
  );
}

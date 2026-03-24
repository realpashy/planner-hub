// ─────────────────────────────────────────────────────────────────────────────
// CashflowOverview — Main dashboard screen
// Hebrew-first. Mobile-optimised. Follows Planner Hub design system.
// Shows: balance, month metrics, period toggle, quick actions, upcoming preview,
// cashflow chart, income-vs-expense chart.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type CashflowData,
  formatCashflowAmount,
  formatHebrewDateShort,
  getDaysUntil,
  getAvailableBalance,
  getDailyTargetRequired,
  getMonthStats,
  getWeekStats,
  getTodayStats,
  getCurrentMonthKey,
  getLast7DaysChartData,
  getLast6MonthsChartData,
} from "@/lib/cashflow";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Clock,
  Plus,
  RefreshCw,
  Target,
  TrendingUp,
  Wallet,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";

type PeriodKey = "today" | "week" | "month";

const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: "היום",
  week: "השבוע",
  month: "החודש",
};

interface QuickAction {
  label: string;
  icon: React.ElementType;
  colorClass: string;
  onClick: () => void;
}

interface CashflowOverviewProps {
  data: CashflowData;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddUpcoming: () => void;
  onUpdateBalance: () => void;
  onViewUpcoming: () => void;
}

// ── Custom tooltip for charts ─────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/60 bg-popover/95 backdrop-blur-md px-3 py-2 shadow-lg text-right">
      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm font-bold" style={{ color: entry.color }}>
          ₪{entry.value.toLocaleString("he-IL")}
        </p>
      ))}
    </div>
  );
}

export function CashflowOverview({
  data,
  onAddIncome,
  onAddExpense,
  onAddUpcoming,
  onUpdateBalance,
  onViewUpcoming,
}: CashflowOverviewProps) {
  const [period, setPeriod] = useState<PeriodKey>("month");

  const { stats, balance, dailyTarget, chartData7, chartData6, pendingPayments } = useMemo(() => {
    const stats =
      period === "today"
        ? getTodayStats(data.transactions)
        : period === "week"
          ? getWeekStats(data.transactions)
          : getMonthStats(data.transactions, getCurrentMonthKey());

    const balance = getAvailableBalance(data);
    const dailyTarget = getDailyTargetRequired(data);
    const chartData7 = getLast7DaysChartData(data.transactions);
    const chartData6 = getLast6MonthsChartData(data.transactions);
    const now = new Date().toISOString().split("T")[0];
    const pendingPayments = data.upcomingPayments
      .filter((p) => p.status === "pending" && p.dueDate >= now)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 3);

    return { stats, balance, dailyTarget, chartData7, chartData6, pendingPayments };
  }, [data, period]);

  const isLowBalance = data.settings.cashflowWarningThreshold
    ? balance < data.settings.cashflowWarningThreshold
    : false;

  const quickActions: QuickAction[] = [
    { label: "הוסף הכנסה", icon: ArrowUpRight, colorClass: "text-emerald-600 dark:text-emerald-300 bg-emerald-500/[0.1] border-emerald-500/25 hover:bg-emerald-500/20", onClick: onAddIncome },
    { label: "הוסף הוצאה", icon: ArrowDownLeft, colorClass: "text-rose-600 dark:text-rose-300 bg-rose-500/[0.1] border-rose-500/25 hover:bg-rose-500/20", onClick: onAddExpense },
    { label: "תשלום עתידי", icon: CalendarClock, colorClass: "text-amber-600 dark:text-amber-300 bg-amber-500/[0.1] border-amber-500/25 hover:bg-amber-500/20", onClick: onAddUpcoming },
    { label: "עדכן יתרה", icon: RefreshCw, colorClass: "text-sky-600 dark:text-sky-300 bg-sky-500/[0.1] border-sky-500/25 hover:bg-sky-500/20", onClick: onUpdateBalance },
  ];

  return (
    <div className="space-y-5 pb-4">

      {/* ── Balance card — hero ────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Card className={cn(
          "surface-shell relative overflow-hidden rounded-[calc(var(--radius)+1rem)]",
          "border-border/70",
        )}>
          {/* Background glow */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.07),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.16),transparent_55%)]" />

          <CardContent className="relative p-5">
            <div className="rtl-title-row items-start">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-muted-foreground">יתרה זמינה עכשיו</p>
                  {isLowBalance && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/[0.1] px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-300 border border-rose-500/20">
                      <AlertCircle className="h-2.5 w-2.5" />
                      נמוכה
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "text-4xl font-black leading-none tabular-nums",
                    isLowBalance
                      ? "text-rose-600 dark:text-rose-300"
                      : "text-foreground",
                  )}
                  style={{ direction: "ltr", unicodeBidi: "bidi-override" }}
                >
                  {formatCashflowAmount(balance, data.settings.currency)}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-1">
                  {data.settings.bankBalance !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      בנק: {formatCashflowAmount(data.settings.bankBalance, data.settings.currency)}
                    </span>
                  )}
                  {data.settings.cashInRegister !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      קופה: {formatCashflowAmount(data.settings.cashInRegister, data.settings.currency)}
                    </span>
                  )}
                </div>
              </div>
              <div className="icon-chip h-12 w-12 shrink-0 rounded-[calc(var(--radius)+0.5rem)] border-sky-500/20 bg-sky-500/[0.12] text-sky-600 dark:text-sky-300">
                <Wallet className="h-5 w-5" />
              </div>
            </div>

            {/* Daily target pill */}
            {dailyTarget > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-[calc(var(--radius)+0.25rem)] border border-amber-500/20 bg-amber-500/[0.07] dark:bg-amber-500/[0.1] px-3 py-2">
                <Target className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-300" />
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  יעד יומי נדרש: {formatCashflowAmount(dailyTarget, data.settings.currency)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Period toggle ─────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 rounded-[calc(var(--radius)+0.375rem)] border border-border/50 bg-muted/40 p-1">
        {(["today", "week", "month"] as PeriodKey[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "flex-1 rounded-[calc(var(--radius)+0.125rem)] py-2 text-sm font-semibold transition-all duration-200",
              period === p
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* ── Month/period metric cards ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={period}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-3 gap-2.5"
        >
          {[
            {
              label: "הכנסות",
              value: stats.income,
              color: "text-emerald-600 dark:text-emerald-300",
              bg: "bg-emerald-500/[0.07] dark:bg-emerald-500/[0.1]",
              icon: ArrowUpRight,
              iconColor: "text-emerald-600 dark:text-emerald-300",
            },
            {
              label: "הוצאות",
              value: stats.expenses,
              color: "text-rose-600 dark:text-rose-300",
              bg: "bg-rose-500/[0.07] dark:bg-rose-500/[0.1]",
              icon: ArrowDownLeft,
              iconColor: "text-rose-600 dark:text-rose-300",
            },
            {
              label: "נטו",
              value: stats.net,
              color: stats.net >= 0 ? "text-sky-600 dark:text-sky-300" : "text-rose-600 dark:text-rose-300",
              bg: stats.net >= 0 ? "bg-sky-500/[0.07] dark:bg-sky-500/[0.1]" : "bg-rose-500/[0.07] dark:bg-rose-500/[0.1]",
              icon: TrendingUp,
              iconColor: stats.net >= 0 ? "text-sky-600 dark:text-sky-300" : "text-rose-600 dark:text-rose-300",
            },
          ].map(({ label, value, color, bg, icon: Icon, iconColor }) => (
            <div key={label} className={cn("surface-shell rounded-[calc(var(--radius)+0.625rem)] p-3.5 text-right", bg)}>
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
                  <p
                    className={cn("mt-1 text-base font-black leading-tight tabular-nums", color)}
                    style={{ direction: "ltr", unicodeBidi: "bidi-override", fontSize: "clamp(0.75rem,3.5vw,1rem)" }}
                  >
                    {formatCashflowAmount(Math.abs(value), data.settings.currency)}
                  </p>
                </div>
                <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", iconColor)} />
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5">
        {quickActions.map(({ label, icon: Icon, colorClass, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-[calc(var(--radius)+0.5rem)] border px-4 py-3.5 text-right text-sm font-semibold transition-all duration-150 active:scale-[0.98]",
              colorClass,
            )}
          >
            <Plus className="h-4 w-4 shrink-0 opacity-70" />
            <span className="flex-1">{label}</span>
            <Icon className="h-4 w-4 shrink-0" />
          </button>
        ))}
      </div>

      {/* ── Upcoming payments preview ─────────────────────────────────────── */}
      {pendingPayments.length > 0 && (
        <Card className="surface-shell rounded-[calc(var(--radius)+0.85rem)] border-border/70">
          <CardHeader className="flex-row items-center justify-between pb-3 pt-4 px-4 text-right">
            <CardTitle className="text-sm font-bold">תשלומים קרובים</CardTitle>
            <button
              onClick={onViewUpcoming}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              הכל
              <ChevronLeft className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {pendingPayments.map((p) => {
              const daysUntil = getDaysUntil(p.dueDate);
              const isUrgent = daysUntil <= 3;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center gap-3 rounded-[calc(var(--radius)+0.25rem)] border px-3 py-2.5",
                    isUrgent
                      ? "border-rose-500/25 bg-rose-500/[0.05] dark:bg-rose-500/[0.08]"
                      : "border-border/40 bg-muted/30",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black",
                      isUrgent
                        ? "bg-rose-500/[0.15] text-rose-700 dark:text-rose-300"
                        : "bg-amber-500/[0.12] text-amber-700 dark:text-amber-300",
                    )}
                  >
                    {daysUntil === 0 ? "היום" : daysUntil < 0 ? `+${Math.abs(daysUntil)}` : daysUntil}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-sm font-semibold leading-tight truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{formatHebrewDateShort(p.dueDate)}</p>
                  </div>
                  <p className="text-sm font-black tabular-nums shrink-0" style={{ direction: "ltr" }}>
                    {formatCashflowAmount(p.amount, data.settings.currency)}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Cashflow chart (7 days) ───────────────────────────────────────── */}
      <Card className="surface-shell rounded-[calc(var(--radius)+0.85rem)] border-border/70">
        <CardHeader className="pb-2 pt-4 px-4 text-right">
          <div className="rtl-title-row">
            <div>
              <CardTitle className="text-sm font-bold">תזרים 7 ימים אחרונים</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">הכנסות מול הוצאות יומיות</p>
            </div>
            <div className="icon-chip h-9 w-9 shrink-0 rounded-[calc(var(--radius)+0.375rem)] border-sky-500/20 bg-sky-500/[0.1] text-sky-600 dark:text-sky-300">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData7} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "rgba(128,128,128,0.7)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "rgba(128,128,128,0.6)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" name="הכנסות" />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#expenseGrad)" name="הוצאות" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-5 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-3 rounded-full bg-emerald-500 opacity-70" />
              הכנסות
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-3 rounded-full bg-rose-500 opacity-70" />
              הוצאות
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Income vs Expenses bar chart (6 months) ──────────────────────── */}
      <Card className="surface-shell rounded-[calc(var(--radius)+0.85rem)] border-border/70">
        <CardHeader className="pb-2 pt-4 px-4 text-right">
          <div className="rtl-title-row">
            <div>
              <CardTitle className="text-sm font-bold">הכנסות מול הוצאות</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">6 חודשים אחרונים</p>
            </div>
            <div className="icon-chip h-9 w-9 shrink-0 rounded-[calc(var(--radius)+0.375rem)] border-primary/20 bg-primary/[0.1] text-primary">
              <Clock className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData6} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "rgba(128,128,128,0.7)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "rgba(128,128,128,0.6)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]} name="הכנסות" maxBarSize={20} />
                <Bar dataKey="expenses" fill="#f43f5e" radius={[3, 3, 0, 0]} name="הוצאות" maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-5 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-3 rounded-full bg-emerald-500 opacity-70" />
              הכנסות
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-3 rounded-full bg-rose-500 opacity-70" />
              הוצאות
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

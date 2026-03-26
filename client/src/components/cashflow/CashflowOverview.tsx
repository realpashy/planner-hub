import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertCircle, ArrowDownLeft, ArrowUpRight, CalendarClock, ChevronLeft, Clock, Plus, RefreshCw, Target, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  type CashflowData,
  type ForecastRange,
  formatCashflowAmount,
  formatHebrewDateShort,
  getAvailableBalance,
  getDailyAverages,
  getDaysUntil,
  getForecastSeries,
  getIncomeExpenseChartData,
  getPendingUpcomingTotal,
  getPeriodStats,
  getRequiredDailyTarget,
} from "@/lib/cashflow";

type PeriodKey = "today" | "week" | "month";

const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: "היום",
  week: "השבוע",
  month: "החודש",
};

interface CashflowOverviewProps {
  data: CashflowData;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddUpcoming: () => void;
  onUpdateBalance: () => void;
  onViewUpcoming: () => void;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/60 bg-popover/95 px-3 py-2 text-right shadow-lg backdrop-blur-md">
      <p className="mb-1 text-xs font-semibold text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="cashflow-number text-sm font-bold" style={{ color: entry.color }}>
          {formatCashflowAmount(entry.value)}
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
  const [period, setPeriod] = useState<PeriodKey>("today");
  const [forecastRange, setForecastRange] = useState<ForecastRange>(7);

  const stats = useMemo(() => getPeriodStats(data, period), [data, period]);
  const balance = useMemo(() => getAvailableBalance(data), [data]);
  const dailyTarget = useMemo(() => getRequiredDailyTarget(data), [data]);
  const dailyAverages = useMemo(() => getDailyAverages(data, period), [data, period]);
  const forecastSeries = useMemo(() => getForecastSeries(data, forecastRange), [data, forecastRange]);
  const incomeExpenseData = useMemo(() => getIncomeExpenseChartData(data.transactions), [data.transactions]);
  const monthlyUpcomingTotal = useMemo(() => getPendingUpcomingTotal(data, "month"), [data]);

  const pendingPayments = useMemo(() => {
    const now = new Date().toISOString().split("T")[0];
    return data.upcomingPayments
      .filter((payment) => payment.status === "pending" && payment.dueDate >= now)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 3);
  }, [data.upcomingPayments]);

  const isLowBalance = data.settings.cashWarningThreshold ? balance < data.settings.cashWarningThreshold : false;

  return (
    <div className="space-y-5 pb-4">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Card className="surface-shell relative overflow-hidden rounded-[calc(var(--radius)+1rem)] border-border/70">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.07),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.16),transparent_55%)]" />

          <CardContent className="relative p-6 pt-8">
            <div className="flex items-start justify-start gap-3 text-right" dir="rtl">
              <div className="icon-chip flex h-12 w-12 shrink-0 items-center justify-center rounded-[calc(var(--radius)+0.5rem)] border-sky-500/20 bg-sky-500/[0.12] text-sky-600 dark:text-sky-300">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-end space-y-1 text-right">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-muted-foreground">יתרה זמינה עכשיו</p>
                  {isLowBalance ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/[0.1] px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-300">
                      <AlertCircle className="h-2.5 w-2.5" />
                      נמוכה
                    </span>
                  ) : null}
                </div>
                <p className={cn("cashflow-number text-4xl font-black leading-none", isLowBalance ? "text-rose-600 dark:text-rose-300" : "text-foreground")}>
                  {formatCashflowAmount(balance, data.settings.currency)}
                </p>
                <div className="flex w-full flex-wrap justify-end gap-x-3 gap-y-0.5 pt-1 text-xs text-muted-foreground">
                  {data.settings.bankBalance !== undefined ? (
                    <span>בנק: {formatCashflowAmount(data.settings.bankBalance, data.settings.currency)}</span>
                  ) : null}
                  {data.settings.cashOnHand !== undefined ? (
                    <span>מזומן: {formatCashflowAmount(data.settings.cashOnHand, data.settings.currency)}</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-[calc(var(--radius)+0.25rem)] border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2 text-right">
                <div className="flex items-start justify-start gap-2 text-right" dir="rtl">
                  <Target className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
                  <div className="flex min-w-0 flex-1 flex-col items-end text-right">
                    <p className="text-[11px] font-semibold text-muted-foreground">יעד יומי נדרש</p>
                    <p className="cashflow-number text-sm font-black text-amber-700 dark:text-amber-300">
                      {formatCashflowAmount(dailyTarget, data.settings.currency)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/60 bg-muted/30 px-3 py-2 text-right">
                <div className="flex items-start justify-start gap-2 text-right" dir="rtl">
                  <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-1 flex-col items-end text-right">
                    <p className="text-[11px] font-semibold text-muted-foreground">תשלומים ממתינים החודש</p>
                    <p className="cashflow-number text-sm font-black">{formatCashflowAmount(monthlyUpcomingTotal, data.settings.currency)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
              {[
                { label: "הוסף הכנסה", icon: ArrowUpRight, tone: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/[0.1] border-emerald-500/25 hover:bg-emerald-500/18", onClick: onAddIncome },
                { label: "הוסף הוצאה", icon: ArrowDownLeft, tone: "text-rose-700 dark:text-rose-300 bg-rose-500/[0.1] border-rose-500/25 hover:bg-rose-500/18", onClick: onAddExpense },
                { label: "תשלום עתידי", icon: CalendarClock, tone: "text-amber-700 dark:text-amber-300 bg-amber-500/[0.1] border-amber-500/25 hover:bg-amber-500/18", onClick: onAddUpcoming },
                { label: "עדכן יתרה", icon: RefreshCw, tone: "text-sky-700 dark:text-sky-300 bg-sky-500/[0.1] border-sky-500/25 hover:bg-sky-500/18", onClick: onUpdateBalance },
              ].map(({ label, icon: Icon, tone, onClick }) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  className={cn("flex items-center gap-3 rounded-[calc(var(--radius)+0.5rem)] border px-4 py-3.5 text-right text-sm font-semibold transition-all duration-150 active:scale-[0.98]", tone)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-right">{label}</span>
                  <Plus className="h-4 w-4 shrink-0 opacity-70" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex gap-1.5 rounded-[calc(var(--radius)+0.375rem)] border border-border/50 bg-muted/40 p-1">
        {(["today", "week", "month"] as PeriodKey[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setPeriod(value)}
            className={cn(
              "flex-1 rounded-[calc(var(--radius)+0.125rem)] py-2 text-sm font-semibold transition-all duration-200",
              period === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {PERIOD_LABELS[value]}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={period}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 gap-2.5 xl:grid-cols-4"
        >
          {[
            {
              label: "הכנסות",
              value: stats.income,
              tone: "text-emerald-600 dark:text-emerald-300 bg-emerald-500/[0.07] dark:bg-emerald-500/[0.1]",
              icon: ArrowUpRight,
            },
            {
              label: "הוצאות",
              value: stats.expenses,
              tone: "text-rose-600 dark:text-rose-300 bg-rose-500/[0.07] dark:bg-rose-500/[0.1]",
              icon: ArrowDownLeft,
            },
            {
              label: "נטו",
              value: stats.net,
              tone: stats.net >= 0 ? "text-sky-600 dark:text-sky-300 bg-sky-500/[0.07] dark:bg-sky-500/[0.1]" : "text-rose-600 dark:text-rose-300 bg-rose-500/[0.07] dark:bg-rose-500/[0.1]",
              icon: TrendingUp,
            },
            {
              label: "ממוצע יומי",
              value: Math.max(dailyAverages.averageIncome, dailyAverages.averageExpenses),
              tone: "text-foreground bg-muted/40",
              icon: Clock,
            },
          ].map(({ label, value, tone, icon: Icon }) => (
            <div key={label} className={cn("surface-shell rounded-[calc(var(--radius)+0.625rem)] p-3.5 text-right", tone)}>
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
                  <p className="cashflow-number mt-1 text-base font-black">{formatCashflowAmount(value, data.settings.currency)}</p>
                </div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-[calc(var(--radius)+0.375rem)] border border-primary/25 bg-primary/[0.12] text-primary shadow-[var(--app-shadow)]">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {pendingPayments.length > 0 ? (
        <Card className="surface-shell rounded-[calc(var(--radius)+0.85rem)] border-border/70">
          <CardHeader className="px-4 pb-3 pt-5 text-right">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-right text-sm font-bold">תשלומים קרובים</CardTitle>
              <button type="button" onClick={onViewUpcoming} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                הכל
                <ChevronLeft className="h-3 w-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-4">
            {pendingPayments.map((payment) => {
              const daysUntil = getDaysUntil(payment.dueDate);
              const isUrgent = daysUntil <= 3;
              return (
                <div
                  key={payment.id}
                  className={cn(
                    "flex items-center gap-3 rounded-[calc(var(--radius)+0.25rem)] border px-3 py-2.5",
                    isUrgent ? "border-rose-500/25 bg-rose-500/[0.05] dark:bg-rose-500/[0.08]" : "border-border/40 bg-muted/30",
                  )}
                >
                  <div
                    className={cn(
                      "inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full px-2 text-xs font-black",
                      isUrgent ? "bg-rose-500/[0.15] text-rose-700 dark:text-rose-300" : "bg-amber-500/[0.12] text-amber-700 dark:text-amber-300",
                    )}
                  >
                    {daysUntil === 0 ? "היום" : daysUntil}
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <p className="truncate text-sm font-semibold leading-tight">{payment.name}</p>
                    <p className="text-xs text-muted-foreground">{formatHebrewDateShort(payment.dueDate)}</p>
                  </div>
                  <p className="cashflow-number shrink-0 text-sm font-black">{formatCashflowAmount(payment.amount, data.settings.currency)}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      <Card className="surface-shell rounded-[calc(var(--radius)+0.85rem)] border-border/70">
        <CardHeader className="px-4 pb-2 pt-5 text-right">
          <div className="flex items-center justify-between gap-3">
            <div className="text-right">
              <CardTitle className="text-sm font-bold">תחזית יתרה</CardTitle>
              <p className="text-xs text-muted-foreground">מבוסס על יתרה נוכחית, תשלומים צפויים ונתוני בסיס</p>
            </div>
            <div className="flex gap-1 rounded-[calc(var(--radius)+0.25rem)] border border-border/50 bg-muted/35 p-1">
              {([7, 30] as ForecastRange[]).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setForecastRange(range)}
                  className={cn(
                    "rounded-[calc(var(--radius)+0.125rem)] px-3 py-1.5 text-xs font-semibold transition-colors",
                    forecastRange === range ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {range} ימים
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastSeries} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cashflowForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#95df1e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#95df1e" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(128,128,128,0.7)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "rgba(128,128,128,0.6)" }} axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}K`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="balance" stroke="#95df1e" strokeWidth={2.5} fill="url(#cashflowForecast)" name="יתרה" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-shell rounded-[calc(var(--radius)+0.85rem)] border-border/70">
        <CardHeader className="px-4 pb-2 pt-5 text-right">
          <div className="flex items-center justify-between gap-3">
            <div className="icon-chip h-9 w-9 shrink-0 rounded-[calc(var(--radius)+0.375rem)] border-primary/20 bg-primary/[0.1] text-primary">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <CardTitle className="text-sm font-bold">הכנסות מול הוצאות</CardTitle>
              <p className="text-xs text-muted-foreground">6 החודשים האחרונים על בסיס נתונים אמיתיים</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeExpenseData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(128,128,128,0.7)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "rgba(128,128,128,0.6)" }} axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}K`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]} name="הכנסות" maxBarSize={20} />
                <Bar dataKey="expenses" fill="#f43f5e" radius={[3, 3, 0, 0]} name="הוצאות" maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

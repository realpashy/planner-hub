// ─────────────────────────────────────────────────────────────────────────────
// CashflowUpcoming — Upcoming payments screen
// Hebrew-first, mobile-optimised.
// Filter chips: הכל / השבוע / החודש / שולם / ממתין
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  type CashflowData,
  type UpcomingPayment,
  formatCashflowAmount,
  formatHebrewDate,
  getDaysUntil,
  generateId,
} from "@/lib/cashflow";
import { CalendarClock, Check, Clock, Plus, RefreshCw, Zap } from "lucide-react";

type FilterKey = "all" | "week" | "month" | "paid" | "pending";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "הכל" },
  { key: "pending", label: "ממתין" },
  { key: "week", label: "השבוע" },
  { key: "month", label: "החודש" },
  { key: "paid", label: "שולם" },
];

function isWithinDays(isoDate: string, days: number): boolean {
  const d = getDaysUntil(isoDate);
  return d >= 0 && d <= days;
}

interface UpcomingCardProps {
  payment: UpcomingPayment;
  currency: CashflowData["settings"]["currency"];
  onMarkPaid: (id: string) => void;
}

function UpcomingCard({ payment, currency, onMarkPaid }: UpcomingCardProps) {
  const daysUntil = getDaysUntil(payment.dueDate);
  const isPaid = payment.status === "paid";
  const isOverdue = daysUntil < 0 && !isPaid;
  const isUrgent = daysUntil >= 0 && daysUntil <= 3 && !isPaid;

  const urgencyColor = isPaid
    ? "border-emerald-500/20 bg-emerald-500/[0.05] dark:bg-emerald-500/[0.08]"
    : isOverdue
      ? "border-rose-500/30 bg-rose-500/[0.07] dark:bg-rose-500/[0.1]"
      : isUrgent
        ? "border-amber-500/30 bg-amber-500/[0.07] dark:bg-amber-500/[0.1]"
        : "border-border/50 bg-muted/20";

  const daysLabel = isPaid
    ? "שולם"
    : daysUntil === 0
      ? "היום!"
      : isOverdue
        ? `איחור ${Math.abs(daysUntil)} ימים`
        : `בעוד ${daysUntil} ימים`;

  const daysLabelColor = isPaid
    ? "text-emerald-600 dark:text-emerald-300"
    : isOverdue
      ? "text-rose-600 dark:text-rose-300"
      : isUrgent
        ? "text-amber-600 dark:text-amber-300"
        : "text-muted-foreground";

  return (
    <Card className={cn("rounded-[calc(var(--radius)+0.625rem)] border transition-all duration-200", urgencyColor)}>
      <CardContent className="p-4">
        <div className="rtl-title-row items-start gap-3">
          {/* Icon chip */}
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-[calc(var(--radius)+0.25rem)] border text-sm",
            isPaid ? "border-emerald-500/20 bg-emerald-500/[0.1]" : "border-amber-500/20 bg-amber-500/[0.1]",
          )}>
            {isPaid ? "✅" : payment.recurrence === "monthly" ? <RefreshCw className="h-4 w-4 text-amber-600 dark:text-amber-300" /> : <Zap className="h-4 w-4 text-amber-600 dark:text-amber-300" />}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-1 text-right">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold leading-tight flex-1 truncate">{payment.name}</p>
              <p
                className="text-base font-black tabular-nums shrink-0"
                style={{ direction: "ltr" }}
              >
                {formatCashflowAmount(payment.amount, currency)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-xs text-muted-foreground">{formatHebrewDate(payment.dueDate)}</span>
              <span className={cn("text-xs font-semibold", daysLabelColor)}>{daysLabel}</span>
              {payment.recurrence === "monthly" && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <RefreshCw className="h-2.5 w-2.5" />
                  חוזר חודשי
                </span>
              )}
            </div>
            {payment.note && (
              <p className="text-xs text-muted-foreground">{payment.note}</p>
            )}
          </div>
        </div>

        {/* Mark as paid button */}
        {!isPaid && (
          <button
            onClick={() => onMarkPaid(payment.id)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[calc(var(--radius)+0.25rem)] border border-emerald-500/25 bg-emerald-500/[0.08] py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/18 transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
            סמן כשולם
          </button>
        )}
      </CardContent>
    </Card>
  );
}

interface CashflowUpcomingProps {
  data: CashflowData;
  onAddUpcoming: () => void;
  onMarkPaid: (id: string) => void;
}

export function CashflowUpcoming({ data, onAddUpcoming, onMarkPaid }: CashflowUpcomingProps) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    const payments = [...data.upcomingPayments].sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate),
    );
    switch (filter) {
      case "pending": return payments.filter((p) => p.status === "pending");
      case "paid": return payments.filter((p) => p.status === "paid");
      case "week": return payments.filter((p) => p.status === "pending" && isWithinDays(p.dueDate, 7));
      case "month": return payments.filter((p) => p.status === "pending" && isWithinDays(p.dueDate, 30));
      default: return payments;
    }
  }, [data.upcomingPayments, filter]);

  const totalPending = useMemo(
    () => data.upcomingPayments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0),
    [data.upcomingPayments],
  );

  const pendingCount = data.upcomingPayments.filter((p) => p.status === "pending").length;

  return (
    <div className="space-y-4 pb-4">

      {/* ── Summary card ─────────────────────────────────────────────────── */}
      {pendingCount > 0 && (
        <div className="surface-shell rounded-[calc(var(--radius)+0.85rem)] border border-amber-500/20 bg-amber-500/[0.04] dark:bg-amber-500/[0.07] p-4 text-right">
          <div className="rtl-title-row">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">סה"כ תשלומים ממתינים</p>
              <p
                className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-300 tabular-nums"
                style={{ direction: "ltr" }}
              >
                {formatCashflowAmount(totalPending, data.settings.currency)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{pendingCount} תשלומים ממתינים</p>
            </div>
            <div className="icon-chip h-11 w-11 shrink-0 rounded-[calc(var(--radius)+0.375rem)] border-amber-500/20 bg-amber-500/[0.12] text-amber-600 dark:text-amber-300">
              <CalendarClock className="h-5 w-5" />
            </div>
          </div>
        </div>
      )}

      {/* ── Filter chips ─────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-150",
              filter === key
                ? "border-primary/40 bg-primary/[0.12] text-primary"
                : "border-border/50 bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted/60",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Add button ───────────────────────────────────────────────────── */}
      <Button
        onClick={onAddUpcoming}
        variant="outline"
        className="w-full h-11 rounded-[calc(var(--radius)+0.5rem)] border-dashed border-amber-500/30 bg-amber-500/[0.05] text-amber-700 dark:text-amber-300 hover:border-amber-500/50 hover:bg-amber-500/10 font-semibold gap-2"
      >
        <Plus className="h-4 w-4" />
        הוסף תשלום עתידי
      </Button>

      {/* ── Payment cards ─────────────────────────────────────────────────  */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-14 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
              <Clock className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">אין תשלומים להציג</p>
              <p className="text-sm text-muted-foreground">
                {filter === "all" ? "הוסף תשלום עתידי כדי לעקוב אחרי ההתחייבויות שלך" : "אין תוצאות לפי הפילטר הנוכחי"}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {filtered.map((payment) => (
              <UpcomingCard
                key={payment.id}
                payment={payment}
                currency={data.settings.currency}
                onMarkPaid={onMarkPaid}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

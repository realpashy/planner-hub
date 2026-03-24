import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarClock, Check, Pencil, Plus, Search } from "lucide-react";
import {
  type CashflowDateFilter,
  type CashflowData,
  type UpcomingPayment,
  filterByDateRange,
  formatCashflowAmount,
  formatHebrewDate,
  getDaysUntil,
  getUpcomingPaymentCategoryMeta,
} from "@/lib/cashflow";
import { CashflowDateRangeFilter } from "@/components/cashflow/CashflowDateRangeFilter";

type FilterKey = "all" | "week" | "month" | "paid" | "pending";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "הכל" },
  { key: "week", label: "השבוע" },
  { key: "month", label: "החודש" },
  { key: "paid", label: "שולם" },
  { key: "pending", label: "ממתין" },
];

function matchesPeriod(payment: UpcomingPayment, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "paid") return payment.status === "paid";
  if (filter === "pending") return payment.status === "pending";
  const daysUntil = getDaysUntil(payment.dueDate);
  if (payment.status !== "pending") return false;
  return filter === "week" ? daysUntil >= 0 && daysUntil <= 7 : daysUntil >= 0 && daysUntil <= 30;
}

function PaymentCard({
  payment,
  currency,
  onEdit,
  onRequestMarkPaid,
}: {
  payment: UpcomingPayment;
  currency: CashflowData["settings"]["currency"];
  onEdit: (payment: UpcomingPayment) => void;
  onRequestMarkPaid: (payment: UpcomingPayment) => void;
}) {
  const daysUntil = getDaysUntil(payment.dueDate);
  const isPaid = payment.status === "paid";
  const isOverdue = daysUntil < 0 && !isPaid;
  const isUrgent = daysUntil >= 0 && daysUntil <= 3 && !isPaid;
  const categoryMeta = getUpcomingPaymentCategoryMeta(payment);

  const cardTone = isPaid
    ? "border-emerald-500/20 bg-emerald-500/[0.05] dark:bg-emerald-500/[0.08]"
    : isOverdue
      ? "border-rose-500/30 bg-rose-500/[0.07] dark:bg-rose-500/[0.1]"
      : isUrgent
        ? "border-amber-500/30 bg-amber-500/[0.07] dark:bg-amber-500/[0.1]"
        : "border-border/50 bg-muted/20";

  const tags = [
    isPaid
      ? { label: "שולם", tone: "bg-emerald-500/[0.15] text-emerald-700 dark:text-emerald-300" }
      : isOverdue
        ? { label: `איחור ${Math.abs(daysUntil)} ימים`, tone: "bg-rose-500/[0.15] text-rose-700 dark:text-rose-300" }
        : { label: daysUntil === 0 ? "היום" : `בעוד ${daysUntil} ימים`, tone: "bg-amber-500/[0.15] text-amber-700 dark:text-amber-300" },
    payment.recurringMonthly
      ? { label: "חוזר חודשי", tone: "bg-sky-500/[0.15] text-sky-700 dark:text-sky-300" }
      : null,
  ].filter(Boolean) as Array<{ label: string; tone: string }>;

  return (
    <Card className={cn("rounded-[calc(var(--radius)+0.625rem)] border transition-all duration-200", cardTone)}>
      <CardContent className="p-4 pt-[15px]">
        <div className="grid items-stretch gap-4 md:grid-cols-[15%_1fr_25%]">
          <div className="flex min-h-full items-center justify-center">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[calc(var(--radius)+0.375rem)] border border-primary/30 bg-background/60 text-xl shadow-[0_0_0_1px_rgba(149,223,30,0.12),0_0_18px_rgba(149,223,30,0.12)]">
              {categoryMeta.icon}
            </div>
          </div>

          <div className="min-w-0 space-y-3 text-right">
            <div className="space-y-1">
              <p className="truncate text-sm font-bold leading-tight">{payment.name}</p>
              <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{formatHebrewDate(payment.dueDate)}</span>
                <span>{categoryMeta.label}</span>
              </div>
              {payment.paidFor ? <p className="pt-1 text-xs text-muted-foreground">למי שולם: {payment.paidFor}</p> : null}
              {payment.note ? <p className="pt-1 text-xs text-muted-foreground">{payment.note}</p> : null}
            </div>

            <div className="flex flex-wrap items-center justify-start gap-2">
              {!isPaid ? (
                <button
                  type="button"
                  onClick={() => onRequestMarkPaid(payment)}
                  className="inline-flex items-center gap-1.5 rounded-[calc(var(--radius)+0.25rem)] border border-emerald-500/25 bg-emerald-500/[0.08] px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/[0.16] dark:text-emerald-300"
                >
                  <Check className="h-3.5 w-3.5" />
                  סמן כשולם
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onEdit(payment)}
                className="inline-flex items-center gap-1.5 rounded-[calc(var(--radius)+0.25rem)] border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70"
              >
                <Pencil className="h-3.5 w-3.5" />
                ערוך
              </button>
            </div>
          </div>

          <div className="flex min-h-full flex-col items-start justify-center gap-2 text-left">
            <p className="cashflow-number text-[26px] font-black leading-none">{formatCashflowAmount(payment.amount, currency)}</p>
            <div className="flex flex-col items-start gap-1">
              {tags.map((tag) => (
                <div key={`${payment.id}-${tag.label}`} className={cn("rounded-full px-2 py-1 text-[10px] font-semibold", tag.tone)}>
                  {tag.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CashflowUpcomingProps {
  data: CashflowData;
  onAddUpcoming: () => void;
  onEditUpcoming: (payment: UpcomingPayment) => void;
  onMarkPaid: (paymentId: string, createExpense: boolean) => void;
}

export function CashflowUpcoming({ data, onAddUpcoming, onEditUpcoming, onMarkPaid }: CashflowUpcomingProps) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [payeeFilter, setPayeeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<CashflowDateFilter>({});
  const [paymentToConfirm, setPaymentToConfirm] = useState<UpcomingPayment | null>(null);
  const savedPayees = useMemo(
    () => Array.from(new Set((data.settings.savedPayees ?? []).filter((value) => value.trim().length > 0))),
    [data.settings.savedPayees],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return filterByDateRange([...data.upcomingPayments], dateFilter)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .filter((payment) => matchesPeriod(payment, filter))
      .filter((payment) => (payeeFilter === "all" ? true : payment.paidFor === payeeFilter))
      .filter((payment) => {
        if (!query) return true;
        const amount = String(payment.amount);
        const dateText = formatHebrewDate(payment.dueDate).toLowerCase();
        const paidFor = (payment.paidFor ?? "").toLowerCase();
        return (
          payment.name.toLowerCase().includes(query) ||
          (payment.note ?? "").toLowerCase().includes(query) ||
          paidFor.includes(query) ||
          amount.includes(query) ||
          dateText.includes(query)
        );
      });
  }, [data.upcomingPayments, dateFilter, filter, payeeFilter, search]);

  const totalPending = useMemo(
    () => data.upcomingPayments.filter((payment) => payment.status === "pending").reduce((sum, payment) => sum + payment.amount, 0),
    [data.upcomingPayments],
  );

  const pendingCount = data.upcomingPayments.filter((payment) => payment.status === "pending").length;

  return (
    <div className="space-y-4 pb-4">
      {pendingCount > 0 ? (
        <div className="surface-shell rounded-[calc(var(--radius)+0.85rem)] border border-amber-500/20 bg-amber-500/[0.04] p-4 pt-5 text-right dark:bg-amber-500/[0.07]">
          <div className="flex items-center gap-3">
            <div className="icon-chip h-11 w-11 shrink-0 rounded-[calc(var(--radius)+0.375rem)] border-amber-500/20 bg-amber-500/[0.12] text-amber-600 dark:text-amber-300">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1 text-right">
              <p className="text-xs font-semibold text-muted-foreground">סה"כ תשלומים ממתינים</p>
              <p className="cashflow-number mt-1 text-2xl font-black text-amber-600 dark:text-amber-300">{formatCashflowAmount(totalPending, data.settings.currency)}</p>
              <p className="text-xs text-muted-foreground">{pendingCount} תשלומים ממתינים</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative">
        <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="חיפוש תשלומים..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-12 rounded-[calc(var(--radius)+0.375rem)] border-border/60 bg-muted/40 pe-10 text-right focus:border-primary/50"
        />
      </div>

      <CashflowDateRangeFilter from={dateFilter.from} to={dateFilter.to} onChange={setDateFilter} />

      {savedPayees.length > 0 ? (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">סינון לפי למי שולם</label>
          <select
            value={payeeFilter}
            onChange={(event) => setPayeeFilter(event.target.value)}
            className="meal-input modern-select h-12 w-full rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 text-right"
          >
            <option value="all">כל הספקים / הגורמים</option>
            {savedPayees.map((payee) => (
              <option key={payee} value={payee}>
                {payee}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-150",
              filter === key ? "border-primary/40 bg-primary/[0.12] text-primary" : "border-border/50 bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted/60",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Button
        onClick={onAddUpcoming}
        variant="outline"
        className="h-11 w-full rounded-[calc(var(--radius)+0.5rem)] border-dashed border-amber-500/30 bg-amber-500/[0.05] font-semibold text-amber-700 hover:border-amber-500/50 hover:bg-amber-500/10 dark:text-amber-300"
      >
        <Plus className="h-4 w-4" />
        הוסף תשלום עתידי
      </Button>

      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
              <CalendarClock className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">אין תשלומים להציג</p>
              <p className="text-sm text-muted-foreground">
                {filter === "all" && !search ? "הוסף תשלום עתידי כדי לעקוב אחרי מה שצפוי לצאת" : "אין תוצאות לפי החיפוש או הפילטר"}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 pt-2">
            {filtered.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} currency={data.settings.currency} onEdit={onEditUpcoming} onRequestMarkPaid={setPaymentToConfirm} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={Boolean(paymentToConfirm)} onOpenChange={(open) => !open && setPaymentToConfirm(null)}>
        <AlertDialogContent dir="rtl" className="max-w-md rounded-[calc(var(--radius)+0.5rem)] border-border/80 bg-card/[0.98] text-right">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="text-right">איך לסמן את התשלום?</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              {paymentToConfirm ? `התשלום "${paymentToConfirm.name}" יסומן כשולם.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-col sm:space-x-0">
            <AlertDialogAction
              className="w-full justify-center"
              onClick={() => {
                if (paymentToConfirm) onMarkPaid(paymentToConfirm.id, true);
                setPaymentToConfirm(null);
              }}
            >
              סמן כשולם וצור הוצאה
            </AlertDialogAction>
            <AlertDialogAction
              className="w-full justify-center border border-border/70 bg-muted/50 text-foreground hover:bg-muted"
              onClick={() => {
                if (paymentToConfirm) onMarkPaid(paymentToConfirm.id, false);
                setPaymentToConfirm(null);
              }}
            >
              סמן כשולם בלבד
            </AlertDialogAction>
            <AlertDialogCancel className="w-full justify-center">ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

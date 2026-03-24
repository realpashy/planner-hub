// ─────────────────────────────────────────────────────────────────────────────
// CashflowTransactions — Transaction list screen
// Hebrew-first, mobile-optimised.
// Tabs: הכל / הכנסות / הוצאות. Search shell. Group by date.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  type CashflowData,
  type CashflowTransaction,
  INCOME_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
  INCOME_CATEGORY_ICONS,
  EXPENSE_CATEGORY_ICONS,
  type IncomeCategory,
  type ExpenseCategory,
  formatCashflowAmount,
  formatHebrewDate,
  formatHebrewDateShort,
} from "@/lib/cashflow";
import { ArrowDownLeft, ArrowUpRight, Receipt, Search } from "lucide-react";

type FilterTab = "all" | "income" | "expense";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "הכל" },
  { key: "income", label: "הכנסות" },
  { key: "expense", label: "הוצאות" },
];

// Group transactions by date (ISO YYYY-MM-DD) → sorted newest first
function groupByDate(txs: CashflowTransaction[]): { date: string; items: CashflowTransaction[] }[] {
  const map = new Map<string, CashflowTransaction[]>();
  const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date));
  for (const tx of sorted) {
    const existing = map.get(tx.date) ?? [];
    existing.push(tx);
    map.set(tx.date, existing);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

function getCategoryLabel(tx: CashflowTransaction): string {
  if (tx.type === "income") return INCOME_CATEGORY_LABELS[tx.category as IncomeCategory] ?? tx.category;
  return EXPENSE_CATEGORY_LABELS[tx.category as ExpenseCategory] ?? tx.category;
}

function getCategoryIcon(tx: CashflowTransaction): string {
  if (tx.type === "income") return INCOME_CATEGORY_ICONS[tx.category as IncomeCategory] ?? "💰";
  return EXPENSE_CATEGORY_ICONS[tx.category as ExpenseCategory] ?? "💸";
}

function isToday(isoDate: string): boolean {
  return isoDate === new Date().toISOString().split("T")[0];
}

function isYesterday(isoDate: string): boolean {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return isoDate === d.toISOString().split("T")[0];
}

function getDateLabel(isoDate: string): string {
  if (isToday(isoDate)) return "היום";
  if (isYesterday(isoDate)) return "אתמול";
  return formatHebrewDate(isoDate);
}

interface TransactionRowProps {
  tx: CashflowTransaction;
  currency: CashflowData["settings"]["currency"];
}

function TransactionRow({ tx, currency }: TransactionRowProps) {
  const isIncome = tx.type === "income";
  return (
    <div className="flex items-center gap-3 py-3">
      {/* Icon */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[calc(var(--radius)+0.25rem)] border text-base",
          isIncome
            ? "border-emerald-500/20 bg-emerald-500/[0.1]"
            : "border-rose-500/20 bg-rose-500/[0.1]",
        )}
      >
        {getCategoryIcon(tx)}
      </div>

      {/* Label + category */}
      <div className="flex-1 min-w-0 text-right">
        <p className="text-sm font-semibold leading-tight truncate">{getCategoryLabel(tx)}</p>
        {tx.note && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{tx.note}</p>
        )}
      </div>

      {/* Amount */}
      <div className="shrink-0 text-left">
        <div className="flex items-center gap-1">
          {isIncome ? (
            <ArrowUpRight className="h-3 w-3 text-emerald-600 dark:text-emerald-300" />
          ) : (
            <ArrowDownLeft className="h-3 w-3 text-rose-600 dark:text-rose-300" />
          )}
          <p
            className={cn(
              "text-sm font-black tabular-nums",
              isIncome ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300",
            )}
            style={{ direction: "ltr" }}
          >
            {formatCashflowAmount(tx.amount, currency)}
          </p>
        </div>
      </div>
    </div>
  );
}

interface CashflowTransactionsProps {
  data: CashflowData;
  onAddIncome: () => void;
  onAddExpense: () => void;
}

export function CashflowTransactions({ data, onAddIncome, onAddExpense }: CashflowTransactionsProps) {
  const [tab, setTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let txs = data.transactions;

    if (tab === "income") txs = txs.filter((t) => t.type === "income");
    if (tab === "expense") txs = txs.filter((t) => t.type === "expense");

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      txs = txs.filter((t) => {
        const label = getCategoryLabel(t).toLowerCase();
        const note = (t.note ?? "").toLowerCase();
        return label.includes(q) || note.includes(q);
      });
    }

    return txs;
  }, [data.transactions, tab, search]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const totals = useMemo(() => {
    const income = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expenses };
  }, [filtered]);

  return (
    <div className="space-y-4 pb-4">

      {/* ── Filter tabs ──────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 rounded-[calc(var(--radius)+0.375rem)] border border-border/50 bg-muted/40 p-1">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 rounded-[calc(var(--radius)+0.125rem)] py-2 text-sm font-semibold transition-all duration-200",
              tab === key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="חיפוש עסקאות..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 pe-10 rounded-[calc(var(--radius)+0.375rem)] border-border/60 bg-muted/40 text-right focus:border-primary/50"
        />
      </div>

      {/* ── Summary totals strip ─────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="surface-subtle rounded-[calc(var(--radius)+0.5rem)] p-3 text-right">
            <p className="text-[10px] font-semibold text-muted-foreground">סה"כ הכנסות</p>
            <p className="mt-1 text-base font-black text-emerald-600 dark:text-emerald-300 tabular-nums" style={{ direction: "ltr" }}>
              {formatCashflowAmount(totals.income, data.settings.currency)}
            </p>
          </div>
          <div className="surface-subtle rounded-[calc(var(--radius)+0.5rem)] p-3 text-right">
            <p className="text-[10px] font-semibold text-muted-foreground">סה"כ הוצאות</p>
            <p className="mt-1 text-base font-black text-rose-600 dark:text-rose-300 tabular-nums" style={{ direction: "ltr" }}>
              {formatCashflowAmount(totals.expenses, data.settings.currency)}
            </p>
          </div>
        </div>
      )}

      {/* ── Transaction groups ───────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {grouped.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-16 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/60">
              <Receipt className="h-7 w-7 text-muted-foreground/60" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">אין עסקאות עדיין</p>
              <p className="text-sm text-muted-foreground">הוסף הכנסה או הוצאה כדי להתחיל</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onAddIncome}
                className="rounded-[calc(var(--radius)+0.375rem)] border border-emerald-500/25 bg-emerald-500/[0.1] px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors"
              >
                הוסף הכנסה
              </button>
              <button
                onClick={onAddExpense}
                className="rounded-[calc(var(--radius)+0.375rem)] border border-rose-500/25 bg-rose-500/[0.1] px-4 py-2 text-sm font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 transition-colors"
              >
                הוסף הוצאה
              </button>
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
            {grouped.map(({ date, items }) => (
              <Card key={date} className="surface-shell rounded-[calc(var(--radius)+0.625rem)] border-border/60 overflow-hidden">
                {/* Date header */}
                <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-4 py-2">
                  <p className="text-xs font-bold text-foreground">{getDateLabel(date)}</p>
                  <p className="text-[10px] text-muted-foreground">{formatHebrewDateShort(date)}</p>
                </div>
                <CardContent className="px-4 py-0 divide-y divide-border/30">
                  {items.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} currency={data.settings.currency} />
                  ))}
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

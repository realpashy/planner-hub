import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Paperclip, Receipt, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableTagSelect } from "@/components/ui/searchable-tag-select";
import { cn } from "@/lib/utils";
import {
  type CashflowDateFilter,
  type CashflowData,
  type CashflowTransaction,
  type ExpenseCategory,
  type IncomeCategory,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_ICONS,
  INCOME_CATEGORY_LABELS,
  INCOME_CATEGORY_ICONS,
  filterByDateRange,
  formatCashflowAmount,
  formatHebrewDate,
  formatHebrewDateShort,
} from "@/lib/cashflow";
import { CashflowDateRangeFilter } from "@/components/cashflow/CashflowDateRangeFilter";

type FilterTab = "all" | "income" | "expense";

const FILTER_TABS: Array<{ key: FilterTab; label: string }> = [
  { key: "all", label: "הכל" },
  { key: "income", label: "הכנסות" },
  { key: "expense", label: "הוצאות" },
];

function groupByDate(transactions: CashflowTransaction[]) {
  const map = new Map<string, CashflowTransaction[]>();
  [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt))
    .forEach((transaction) => {
      map.set(transaction.date, [...(map.get(transaction.date) ?? []), transaction]);
    });

  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

function getCategoryLabel(transaction: CashflowTransaction) {
  if (transaction.type === "income") {
    return INCOME_CATEGORY_LABELS[transaction.category as IncomeCategory] ?? transaction.category;
  }
  return EXPENSE_CATEGORY_LABELS[transaction.category as ExpenseCategory] ?? transaction.category;
}

function isToday(isoDate: string) {
  return isoDate === new Date().toISOString().split("T")[0];
}

function isYesterday(isoDate: string) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isoDate === yesterday.toISOString().split("T")[0];
}

function getDateLabel(isoDate: string) {
  if (isToday(isoDate)) return "היום";
  if (isYesterday(isoDate)) return "אתמול";
  return formatHebrewDate(isoDate);
}

function TransactionRow({
  transaction,
  currency,
  onEdit,
}: {
  transaction: CashflowTransaction;
  currency: CashflowData["settings"]["currency"];
  onEdit: (transaction: CashflowTransaction) => void;
}) {
  const isIncome = transaction.type === "income";

  return (
    <button
      type="button"
      onClick={() => onEdit(transaction)}
      className="flex w-full items-center gap-3 py-3 text-right transition-colors hover:bg-muted/20"
    >
      <div
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] border text-xs font-black shadow-[0_0_0_1px_rgba(149,223,30,0.12),0_0_16px_rgba(149,223,30,0.08)]",
          isIncome
            ? "border-emerald-500/25 bg-background/60 text-emerald-700 dark:text-emerald-300"
            : "border-rose-500/25 bg-background/60 text-rose-700 dark:text-rose-300",
        )}
      >
        {isIncome
          ? INCOME_CATEGORY_ICONS[transaction.category as IncomeCategory] ?? "💸"
          : EXPENSE_CATEGORY_ICONS[transaction.category as ExpenseCategory] ?? "📌"}
      </div>

      <div className="min-w-0 flex-1 text-right">
        <div className="flex items-start justify-start gap-2 text-right">
          <span className="text-sm font-semibold leading-tight">{getCategoryLabel(transaction)}</span>
          {transaction.attachmentId ? <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
        </div>
        {transaction.paidFor ? <p className="mt-1 text-xs font-medium text-foreground/85">למי שולם: {transaction.paidFor}</p> : null}
        {transaction.note ? <p className="mt-1 text-xs text-muted-foreground">{transaction.note}</p> : null}
      </div>

      <div className="shrink-0 text-left">
        <div className="flex items-center gap-1">
          {isIncome ? (
            <ArrowUpRight className="h-3 w-3 text-emerald-600 dark:text-emerald-300" />
          ) : (
            <ArrowDownLeft className="h-3 w-3 text-rose-600 dark:text-rose-300" />
          )}
          <span
            className={cn(
              "cashflow-number text-sm font-black",
              isIncome ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300",
            )}
          >
            {formatCashflowAmount(transaction.amount, currency)}
          </span>
        </div>
      </div>
    </button>
  );
}

interface CashflowTransactionsProps {
  data: CashflowData;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onEditTransaction: (transaction: CashflowTransaction) => void;
}

export function CashflowTransactions({
  data,
  onAddIncome,
  onAddExpense,
  onEditTransaction,
}: CashflowTransactionsProps) {
  const [tab, setTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<CashflowDateFilter>({});
  const [payeeFilter, setPayeeFilter] = useState("all");

  const payeeOptions = useMemo(
    () => Array.from(new Set((data.settings.savedPayees ?? []).filter((value) => value.trim().length > 0))),
    [data.settings.savedPayees],
  );

  const filtered = useMemo(() => {
    let transactions = data.transactions;

    if (tab === "income") transactions = transactions.filter((transaction) => transaction.type === "income");
    if (tab === "expense") transactions = transactions.filter((transaction) => transaction.type === "expense");

    transactions = filterByDateRange(transactions, dateFilter);
    if (payeeFilter !== "all") {
      transactions = transactions.filter((transaction) => transaction.paidFor === payeeFilter);
    }
    const query = search.trim().toLowerCase();
    if (!query) return transactions;

    return transactions.filter((transaction) => {
      const category = getCategoryLabel(transaction).toLowerCase();
      const note = (transaction.note ?? "").toLowerCase();
      const paidFor = (transaction.paidFor ?? "").toLowerCase();
      const amount = String(transaction.amount);
      const dateText = formatHebrewDate(transaction.date).toLowerCase();
      return category.includes(query) || note.includes(query) || paidFor.includes(query) || amount.includes(query) || dateText.includes(query);
    });
  }, [data.transactions, dateFilter, payeeFilter, search, tab]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const totals = useMemo(() => {
    const income = filtered.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + transaction.amount, 0);
    const expenses = filtered.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0);
    return { income, expenses };
  }, [filtered]);

  return (
    <div className="space-y-4 pb-4">
      <div className="flex gap-1.5 rounded-[calc(var(--radius)+0.375rem)] border border-border/50 bg-muted/40 p-1">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 rounded-[calc(var(--radius)+0.125rem)] py-2 text-sm font-semibold transition-all duration-200",
              tab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="חיפוש עסקאות..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-12 rounded-[calc(var(--radius)+0.375rem)] border-border/60 bg-muted/40 pe-10 text-right focus:border-primary/50"
        />
      </div>

      <CashflowDateRangeFilter from={dateFilter.from} to={dateFilter.to} onChange={setDateFilter} />

      {payeeOptions.length > 0 ? (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">סינון לפי למי שולם</label>
          <SearchableTagSelect
            value={payeeFilter === "all" ? "" : payeeFilter}
            onChange={(nextValue) => setPayeeFilter(nextValue || "all")}
            options={payeeOptions}
            placeholder="כל היעדים"
            searchPlaceholder="חיפוש לפי למי שולם"
            clearLabel="כל היעדים"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onAddIncome}
          className="rounded-[calc(var(--radius)+0.375rem)] border border-emerald-500/25 bg-emerald-500/[0.1] px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300"
        >
          הוסף הכנסה
        </button>
        <button
          type="button"
          onClick={onAddExpense}
          className="rounded-[calc(var(--radius)+0.375rem)] border border-rose-500/25 bg-rose-500/[0.1] px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-500/20 dark:text-rose-300"
        >
          הוסף הוצאה
        </button>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="surface-subtle rounded-[calc(var(--radius)+0.5rem)] p-3 text-right">
            <p className="text-[10px] font-semibold text-muted-foreground">סה"כ הכנסות</p>
            <p className="cashflow-number mt-1 text-base font-black text-emerald-600 dark:text-emerald-300">
              {formatCashflowAmount(totals.income, data.settings.currency)}
            </p>
          </div>
          <div className="surface-subtle rounded-[calc(var(--radius)+0.5rem)] p-3 text-right">
            <p className="text-[10px] font-semibold text-muted-foreground">סה"כ הוצאות</p>
            <p className="cashflow-number mt-1 text-base font-black text-rose-600 dark:text-rose-300">
              {formatCashflowAmount(totals.expenses, data.settings.currency)}
            </p>
          </div>
        </div>
      ) : null}

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
                type="button"
                onClick={onAddIncome}
                className="rounded-[calc(var(--radius)+0.375rem)] border border-emerald-500/25 bg-emerald-500/[0.1] px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300"
              >
                הוסף הכנסה
              </button>
              <button
                type="button"
                onClick={onAddExpense}
                className="rounded-[calc(var(--radius)+0.375rem)] border border-rose-500/25 bg-rose-500/[0.1] px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-500/20 dark:text-rose-300"
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
              <Card key={date} className="surface-shell overflow-hidden rounded-[calc(var(--radius)+0.625rem)] border-border/60">
                <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-4 py-2">
                  <p className="text-xs font-bold text-foreground">{getDateLabel(date)}</p>
                  <p className="text-[10px] text-muted-foreground">{formatHebrewDateShort(date)}</p>
                </div>
                <CardContent className="divide-y divide-border/30 px-4 py-0">
                  {items.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      currency={data.settings.currency}
                      onEdit={onEditTransaction}
                    />
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

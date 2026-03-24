// ─────────────────────────────────────────────────────────────────────────────
// AddEntrySheet — Fast bottom-sheet for adding income or expense
// Hebrew-first, RTL layout. Mobile-optimized thumb-friendly tap zones.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  type TransactionType,
  type IncomeCategory,
  type ExpenseCategory,
  INCOME_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
  INCOME_CATEGORY_ICONS,
  EXPENSE_CATEGORY_ICONS,
  type CashflowCurrency,
  formatCashflowAmount,
  generateId,
  getTodayKey,
  type CashflowTransaction,
} from "@/lib/cashflow";
import { Check, ChevronDown } from "lucide-react";

interface AddEntrySheetProps {
  open: boolean;
  type: TransactionType;
  currency: CashflowCurrency;
  onClose: () => void;
  onSave: (tx: CashflowTransaction) => void;
}

const INCOME_CATS = Object.keys(INCOME_CATEGORY_LABELS) as IncomeCategory[];
const EXPENSE_CATS = Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[];

export function AddEntrySheet({ open, type, currency, onClose, onSave }: AddEntrySheetProps) {
  const isIncome = type === "income";
  const [amountStr, setAmountStr] = useState("");
  const [date, setDate] = useState(getTodayKey());
  const [category, setCategory] = useState<IncomeCategory | ExpenseCategory | "">(
    isIncome ? "daily_sales" : "suppliers",
  );
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmountStr("");
      setDate(getTodayKey());
      setCategory(isIncome ? "daily_sales" : "suppliers");
      setNote("");
      setShowNote(false);
      setError("");
    }
  }, [open, isIncome]);

  const parsedAmount = parseFloat(amountStr.replace(/,/g, "")) || 0;
  const isValid = parsedAmount > 0 && category !== "";

  function handleSave() {
    if (!isValid) {
      setError("נא להכניס סכום תקין");
      return;
    }
    onSave({
      id: generateId(),
      type,
      amount: parsedAmount,
      date,
      category: category as IncomeCategory | ExpenseCategory,
      note: note.trim() || undefined,
    });
    onClose();
  }

  const cats = isIncome ? INCOME_CATS : EXPENSE_CATS;
  const labels = isIncome ? INCOME_CATEGORY_LABELS : EXPENSE_CATEGORY_LABELS;
  const icons = isIncome ? INCOME_CATEGORY_ICONS : EXPENSE_CATEGORY_ICONS;

  const accentColor = isIncome
    ? "text-emerald-600 dark:text-emerald-300"
    : "text-rose-600 dark:text-rose-300";
  const accentBg = isIncome
    ? "bg-emerald-500/[0.1] border-emerald-500/25 text-emerald-700 dark:text-emerald-300"
    : "bg-rose-500/[0.1] border-rose-500/25 text-rose-700 dark:text-rose-300";
  const chipSelected = isIncome
    ? "bg-emerald-500/[0.15] border-emerald-500/50 text-emerald-700 dark:text-emerald-200 ring-1 ring-emerald-500/30"
    : "bg-rose-500/[0.15] border-rose-500/50 text-rose-700 dark:text-rose-200 ring-1 ring-rose-500/30";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className={cn(
          "max-h-[92dvh] overflow-y-auto rounded-t-[1.25rem] border-t border-border/60 p-0",
          "bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.03),transparent_40%)]",
          "dark:bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.07),transparent_40%),linear-gradient(180deg,rgba(30,30,30,0.99),rgba(22,22,22,0.99))]",
          "bg-popover",
          "[&>button]:left-4 [&>button]:right-auto [&>button]:top-4",
        )}
        dir="rtl"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border/60" />
        </div>

        <SheetHeader className="px-5 pb-2 text-right">
          <div className="flex items-center gap-3">
            <div className={cn("inline-flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius)+0.375rem)] border text-lg", accentBg)}>
              {isIncome ? "💰" : "💸"}
            </div>
            <SheetTitle className="text-xl font-black">
              {isIncome ? "הוסף הכנסה" : "הוסף הוצאה"}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-5 pb-8 pt-3">

          {/* ── Amount input — large and prominent ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">סכום</label>
            <div className="relative">
              <span className={cn("absolute end-3 top-1/2 -translate-y-1/2 text-xl font-bold pointer-events-none", accentColor)}>
                ₪
              </span>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  if (error) setError("");
                }}
                className={cn(
                  "h-16 pe-10 text-left text-3xl font-black tabular-nums tracking-tight",
                  "rounded-[calc(var(--radius)+0.375rem)] border-border/60 bg-muted/40",
                  "focus:border-primary/50 focus:ring-primary/20",
                  error && "border-destructive/50 focus:border-destructive/50",
                )}
                style={{ direction: "ltr" }}
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-destructive font-medium">{error}</p>}
            {parsedAmount > 0 && (
              <p className={cn("text-sm font-semibold", accentColor)}>
                {formatCashflowAmount(parsedAmount, currency)}
              </p>
            )}
          </div>

          {/* ── Date ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">תאריך</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 text-right focus:border-primary/50"
              style={{ direction: "ltr", textAlign: "right" }}
            />
          </div>

          {/* ── Category chips — large thumb-friendly ── */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {isIncome ? "סוג הכנסה" : "סוג הוצאה"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {cats.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[calc(var(--radius)+0.375rem)] border px-4 py-3 text-right text-sm font-semibold transition-all duration-150",
                    "hover:border-border focus:outline-none",
                    category === cat ? chipSelected : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  <span className="text-base leading-none">{icons[cat as keyof typeof icons]}</span>
                  <span className="flex-1 leading-tight">{labels[cat as keyof typeof labels]}</span>
                  {category === cat && (
                    <Check className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Optional note ── */}
          {showNote ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">הערה (אופציונלי)</label>
              <Textarea
                placeholder="הוסף הערה קצרה..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="resize-none rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 text-right focus:border-primary/50"
              />
            </div>
          ) : (
            <button
              onClick={() => setShowNote(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              הוסף הערה
            </button>
          )}

          {/* ── Save CTA ── */}
          <Button
            onClick={handleSave}
            disabled={!isValid}
            size="lg"
            className={cn(
              "w-full rounded-[calc(var(--radius)+0.5rem)] text-base font-bold h-14",
              isIncome
                ? "bg-emerald-500 hover:bg-emerald-600 text-white border-0"
                : "bg-rose-500 hover:bg-rose-600 text-white border-0",
            )}
          >
            {isIncome ? "שמור הכנסה" : "שמור הוצאה"}
          </Button>

        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AddUpcomingSheet — Add an upcoming / future payment
// ─────────────────────────────────────────────────────────────────────────────
import type { UpcomingPayment, UpcomingPaymentRecurrence } from "@/lib/cashflow";
import { RefreshCw, Zap } from "lucide-react";

interface AddUpcomingSheetProps {
  open: boolean;
  currency: CashflowCurrency;
  onClose: () => void;
  onSave: (payment: UpcomingPayment) => void;
}

export function AddUpcomingSheet({ open, currency, onClose, onSave }: AddUpcomingSheetProps) {
  const [name, setName] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [recurrence, setRecurrence] = useState<UpcomingPaymentRecurrence>("once");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setAmountStr("");
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setDueDate(d.toISOString().split("T")[0]);
      setRecurrence("once");
      setNote("");
      setError("");
    }
  }, [open]);

  const parsedAmount = parseFloat(amountStr.replace(/,/g, "")) || 0;
  const isValid = name.trim().length > 0 && parsedAmount > 0;

  function handleSave() {
    if (!isValid) {
      setError("נא למלא שם וסכום");
      return;
    }
    onSave({
      id: generateId(),
      name: name.trim(),
      amount: parsedAmount,
      dueDate,
      status: "pending",
      recurrence,
      recurringDay: recurrence === "monthly" ? new Date(`${dueDate}T12:00:00`).getDate() : undefined,
      note: note.trim() || undefined,
    });
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className={cn(
          "max-h-[88dvh] overflow-y-auto rounded-t-[1.25rem] border-t border-border/60 p-0 bg-popover",
          "bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.03),transparent_40%)]",
          "dark:bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.07),transparent_40%),linear-gradient(180deg,rgba(30,30,30,0.99),rgba(22,22,22,0.99))]",
          "[&>button]:left-4 [&>button]:right-auto [&>button]:top-4",
        )}
        dir="rtl"
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border/60" />
        </div>

        <SheetHeader className="px-5 pb-2 text-right">
          <SheetTitle className="text-xl font-black">הוסף תשלום עתידי</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 px-5 pb-8 pt-3">

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">שם התשלום</label>
            <Input
              placeholder="לדוגמה: שכירות, ספקים, חשמל..."
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              className="h-11 rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 text-right focus:border-primary/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">סכום</label>
            <div className="relative">
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground pointer-events-none">₪</span>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amountStr}
                onChange={(e) => { setAmountStr(e.target.value); setError(""); }}
                className="h-12 pe-9 text-left text-xl font-black tabular-nums rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 focus:border-primary/50"
                style={{ direction: "ltr" }}
              />
            </div>
            {parsedAmount > 0 && (
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-300">
                {formatCashflowAmount(parsedAmount, currency)}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">תאריך יעד</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-11 rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 text-right focus:border-primary/50"
              style={{ direction: "ltr", textAlign: "right" }}
            />
          </div>

          {/* Recurrence toggle */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">סוג תשלום</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "once" as const, label: "חד פעמי", icon: Zap },
                { value: "monthly" as const, label: "חוזר חודשי", icon: RefreshCw },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setRecurrence(value)}
                  className={cn(
                    "flex items-center gap-2 rounded-[calc(var(--radius)+0.375rem)] border px-4 py-3 text-sm font-semibold transition-all",
                    recurrence === value
                      ? "border-amber-500/50 bg-amber-500/[0.1] text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30"
                      : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">הערה (אופציונלי)</label>
            <Input
              placeholder="הוסף פרטים..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-11 rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 text-right focus:border-primary/50"
            />
          </div>

          {error && <p className="text-xs text-destructive font-medium">{error}</p>}

          <Button
            onClick={handleSave}
            disabled={!isValid}
            size="lg"
            className="w-full rounded-[calc(var(--radius)+0.5rem)] text-base font-bold h-14 bg-amber-500 hover:bg-amber-600 text-white border-0"
          >
            שמור תשלום
          </Button>

        </div>
      </SheetContent>
    </Sheet>
  );
}

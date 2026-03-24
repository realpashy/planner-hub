import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, FileText, Loader2, Paperclip } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  type CashflowCurrency,
  type CashflowTransaction,
  type ExpenseCategory,
  type IncomeCategory,
  type TransactionType,
  type UpcomingPayment,
  EXPENSE_CATEGORY_ICONS,
  EXPENSE_CATEGORY_LABELS,
  INCOME_CATEGORY_ICONS,
  INCOME_CATEGORY_LABELS,
  fetchCashflowAttachment,
  formatCashflowAmount,
  generateId,
  getTodayKey,
  uploadCashflowAttachment,
} from "@/lib/cashflow";
import { CashflowDateField } from "@/components/cashflow/CashflowDateField";

const INCOME_CATEGORIES = Object.keys(INCOME_CATEGORY_LABELS) as IncomeCategory[];
const EXPENSE_CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[];

interface AddEntrySheetProps {
  open: boolean;
  type: TransactionType;
  currency: CashflowCurrency;
  onClose: () => void;
  onSave: (transaction: CashflowTransaction) => void;
  initialTransaction?: CashflowTransaction | null;
  defaultCategory?: IncomeCategory | ExpenseCategory;
}

interface AddUpcomingSheetProps {
  open: boolean;
  currency: CashflowCurrency;
  onClose: () => void;
  onSave: (payment: UpcomingPayment) => void;
  initialPayment?: UpcomingPayment | null;
}

function MoneyInput({
  value,
  onChange,
  placeholder = "0",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Input
        type="number"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 rounded-[calc(var(--radius)+0.375rem)] border-border/70 bg-muted/40 pe-4 ps-12 text-right text-[22px] font-black tracking-tight tabular-nums focus:border-primary/50"
        style={{ direction: "ltr", textAlign: "right" }}
      />
      <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-base font-black text-muted-foreground">
        ₪
      </span>
    </div>
  );
}

function SheetShell({
  children,
  open,
  onClose,
}: {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent
        side="bottom"
        dir="rtl"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className={cn(
          "max-h-[92dvh] overflow-y-auto rounded-t-[1.25rem] border-t border-border/60 p-0 bg-popover",
          "bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.03),transparent_40%)]",
          "dark:bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.07),transparent_40%),linear-gradient(180deg,rgba(30,30,30,0.99),rgba(22,22,22,0.99))]",
          "[&>button]:left-4 [&>button]:right-auto [&>button]:top-4",
        )}
      >
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-border/60" />
        </div>
        {children}
      </SheetContent>
    </Sheet>
  );
}

export function AddEntrySheet({
  open,
  type,
  currency,
  onClose,
  onSave,
  initialTransaction,
  defaultCategory,
}: AddEntrySheetProps) {
  const isEditing = Boolean(initialTransaction);
  const isIncome = type === "income";
  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const labels = (isIncome ? INCOME_CATEGORY_LABELS : EXPENSE_CATEGORY_LABELS) as Record<string, string>;
  const icons = (isIncome ? INCOME_CATEGORY_ICONS : EXPENSE_CATEGORY_ICONS) as Record<string, string>;

  const [amountStr, setAmountStr] = useState("");
  const [date, setDate] = useState(getTodayKey());
  const [category, setCategory] = useState<IncomeCategory | ExpenseCategory>(
    (defaultCategory as IncomeCategory | ExpenseCategory) ?? (isIncome ? "daily_sales" : "suppliers"),
  );
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [showAttachment, setShowAttachment] = useState(false);
  const [attachmentId, setAttachmentId] = useState<string | undefined>(undefined);
  const [attachmentName, setAttachmentName] = useState("");
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [error, setError] = useState("");

  const parsedAmount = Number.parseFloat(amountStr.replace(/,/g, "")) || 0;
  const isValid = parsedAmount > 0 && Boolean(category) && Boolean(date);

  useEffect(() => {
    if (!open) return;

    setAmountStr(initialTransaction ? String(initialTransaction.amount) : "");
    setDate(initialTransaction?.date ?? getTodayKey());
    setCategory(
      (initialTransaction?.category as IncomeCategory | ExpenseCategory | undefined) ??
        (defaultCategory as IncomeCategory | ExpenseCategory | undefined) ??
        (isIncome ? "daily_sales" : "suppliers"),
    );
    setNote(initialTransaction?.note ?? "");
    setShowNote(Boolean(initialTransaction?.note));
    setShowAttachment(Boolean(initialTransaction?.attachmentId));
    setAttachmentId(initialTransaction?.attachmentId);
    setAttachmentName(initialTransaction?.attachmentId ? "קבלה מצורפת" : "");
    setUploadingAttachment(false);
    setError("");
  }, [defaultCategory, initialTransaction, isIncome, open]);

  async function handleAttachmentChange(file: File | null) {
    if (!file) return;
    setUploadingAttachment(true);
    setError("");
    try {
      const uploaded = await uploadCashflowAttachment(file);
      setAttachmentId(uploaded.id);
      setAttachmentName(uploaded.fileName);
      setShowAttachment(true);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "לא הצלחנו להעלות את הקובץ");
    } finally {
      setUploadingAttachment(false);
    }
  }

  async function handlePreviewAttachment() {
    if (!attachmentId) return;
    try {
      const attachment = await fetchCashflowAttachment(attachmentId);
      window.open(attachment.dataUrl, "_blank", "noopener,noreferrer");
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "לא הצלחנו לפתוח את הקובץ");
    }
  }

  function handleSave() {
    if (!isValid) {
      setError("נא למלא סכום, תאריך וקטגוריה");
      return;
    }

    const timestamp = new Date().toISOString();
    onSave({
      id: initialTransaction?.id ?? generateId(),
      type,
      amount: parsedAmount,
      date,
      category,
      note: note.trim() || undefined,
      attachmentId,
      paidFor: initialTransaction?.paidFor,
      createdAt: initialTransaction?.createdAt ?? timestamp,
      updatedAt: timestamp,
    });
    onClose();
  }

  return (
    <SheetShell open={open} onClose={onClose}>
      <SheetHeader className="px-5 pb-2 text-right">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius)+0.375rem)] border text-lg",
              isIncome
                ? "border-emerald-500/25 bg-emerald-500/[0.1] text-emerald-700 dark:text-emerald-300"
                : "border-rose-500/25 bg-rose-500/[0.1] text-rose-700 dark:text-rose-300",
            )}
          >
            ₪
          </div>
          <div className="space-y-0.5 text-right">
            <SheetTitle>{isEditing ? (isIncome ? "עריכת הכנסה" : "עריכת הוצאה") : isIncome ? "הוסף הכנסה" : "הוסף הוצאה"}</SheetTitle>
            <SheetDescription>
              {isIncome ? "שמור את ההכנסה החדשה בכמה צעדים מהירים." : "שמור את ההוצאה החדשה בלי לעכב את העבודה."}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="space-y-6 px-5 pb-8 pt-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">סכום</label>
          <MoneyInput value={amountStr} onChange={(nextValue) => { setAmountStr(nextValue); setError(""); }} />
          {parsedAmount > 0 && (
            <p className={cn("text-sm font-semibold", isIncome ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300")}>
              {formatCashflowAmount(parsedAmount, currency)}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">תאריך</label>
          <CashflowDateField value={date} onChange={setDate} />
        </div>

        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-muted-foreground">{isIncome ? "סוג הכנסה" : "סוג הוצאה"}</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => {
              const selected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[calc(var(--radius)+0.375rem)] border px-4 py-3 text-right text-sm font-semibold transition-all",
                    selected
                      ? isIncome
                        ? "border-emerald-500/50 bg-emerald-500/[0.15] text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-200"
                        : "border-rose-500/50 bg-rose-500/[0.15] text-rose-700 ring-1 ring-rose-500/30 dark:text-rose-200"
                      : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] border border-primary/25 bg-primary text-primary-foreground shadow-[var(--app-shadow)]">
                    {icons[cat]}
                  </span>
                  <span className="flex-1 text-right leading-tight">{labels[cat]}</span>
                  {selected ? <Check className="h-3.5 w-3.5 shrink-0 opacity-70" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        {showNote ? (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">הערה</label>
            <Textarea
              rows={3}
              placeholder="הוסף הערה קצרה..."
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-[88px] resize-none rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 text-base text-right focus:border-primary/50"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            הוסף הערה
          </button>
        )}

        {showAttachment ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-muted-foreground">קבלה</label>
              {attachmentName ? <span className="text-[11px] text-muted-foreground">{attachmentName}</span> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-[calc(var(--radius)+0.25rem)] border border-border/60 bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70">
                {uploadingAttachment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                {attachmentId ? "החלף קבלה" : "צרף קבלה"}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(event) => void handleAttachmentChange(event.target.files?.[0] ?? null)}
                />
              </label>
              {attachmentId ? (
                <button
                  type="button"
                  onClick={() => void handlePreviewAttachment()}
                  className="inline-flex items-center gap-2 rounded-[calc(var(--radius)+0.25rem)] border border-border/60 bg-background/80 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70"
                >
                  <FileText className="h-3.5 w-3.5" />
                  צפה בקבלה
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAttachment(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Paperclip className="h-3.5 w-3.5" />
            הוסף קבלה
          </button>
        )}

        {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}

        <Button
          onClick={handleSave}
          disabled={!isValid || uploadingAttachment}
          size="lg"
          className={cn(
            "h-14 w-full rounded-[calc(var(--radius)+0.5rem)] text-base font-bold",
            isIncome ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-rose-500 text-white hover:bg-rose-600",
          )}
        >
          {isEditing ? "שמור שינויים" : isIncome ? "שמור הכנסה" : "שמור הוצאה"}
        </Button>
      </div>
    </SheetShell>
  );
}

export function AddUpcomingSheet({
  open,
  currency,
  onClose,
  onSave,
  initialPayment,
}: AddUpcomingSheetProps) {
  const isEditing = Boolean(initialPayment);
  const [name, setName] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [dueDate, setDueDate] = useState(getTodayKey());
  const [recurringMonthly, setRecurringMonthly] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setName(initialPayment?.name ?? "");
    setAmountStr(initialPayment ? String(initialPayment.amount) : "");
    setDueDate(initialPayment?.dueDate ?? nextWeek.toISOString().split("T")[0]);
    setRecurringMonthly(initialPayment?.recurringMonthly ?? false);
    setNote(initialPayment?.note ?? "");
    setError("");
  }, [initialPayment, open]);

  const parsedAmount = Number.parseFloat(amountStr.replace(/,/g, "")) || 0;
  const isValid = name.trim().length > 0 && parsedAmount > 0 && Boolean(dueDate);

  function handleSave() {
    if (!isValid) {
      setError("נא למלא שם, סכום ותאריך");
      return;
    }

    const timestamp = new Date().toISOString();
    onSave({
      id: initialPayment?.id ?? generateId(),
      name: name.trim(),
      amount: parsedAmount,
      dueDate,
      note: note.trim() || undefined,
      status: initialPayment?.status ?? "pending",
      recurringMonthly,
      createdAt: initialPayment?.createdAt ?? timestamp,
      updatedAt: timestamp,
    });
    onClose();
  }

  return (
    <SheetShell open={open} onClose={onClose}>
      <SheetHeader className="px-5 pb-2 text-right">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius)+0.375rem)] border border-amber-500/25 bg-amber-500/[0.1] text-base text-amber-700 dark:text-amber-300">
            ₪
          </div>
          <div className="space-y-0.5 text-right">
            <SheetTitle>{isEditing ? "עריכת תשלום עתידי" : "הוסף תשלום עתידי"}</SheetTitle>
            <SheetDescription>שמור התחייבות עתידית בצורה פשוטה וברורה.</SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="space-y-5 px-5 pb-8 pt-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">שם התשלום</label>
          <Input
            placeholder="לדוגמה: שכירות, ספקים, חשמל"
            value={name}
            onChange={(event) => { setName(event.target.value); setError(""); }}
            className="h-12 rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 text-right focus:border-primary/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">סכום</label>
          <MoneyInput value={amountStr} onChange={(nextValue) => { setAmountStr(nextValue); setError(""); }} />
          {parsedAmount > 0 ? (
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              {formatCashflowAmount(parsedAmount, currency)}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">תאריך יעד</label>
          <CashflowDateField value={dueDate} onChange={setDueDate} />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">סוג תשלום</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: false, label: "חד פעמי" },
              { value: true, label: "חוזר חודשי" },
            ].map((option) => {
              const selected = recurringMonthly === option.value;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => setRecurringMonthly(option.value)}
                  className={cn(
                    "rounded-[calc(var(--radius)+0.375rem)] border px-4 py-3 text-sm font-semibold transition-all",
                    selected
                      ? "border-amber-500/50 bg-amber-500/[0.12] text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300"
                      : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">הערה</label>
          <Input
            placeholder="אופציונלי"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="h-12 rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 text-right focus:border-primary/50"
          />
        </div>

        {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}

        <Button
          onClick={handleSave}
          disabled={!isValid}
          size="lg"
          className="h-14 w-full rounded-[calc(var(--radius)+0.5rem)] bg-amber-500 text-base font-bold text-white hover:bg-amber-600"
        >
          {isEditing ? "שמור שינויים" : "שמור תשלום"}
        </Button>
      </div>
    </SheetShell>
  );
}


import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, CalendarClock, PiggyBank, Plus, Search, Trash2, Wallet } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  CURRENCY_OPTIONS,
  TRANSACTION_TYPE_LABEL,
  createBudgetId,
  formatAmount,
  getCurrentMonthKey,
  getCurrencySymbol,
  getMonthKey,
  getMonthlyTotals,
  getUpcomingDaysCount,
  loadBudgetData,
  saveBudgetData,
  type BudgetCategory,
  type BudgetCategoryType,
  type BudgetData,
  type BudgetSavingGoal,
  type BudgetTransaction,
  type BudgetTransactionType,
} from "@/lib/budget";

type BudgetTab = "overview" | "categories";

const TAB_LABELS: Record<BudgetTab, string> = {
  overview: "نظرة عامة",
  categories: "إعدادات الفئات",
};

const MONTH_NAMES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function endOfMonthISO(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(y, m, 0);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseAmountInput(value: string): number {
  const normalized = value.replace(/,/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function emptyTransactionState(type: BudgetTransactionType = "income") {
  return { id: "", type, title: "", amount: "", date: todayISO(), categoryId: "", note: "", linkedId: "" };
}

const ADD_TRANSACTION_TYPES: BudgetTransactionType[] = ["income", "expense", "bill_payment", "debt_payment"];

interface AmountDialogState {
  open: boolean;
  title: string;
  subtitle: string;
  amount: string;
  onConfirm: ((amount: number) => void) | null;
}

interface EditDialogState {
  open: boolean;
  tx: BudgetTransaction | null;
  title: string;
  amount: string;
  date: string;
  note: string;
  categoryId: string;
}

export default function BudgetPlanner() {
  const [data, setData] = useState<BudgetData>(() => loadBudgetData());
  const [activeTab, setActiveTab] = useState<BudgetTab>("overview");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());

  const [transactionForm, setTransactionForm] = useState(emptyTransactionState("income"));

  const [categoryType, setCategoryType] = useState<BudgetCategoryType>("expense");
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const [goalTitle, setGoalTitle] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState(endOfMonthISO(selectedMonth));

  const [recentSearch, setRecentSearch] = useState("");
  const [recentFilter, setRecentFilter] = useState<"all" | BudgetTransactionType>("all");

  const [amountDialog, setAmountDialog] = useState<AmountDialogState>({
    open: false,
    title: "",
    subtitle: "",
    amount: "",
    onConfirm: null,
  });

  const [editDialog, setEditDialog] = useState<EditDialogState>({
    open: false,
    tx: null,
    title: "",
    amount: "",
    date: todayISO(),
    note: "",
    categoryId: "",
  });

  const applyData = (updater: (current: BudgetData) => BudgetData) => {
    setData((current) => {
      const next = updater(current);
      saveBudgetData(next);
      return next;
    });
  };

  const currentMonthTransactions = useMemo(
    () => data.transactions.filter((tx) => getMonthKey(tx.date) === selectedMonth),
    [data.transactions, selectedMonth],
  );

  const monthlyTotals = useMemo(
    () => getMonthlyTotals(data.transactions, selectedMonth),
    [data.transactions, selectedMonth],
  );

  const categoriesByType = useMemo(() => ({
    income: data.categories.filter((c) => c.type === "income"),
    expense: data.categories.filter((c) => c.type === "expense"),
    bill_payment: data.categories.filter((c) => c.type === "bill_payment"),
    debt_payment: data.categories.filter((c) => c.type === "debt_payment"),
    saving: data.categories.filter((c) => c.type === "saving"),
  }), [data.categories]);

  const transactionCategories = useMemo(
    () => data.categories.filter((c) => c.type === transactionForm.type),
    [data.categories, transactionForm.type],
  );

  const savingsByGoalId = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of data.transactions) {
      if (tx.type === "saving" && tx.linkedId) map.set(tx.linkedId, (map.get(tx.linkedId) || 0) + tx.amount);
    }
    return map;
  }, [data.transactions]);
  const billPaymentsById = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of currentMonthTransactions) {
      if (tx.type === "bill_payment" && tx.linkedId) map.set(tx.linkedId, (map.get(tx.linkedId) || 0) + tx.amount);
    }
    return map;
  }, [currentMonthTransactions]);

  const debtPaymentsById = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of data.transactions) {
      if (tx.type === "debt_payment" && tx.linkedId) map.set(tx.linkedId, (map.get(tx.linkedId) || 0) + tx.amount);
    }
    return map;
  }, [data.transactions]);

  const recentTransactions = useMemo(() => {
    const sorted = [...currentMonthTransactions].sort((a, b) => b.date.localeCompare(a.date));
    return sorted
      .filter((tx) => (recentFilter === "all" ? true : tx.type === recentFilter))
      .filter((tx) => {
        const q = recentSearch.trim().toLowerCase();
        if (!q) return true;
        return `${tx.title} ${tx.note} ${tx.amount}`.toLowerCase().includes(q);
      })
      .slice(0, 60);
  }, [currentMonthTransactions, recentFilter, recentSearch]);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of currentMonthTransactions) {
      if (tx.type === "income") continue;
      map.set(tx.categoryId, (map.get(tx.categoryId) || 0) + tx.amount);
    }

    return Array.from(map.entries())
      .map(([categoryId, total]) => ({
        categoryId,
        total,
        name: data.categories.find((c) => c.id === categoryId)?.name || "غير مصنف",
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [currentMonthTransactions, data.categories]);

  const upcomingWarnings = useMemo(() => {
    const warnings: Array<{ tone: "good" | "warn" | "danger"; text: string }> = [];

    const income = monthlyTotals.income;
    const outflow = monthlyTotals.totalOutflow;
    const expensesRatio = income > 0 ? Math.round((monthlyTotals.expenses / income) * 100) : 0;
    const billDebtRatio = income > 0 ? Math.round(((monthlyTotals.bills + monthlyTotals.debts) / income) * 100) : 0;
    const savingsRatio = income > 0 ? Math.round((monthlyTotals.savings / income) * 100) : 0;

    if (income === 0 && outflow > 0) {
      warnings.push({ tone: "danger", text: "⚠️ لا يوجد دخل مسجل هذا الشهر، ومع ذلك هناك مصروفات. يفضّل تسجيل مصادر الدخل لتقييم الوضع بدقة." });
    }

    if (expensesRatio >= 75) {
      warnings.push({ tone: "danger", text: `🚨 المصروفات استهلكت ${expensesRatio}% من الدخل. حاول تقليل المصروفات غير الأساسية هذا الأسبوع.` });
    } else if (expensesRatio >= 55) {
      warnings.push({ tone: "warn", text: `⚡ المصروفات وصلت إلى ${expensesRatio}% من الدخل. أنت قريب من منطقة الضغط المالي.` });
    }

    if (billDebtRatio >= 40) {
      warnings.push({ tone: "warn", text: `📌 الفواتير والديون تمثل ${billDebtRatio}% من الدخل. راقب مواعيد الاستحقاق لتجنب تراكم جديد.` });
    }

    if (income > 0 && savingsRatio < 10) {
      warnings.push({ tone: "warn", text: `💡 الادخار الحالي ${savingsRatio}% فقط من الدخل. هدف عملي: ارفع النسبة تدريجيا إلى 15%.` });
    } else if (income > 0 && savingsRatio >= 20) {
      warnings.push({ tone: "good", text: `✅ ممتاز! الادخار وصل إلى ${savingsRatio}% من الدخل، وهذا يمنحك هامش أمان جيد.` });
    }

    const nearBills = data.bills.filter((bill) => {
      const remaining = Math.max(bill.expectedAmount - (billPaymentsById.get(bill.id) || 0), 0);
      const days = getUpcomingDaysCount(bill.dueDay, selectedMonth);
      return remaining > 0 && days >= 0 && days <= 5;
    });

    const nearDebts = data.debts.filter((debt) => {
      const remaining = Math.max(debt.totalAmount - (debtPaymentsById.get(debt.id) || 0), 0);
      const days = getUpcomingDaysCount(debt.dueDay, selectedMonth);
      return remaining > 0 && days >= 0 && days <= 5;
    });

    if (nearBills.length > 0 || nearDebts.length > 0) {
      warnings.push({
        tone: "danger",
        text: `⏳ لديك ${nearBills.length} فاتورة و ${nearDebts.length} دين مستحق قريباً خلال 5 أيام. سجّل الدفعات مبكراً.`,
      });
    }

    if (warnings.length === 0) {
      warnings.push({ tone: "good", text: "🌿 الوضع المالي متوازن حالياً. استمر على نفس النمط وراجع العمليات الجديدة أسبوعياً." });
    }

    return warnings.slice(0, 5);
  }, [monthlyTotals, data.bills, data.debts, billPaymentsById, debtPaymentsById, selectedMonth]);

  const symbol = getCurrencySymbol(data.settings.currency);
  const [selectedYear, selectedMonthNumber] = selectedMonth.split("-");
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, index) => String(currentYear - 4 + index));
  }, []);

  const configureTransactionType = (type: BudgetTransactionType) => {
    setTransactionForm((prev) => ({
      ...prev,
      type,
      categoryId: data.categories.find((c) => c.type === type)?.id || "",
    }));
  };

  const saveTransaction = () => {
    const amount = parseAmountInput(transactionForm.amount);
    if (!transactionForm.title.trim() || !Number.isFinite(amount) || amount <= 0 || !transactionForm.categoryId) return;

    const payload: BudgetTransaction = {
      id: createBudgetId(),
      type: transactionForm.type,
      title: transactionForm.title.trim(),
      amount,
      date: transactionForm.date,
      categoryId: transactionForm.categoryId,
      note: transactionForm.note.trim(),
      linkedId: undefined,
    };

    applyData((current) => ({ ...current, transactions: [payload, ...current.transactions] }));
    setTransactionForm(emptyTransactionState(transactionForm.type));
  };

  const addCategory = () => {
    const name = categoryName.trim();
    if (!name) return;
    if (data.categories.some((cat) => cat.type === categoryType && cat.name === name)) return;

    const nextCategory: BudgetCategory = { id: createBudgetId(), type: categoryType, name };
    applyData((current) => ({ ...current, categories: [nextCategory, ...current.categories] }));
    setCategoryName("");
  };

  const deleteCategory = (id: string) => {
    const used = data.transactions.some((tx) => tx.categoryId === id) || data.bills.some((b) => b.categoryId === id) || data.debts.some((d) => d.categoryId === id);
    if (used) {
      window.alert("لا يمكن حذف الفئة لأنها مرتبطة ببيانات حالية.");
      return;
    }
    applyData((current) => ({ ...current, categories: current.categories.filter((cat) => cat.id !== id) }));
  };

  const saveCategoryEdit = () => {
    if (!editingCategoryId || !editingCategoryName.trim()) return;
    applyData((current) => ({
      ...current,
      categories: current.categories.map((cat) => (cat.id === editingCategoryId ? { ...cat, name: editingCategoryName.trim() } : cat)),
    }));
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };
  const addSavingGoal = () => {
    const targetAmount = parseAmountInput(goalTargetAmount);
    if (!goalTitle.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0 || !goalTargetDate) return;

    applyData((current) => ({
      ...current,
      savingsGoals: [{ id: createBudgetId(), title: goalTitle.trim(), targetAmount, targetDate: goalTargetDate }, ...current.savingsGoals],
    }));

    setGoalTitle("");
    setGoalTargetAmount("");
    setGoalTargetDate(endOfMonthISO(selectedMonth));
  };

  const addContribution = (goal: BudgetSavingGoal, amount: number) => {
    const categoryId = categoriesByType.saving[0]?.id;
    if (!Number.isFinite(amount) || amount <= 0 || !categoryId) return;

    applyData((current) => ({
      ...current,
      transactions: [{ id: createBudgetId(), type: "saving", title: `مساهمة: ${goal.title}`, amount, date: todayISO(), categoryId, note: "إضافة إلى هدف", linkedId: goal.id }, ...current.transactions],
    }));
  };

  const openAmountDialog = (title: string, subtitle: string, defaultAmount: number, onConfirm: (amount: number) => void) => {
    setAmountDialog({
      open: true,
      title,
      subtitle,
      amount: String(Math.max(Math.round(defaultAmount), 0)),
      onConfirm,
    });
  };

  const confirmAmountDialog = () => {
    const amount = parseAmountInput(amountDialog.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !amountDialog.onConfirm) return;
    amountDialog.onConfirm(amount);
    setAmountDialog({ open: false, title: "", subtitle: "", amount: "", onConfirm: null });
  };

  const closeAmountDialog = () => {
    setAmountDialog({ open: false, title: "", subtitle: "", amount: "", onConfirm: null });
  };

  const openSavingContributionDialog = (goal: BudgetSavingGoal) => {
    const saved = savingsByGoalId.get(goal.id) || 0;
    const remaining = Math.max(goal.targetAmount - saved, 0);
    openAmountDialog("إضافة مساهمة ادخار", goal.title, remaining || 100, (amount) => {
      addContribution(goal, amount);
    });
  };

  const openEditTransactionDialog = (tx: BudgetTransaction) => {
    setEditDialog({
      open: true,
      tx,
      title: tx.title,
      amount: String(tx.amount),
      date: tx.date,
      note: tx.note,
      categoryId: tx.categoryId,
    });
  };

  const saveEditTransaction = () => {
    if (!editDialog.tx) return;
    const amount = parseAmountInput(editDialog.amount);
    if (!editDialog.title.trim() || !Number.isFinite(amount) || amount <= 0 || !editDialog.categoryId) return;

    applyData((current) => ({
      ...current,
      transactions: current.transactions.map((tx) =>
        tx.id === editDialog.tx?.id
          ? {
              ...tx,
              title: editDialog.title.trim(),
              amount,
              date: editDialog.date,
              note: editDialog.note.trim(),
              categoryId: editDialog.categoryId,
            }
          : tx,
      ),
    }));

    setEditDialog({ open: false, tx: null, title: "", amount: "", date: todayISO(), note: "", categoryId: "" });
  };

  const deleteTransaction = (id: string) => {
    applyData((current) => ({ ...current, transactions: current.transactions.filter((tx) => tx.id !== id) }));
  };

  const deleteSavingGoal = (id: string) => {
    applyData((current) => ({
      ...current,
      savingsGoals: current.savingsGoals.filter((goal) => goal.id !== id),
      transactions: current.transactions.filter((tx) => !(tx.type === "saving" && tx.linkedId === id)),
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12" dir="rtl">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link href="/" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
              </Link>
              <ThemeToggle />
            </div>
            <h1 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Wallet className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
              الميزانيّة الشهرية
            </h1>          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
              <select
                value={selectedMonthNumber}
                onChange={(e) => {
                  const month = `${selectedYear}-${e.target.value}`;
                  setSelectedMonth(month);
                  setGoalTargetDate(endOfMonthISO(month));
                }}
                className="bg-transparent outline-none text-slate-800 dark:text-slate-100"
              >
                {MONTH_NAMES_EN.map((name, index) => {
                  const value = String(index + 1).padStart(2, "0");
                  return (
                    <option key={value} value={value}>
                      {name}
                    </option>
                  );
                })}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => {
                  const month = `${e.target.value}-${selectedMonthNumber}`;
                  setSelectedMonth(month);
                  setGoalTargetDate(endOfMonthISO(month));
                }}
                className="bg-transparent outline-none text-slate-800 dark:text-slate-100 tabular-nums mr-auto"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={data.settings.currency}
              onChange={(e) => applyData((current) => ({ ...current, settings: { ...current.settings, currency: e.target.value as BudgetData["settings"]["currency"] } }))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100"
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-5 md:pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          <SummaryCard title="دخل" amount={monthlyTotals.income} currency={data.settings.currency} tone="income" />
          <SummaryCard title="مصروفات" amount={monthlyTotals.expenses} currency={data.settings.currency} tone="expense" />
          <SummaryCard title="فواتير + ديون" amount={monthlyTotals.bills + monthlyTotals.debts} currency={data.settings.currency} tone="bill" />
          <SummaryCard title="ادخار" amount={monthlyTotals.savings} currency={data.settings.currency} tone="saving" />
          <SummaryCard title="الصافي" amount={monthlyTotals.net} currency={data.settings.currency} tone={monthlyTotals.net >= 0 ? "income" : "expense"} />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3 mb-5 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {(Object.keys(TAB_LABELS) as BudgetTab[]).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === tab ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}>
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
                <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-primary" />إضافة معاملة جديدة</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select value={transactionForm.type} onChange={(e) => configureTransactionType(e.target.value as BudgetTransactionType)} className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">{ADD_TRANSACTION_TYPES.map((type) => <option key={type} value={type}>{TRANSACTION_TYPE_LABEL[type]}</option>)}</select>
                  <select value={transactionForm.categoryId} onChange={(e) => setTransactionForm((prev) => ({ ...prev, categoryId: e.target.value }))} className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5"><option value="">اختر الفئة</option>{transactionCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select>
                  <input value={transactionForm.title} onChange={(e) => setTransactionForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="عنوان العملية" className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" />
                  <input type="number" min="0" value={transactionForm.amount} onChange={(e) => setTransactionForm((prev) => ({ ...prev, amount: e.target.value }))} placeholder={`المبلغ (${symbol})`} className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 tabular-nums" />
                  <input type="date" value={transactionForm.date} onChange={(e) => setTransactionForm((prev) => ({ ...prev, date: e.target.value }))} className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 tabular-nums" />
                  <input value={transactionForm.note} onChange={(e) => setTransactionForm((prev) => ({ ...prev, note: e.target.value }))} placeholder="ملاحظة (اختياري)" className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" />
                </div>
                <button onClick={saveTransaction} className="mt-3 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold">حفظ المعاملة</button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2"><PiggyBank className="w-4 h-4 text-emerald-500" />إضافة هدف ادخار</h3>
                <div className="grid grid-cols-1 gap-2">
                  <input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="اسم الهدف" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" />
                  <input type="number" min="0" value={goalTargetAmount} onChange={(e) => setGoalTargetAmount(e.target.value)} placeholder={`المبلغ المستهدف (${symbol})`} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 tabular-nums" />
                  <input type="date" value={goalTargetDate} onChange={(e) => setGoalTargetDate(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 tabular-nums" />
                </div>
                <button onClick={addSavingGoal} className="mt-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold">إضافة الهدف</button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">أهداف الادخار</h3>
                <div className="space-y-2.5">
                  {data.savingsGoals.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد أهداف ادخار بعد.</p>}
                  {data.savingsGoals.map((goal) => {
                    const saved = savingsByGoalId.get(goal.id) || 0;
                    const progress = goal.targetAmount > 0 ? Math.min(Math.round((saved / goal.targetAmount) * 100), 100) : 0;
                    return (
                      <div key={goal.id} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/40 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">{goal.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">الاستحقاق: {goal.targetDate}</p>
                          </div>
                          <button onClick={() => deleteSavingGoal(goal.id)} className="px-2 py-1 text-xs rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">حذف</button>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300">تم ادخار</span>
                          <span className="text-slate-700 dark:text-slate-200 tabular-nums">
                            <span className="inline-block tabular-nums whitespace-nowrap" style={{ direction: "ltr", unicodeBidi: "bidi-override" }}>
                              {formatAmount(saved, data.settings.currency)}
                            </span>
                            {" / "}
                            <span className="inline-block tabular-nums whitespace-nowrap" style={{ direction: "ltr", unicodeBidi: "bidi-override" }}>
                              {formatAmount(goal.targetAmount, data.settings.currency)}
                            </span>
                          </span>
                        </div>
                        <div className="mt-1.5 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.35 }} className="h-full bg-emerald-500" />
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-slate-500 dark:text-slate-400">{progress}%</span>
                          <button onClick={() => openSavingContributionDialog(goal)} className="px-2.5 py-1.5 rounded-lg bg-primary text-white text-xs">إضافة مساهمة</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">أكبر الفئات صرفا</h3>
                <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div className="flex justify-center">
                    <div
                      className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-900 shadow-inner"
                      style={{
                        background: `conic-gradient(#22c55e 0 ${Math.max(Math.round((expenseByCategory[0]?.total || 0) / Math.max(monthlyTotals.totalOutflow,1) * 360), 1)}deg, #3b82f6 ${Math.max(Math.round((expenseByCategory[0]?.total || 0) / Math.max(monthlyTotals.totalOutflow,1) * 360), 1)}deg ${Math.max(Math.round(((expenseByCategory[0]?.total || 0) + (expenseByCategory[1]?.total || 0)) / Math.max(monthlyTotals.totalOutflow,1) * 360), 2)}deg, #f59e0b ${Math.max(Math.round(((expenseByCategory[0]?.total || 0) + (expenseByCategory[1]?.total || 0)) / Math.max(monthlyTotals.totalOutflow,1) * 360), 2)}deg ${Math.max(Math.round(((expenseByCategory[0]?.total || 0) + (expenseByCategory[1]?.total || 0) + (expenseByCategory[2]?.total || 0)) / Math.max(monthlyTotals.totalOutflow,1) * 360), 3)}deg, #ef4444 ${Math.max(Math.round(((expenseByCategory[0]?.total || 0) + (expenseByCategory[1]?.total || 0) + (expenseByCategory[2]?.total || 0)) / Math.max(monthlyTotals.totalOutflow,1) * 360), 3)}deg 360deg)`,
                      }}
                    >
                      <div className="w-full h-full rounded-full flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-900" />
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    <p>عرض مرئي سريع لفئات الصرف الأعلى.</p>
                    <p className="mt-1">يساعدك على فهم توزيع المصروفات خلال الشهر دون تعقيد.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {expenseByCategory.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد بيانات في هذا الشهر.</p>}
                  {expenseByCategory.map((row) => {
                    const ratio = monthlyTotals.totalOutflow > 0 ? Math.round((row.total / monthlyTotals.totalOutflow) * 100) : 0;
                    return <div key={row.categoryId}><div className="flex items-center justify-between text-sm mb-1"><p className="font-medium text-slate-800 dark:text-slate-100">{row.name}</p><p className="text-slate-500 dark:text-slate-400 tabular-nums"><span className="inline-block tabular-nums whitespace-nowrap" style={{ direction: "ltr", unicodeBidi: "bidi-override" }}>{formatAmount(row.total, data.settings.currency)}</span> • {ratio}%</p></div><div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${ratio}%` }} transition={{ duration: 0.3 }} className="h-full bg-primary" /></div></div>;
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2"><CalendarClock className="w-4 h-4 text-blue-500" />آخر عمليات هذا الشهر</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                  <div className="relative md:col-span-2"><Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={recentSearch} onChange={(e) => setRecentSearch(e.target.value)} placeholder="ابحث عن عملية محددة" className="w-full pr-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" /></div>
                  <select value={recentFilter} onChange={(e) => setRecentFilter(e.target.value as typeof recentFilter)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5"><option value="all">الكل / أخرى</option><option value="income">دخل</option><option value="expense">مصروف</option><option value="bill_payment">فاتورة</option><option value="debt_payment">دين</option></select>
                </div>
                <div className="space-y-2.5 max-h-[520px] overflow-auto pr-1">
                  {recentTransactions.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد عمليات مطابقة.</p>}
                  {recentTransactions.map((tx) => {
                    const category = data.categories.find((c) => c.id === tx.categoryId);
                    return <div key={tx.id} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/40 p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-800 dark:text-slate-100">{tx.title}</p><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{TRANSACTION_TYPE_LABEL[tx.type]} • {category?.name || "غير مصنف"} • {tx.date}</p></div><p className={`font-bold tabular-nums ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}><span className="inline-block tabular-nums whitespace-nowrap" style={{ direction: "ltr", unicodeBidi: "bidi-override" }}>{formatAmount(tx.amount, data.settings.currency)}</span></p></div><div className="mt-2 flex items-center gap-2"><button onClick={() => openEditTransactionDialog(tx)} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs">تعديل</button><button onClick={() => deleteTransaction(tx.id)} className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-1"><Trash2 className="w-3 h-3" />حذف</button></div></div>;
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">تنبيهات قريبة</h3>
                <div className="space-y-2.5">
                  {upcomingWarnings.map((warning, index) => (
                    <div
                      key={`${warning.text}_${index}`}
                      className={`rounded-xl border px-3 py-2.5 text-sm ${
                        warning.tone === "danger"
                          ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                          : warning.tone === "warn"
                            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                      }`}
                    >
                      {warning.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">تخصيص الفئات</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <select value={categoryType} onChange={(e) => setCategoryType(e.target.value as BudgetCategoryType)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">{(Object.keys(TRANSACTION_TYPE_LABEL) as BudgetTransactionType[]).map((type) => <option key={type} value={type}>{TRANSACTION_TYPE_LABEL[type]}</option>)}</select>
                <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="أضف خيار مخصص" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" />
                <button onClick={addCategory} className="rounded-xl bg-primary text-white font-semibold px-4 py-2.5">إضافة فئة</button>
              </div>
            </div>

            {(Object.keys(TRANSACTION_TYPE_LABEL) as BudgetTransactionType[]).map((type) => <div key={type} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5"><h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3">{TRANSACTION_TYPE_LABEL[type]}</h4><div className="space-y-2">{categoriesByType[type].map((cat) => <div key={cat.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5 flex items-center justify-between gap-2">{editingCategoryId === cat.id ? <input value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5" /> : <p className="font-medium text-slate-800 dark:text-slate-100">{cat.name}</p>}<div className="flex items-center gap-1">{editingCategoryId === cat.id ? <button onClick={saveCategoryEdit} className="px-2 py-1 text-xs rounded-lg bg-primary text-white">حفظ</button> : <button onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); }} className="px-2 py-1 text-xs rounded-lg bg-slate-200 dark:bg-slate-700">تعديل</button>}<button onClick={() => deleteCategory(cat.id)} className="px-2 py-1 text-xs rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">حذف</button></div></div>)}{categoriesByType[type].length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد فئات في هذا القسم.</p>}</div></div>)}
          </div>
        )}
        {amountDialog.open && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeAmountDialog}>
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4" onClick={(e) => e.stopPropagation()}>
              <h4 className="font-bold text-slate-900 dark:text-slate-100">{amountDialog.title}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{amountDialog.subtitle}</p>
              <input type="number" min="0" value={amountDialog.amount} onChange={(e) => setAmountDialog((prev) => ({ ...prev, amount: e.target.value }))} placeholder={`المبلغ (${symbol})`} className="mt-3 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 tabular-nums" />
              <div className="mt-3 flex items-center gap-2">
                <button onClick={confirmAmountDialog} className="flex-1 rounded-xl bg-primary text-white font-semibold py-2.5">تأكيد</button>
                <button onClick={closeAmountDialog} className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-2.5">إلغاء</button>
              </div>

            </div>
          </div>
        )}

        {editDialog.open && editDialog.tx && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditDialog({ open: false, tx: null, title: "", amount: "", date: todayISO(), note: "", categoryId: "" })}>
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4" onClick={(e) => e.stopPropagation()}>
              <h4 className="font-bold text-slate-900 dark:text-slate-100">تعديل العملية</h4>
              <div className="grid grid-cols-1 gap-2 mt-3">
                <input value={editDialog.title} onChange={(e) => setEditDialog((prev) => ({ ...prev, title: e.target.value }))} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" />
                <input type="number" min="0" value={editDialog.amount} onChange={(e) => setEditDialog((prev) => ({ ...prev, amount: e.target.value }))} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 tabular-nums" />
                <input type="date" value={editDialog.date} onChange={(e) => setEditDialog((prev) => ({ ...prev, date: e.target.value }))} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 tabular-nums" />
                <select value={editDialog.categoryId} onChange={(e) => setEditDialog((prev) => ({ ...prev, categoryId: e.target.value }))} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                  {data.categories.filter((c) => c.type === editDialog.tx?.type).map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <input value={editDialog.note} onChange={(e) => setEditDialog((prev) => ({ ...prev, note: e.target.value }))} placeholder="ملاحظة" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={saveEditTransaction} className="flex-1 rounded-xl bg-primary text-white font-semibold py-2.5">حفظ</button>
                <button onClick={() => setEditDialog({ open: false, tx: null, title: "", amount: "", date: todayISO(), note: "", categoryId: "" })} className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-2.5">إلغاء</button>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  title,
  amount,
  currency,
  tone,
}: {
  title: string;
  amount: number;
  currency: BudgetData["settings"]["currency"];
  tone: "income" | "expense" | "bill" | "saving";
}) {
  const toneClass = {
    income: "text-emerald-600 dark:text-emerald-400",
    expense: "text-rose-600 dark:text-rose-400",
    bill: "text-amber-600 dark:text-amber-400",
    saving: "text-blue-600 dark:text-blue-400",
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3 md:p-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
      <p className={`text-base md:text-lg font-bold ${toneClass[tone]}`}>
        <span className="inline-block tabular-nums whitespace-nowrap" style={{ direction: "ltr", unicodeBidi: "bidi-override" }}>
          {formatAmount(amount, currency)}
        </span>
      </p>
    </div>
  );
}















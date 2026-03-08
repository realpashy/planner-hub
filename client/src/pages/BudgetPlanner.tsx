
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, CalendarClock, Landmark, PiggyBank, Plus, ReceiptText, Search, Trash2, Wallet } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  CURRENCY_OPTIONS,
  TRANSACTION_TYPE_LABEL,
  createBudgetId,
  formatAmount,
  getCurrencySymbol,
  getCurrentMonthKey,
  getMonthKey,
  getMonthlyTotals,
  getPreviousMonthKey,
  getUpcomingDaysCount,
  loadBudgetData,
  monthLabel,
  saveBudgetData,
  type BudgetCategory,
  type BudgetCategoryType,
  type BudgetData,
  type BudgetSavingGoal,
  type BudgetTransaction,
  type BudgetTransactionType,
} from "@/lib/budget";

type BudgetTab = "overview" | "transactions" | "categories" | "liabilities" | "savings";

const TAB_LABELS: Record<BudgetTab, string> = {
  overview: "نظرة عامة",
  transactions: "المعاملات",
  categories: "الفئات",
  liabilities: "الفواتير والديون",
  savings: "الادخار",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function emptyTransactionState(type: BudgetTransactionType = "expense") {
  return { id: "", type, title: "", amount: "", date: todayISO(), categoryId: "", note: "", linkedId: "" };
}

export default function BudgetPlanner() {
  const [data, setData] = useState<BudgetData>(() => loadBudgetData());
  const [activeTab, setActiveTab] = useState<BudgetTab>("overview");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());

  const [transactionForm, setTransactionForm] = useState(emptyTransactionState());
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  const [txSearch, setTxSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState<"all" | BudgetTransactionType>("all");
  const [txCategoryFilter, setTxCategoryFilter] = useState("all");

  const [categoryType, setCategoryType] = useState<BudgetCategoryType>("expense");
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const [billTitle, setBillTitle] = useState("");
  const [billDueDay, setBillDueDay] = useState("10");
  const [billAmount, setBillAmount] = useState("");
  const [billCategoryId, setBillCategoryId] = useState("");

  const [debtTitle, setDebtTitle] = useState("");
  const [debtDueDay, setDebtDueDay] = useState("15");
  const [debtTotalAmount, setDebtTotalAmount] = useState("");
  const [debtCategoryId, setDebtCategoryId] = useState("");

  const [goalTitle, setGoalTitle] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState(todayISO());

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

  const previousTotals = useMemo(
    () => getMonthlyTotals(data.transactions, getPreviousMonthKey(selectedMonth)),
    [data.transactions, selectedMonth],
  );

  const rolloverAmount = data.settings.rolloverEnabled ? Math.max(previousTotals.net, 0) : 0;
  const effectiveLimit = data.settings.monthlyLimit + rolloverAmount;
  const usedPercent = effectiveLimit > 0 ? Math.min(Math.round((monthlyTotals.totalOutflow / effectiveLimit) * 100), 999) : 0;
  const remainingBudget = effectiveLimit - monthlyTotals.totalOutflow;

  const categoriesByType = useMemo(() => ({
    income: data.categories.filter((c) => c.type === "income"),
    expense: data.categories.filter((c) => c.type === "expense"),
    bill_payment: data.categories.filter((c) => c.type === "bill_payment"),
    debt_payment: data.categories.filter((c) => c.type === "debt_payment"),
    saving: data.categories.filter((c) => c.type === "saving"),
  }), [data.categories]);

  const linkedOptions = useMemo(() => {
    if (transactionForm.type === "bill_payment") return data.bills.map((item) => ({ id: item.id, title: item.title }));
    if (transactionForm.type === "debt_payment") return data.debts.map((item) => ({ id: item.id, title: item.title }));
    if (transactionForm.type === "saving") return data.savingsGoals.map((item) => ({ id: item.id, title: item.title }));
    return [];
  }, [transactionForm.type, data.bills, data.debts, data.savingsGoals]);

  const transactionCategories = useMemo(
    () => data.categories.filter((c) => c.type === transactionForm.type),
    [data.categories, transactionForm.type],
  );
  const filteredTransactions = useMemo(() => {
    return currentMonthTransactions
      .filter((tx) => (txTypeFilter === "all" ? true : tx.type === txTypeFilter))
      .filter((tx) => (txCategoryFilter === "all" ? true : tx.categoryId === txCategoryFilter))
      .filter((tx) => {
        const q = txSearch.trim();
        if (!q) return true;
        return `${tx.title} ${tx.note}`.toLowerCase().includes(q.toLowerCase());
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [currentMonthTransactions, txTypeFilter, txCategoryFilter, txSearch]);

  const expenseByCategory = useMemo(() => {
    const categoryTotals = new Map<string, number>();
    for (const tx of currentMonthTransactions) {
      if (tx.type === "income") continue;
      categoryTotals.set(tx.categoryId, (categoryTotals.get(tx.categoryId) || 0) + tx.amount);
    }

    return Array.from(categoryTotals.entries())
      .map(([categoryId, total]) => {
        const category = data.categories.find((c) => c.id === categoryId);
        return { categoryId, name: category?.name || "غير مصنف", total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [currentMonthTransactions, data.categories]);

  const recentTransactions = useMemo(
    () => [...currentMonthTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [currentMonthTransactions],
  );

  const upcomingItems = useMemo(() => {
    const upcomingBills = data.bills
      .map((bill) => {
        const paid = currentMonthTransactions
          .filter((tx) => tx.type === "bill_payment" && tx.linkedId === bill.id)
          .reduce((sum, tx) => sum + tx.amount, 0);
        const remaining = Math.max(bill.expectedAmount - paid, 0);
        const days = getUpcomingDaysCount(bill.dueDay, selectedMonth);
        return { id: bill.id, kind: "فاتورة", title: bill.title, remaining, days };
      })
      .filter((item) => item.remaining > 0 && item.days >= 0 && item.days <= 7);

    const upcomingDebts = data.debts
      .map((debt) => {
        const paidTotal = data.transactions
          .filter((tx) => tx.type === "debt_payment" && tx.linkedId === debt.id)
          .reduce((sum, tx) => sum + tx.amount, 0);
        const remaining = Math.max(debt.totalAmount - paidTotal, 0);
        const days = getUpcomingDaysCount(debt.dueDay, selectedMonth);
        return { id: debt.id, kind: "دين", title: debt.title, remaining, days };
      })
      .filter((item) => item.remaining > 0 && item.days >= 0 && item.days <= 7);

    return [...upcomingBills, ...upcomingDebts].sort((a, b) => a.days - b.days).slice(0, 5);
  }, [data.bills, data.debts, data.transactions, currentMonthTransactions, selectedMonth]);

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

  const savingsByGoalId = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of data.transactions) {
      if (tx.type === "saving" && tx.linkedId) map.set(tx.linkedId, (map.get(tx.linkedId) || 0) + tx.amount);
    }
    return map;
  }, [data.transactions]);

  const configureTransactionType = (type: BudgetTransactionType) => {
    setTransactionForm((prev) => ({
      ...prev,
      type,
      categoryId: data.categories.find((c) => c.type === type)?.id || "",
      linkedId: "",
    }));
  };

  const saveTransaction = () => {
    const amount = Number(transactionForm.amount);
    if (!transactionForm.title.trim() || !Number.isFinite(amount) || amount <= 0 || !transactionForm.categoryId) return;

    const payload: BudgetTransaction = {
      id: editingTransactionId || createBudgetId(),
      type: transactionForm.type,
      title: transactionForm.title.trim(),
      amount,
      date: transactionForm.date,
      categoryId: transactionForm.categoryId,
      note: transactionForm.note.trim(),
      linkedId: transactionForm.linkedId || undefined,
    };

    applyData((current) => {
      const transactions = [...current.transactions];
      const idx = transactions.findIndex((tx) => tx.id === payload.id);
      if (idx >= 0) transactions[idx] = payload;
      else transactions.unshift(payload);
      return { ...current, transactions };
    });

    setEditingTransactionId(null);
    setTransactionForm(emptyTransactionState(transactionForm.type));
  };

  const startEditTransaction = (tx: BudgetTransaction) => {
    setEditingTransactionId(tx.id);
    setTransactionForm({
      id: tx.id,
      type: tx.type,
      title: tx.title,
      amount: String(tx.amount),
      date: tx.date,
      categoryId: tx.categoryId,
      note: tx.note,
      linkedId: tx.linkedId || "",
    });
    setActiveTab("transactions");
  };

  const removeTransaction = (id: string) => {
    applyData((current) => ({ ...current, transactions: current.transactions.filter((tx) => tx.id !== id) }));
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

  const addBill = () => {
    const dueDay = Number(billDueDay);
    const amount = Number(billAmount);
    if (!billTitle.trim() || !billCategoryId || !Number.isFinite(dueDay) || dueDay < 1 || dueDay > 31 || !Number.isFinite(amount) || amount <= 0) return;

    applyData((current) => ({
      ...current,
      bills: [{ id: createBudgetId(), title: billTitle.trim(), dueDay, expectedAmount: amount, categoryId: billCategoryId }, ...current.bills],
    }));

    setBillTitle("");
    setBillAmount("");
  };

  const addDebt = () => {
    const dueDay = Number(debtDueDay);
    const totalAmount = Number(debtTotalAmount);
    if (!debtTitle.trim() || !debtCategoryId || !Number.isFinite(dueDay) || dueDay < 1 || dueDay > 31 || !Number.isFinite(totalAmount) || totalAmount <= 0) return;

    applyData((current) => ({
      ...current,
      debts: [{ id: createBudgetId(), title: debtTitle.trim(), dueDay, totalAmount, categoryId: debtCategoryId }, ...current.debts],
    }));

    setDebtTitle("");
    setDebtTotalAmount("");
  };

  const quickRegisterPayment = (type: "bill_payment" | "debt_payment", linkedId: string, title: string, categoryId: string, amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    applyData((current) => ({
      ...current,
      transactions: [{ id: createBudgetId(), type, title, amount, date: todayISO(), categoryId, note: "دفعة سريعة", linkedId }, ...current.transactions],
    }));
  };

  const addSavingGoal = () => {
    const targetAmount = Number(goalTargetAmount);
    if (!goalTitle.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0 || !goalTargetDate) return;

    applyData((current) => ({
      ...current,
      savingsGoals: [{ id: createBudgetId(), title: goalTitle.trim(), targetAmount, targetDate: goalTargetDate }, ...current.savingsGoals],
    }));

    setGoalTitle("");
    setGoalTargetAmount("");
  };

  const addContribution = (goal: BudgetSavingGoal) => {
    const raw = window.prompt("أدخل مبلغ المساهمة", "100");
    const amount = Number(raw);
    const categoryId = categoriesByType.saving[0]?.id;
    if (!Number.isFinite(amount) || amount <= 0 || !categoryId) return;

    applyData((current) => ({
      ...current,
      transactions: [{ id: createBudgetId(), type: "saving", title: `مساهمة: ${goal.title}`, amount, date: todayISO(), categoryId, note: "إضافة إلى هدف", linkedId: goal.id }, ...current.transactions],
    }));
  };

  const symbol = getCurrencySymbol(data.settings.currency);

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
              الميزانية
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-semibold">{monthLabel(selectedMonth)}</p>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 tabular-nums" />
            <select value={data.settings.currency} onChange={(e) => applyData((current) => ({ ...current, settings: { ...current.settings, currency: e.target.value as BudgetData["settings"]["currency"] } }))} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100">
              {CURRENCY_OPTIONS.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
            </select>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
              <label className="text-sm text-slate-600 dark:text-slate-300">سقف الشهر</label>
              <input type="number" min="0" value={data.settings.monthlyLimit} onChange={(e) => applyData((current) => ({ ...current, settings: { ...current.settings, monthlyLimit: Math.max(Number(e.target.value || 0), 0) } }))} className="flex-1 bg-transparent outline-none text-slate-800 dark:text-slate-100 tabular-nums" />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input id="rollover" type="checkbox" checked={data.settings.rolloverEnabled} onChange={(e) => applyData((current) => ({ ...current, settings: { ...current.settings, rolloverEnabled: e.target.checked } }))} className="w-4 h-4 rounded" />
            <label htmlFor="rollover" className="text-sm text-slate-600 dark:text-slate-300">تفعيل الترحيل من الشهر السابق ({formatAmount(rolloverAmount, data.settings.currency)})</label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-5 md:pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          <SummaryCard title="دخل" value={formatAmount(monthlyTotals.income, data.settings.currency)} tone="income" />
          <SummaryCard title="مصروفات" value={formatAmount(monthlyTotals.expenses, data.settings.currency)} tone="expense" />
          <SummaryCard title="فواتير + ديون" value={formatAmount(monthlyTotals.bills + monthlyTotals.debts, data.settings.currency)} tone="bill" />
          <SummaryCard title="ادخار" value={formatAmount(monthlyTotals.savings, data.settings.currency)} tone="saving" />
          <SummaryCard title="الصافي" value={formatAmount(monthlyTotals.net, data.settings.currency)} tone={monthlyTotals.net >= 0 ? "income" : "expense"} />
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5 h-fit">
            <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-primary" />{editingTransactionId ? "تعديل معاملة" : "إضافة معاملة سريعة"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={transactionForm.type} onChange={(e) => configureTransactionType(e.target.value as BudgetTransactionType)} className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                {(Object.keys(TRANSACTION_TYPE_LABEL) as BudgetTransactionType[]).map((type) => <option key={type} value={type}>{TRANSACTION_TYPE_LABEL[type]}</option>)}
              </select>
              <select value={transactionForm.categoryId} onChange={(e) => setTransactionForm((prev) => ({ ...prev, categoryId: e.target.value }))} className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                <option value="">اختر الفئة</option>
                {transactionCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <input value={transactionForm.title} onChange={(e) => setTransactionForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="عنوان المعاملة" className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" />
              <input type="number" min="0" value={transactionForm.amount} onChange={(e) => setTransactionForm((prev) => ({ ...prev, amount: e.target.value }))} placeholder={`المبلغ (${symbol})`} className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 tabular-nums" />
              <input type="date" value={transactionForm.date} onChange={(e) => setTransactionForm((prev) => ({ ...prev, date: e.target.value }))} className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 tabular-nums" />
              <input value={transactionForm.note} onChange={(e) => setTransactionForm((prev) => ({ ...prev, note: e.target.value }))} placeholder="ملاحظة (اختياري)" className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" />
              {linkedOptions.length > 0 && (
                <select value={transactionForm.linkedId} onChange={(e) => setTransactionForm((prev) => ({ ...prev, linkedId: e.target.value }))} className="sm:col-span-2 bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                  <option value="">بدون ربط مباشر</option>
                  {linkedOptions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button onClick={saveTransaction} className="px-4 py-2.5 rounded-xl bg-primary text-white font-semibold">{editingTransactionId ? "حفظ التعديل" : "إضافة"}</button>
              {editingTransactionId && <button onClick={() => { setEditingTransactionId(null); setTransactionForm(emptyTransactionState()); }} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">إلغاء</button>}
            </div>
          </div>

          <div className="lg:col-span-7">
            {activeTab === "overview" && (
              <div className="space-y-5">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">الميزانية الشهرية</h3>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(usedPercent, 100)}%` }} transition={{ duration: 0.35 }} className={`h-full rounded-full ${usedPercent <= 80 ? "bg-emerald-500" : usedPercent <= 100 ? "bg-amber-500" : "bg-rose-500"}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <InfoCell title="السقف الفعلي" value={formatAmount(effectiveLimit, data.settings.currency)} />
                    <InfoCell title="إجمالي الصرف" value={formatAmount(monthlyTotals.totalOutflow, data.settings.currency)} />
                    <InfoCell title="المتبقي" value={formatAmount(remainingBudget, data.settings.currency)} tone={remainingBudget >= 0 ? "ok" : "danger"} />
                    <InfoCell title="نسبة الاستخدام" value={`${usedPercent}%`} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">أكبر الفئات صرفا</h3>
                  <div className="space-y-3">
                    {expenseByCategory.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد بيانات في هذا الشهر.</p>}
                    {expenseByCategory.map((row) => {
                      const ratio = monthlyTotals.totalOutflow > 0 ? Math.round((row.total / monthlyTotals.totalOutflow) * 100) : 0;
                      return (
                        <div key={row.categoryId}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <p className="font-medium text-slate-800 dark:text-slate-100">{row.name}</p>
                            <p className="text-slate-500 dark:text-slate-400 tabular-nums">{formatAmount(row.total, data.settings.currency)} • {ratio}%</p>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${ratio}%` }} transition={{ duration: 0.3 }} className="h-full bg-primary" /></div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">تنبيهات قريبة</h3>
                  <div className="space-y-2.5">
                    {upcomingItems.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">لا يوجد استحقاق خلال 7 أيام.</p>}
                    {upcomingItems.map((item) => (
                      <div key={`${item.kind}-${item.id}`} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 flex items-center justify-between"><div><p className="font-semibold text-slate-800 dark:text-slate-100">{item.kind}: {item.title}</p><p className="text-sm text-slate-500 dark:text-slate-400">بعد {item.days} يوم</p></div><p className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">{formatAmount(item.remaining, data.settings.currency)}</p></div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab === "transactions" && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                  <div className="relative md:col-span-2"><Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={txSearch} onChange={(e) => setTxSearch(e.target.value)} placeholder="بحث في العنوان أو الملاحظة" className="w-full pr-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" /></div>
                  <select value={txTypeFilter} onChange={(e) => setTxTypeFilter(e.target.value as typeof txTypeFilter)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5"><option value="all">كل الأنواع</option>{(Object.keys(TRANSACTION_TYPE_LABEL) as BudgetTransactionType[]).map((type) => <option key={type} value={type}>{TRANSACTION_TYPE_LABEL[type]}</option>)}</select>
                </div>
                <div className="mb-3"><select value={txCategoryFilter} onChange={(e) => setTxCategoryFilter(e.target.value)} className="w-full md:w-64 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5"><option value="all">كل الفئات</option>{data.categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></div>
                <div className="space-y-2.5 max-h-[620px] overflow-auto pr-1">
                  {filteredTransactions.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد معاملات مطابقة.</p>}
                  {filteredTransactions.map((tx) => {
                    const category = data.categories.find((c) => c.id === tx.categoryId);
                    return <div key={tx.id} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/40 p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-800 dark:text-slate-100">{tx.title}</p><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{TRANSACTION_TYPE_LABEL[tx.type]} • {category?.name || "غير مصنف"} • {tx.date}</p>{tx.note && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tx.note}</p>}</div><div className="text-left"><p className={`font-bold tabular-nums ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{formatAmount(tx.amount, data.settings.currency)}</p><div className="mt-1 flex items-center justify-end gap-1"><button onClick={() => startEditTransaction(tx)} className="px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">تعديل</button><button onClick={() => removeTransaction(tx.id)} className="px-2 py-1 text-xs rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">حذف</button></div></div></div></div>;
                  })}
                </div>
              </div>
            )}

            {activeTab === "categories" && (
              <div className="space-y-5">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5"><h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">إضافة فئة جديدة</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-2"><select value={categoryType} onChange={(e) => setCategoryType(e.target.value as BudgetCategoryType)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">{(Object.keys(TRANSACTION_TYPE_LABEL) as BudgetTransactionType[]).map((type) => <option key={type} value={type}>{TRANSACTION_TYPE_LABEL[type]}</option>)}</select><input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="اسم الفئة" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" /><button onClick={addCategory} className="rounded-xl bg-primary text-white font-semibold px-4 py-2.5">إضافة</button></div></div>
                {(Object.keys(TRANSACTION_TYPE_LABEL) as BudgetTransactionType[]).map((type) => <div key={type} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5"><h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3">{TRANSACTION_TYPE_LABEL[type]}</h4><div className="space-y-2">{categoriesByType[type].map((cat) => <div key={cat.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5 flex items-center justify-between gap-2">{editingCategoryId === cat.id ? <input value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5" /> : <p className="font-medium text-slate-800 dark:text-slate-100">{cat.name}</p>}<div className="flex items-center gap-1">{editingCategoryId === cat.id ? <button onClick={saveCategoryEdit} className="px-2 py-1 text-xs rounded-lg bg-primary text-white">حفظ</button> : <button onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); }} className="px-2 py-1 text-xs rounded-lg bg-slate-200 dark:bg-slate-700">تعديل</button>}<button onClick={() => deleteCategory(cat.id)} className="px-2 py-1 text-xs rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">حذف</button></div></div>)}{categoriesByType[type].length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد فئات في هذا القسم.</p>}</div></div>)}
              </div>
            )}

            {activeTab === "liabilities" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5"><h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2"><ReceiptText className="w-4 h-4 text-amber-500" />إضافة فاتورة</h3><div className="space-y-2"><input value={billTitle} onChange={(e) => setBillTitle(e.target.value)} placeholder="اسم الفاتورة" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" /><div className="grid grid-cols-2 gap-2"><input type="number" min="1" max="31" value={billDueDay} onChange={(e) => setBillDueDay(e.target.value)} placeholder="يوم الاستحقاق" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" /><input type="number" min="0" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} placeholder={`المبلغ (${symbol})`} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" /></div><select value={billCategoryId} onChange={(e) => setBillCategoryId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5"><option value="">اختر فئة الفاتورة</option>{categoriesByType.bill_payment.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select><button onClick={addBill} className="w-full rounded-xl bg-primary text-white font-semibold px-4 py-2.5">إضافة فاتورة</button></div></div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5"><h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2"><Landmark className="w-4 h-4 text-rose-500" />إضافة دين</h3><div className="space-y-2"><input value={debtTitle} onChange={(e) => setDebtTitle(e.target.value)} placeholder="اسم الدين" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" /><div className="grid grid-cols-2 gap-2"><input type="number" min="1" max="31" value={debtDueDay} onChange={(e) => setDebtDueDay(e.target.value)} placeholder="يوم الاستحقاق" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" /><input type="number" min="0" value={debtTotalAmount} onChange={(e) => setDebtTotalAmount(e.target.value)} placeholder={`إجمالي الدين (${symbol})`} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" /></div><select value={debtCategoryId} onChange={(e) => setDebtCategoryId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5"><option value="">اختر فئة الدين</option>{categoriesByType.debt_payment.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select><button onClick={addDebt} className="w-full rounded-xl bg-primary text-white font-semibold px-4 py-2.5">إضافة دين</button></div></div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5"><h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">قائمة الفواتير</h3><div className="space-y-2.5">{data.bills.map((bill) => { const paid = billPaymentsById.get(bill.id) || 0; const remaining = Math.max(bill.expectedAmount - paid, 0); const progress = bill.expectedAmount > 0 ? Math.min(Math.round((paid / bill.expectedAmount) * 100), 100) : 0; return <div key={bill.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3"><div className="flex items-start justify-between"><div><p className="font-semibold text-slate-800 dark:text-slate-100">{bill.title}</p><p className="text-xs text-slate-500 dark:text-slate-400">استحقاق يوم {bill.dueDay} • متبقي {formatAmount(remaining, data.settings.currency)}</p></div><button onClick={() => applyData((current) => ({ ...current, bills: current.bills.filter((b) => b.id !== bill.id) }))} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button></div><div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2"><div className="h-full bg-amber-500" style={{ width: `${progress}%` }} /></div><button onClick={() => { const raw = window.prompt("أدخل مبلغ الدفعة", String(Math.max(remaining, 0))); const amount = Number(raw); if (Number.isFinite(amount) && amount > 0) quickRegisterPayment("bill_payment", bill.id, bill.title, bill.categoryId, amount); }} className="mt-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold">تسجيل دفعة</button></div>; })}{data.bills.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد فواتير حتى الآن.</p>}</div></div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5"><h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">قائمة الديون</h3><div className="space-y-2.5">{data.debts.map((debt) => { const paid = debtPaymentsById.get(debt.id) || 0; const remaining = Math.max(debt.totalAmount - paid, 0); const progress = debt.totalAmount > 0 ? Math.min(Math.round((paid / debt.totalAmount) * 100), 100) : 0; return <div key={debt.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3"><div className="flex items-start justify-between"><div><p className="font-semibold text-slate-800 dark:text-slate-100">{debt.title}</p><p className="text-xs text-slate-500 dark:text-slate-400">استحقاق يوم {debt.dueDay} • متبقي {formatAmount(remaining, data.settings.currency)}</p></div><button onClick={() => applyData((current) => ({ ...current, debts: current.debts.filter((d) => d.id !== debt.id) }))} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button></div><div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2"><div className="h-full bg-rose-500" style={{ width: `${progress}%` }} /></div><button onClick={() => { const raw = window.prompt("أدخل مبلغ السداد", String(Math.max(remaining, 0))); const amount = Number(raw); if (Number.isFinite(amount) && amount > 0) quickRegisterPayment("debt_payment", debt.id, debt.title, debt.categoryId, amount); }} className="mt-2 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-semibold">تسجيل سداد</button></div>; })}{data.debts.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد ديون حتى الآن.</p>}</div></div>
                </div>
              </div>
            )}

            {activeTab === "savings" && (
              <div className="space-y-5">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5"><h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2"><PiggyBank className="w-4 h-4 text-emerald-500" />إضافة هدف ادخار</h3><div className="grid grid-cols-1 md:grid-cols-4 gap-2"><input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="اسم الهدف" className="md:col-span-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" /><input type="number" min="0" value={goalTargetAmount} onChange={(e) => setGoalTargetAmount(e.target.value)} placeholder={`المبلغ المستهدف (${symbol})`} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" /><input type="date" value={goalTargetDate} onChange={(e) => setGoalTargetDate(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" /></div><button onClick={addSavingGoal} className="mt-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold">إضافة الهدف</button></div>
                <div className="space-y-2.5">{data.savingsGoals.map((goal) => { const saved = savingsByGoalId.get(goal.id) || 0; const remaining = Math.max(goal.targetAmount - saved, 0); const progress = goal.targetAmount > 0 ? Math.min(Math.round((saved / goal.targetAmount) * 100), 100) : 0; return <div key={goal.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5"><div className="flex items-start justify-between"><div><h4 className="font-bold text-slate-900 dark:text-slate-100">{goal.title}</h4><p className="text-sm text-slate-500 dark:text-slate-400">تاريخ الهدف: {goal.targetDate}</p></div><button onClick={() => applyData((current) => ({ ...current, savingsGoals: current.savingsGoals.filter((g) => g.id !== goal.id) }))} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button></div><div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm"><InfoCell title="المستهدف" value={formatAmount(goal.targetAmount, data.settings.currency)} /><InfoCell title="المحفوظ" value={formatAmount(saved, data.settings.currency)} /><InfoCell title="المتبقي" value={formatAmount(remaining, data.settings.currency)} /><InfoCell title="الإنجاز" value={`${progress}%`} /></div><div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-3"><div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} /></div><button onClick={() => addContribution(goal)} className="mt-3 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">إضافة مساهمة</button></div>; })}{data.savingsGoals.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد أهداف ادخار بعد.</p>}</div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2"><CalendarClock className="w-4 h-4 text-blue-500" />آخر عمليات هذا الشهر</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {recentTransactions.map((tx) => <div key={tx.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3"><p className="font-semibold text-slate-800 dark:text-slate-100">{tx.title}</p><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{TRANSACTION_TYPE_LABEL[tx.type]} • {tx.date}</p><p className={`mt-2 font-bold tabular-nums ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{tx.type === "income" ? "+" : "-"}{formatAmount(tx.amount, data.settings.currency)}</p></div>)}
            {recentTransactions.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد عمليات بعد.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ title, value, tone }: { title: string; value: string; tone: "income" | "expense" | "bill" | "saving" }) {
  const toneClass = { income: "text-emerald-600 dark:text-emerald-400", expense: "text-rose-600 dark:text-rose-400", bill: "text-amber-600 dark:text-amber-400", saving: "text-blue-600 dark:text-blue-400" };
  return <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3 md:p-4"><p className="text-sm text-slate-500 dark:text-slate-400">{title}</p><p className={`text-base md:text-lg font-bold tabular-nums ${toneClass[tone]}`}>{value}</p></div>;
}

function InfoCell({ title, value, tone = "default" }: { title: string; value: string; tone?: "default" | "ok" | "danger" }) {
  const toneClass = tone === "ok" ? "text-emerald-600 dark:text-emerald-400" : tone === "danger" ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-slate-100";
  return <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5"><p className="text-xs text-slate-500 dark:text-slate-400">{title}</p><p className={`font-bold tabular-nums ${toneClass}`}>{value}</p></div>;
}

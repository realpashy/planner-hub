
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, CalendarClock, Landmark, PiggyBank, Plus, ReceiptText, Search, TrendingUp, Wallet } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "@/hooks/use-toast";
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
  type BudgetRecurringTemplate,
  type BudgetSavingGoal,
  type BudgetTransaction,
  type BudgetTransactionType,
} from "@/lib/budget";

type BudgetTab = "overview" | "categories";

const TAB_LABELS: Record<BudgetTab, string> = {
  overview: "نظرة عامة",
  categories: "إعدادات الفئات",
};


const ADD_TRANSACTION_TYPES: BudgetTransactionType[] = ["income", "expense", "bill_payment", "debt_payment"];

const RECURRING_ELIGIBLE_TYPES: Array<Exclude<BudgetTransactionType, "saving">> = ["income", "expense", "bill_payment", "debt_payment"];
const TYPE_EMOJI: Record<BudgetTransactionType, string> = { income: "💼", expense: "🛍️", bill_payment: "🧾", debt_payment: "🏦", saving: "🏦" };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function endOfMonthISO(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(y, m, 0);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function normalizeDigits(value: string) {
  return value
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

function parseAmountInput(value: string): number {
  const normalized = normalizeDigits(value).replace(/[₪$€,\s]/g, "").replace(/[−–—]/g, "-").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function emptyTransactionState(type: BudgetTransactionType = "income", categoryId = "") {
  return { id: "", type, title: "", amount: "", date: todayISO(), categoryId, note: "", linkedId: "" };
}

function pickDefaultCategoryId(categories: BudgetCategory[], type: BudgetTransactionType) {
  if (type === "income") {
    return categories.find((c) => c.type === "income" && c.name.includes("راتب"))?.id
      || categories.find((c) => c.type === "income")?.id
      || "";
  }
  return categories.find((c) => c.type === type)?.id || "";
}

function pickDefaultCategoryName(categories: BudgetCategory[], type: BudgetTransactionType) {
  if (type === "income") {
    return categories.find((c) => c.type === "income" && c.name.includes("راتب"))?.name
      || categories.find((c) => c.type === "income")?.name
      || "";
  }
  return categories.find((c) => c.type === type)?.name || "";
}
function clampDay(day: number, monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const last = new Date(year, month, 0).getDate();
  return Math.max(1, Math.min(day, last));
}

function monthLessThan(a: string, b: string) {
  return a < b;
}

function categoryEmoji(name: string, type: BudgetTransactionType) {
  const n = name.toLowerCase();
  if (type === "income") {
    if (n.includes("راتب")) return "💼";
    if (n.includes("إضافي") || n.includes("حر")) return "🧑‍💻";
    if (n.includes("استثمار") || n.includes("أرباح")) return "📈";
    return "💰";
  }
  if (type === "bill_payment") {
    if (n.includes("كهرب")) return "⚡";
    if (n.includes("ماء")) return "💧";
    if (n.includes("إنترنت") || n.includes("اتصال")) return "🌐";
    if (n.includes("إيجار")) return "🏠";
    return "🧾";
  }
  if (type === "debt_payment") {
    if (n.includes("بطاق")) return "💳";
    if (n.includes("قرض")) return "🏦";
    return "📉";
  }
  if (type === "saving") {
    if (n.includes("طوارئ")) return "🛟";
    if (n.includes("سفر")) return "✈️";
    if (n.includes("بيت") || n.includes("منزل")) return "🏡";
    return "🏦";
  }
  if (n.includes("طعام") || n.includes("مطعم") || n.includes("قهوة") || n.includes("سوبر")) return "🍽️";
  if (n.includes("مواصل") || n.includes("وقود") || n.includes("بنزين") || n.includes("سيارة")) return "🚗";
  if (n.includes("صحة") || n.includes("دواء") || n.includes("طب")) return "🩺";
  if (n.includes("ترفيه") || n.includes("هواية") || n.includes("لعب")) return "🎮";
  if (n.includes("ملابس") || n.includes("موضة")) return "👕";
  if (n.includes("تعليم") || n.includes("دورة")) return "📚";
  return "🧩";
}



function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function describeArcPath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}
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
  amount: string;
  date: string;
  note: string;
  categoryId: string;
}

type EditApplyScope = "current" | "all";

function isRecurringTransaction(tx: BudgetTransaction | null | undefined) {
  if (!tx) return false;
  return Boolean(tx.recurringTemplateId || tx.linkedId);
}

export default function BudgetPlanner() {
  const [data, setData] = useState<BudgetData>(() => loadBudgetData());
  const [activeTab, setActiveTab] = useState<BudgetTab>("overview");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());

  const [transactionForm, setTransactionForm] = useState(() => emptyTransactionState("income", pickDefaultCategoryId(loadBudgetData().categories, "income")));
  const [isRecurring, setIsRecurring] = useState(false);
  const [transactionCategoryText, setTransactionCategoryText] = useState("");

  const [categoryType, setCategoryType] = useState<BudgetCategoryType>("expense");
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const [goalTitle, setGoalTitle] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [aiInfoOpen, setAiInfoOpen] = useState(false);

  const [recentSearch, setRecentSearch] = useState("");
  const [recentFilter, setRecentFilter] = useState<"all" | "other" | BudgetTransactionType>("all");

  const [operationActionsTx, setOperationActionsTx] = useState<BudgetTransaction | null>(null);
  const [hoveredOverviewSegment, setHoveredOverviewSegment] = useState<string | null>(null);

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
    amount: "",
    date: todayISO(),
    note: "",
    categoryId: "",
  });
  const [editApplyScope, setEditApplyScope] = useState<EditApplyScope>("current");

  const pushNotice = (message: string) => {
    toast({ description: message, duration: 3000 });
  };

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
      .filter((tx) => recentFilter === "all" ? true : recentFilter === "other" ? tx.type === "saving" : tx.type === recentFilter)
      .filter((tx) => {
        const q = recentSearch.trim().toLowerCase();
        if (!q) return true;
        const categoryNameText = data.categories.find((c) => c.id === tx.categoryId)?.name || "";
        return `${categoryNameText} ${tx.note} ${tx.amount}`.toLowerCase().includes(q);
      })
      .slice(0, 60);
  }, [currentMonthTransactions, recentFilter, recentSearch, data.categories]);

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
        emoji: categoryEmoji(data.categories.find((c) => c.id === categoryId)?.name || "", data.categories.find((c) => c.id === categoryId)?.type || "expense"),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [currentMonthTransactions, data.categories]);

  const overviewSegments = useMemo(() => {
    if (expenseByCategory.length === 0 || monthlyTotals.totalOutflow <= 0) return [];
    const top = expenseByCategory.slice(0, 4);
    const topTotal = top.reduce((sum, row) => sum + row.total, 0);
    const remainder = Math.max(monthlyTotals.totalOutflow - topTotal, 0);
    const base = top.map((row, index) => ({
      id: row.categoryId,
      name: row.name,
      emoji: row.emoji,
      total: row.total,
      percent: Math.max(1, Math.round((row.total / monthlyTotals.totalOutflow) * 100)),
      color: ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"][index] || "#6366f1",
    }));

    if (remainder > 0) {
      base.push({
        id: "other",
        name: "فئات أخرى",
        emoji: "🧩",
        total: remainder,
        percent: Math.max(1, Math.round((remainder / monthlyTotals.totalOutflow) * 100)),
        color: "#8b5cf6",
      });
    }
    return base;
  }, [expenseByCategory, monthlyTotals.totalOutflow]);

  const donutSegments = useMemo(() => {
    if (!overviewSegments.length) return [];
    const total = overviewSegments.reduce((sum, segment) => sum + segment.total, 0);
    if (!total) return [];

    let currentAngle = -90;
    return overviewSegments.map((segment) => {
      const span = Math.max((segment.total / total) * 360, 2);
      const rawStart = currentAngle;
      const rawEnd = Math.min(currentAngle + span, 270);
      const gap = span > 8 ? 1.2 : 0.4;
      const startAngle = rawStart + gap / 2;
      const endAngle = rawEnd - gap / 2;
      currentAngle = rawEnd;
      return { ...segment, startAngle, endAngle };
    });
  }, [overviewSegments]);

  const activeOverviewSegment = hoveredOverviewSegment
    ? donutSegments.find((segment) => segment.id === hoveredOverviewSegment) || null
    : null;
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
  }, [monthlyTotals, data.bills, data.debts, billPaymentsById, debtPaymentsById, selectedMonth, expenseByCategory, data.settings.currency]);

  const symbol = getCurrencySymbol(data.settings.currency);
  const locale = typeof document !== "undefined" && document.documentElement.lang
    ? document.documentElement.lang
    : typeof navigator !== "undefined"
      ? navigator.language
      : "ar";
  const selectClassName = "budget-field budget-modern-select modern-select appearance-none rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 bg-[#F9FAFB] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 transition";
  const inputClassName = "budget-field rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 bg-[#F9FAFB] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700";
  const localizedMonthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1));
  }, [selectedMonth, locale]);
  const monthOptions = useMemo(() => {
    const [year] = selectedMonth.split("-").map(Number);
    const items: Array<{ value: string; label: string }> = [];
    for (let y = year - 2; y <= year + 2; y += 1) {
      for (let m = 1; m <= 12; m += 1) {
        const value = `${y}-${String(m).padStart(2, "0")}`;
        const label = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1));
        items.push({ value, label });
      }
    }
    return items;
  }, [locale, selectedMonth]);

  const ensureRecurringForMonth = (current: BudgetData, monthKey: string): BudgetData => {
    const newTransactions: BudgetTransaction[] = [];

    for (const template of current.recurringTemplates) {
      if (monthLessThan(monthKey, template.startMonth)) continue;
      if (template.skippedMonths?.includes(monthKey)) continue;
      const exists = current.transactions.some((tx) => tx.recurringTemplateId === template.id && getMonthKey(tx.date) === monthKey);
      if (exists) continue;

      const date = `${monthKey}-${String(clampDay(template.dayOfMonth, monthKey)).padStart(2, "0")}`;
      const title = current.categories.find((c) => c.id === template.categoryId)?.name || TRANSACTION_TYPE_LABEL[template.type];
      newTransactions.push({
        id: createBudgetId(),
        type: template.type,
        title,
        amount: template.amount,
        date,
        categoryId: template.categoryId,
        note: template.note || "معاملة شهرية تلقائية",
        recurringTemplateId: template.id,
      });
    }

    for (const bill of current.bills) {
      const skipped = (bill as BudgetData["bills"][number] & { skippedMonths?: string[] }).skippedMonths || [];
      if (skipped.includes(monthKey)) continue;
      const exists = current.transactions.some((tx) => tx.type === "bill_payment" && tx.linkedId === bill.id && getMonthKey(tx.date) === monthKey);
      if (exists) continue;

      const date = `${monthKey}-${String(clampDay(bill.dueDay, monthKey)).padStart(2, "0")}`;
      newTransactions.push({
        id: createBudgetId(),
        type: "bill_payment",
        title: current.categories.find((c) => c.id === bill.categoryId)?.name || "فاتورة",
        amount: bill.expectedAmount,
        date,
        categoryId: bill.categoryId,
        note: "دفعة شهرية تلقائية",
        linkedId: bill.id,
      });
    }

    for (const debt of current.debts) {
      const skipped = (debt as BudgetData["debts"][number] & { skippedMonths?: string[] }).skippedMonths || [];
      if (skipped.includes(monthKey)) continue;
      const exists = current.transactions.some((tx) => tx.type === "debt_payment" && tx.linkedId === debt.id && getMonthKey(tx.date) === monthKey);
      if (exists) continue;

      const date = `${monthKey}-${String(clampDay(debt.dueDay, monthKey)).padStart(2, "0")}`;
      newTransactions.push({
        id: createBudgetId(),
        type: "debt_payment",
        title: current.categories.find((c) => c.id === debt.categoryId)?.name || "دين",
        amount: debt.totalAmount,
        date,
        categoryId: debt.categoryId,
        note: "دفعة شهرية تلقائية",
        linkedId: debt.id,
      });
    }

    if (!newTransactions.length) return current;
    return { ...current, transactions: [...newTransactions, ...current.transactions] };
  };

  useEffect(() => {
    applyData((current) => ensureRecurringForMonth(current, selectedMonth));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const configureTransactionType = (type: BudgetTransactionType) => {
    setTransactionForm((prev) => ({
      ...prev,
      type,
      categoryId: pickDefaultCategoryId(data.categories, type),
    }));
    setIsRecurring(false);
    setTransactionCategoryText("");
  };

  const openAiInfo = () => {
    setAiInfoOpen(true);
  };

  const commitTransaction = (form: typeof transactionForm, recurring: boolean, successMessage?: string) => {
    const amount = parseAmountInput(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const date = todayISO();
    const categoryInput = form.title.trim();
    let successCategoryName = categoryInput || TRANSACTION_TYPE_LABEL[form.type];

    applyData((current) => {
      let next = { ...current };
      const foundCategory = current.categories.find((c) => c.type === form.type && c.name.trim().toLowerCase() === categoryInput.toLowerCase());
      let resolvedCategory = foundCategory || (form.categoryId ? current.categories.find((c) => c.id === form.categoryId) : undefined);

      if (!resolvedCategory) {
        const fallbackName = categoryInput || pickDefaultCategoryName(current.categories, form.type) || TRANSACTION_TYPE_LABEL[form.type];
        const newCategory: BudgetCategory = { id: createBudgetId(), type: form.type, name: fallbackName };
        next = { ...next, categories: [newCategory, ...next.categories] };
        resolvedCategory = newCategory;
      }

      successCategoryName = resolvedCategory.name;
      const resolvedCategoryId = resolvedCategory.id;
      let linkedId: string | undefined;
      let recurringTemplateId: string | undefined;
      const dayOfMonth = Number(date.split("-")[2]) || 1;

      if (recurring && form.type !== "saving" && form.type !== "bill_payment" && form.type !== "debt_payment") {
        const templateId = createBudgetId();
        recurringTemplateId = templateId;
        const nextTemplate: BudgetRecurringTemplate = {
          id: templateId,
          type: form.type,
          categoryId: resolvedCategoryId,
          amount,
          note: form.note.trim(),
          dayOfMonth,
          startMonth: getMonthKey(date),
          skippedMonths: [],
        };
        next = { ...next, recurringTemplates: [nextTemplate, ...next.recurringTemplates] };
      }

      if (recurring && form.type === "bill_payment") {
        const billId = createBudgetId();
        linkedId = billId;
        next = {
          ...next,
          bills: [
            {
              id: billId,
              title: resolvedCategory.name || "فاتورة",
              dueDay: dayOfMonth,
              expectedAmount: amount,
              categoryId: resolvedCategoryId,
              skippedMonths: [],
            } as BudgetData["bills"][number] & { skippedMonths: string[] },
            ...next.bills,
          ],
        };
      }

      if (recurring && form.type === "debt_payment") {
        const debtId = createBudgetId();
        linkedId = debtId;
        next = {
          ...next,
          debts: [
            {
              id: debtId,
              title: resolvedCategory.name || "دين",
              dueDay: dayOfMonth,
              totalAmount: amount,
              categoryId: resolvedCategoryId,
              skippedMonths: [],
            } as BudgetData["debts"][number] & { skippedMonths: string[] },
            ...next.debts,
          ],
        };
      }

      const payload: BudgetTransaction = {
        id: createBudgetId(),
        type: form.type,
        title: resolvedCategory.name || TRANSACTION_TYPE_LABEL[form.type],
        amount,
        date,
        categoryId: resolvedCategoryId,
        note: form.note.trim(),
        linkedId,
        recurringTemplateId,
      };

      return { ...next, transactions: [payload, ...next.transactions] };
    });

    setTransactionForm(emptyTransactionState("income", pickDefaultCategoryId(data.categories, "income")));
    setTransactionCategoryText("");
    setIsRecurring(false);
    pushNotice(successMessage || `تمت إضافة ${successCategoryName || "المعاملة"} بنجاح`);
  };

  const saveTransaction = () => {
    const amount = parseAmountInput(transactionForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      pushNotice("أدخل مبلغا صحيحا");
      return;
    }

    const formToSave = {
      ...transactionForm,
      date: todayISO(),
      title: transactionCategoryText.trim(),
      categoryId: "",
    };

    commitTransaction(formToSave, isRecurring);
  };
  const skipRecurringForMonth = (tx: BudgetTransaction) => {
    if (!tx.linkedId && !tx.recurringTemplateId) return;

    applyData((current) => ({
      ...current,
      recurringTemplates: current.recurringTemplates.map((template) => {
        if (template.id !== tx.recurringTemplateId) return template;
        if (template.skippedMonths.includes(selectedMonth)) return template;
        return { ...template, skippedMonths: [...template.skippedMonths, selectedMonth] };
      }),
      bills: current.bills.map((bill) => {
        if (bill.id !== tx.linkedId) return bill;
        const skipped = ((bill as BudgetData["bills"][number] & { skippedMonths?: string[] }).skippedMonths || []);
        if (skipped.includes(selectedMonth)) return bill;
        return { ...(bill as any), skippedMonths: [...skipped, selectedMonth] } as unknown as BudgetData["bills"][number];
      }),
      debts: current.debts.map((debt) => {
        if (debt.id !== tx.linkedId) return debt;
        const skipped = ((debt as BudgetData["debts"][number] & { skippedMonths?: string[] }).skippedMonths || []);
        if (skipped.includes(selectedMonth)) return debt;
        return { ...(debt as any), skippedMonths: [...skipped, selectedMonth] } as unknown as BudgetData["debts"][number];
      }),
      transactions: current.transactions.filter((item) => item.id !== tx.id),
    }));
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
    pushNotice("تم حذف الفئة");
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
    if (!goalTitle.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0) return;

    applyData((current) => ({
      ...current,
      savingsGoals: [{ id: createBudgetId(), title: goalTitle.trim(), targetAmount, targetDate: endOfMonthISO(selectedMonth) }, ...current.savingsGoals],
    }));

    setGoalTitle("");
    setGoalTargetAmount("");
  };

  const addContribution = (goal: BudgetSavingGoal, amount: number) => {
    const categoryId = categoriesByType.saving[0]?.id;
    if (!Number.isFinite(amount) || amount <= 0 || !categoryId) return;

    applyData((current) => ({
      ...current,
      transactions: [{ id: createBudgetId(), type: "saving", title: "مساهمة ادخار", amount, date: todayISO(), categoryId, note: "إضافة إلى هدف", linkedId: goal.id }, ...current.transactions],
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
      amount: String(tx.amount),
      date: tx.date,
      note: tx.note,
      categoryId: tx.categoryId,
    });
    setEditApplyScope("current");
  };

  const saveEditTransaction = () => {
    if (!editDialog.tx) return;
    const amount = parseAmountInput(editDialog.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !editDialog.categoryId) return;

    const applyAllMonths = isRecurringTransaction(editDialog.tx) && editApplyScope === "all";
    const nextDay = Number(editDialog.date.split("-")[2]) || 1;

    applyData((current) => {
      const nextTitle = current.categories.find((c) => c.id === editDialog.categoryId)?.name || editDialog.tx?.title || "";

      if (!applyAllMonths) {
        return {
          ...current,
          transactions: current.transactions.map((tx) =>
            tx.id === editDialog.tx?.id
              ? {
                  ...tx,
                  title: nextTitle,
                  amount,
                  date: editDialog.date,
                  note: editDialog.note.trim(),
                  categoryId: editDialog.categoryId,
                }
              : tx,
          ),
        };
      }

      return {
        ...current,
        recurringTemplates: current.recurringTemplates.map((template) =>
          template.id === editDialog.tx?.recurringTemplateId
            ? {
                ...template,
                categoryId: editDialog.categoryId,
                amount,
                note: editDialog.note.trim(),
                dayOfMonth: nextDay,
              }
            : template,
        ),
        bills: current.bills.map((bill) =>
          bill.id === editDialog.tx?.linkedId && editDialog.tx?.type === "bill_payment"
            ? { ...bill, title: nextTitle, dueDay: nextDay, expectedAmount: amount, categoryId: editDialog.categoryId }
            : bill,
        ),
        debts: current.debts.map((debt) =>
          debt.id === editDialog.tx?.linkedId && editDialog.tx?.type === "debt_payment"
            ? { ...debt, title: nextTitle, dueDay: nextDay, totalAmount: amount, categoryId: editDialog.categoryId }
            : debt,
        ),
        transactions: current.transactions.map((tx) => {
          const sameLinked = editDialog.tx?.linkedId && tx.linkedId === editDialog.tx.linkedId;
          const sameRecurringTemplate = editDialog.tx?.recurringTemplateId && tx.recurringTemplateId === editDialog.tx.recurringTemplateId;
          if (!sameLinked && !sameRecurringTemplate) return tx;
          const monthKey = getMonthKey(tx.date);
          return {
            ...tx,
            title: nextTitle,
            amount,
            categoryId: editDialog.categoryId,
            note: editDialog.note.trim(),
            date: `${monthKey}-${String(clampDay(nextDay, monthKey)).padStart(2, "0")}`
          };
        }),
      };
    });

    setEditDialog({ open: false, tx: null, amount: "", date: todayISO(), note: "", categoryId: "" });
    setEditApplyScope("current");
    pushNotice("تم تحديث العملية بنجاح");
  };

  const deleteTransaction = (id: string) => {
    applyData((current) => ({ ...current, transactions: current.transactions.filter((tx) => tx.id !== id) }));
    pushNotice("تم حذف العملية بنجاح");
  };

  const deleteSavingGoal = (id: string) => {
    applyData((current) => ({
      ...current,
      savingsGoals: current.savingsGoals.filter((goal) => goal.id !== id),
      transactions: current.transactions.filter((tx) => !(tx.type === "saving" && tx.linkedId === id)),
    }));
    pushNotice("تم حذف هدف الادخار");
  };

  return (
    <div className="budget-planner-page min-h-screen bg-slate-50 dark:bg-slate-950 pb-12" dir="rtl">
      <header className="budget-planner-header bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link href="/" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
              </Link>
              <ThemeToggle />
            </div>
            <h1 className="absolute left-1/2 -translate-x-1/2 text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Wallet className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
              الميزانيّة الشهرية
            </h1><div className="w-[68px]" />          </div>

          <div className="budget-header-controls mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="budget-month-picker flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/60 px-3 py-2.5">
              <CalendarClock className="w-4 h-4 text-slate-900 dark:text-white" />
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const month = e.target.value;
                  setSelectedMonth(month);
                                  }}
                className={`budget-month-select ${selectClassName} flex-1 border-0 bg-transparent px-0 py-0 shadow-none focus:ring-0`}
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <span className="text-xs text-slate-500 dark:text-slate-400">{localizedMonthLabel}</span>
            </div>

            <select
              value={data.settings.currency}
              onChange={(e) => applyData((current) => ({ ...current, settings: { ...current.settings, currency: e.target.value as BudgetData["settings"]["currency"] } }))}
              className={`budget-currency-select ${selectClassName}`}
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-5 md:pt-6">
        <div className="budget-summary-grid grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          <SummaryCard title="دخل" amount={monthlyTotals.income} currency={data.settings.currency} tone="income" />
          <SummaryCard title="مصروفات" amount={monthlyTotals.expenses} currency={data.settings.currency} tone="expense" />
          <SummaryCard title="فواتير + ديون" amount={monthlyTotals.bills + monthlyTotals.debts} currency={data.settings.currency} tone="bill" />
          <SummaryCard title="ادخار" amount={monthlyTotals.savings} currency={data.settings.currency} tone="saving" />
          <SummaryCard title="الصافي" amount={monthlyTotals.net} currency={data.settings.currency} tone={monthlyTotals.net >= 0 ? "income" : "expense"} />
        </div>

        <div className="budget-tabs-wrap mb-5 overflow-x-auto">
          <div className="budget-tabs-nav inline-flex items-center gap-2 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 min-w-max">
            {(Object.keys(TAB_LABELS) as BudgetTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`budget-tab-btn budget-tab-btn-${tab} px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === tab ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow" : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-900/60"}`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6">
              <div className="budget-add-transaction-widget bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
                <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-primary" />إضافة معاملة جديدة</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select value={transactionForm.type} onChange={(e) => configureTransactionType(e.target.value as BudgetTransactionType)} className={`budget-currency-select ${selectClassName}`}>{ADD_TRANSACTION_TYPES.map((type) => <option key={type} value={type}>{`${TYPE_EMOJI[type]} ${TRANSACTION_TYPE_LABEL[type]}`}</option>)}</select>
                  <input value={transactionCategoryText} onChange={(e) => setTransactionCategoryText(e.target.value)} placeholder="اكتب الفئة (مثال: راتب, كهرباء)" className={inputClassName} />
                  <input type="text" inputMode="decimal" value={transactionForm.amount} onChange={(e) => setTransactionForm((prev) => ({ ...prev, amount: e.target.value }))} placeholder={`المبلغ (${symbol})`} className={`${inputClassName} tabular-nums`} />
                  <input value={transactionForm.note} onChange={(e) => setTransactionForm((prev) => ({ ...prev, note: e.target.value }))} placeholder="ملاحظة (اختياري)" className={inputClassName} />
                </div>
                {RECURRING_ELIGIBLE_TYPES.includes(transactionForm.type as Exclude<BudgetTransactionType, "saving">) && (
                  <label className="mt-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="rounded border-slate-300" />
                    معاملة شهرية تلقائية (ويمكن استثناء أي شهر لاحقاً)
                  </label>
                )}
                <div className="mt-3">
                  <button onClick={saveTransaction} className="budget-primary-btn px-4 py-2.5 rounded-xl text-white font-semibold">إضافة معاملة</button>
                  <button
                    type="button"
                    onClick={openAiInfo}
                    className="mt-2 block text-xs text-slate-500 dark:text-slate-400 hover:underline"
                  >
                    تحليل إيصال بالذكاء الاصطناعي
                  </button>
                </div>
              </div>
              <div className="budget-add-goal-widget bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2"><PiggyBank className="w-4 h-4 text-emerald-500" />إضافة هدف ادخار</h3>
                <div className="grid grid-cols-1 gap-2">
                  <input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="اسم الهدف" className={inputClassName} />
                  <input type="text" inputMode="decimal" value={goalTargetAmount} onChange={(e) => setGoalTargetAmount(e.target.value)} placeholder={`المبلغ المستهدف (${symbol})`} className={`${inputClassName} tabular-nums`} />                </div>
                <button onClick={addSavingGoal} className="budget-primary-btn mt-2 px-4 py-2.5 rounded-xl text-white font-semibold">إضافة الهدف</button>
              </div>

              <div className="budget-savings-goals-widget bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">أهداف الادخار</h3>
                <div className="space-y-2.5">
                  {data.savingsGoals.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد أهداف ادخار بعد.</p>}
                  {data.savingsGoals.map((goal) => {
                    const saved = savingsByGoalId.get(goal.id) || 0;
                    const progress = goal.targetAmount > 0 ? Math.min(Math.round((saved / goal.targetAmount) * 100), 100) : 0;
                    return (
                      <div key={goal.id} className="group rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/40 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">{goal.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">الاستحقاق: {goal.targetDate}</p>
                          </div>
                          <button onClick={() => deleteSavingGoal(goal.id)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition px-2 py-1 text-xs rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">حذف</button>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300">تم ادخار</span>
                          <bdi dir="ltr" className="text-slate-700 dark:text-slate-200 tabular-nums whitespace-nowrap">
                            {`${formatAmount(saved, data.settings.currency)} / ${formatAmount(goal.targetAmount, data.settings.currency)}`}
                          </bdi>
                        </div>
                        <div className="mt-1.5 w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-[8px] overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.35 }} className="h-full bg-emerald-500" />
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-slate-500 dark:text-slate-400">{progress}%</span>
                          <button onClick={() => openSavingContributionDialog(goal)} className="budget-primary-btn px-2.5 py-1.5 rounded-lg text-white text-xs">إضافة مساهمة</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="budget-overview-widget bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
                <h3 className="budget-overview-title font-bold text-slate-900 dark:text-slate-100 mb-4">نظرة عامّة</h3>
                <div className="budget-overview-income-expense mb-3 rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between text-xs mb-1"><span>الدخل</span><span dir="ltr" className="tabular-nums">{formatAmount(monthlyTotals.income, data.settings.currency)}</span></div>
                  <div className="w-full h-2.5 rounded-[8px] bg-slate-200 dark:bg-slate-700 overflow-hidden mb-2"><motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="h-full bg-emerald-500" /></div>
                  <div className="flex items-center justify-between text-xs mb-1"><span>المصروف الكلي</span><span dir="ltr" className="tabular-nums">{formatAmount(monthlyTotals.totalOutflow, data.settings.currency)}</span></div>
                  <div className="w-full h-2.5 rounded-[8px] bg-slate-200 dark:bg-slate-700 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${monthlyTotals.income > 0 ? Math.min((monthlyTotals.totalOutflow / monthlyTotals.income) * 100, 100) : 0}%` }} className="h-full bg-rose-500" /></div>
                </div>

                <div className="budget-overview-chart-wrap mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center" onMouseLeave={() => setHoveredOverviewSegment(null)}>
                  <div className="flex justify-center">
                    <div className="budget-overview-donut relative w-44 h-44">
                      <svg viewBox="0 0 180 180" className="w-full h-full drop-shadow-sm">
                        <circle cx="90" cy="90" r="56" fill="none" stroke="rgba(148, 163, 184, 0.18)" strokeWidth="18" />
                        {donutSegments.map((segment) => (
                          <path
                            key={segment.id}
                            d={describeArcPath(90, 90, 56, segment.startAngle, segment.endAngle)}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth={18}
                            strokeLinecap="butt"
                            opacity={0.84}
                            onMouseEnter={() => setHoveredOverviewSegment(segment.id)}
                            onMouseLeave={() => setHoveredOverviewSegment(null)}
                          />
                        ))}
                        {hoveredOverviewSegment && activeOverviewSegment && (
                          <motion.path
                            key={`active_${activeOverviewSegment.id}`}
                            d={describeArcPath(90, 90, 62, activeOverviewSegment.startAngle, activeOverviewSegment.endAngle)}
                            fill="none"
                            stroke={activeOverviewSegment.color}
                            strokeLinecap="butt"
                            initial={{ strokeWidth: 18, opacity: 0.85 }}
                            animate={{ strokeWidth: 24, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 360, damping: 24 }}
                          />
                        )}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 ring-1 ring-slate-200/60 dark:ring-slate-700/70 flex flex-col items-center justify-center text-center px-1">
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{activeOverviewSegment?.name || "نسبة"}</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums">{activeOverviewSegment ? `${activeOverviewSegment.percent}%` : "0%"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    <p>حرّك المؤشر على أي فئة لرؤية نسبتها بسرعة.</p>
                    <p className="mt-1">يتم تكبير الجزء المطابق للفئة فقط لربط القائمة بالمخطط.</p>
                  </div>
                </div>

                <div className="budget-overview-segments space-y-2.5">
                  {overviewSegments.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد بيانات في هذا الشهر.</p>}
                  {overviewSegments.map((segment) => {
                    const isActive = hoveredOverviewSegment === segment.id;
                    return (
                      <div
                        key={segment.id}
                        onMouseEnter={() => setHoveredOverviewSegment(segment.id)}
                        onMouseLeave={() => setHoveredOverviewSegment(null)}
                        className={`budget-overview-segment rounded-xl border p-2.5 transition ${isActive ? "border-primary/40 bg-primary/5" : "border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40"}`}
                      >
                        <div className="flex items-center justify-between text-sm mb-1">
                          <p className="font-medium text-slate-800 dark:text-slate-100">{`${segment.emoji} ${segment.name}`}</p>
                          <p className="text-slate-500 dark:text-slate-400 tabular-nums"><span className="inline-block tabular-nums whitespace-nowrap" style={{ direction: "ltr", unicodeBidi: "bidi-override" }}>{formatAmount(segment.total, data.settings.currency)}</span> • {segment.percent}%</p>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-[8px] overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${segment.percent}%` }} transition={{ duration: 0.35 }} className="h-full" style={{ backgroundColor: segment.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="budget-recent-transactions-widget bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2"><CalendarClock className="w-4 h-4 text-blue-500" />آخر عمليات هذا الشهر</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                  <div className="relative md:col-span-2"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={recentSearch} onChange={(e) => setRecentSearch(e.target.value)} placeholder="ابحث عن عملية محددة" className={`w-full pr-3 pl-9 ${inputClassName}`} /></div>
                  <select value={recentFilter} onChange={(e) => setRecentFilter(e.target.value as typeof recentFilter)} className={`budget-currency-select ${selectClassName}`}><option value="all">الكل</option><option value="income">دخل</option><option value="expense">مصروف</option><option value="bill_payment">فاتورة</option><option value="debt_payment">دين</option><option value="other">أخرى</option></select>
                </div>
                <div className="space-y-2.5 max-h-[520px] overflow-auto pr-1 modern-scrollbar">
                  {recentTransactions.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد عمليات مطابقة.</p>}
                  {recentTransactions.map((tx) => {
                    const category = data.categories.find((c) => c.id === tx.categoryId);
                    const emoji = categoryEmoji(category?.name || "", category?.type || tx.type);
                    const rowTitle = tx.type === "saving" ? "🏦 مساهمة ادخار" : `${emoji} ${category?.name || TRANSACTION_TYPE_LABEL[tx.type]}`;
                    const metaLine = `${TRANSACTION_TYPE_LABEL[tx.type]} • ${tx.date}`;

                    return (
                      <button key={tx.id} onClick={() => setOperationActionsTx(tx)} className="w-full text-right rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/40 p-3 hover:bg-slate-100/90 dark:hover:bg-slate-700/50 transition">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">{rowTitle}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{metaLine}</p>
                            {tx.note && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tx.note}</p>}
                          </div>
                          <p className={`font-bold tabular-nums ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            <span className="inline-block tabular-nums whitespace-nowrap" style={{ direction: "ltr", unicodeBidi: "bidi-override" }}>{formatAmount(tx.amount, data.settings.currency)}</span>
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="budget-financial-insights-widget bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">تحليل مالي ذكي</h3>
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
          <div className="space-y-6">
            <div className="budget-categories-settings-widget bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">تخصيص الفئات</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <select value={categoryType} onChange={(e) => setCategoryType(e.target.value as BudgetCategoryType)} className={`budget-currency-select ${selectClassName}`}>{(Object.keys(TRANSACTION_TYPE_LABEL) as BudgetTransactionType[]).map((type) => <option key={type} value={type}>{`${TYPE_EMOJI[type]} ${TRANSACTION_TYPE_LABEL[type]}`}</option>)}</select>
                <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="أضف خيار مخصص" className={inputClassName} />
                <button onClick={addCategory} className="budget-primary-btn rounded-xl text-white font-semibold px-4 py-2.5">إضافة فئة</button>
              </div>
            </div>

            {(Object.keys(TRANSACTION_TYPE_LABEL) as BudgetTransactionType[]).map((type) => <div key={type} className="budget-categories-group-widget bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5"><h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3">{`${TYPE_EMOJI[type]} ${TRANSACTION_TYPE_LABEL[type]}`}</h4><div className="space-y-2">{categoriesByType[type].map((cat) => <div key={cat.id} className="group rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5 flex items-center justify-between gap-2">{editingCategoryId === cat.id ? <input value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} className={`flex-1 ${inputClassName} px-2 py-1.5`} /> : <p className="font-medium text-slate-800 dark:text-slate-100">{`${categoryEmoji(cat.name, cat.type)} ${cat.name}`}</p>}<div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">{editingCategoryId === cat.id ? <button onClick={saveCategoryEdit} className="budget-primary-btn px-2 py-1 text-xs rounded-lg text-white">حفظ</button> : <button onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); }} className="px-2 py-1 text-xs rounded-lg bg-slate-200 dark:bg-slate-700">تعديل</button>}<button onClick={() => deleteCategory(cat.id)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition px-2 py-1 text-xs rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">حذف</button></div></div>)}{categoriesByType[type].length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد فئات في هذا القسم.</p>}</div></div>)}
          </div>
        )}
        {amountDialog.open && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeAmountDialog}>
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4" onClick={(e) => e.stopPropagation()}>
              <h4 className="font-bold text-slate-900 dark:text-slate-100">{amountDialog.title}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{amountDialog.subtitle}</p>
              <input type="text" inputMode="decimal" value={amountDialog.amount} onChange={(e) => setAmountDialog((prev) => ({ ...prev, amount: e.target.value }))} placeholder={`المبلغ (${symbol})`} className="mt-3 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 tabular-nums" />
              <div className="mt-3 flex items-center gap-2">
                <button onClick={confirmAmountDialog} className="budget-primary-btn flex-1 rounded-xl text-white font-semibold py-2.5">تأكيد</button>
                <button onClick={closeAmountDialog} className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-2.5">إلغاء</button>
              </div>

            </div>
          </div>
        )}


      {aiInfoOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAiInfoOpen(false)}>
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-bold text-slate-900 dark:text-slate-100">ميزة التحليل الذكي موقوفة مؤقتًا</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">سيتم تفعيلها بعد إعادة شحن رصيد واجهة الذكاء الاصطناعي.</p>
            <button onClick={() => setAiInfoOpen(false)} className="mt-3 w-full rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-2.5 text-sm">حسنًا</button>
          </div>
        </div>
      )}

      {operationActionsTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4" onClick={() => setOperationActionsTx(null)}>
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-bold text-slate-900 dark:text-slate-100">خيارات العملية</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{operationActionsTx.date}</p>
            <div className="mt-3 space-y-2">
              <button onClick={() => { openEditTransactionDialog(operationActionsTx); setOperationActionsTx(null); }} className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 py-2.5 text-sm">تعديل</button>
              <button onClick={() => { deleteTransaction(operationActionsTx.id); setOperationActionsTx(null); }} className="w-full rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 py-2.5 text-sm">حذف</button>
              {isRecurringTransaction(operationActionsTx) && (
                <button onClick={() => { skipRecurringForMonth(operationActionsTx); setOperationActionsTx(null); }} className="w-full rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 py-2.5 text-sm">استثناء هذا الشهر</button>
              )}
            </div>
          </div>
        </div>
      )}
        {editDialog.open && editDialog.tx && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditDialog({ open: false, tx: null, amount: "", date: todayISO(), note: "", categoryId: "" })}>
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4" onClick={(e) => e.stopPropagation()}>
              <h4 className="font-bold text-slate-900 dark:text-slate-100">تعديل العملية</h4>
              <div className="grid grid-cols-1 gap-2 mt-3">                <input type="text" inputMode="decimal" value={editDialog.amount} onChange={(e) => setEditDialog((prev) => ({ ...prev, amount: e.target.value }))} className={`${inputClassName} tabular-nums`} />
                <input type="date" value={editDialog.date} onChange={(e) => setEditDialog((prev) => ({ ...prev, date: e.target.value }))} className={`${inputClassName} tabular-nums`} />
                {isRecurringTransaction(editDialog.tx) && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">تطبيق التعديل على</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setEditApplyScope("current")} className={`rounded-lg px-2.5 py-2 text-xs font-semibold ${editApplyScope === "current" ? "budget-primary-btn text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"}`}>هذا الشهر فقط</button>
                      <button type="button" onClick={() => setEditApplyScope("all")} className={`rounded-lg px-2.5 py-2 text-xs font-semibold ${editApplyScope === "all" ? "budget-primary-btn text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"}`}>كل الأشهر</button>
                    </div>
                  </div>
                )}
                <select value={editDialog.categoryId} onChange={(e) => setEditDialog((prev) => ({ ...prev, categoryId: e.target.value }))} className={`budget-currency-select ${selectClassName}`}>
                  {data.categories.filter((c) => c.type === editDialog.tx?.type).map((cat) => <option key={cat.id} value={cat.id}>{`${categoryEmoji(cat.name, cat.type)} ${cat.name}`}</option>)}
                </select>
                <input value={editDialog.note} onChange={(e) => setEditDialog((prev) => ({ ...prev, note: e.target.value }))} placeholder="ملاحظة" className={inputClassName} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={saveEditTransaction} className="budget-primary-btn flex-1 rounded-xl text-white font-semibold py-2.5">حفظ</button>
                <button onClick={() => setEditDialog({ open: false, tx: null, amount: "", date: todayISO(), note: "", categoryId: "" })} className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-2.5">إلغاء</button>
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
  const config = {
    income: {
      text: "text-emerald-600 dark:text-emerald-400",
      soft: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
      icon: Wallet,
    },
    expense: {
      text: "text-rose-600 dark:text-rose-400",
      soft: "bg-rose-100/80 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
      icon: ReceiptText,
    },
    bill: {
      text: "text-amber-600 dark:text-amber-400",
      soft: "bg-amber-100/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
      icon: Landmark,
    },
    saving: {
      text: "text-indigo-600 dark:text-indigo-400",
      soft: "bg-indigo-100/80 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
      icon: TrendingUp,
    },
  } as const;

  const entry = config[tone];
  const Icon = entry.icon;

  return (
    <div className="budget-stat-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="budget-stat-label text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
        <span className={`budget-stat-icon-wrap inline-flex items-center justify-center rounded-lg p-1.5 ${entry.soft}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <p className={`budget-stat-value text-2xl md:text-[28px] font-bold ${entry.text}`}>
        <span className="inline-block tabular-nums whitespace-nowrap" style={{ direction: "ltr", unicodeBidi: "bidi-override" }}>
          {formatAmount(amount, currency)}
        </span>
      </p>
    </div>
  );
}










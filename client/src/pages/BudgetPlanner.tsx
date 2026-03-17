import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, CalendarClock, Landmark, PiggyBank, Plus, ReceiptText, Search, Settings2, TrendingUp, Wallet } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);

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
    <div className="min-h-screen bg-background pb-12" dir="rtl">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                </Link>
              </Button>
              <ThemeToggle />
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => setCategoriesDialogOpen(true)}
                aria-label="إعدادات الفئات"
              >
                <Settings2 className="w-4 h-4" />
              </Button>
            </div>
            <h1 className="absolute left-1/2 -translate-x-1/2 text-lg md:text-2xl font-bold text-foreground flex items-center gap-2">
              <Wallet className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
              الميزانيّة الشهرية
            </h1>
            <div className="w-[68px]" />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2.5">
              <CalendarClock className="w-4 h-4 text-foreground" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="flex-1 border-0 bg-transparent shadow-none focus:ring-0 w-auto min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">{localizedMonthLabel}</span>
            </div>

            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2.5 justify-between">
              <span className="text-xs text-muted-foreground">العملة</span>
              <Select
                value={data.settings.currency}
                onValueChange={(value) => applyData((current) => ({ ...current, settings: { ...current.settings, currency: value as BudgetData["settings"]["currency"] } }))}
              >
                <SelectTrigger className="flex-1 border-0 bg-transparent shadow-none focus:ring-0 w-auto min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.code} value={option.code}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-5 md:pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
          <SummaryCard title="دخل" amount={monthlyTotals.income} currency={data.settings.currency} tone="income" />
          <SummaryCard title="مصروفات" amount={monthlyTotals.expenses} currency={data.settings.currency} tone="expense" />
          <SummaryCard title="فواتير + ديون" amount={monthlyTotals.bills + monthlyTotals.debts} currency={data.settings.currency} tone="bill" />
          <SummaryCard title="ادخار" amount={monthlyTotals.savings} currency={data.settings.currency} tone="saving" />
          <SummaryCard title="الصافي" amount={monthlyTotals.net} currency={data.settings.currency} tone={monthlyTotals.net >= 0 ? "income" : "expense"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-6 lg:order-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base rtl-header">
                    <Plus className="w-4 h-4 text-primary" />
                    إضافة معاملة جديدة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select value={transactionForm.type} onValueChange={(v) => configureTransactionType(v as BudgetTransactionType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ADD_TRANSACTION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{`${TYPE_EMOJI[type]} ${TRANSACTION_TYPE_LABEL[type]}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      dir="rtl"
                      className="text-right"
                      value={transactionCategoryText}
                      onChange={(e) => setTransactionCategoryText(e.target.value)}
                      placeholder="اكتب الفئة (مثال: راتب, كهرباء)"
                    />
                    <Input
                      dir="rtl"
                      type="text"
                      inputMode="decimal"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder={`المبلغ (${symbol})`}
                      className="tabular-nums text-right"
                    />
                    <Input
                      dir="rtl"
                      className="text-right"
                      value={transactionForm.note}
                      onChange={(e) => setTransactionForm((prev) => ({ ...prev, note: e.target.value }))}
                      placeholder="ملاحظة (اختياري)"
                    />
                  </div>
                  {RECURRING_ELIGIBLE_TYPES.includes(transactionForm.type as Exclude<BudgetTransactionType, "saving">) && (
                    <div className="flex items-center gap-2">
                      <Checkbox id="recurring" checked={isRecurring} onCheckedChange={(c) => setIsRecurring(!!c)} />
                      <Label htmlFor="recurring" className="text-sm">معاملة شهرية تلقائية (ويمكن استثناء أي شهر لاحقاً)</Label>
                    </div>
                  )}
                  <Button onClick={saveTransaction}>إضافة معاملة</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base rtl-header">
                    <PiggyBank className="w-4 h-4 text-emerald-500" />
                    إضافة هدف ادخار
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input
                    dir="rtl"
                    className="text-right"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="اسم الهدف"
                  />
                  <Input
                    dir="rtl"
                    type="text"
                    inputMode="decimal"
                    value={goalTargetAmount}
                    onChange={(e) => setGoalTargetAmount(e.target.value)}
                    placeholder={`المبلغ المستهدف (${symbol})`}
                    className="tabular-nums text-right"
                  />
                  <Button onClick={addSavingGoal}>إضافة الهدف</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-right">أهداف الادخار</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="space-y-2.5">
                  {data.savingsGoals.length === 0 && <p className="text-sm text-muted-foreground">لا توجد أهداف ادخار بعد.</p>}
                  {data.savingsGoals.map((goal) => {
                    const saved = savingsByGoalId.get(goal.id) || 0;
                    const progress = goal.targetAmount > 0 ? Math.min(Math.round((saved / goal.targetAmount) * 100), 100) : 0;
                    return (
                      <div key={goal.id} className="group rounded-xl border bg-muted/50 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-foreground">{goal.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">الاستحقاق: {goal.targetDate}</p>
                          </div>
                          <Button variant="destructive" size="sm" className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition text-xs h-7" onClick={() => deleteSavingGoal(goal.id)}>حذف</Button>
                        </div>
                        <div className="mt-2 rtl-row text-xs">
                          <span className="text-muted-foreground">تم ادخار</span>
                          <span className="rtl-number text-foreground tabular-nums whitespace-nowrap">
                            {`${formatAmount(saved, data.settings.currency)} / ${formatAmount(goal.targetAmount, data.settings.currency)}`}
                          </span>
                        </div>
                        <div className="mt-1.5 w-full h-2.5 bg-muted rounded-lg overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.35 }} className="h-full bg-emerald-500" />
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{progress}%</span>
                          <Button size="sm" className="text-xs h-7" onClick={() => openSavingContributionDialog(goal)}>إضافة مساهمة</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-7 space-y-6 lg:order-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-right">نظرة عامّة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="mb-3 rounded-xl border bg-muted/50 p-3">
                  <div className="rtl-row text-xs mb-1"><span>الدخل</span><span className="rtl-number tabular-nums">{formatAmount(monthlyTotals.income, data.settings.currency)}</span></div>
                  <div className="w-full h-2.5 rounded-lg bg-muted overflow-hidden mb-2"><motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="h-full bg-emerald-500" /></div>
                  <div className="rtl-row text-xs mb-1"><span>المصروف الكلي</span><span className="rtl-number tabular-nums">{formatAmount(monthlyTotals.totalOutflow, data.settings.currency)}</span></div>
                  <div className="w-full h-2.5 rounded-lg bg-muted overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${monthlyTotals.income > 0 ? Math.min((monthlyTotals.totalOutflow / monthlyTotals.income) * 100, 100) : 0}%` }} className="h-full bg-rose-500" /></div>
                </div>

                <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center" onMouseLeave={() => setHoveredOverviewSegment(null)}>
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
                        <div className="w-20 h-20 rounded-full bg-card border border-border flex flex-col items-center justify-center text-center px-1">
                          <p className="text-[11px] text-muted-foreground leading-tight">{activeOverviewSegment?.name || "نسبة"}</p>
                          <p className="text-sm font-bold text-foreground tabular-nums">{activeOverviewSegment ? `${activeOverviewSegment.percent}%` : "0%"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>حرّك المؤشر على أي فئة لرؤية نسبتها بسرعة.</p>
                    <p className="mt-1">يتم تكبير الجزء المطابق للفئة فقط لربط القائمة بالمخطط.</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {overviewSegments.length === 0 && <p className="text-sm text-muted-foreground">لا توجد بيانات في هذا الشهر.</p>}
                  {overviewSegments.map((segment) => {
                    const isActive = hoveredOverviewSegment === segment.id;
                    return (
                      <div
                        key={segment.id}
                        onMouseEnter={() => setHoveredOverviewSegment(segment.id)}
                        onMouseLeave={() => setHoveredOverviewSegment(null)}
                        className={cn("rounded-xl border p-2.5 transition", isActive ? "border-primary/40 bg-primary/5" : "bg-muted/50")}
                      >
                        <div className="rtl-row text-sm mb-1">
                          <p className="font-medium text-foreground">{`${segment.emoji} ${segment.name}`}</p>
                          <p className="text-muted-foreground tabular-nums"><span className="inline-block rtl-number tabular-nums whitespace-nowrap">{formatAmount(segment.total, data.settings.currency)}</span> • {segment.percent}%</p>
                        </div>
                        <div className="w-full h-2.5 bg-muted rounded-lg overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${segment.percent}%` }} transition={{ duration: 0.35 }} className="h-full" style={{ backgroundColor: segment.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base rtl-header">
                    <CalendarClock className="w-4 h-4 text-primary" />
                    آخر عمليات هذا الشهر
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="relative md:col-span-2">
                    <Search className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      dir="rtl"
                      value={recentSearch}
                      onChange={(e) => setRecentSearch(e.target.value)}
                      placeholder="ابحث عن عملية محددة"
                      className="pl-9 rtl:pl-3 rtl:pr-9 text-right"
                    />
                  </div>
                  <Select value={recentFilter} onValueChange={(v) => setRecentFilter(v as typeof recentFilter)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="income">دخل</SelectItem>
                      <SelectItem value="expense">مصروف</SelectItem>
                      <SelectItem value="bill_payment">فاتورة</SelectItem>
                      <SelectItem value="debt_payment">دين</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 max-h-[520px] overflow-auto">
                  {recentTransactions.length === 0 && <p className="text-sm text-muted-foreground">لا توجد عمليات مطابقة.</p>}
                  {recentTransactions.map((tx) => {
                    const category = data.categories.find((c) => c.id === tx.categoryId);
                    const emoji = categoryEmoji(category?.name || "", category?.type || tx.type);
                    const rowTitle = tx.type === "saving" ? "🏦 مساهمة ادخار" : `${emoji} ${category?.name || TRANSACTION_TYPE_LABEL[tx.type]}`;
                    const metaLine = `${TRANSACTION_TYPE_LABEL[tx.type]} • ${tx.date}`;

                    return (
                      <Button key={tx.id} variant="outline" className="w-full h-auto justify-between p-3 text-right font-normal" onClick={() => setOperationActionsTx(tx)}>
                        <div className="rtl-row items-start w-full">
                          <div>
                            <p className="font-semibold text-foreground">{rowTitle}</p>
                            <p className="text-xs text-muted-foreground mt-1">{metaLine}</p>
                            {tx.note && <p className="text-xs text-muted-foreground mt-1">{tx.note}</p>}
                          </div>
                          <p className={cn("font-bold tabular-nums shrink-0", tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                            <span className="inline-block rtl-number tabular-nums whitespace-nowrap">{formatAmount(tx.amount, data.settings.currency)}</span>
                          </p>
                        </div>
                      </Button>
                    );
                  })}
                </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-right">تحليل مالي ذكي</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="space-y-2.5 text-right">
                  {upcomingWarnings.map((warning, index) => (
                    <div
                      key={`${warning.text}_${index}`}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-sm",
                        warning.tone === "danger" && "border-destructive/30 bg-destructive/10 text-destructive",
                        warning.tone === "warn" && "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                        warning.tone === "good" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      )}
                    >
                      {warning.text}
                    </div>
                  ))}
                </div>
                </CardContent>
              </Card>
            </div>
          </div>
        <Dialog open={amountDialog.open} onOpenChange={(open) => { if (!open) closeAmountDialog(); }}>
          <DialogContent className="max-w-sm" dir="rtl">
            <DialogHeader>
              <DialogTitle>{amountDialog.title}</DialogTitle>
              <DialogDescription>{amountDialog.subtitle}</DialogDescription>
            </DialogHeader>
            <Input
              dir="rtl"
              type="text"
              inputMode="decimal"
              value={amountDialog.amount}
              onChange={(e) => setAmountDialog((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder={`المبلغ (${symbol})`}
              className="tabular-nums mt-2 text-right"
            />
            <DialogFooter>
              <Button variant="secondary" onClick={closeAmountDialog}>إلغاء</Button>
              <Button onClick={confirmAmountDialog}>تأكيد</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      <Dialog open={!!operationActionsTx} onOpenChange={(open) => { if (!open) setOperationActionsTx(null); }}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>خيارات العملية</DialogTitle>
            {operationActionsTx && <DialogDescription>{operationActionsTx.date}</DialogDescription>}
          </DialogHeader>
          {operationActionsTx && (
            <div className="space-y-2">
              <Button variant="secondary" className="w-full" onClick={() => { openEditTransactionDialog(operationActionsTx); setOperationActionsTx(null); }}>تعديل</Button>
              <Button variant="destructive" className="w-full" onClick={() => { deleteTransaction(operationActionsTx.id); setOperationActionsTx(null); }}>حذف</Button>
              {isRecurringTransaction(operationActionsTx) && (
                <Button variant="outline" className="w-full text-amber-700 dark:text-amber-300" onClick={() => { skipRecurringForMonth(operationActionsTx); setOperationActionsTx(null); }}>استثناء هذا الشهر</Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={editDialog.open && !!editDialog.tx} onOpenChange={(open) => { if (!open) setEditDialog({ open: false, tx: null, amount: "", date: todayISO(), note: "", categoryId: "" }); }}>
          <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل العملية</DialogTitle>
          </DialogHeader>
          {editDialog.tx && (
            <div className="grid grid-cols-1 gap-3">
              <Input
                dir="rtl"
                type="text"
                inputMode="decimal"
                value={editDialog.amount}
                onChange={(e) => setEditDialog((prev) => ({ ...prev, amount: e.target.value }))}
                className="tabular-nums text-right"
              />
              <Input
                dir="ltr"
                type="date"
                value={editDialog.date}
                onChange={(e) => setEditDialog((prev) => ({ ...prev, date: e.target.value }))}
                className="tabular-nums text-left"
              />
              {isRecurringTransaction(editDialog.tx) && (
                <div className="rounded-lg border bg-muted/50 p-2 space-y-2">
                  <p className="text-xs text-muted-foreground">تطبيق التعديل على</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" size="sm" variant={editApplyScope === "current" ? "default" : "secondary"} onClick={() => setEditApplyScope("current")}>هذا الشهر فقط</Button>
                    <Button type="button" size="sm" variant={editApplyScope === "all" ? "default" : "secondary"} onClick={() => setEditApplyScope("all")}>كل الأشهر</Button>
                  </div>
                </div>
              )}
              <Select value={editDialog.categoryId} onValueChange={(v) => setEditDialog((prev) => ({ ...prev, categoryId: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {data.categories.filter((c) => c.type === editDialog.tx?.type).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{`${categoryEmoji(cat.name, cat.type)} ${cat.name}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                dir="rtl"
                className="text-right"
                value={editDialog.note}
                onChange={(e) => setEditDialog((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="ملاحظة"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditDialog({ open: false, tx: null, amount: "", date: todayISO(), note: "", categoryId: "" })}>إلغاء</Button>
            <Button onClick={saveEditTransaction}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={categoriesDialogOpen} onOpenChange={setCategoriesDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>إعدادات الفئات</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-right">تخصيص الفئات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Select value={categoryType} onValueChange={(v) => setCategoryType(v as BudgetCategoryType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TRANSACTION_TYPE_LABEL) as BudgetTransactionType[]).map((type) => (
                        <SelectItem key={type} value={type}>{`${TYPE_EMOJI[type]} ${TRANSACTION_TYPE_LABEL[type]}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    dir="rtl"
                    className="text-right"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="أضف خيار مخصص"
                  />
                  <Button onClick={addCategory}>إضافة فئة</Button>
                </div>
              </CardContent>
            </Card>

            {(Object.keys(TRANSACTION_TYPE_LABEL) as BudgetTransactionType[]).map((type) => (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="text-base text-right">{`${TYPE_EMOJI[type]} ${TRANSACTION_TYPE_LABEL[type]}`}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categoriesByType[type].map((cat) => (
                      <div key={cat.id} className="group rounded-xl bg-muted/50 p-2.5 flex items-center justify-between gap-2">
                        {editingCategoryId === cat.id ? (
                          <Input
                            dir="rtl"
                            className="flex-1 h-8 text-right"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                          />
                        ) : (
                          <p className="font-medium text-foreground">{`${categoryEmoji(cat.name, cat.type)} ${cat.name}`}</p>
                        )}
                        <div className="flex items-center gap-1">
                          {editingCategoryId === cat.id ? (
                            <Button size="sm" className="h-7 text-xs" onClick={saveCategoryEdit}>حفظ</Button>
                          ) : (
                            <Button variant="secondary" size="sm" className="h-7 text-xs opacity-100 md:opacity-0 md:group-hover:opacity-100" onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); }}>تعديل</Button>
                          )}
                          <Button variant="destructive" size="sm" className="h-7 text-xs opacity-100 md:opacity-0 md:group-hover:opacity-100" onClick={() => deleteCategory(cat.id)}>حذف</Button>
                        </div>
                      </div>
                    ))}
                    {categoriesByType[type].length === 0 && <p className="text-sm text-muted-foreground">لا توجد فئات في هذا القسم.</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
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
    <Card className="p-5 transition-all hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground">{title}</p>
          <span className={cn("inline-flex items-center justify-center rounded-lg p-1.5", entry.soft)}>
            <Icon className="w-4 h-4" />
          </span>
        </div>
        <p className={cn("text-2xl md:text-[28px] font-bold leading-tight", entry.text)}>
          <span className="inline-block tabular-nums whitespace-nowrap" style={{ direction: "ltr", unicodeBidi: "bidi-override" }}>
            {formatAmount(amount, currency)}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}













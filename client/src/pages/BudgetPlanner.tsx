import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, CalendarClock, Landmark, PiggyBank, Plus, ReceiptText, Search, Settings2, TrendingUp, Wallet } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  CURRENCY_OPTIONS,
  SAVINGS_GOAL_CATEGORY_OPTIONS,
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
  type BudgetSavingGoalCategory,
  type BudgetSavingGoalStatus,
  type BudgetSavingGoal,
  type BudgetTransaction,
  type BudgetTransactionType,
} from "@/lib/budget";

const ADD_TRANSACTION_TYPES: BudgetTransactionType[] = ["income", "expense", "bill_payment", "debt_payment"];
const RECURRING_ELIGIBLE_TYPES: BudgetTransactionType[] = ["income", "expense", "bill_payment", "debt_payment"];
const TYPE_EMOJI: Record<BudgetTransactionType, string> = { income: "💼", expense: "🛍️", bill_payment: "🧾", debt_payment: "🏦" };
const DEFAULT_SAVINGS_CATEGORY: BudgetSavingGoalCategory = "emergency_fund";

const SAVINGS_GOAL_META: Record<BudgetSavingGoalCategory, { emoji: string; shortLabel: string }> = {
  emergency_fund: { emoji: "🛟", shortLabel: "صندوق طوارئ" },
  personal_investments: { emoji: "📈", shortLabel: "استثمارات شخصية" },
  retirement: { emoji: "🌅", shortLabel: "تقاعد" },
  education_fund: { emoji: "🎓", shortLabel: "صندوق استكمال" },
  housing: { emoji: "🏡", shortLabel: "ادخار للسكن" },
  children: { emoji: "👨‍👩‍👧‍👦", shortLabel: "ادخار للأطفال" },
  travel: { emoji: "✈️", shortLabel: "هدف سفر" },
  personal_goal: { emoji: "✨", shortLabel: "هدف شخصي" },
  big_purchases: { emoji: "🎯", shortLabel: "أهداف كبيرة" },
};

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

interface TransactionFormState {
  id: string;
  type: BudgetTransactionType;
  amount: string;
  date: string;
  subcategoryId: string;
  note: string;
  savingsGoalId: string;
}

function emptyTransactionState(type: BudgetTransactionType = "income", subcategoryId = ""): TransactionFormState {
  return { id: "", type, amount: "", date: todayISO(), subcategoryId, note: "", savingsGoalId: "" };
}

function pickDefaultCategoryId(categories: BudgetCategory[], type: BudgetTransactionType) {
  if (type === "income") {
    return categories.find((c) => c.type === "income" && c.name.includes("راتب"))?.id
      || categories.find((c) => c.type === "income")?.id
      || "";
  }
  return categories.find((c) => c.type === type)?.id || "";
}
function clampDay(day: number, monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const last = new Date(year, month, 0).getDate();
  return Math.max(1, Math.min(day, last));
}

function monthLessThan(a: string, b: string) {
  return a < b;
}

function categoryEmoji(name: string, type: BudgetCategoryType) {
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
  if (n.includes("طعام") || n.includes("مطعم") || n.includes("قهوة") || n.includes("سوبر")) return "🍽️";
  if (n.includes("مواصل") || n.includes("وقود") || n.includes("بنزين") || n.includes("سيارة")) return "🚗";
  if (n.includes("صحة") || n.includes("دواء") || n.includes("طب")) return "🩺";
  if (n.includes("ترفيه") || n.includes("هواية") || n.includes("لعب")) return "🎮";
  if (n.includes("ملابس") || n.includes("موضة")) return "👕";
  if (n.includes("تعليم") || n.includes("دورة")) return "📚";
  return "🧩";
}

function getSavingsGoalCategoryLabel(category: BudgetSavingGoalCategory) {
  return SAVINGS_GOAL_CATEGORY_OPTIONS.find((item) => item.value === category)?.label || SAVINGS_GOAL_META[category].shortLabel;
}

function getSavingsStatusLabel(status: BudgetSavingGoalStatus) {
  if (status === "completed") return "مكتمل";
  if (status === "archived") return "مؤرشف";
  return "نشط";
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
  subcategoryId: string;
  savingsGoalId: string;
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

  const [categoryType, setCategoryType] = useState<BudgetCategoryType>("expense");
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const [goalTitle, setGoalTitle] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalCategory, setGoalCategory] = useState<BudgetSavingGoalCategory>(DEFAULT_SAVINGS_CATEGORY);
  const [goalTargetDate, setGoalTargetDate] = useState(endOfMonthISO(getCurrentMonthKey()));
  const [goalRecurringEnabled, setGoalRecurringEnabled] = useState(false);
  const [goalRecurringAmount, setGoalRecurringAmount] = useState("");
  const [goalStatusFilter, setGoalStatusFilter] = useState<BudgetSavingGoalStatus | "all">("active");

  const [recentSearch, setRecentSearch] = useState("");
  const [recentFilter, setRecentFilter] = useState<"all" | "linked_savings" | BudgetTransactionType>("all");

  const [operationActionsTx, setOperationActionsTx] = useState<BudgetTransaction | null>(null);
  const [hoveredOverviewSegment, setHoveredOverviewSegment] = useState<string | null>(null);
  const [overviewDetailType, setOverviewDetailType] = useState<BudgetTransactionType | null>(null);

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
    subcategoryId: "",
    savingsGoalId: "",
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
  }), [data.categories]);

  const transactionCategories = useMemo(
    () => data.categories.filter((c) => c.type === transactionForm.type),
    [data.categories, transactionForm.type],
  );

  const savingsByGoalId = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of data.transactions) {
      if (tx.savingsGoalId) map.set(tx.savingsGoalId, (map.get(tx.savingsGoalId) || 0) + tx.amount);
    }
    return map;
  }, [data.transactions]);
  const monthlySavingsByGoalId = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of currentMonthTransactions) {
      if (tx.savingsGoalId) map.set(tx.savingsGoalId, (map.get(tx.savingsGoalId) || 0) + tx.amount);
    }
    return map;
  }, [currentMonthTransactions]);
  const savingsLastContributionByGoalId = useMemo(() => {
    const map = new Map<string, string>();
    for (const tx of data.transactions) {
      if (!tx.savingsGoalId) continue;
      const current = map.get(tx.savingsGoalId);
      if (!current || tx.date > current) {
        map.set(tx.savingsGoalId, tx.date);
      }
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
      .filter((tx) => recentFilter === "all" ? true : recentFilter === "linked_savings" ? Boolean(tx.savingsGoalId) : tx.type === recentFilter)
      .filter((tx) => {
        const q = recentSearch.trim().toLowerCase();
        if (!q) return true;
        const subcategoryName = data.categories.find((c) => c.id === tx.subcategoryId)?.name || "";
        const linkedGoal = tx.savingsGoalId ? data.savingsGoals.find((goal) => goal.id === tx.savingsGoalId)?.title || "" : "";
        return `${subcategoryName} ${linkedGoal} ${tx.note} ${tx.amount}`.toLowerCase().includes(q);
      })
      .slice(0, 60);
  }, [currentMonthTransactions, recentFilter, recentSearch, data.categories, data.savingsGoals]);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of currentMonthTransactions) {
      if (tx.type === "income" || tx.savingsGoalId) continue;
      map.set(tx.subcategoryId, (map.get(tx.subcategoryId) || 0) + tx.amount);
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
  const savingsGoalCards = useMemo(() => {
    return data.savingsGoals
      .filter((goal) => goalStatusFilter === "all" || goal.status === goalStatusFilter)
      .map((goal) => {
        const totalSaved = savingsByGoalId.get(goal.id) || 0;
        const monthlySaved = monthlySavingsByGoalId.get(goal.id) || 0;
        const remaining = Math.max(goal.targetAmount - totalSaved, 0);
        const progress = goal.targetAmount > 0 ? Math.min(Math.round((totalSaved / goal.targetAmount) * 100), 100) : 0;
        return {
          ...goal,
          totalSaved,
          monthlySaved,
          remaining,
          progress,
          lastContributionDate: savingsLastContributionByGoalId.get(goal.id) || "",
        };
      })
      .sort((a, b) => {
        if (a.status !== b.status) {
          if (a.status === "active") return -1;
          if (b.status === "active") return 1;
          if (a.status === "completed") return -1;
          if (b.status === "completed") return 1;
        }
        return b.totalSaved - a.totalSaved;
      });
  }, [data.savingsGoals, goalStatusFilter, monthlySavingsByGoalId, savingsByGoalId, savingsLastContributionByGoalId]);
  const overviewTypeCards = useMemo(() => ([
    {
      type: "income" as const,
      title: "الدخل",
      total: monthlyTotals.income,
      description: "كل مصادر الدخل المسجلة لهذا الشهر",
      tone: "text-emerald-600 dark:text-emerald-400",
    },
    {
      type: "expense" as const,
      title: "المصروفات",
      total: monthlyTotals.expenses,
      description: "المصروفات التشغيلية بدون الادخار",
      tone: "text-rose-600 dark:text-rose-400",
    },
    {
      type: "bill_payment" as const,
      title: "الفواتير",
      total: monthlyTotals.bills,
      description: "فواتير مرتبطة باستحقاقات ثابتة",
      tone: "text-amber-600 dark:text-amber-400",
    },
    {
      type: "debt_payment" as const,
      title: "الديون",
      total: monthlyTotals.debts,
      description: "دفعات القروض والبطاقات والالتزامات",
      tone: "text-indigo-600 dark:text-indigo-400",
    },
  ]), [monthlyTotals]);
  const overviewDetailData = useMemo(() => {
    if (!overviewDetailType) return null;

    const typeTransactions = currentMonthTransactions.filter((tx) => {
      if (tx.type !== overviewDetailType) return false;
      if (overviewDetailType === "expense") return !tx.savingsGoalId;
      return true;
    });
    const total = typeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const breakdownMap = new Map<string, number>();
    for (const tx of typeTransactions) {
      breakdownMap.set(tx.subcategoryId, (breakdownMap.get(tx.subcategoryId) || 0) + tx.amount);
    }
    const breakdown = Array.from(breakdownMap.entries())
      .map(([subcategoryId, value]) => {
        const subcategory = data.categories.find((category) => category.id === subcategoryId);
        return {
          id: subcategoryId,
          label: subcategory?.name || "غير مصنف",
          emoji: categoryEmoji(subcategory?.name || "", subcategory?.type || overviewDetailType),
          value,
        };
      })
      .sort((a, b) => b.value - a.value);

    const recent = typeTransactions
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
    const trendMonths = Array.from({ length: 4 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (3 - index));
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthTotal = data.transactions
        .filter((tx) => getMonthKey(tx.date) === monthKey)
        .filter((tx) => {
          if (tx.type !== overviewDetailType) return false;
          if (overviewDetailType === "expense") return !tx.savingsGoalId;
          return true;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);
      return {
        monthKey,
        label: monthKey,
        total: monthTotal,
      };
    });

    return {
      meta: overviewTypeCards.find((item) => item.type === overviewDetailType) || null,
      total,
      breakdown,
      recent,
      trendMonths,
    };
  }, [overviewDetailType, currentMonthTransactions, data.categories, data.transactions, overviewTypeCards]);

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
  const hasOverviewData = monthlyTotals.income > 0 || monthlyTotals.totalOutflow > 0;
  const remainingSpendableBalance = monthlyTotals.income - monthlyTotals.totalOutflow;
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
    const defaultExpenseSubcategoryId = pickDefaultCategoryId(current.categories, "expense");

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
        subcategoryId: template.categoryId,
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
        subcategoryId: bill.categoryId,
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
        subcategoryId: debt.categoryId,
        categoryId: debt.categoryId,
        note: "دفعة شهرية تلقائية",
        linkedId: debt.id,
      });
    }

    for (const goal of current.savingsGoals) {
      if (!goal.monthlyContributionEnabled || goal.monthlyContributionAmount <= 0 || goal.status !== "active") continue;
      if (goal.excludedMonths?.includes(monthKey)) continue;
      const recurringTemplateId = `goal:${goal.id}`;
      const exists = current.transactions.some((tx) => tx.recurringTemplateId === recurringTemplateId && getMonthKey(tx.date) === monthKey);
      if (exists || !defaultExpenseSubcategoryId) continue;

      newTransactions.push({
        id: createBudgetId(),
        type: "expense",
        title: goal.title,
        amount: goal.monthlyContributionAmount,
        date: `${monthKey}-${String(clampDay(1, monthKey)).padStart(2, "0")}`,
        subcategoryId: defaultExpenseSubcategoryId,
        categoryId: defaultExpenseSubcategoryId,
        note: "مساهمة شهرية تلقائية",
        savingsGoalId: goal.id,
        recurringTemplateId,
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
      subcategoryId: pickDefaultCategoryId(data.categories, type),
      savingsGoalId: type === "expense" ? prev.savingsGoalId : "",
    }));
    setIsRecurring(false);
  };

  const commitTransaction = (form: TransactionFormState, recurring: boolean, successMessage?: string) => {
    const amount = parseAmountInput(form.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !form.subcategoryId) return;

    const date = form.date || todayISO();
    let successCategoryName = TRANSACTION_TYPE_LABEL[form.type];

    applyData((current) => {
      let next = { ...current };
      const resolvedCategory = current.categories.find((c) => c.id === form.subcategoryId && c.type === form.type);
      if (!resolvedCategory) return current;
      successCategoryName = resolvedCategory.name;
      const resolvedCategoryId = resolvedCategory.id;
      const resolvedSavingsGoalId = form.type === "expense" && form.savingsGoalId
        ? current.savingsGoals.find((goal) => goal.id === form.savingsGoalId)?.id
        : undefined;
      let linkedId: string | undefined;
      let recurringTemplateId: string | undefined;
      const dayOfMonth = Number(date.split("-")[2]) || 1;

      if (recurring && form.type === "expense" && resolvedSavingsGoalId) {
        recurringTemplateId = `goal:${resolvedSavingsGoalId}`;
        next = {
          ...next,
          savingsGoals: next.savingsGoals.map((goal) =>
            goal.id === resolvedSavingsGoalId
              ? {
                  ...goal,
                  monthlyContributionEnabled: true,
                  monthlyContributionAmount: amount,
                  excludedMonths: goal.excludedMonths.filter((month) => month !== getMonthKey(date)),
                }
              : goal
          ),
        };
      } else if (recurring && form.type !== "bill_payment" && form.type !== "debt_payment") {
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
        title: resolvedSavingsGoalId
          ? current.savingsGoals.find((goal) => goal.id === resolvedSavingsGoalId)?.title || resolvedCategory.name
          : resolvedCategory.name || TRANSACTION_TYPE_LABEL[form.type],
        amount,
        date,
        subcategoryId: resolvedCategoryId,
        categoryId: resolvedCategoryId,
        note: form.note.trim(),
        savingsGoalId: resolvedSavingsGoalId,
        linkedId,
        recurringTemplateId,
      };

      return { ...next, transactions: [payload, ...next.transactions] };
    });

    setTransactionForm(emptyTransactionState("income", pickDefaultCategoryId(data.categories, "income")));
    setIsRecurring(false);
    pushNotice(successMessage || `تمت إضافة ${successCategoryName || "المعاملة"} بنجاح`);
  };

  const saveTransaction = () => {
    const amount = parseAmountInput(transactionForm.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !transactionForm.subcategoryId) {
      pushNotice("أدخل مبلغا صحيحا");
      return;
    }

    const formToSave = {
      ...transactionForm,
      date: todayISO(),
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
      savingsGoals: current.savingsGoals.map((goal) => {
        if (tx.recurringTemplateId !== `goal:${goal.id}`) return goal;
        if (goal.excludedMonths.includes(selectedMonth)) return goal;
        return { ...goal, excludedMonths: [...goal.excludedMonths, selectedMonth] };
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
    const used = data.transactions.some((tx) => tx.subcategoryId === id) || data.bills.some((b) => b.categoryId === id) || data.debts.some((d) => d.categoryId === id);
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
    const recurringAmount = parseAmountInput(goalRecurringAmount);
    if (!goalTitle.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0) return;

    applyData((current) => ({
      ...current,
      savingsGoals: [{
        id: createBudgetId(),
        title: goalTitle.trim(),
        category: goalCategory,
        targetAmount,
        targetDate: goalTargetDate || "",
        monthlyContributionEnabled: goalRecurringEnabled && Number.isFinite(recurringAmount) && recurringAmount > 0,
        monthlyContributionAmount: goalRecurringEnabled && Number.isFinite(recurringAmount) && recurringAmount > 0 ? recurringAmount : 0,
        excludedMonths: [],
        status: "active",
      }, ...current.savingsGoals],
    }));

    setGoalTitle("");
    setGoalTargetAmount("");
    setGoalCategory(DEFAULT_SAVINGS_CATEGORY);
    setGoalTargetDate(endOfMonthISO(selectedMonth));
    setGoalRecurringEnabled(false);
    setGoalRecurringAmount("");
  };

  const addContribution = (goal: BudgetSavingGoal, amount: number) => {
    const subcategoryId = pickDefaultCategoryId(data.categories, "expense");
    if (!Number.isFinite(amount) || amount <= 0 || !subcategoryId) return;

    applyData((current) => ({
      ...current,
      transactions: [{
        id: createBudgetId(),
        type: "expense",
        title: goal.title,
        amount,
        date: todayISO(),
        subcategoryId,
        categoryId: subcategoryId,
        note: "ربط بهدف ادخار",
        savingsGoalId: goal.id,
      }, ...current.transactions],
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
      subcategoryId: tx.subcategoryId,
      savingsGoalId: tx.savingsGoalId || "",
    });
    setEditApplyScope("current");
  };

  const saveEditTransaction = () => {
    if (!editDialog.tx) return;
    const amount = parseAmountInput(editDialog.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !editDialog.subcategoryId) return;

    const applyAllMonths = isRecurringTransaction(editDialog.tx) && editApplyScope === "all";
    const nextDay = Number(editDialog.date.split("-")[2]) || 1;

    applyData((current) => {
      const nextTitle = current.categories.find((c) => c.id === editDialog.subcategoryId)?.name || editDialog.tx?.title || "";
      const nextSavingsGoalId = editDialog.tx?.type === "expense" && editDialog.savingsGoalId
        ? current.savingsGoals.find((goal) => goal.id === editDialog.savingsGoalId)?.id || ""
        : "";

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
                  subcategoryId: editDialog.subcategoryId,
                  categoryId: editDialog.subcategoryId,
                  savingsGoalId: nextSavingsGoalId || undefined,
                }
              : tx,
          ),
        };
      }

      const recurringGoalId = editDialog.tx?.recurringTemplateId?.startsWith("goal:")
        ? editDialog.tx.recurringTemplateId.replace("goal:", "")
        : "";

      return {
        ...current,
        recurringTemplates: current.recurringTemplates.map((template) =>
          template.id === editDialog.tx?.recurringTemplateId
            ? {
                ...template,
                categoryId: editDialog.subcategoryId,
                amount,
                note: editDialog.note.trim(),
                dayOfMonth: nextDay,
              }
            : template,
        ),
        bills: current.bills.map((bill) =>
          bill.id === editDialog.tx?.linkedId && editDialog.tx?.type === "bill_payment"
            ? { ...bill, title: nextTitle, dueDay: nextDay, expectedAmount: amount, categoryId: editDialog.subcategoryId }
            : bill,
        ),
        debts: current.debts.map((debt) =>
          debt.id === editDialog.tx?.linkedId && editDialog.tx?.type === "debt_payment"
            ? { ...debt, title: nextTitle, dueDay: nextDay, totalAmount: amount, categoryId: editDialog.subcategoryId }
            : debt,
        ),
        savingsGoals: current.savingsGoals.map((goal) =>
          goal.id === recurringGoalId
            ? {
                ...goal,
                monthlyContributionAmount: amount,
                monthlyContributionEnabled: true,
              }
            : goal
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
            subcategoryId: editDialog.subcategoryId,
            categoryId: editDialog.subcategoryId,
            note: editDialog.note.trim(),
            savingsGoalId: nextSavingsGoalId || undefined,
            date: `${monthKey}-${String(clampDay(nextDay, monthKey)).padStart(2, "0")}`
          };
        }),
      };
    });

    setEditDialog({ open: false, tx: null, amount: "", date: todayISO(), note: "", subcategoryId: "", savingsGoalId: "" });
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
      transactions: current.transactions.filter((tx) => tx.savingsGoalId !== id),
    }));
    pushNotice("تم حذف هدف الادخار");
  };
  const updateSavingGoalStatus = (id: string, status: BudgetSavingGoalStatus) => {
    applyData((current) => ({
      ...current,
      savingsGoals: current.savingsGoals.map((goal) => goal.id === id ? { ...goal, status } : goal),
    }));
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
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="budget-toolbar-select budget-toolbar-select-trigger" aria-label="اختيار الشهر">
                  <CalendarClock className="w-4 h-4 text-foreground" />
                  <span className="sr-only">{localizedMonthLabel}</span>
                </SelectTrigger>
                <SelectContent dir="rtl" className="budget-rtl-select-content budget-roomy-select-content">
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="budget-select-item">{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={data.settings.currency}
                onValueChange={(value) => applyData((current) => ({ ...current, settings: { ...current.settings, currency: value as BudgetData["settings"]["currency"] } }))}
              >
                <SelectTrigger className="budget-toolbar-select budget-toolbar-select-trigger" aria-label="اختيار العملة">
                  <Landmark className="w-4 h-4 text-foreground" />
                  <span className="sr-only">{data.settings.currency}</span>
                </SelectTrigger>
                <SelectContent dir="rtl" className="budget-rtl-select-content budget-roomy-select-content">
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.code} value={option.code} className="budget-select-item">{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="budget-toolbar-select"
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-5 md:pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
          <SummaryCard title="دخل" amount={monthlyTotals.income} currency={data.settings.currency} tone="income" />
          <SummaryCard title="مصروفات" amount={monthlyTotals.expenses} currency={data.settings.currency} tone="expense" />
          <SummaryCard title="فواتير + ديون" amount={monthlyTotals.bills + monthlyTotals.debts} currency={data.settings.currency} tone="bill" />
          <SummaryCard title="ادخار" amount={monthlyTotals.savings} currency={data.settings.currency} tone="saving" />
          <SummaryCard className="col-span-2 lg:col-span-1" title="الصافي" amount={monthlyTotals.net} currency={data.settings.currency} tone={monthlyTotals.net >= 0 ? "income" : "expense"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base budget-icon-title">
                    <Plus className="w-4 h-4 text-primary" />
                    <span>إضافة معاملة جديدة</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border bg-muted/40 p-3 text-right">
                    <p className="text-sm font-medium text-foreground">إدخال منظم وواضح</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      اختر نوع العملية ثم الفئة الفرعية المناسبة. ويمكنك ربط المصروف بهدف ادخار بشكل منفصل من دون خلطه مع نوع العملية.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Select value={transactionForm.type} onValueChange={(v) => configureTransactionType(v as BudgetTransactionType)}>
                      <SelectTrigger className="budget-rtl-select-trigger">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="rtl" className="budget-rtl-select-content budget-roomy-select-content">
                        {ADD_TRANSACTION_TYPES.map((type) => (
                          <SelectItem key={type} value={type} className="budget-select-item">{`${TYPE_EMOJI[type]} ${TRANSACTION_TYPE_LABEL[type]}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={transactionForm.subcategoryId} onValueChange={(value) => setTransactionForm((prev) => ({ ...prev, subcategoryId: value }))}>
                      <SelectTrigger className="budget-rtl-select-trigger">
                        <SelectValue placeholder="الفئة الفرعية" />
                      </SelectTrigger>
                      <SelectContent dir="rtl" className="budget-rtl-select-content budget-roomy-select-content">
                        {transactionCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id} className="budget-select-item">
                            {`${categoryEmoji(category.name, category.type)} ${category.name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      dir="rtl"
                      type="text"
                      inputMode="decimal"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder={`المبلغ (${symbol})`}
                      className="tabular-nums budget-rtl-input"
                    />
                    <Input
                      dir="rtl"
                      className="budget-rtl-input"
                      value={transactionForm.note}
                      onChange={(e) => setTransactionForm((prev) => ({ ...prev, note: e.target.value }))}
                      placeholder="أضف ملاحظة"
                    />
                  </div>
                  {transactionForm.type === "expense" && (
                    <div className="space-y-2">
                      <Label className="text-sm text-right">ربط بهدف ادخار</Label>
                      <Select value={transactionForm.savingsGoalId || "none"} onValueChange={(value) => setTransactionForm((prev) => ({ ...prev, savingsGoalId: value === "none" ? "" : value }))}>
                        <SelectTrigger className="budget-rtl-select-trigger">
                          <SelectValue placeholder="بدون ربط" />
                        </SelectTrigger>
                        <SelectContent dir="rtl" className="budget-rtl-select-content budget-roomy-select-content">
                          <SelectItem value="none" className="budget-select-item">بدون ربط</SelectItem>
                          {data.savingsGoals.filter((goal) => goal.status === "active").map((goal) => (
                            <SelectItem key={goal.id} value={goal.id} className="budget-select-item">
                              {`${SAVINGS_GOAL_META[goal.category].emoji} ${goal.title}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {RECURRING_ELIGIBLE_TYPES.includes(transactionForm.type) && (
                    <div className="rounded-2xl border bg-card p-3">
                      <div className="rtl-row items-center gap-3">
                        <div className="flex-1 text-right">
                          <p className="text-sm font-medium text-foreground">
                            {transactionForm.type === "expense" && transactionForm.savingsGoalId ? "مساهمة شهرية تلقائية" : "معاملة شهرية تلقائية"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">يمكنك تفعيلها الآن، ثم استثناء أي شهر لاحقاً من داخل السجل.</p>
                        </div>
                        <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                      </div>
                    </div>
                  )}
                  <div className="rtl-row items-center rounded-2xl border bg-muted/30 px-3 py-2">
                    <div className="flex-1 text-right">
                      <p className="text-xs text-muted-foreground">المسار الحالي</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {TRANSACTION_TYPE_LABEL[transactionForm.type]}
                        {transactionForm.subcategoryId && ` • ${data.categories.find((category) => category.id === transactionForm.subcategoryId)?.name || "غير مصنف"}`}
                        {transactionForm.savingsGoalId && ` • ${data.savingsGoals.find((goal) => goal.id === transactionForm.savingsGoalId)?.title || "هدف ادخار"}`}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{TYPE_EMOJI[transactionForm.type]}</Badge>
                  </div>
                  <Button className="w-full" onClick={saveTransaction}>إضافة معاملة</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base budget-icon-title">
                    <PiggyBank className="w-4 h-4 text-emerald-500" />
                    <span>إضافة هدف ادخار</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    dir="rtl"
                    className="budget-rtl-input"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="اسم الهدف"
                  />
                  <Select value={goalCategory} onValueChange={(value) => setGoalCategory(value as BudgetSavingGoalCategory)}>
                    <SelectTrigger className="budget-rtl-select-trigger">
                      <SelectValue placeholder="تصنيف الادخار" />
                    </SelectTrigger>
                    <SelectContent dir="rtl" className="budget-rtl-select-content budget-roomy-select-content">
                      {SAVINGS_GOAL_CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="budget-select-item">
                          {`${SAVINGS_GOAL_META[option.value].emoji} ${option.label}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    dir="rtl"
                    type="text"
                    inputMode="decimal"
                    value={goalTargetAmount}
                    onChange={(e) => setGoalTargetAmount(e.target.value)}
                    placeholder={`المبلغ المستهدف (${symbol})`}
                    className="tabular-nums budget-rtl-input"
                  />
                  <Input
                    dir="ltr"
                    type="date"
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="budget-date-input tabular-nums"
                  />
                  <div className="rounded-2xl border bg-muted/30 p-3 space-y-3">
                    <div className="rtl-row items-center">
                      <div className="flex-1 text-right">
                        <p className="text-sm font-medium text-foreground">مساهمة شهرية تلقائية</p>
                        <p className="mt-1 text-xs text-muted-foreground">ويمكن استثناء أي شهر لاحقاً</p>
                      </div>
                      <Switch checked={goalRecurringEnabled} onCheckedChange={setGoalRecurringEnabled} />
                    </div>
                    {goalRecurringEnabled && (
                      <Input
                        dir="rtl"
                        type="text"
                        inputMode="decimal"
                        value={goalRecurringAmount}
                        onChange={(e) => setGoalRecurringAmount(e.target.value)}
                        placeholder={`المبلغ الشهري (${symbol})`}
                        className="tabular-nums budget-rtl-input"
                      />
                    )}
                  </div>
                  <Button className="w-full" onClick={addSavingGoal}>إضافة الهدف</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base budget-icon-title">
                    <PiggyBank className="w-4 h-4 text-emerald-500" />
                    <span>أهداف الادخار</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                <div className="rtl-row items-center">
                  <div className="flex-1 text-right">
                    <p className="text-sm font-medium text-foreground">متابعة تراكمية + شهرية</p>
                    <p className="mt-1 text-xs text-muted-foreground">كل هدف يستمر عبر الأشهر، مع عرض مساهمة هذا الشهر بشكل منفصل.</p>
                  </div>
                  <Select value={goalStatusFilter} onValueChange={(value) => setGoalStatusFilter(value as typeof goalStatusFilter)}>
                    <SelectTrigger className="h-8 w-[128px] budget-rtl-select-trigger">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl" className="budget-rtl-select-content">
                      <SelectItem value="all" className="budget-select-item">الكل</SelectItem>
                      <SelectItem value="active" className="budget-select-item">نشطة</SelectItem>
                      <SelectItem value="completed" className="budget-select-item">مكتملة</SelectItem>
                      <SelectItem value="archived" className="budget-select-item">مؤرشفة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  {savingsGoalCards.length === 0 && <p className="text-sm text-right text-muted-foreground">لا توجد أهداف ادخار مطابقة حالياً.</p>}
                  {savingsGoalCards.map((goal) => {
                    return (
                      <div key={goal.id} className="group rounded-2xl border bg-muted/50 p-3 shadow-sm">
                        <div className="rtl-row items-start">
                          <div className="flex-1 text-right">
                            <div className="rtl-row items-center gap-2">
                              <p className="font-semibold text-foreground">{goal.title}</p>
                              <Badge variant="secondary" className="rounded-full">{getSavingsStatusLabel(goal.status)}</Badge>
                            </div>
                            <div className="mt-2 flex flex-wrap justify-end gap-2 text-xs">
                              <Badge variant="outline" className="rounded-full">{`${SAVINGS_GOAL_META[goal.category].emoji} ${getSavingsGoalCategoryLabel(goal.category)}`}</Badge>
                              {goal.targetDate && <Badge variant="outline" className="rounded-full">{`الاستحقاق: ${goal.targetDate}`}</Badge>}
                              {goal.monthlyContributionEnabled && <Badge variant="outline" className="rounded-full">{`تلقائي: ${formatAmount(goal.monthlyContributionAmount, data.settings.currency)}`}</Badge>}
                            </div>
                          </div>
                          <div className="budget-value-left flex items-center gap-2">
                            <Select value={goal.status} onValueChange={(value) => updateSavingGoalStatus(goal.id, value as BudgetSavingGoalStatus)}>
                              <SelectTrigger className="h-7 w-[96px] budget-rtl-select-trigger text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent dir="rtl" className="budget-rtl-select-content">
                                <SelectItem value="active" className="budget-select-item">نشط</SelectItem>
                                <SelectItem value="completed" className="budget-select-item">مكتمل</SelectItem>
                                <SelectItem value="archived" className="budget-select-item">مؤرشف</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="destructive" size="sm" className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition text-xs h-7" onClick={() => deleteSavingGoal(goal.id)}>حذف</Button>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="rounded-xl border bg-background/70 p-2.5 text-right">
                            <p className="text-[11px] text-muted-foreground">الإجمالي</p>
                            <p className="mt-1 rtl-number text-sm font-semibold text-foreground">{formatAmount(goal.totalSaved, data.settings.currency)}</p>
                          </div>
                          <div className="rounded-xl border bg-background/70 p-2.5 text-right">
                            <p className="text-[11px] text-muted-foreground">هذا الشهر</p>
                            <p className="mt-1 rtl-number text-sm font-semibold text-foreground">
                              {goal.monthlySaved > 0 ? formatAmount(goal.monthlySaved, data.settings.currency) : "لا توجد مساهمة هذا الشهر"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-right text-xs">
                          <div className="rounded-xl bg-background/70 p-2">
                            <p className="text-muted-foreground">المستهدف</p>
                            <p className="mt-1 rtl-number font-semibold text-foreground">{formatAmount(goal.targetAmount, data.settings.currency)}</p>
                          </div>
                          <div className="rounded-xl bg-background/70 p-2">
                            <p className="text-muted-foreground">المتبقي</p>
                            <p className="mt-1 rtl-number font-semibold text-foreground">{formatAmount(goal.remaining, data.settings.currency)}</p>
                          </div>
                          <div className="rounded-xl bg-background/70 p-2">
                            <p className="text-muted-foreground">التقدم</p>
                            <p className="mt-1 font-semibold text-foreground">{goal.progress}%</p>
                          </div>
                        </div>
                        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-lg bg-muted">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${goal.progress}%` }} transition={{ duration: 0.35 }} className="h-full bg-emerald-500" />
                        </div>
                        <div className="mt-3 rtl-row items-center">
                          <div className="flex-1 text-right text-xs text-muted-foreground">
                            {goal.lastContributionDate ? `آخر مساهمة: ${goal.lastContributionDate}` : "لم يتم تسجيل أي مساهمة بعد"}
                          </div>
                          <Button size="sm" className="h-8 rounded-xl text-xs" onClick={() => openSavingContributionDialog(goal)}>إضافة مساهمة</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base budget-icon-title">
                    <Wallet className="w-4 h-4 text-primary" />
                    <span>نظرة عامّة</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="mb-3 rounded-xl border bg-muted/50 p-3">
                  <div className="rtl-row text-xs mb-1"><span className="flex-1 text-right">الدخل</span><span className="budget-value-left rtl-number tabular-nums">{formatAmount(monthlyTotals.income, data.settings.currency)}</span></div>
                  <div className="w-full h-2.5 rounded-lg bg-muted overflow-hidden mb-2"><motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="h-full bg-emerald-500" /></div>
                  <div className="rtl-row text-xs mb-1"><span className="flex-1 text-right">المصروف الكلي</span><span className="budget-value-left rtl-number tabular-nums">{formatAmount(monthlyTotals.totalOutflow, data.settings.currency)}</span></div>
                  <div className="w-full h-2.5 rounded-lg bg-muted overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${monthlyTotals.income > 0 ? Math.min((monthlyTotals.totalOutflow / monthlyTotals.income) * 100, 100) : 0}%` }} className="h-full bg-rose-500" /></div>
                  {hasOverviewData && (
                    <div className={cn(
                      "mt-3 rounded-xl border px-3 py-2 text-right",
                      remainingSpendableBalance >= 0
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                    )}>
                      <div className="rtl-row items-center gap-3">
                        <p className="flex-1 text-xs font-medium leading-5">
                          {remainingSpendableBalance >= 0
                            ? "المتبقي القابل للصرف بعد المصروف الكلي"
                            : "تم تجاوز الدخل بهذا المقدار بعد احتساب المصروف الكلي"}
                        </p>
                        <Badge variant="secondary" className="rtl-number whitespace-nowrap rounded-full border border-current/15 bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-inherit shadow-none">
                          {formatAmount(remainingSpendableBalance, data.settings.currency)}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {overviewTypeCards.map((item) => (
                    <Button
                      key={item.type}
                      variant="outline"
                      className="h-auto rounded-2xl border bg-card p-4 text-start font-normal"
                      onClick={() => setOverviewDetailType(item.type)}
                    >
                      <div className="w-full rtl-row items-start">
                        <div className="flex-1 text-right">
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                        </div>
                        <div className="budget-value-left text-left">
                          <p className={cn("rtl-number whitespace-nowrap text-base font-semibold", item.tone)}>{formatAmount(item.total, data.settings.currency)}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">عرض التفاصيل</p>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>

                <div className="rounded-2xl border bg-card p-4">
                  <div className="rtl-row items-center">
                    <div className="flex-1 text-right">
                      <p className="text-sm font-semibold text-foreground">صناديق الادخار النشطة</p>
                      <p className="mt-1 text-xs text-muted-foreground">عرض سريع للإجمالي والمساهمة الشهرية لكل هدف نشط.</p>
                    </div>
                    <Badge variant="outline" className="rounded-full">{`${savingsGoalCards.filter((goal) => goal.status === "active").length} أهداف`}</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {savingsGoalCards.filter((goal) => goal.status === "active").slice(0, 3).map((goal) => (
                      <div key={goal.id} className="rounded-xl bg-muted/40 p-3">
                        <div className="rtl-row items-center">
                          <div className="flex-1 text-right">
                            <p className="text-sm font-medium text-foreground">{`${SAVINGS_GOAL_META[goal.category].emoji} ${goal.title}`}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {`هذا الشهر: ${goal.monthlySaved > 0 ? formatAmount(goal.monthlySaved, data.settings.currency) : "لا توجد مساهمة هذا الشهر"}`}
                            </p>
                          </div>
                          <div className="budget-value-left text-left">
                            <p className="rtl-number text-sm font-semibold text-foreground">{formatAmount(goal.totalSaved, data.settings.currency)}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">{`${goal.progress}%`}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {savingsGoalCards.filter((goal) => goal.status === "active").length === 0 && (
                      <p className="text-sm text-right text-muted-foreground">لا توجد أهداف ادخار نشطة حالياً.</p>
                    )}
                  </div>
                </div>

                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6" onMouseLeave={() => setHoveredOverviewSegment(null)}>
                  <div className="flex justify-center">
                    <div className="budget-overview-donut relative h-60 w-60">
                      <svg viewBox="0 0 180 180" className="w-full h-full drop-shadow-sm">
                        <circle cx="90" cy="90" r="56" fill="none" stroke="rgba(148, 163, 184, 0.18)" strokeWidth="18" />
                        {donutSegments.map((segment) => (
                          <g key={segment.id}>
                            <path
                              d={describeArcPath(90, 90, 56, segment.startAngle, segment.endAngle)}
                              fill="none"
                              stroke="transparent"
                              strokeWidth={34}
                              strokeLinecap="butt"
                              pointerEvents="stroke"
                              onPointerEnter={() => setHoveredOverviewSegment(segment.id)}
                              onPointerMove={() => setHoveredOverviewSegment(segment.id)}
                              onPointerLeave={() => setHoveredOverviewSegment(null)}
                            />
                            <path
                              d={describeArcPath(90, 90, 56, segment.startAngle, segment.endAngle)}
                              fill="none"
                              stroke={segment.color}
                              strokeWidth={18}
                              strokeLinecap="butt"
                              opacity={0.84}
                              pointerEvents="none"
                            />
                          </g>
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
                            pointerEvents="none"
                          />
                        )}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border border-border bg-card px-2 text-center">
                          <p className="text-[11px] text-muted-foreground leading-tight">{activeOverviewSegment?.name || "إجمالي الصرف"}</p>
                          <p className="rtl-number whitespace-nowrap text-sm font-bold text-foreground tabular-nums">{activeOverviewSegment ? `${activeOverviewSegment.percent}%` : formatAmount(monthlyTotals.totalOutflow, data.settings.currency)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="max-w-xs text-sm text-right text-muted-foreground">
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
                          <p className="flex-1 text-right font-medium text-foreground">{`${segment.emoji} ${segment.name}`}</p>
                          <p className="budget-value-left text-muted-foreground tabular-nums"><span className="inline-block rtl-number tabular-nums whitespace-nowrap">{formatAmount(segment.total, data.settings.currency)}</span> • {segment.percent}%</p>
                        </div>
                        <div className="w-full h-2.5 bg-muted rounded-lg overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${segment.percent}%` }} transition={{ duration: 0.35 }} className="h-full" style={{ backgroundColor: segment.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 space-y-2.5">
                  <div className="text-base budget-icon-title">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span>تحليل مالي ذكي</span>
                  </div>
                  {upcomingWarnings.map((warning, index) => (
                    <div
                      key={`${warning.text}_${index}`}
                      className={cn(
                        "px-1 py-1 text-sm text-right",
                        warning.tone === "danger" && "text-destructive",
                        warning.tone === "warn" && "text-amber-700 dark:text-amber-300",
                        warning.tone === "good" && "text-emerald-700 dark:text-emerald-300"
                      )}
                    >
                      {warning.text}
                    </div>
                  ))}
                </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base budget-icon-title">
                    <CalendarClock className="w-4 h-4 text-primary" />
                    <span>آخر عمليات هذا الشهر</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="relative md:col-span-2">
                    <Search className="w-4 h-4 absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      dir="rtl"
                      value={recentSearch}
                      onChange={(e) => setRecentSearch(e.target.value)}
                      placeholder="ابحث عن عملية محددة"
                      className="budget-rtl-input-with-icon"
                    />
                  </div>
                  <Select value={recentFilter} onValueChange={(v) => setRecentFilter(v as typeof recentFilter)}>
                    <SelectTrigger className="budget-rtl-select-trigger"><SelectValue /></SelectTrigger>
                    <SelectContent dir="rtl" className="budget-rtl-select-content budget-roomy-select-content">
                      <SelectItem value="all" className="budget-select-item">الكل</SelectItem>
                      <SelectItem value="income" className="budget-select-item">دخل</SelectItem>
                      <SelectItem value="expense" className="budget-select-item">مصروف</SelectItem>
                      <SelectItem value="bill_payment" className="budget-select-item">فاتورة</SelectItem>
                      <SelectItem value="debt_payment" className="budget-select-item">دين</SelectItem>
                      <SelectItem value="linked_savings" className="budget-select-item">مرتبطة بادخار</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 max-h-[520px] overflow-auto modern-scrollbar">
                  {recentTransactions.length === 0 && <p className="text-sm text-muted-foreground">لا توجد عمليات مطابقة.</p>}
                  {recentTransactions.map((tx) => {
                    const category = data.categories.find((c) => c.id === tx.subcategoryId);
                    const linkedGoal = tx.savingsGoalId ? data.savingsGoals.find((goal) => goal.id === tx.savingsGoalId) : null;
                    const emoji = categoryEmoji(category?.name || "", category?.type || tx.type);
                    const rowTitle = linkedGoal ? `${SAVINGS_GOAL_META[linkedGoal.category].emoji} ${linkedGoal.title}` : `${emoji} ${category?.name || TRANSACTION_TYPE_LABEL[tx.type]}`;
                    const metaLine = `${TRANSACTION_TYPE_LABEL[tx.type]} • ${tx.date}${linkedGoal ? " • ربط بهدف ادخار" : ""}`;

                    return (
                      <Button key={tx.id} variant="outline" className="w-full h-auto justify-between p-3 text-start font-normal" onClick={() => setOperationActionsTx(tx)}>
                        <div className="rtl-row items-start w-full">
                          <div className="flex-1 text-right">
                            <p className="font-semibold text-foreground">{rowTitle}</p>
                            <p className="text-xs text-muted-foreground mt-1">{metaLine}</p>
                            {tx.note && <p className="text-xs text-muted-foreground mt-1">{tx.note}</p>}
                          </div>
                          <p className={cn("budget-value-left font-bold tabular-nums", tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                            <span className="inline-block rtl-number tabular-nums whitespace-nowrap">{formatAmount(tx.amount, data.settings.currency)}</span>
                          </p>
                        </div>
                      </Button>
                    );
                  })}
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
              className="tabular-nums mt-2 budget-rtl-input"
            />
            <DialogFooter className="sm:flex-row-reverse">
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
      <Dialog open={!!overviewDetailType} onOpenChange={(open) => { if (!open) setOverviewDetailType(null); }}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{overviewDetailData?.meta?.title || "تفاصيل القسم"}</DialogTitle>
            <DialogDescription>{overviewDetailData?.meta?.description || "عرض تفصيلي قابل للتوسعة لاحقاً."}</DialogDescription>
          </DialogHeader>
          {overviewDetailData && (
            <div className="space-y-4">
              <div className="rounded-2xl border bg-muted/40 p-4">
                <div className="rtl-row items-center">
                  <div className="flex-1 text-right">
                    <p className="text-sm font-medium text-foreground">الإجمالي لهذا الشهر</p>
                    <p className="mt-1 text-xs text-muted-foreground">نقطة انطلاق سريعة قبل إضافة الرسم البياني الكامل لاحقاً.</p>
                  </div>
                  <Badge variant="secondary" className="rtl-number rounded-full px-3 py-1">{formatAmount(overviewDetailData.total, data.settings.currency)}</Badge>
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <div className="rtl-row items-center">
                  <p className="flex-1 text-right text-sm font-medium text-foreground">اتجاه الأشهر الأخيرة</p>
                  <Badge variant="outline" className="rounded-full">Placeholder</Badge>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {overviewDetailData.trendMonths.map((item) => {
                    const max = Math.max(...overviewDetailData.trendMonths.map((entry) => entry.total), 1);
                    const height = item.total > 0 ? Math.max((item.total / max) * 100, 12) : 8;
                    return (
                      <div key={item.monthKey} className="flex flex-col items-center justify-end gap-2 rounded-xl bg-muted/40 p-2">
                        <div className="flex h-24 items-end">
                          <div className="w-8 rounded-t-lg bg-primary/70" style={{ height: `${height}%` }} />
                        </div>
                        <p className="rtl-number text-[11px] font-medium text-foreground">{formatAmount(item.total, data.settings.currency)}</p>
                        <p className="text-center text-[10px] leading-4 text-muted-foreground">{item.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-card p-4">
                  <p className="text-sm font-medium text-right text-foreground">تفصيل الفئات الفرعية</p>
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    {overviewDetailData.breakdown.length === 0 && <p className="text-sm text-right text-muted-foreground">لا توجد بيانات تفصيلية بعد.</p>}
                    {overviewDetailData.breakdown.map((item) => (
                      <div key={item.id} className="rtl-row rounded-xl bg-muted/40 p-2.5 text-sm">
                        <p className="flex-1 text-right font-medium text-foreground">{`${item.emoji} ${item.label}`}</p>
                        <p className="budget-value-left rtl-number text-muted-foreground">{formatAmount(item.value, data.settings.currency)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border bg-card p-4">
                  <p className="text-sm font-medium text-right text-foreground">أحدث العمليات</p>
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    {overviewDetailData.recent.length === 0 && <p className="text-sm text-right text-muted-foreground">لا توجد عمليات حديثة لهذا القسم.</p>}
                    {overviewDetailData.recent.map((tx) => {
                      const subcategory = data.categories.find((category) => category.id === tx.subcategoryId);
                      return (
                        <div key={tx.id} className="rounded-xl bg-muted/40 p-2.5">
                          <div className="rtl-row text-sm">
                            <p className="flex-1 text-right font-medium text-foreground">{subcategory?.name || tx.title}</p>
                            <p className="budget-value-left rtl-number text-muted-foreground">{formatAmount(tx.amount, data.settings.currency)}</p>
                          </div>
                          <p className="mt-1 text-right text-xs text-muted-foreground">{tx.date}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={editDialog.open && !!editDialog.tx} onOpenChange={(open) => { if (!open) setEditDialog({ open: false, tx: null, amount: "", date: todayISO(), note: "", subcategoryId: "", savingsGoalId: "" }); }}>
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
                className="tabular-nums budget-rtl-input"
              />
              <Input
                dir="ltr"
                type="date"
                value={editDialog.date}
                onChange={(e) => setEditDialog((prev) => ({ ...prev, date: e.target.value }))}
                className="hidden budget-date-input tabular-nums"
                aria-hidden="true"
                tabIndex={-1}
              />
              {isRecurringTransaction(editDialog.tx) && (
                <div className="rounded-lg border bg-muted/50 p-2 space-y-2 text-right">
                  <p className="text-xs text-muted-foreground">تطبيق التعديل على</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" size="sm" variant={editApplyScope === "current" ? "default" : "secondary"} onClick={() => setEditApplyScope("current")}>هذا الشهر فقط</Button>
                    <Button type="button" size="sm" variant={editApplyScope === "all" ? "default" : "secondary"} onClick={() => setEditApplyScope("all")}>كل الأشهر</Button>
                  </div>
                </div>
              )}
              <Select value={editDialog.subcategoryId} onValueChange={(v) => setEditDialog((prev) => ({ ...prev, subcategoryId: v }))}>
                <SelectTrigger className="budget-rtl-select-trigger"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl" className="budget-rtl-select-content budget-roomy-select-content">
                  {data.categories.filter((c) => c.type === editDialog.tx?.type).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="budget-select-item">{`${categoryEmoji(cat.name, cat.type)} ${cat.name}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editDialog.tx.type === "expense" && (
                <Select value={editDialog.savingsGoalId || "none"} onValueChange={(v) => setEditDialog((prev) => ({ ...prev, savingsGoalId: v === "none" ? "" : v }))}>
                  <SelectTrigger className="budget-rtl-select-trigger"><SelectValue placeholder="ربط بهدف ادخار" /></SelectTrigger>
                  <SelectContent dir="rtl" className="budget-rtl-select-content budget-roomy-select-content">
                    <SelectItem value="none" className="budget-select-item">بدون ربط</SelectItem>
                    {data.savingsGoals.filter((goal) => goal.status === "active" || goal.id === editDialog.savingsGoalId).map((goal) => (
                      <SelectItem key={goal.id} value={goal.id} className="budget-select-item">{`${SAVINGS_GOAL_META[goal.category].emoji} ${goal.title}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Input
                dir="rtl"
                className="budget-rtl-input"
                value={editDialog.note}
                onChange={(e) => setEditDialog((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="أضف ملاحظة"
              />
            </div>
          )}
          <DialogFooter className="sm:flex-row-reverse">
            <Button variant="secondary" onClick={() => setEditDialog({ open: false, tx: null, amount: "", date: todayISO(), note: "", subcategoryId: "", savingsGoalId: "" })}>إلغاء</Button>
            <Button onClick={saveEditTransaction}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={categoriesDialogOpen} onOpenChange={setCategoriesDialogOpen}>
        <DialogContent className="max-w-2xl budget-scroll-panel modern-scrollbar" dir="rtl">
          <DialogHeader>
            <DialogTitle>إعدادات الفئات</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base budget-widget-title">تخصيص الفئات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Select value={categoryType} onValueChange={(v) => setCategoryType(v as BudgetCategoryType)}>
                    <SelectTrigger className="budget-rtl-select-trigger"><SelectValue /></SelectTrigger>
                    <SelectContent dir="rtl" className="budget-rtl-select-content budget-roomy-select-content">
                      {(Object.keys(TRANSACTION_TYPE_LABEL) as BudgetTransactionType[]).map((type) => (
                        <SelectItem key={type} value={type} className="budget-select-item">{`${TYPE_EMOJI[type]} ${TRANSACTION_TYPE_LABEL[type]}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    dir="rtl"
                    className="budget-rtl-input"
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
                  <CardTitle className="text-base budget-widget-title">{`${TYPE_EMOJI[type]} ${TRANSACTION_TYPE_LABEL[type]}`}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categoriesByType[type].map((cat) => (
                      <div key={cat.id} className="group rounded-xl bg-muted/50 p-2.5 rtl-row items-center">
                        {editingCategoryId === cat.id ? (
                          <Input
                            dir="rtl"
                            className="flex-1 h-8 budget-rtl-input"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                          />
                        ) : (
                          <p className="flex-1 font-medium text-foreground text-right">{`${categoryEmoji(cat.name, cat.type)} ${cat.name}`}</p>
                        )}
                        <div className="budget-actions">
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
  className,
  title,
  amount,
  currency,
  tone,
}: {
  className?: string;
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
    <Card className={cn("p-5 transition-all hover:shadow-md", className)}>
      <CardContent className="p-0">
        <div className="rtl-row items-center">
          <div className="flex-1 text-right">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">{title}</p>
            <p className={cn("text-2xl md:text-[28px] font-bold leading-tight mt-1", entry.text)}>
              <span className="inline-block tabular-nums whitespace-nowrap" style={{ direction: "ltr", unicodeBidi: "bidi-override" }}>
                {formatAmount(amount, currency)}
              </span>
            </p>
          </div>
          <span className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg p-1.5", entry.soft)}>
            <Icon className="w-4 h-4" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}













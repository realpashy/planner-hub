import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarClock, Landmark, Menu, Moon, PiggyBank, Plus, ReceiptText, Search, Settings2, Sun, TrendingUp, Wallet } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
const NEW_SUBCATEGORY_VALUE = "__new_subcategory__";

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

const SAVINGS_GOAL_BEHAVIOR: Record<
  BudgetSavingGoalCategory,
  {
    targetMode: "required" | "optional" | "hidden";
    defaultRecurring: boolean;
    targetLabel: string;
    targetPlaceholder: string;
    recurringLabel: string;
    recurringPlaceholder: string;
    allowCustomName: boolean;
    customNameRequired: boolean;
  }
> = {
  emergency_fund: {
    targetMode: "required",
    defaultRecurring: false,
    targetLabel: "المبلغ المستهدف (₪)",
    targetPlaceholder: "كم تريد الوصول إليه؟",
    recurringLabel: "المساهمة الشهرية (₪)",
    recurringPlaceholder: "كم تريد ادخاره شهريًا؟",
    allowCustomName: false,
    customNameRequired: false,
  },
  personal_investments: {
    targetMode: "optional",
    defaultRecurring: false,
    targetLabel: "المبلغ المستهدف (اختياري)",
    targetPlaceholder: "يمكن تركه فارغًا",
    recurringLabel: "المساهمة الشهرية (₪)",
    recurringPlaceholder: "كم تضيف شهريًا؟",
    allowCustomName: false,
    customNameRequired: false,
  },
  retirement: {
    targetMode: "hidden",
    defaultRecurring: true,
    targetLabel: "المساهمة الشهرية (₪)",
    targetPlaceholder: "كم تدفع شهريًا؟",
    recurringLabel: "المساهمة الشهرية (₪)",
    recurringPlaceholder: "كم تدفع شهريًا؟",
    allowCustomName: false,
    customNameRequired: false,
  },
  education_fund: {
    targetMode: "hidden",
    defaultRecurring: true,
    targetLabel: "المساهمة الشهرية (₪)",
    targetPlaceholder: "كم تدفع شهريًا؟",
    recurringLabel: "المساهمة الشهرية (₪)",
    recurringPlaceholder: "كم تدفع شهريًا؟",
    allowCustomName: false,
    customNameRequired: false,
  },
  housing: {
    targetMode: "required",
    defaultRecurring: false,
    targetLabel: "المبلغ المستهدف (₪)",
    targetPlaceholder: "كم تحتاج للسكن؟",
    recurringLabel: "المساهمة الشهرية (₪)",
    recurringPlaceholder: "كم تضيف شهريًا؟",
    allowCustomName: false,
    customNameRequired: false,
  },
  children: {
    targetMode: "required",
    defaultRecurring: false,
    targetLabel: "المبلغ المستهدف (₪)",
    targetPlaceholder: "كم تريد ادخاره للأطفال؟",
    recurringLabel: "المساهمة الشهرية (₪)",
    recurringPlaceholder: "كم تضيف شهريًا؟",
    allowCustomName: false,
    customNameRequired: false,
  },
  travel: {
    targetMode: "required",
    defaultRecurring: false,
    targetLabel: "المبلغ المستهدف (₪)",
    targetPlaceholder: "كم تحتاج للرحلة؟",
    recurringLabel: "المساهمة الشهرية (₪)",
    recurringPlaceholder: "كم تضيف شهريًا؟",
    allowCustomName: true,
    customNameRequired: false,
  },
  personal_goal: {
    targetMode: "required",
    defaultRecurring: false,
    targetLabel: "المبلغ المستهدف (₪)",
    targetPlaceholder: "ما هو هدفك المالي؟",
    recurringLabel: "المساهمة الشهرية (₪)",
    recurringPlaceholder: "كم تضيف شهريًا؟",
    allowCustomName: true,
    customNameRequired: true,
  },
  big_purchases: {
    targetMode: "required",
    defaultRecurring: false,
    targetLabel: "المبلغ المستهدف (₪)",
    targetPlaceholder: "ما هي قيمة الهدف الكبير؟",
    recurringLabel: "المساهمة الشهرية (₪)",
    recurringPlaceholder: "كم تضيف شهريًا؟",
    allowCustomName: true,
    customNameRequired: true,
  },
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
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

function shiftMonthKey(monthKey: string, offset: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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

function getSavingsGoalBehavior(category: BudgetSavingGoalCategory) {
  return SAVINGS_GOAL_BEHAVIOR[category];
}

function getSavingsGoalDisplayTitle(goal: Pick<BudgetSavingGoal, "category" | "customName" | "title">) {
  const customName = goal.customName?.trim();
  if (customName) return customName;
  if (goal.title?.trim()) return goal.title;
  return SAVINGS_GOAL_META[goal.category].shortLabel;
}

function shouldShowSavingsCustomName(category: BudgetSavingGoalCategory) {
  return getSavingsGoalBehavior(category).allowCustomName;
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
  subcategoryId: string;
  savingsGoalId: string;
}

interface SavingsGoalEditDialogState {
  open: boolean;
  goalId: string | null;
  category: BudgetSavingGoalCategory;
  customName: string;
  targetAmount: string;
  recurringEnabled: boolean;
  status: BudgetSavingGoalStatus;
}

interface DeleteConfirmState {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (() => void) | null;
}

type ThemeMode = "light" | "dark";

type EditApplyScope = "current" | "all";
type OverviewDetailKey = BudgetTransactionType | "saving";
interface CreateSubcategoryDialogState {
  open: boolean;
  type: BudgetTransactionType;
  name: string;
}

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

  const [goalCustomName, setGoalCustomName] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalCategory, setGoalCategory] = useState<BudgetSavingGoalCategory>(DEFAULT_SAVINGS_CATEGORY);
  const [goalRecurringEnabled, setGoalRecurringEnabled] = useState(getSavingsGoalBehavior(DEFAULT_SAVINGS_CATEGORY).defaultRecurring);
  const [goalRecurringAmount, setGoalRecurringAmount] = useState("");
  const [goalStatusFilter, setGoalStatusFilter] = useState<BudgetSavingGoalStatus | "all">("all");

  const [recentSearch, setRecentSearch] = useState("");
  const [recentFilter, setRecentFilter] = useState<"all" | "linked_savings" | BudgetTransactionType>("all");

  const [operationActionsTx, setOperationActionsTx] = useState<BudgetTransaction | null>(null);
  const [hoveredOverviewSegment, setHoveredOverviewSegment] = useState<string | null>(null);
  const [selectedOverviewSegment, setSelectedOverviewSegment] = useState<string | null>(null);
  const [overviewDetailType, setOverviewDetailType] = useState<OverviewDetailKey | null>(null);

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
    subcategoryId: "",
    savingsGoalId: "",
  });
  const [savingsGoalEditDialog, setSavingsGoalEditDialog] = useState<SavingsGoalEditDialogState>({
    open: false,
    goalId: null,
    category: DEFAULT_SAVINGS_CATEGORY,
    customName: "",
    targetAmount: "",
    recurringEnabled: getSavingsGoalBehavior(DEFAULT_SAVINGS_CATEGORY).defaultRecurring,
    status: "active",
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    open: false,
    title: "",
    description: "",
    confirmLabel: "حذف",
    onConfirm: null,
  });
  const [editApplyScope, setEditApplyScope] = useState<EditApplyScope>("current");
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);
  const [createSubcategoryDialog, setCreateSubcategoryDialog] = useState<CreateSubcategoryDialogState>({
    open: false,
    type: "expense",
    name: "",
  });
  const overviewInteractionRef = useRef<HTMLDivElement | null>(null);

  const pushNotice = (message: string) => {
    toast({ description: message, duration: 3000 });
  };
  const applyThemeMode = (mode: ThemeMode) => {
    if (typeof window === "undefined") return;
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("planner_hub_theme", mode);
    window.dispatchEvent(new CustomEvent("planner-theme-change", { detail: { theme: mode } }));
    setThemeMode(mode);
  };
  const closeDeleteConfirm = () => {
    setDeleteConfirm({ open: false, title: "", description: "", confirmLabel: "حذف", onConfirm: null });
  };
  const openDeleteConfirm = (title: string, description: string, onConfirm: () => void, confirmLabel = "حذف") => {
    setDeleteConfirm({ open: true, title, description, confirmLabel, onConfirm });
  };
  const goalBehavior = getSavingsGoalBehavior(goalCategory);

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
  const previousMonthKey = useMemo(() => shiftMonthKey(selectedMonth, -1), [selectedMonth]);
  const previousMonthTransactions = useMemo(
    () => data.transactions.filter((tx) => getMonthKey(tx.date) === previousMonthKey),
    [data.transactions, previousMonthKey],
  );
  const previousMonthTotals = useMemo(
    () => getMonthlyTotals(data.transactions, previousMonthKey),
    [data.transactions, previousMonthKey],
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
        const linkedGoal = tx.savingsGoalId ? getSavingsGoalDisplayTitle(data.savingsGoals.find((goal) => goal.id === tx.savingsGoalId) || { category: "personal_goal", customName: "", title: "" }) : "";
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
        const displayTitle = getSavingsGoalDisplayTitle(goal);
        const totalSaved = (goal.initialAmount || 0) + (savingsByGoalId.get(goal.id) || 0);
        const monthlySaved = monthlySavingsByGoalId.get(goal.id) || 0;
        const hasTarget = goal.targetAmount > 0;
        const remaining = hasTarget ? Math.max(goal.targetAmount - totalSaved, 0) : 0;
        const progress = hasTarget ? Math.min(Math.round((totalSaved / goal.targetAmount) * 100), 100) : 0;
        return {
          ...goal,
          displayTitle,
          hasTarget,
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
    { type: "income" as OverviewDetailKey, title: "الدخل", total: monthlyTotals.income, description: "كل مصادر الدخل المسجلة لهذا الشهر", tone: "text-emerald-600 dark:text-emerald-400" },
    { type: "expense" as OverviewDetailKey, title: "المصروفات", total: monthlyTotals.expenses, description: "المصروفات التشغيلية الأساسية", tone: "text-rose-600 dark:text-rose-400" },
    { type: "bill_payment" as OverviewDetailKey, title: "الفواتير", total: monthlyTotals.bills, description: "الاستحقاقات الثابتة لهذا الشهر", tone: "text-amber-600 dark:text-amber-400" },
    { type: "debt_payment" as OverviewDetailKey, title: "الديون", total: monthlyTotals.debts, description: "دفعات الديون والبطاقات", tone: "text-indigo-600 dark:text-indigo-400" },
    { type: "saving" as OverviewDetailKey, title: "الادخار", total: monthlyTotals.savings, description: "المبالغ المرتبطة بأهداف الادخار", tone: "text-sky-600 dark:text-sky-400" },
  ]), [monthlyTotals]);
  const overviewDetailData = useMemo(() => {
    if (!overviewDetailType) return null;

    const typeTransactions = currentMonthTransactions.filter((tx) => {
      if (overviewDetailType === "saving") return Boolean(tx.savingsGoalId);
      if (tx.type !== overviewDetailType) return false;
      if (overviewDetailType === "expense") return !tx.savingsGoalId;
      return true;
    });
    const total = typeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const breakdownMap = new Map<string, number>();
    for (const tx of typeTransactions) {
      const key = overviewDetailType === "saving" ? (tx.savingsGoalId || tx.subcategoryId) : tx.subcategoryId;
      breakdownMap.set(key, (breakdownMap.get(key) || 0) + tx.amount);
    }
    const breakdown = Array.from(breakdownMap.entries())
      .map(([subcategoryId, value]) => {
        const linkedGoal = overviewDetailType === "saving"
          ? data.savingsGoals.find((goal) => goal.id === subcategoryId)
          : null;
        const subcategory = data.categories.find((category) => category.id === subcategoryId);
        return {
          id: subcategoryId,
          label: linkedGoal ? getSavingsGoalDisplayTitle(linkedGoal) : (subcategory?.name || "غير مصنف"),
          emoji: linkedGoal ? SAVINGS_GOAL_META[linkedGoal.category].emoji : categoryEmoji(subcategory?.name || "", subcategory?.type || "expense"),
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
          if (overviewDetailType === "saving") return Boolean(tx.savingsGoalId);
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
    const segments = [
      { id: "expense", typeKey: "expense" as OverviewDetailKey, name: "مصروفات", emoji: "🛍️", total: monthlyTotals.expenses, color: "#ef4444" },
      { id: "bill_payment", typeKey: "bill_payment" as OverviewDetailKey, name: "فواتير", emoji: "🧾", total: monthlyTotals.bills, color: "#f59e0b" },
      { id: "debt_payment", typeKey: "debt_payment" as OverviewDetailKey, name: "ديون", emoji: "🏦", total: monthlyTotals.debts, color: "#6366f1" },
      { id: "saving", typeKey: "saving" as OverviewDetailKey, name: "ادخار", emoji: "🏦", total: monthlyTotals.savings, color: "#0ea5e9" },
    ].filter((segment) => segment.total > 0);

    if (segments.length === 0 || monthlyTotals.totalOutflow <= 0) return [];
    return segments.map((segment) => ({
      ...segment,
      percent: Math.max(1, Math.round((segment.total / monthlyTotals.totalOutflow) * 100)),
    }));
  }, [monthlyTotals]);

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

  const activeOverviewSegment = useMemo(() => {
    const activeId = hoveredOverviewSegment || selectedOverviewSegment;
    return activeId ? donutSegments.find((segment) => segment.id === activeId) || null : null;
  }, [donutSegments, hoveredOverviewSegment, selectedOverviewSegment]);
  const hasOverviewData = monthlyTotals.income > 0 || monthlyTotals.totalOutflow > 0;
  const remainingSpendableBalance = monthlyTotals.income - monthlyTotals.totalOutflow;
  const upcomingWarnings = useMemo(() => {
    const insights: Array<{ id: string; priority: number; tone: "good" | "warn" | "danger"; text: string }> = [];
    const addInsight = (id: string, priority: number, tone: "good" | "warn" | "danger", text: string) => {
      if (insights.some((item) => item.id === id)) return;
      insights.push({ id, priority, tone, text });
    };

    const income = monthlyTotals.income;
    const outflow = monthlyTotals.totalOutflow;
    const expenseRatio = income > 0 ? Math.round((monthlyTotals.expenses / income) * 100) : 0;
    const billsRatio = income > 0 ? Math.round((monthlyTotals.bills / income) * 100) : 0;
    const debtsRatio = income > 0 ? Math.round((monthlyTotals.debts / income) * 100) : 0;
    const savingsRatio = income > 0 ? Math.round((monthlyTotals.savings / income) * 100) : 0;
    const previousOutflow = previousMonthTotals.totalOutflow;
    const previousSavings = previousMonthTotals.savings;
    const activeGoals = data.savingsGoals.filter((goal) => goal.status === "active");
    const emergencyGoal = activeGoals.find((goal) => goal.category === "emergency_fund");
    const emergencyGoalMonthlySaved = emergencyGoal ? monthlySavingsByGoalId.get(emergencyGoal.id) || 0 : 0;
    const recurringGoalsWithoutContribution = activeGoals.filter((goal) => goal.monthlyContributionEnabled && (monthlySavingsByGoalId.get(goal.id) || 0) === 0);

    const categoryTotals = currentMonthTransactions
      .filter((tx) => tx.type !== "income")
      .map((tx) => {
        const linkedGoal = tx.savingsGoalId ? data.savingsGoals.find((goal) => goal.id === tx.savingsGoalId) : null;
        const subcategory = data.categories.find((category) => category.id === tx.subcategoryId);
        return {
          amount: tx.amount,
          type: tx.savingsGoalId ? "saving" : tx.type,
          label: linkedGoal ? getSavingsGoalDisplayTitle(linkedGoal) : (subcategory?.name || tx.title || "غير مصنف"),
        };
      });

    const topDriver = [...categoryTotals].sort((a, b) => b.amount - a.amount)[0];
    const topExpenseCategory = expenseByCategory[0];
    const topExpenseShare = monthlyTotals.expenses > 0 && topExpenseCategory
      ? Math.round((topExpenseCategory.total / monthlyTotals.expenses) * 100)
      : 0;

    const billBreakdown = currentMonthTransactions
      .filter((tx) => tx.type === "bill_payment")
      .reduce((map, tx) => {
        const label = data.categories.find((category) => category.id === tx.subcategoryId)?.name || tx.title || "فاتورة";
        map.set(label, (map.get(label) || 0) + tx.amount);
        return map;
      }, new Map<string, number>());
    const topBill = Array.from(billBreakdown.entries()).sort((a, b) => b[1] - a[1])[0];
    const topBillShare = monthlyTotals.bills > 0 && topBill ? Math.round((topBill[1] / monthlyTotals.bills) * 100) : 0;

    const currentExpenseCategoryTotals = currentMonthTransactions
      .filter((tx) => tx.type === "expense" && !tx.savingsGoalId)
      .reduce((map, tx) => {
        const name = data.categories.find((category) => category.id === tx.subcategoryId)?.name || "غير مصنف";
        map.set(name, (map.get(name) || 0) + tx.amount);
        return map;
      }, new Map<string, number>());

    const previousExpenseCategoryTotals = previousMonthTransactions
      .filter((tx) => tx.type === "expense" && !tx.savingsGoalId)
      .reduce((map, tx) => {
        const name = data.categories.find((category) => category.id === tx.subcategoryId)?.name || "غير مصنف";
        map.set(name, (map.get(name) || 0) + tx.amount);
        return map;
      }, new Map<string, number>());

    const foodCurrent = Array.from(currentExpenseCategoryTotals.entries())
      .filter(([name]) => /(طعام|مطعم|قهوة|بقالة|سوبر)/.test(name))
      .reduce((sum, [, value]) => sum + value, 0);
    const foodPrevious = Array.from(previousExpenseCategoryTotals.entries())
      .filter(([name]) => /(طعام|مطعم|قهوة|بقالة|سوبر)/.test(name))
      .reduce((sum, [, value]) => sum + value, 0);

    const transportCurrent = Array.from(currentExpenseCategoryTotals.entries())
      .filter(([name]) => /(مواصل|وقود|بنزين|سيارة)/.test(name))
      .reduce((sum, [, value]) => sum + value, 0);
    const transportPrevious = Array.from(previousExpenseCategoryTotals.entries())
      .filter(([name]) => /(مواصل|وقود|بنزين|سيارة)/.test(name))
      .reduce((sum, [, value]) => sum + value, 0);

    const discretionaryCurrent = Array.from(currentExpenseCategoryTotals.entries())
      .filter(([name]) => /(تسوق|ترفيه)/.test(name))
      .reduce((sum, [, value]) => sum + value, 0);

    const consistentSavingsGoals = activeGoals.filter((goal) => {
      const monthKeys = [selectedMonth, shiftMonthKey(selectedMonth, -1), shiftMonthKey(selectedMonth, -2)];
      return monthKeys.every((monthKey) =>
        data.transactions.some((tx) => tx.savingsGoalId === goal.id && getMonthKey(tx.date) === monthKey)
      );
    });

    if (income === 0 && outflow > 0) {
      addInsight("no-income", 100, "danger", "لا يوجد دخل مسجل هذا الشهر رغم وجود مصروفات. سجّل الدخل أولاً حتى تكون القراءة المالية دقيقة.");
    }

    if (income > 0 && outflow > income) {
      addInsight("overspending", 95, "danger", `إجمالي الصرف تجاوز الدخل هذا الشهر بمقدار ${formatAmount(outflow - income, data.settings.currency)}، ويحتاج ذلك إلى تهدئة سريعة للمصروفات.`);
    }

    if (income > 0 && expenseRatio >= 75) {
      addInsight("high-expense-ratio", 92, "danger", `المصروفات التشغيلية وحدها تستهلك ${expenseRatio}% من الدخل، وهذا ضغط مرتفع على السيولة.`);
    } else if (income > 0 && expenseRatio >= 55) {
      addInsight("watch-expense-ratio", 74, "warn", `المصروفات التشغيلية عند ${expenseRatio}% من الدخل. راقب البنود غير الضرورية قبل نهاية الشهر.`);
    }

    if (income > 0 && debtsRatio >= 25) {
      addInsight("debt-burden", 88, "danger", `الديون تستهلك ${debtsRatio}% من الدخل هذا الشهر، وهذا عبء مرتفع يحتاج ضبطاً في الدفعات القادمة.`);
    } else if (income > 0 && debtsRatio >= 15) {
      addInsight("debt-watch", 68, "warn", `نسبة الديون وصلت إلى ${debtsRatio}% من الدخل. من الجيد مراقبتها حتى لا تزاحم الادخار.`);
    }

    if (income > 0 && billsRatio >= 35) {
      addInsight("bill-pressure", 80, "warn", `الفواتير الثابتة تستهلك ${billsRatio}% من الدخل هذا الشهر، ما يعني ضغطاً واضحاً من الالتزامات المتكررة.`);
    }

    if (topBill && topBillShare >= 55) {
      addInsight("bill-concentration", 66, "warn", `أعلى فاتورة هذا الشهر هي ${topBill[0]} وتشكل ${topBillShare}% من إجمالي الفواتير.`);
    }

    if (topExpenseCategory && topExpenseShare >= 45) {
      addInsight("expense-concentration", 78, "warn", `أكبر بند مصروف هذا الشهر هو ${topExpenseCategory.name} ويستحوذ على ${topExpenseShare}% من المصروفات التشغيلية.`);
    }

    if (foodPrevious > 0 && foodCurrent >= foodPrevious * 1.25) {
      addInsight("food-rise", 72, "warn", `مصروف الطعام ارتفع مقارنة بالشهر السابق بحوالي ${formatAmount(foodCurrent - foodPrevious, data.settings.currency)}.`);
    }

    if (transportPrevious > 0 && transportCurrent >= transportPrevious * 1.25) {
      addInsight("transport-rise", 70, "warn", `تكلفة المواصلات ارتفعت بشكل ملحوظ هذا الشهر مقارنة بالشهر السابق.`);
    }

    if (monthlyTotals.expenses > 0 && discretionaryCurrent >= monthlyTotals.expenses * 0.35) {
      addInsight("discretionary-high", 69, "warn", `بنود التسوق والترفيه تمثل جزءاً كبيراً من المصروفات هذا الشهر، فمراجعتها قد تمنحك هامشاً أسرع.`);
    }

    if (activeGoals.length > 0 && monthlyTotals.savings === 0) {
      addInsight("missing-savings", 90, "warn", "لديك أهداف ادخار نشطة لكن لم تُسجل أي مساهمة هذا الشهر حتى الآن.");
    } else if (income > 0 && savingsRatio >= 20) {
      addInsight("strong-savings", 64, "good", `هذا شهر ادخار قوي: تم توجيه ${savingsRatio}% من الدخل إلى الأهداف الادخارية.`);
    } else if (income > 0 && savingsRatio > 0 && savingsRatio < 10) {
      addInsight("low-savings", 61, "warn", `نسبة الادخار الحالية ${savingsRatio}% فقط من الدخل، ويمكن تحسينها بخطوة صغيرة في المصروفات المرنة.`);
    }

    if (previousSavings > 0 && monthlyTotals.savings >= previousSavings * 1.3) {
      addInsight("savings-momentum", 58, "good", "مساهمات الادخار هذا الشهر أفضل بوضوح من الشهر السابق، وهذا مؤشر إيجابي على الانضباط المالي.");
    }

    if (emergencyGoal && emergencyGoalMonthlySaved === 0) {
      addInsight("emergency-fund", 62, "warn", "صندوق الطوارئ نشط لكن بدون مساهمة هذا الشهر. حتى دفعة صغيرة تحافظ على الاستمرارية.");
    }

    if (recurringGoalsWithoutContribution.length > 0) {
      addInsight("missed-goals", 57, "warn", `هناك ${recurringGoalsWithoutContribution.length} هدف ادخار بتفعيل شهري لكن من دون مساهمة مسجلة هذا الشهر.`);
    }

    if (consistentSavingsGoals.length > 0) {
      addInsight("consistent-goals", 54, "good", `تحافظ على مساهمة منتظمة في ${consistentSavingsGoals.length} هدف ادخار لعدة أشهر متتالية، وهذا ممتاز لبناء التراكم.`);
    }

    if (topDriver && topDriver.amount > 0) {
      addInsight("top-driver", 52, topDriver.type === "saving" ? "good" : "warn", `أكبر بند مالي هذا الشهر هو ${topDriver.label} بقيمة ${formatAmount(topDriver.amount, data.settings.currency)}.`);
    }

    if (previousOutflow > 0 && outflow <= previousOutflow * 0.85) {
      addInsight("better-than-previous", 50, "good", "إجمالي الصرف انخفض مقارنة بالشهر السابق، وهذا تحسن واضح في الإيقاع المالي.");
    } else if (previousOutflow > 0 && outflow >= previousOutflow * 1.2) {
      addInsight("worse-than-previous", 73, "warn", "الصرف هذا الشهر أعلى من الشهر السابق بشكل ملحوظ. راجع البنود التي قفزت سريعاً.");
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
      addInsight("due-soon", 84, "danger", `هناك ${nearBills.length} فاتورة و${nearDebts.length} دفعة دين مستحقة قريباً خلال الأيام القادمة.`);
    }

    if (!hasOverviewData) {
      return [{ tone: "good" as const, text: "ابدأ بتسجيل دخل أو مصروفات هذا الشهر ليظهر لك تحليل مالي ذكي مخصص لبياناتك الفعلية." }];
    }

    if (insights.length === 0 && currentMonthTransactions.length <= 3) {
      return [{ tone: "good" as const, text: "البيانات الحالية ما زالت محدودة. بعد تسجيل عدة عمليات إضافية سيظهر تحليل أدق للأنماط والاتجاهات." }];
    }

    if (insights.length === 0) {
      return [{ tone: "good" as const, text: "الوضع المالي هذا الشهر يبدو متوازناً حتى الآن، ولا توجد إشارات ضغط بارزة في البيانات الحالية." }];
    }

    return insights
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 6)
      .map(({ tone, text }) => ({ tone, text }));
  }, [
    monthlyTotals,
    previousMonthTotals,
    previousMonthTransactions,
    data.bills,
    data.categories,
    data.debts,
    data.savingsGoals,
    data.settings.currency,
    data.transactions,
    currentMonthTransactions,
    expenseByCategory,
    monthlySavingsByGoalId,
    billPaymentsById,
    debtPaymentsById,
    selectedMonth,
    hasOverviewData,
  ]);

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
        title: getSavingsGoalDisplayTitle(goal),
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const readThemeMode = () => {
      const stored = localStorage.getItem("planner_hub_theme");
      if (stored === "dark" || stored === "light") {
        setThemeMode(stored);
        return;
      }
      setThemeMode(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    };

    readThemeMode();
    const handleThemeEvent = (event: Event) => {
      const nextTheme = (event as CustomEvent<{ theme?: ThemeMode }>).detail?.theme;
      if (nextTheme === "dark" || nextTheme === "light") {
        setThemeMode(nextTheme);
        return;
      }
      readThemeMode();
    };

    window.addEventListener("planner-theme-change", handleThemeEvent);
    return () => window.removeEventListener("planner-theme-change", handleThemeEvent);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (overviewInteractionRef.current?.contains(target)) return;
      setSelectedOverviewSegment(null);
      setHoveredOverviewSegment(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    setSelectedOverviewSegment(null);
    setHoveredOverviewSegment(null);
  }, [selectedMonth]);

  useEffect(() => {
    setGoalRecurringEnabled(goalBehavior.defaultRecurring);
    if (goalBehavior.targetMode === "hidden") {
      setGoalTargetAmount("");
    }
  }, [goalBehavior.defaultRecurring, goalBehavior.targetMode, goalCategory]);

  const createSubcategory = (type: BudgetTransactionType, rawName: string) => {
    const name = rawName.trim();
    if (!name) return "";
    const existing = data.categories.find((category) => category.type === type && category.name === name);
    if (existing) return existing.id;

    const nextId = createBudgetId();
    applyData((current) => ({
      ...current,
      categories: [{ id: nextId, type, name }, ...current.categories],
    }));
    return nextId;
  };

  const confirmCreateSubcategory = () => {
    const createdId = createSubcategory(createSubcategoryDialog.type, createSubcategoryDialog.name);
    if (!createdId) return;
    if (editDialog.open && editDialog.tx?.type === createSubcategoryDialog.type) {
      setEditDialog((prev) => ({ ...prev, subcategoryId: createdId }));
    } else {
      setTransactionForm((prev) => ({ ...prev, subcategoryId: createdId, type: createSubcategoryDialog.type }));
    }
    setCreateSubcategoryDialog({ open: false, type: createSubcategoryDialog.type, name: "" });
  };

  const handleSubcategorySelection = (value: string, type: BudgetTransactionType) => {
    if (value === NEW_SUBCATEGORY_VALUE) {
      setCreateSubcategoryDialog({ open: true, type, name: "" });
      return;
    }
    setTransactionForm((prev) => ({ ...prev, subcategoryId: value }));
  };

  const handleEditSubcategorySelection = (value: string, type: BudgetTransactionType) => {
    if (value === NEW_SUBCATEGORY_VALUE) {
      setCreateSubcategoryDialog({ open: true, type, name: "" });
      return;
    }
    setEditDialog((prev) => ({ ...prev, subcategoryId: value }));
  };

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
                  updatedAt: new Date().toISOString(),
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
          ? getSavingsGoalDisplayTitle(current.savingsGoals.find((goal) => goal.id === resolvedSavingsGoalId) || { category: "personal_goal", customName: "", title: resolvedCategory.name })
          : resolvedCategory.name || TRANSACTION_TYPE_LABEL[form.type],
        amount,
        date,
        subcategoryId: resolvedCategoryId,
        categoryId: resolvedCategoryId,
        note: "",
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
        return { ...goal, excludedMonths: [...goal.excludedMonths, selectedMonth], updatedAt: new Date().toISOString() };
      }),
      transactions: current.transactions.filter((item) => item.id !== tx.id),
    }));
  };

  const addCategory = () => {
    const name = categoryName.trim();
    if (!name) return;
    createSubcategory(categoryType, name);
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
    const resolvedCustomName = goalBehavior.allowCustomName ? goalCustomName.trim() : "";
    const resolvedTitle = resolvedCustomName || SAVINGS_GOAL_META[goalCategory].shortLabel;
    const requiresName = goalBehavior.customNameRequired;
    const requiresTarget = goalBehavior.targetMode === "required";
    const allowsTarget = goalBehavior.targetMode !== "hidden";

    if (requiresName && !resolvedCustomName) return;
    if (requiresTarget && (!Number.isFinite(targetAmount) || targetAmount <= 0)) return;

    applyData((current) => ({
      ...current,
      savingsGoals: [{
        id: createBudgetId(),
        title: resolvedTitle,
        category: goalCategory,
        customName: resolvedCustomName,
        targetAmount: allowsTarget && Number.isFinite(targetAmount) && targetAmount > 0 ? targetAmount : 0,
        targetDate: "",
        initialAmount: 0,
        monthlyContributionEnabled: goalRecurringEnabled,
        monthlyContributionAmount: goalRecurringEnabled && Number.isFinite(recurringAmount) && recurringAmount > 0 ? recurringAmount : 0,
        excludedMonths: [],
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, ...current.savingsGoals],
    }));

    setGoalCustomName("");
    setGoalTargetAmount("");
    setGoalCategory(DEFAULT_SAVINGS_CATEGORY);
    setGoalRecurringEnabled(getSavingsGoalBehavior(DEFAULT_SAVINGS_CATEGORY).defaultRecurring);
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
        title: getSavingsGoalDisplayTitle(goal),
        amount,
        date: todayISO(),
        subcategoryId,
        categoryId: subcategoryId,
        note: "",
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
    openAmountDialog("إضافة مساهمة ادخار", getSavingsGoalDisplayTitle(goal), remaining || 100, (amount) => {
      addContribution(goal, amount);
    });
  };

  const openEditTransactionDialog = (tx: BudgetTransaction) => {
    setEditDialog({
      open: true,
      tx,
      amount: String(tx.amount),
      date: tx.date,
      subcategoryId: tx.subcategoryId,
      savingsGoalId: tx.savingsGoalId || "",
    });
    setEditApplyScope("current");
  };

  const saveEditTransaction = () => {
    if (!editDialog.tx) return;
    const isLinkedSavingsTransaction = Boolean(editDialog.tx.savingsGoalId);
    const amount = parseAmountInput(editDialog.amount);
    const effectiveSubcategoryId = isLinkedSavingsTransaction ? editDialog.tx.subcategoryId : editDialog.subcategoryId;
    if (!Number.isFinite(amount) || amount <= 0 || !effectiveSubcategoryId) return;

    const applyAllMonths = isRecurringTransaction(editDialog.tx) && editApplyScope === "all";
    const nextDay = Number(editDialog.date.split("-")[2]) || 1;

    applyData((current) => {
      const nextSavingsGoalId = isLinkedSavingsTransaction
        ? editDialog.tx?.savingsGoalId || ""
        : editDialog.tx?.type === "expense" && editDialog.savingsGoalId
        ? current.savingsGoals.find((goal) => goal.id === editDialog.savingsGoalId)?.id || ""
        : "";
      const linkedGoal = nextSavingsGoalId ? current.savingsGoals.find((goal) => goal.id === nextSavingsGoalId) : null;
      const nextTitle = linkedGoal
        ? getSavingsGoalDisplayTitle(linkedGoal)
        : current.categories.find((c) => c.id === effectiveSubcategoryId)?.name || editDialog.tx?.title || "";

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
                  subcategoryId: effectiveSubcategoryId,
                  categoryId: effectiveSubcategoryId,
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
                categoryId: effectiveSubcategoryId,
                amount,
                note: "",
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
                updatedAt: new Date().toISOString(),
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
            subcategoryId: effectiveSubcategoryId,
            categoryId: effectiveSubcategoryId,
            note: "",
            savingsGoalId: nextSavingsGoalId || undefined,
            date: `${monthKey}-${String(clampDay(nextDay, monthKey)).padStart(2, "0")}`
          };
        }),
      };
    });

    setEditDialog({ open: false, tx: null, amount: "", date: todayISO(), subcategoryId: "", savingsGoalId: "" });
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
      savingsGoals: current.savingsGoals.map((goal) =>
        goal.id === id ? { ...goal, status, updatedAt: new Date().toISOString() } : goal
      ),
    }));
  };
  const updateSavingGoalInitialAmount = (id: string, rawValue: string) => {
    const value = parseAmountInput(rawValue);
    applyData((current) => ({
      ...current,
      savingsGoals: current.savingsGoals.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              initialAmount: Number.isFinite(value) && value > 0 ? value : 0,
              updatedAt: new Date().toISOString(),
            }
          : goal
      ),
    }));
  };
  const openEditSavingsGoalDialog = (goal: BudgetSavingGoal) => {
    setSavingsGoalEditDialog({
      open: true,
      goalId: goal.id,
      category: goal.category,
      customName: goal.customName || "",
      targetAmount: goal.targetAmount > 0 ? String(goal.targetAmount) : "",
      recurringEnabled: goal.monthlyContributionEnabled,
      status: goal.status,
    });
  };
  const saveSavingsGoalEdit = () => {
    if (!savingsGoalEditDialog.goalId) return;
    const behavior = getSavingsGoalBehavior(savingsGoalEditDialog.category);
    const customName = behavior.allowCustomName ? savingsGoalEditDialog.customName.trim() : "";
    const targetAmount = parseAmountInput(savingsGoalEditDialog.targetAmount);
    if (behavior.customNameRequired && !customName) return;
    if (behavior.targetMode === "required" && (!Number.isFinite(targetAmount) || targetAmount <= 0)) return;

    applyData((current) => ({
      ...current,
      savingsGoals: current.savingsGoals.map((goal) =>
        goal.id === savingsGoalEditDialog.goalId
          ? {
              ...goal,
              category: savingsGoalEditDialog.category,
              customName,
              title: customName || SAVINGS_GOAL_META[savingsGoalEditDialog.category].shortLabel,
              targetAmount:
                behavior.targetMode !== "hidden" && Number.isFinite(targetAmount) && targetAmount > 0
                  ? targetAmount
                  : 0,
              monthlyContributionEnabled: savingsGoalEditDialog.recurringEnabled,
              status: savingsGoalEditDialog.status,
              updatedAt: new Date().toISOString(),
            }
          : goal
      ),
    }));
    setSavingsGoalEditDialog({
      open: false,
      goalId: null,
      category: DEFAULT_SAVINGS_CATEGORY,
      customName: "",
      targetAmount: "",
      recurringEnabled: getSavingsGoalBehavior(DEFAULT_SAVINGS_CATEGORY).defaultRecurring,
      status: "active",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-12" dir="rtl">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="relative flex min-h-[48px] items-center justify-between gap-3 md:min-h-[56px]">
            <div className="absolute left-0 flex items-center gap-2 md:hidden">
              <Button
                variant="outline"
                className="h-10 rounded-2xl px-4 text-sm font-medium shadow-sm"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-4 w-4" />
                الخيارات
              </Button>
            </div>
            <div className="hidden items-center gap-2 md:flex">
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
            <h1 className="mx-auto hidden items-center gap-2 text-center text-base font-bold text-foreground sm:text-lg md:absolute md:left-1/2 md:flex md:mx-0 md:-translate-x-1/2 md:px-0 md:text-2xl">
              <Wallet className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
              الميزانيّة الشهرية
            </h1>
            <div className="absolute right-0 flex items-center justify-end gap-2 md:hidden">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-background/75 shadow-sm backdrop-blur" asChild>
                <Link href="/">
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2 px-1 py-2">
                <Wallet className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold text-foreground whitespace-nowrap">الميزانيّة الشهرية</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-[92vw] max-w-[26rem] p-0 [&>button]:left-5 [&>button]:right-auto [&>button]:top-5 [&>button]:h-9 [&>button]:w-9 [&>button]:rounded-full"
          dir="rtl"
        >
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b px-6 pb-4 pt-6 pe-14 text-right">
              <SheetTitle className="text-xl">الخيارات</SheetTitle>
              <SheetDescription className="text-sm leading-6">إعدادات الميزانية والوصول السريع من الجوال.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-right">اختيار التاريخ</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="budget-rtl-select-trigger h-12 rounded-2xl border-slate-200 bg-white px-4 text-sm dark:border-border dark:bg-background/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="budget-rtl-select-content budget-roomy-select-content">
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="budget-select-item">{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-right">اختيار العملة</Label>
                <Select
                  value={data.settings.currency}
                  onValueChange={(value) => applyData((current) => ({ ...current, settings: { ...current.settings, currency: value as BudgetData["settings"]["currency"] } }))}
                >
                  <SelectTrigger className="budget-rtl-select-trigger h-12 rounded-2xl border-slate-200 bg-white px-4 text-sm dark:border-border dark:bg-background/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="budget-rtl-select-content budget-roomy-select-content">
                    {CURRENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.code} value={option.code} className="budget-select-item">{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-border dark:bg-muted/30">
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">المظهر</p>
                  <p className="mt-1 text-sm text-muted-foreground">{`المظهر الحالي: ${themeMode === "dark" ? "داكن" : "فاتح"}`}</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={themeMode === "light" ? "default" : "outline"}
                    className="h-11 justify-center rounded-2xl text-sm"
                    onClick={() => applyThemeMode("light")}
                  >
                    <Sun className="h-4 w-4" />
                    فاتح
                  </Button>
                  <Button
                    type="button"
                    variant={themeMode === "dark" ? "default" : "outline"}
                    className="h-11 justify-center rounded-2xl text-sm"
                    onClick={() => applyThemeMode("dark")}
                  >
                    <Moon className="h-4 w-4" />
                    داكن
                  </Button>
                </div>
              </div>

              <Button
                variant="secondary"
                className="h-12 w-full justify-between rounded-2xl px-4 text-sm"
                onClick={() => { setCategoriesDialogOpen(true); setMobileMenuOpen(false); }}
              >
                <span>إعدادات الفئات</span>
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-auto border-t bg-background/95 px-6 py-5">
              <Button variant="outline" className="h-12 w-full justify-between rounded-2xl px-4 text-sm" asChild>
                <Link href="/">
                  <span>العودة إلى الرئيسية</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-5 md:pt-6">
        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-6">
          <SummaryCard title="دخل" amount={monthlyTotals.income} currency={data.settings.currency} tone="income" onClick={() => setOverviewDetailType("income")} />
          <SummaryCard title="مصروفات" amount={monthlyTotals.expenses} currency={data.settings.currency} tone="expense" onClick={() => setOverviewDetailType("expense")} />
          <SummaryCard title="فواتير" amount={monthlyTotals.bills} currency={data.settings.currency} tone="bill" onClick={() => setOverviewDetailType("bill_payment")} />
          <SummaryCard title="ديون" amount={monthlyTotals.debts} currency={data.settings.currency} tone="bill" onClick={() => setOverviewDetailType("debt_payment")} />
          <SummaryCard title="ادخار" amount={monthlyTotals.savings} currency={data.settings.currency} tone="saving" onClick={() => setOverviewDetailType("saving")} />
          <SummaryCard title="الصافي" amount={monthlyTotals.net} currency={data.settings.currency} tone={monthlyTotals.net >= 0 ? "income" : "expense"} />
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
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm text-right">الفئة الرئيسية</Label>
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
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-right">الفئة الفرعية</Label>
                      <Select value={transactionForm.subcategoryId} onValueChange={(value) => handleSubcategorySelection(value, transactionForm.type)}>
                        <SelectTrigger className="budget-rtl-select-trigger">
                          <SelectValue placeholder="اختر الفئة الفرعية" />
                        </SelectTrigger>
                        <SelectContent dir="rtl" className="budget-rtl-select-content budget-roomy-select-content">
                          {transactionCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id} className="budget-select-item">
                              {`${categoryEmoji(category.name, category.type)} ${category.name}`}
                            </SelectItem>
                          ))}
                          <SelectItem value={NEW_SUBCATEGORY_VALUE} className="budget-select-item">+ إضافة فئة فرعية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm text-right">المبلغ</Label>
                      <Input
                        dir="rtl"
                        type="text"
                        inputMode="decimal"
                        value={transactionForm.amount}
                        onChange={(e) => setTransactionForm((prev) => ({ ...prev, amount: e.target.value }))}
                        placeholder={`المبلغ (${symbol})`}
                        className="tabular-nums budget-rtl-input"
                      />
                    </div>
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
                              {`${SAVINGS_GOAL_META[goal.category].emoji} ${getSavingsGoalDisplayTitle(goal)}`}
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
                        {transactionForm.savingsGoalId && ` • ${getSavingsGoalDisplayTitle(data.savingsGoals.find((goal) => goal.id === transactionForm.savingsGoalId) || { category: "personal_goal", customName: "", title: "" })}`}
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm text-right">الفئة الرئيسية</Label>
                      <Select
                        value={goalCategory}
                        onValueChange={(value) => {
                          const nextCategory = value as BudgetSavingGoalCategory;
                          setGoalCategory(nextCategory);
                          setGoalRecurringEnabled(getSavingsGoalBehavior(nextCategory).defaultRecurring);
                          if (!getSavingsGoalBehavior(nextCategory).allowCustomName) {
                            setGoalCustomName("");
                          }
                        }}
                      >
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
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-right">{goalBehavior.targetMode === "hidden" ? goalBehavior.recurringLabel : goalBehavior.targetLabel}</Label>
                      <Input
                        dir="rtl"
                        type="text"
                        inputMode="decimal"
                        value={goalBehavior.targetMode === "hidden" ? goalRecurringAmount : goalTargetAmount}
                        onChange={(e) => goalBehavior.targetMode === "hidden" ? setGoalRecurringAmount(e.target.value) : setGoalTargetAmount(e.target.value)}
                        placeholder={goalBehavior.targetMode === "hidden" ? goalBehavior.recurringPlaceholder : goalBehavior.targetPlaceholder}
                        className="tabular-nums budget-rtl-input"
                      />
                    </div>
                  </div>
                  {goalBehavior.allowCustomName && (
                    <div className="space-y-2">
                      <Label className="text-sm text-right">{goalBehavior.customNameRequired ? "اسم الهدف" : "اسم الهدف (اختياري)"}</Label>
                      <Input
                        dir="rtl"
                        className="budget-rtl-input"
                        value={goalCustomName}
                        onChange={(e) => setGoalCustomName(e.target.value)}
                        placeholder="اكتب اسمًا مخصصًا"
                      />
                    </div>
                  )}
                  <div className="rounded-2xl border bg-muted/30 p-3 space-y-3">
                    <div className="rtl-row items-center">
                      <div className="flex-1 text-right">
                        <p className="text-sm font-medium text-foreground">مساهمة شهرية تلقائية</p>
                        <p className="mt-1 text-xs text-muted-foreground">ويمكن استثناء أي شهر لاحقاً</p>
                      </div>
                      <Switch checked={goalRecurringEnabled} onCheckedChange={setGoalRecurringEnabled} />
                    </div>
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
                <div className="space-y-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">متابعة تراكمية + شهرية</p>
                    <p className="mt-1 text-xs text-muted-foreground">كل هدف يبقى مستمرًا، بينما يتم احتساب مساهمة هذا الشهر بشكل منفصل.</p>
                  </div>
                  <Tabs dir="rtl" value={goalStatusFilter} onValueChange={(value) => setGoalStatusFilter(value as typeof goalStatusFilter)}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="all">الكل</TabsTrigger>
                      <TabsTrigger value="active">نشط</TabsTrigger>
                      <TabsTrigger value="completed">مكتمل</TabsTrigger>
                      <TabsTrigger value="archived">مؤرشف</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="space-y-4">
                  {savingsGoalCards.length === 0 && <p className="text-sm text-right text-muted-foreground">لا توجد أهداف ادخار مطابقة حالياً.</p>}
                  {savingsGoalCards.map((goal) => {
                    return (
                      <div key={goal.id} className="group relative mt-[30px] rounded-3xl border border-slate-200/80 bg-white/95 p-4 pt-5 shadow-[0_14px_40px_-24px_rgba(15,23,42,0.24)] transition hover:border-slate-300/70 dark:border-border dark:bg-muted/40 dark:shadow-none">
                        <div className="absolute right-4 top-0 -translate-y-1/2">
                          <Badge variant="outline" className="whitespace-nowrap rounded-full border-slate-200 bg-white px-2.5 py-1 text-slate-700 shadow-sm dark:border-border dark:bg-slate-950 dark:text-foreground">
                            {`${SAVINGS_GOAL_META[goal.category].emoji} ${getSavingsGoalCategoryLabel(goal.category)}`}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                          <div className="min-w-0 flex-1 text-right">
                            <p className="w-full truncate text-right text-base font-semibold text-foreground">{goal.displayTitle}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Select value={goal.status} onValueChange={(value) => updateSavingGoalStatus(goal.id, value as BudgetSavingGoalStatus)}>
                              <SelectTrigger className="h-8 w-[108px] budget-rtl-select-trigger border-slate-200 bg-white text-xs dark:border-border dark:bg-background/60">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent dir="rtl" className="budget-rtl-select-content">
                                <SelectItem value="active" className="budget-select-item">نشط</SelectItem>
                                <SelectItem value="completed" className="budget-select-item">مكتمل</SelectItem>
                                <SelectItem value="archived" className="budget-select-item">مؤرشف</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 min-w-[48px] justify-center rounded-xl px-2 text-xs text-muted-foreground transition-colors hover:text-destructive"
                              onClick={() => openDeleteConfirm("حذف هدف الادخار", "سيتم حذف الهدف وكل المساهمات المرتبطة به. هل تريد المتابعة؟", () => deleteSavingGoal(goal.id))}
                            >
                              حذف
                            </Button>
                          </div>
                        </div>
                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 text-right dark:border-border dark:bg-background/70">
                            <p className="text-[11px] text-muted-foreground">الإجمالي</p>
                            <p className="mt-1 rtl-number text-sm font-semibold text-foreground">{formatAmount(goal.totalSaved, data.settings.currency)}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 text-right dark:border-border dark:bg-background/70">
                            <p className="text-[11px] text-muted-foreground">هذا الشهر</p>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {goal.monthlySaved > 0 ? <span className="rtl-number">{formatAmount(goal.monthlySaved, data.settings.currency)}</span> : "لا توجد مساهمة هذا الشهر"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-3 text-right text-xs">
                          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-2.5 dark:border-border dark:bg-background/70">
                            <p className="text-muted-foreground">الهدف</p>
                            <p className="mt-1 font-semibold text-foreground">{goal.hasTarget ? <span className="rtl-number">{formatAmount(goal.targetAmount, data.settings.currency)}</span> : "غير محدد"}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-2.5 dark:border-border dark:bg-background/70">
                            <p className="text-muted-foreground">المتبقي</p>
                            <p className="mt-1 font-semibold text-foreground">{goal.hasTarget ? <span className="rtl-number">{formatAmount(goal.remaining, data.settings.currency)}</span> : "مرن"}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-2.5 dark:border-border dark:bg-background/70">
                            <p className="text-muted-foreground">التقدم</p>
                            <p className="mt-1 font-semibold text-foreground">{goal.hasTarget ? `${goal.progress}%` : "مرن"}</p>
                          </div>
                        </div>
                        <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${goal.progress}%` }} transition={{ duration: 0.35 }} className="h-full bg-emerald-500" />
                        </div>
                        <div className="mt-5 rtl-row items-center">
                          <div className="flex-1 text-right text-xs text-muted-foreground">
                            {goal.lastContributionDate ? `آخر مساهمة: ${goal.lastContributionDate}` : "لم يتم تسجيل أي مساهمة بعد"}
                          </div>
                          <div className="budget-value-left flex items-center gap-2">
                            <Button size="sm" variant="secondary" className="h-8 rounded-xl text-xs" onClick={() => openEditSavingsGoalDialog(goal)}>تعديل</Button>
                            <Button size="sm" className="h-8 rounded-xl text-xs" onClick={() => openSavingContributionDialog(goal)}>إضافة مساهمة</Button>
                          </div>
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

                <div
                  className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6"
                  onMouseLeave={() => setHoveredOverviewSegment(null)}
                >
                  <div className="flex justify-center">
                    <div ref={overviewInteractionRef} className="budget-overview-donut relative h-60 w-60">
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
                              onPointerDown={() => {
                                setSelectedOverviewSegment(segment.id);
                                setHoveredOverviewSegment(segment.id);
                              }}
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
                        {activeOverviewSegment && (
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
                          <p className="text-[11px] text-muted-foreground leading-tight">{activeOverviewSegment?.name || "التوزيع المالي"}</p>
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
                    const isActive = hoveredOverviewSegment === segment.id || selectedOverviewSegment === segment.id;
                    return (
                      <div
                        key={segment.id}
                        onMouseEnter={() => setHoveredOverviewSegment(segment.id)}
                        onMouseLeave={() => setHoveredOverviewSegment(null)}
                        onClick={() => setOverviewDetailType(segment.typeKey)}
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
                        "rounded-2xl border px-3 py-3 text-right shadow-sm",
                        warning.tone === "danger" && "border-rose-200/80 bg-rose-50/80 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
                        warning.tone === "warn" && "border-amber-200/80 bg-amber-50/80 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
                        warning.tone === "good" && "border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                      )}
                    >
                      <div className="rtl-row items-start gap-2">
                        <ArrowLeft className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="flex-1 text-sm leading-6">{warning.text}</p>
                      </div>
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
                    const rowTitle = linkedGoal ? `${SAVINGS_GOAL_META[linkedGoal.category].emoji} ${getSavingsGoalDisplayTitle(linkedGoal)}` : `${emoji} ${category?.name || TRANSACTION_TYPE_LABEL[tx.type]}`;
                    const metaLine = `${TRANSACTION_TYPE_LABEL[tx.type]} • ${tx.date}${linkedGoal ? " • ربط بهدف ادخار" : ""}`;

                    return (
                      <Button key={tx.id} variant="outline" className="w-full h-auto justify-between p-3 text-start font-normal" onClick={() => setOperationActionsTx(tx)}>
                        <div className="rtl-row items-start w-full">
                          <div className="flex-1 text-right">
                            <p className="font-semibold text-foreground">{rowTitle}</p>
                            <p className="text-xs text-muted-foreground mt-1">{metaLine}</p>
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
        <Dialog open={createSubcategoryDialog.open} onOpenChange={(open) => setCreateSubcategoryDialog((prev) => ({ ...prev, open, name: open ? prev.name : "" }))}>
          <DialogContent className="max-w-sm" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة فئة فرعية</DialogTitle>
              <DialogDescription>ستُحفَظ الفئة الجديدة داخل القسم الحالي ويتم اختيارها مباشرة.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded-xl border bg-muted/40 p-3 text-right text-sm text-muted-foreground">
                {`القسم الحالي: ${TRANSACTION_TYPE_LABEL[createSubcategoryDialog.type]}`}
              </div>
              <Input
                dir="rtl"
                className="budget-rtl-input"
                value={createSubcategoryDialog.name}
                onChange={(e) => setCreateSubcategoryDialog((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="اسم الفئة الفرعية"
              />
            </div>
            <DialogFooter className="sm:flex-row-reverse">
              <Button variant="secondary" onClick={() => setCreateSubcategoryDialog((prev) => ({ ...prev, open: false, name: "" }))}>إلغاء</Button>
              <Button onClick={confirmCreateSubcategory}>حفظ الفئة</Button>
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
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  const txId = operationActionsTx.id;
                  setOperationActionsTx(null);
                  openDeleteConfirm("حذف العملية", "سيتم حذف هذه العملية نهائياً من السجل. هل تريد المتابعة؟", () => deleteTransaction(txId));
                }}
              >
                حذف
              </Button>
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
                  <Badge variant="outline" className="rounded-full">عرض أوّلي</Badge>
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
                      const linkedGoal = tx.savingsGoalId ? data.savingsGoals.find((goal) => goal.id === tx.savingsGoalId) : null;
                      return (
                        <div key={tx.id} className="rounded-xl bg-muted/40 p-2.5">
                          <div className="rtl-row text-sm">
                            <p className="flex-1 text-right font-medium text-foreground">{linkedGoal ? getSavingsGoalDisplayTitle(linkedGoal) : (subcategory?.name || tx.title)}</p>
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
      <Dialog
        open={savingsGoalEditDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setSavingsGoalEditDialog({
              open: false,
              goalId: null,
              category: DEFAULT_SAVINGS_CATEGORY,
              customName: "",
              targetAmount: "",
              recurringEnabled: getSavingsGoalBehavior(DEFAULT_SAVINGS_CATEGORY).defaultRecurring,
              status: "active",
            });
          }
        }}
      >
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل هدف الادخار</DialogTitle>
            <DialogDescription>يتم حفظ التعديلات على الهدف نفسه بشكل دائم في كل الأشهر.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2">
              <Label className="text-sm text-right">الفئة الرئيسية</Label>
              <Select
                value={savingsGoalEditDialog.category}
                onValueChange={(value) => {
                  const nextCategory = value as BudgetSavingGoalCategory;
                  setSavingsGoalEditDialog((prev) => ({
                    ...prev,
                    category: nextCategory,
                    customName: getSavingsGoalBehavior(nextCategory).allowCustomName ? prev.customName : "",
                  }));
                }}
              >
                <SelectTrigger className="budget-rtl-select-trigger"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl" className="budget-rtl-select-content budget-roomy-select-content">
                  {SAVINGS_GOAL_CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="budget-select-item">{`${SAVINGS_GOAL_META[option.value].emoji} ${option.label}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {shouldShowSavingsCustomName(savingsGoalEditDialog.category) && (
              <div className="space-y-2">
                <Label className="text-sm text-right">{getSavingsGoalBehavior(savingsGoalEditDialog.category).customNameRequired ? "اسم الهدف" : "اسم الهدف (اختياري)"}</Label>
                <Input
                  dir="rtl"
                  className="budget-rtl-input"
                  value={savingsGoalEditDialog.customName}
                  onChange={(e) => setSavingsGoalEditDialog((prev) => ({ ...prev, customName: e.target.value }))}
                  placeholder="اكتب اسمًا مخصصًا"
                />
              </div>
            )}
            {getSavingsGoalBehavior(savingsGoalEditDialog.category).targetMode !== "hidden" && (
              <div className="space-y-2">
                <Label className="text-sm text-right">{getSavingsGoalBehavior(savingsGoalEditDialog.category).targetLabel}</Label>
                <Input
                  dir="rtl"
                  type="text"
                  inputMode="decimal"
                  value={savingsGoalEditDialog.targetAmount}
                  onChange={(e) => setSavingsGoalEditDialog((prev) => ({ ...prev, targetAmount: e.target.value }))}
                  placeholder={getSavingsGoalBehavior(savingsGoalEditDialog.category).targetPlaceholder}
                  className="tabular-nums budget-rtl-input"
                />
              </div>
            )}
            <div className="rounded-2xl border bg-muted/30 p-3">
              <div className="rtl-row items-center">
                <div className="flex-1 text-right">
                  <p className="text-sm font-medium text-foreground">مساهمة شهرية تلقائية</p>
                  <p className="mt-1 text-xs text-muted-foreground">ويمكن استثناء أي شهر لاحقاً</p>
                </div>
                <Switch
                  checked={savingsGoalEditDialog.recurringEnabled}
                  onCheckedChange={(checked) => setSavingsGoalEditDialog((prev) => ({ ...prev, recurringEnabled: checked }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-right">الحالة</Label>
              <Select value={savingsGoalEditDialog.status} onValueChange={(value) => setSavingsGoalEditDialog((prev) => ({ ...prev, status: value as BudgetSavingGoalStatus }))}>
                <SelectTrigger className="budget-rtl-select-trigger"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl" className="budget-rtl-select-content">
                  <SelectItem value="active" className="budget-select-item">نشط</SelectItem>
                  <SelectItem value="completed" className="budget-select-item">مكتمل</SelectItem>
                  <SelectItem value="archived" className="budget-select-item">مؤرشف</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="sm:flex-row-reverse">
            <Button variant="secondary" onClick={() => setSavingsGoalEditDialog((prev) => ({ ...prev, open: false }))}>إلغاء</Button>
            <Button onClick={saveSavingsGoalEdit}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={editDialog.open && !!editDialog.tx} onOpenChange={(open) => { if (!open) setEditDialog({ open: false, tx: null, amount: "", date: todayISO(), subcategoryId: "", savingsGoalId: "" }); }}>
          <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل العملية</DialogTitle>
          </DialogHeader>
          {editDialog.tx && (
            <div className="grid grid-cols-1 gap-3">
              {editDialog.tx.savingsGoalId && (
                <div className="rounded-2xl border bg-muted/20 p-3 text-right">
                  <p className="text-xs text-muted-foreground">العنصر المرتبط</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {getSavingsGoalDisplayTitle(data.savingsGoals.find((goal) => goal.id === editDialog.tx?.savingsGoalId) || { category: "personal_goal", customName: "", title: editDialog.tx.title })}
                  </p>
                </div>
              )}
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
              {!editDialog.tx.savingsGoalId && (
                <div className="space-y-2">
                  <Label className="text-sm text-right">الفئة الفرعية</Label>
                  <Select value={editDialog.subcategoryId} onValueChange={(v) => handleEditSubcategorySelection(v, editDialog.tx?.type || "expense")}>
                    <SelectTrigger className="budget-rtl-select-trigger"><SelectValue /></SelectTrigger>
                    <SelectContent dir="rtl" className="budget-rtl-select-content budget-roomy-select-content">
                      {data.categories.filter((c) => c.type === editDialog.tx?.type).map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="budget-select-item">{`${categoryEmoji(cat.name, cat.type)} ${cat.name}`}</SelectItem>
                      ))}
                      <SelectItem value={NEW_SUBCATEGORY_VALUE} className="budget-select-item">+ إضافة فئة فرعية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {editDialog.tx.type === "expense" && !editDialog.tx.savingsGoalId && (
                <Select value={editDialog.savingsGoalId || "none"} onValueChange={(v) => setEditDialog((prev) => ({ ...prev, savingsGoalId: v === "none" ? "" : v }))}>
                  <SelectTrigger className="budget-rtl-select-trigger"><SelectValue placeholder="ربط بهدف ادخار" /></SelectTrigger>
                  <SelectContent dir="rtl" className="budget-rtl-select-content budget-roomy-select-content">
                    <SelectItem value="none" className="budget-select-item">بدون ربط</SelectItem>
                    {data.savingsGoals.filter((goal) => goal.status === "active" || goal.id === editDialog.savingsGoalId).map((goal) => (
                      <SelectItem key={goal.id} value={goal.id} className="budget-select-item">{`${SAVINGS_GOAL_META[goal.category].emoji} ${getSavingsGoalDisplayTitle(goal)}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          <DialogFooter className="sm:flex-row-reverse">
            <Button variant="secondary" onClick={() => setEditDialog({ open: false, tx: null, amount: "", date: todayISO(), subcategoryId: "", savingsGoalId: "" })}>إلغاء</Button>
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

            <Card>
              <CardHeader>
                <CardTitle className="text-base budget-widget-title">أرصدة الادخار الحالية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.savingsGoals.length === 0 && <p className="text-sm text-right text-muted-foreground">أضف هدف ادخار أولاً ليظهر هنا الرصيد المتراكم.</p>}
                  {data.savingsGoals.map((goal) => (
                    <div key={goal.id} className="rounded-xl border bg-muted/40 p-3">
                      <div className="rtl-row items-center">
                        <div className="flex-1 text-right">
                          <p className="font-medium text-foreground">{getSavingsGoalDisplayTitle(goal)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{getSavingsGoalCategoryLabel(goal.category)}</p>
                        </div>
                        <div className="w-full max-w-[180px] space-y-2">
                          <Label className="text-xs text-right">الإجمالي المتراكم حتى اليوم</Label>
                          <Input
                            dir="rtl"
                            type="text"
                            inputMode="decimal"
                            defaultValue={goal.initialAmount > 0 ? String(goal.initialAmount) : ""}
                            onBlur={(e) => updateSavingGoalInitialAmount(goal.id, e.target.value)}
                            placeholder="كم ادخرت سابقًا؟"
                            className="tabular-nums budget-rtl-input"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs opacity-100 md:opacity-0 md:group-hover:opacity-100"
                            onClick={() => openDeleteConfirm("حذف الفئة", "سيتم حذف هذه الفئة إذا لم تكن مرتبطة ببيانات حالية. هل تريد المتابعة؟", () => deleteCategory(cat.id))}
                          >
                            حذف
                          </Button>
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
      <Dialog open={deleteConfirm.open} onOpenChange={(open) => { if (!open) closeDeleteConfirm(); }}>
        <DialogContent dir="rtl" className="max-w-md text-right">
          <DialogHeader className="text-right sm:text-right">
            <DialogTitle>{deleteConfirm.title}</DialogTitle>
            <DialogDescription>{deleteConfirm.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:flex-row-reverse">
            <Button variant="secondary" onClick={closeDeleteConfirm}>إلغاء</Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteConfirm.onConfirm?.();
                closeDeleteConfirm();
              }}
            >
              {deleteConfirm.confirmLabel}
            </Button>
          </DialogFooter>
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
  onClick,
}: {
  className?: string;
  title: string;
  amount: number;
  currency: BudgetData["settings"]["currency"];
  tone: "income" | "expense" | "bill" | "saving";
  onClick?: () => void;
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
    <Card
      className={cn("p-5 transition-all hover:shadow-md", onClick && "cursor-pointer hover:border-primary/30", className)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
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













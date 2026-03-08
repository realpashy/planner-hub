export type CurrencyCode = "ILS" | "USD" | "AED" | "SAR" | "JOD" | "KWD" | "QAR" | "EGP";

export type BudgetTransactionType =
  | "income"
  | "expense"
  | "bill_payment"
  | "debt_payment"
  | "saving";

export type BudgetCategoryType = BudgetTransactionType;

export interface BudgetCategory {
  id: string;
  type: BudgetCategoryType;
  name: string;
}

export interface BudgetTransaction {
  id: string;
  type: BudgetTransactionType;
  title: string;
  amount: number;
  date: string;
  categoryId: string;
  note: string;
  linkedId?: string;
  recurringTemplateId?: string;
}

export interface BudgetBill {
  id: string;
  title: string;
  dueDay: number;
  expectedAmount: number;
  categoryId: string;
}

export interface BudgetDebt {
  id: string;
  title: string;
  dueDay: number;
  totalAmount: number;
  categoryId: string;
}

export interface BudgetSavingGoal {
  id: string;
  title: string;
  targetAmount: number;
  targetDate: string;
}

export interface BudgetSettings {
  currency: CurrencyCode;
  monthlyLimit: number;
  rolloverEnabled: boolean;
}

export interface BudgetRecurringTemplate {
  id: string;
  type: Exclude<BudgetTransactionType, "saving">;
  categoryId: string;
  amount: number;
  note: string;
  dayOfMonth: number;
  startMonth: string;
  skippedMonths: string[];
}

export interface BudgetData {
  settings: BudgetSettings;
  categories: BudgetCategory[];
  transactions: BudgetTransaction[];
  bills: BudgetBill[];
  debts: BudgetDebt[];
  savingsGoals: BudgetSavingGoal[];
  recurringTemplates: BudgetRecurringTemplate[];
}

export interface MonthlyTotals {
  income: number;
  expenses: number;
  bills: number;
  debts: number;
  savings: number;
  totalOutflow: number;
  net: number;
}

const STORAGE_KEY = "planner_hub_budget_v2";
const LEGACY_STORAGE_KEY = "planner_hub_budget_v1";

export const CURRENCY_OPTIONS: Array<{ code: CurrencyCode; symbol: string; label: string }> = [
  { code: "ILS", symbol: "₪", label: "₪ شيكل إسرائيلي (ILS)" },
  { code: "USD", symbol: "$", label: "$ دولار أمريكي (USD)" },
  { code: "AED", symbol: "د.إ", label: "د.إ درهم إماراتي (AED)" },
  { code: "SAR", symbol: "ر.س", label: "ر.س ريال سعودي (SAR)" },
  { code: "JOD", symbol: "د.أ", label: "د.أ دينار أردني (JOD)" },
  { code: "KWD", symbol: "د.ك", label: "د.ك دينار كويتي (KWD)" },
  { code: "QAR", symbol: "ر.ق", label: "ر.ق ريال قطري (QAR)" },
  { code: "EGP", symbol: "ج.م", label: "ج.م جنيه مصري (EGP)" },
];

export const TRANSACTION_TYPE_LABEL: Record<BudgetTransactionType, string> = {
  income: "دخل",
  expense: "مصروف",
  bill_payment: "فاتورة",
  debt_payment: "دين",
  saving: "ادخار",
};

export function createBudgetId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getDefaultCategories(): BudgetCategory[] {
  return [
    { id: createBudgetId(), type: "income", name: "راتب" },
    { id: createBudgetId(), type: "income", name: "دخل إضافي" },
    { id: createBudgetId(), type: "expense", name: "طعام" },
    { id: createBudgetId(), type: "expense", name: "مواصلات" },
    { id: createBudgetId(), type: "expense", name: "صحة" },
    { id: createBudgetId(), type: "expense", name: "ترفيه" },
    { id: createBudgetId(), type: "bill_payment", name: "كهرباء" },
    { id: createBudgetId(), type: "bill_payment", name: "إنترنت" },
    { id: createBudgetId(), type: "bill_payment", name: "ماء" },
    { id: createBudgetId(), type: "debt_payment", name: "قرض" },
    { id: createBudgetId(), type: "debt_payment", name: "بطاقة ائتمان" },
    { id: createBudgetId(), type: "saving", name: "صندوق طوارئ" },
    { id: createBudgetId(), type: "saving", name: "استثمار" },
  ];
}

export function getCurrentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

export function getMonthKey(dateISO: string) {
  return dateISO.slice(0, 7);
}

export function getCurrencySymbol(currency: CurrencyCode) {
  const option = CURRENCY_OPTIONS.find((item) => item.code === currency);
  return option?.symbol || "₪";
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatAmount(value: number, currency: CurrencyCode) {
  const sign = value < 0 ? "-" : "";
  const normalized = formatNumber(Math.abs(value));
  return `${getCurrencySymbol(currency)} ${sign}${normalized}`;
}

function defaultBudgetData(): BudgetData {
  return {
    settings: {
      currency: "ILS",
      monthlyLimit: 6000,
      rolloverEnabled: true,
    },
    categories: getDefaultCategories(),
    transactions: [],
    bills: [],
    debts: [],
    savingsGoals: [],
    recurringTemplates: [],
  };
}

function migrateLegacyData(rawLegacy: string): BudgetData | null {
  try {
    const parsed = JSON.parse(rawLegacy) as {
      monthlyLimit?: number;
      items?: Array<{ title: string; amount: number; date: string; category?: string }>;
    };

    const data = defaultBudgetData();
    data.settings.monthlyLimit = typeof parsed.monthlyLimit === "number" ? parsed.monthlyLimit : data.settings.monthlyLimit;

    const expenseCategory = data.categories.find((c) => c.type === "expense")?.id;
    if (!expenseCategory) return data;

    const legacyItems = Array.isArray(parsed.items) ? parsed.items : [];

    for (const item of legacyItems) {
      if (!item.title || typeof item.amount !== "number" || !item.date) continue;

      data.transactions.push({
        id: createBudgetId(),
        type: "expense",
        title: item.title,
        amount: item.amount,
        date: item.date,
        categoryId: expenseCategory,
        note: "",
      });
    }

    return data;
  } catch {
    return null;
  }
}

export function loadBudgetData(): BudgetData {
  if (typeof window === "undefined") return defaultBudgetData();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BudgetData;
      if (parsed?.settings && parsed?.categories && parsed?.transactions && parsed?.bills && parsed?.debts && parsed?.savingsGoals) {
        if (!Array.isArray(parsed.recurringTemplates)) {
          parsed.recurringTemplates = [];
        }
        return parsed;
      }
    }

    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const migrated = migrateLegacyData(legacyRaw);
      if (migrated) {
        saveBudgetData(migrated);
        return migrated;
      }
    }

    return defaultBudgetData();
  } catch {
    return defaultBudgetData();
  }
}

export function saveBudgetData(data: BudgetData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getMonthlyTotals(transactions: BudgetTransaction[], monthKey: string): MonthlyTotals {
  const monthly = transactions.filter((item) => getMonthKey(item.date) === monthKey);

  const totals: MonthlyTotals = {
    income: 0,
    expenses: 0,
    bills: 0,
    debts: 0,
    savings: 0,
    totalOutflow: 0,
    net: 0,
  };

  for (const item of monthly) {
    if (item.type === "income") totals.income += item.amount;
    if (item.type === "expense") totals.expenses += item.amount;
    if (item.type === "bill_payment") totals.bills += item.amount;
    if (item.type === "debt_payment") totals.debts += item.amount;
    if (item.type === "saving") totals.savings += item.amount;
  }

  totals.totalOutflow = totals.expenses + totals.bills + totals.debts + totals.savings;
  totals.net = totals.income - totals.totalOutflow;

  return totals;
}

export function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  return `${month}/${year}`;
}

export function getPreviousMonthKey(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(y, m - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getUpcomingDaysCount(targetDay: number, monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  const today = new Date();
  const dueDate = new Date(y, m - 1, targetDay);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = dueDate.getTime() - todayStart.getTime();
  return Math.ceil(diffMs / 86400000);
}

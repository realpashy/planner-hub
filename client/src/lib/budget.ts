export type CurrencyCode = "ILS" | "USD" | "GBP" | "EUR";

export type BudgetTransactionType =
  | "income"
  | "expense"
  | "bill_payment"
  | "debt_payment";

export type BudgetCategoryType = BudgetTransactionType;
export type BudgetSavingGoalStatus = "active" | "completed" | "archived";
export type BudgetSavingGoalCategory =
  | "emergency_fund"
  | "personal_investments"
  | "retirement"
  | "education_fund"
  | "housing"
  | "children"
  | "travel"
  | "personal_goal"
  | "big_purchases";

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
  subcategoryId: string;
  note: string;
  savingsGoalId?: string;
  linkedId?: string;
  recurringTemplateId?: string;
  categoryId?: string;
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
  category: BudgetSavingGoalCategory;
  targetAmount: number;
  targetDate?: string;
  monthlyContributionEnabled: boolean;
  monthlyContributionAmount: number;
  excludedMonths: string[];
  status: BudgetSavingGoalStatus;
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
  { code: "GBP", symbol: "£", label: "£ جنيه إسترليني (GBP)" },
  { code: "EUR", symbol: "€", label: "€ يورو (EUR)" },
];

export const SAVINGS_GOAL_CATEGORY_OPTIONS: Array<{ value: BudgetSavingGoalCategory; label: string }> = [
  { value: "emergency_fund", label: "صندوق طوارئ / קרן חירום" },
  { value: "personal_investments", label: "استثمارات شخصية / השקעות אישיות" },
  { value: "retirement", label: "تقاعد / פנסיה" },
  { value: "education_fund", label: "صندوق استكمال / קרן השתלמות" },
  { value: "housing", label: "ادخار للسكن / חיסכון לדיור" },
  { value: "children", label: "ادخار للأطفال / חיסכון לילדים" },
  { value: "travel", label: "هدف سفر / יעד נסיעה" },
  { value: "personal_goal", label: "هدف شخصي / מטרה אישية" },
  { value: "big_purchases", label: "أهداف كبيرة / מטרות גדולות" },
];

function normalizeCurrency(currency: string | undefined): CurrencyCode {
  return CURRENCY_OPTIONS.some((item) => item.code === currency) ? (currency as CurrencyCode) : "ILS";
}

export const TRANSACTION_TYPE_LABEL: Record<BudgetTransactionType, string> = {
  income: "دخل",
  expense: "مصروف",
  bill_payment: "فاتورة",
  debt_payment: "دين",
};

export function createBudgetId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getDefaultCategories(): BudgetCategory[] {
  return [
    { id: createBudgetId(), type: "income", name: "راتب" },
    { id: createBudgetId(), type: "income", name: "عمل حر" },
    { id: createBudgetId(), type: "income", name: "دخل استثماري" },
    { id: createBudgetId(), type: "expense", name: "طعام" },
    { id: createBudgetId(), type: "expense", name: "مواصلات" },
    { id: createBudgetId(), type: "expense", name: "صحة" },
    { id: createBudgetId(), type: "expense", name: "تسوق" },
    { id: createBudgetId(), type: "expense", name: "تعليم" },
    { id: createBudgetId(), type: "expense", name: "ترفيه" },
    { id: createBudgetId(), type: "bill_payment", name: "كهرباء" },
    { id: createBudgetId(), type: "bill_payment", name: "ماء" },
    { id: createBudgetId(), type: "bill_payment", name: "إنترنت" },
    { id: createBudgetId(), type: "bill_payment", name: "هاتف" },
    { id: createBudgetId(), type: "bill_payment", name: "تأمين سيارة" },
    { id: createBudgetId(), type: "bill_payment", name: "أرنונה" },
    { id: createBudgetId(), type: "debt_payment", name: "قرض" },
    { id: createBudgetId(), type: "debt_payment", name: "بطاقة ائتمان" },
    { id: createBudgetId(), type: "debt_payment", name: "تمويل سيارة" },
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
  return `${getCurrencySymbol(currency)}${sign}${normalized}`;
}

function isValidTransactionType(value: string | undefined): value is BudgetTransactionType {
  return value === "income" || value === "expense" || value === "bill_payment" || value === "debt_payment";
}

function isValidSavingsGoalCategory(value: string | undefined): value is BudgetSavingGoalCategory {
  return SAVINGS_GOAL_CATEGORY_OPTIONS.some((item) => item.value === value);
}

function normalizeCategories(rawCategories: BudgetCategory[] | undefined) {
  const fallback = getDefaultCategories();
  const next = Array.isArray(rawCategories)
    ? rawCategories
        .filter((item) => item && isValidTransactionType(item.type))
        .map((item) => ({
          id: item.id || createBudgetId(),
          type: item.type,
          name: item.name?.trim() || fallback.find((candidate) => candidate.type === item.type)?.name || TRANSACTION_TYPE_LABEL[item.type],
        }))
    : [];

  const ensured = [...next];
  for (const item of fallback) {
    if (!ensured.some((candidate) => candidate.type === item.type && candidate.name === item.name)) {
      ensured.push(item);
    }
  }

  return ensured;
}

function pickFallbackSubcategoryId(categories: BudgetCategory[], type: BudgetTransactionType) {
  return categories.find((item) => item.type === type)?.id || "";
}

function normalizeSavingsGoals(rawGoals: BudgetSavingGoal[] | undefined): BudgetSavingGoal[] {
  return Array.isArray(rawGoals)
    ? rawGoals.map((goal): BudgetSavingGoal => ({
        id: goal.id || createBudgetId(),
        title: goal.title?.trim() || "هدف ادخار",
        category: isValidSavingsGoalCategory(goal.category) ? goal.category : "personal_goal",
        targetAmount: typeof goal.targetAmount === "number" && goal.targetAmount > 0 ? goal.targetAmount : 0,
        targetDate: goal.targetDate || "",
        monthlyContributionEnabled: Boolean(goal.monthlyContributionEnabled),
        monthlyContributionAmount: typeof goal.monthlyContributionAmount === "number" && goal.monthlyContributionAmount > 0 ? goal.monthlyContributionAmount : 0,
        excludedMonths: Array.isArray(goal.excludedMonths) ? goal.excludedMonths.filter(Boolean) : [],
        status: goal.status === "completed" || goal.status === "archived" ? goal.status : "active",
      }))
    : [];
}

function normalizeTransactions(rawTransactions: BudgetTransaction[] | undefined, categories: BudgetCategory[], savingsGoals: BudgetSavingGoal[]) {
  const defaultByType = {
    income: pickFallbackSubcategoryId(categories, "income"),
    expense: pickFallbackSubcategoryId(categories, "expense"),
    bill_payment: pickFallbackSubcategoryId(categories, "bill_payment"),
    debt_payment: pickFallbackSubcategoryId(categories, "debt_payment"),
  } satisfies Record<BudgetTransactionType, string>;
  const savingGoalIds = new Set(savingsGoals.map((goal) => goal.id));

  return Array.isArray(rawTransactions)
    ? rawTransactions
        .filter((tx) => tx && typeof tx.amount === "number" && typeof tx.date === "string")
        .map((tx) => {
          const legacySaving = tx.type === ("saving" as never);
          const type = legacySaving ? "expense" : (isValidTransactionType(tx.type) ? tx.type : "expense");
          const nextSavingsGoalId = tx.savingsGoalId || (legacySaving ? tx.linkedId : undefined);
          const subcategoryId = tx.subcategoryId || tx.categoryId || defaultByType[type];
          const title = tx.title?.trim()
            || categories.find((item) => item.id === subcategoryId)?.name
            || (nextSavingsGoalId ? savingsGoals.find((goal) => goal.id === nextSavingsGoalId)?.title : undefined)
            || TRANSACTION_TYPE_LABEL[type];

          return {
            id: tx.id || createBudgetId(),
            type,
            title,
            amount: tx.amount,
            date: tx.date,
            subcategoryId,
            categoryId: subcategoryId,
            note: tx.note || "",
            savingsGoalId: nextSavingsGoalId && savingGoalIds.has(nextSavingsGoalId) ? nextSavingsGoalId : undefined,
            linkedId: legacySaving ? undefined : tx.linkedId,
            recurringTemplateId: tx.recurringTemplateId,
          };
        })
    : [];
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
        subcategoryId: expenseCategory,
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
        const categories = normalizeCategories(parsed.categories);
        const savingsGoals = normalizeSavingsGoals(parsed.savingsGoals);

        return {
          ...parsed,
          settings: {
            ...parsed.settings,
            currency: normalizeCurrency(parsed.settings.currency),
          },
          categories,
          transactions: normalizeTransactions(parsed.transactions, categories, savingsGoals),
          bills: Array.isArray(parsed.bills) ? parsed.bills : [],
          debts: Array.isArray(parsed.debts) ? parsed.debts : [],
          savingsGoals,
          recurringTemplates: Array.isArray(parsed.recurringTemplates)
            ? parsed.recurringTemplates.filter((template) => isValidTransactionType(template.type))
            : [],
        };
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
    if (item.type === "expense" && !item.savingsGoalId) totals.expenses += item.amount;
    if (item.type === "bill_payment") totals.bills += item.amount;
    if (item.type === "debt_payment") totals.debts += item.amount;
    if (item.savingsGoalId) totals.savings += item.amount;
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

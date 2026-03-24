export type CashflowCurrency = "ILS" | "USD" | "EUR";
export type BalanceMode = "split" | "overall";
export type TransactionType = "income" | "expense";
export type UpcomingPaymentStatus = "pending" | "paid";
export type CashflowPeriod = "today" | "week" | "month";
export type ForecastRange = 7 | 30;
export type CashflowDateRange = "all" | "custom";

export type IncomeCategory =
  | "daily_sales"
  | "other_income"
  | "owner_investment"
  | "grant"
  | "loan"
  | "refund"
  | "one_time";

export type ExpenseCategory =
  | "rent"
  | "suppliers"
  | "salaries"
  | "marketing"
  | "equipment"
  | "operations"
  | "recurring"
  | "one_time"
  | "other";

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  daily_sales: "מכירות היום",
  other_income: "הכנסה אחרת",
  owner_investment: "השקעת בעלים",
  grant: "מענק",
  loan: "הלוואה",
  refund: "החזר",
  one_time: "הכנסה חד פעמית",
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: "שכירות",
  suppliers: "ספקים",
  salaries: "משכורות",
  marketing: "שיווק",
  equipment: "ציוד",
  operations: "תפעול",
  recurring: "תשלום קבוע",
  one_time: "הוצאה חד פעמית",
  other: "אחר",
};

export const INCOME_CATEGORY_ICONS: Record<IncomeCategory, string> = {
  daily_sales: "🛍️",
  other_income: "💸",
  owner_investment: "🤝",
  grant: "🎁",
  loan: "🏦",
  refund: "↩️",
  one_time: "✨",
};

export const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  rent: "🏠",
  suppliers: "📦",
  salaries: "👥",
  marketing: "📣",
  equipment: "🧰",
  operations: "⚙️",
  recurring: "🗓️",
  one_time: "🧾",
  other: "📌",
};

export const UPCOMING_PAYMENT_CATEGORIES = [
  { value: "rent", label: "שכירות", icon: "🏠" },
  { value: "suppliers", label: "ספקים", icon: "📦" },
  { value: "salaries", label: "משכורות", icon: "👥" },
  { value: "marketing", label: "שיווק", icon: "📣" },
  { value: "equipment", label: "ציוד", icon: "🧰" },
  { value: "operations", label: "תפעול", icon: "⚙️" },
  { value: "recurring", label: "תשלום קבוע", icon: "🗓️" },
  { value: "one_time", label: "הוצאה חד פעמית", icon: "✨" },
  { value: "other", label: "אחר", icon: "📌" },
] as const;

export type UpcomingPaymentCategoryValue = (typeof UPCOMING_PAYMENT_CATEGORIES)[number]["value"];

export interface CashflowTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  category: IncomeCategory | ExpenseCategory;
  note?: string;
  paidFor?: string;
  attachmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpcomingPayment {
  id: string;
  name: string;
  category?: ExpenseCategory;
  amount: number;
  dueDate: string;
  note?: string;
  status: UpcomingPaymentStatus;
  recurringMonthly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CashflowPartner {
  id: string;
  name: string;
  ownershipPercent: number;
  investedAmount: number;
  targetCommitment?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CashflowSettings {
  currency: CashflowCurrency;
  balanceMode: BalanceMode;
  bankBalance?: number;
  cashOnHand?: number;
  overallAvailableCash?: number;
  overallBankPortion?: number;
  monthlyBaselineExpenses?: number;
  monthlyBaselineIncome?: number;
  cashWarningThreshold?: number;
}

export interface CashflowDateFilter {
  from?: string;
  to?: string;
}

export interface CashflowData {
  settings: CashflowSettings;
  transactions: CashflowTransaction[];
  upcomingPayments: UpcomingPayment[];
  partners: CashflowPartner[];
  lastUpdated: string;
}

export interface CashflowAttachmentRecord {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
}

export interface CashflowPeriodStats {
  income: number;
  expenses: number;
  net: number;
  transactionCount: number;
}

export interface CashflowDailyAverages {
  averageIncome: number;
  averageExpenses: number;
}

export interface ForecastPoint {
  date: string;
  label: string;
  balance: number;
  baselineIncome: number;
  baselineExpense: number;
  upcomingExpense: number;
}

export interface IncomeExpensePoint {
  label: string;
  income: number;
  expenses: number;
}

export interface CashflowPartnerSummary {
  totalInvested: number;
  totalOwnership: number;
  remainingCommitments: Array<{ id: string; remaining: number }>;
}

const STORAGE_KEY = "planner_hub_cashflow_v2";

const NUMBER_FORMATTER = new Intl.NumberFormat("he-IL", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const CURRENCY_SYMBOLS: Record<CashflowCurrency, string> = {
  ILS: "₪",
  USD: "$",
  EUR: "€",
};

function nowIso() {
  return new Date().toISOString();
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampMoney(value: unknown) {
  return Math.max(0, toNumber(value));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

export function getCurrentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatHebrewDate(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatHebrewDateShort(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
  });
}

export function formatShortAmount(amount: number) {
  if (Math.abs(amount) >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return NUMBER_FORMATTER.format(amount);
}

export function formatCashflowAmount(amount: number, currency: CashflowCurrency = "ILS") {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "₪";
  const sign = amount < 0 ? "-" : "";
  return `${sign}${symbol} ${NUMBER_FORMATTER.format(Math.abs(amount))}`;
}

export function getUpcomingPaymentCategoryMeta(payment: Pick<UpcomingPayment, "category" | "name">) {
  const direct = payment.category
    ? UPCOMING_PAYMENT_CATEGORIES.find((item) => item.value === payment.category)
    : undefined;
  if (direct) return direct;
  const name = normalizeForCategory(payment.name);
  return (
    UPCOMING_PAYMENT_CATEGORIES.find((item) => name.includes(normalizeForCategory(item.label))) ?? {
      value: "other",
      label: "אחר",
      icon: "📌",
    }
  );
}

function normalizeForCategory(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

export function getDaysUntil(isoDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${isoDate}T00:00:00`);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function createEmptyCashflowData(): CashflowData {
  return {
    settings: {
      currency: "ILS",
      balanceMode: "split",
    },
    transactions: [],
    upcomingPayments: [],
    partners: [],
    lastUpdated: nowIso(),
  };
}

function sanitizeTransaction(raw: unknown): CashflowTransaction | null {
  const source = asRecord(raw);
  const type = source.type;
  if (type !== "income" && type !== "expense") return null;

  const category =
    typeof source.category === "string" && source.category
      ? source.category
      : type === "income"
        ? "daily_sales"
        : "suppliers";

  return {
    id: typeof source.id === "string" && source.id ? source.id : generateId(),
    type,
    amount: clampMoney(source.amount),
    date: typeof source.date === "string" && source.date ? source.date : getTodayKey(),
    category: category as IncomeCategory | ExpenseCategory,
    note: typeof source.note === "string" && source.note.trim() ? source.note.trim() : undefined,
    paidFor: typeof source.paidFor === "string" && source.paidFor.trim() ? source.paidFor.trim() : undefined,
    attachmentId: typeof source.attachmentId === "string" && source.attachmentId.trim() ? source.attachmentId.trim() : undefined,
    createdAt: typeof source.createdAt === "string" && source.createdAt ? source.createdAt : nowIso(),
    updatedAt: typeof source.updatedAt === "string" && source.updatedAt ? source.updatedAt : nowIso(),
  };
}

function sanitizeUpcomingPayment(raw: unknown): UpcomingPayment | null {
  const source = asRecord(raw);
  if (typeof source.name !== "string" || !source.name.trim()) return null;

  return {
    id: typeof source.id === "string" && source.id ? source.id : generateId(),
    name: source.name.trim(),
    category:
      typeof source.category === "string" && source.category
        ? (source.category as ExpenseCategory)
        : undefined,
    amount: clampMoney(source.amount),
    dueDate: typeof source.dueDate === "string" && source.dueDate ? source.dueDate : getTodayKey(),
    note: typeof source.note === "string" && source.note.trim() ? source.note.trim() : undefined,
    status: source.status === "paid" ? "paid" : "pending",
    recurringMonthly: Boolean(source.recurringMonthly ?? source.recurrence === "monthly"),
    createdAt: typeof source.createdAt === "string" && source.createdAt ? source.createdAt : nowIso(),
    updatedAt: typeof source.updatedAt === "string" && source.updatedAt ? source.updatedAt : nowIso(),
  };
}

function sanitizePartner(raw: unknown, partnerCountHint: number): CashflowPartner | null {
  const source = asRecord(raw);
  if (typeof source.name !== "string" || !source.name.trim()) return null;

  return {
    id: typeof source.id === "string" && source.id ? source.id : generateId(),
    name: source.name.trim(),
    ownershipPercent: Math.max(
      0,
      Math.min(100, toNumber(source.ownershipPercent ?? (partnerCountHint === 1 ? 100 : 0))),
    ),
    investedAmount: clampMoney(source.investedAmount),
    targetCommitment:
      source.targetCommitment !== undefined || source.targetInvestment !== undefined
        ? clampMoney(source.targetCommitment ?? source.targetInvestment)
        : undefined,
    createdAt: typeof source.createdAt === "string" && source.createdAt ? source.createdAt : nowIso(),
    updatedAt: typeof source.updatedAt === "string" && source.updatedAt ? source.updatedAt : nowIso(),
  };
}

function sanitizeSettings(raw: unknown): CashflowSettings {
  const source = asRecord(raw);
  const hasOverall = source.overallAvailableCash !== undefined || source.availableBalanceOverride !== undefined;

  return {
    currency: source.currency === "USD" || source.currency === "EUR" ? source.currency : "ILS",
    balanceMode: source.balanceMode === "overall" || hasOverall ? "overall" : "split",
    bankBalance: source.bankBalance !== undefined ? clampMoney(source.bankBalance) : undefined,
    cashOnHand:
      source.cashOnHand !== undefined || source.cashInRegister !== undefined
        ? clampMoney(source.cashOnHand ?? source.cashInRegister)
        : undefined,
    overallAvailableCash:
      source.overallAvailableCash !== undefined || source.availableBalanceOverride !== undefined
        ? clampMoney(source.overallAvailableCash ?? source.availableBalanceOverride)
        : undefined,
    overallBankPortion:
      source.overallBankPortion !== undefined || source.overallBankBalance !== undefined
        ? clampMoney(source.overallBankPortion ?? source.overallBankBalance)
        : undefined,
    monthlyBaselineExpenses:
      source.monthlyBaselineExpenses !== undefined || source.monthlyExpensesBaseline !== undefined
        ? clampMoney(source.monthlyBaselineExpenses ?? source.monthlyExpensesBaseline)
        : undefined,
    monthlyBaselineIncome:
      source.monthlyBaselineIncome !== undefined || source.monthlyIncomeBaseline !== undefined
        ? clampMoney(source.monthlyBaselineIncome ?? source.monthlyIncomeBaseline)
        : undefined,
    cashWarningThreshold:
      source.cashWarningThreshold !== undefined || source.cashflowWarningThreshold !== undefined
        ? clampMoney(source.cashWarningThreshold ?? source.cashflowWarningThreshold)
        : undefined,
  };
}

function normalizePartners(partners: CashflowPartner[]) {
  if (partners.length === 1) {
    return [{ ...partners[0], ownershipPercent: 100, updatedAt: nowIso() }];
  }
  return partners;
}

export function sanitizeCashflowData(raw: unknown): CashflowData {
  if (!raw || typeof raw !== "object") return createEmptyCashflowData();
  const source = asRecord(raw);
  const partnerCount = Array.isArray(source.partners) ? source.partners.length : 0;

  const transactions = Array.isArray(source.transactions)
    ? source.transactions.map(sanitizeTransaction).filter(Boolean) as CashflowTransaction[]
    : [];
  const upcomingPayments = Array.isArray(source.upcomingPayments)
    ? source.upcomingPayments.map(sanitizeUpcomingPayment).filter(Boolean) as UpcomingPayment[]
    : [];
  const partners = Array.isArray(source.partners)
    ? source.partners.map((partner) => sanitizePartner(partner, partnerCount)).filter(Boolean) as CashflowPartner[]
    : [];

  return {
    settings: sanitizeSettings(source.settings),
    transactions: transactions.sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt)),
    upcomingPayments: upcomingPayments.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || b.updatedAt.localeCompare(a.updatedAt)),
    partners: normalizePartners(partners),
    lastUpdated: typeof source.lastUpdated === "string" && source.lastUpdated ? source.lastUpdated : nowIso(),
  };
}

export function loadCashflowData(): CashflowData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return sanitizeCashflowData(raw ? JSON.parse(raw) : null);
  } catch {
    return createEmptyCashflowData();
  }
}

export function saveCashflowData(data: CashflowData) {
  const next = { ...sanitizeCashflowData(data), lastUpdated: nowIso() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getStartingAvailableCash(settings: CashflowSettings) {
  // The simplified overall mode intentionally overrides the bank + מזומן split.
  if (settings.balanceMode === "overall" && settings.overallAvailableCash !== undefined) {
    return settings.overallAvailableCash;
  }
  return (settings.bankBalance ?? 0) + (settings.cashOnHand ?? 0);
}

export function getAvailableBalance(data: CashflowData) {
  const starting = getStartingAvailableCash(data.settings);
  const income = data.transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expenses = data.transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);
  return starting + income - expenses;
}

export function getAvailableCash(data: CashflowData) {
  return getAvailableBalance(data);
}

export function getMonthStats(transactions: CashflowTransaction[], monthKey: string): CashflowPeriodStats {
  const filtered = transactions.filter((transaction) => transaction.date.startsWith(monthKey));
  const income = filtered.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = filtered.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0);
  return { income, expenses, net: income - expenses, transactionCount: filtered.length };
}

export function getTodayStats(transactions: CashflowTransaction[]): CashflowPeriodStats {
  const todayKey = getTodayKey();
  const filtered = transactions.filter((transaction) => transaction.date === todayKey);
  const income = filtered.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = filtered.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0);
  return { income, expenses, net: income - expenses, transactionCount: filtered.length };
}

export function getWeekStats(transactions: CashflowTransaction[]): CashflowPeriodStats {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 6);
  const filtered = transactions.filter((transaction) => {
    const date = new Date(`${transaction.date}T12:00:00`);
    return date >= start && date <= today;
  });
  const income = filtered.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = filtered.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0);
  return { income, expenses, net: income - expenses, transactionCount: filtered.length };
}

export function getPeriodStats(data: CashflowData, period: CashflowPeriod): CashflowPeriodStats {
  if (period === "today") return getTodayStats(data.transactions);
  if (period === "week") return getWeekStats(data.transactions);
  return getMonthStats(data.transactions, getCurrentMonthKey());
}

export function getPendingUpcomingTotal(data: CashflowData, period: "all" | "week" | "month" = "all") {
  return data.upcomingPayments
    .filter((payment) => payment.status === "pending")
    .filter((payment) => {
      if (period === "all") return true;
      const days = getDaysUntil(payment.dueDate);
      return period === "week" ? days >= 0 && days <= 7 : days >= 0 && days <= 30;
    })
    .reduce((sum, payment) => sum + payment.amount, 0);
}

export function getDailyAverages(data: CashflowData, period: CashflowPeriod): CashflowDailyAverages {
  const stats = getPeriodStats(data, period);
  const divisor = period === "today" ? 1 : period === "week" ? 7 : Math.max(1, new Date().getDate());
  return {
    averageIncome: stats.income / divisor,
    averageExpenses: stats.expenses / divisor,
  };
}

export function getRemainingDaysInMonth(date = new Date()) {
  const monthEndDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Math.max(1, monthEndDay - date.getDate() + 1);
}

export function getRemainingBaselineExpense(data: CashflowData) {
  const monthStats = getMonthStats(data.transactions, getCurrentMonthKey());
  return Math.max(0, (data.settings.monthlyBaselineExpenses ?? 0) - monthStats.expenses);
}

export function getRemainingBaselineIncome(data: CashflowData) {
  const monthStats = getMonthStats(data.transactions, getCurrentMonthKey());
  return Math.max(0, (data.settings.monthlyBaselineIncome ?? 0) - monthStats.income);
}

export function getRequiredDailyTarget(data: CashflowData) {
  const daysRemaining = getRemainingDaysInMonth();
  const monthStats = getMonthStats(data.transactions, getCurrentMonthKey());
  const availableCash = getAvailableBalance(data);
  const remainingUpcoming = getPendingUpcomingTotal(data, "month");
  const remainingBaselineExpenses = getRemainingBaselineExpense(data);
  const warningThreshold = data.settings.cashWarningThreshold ?? 0;
  const remainingNeed = remainingUpcoming + remainingBaselineExpenses + warningThreshold - monthStats.income - availableCash;
  return Math.max(0, Math.ceil(remainingNeed / daysRemaining));
}

export function getDailyTargetRequired(data: CashflowData) {
  return getRequiredDailyTarget(data);
}

export function getForecastSeries(data: CashflowData, days: ForecastRange): ForecastPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const remainingDays = getRemainingDaysInMonth(today);
  const dailyBaselineExpense = getRemainingBaselineExpense(data) / remainingDays;
  const dailyBaselineIncome = getRemainingBaselineIncome(data) / remainingDays;
  const pendingByDate = new Map<string, number>();

  data.upcomingPayments
    .filter((payment) => payment.status === "pending")
    .forEach((payment) => {
      pendingByDate.set(payment.dueDate, (pendingByDate.get(payment.dueDate) ?? 0) + payment.amount);
    });

  let runningBalance = getAvailableBalance(data);
  const points: ForecastPoint[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const isoDate = date.toISOString().split("T")[0];
    const upcomingExpense = pendingByDate.get(isoDate) ?? 0;
    runningBalance += dailyBaselineIncome - dailyBaselineExpense - upcomingExpense;
    points.push({
      date: isoDate,
      label: formatHebrewDateShort(isoDate),
      balance: Math.round(runningBalance),
      baselineIncome: Math.round(dailyBaselineIncome),
      baselineExpense: Math.round(dailyBaselineExpense),
      upcomingExpense: Math.round(upcomingExpense),
    });
  }

  return points;
}

export function getLast7DaysChartData(transactions: CashflowTransaction[]) {
  const days: Array<{ day: string; income: number; expenses: number }> = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const isoDate = date.toISOString().split("T")[0];
    const label = date.toLocaleDateString("he-IL", { weekday: "short" });
    const income = transactions
      .filter((transaction) => transaction.date === isoDate && transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const expenses = transactions
      .filter((transaction) => transaction.date === isoDate && transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    days.push({ day: label, income, expenses });
  }
  return days;
}

export function getIncomeExpenseChartData(transactions: CashflowTransaction[]): IncomeExpensePoint[] {
  const months: IncomeExpensePoint[] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - offset);
    const monthKey = getCurrentMonthKey(date);
    const stats = getMonthStats(transactions, monthKey);
    months.push({
      label: date.toLocaleDateString("he-IL", { month: "short" }),
      income: stats.income,
      expenses: stats.expenses,
    });
  }
  return months;
}

export function getLast6MonthsChartData(transactions: CashflowTransaction[]) {
  return getIncomeExpenseChartData(transactions).map((point) => ({
    month: point.label,
    income: point.income,
    expenses: point.expenses,
  }));
}

export function getPartnerSummary(data: CashflowData): CashflowPartnerSummary {
  const totalInvested = data.partners.reduce((sum, partner) => sum + partner.investedAmount, 0);
  const totalOwnership = data.partners.reduce((sum, partner) => sum + partner.ownershipPercent, 0);
  const remainingCommitments = data.partners.map((partner) => ({
    id: partner.id,
    remaining: Math.max(0, (partner.targetCommitment ?? 0) - partner.investedAmount),
  }));

  return { totalInvested, totalOwnership, remainingCommitments };
}

export function validatePartnerOwnership(partners: CashflowPartner[]) {
  if (partners.length <= 1) {
    return { valid: true, total: partners.length === 1 ? 100 : 0 };
  }
  const total = partners.reduce((sum, partner) => sum + partner.ownershipPercent, 0);
  return { valid: Math.abs(total - 100) < 0.001, total };
}

export function formatOwnershipPercent(value: number) {
  if (Number.isInteger(value)) return `${value}%`;
  return `${value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")}%`;
}

function clampPercentUnits(units: number) {
  return Math.max(0, Math.min(10000, Math.round(units)));
}

export function rebalancePartnerOwnership(
  existingPartners: CashflowPartner[],
  draftPartner: CashflowPartner,
): CashflowPartner[] {
  const remainingPartners = existingPartners.filter((partner) => partner.id !== draftPartner.id);
  const timestamp = new Date().toISOString();

  if (remainingPartners.length === 0) {
    return [{ ...draftPartner, ownershipPercent: 100, updatedAt: timestamp }];
  }

  const targetUnits = clampPercentUnits(draftPartner.ownershipPercent * 100);
  const safeTargetUnits = Math.min(targetUnits, 10000);
  const remainingUnits = 10000 - safeTargetUnits;

  const baseWeights = remainingPartners.map((partner) => Math.max(0, Math.round(partner.ownershipPercent * 100)));
  const totalWeight = baseWeights.reduce((sum, value) => sum + value, 0);
  const equalWeight = remainingPartners.length > 0 ? 1 / remainingPartners.length : 0;

  const allocations = remainingPartners.map((partner, index) => {
    const weight = totalWeight > 0 ? baseWeights[index] / totalWeight : equalWeight;
    const exact = remainingUnits * weight;
    const floor = Math.floor(exact);
    return { partner, index, floor, remainder: exact - floor };
  });

  let allocated = allocations.reduce((sum, item) => sum + item.floor, 0);
  let leftover = remainingUnits - allocated;
  allocations
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
    .forEach((item) => {
      if (leftover <= 0) return;
      item.floor += 1;
      leftover -= 1;
    });

  const nextPartners = allocations
    .sort((a, b) => a.index - b.index)
    .map((item) => ({
      ...item.partner,
      ownershipPercent: item.floor / 100,
      updatedAt: timestamp,
    }));

  return [
    ...nextPartners,
    {
      ...draftPartner,
      ownershipPercent: safeTargetUnits / 100,
      updatedAt: timestamp,
    },
  ];
}

export function filterByDateRange<T extends { date?: string; dueDate?: string }>(items: T[], filter: CashflowDateFilter) {
  return items.filter((item) => {
    const value = item.date ?? item.dueDate;
    if (!value) return false;
    if (filter.from && value < filter.from) return false;
    if (filter.to && value > filter.to) return false;
    return true;
  });
}

export async function uploadCashflowAttachment(file: File) {
  const dataBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.includes(",") ? result.split(",")[1] ?? "" : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("UPLOAD_READ_FAILED"));
    reader.readAsDataURL(file);
  });

  const response = await fetch("/api/cashflow/attachments", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      dataBase64,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || "UPLOAD_FAILED");
  }

  return response.json() as Promise<{
    id: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
  }>;
}

export async function fetchCashflowAttachment(attachmentId: string) {
  const response = await fetch(`/api/cashflow/attachments/${attachmentId}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || "ATTACHMENT_NOT_FOUND");
  }

  return response.json() as Promise<CashflowAttachmentRecord>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cashflow Module — Types, Storage, Formatters, Mock Data
// Language: Hebrew-first. Currency: ILS (₪) default.
// Architecture note: i18n-ready structure — all user-facing strings are in
// separate label maps so they can be swapped for Arabic/English in the future.
// ─────────────────────────────────────────────────────────────────────────────

export type CashflowCurrency = "ILS" | "USD" | "EUR";

// ── Transaction categories ────────────────────────────────────────────────────

export type IncomeCategory =
  | "daily_sales"       // מכירות היום
  | "other_income"      // הכנסה אחרת
  | "owner_investment"  // השקעת בעלים
  | "grant"             // מענק
  | "loan"              // הלוואה
  | "refund"            // החזר
  | "one_time";         // הכנסה חד פעמית

export type ExpenseCategory =
  | "rent"              // שכירות
  | "suppliers"         // ספקים
  | "salaries"          // משכורות
  | "marketing"         // שיווק
  | "equipment"         // ציוד
  | "operations"        // תפעול
  | "recurring"         // תשלום קבוע
  | "one_time"          // הוצאה חד פעמית
  | "other";            // אחר

export type TransactionType = "income" | "expense";

// ── Hebrew label maps (i18n-ready) ────────────────────────────────────────────

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
  daily_sales: "🛒",
  other_income: "💰",
  owner_investment: "👤",
  grant: "🏆",
  loan: "🏦",
  refund: "↩️",
  one_time: "✨",
};

export const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  rent: "🏠",
  suppliers: "📦",
  salaries: "👥",
  marketing: "📣",
  equipment: "🔧",
  operations: "⚙️",
  recurring: "🔄",
  one_time: "⚡",
  other: "📝",
};

// ── Core data types ───────────────────────────────────────────────────────────

export interface CashflowTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO YYYY-MM-DD
  category: IncomeCategory | ExpenseCategory;
  note?: string;
}

export type UpcomingPaymentStatus = "pending" | "paid";
export type UpcomingPaymentRecurrence = "once" | "monthly";

export interface UpcomingPayment {
  id: string;
  name: string;
  amount: number;
  dueDate: string; // ISO YYYY-MM-DD
  status: UpcomingPaymentStatus;
  recurrence: UpcomingPaymentRecurrence;
  recurringDay?: number; // 1-31 day of month (for monthly)
  note?: string;
}

export interface CashflowPartner {
  id: string;
  name: string;
  ownershipPercent: number;  // 0-100, all partners must sum to 100
  investedAmount: number;
  targetInvestment?: number;
}

export interface CashflowSettings {
  currency: CashflowCurrency;
  bankBalance?: number;
  cashInRegister?: number;
  availableBalanceOverride?: number; // use instead of bank+cash if set
  monthlyExpensesBaseline?: number;
  monthlyIncomeBaseline?: number;
  cashflowWarningThreshold?: number;
  baselineMonthKey?: string; // YYYY-MM when user first set up
}

export interface CashflowData {
  settings: CashflowSettings;
  transactions: CashflowTransaction[];
  upcomingPayments: UpcomingPayment[];
  partners: CashflowPartner[];
  lastUpdated: string;
}

// ── Currency formatting ───────────────────────────────────────────────────────

const ILS_FORMATTER = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const USD_FORMATTER = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const EUR_FORMATTER = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCashflowAmount(
  amount: number,
  currency: CashflowCurrency = "ILS",
): string {
  const formatter =
    currency === "USD" ? USD_FORMATTER : currency === "EUR" ? EUR_FORMATTER : ILS_FORMATTER;
  return formatter.format(amount);
}

export function formatShortAmount(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }
  return amount.toString();
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatHebrewDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatHebrewDateShort(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
  });
}

export function getDaysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${isoDate}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Computed stats ────────────────────────────────────────────────────────────

export interface CashflowMonthStats {
  income: number;
  expenses: number;
  net: number;
  transactionCount: number;
}

export function getMonthStats(
  transactions: CashflowTransaction[],
  monthKey: string,
): CashflowMonthStats {
  const filtered = transactions.filter((t) => t.date.startsWith(monthKey));
  const income = filtered
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = filtered
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  return { income, expenses, net: income - expenses, transactionCount: filtered.length };
}

export function getTodayStats(transactions: CashflowTransaction[]): CashflowMonthStats {
  return getMonthStats(transactions, getTodayKey());
}

export function getWeekStats(transactions: CashflowTransaction[]): CashflowMonthStats {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const filtered = transactions.filter((t) => {
    const d = new Date(`${t.date}T12:00:00`);
    return d >= weekAgo && d <= today;
  });
  const income = filtered
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = filtered
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  return { income, expenses, net: income - expenses, transactionCount: filtered.length };
}

export function getAvailableBalance(data: CashflowData): number {
  if (data.settings.availableBalanceOverride !== undefined) {
    return data.settings.availableBalanceOverride;
  }
  return (data.settings.bankBalance ?? 0) + (data.settings.cashInRegister ?? 0);
}

export function getDailyTargetRequired(data: CashflowData): number {
  const threshold = data.settings.cashflowWarningThreshold ?? 0;
  const available = getAvailableBalance(data);
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = daysInMonth - now.getDate() + 1;
  const monthStats = getMonthStats(data.transactions, getCurrentMonthKey());
  const baseline = data.settings.monthlyExpensesBaseline ?? 0;
  const remaining = Math.max(0, baseline - monthStats.income + threshold - available);
  return remainingDays > 0 ? Math.ceil(remaining / remainingDays) : 0;
}

// ── Chart data helpers ────────────────────────────────────────────────────────

export interface ChartDayPoint {
  day: string;       // DD/MM short
  income: number;
  expenses: number;
  net: number;
}

export function getLast7DaysChartData(transactions: CashflowTransaction[]): ChartDayPoint[] {
  const days: ChartDayPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("he-IL", { day: "numeric", month: "short" });
    const dayTx = transactions.filter((t) => t.date === key);
    const income = dayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    days.push({ day: label, income, expenses, net: income - expenses });
  }
  return days;
}

export interface ChartMonthPoint {
  month: string;
  income: number;
  expenses: number;
}

export function getLast6MonthsChartData(transactions: CashflowTransaction[]): ChartMonthPoint[] {
  const months: ChartMonthPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("he-IL", { month: "short" });
    const stats = getMonthStats(transactions, key);
    months.push({ month: label, income: stats.income, expenses: stats.expenses });
  }
  return months;
}

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "cashflow_data_v1";

const DEMO_TRANSACTIONS: CashflowTransaction[] = [
  { id: "t1", type: "income", amount: 3200, date: getTodayKey(), category: "daily_sales", note: "מכירות בוקר" },
  { id: "t2", type: "expense", amount: 450, date: getTodayKey(), category: "suppliers", note: "ספק חלב וגבינות" },
  { id: "t3", type: "income", amount: 1800, date: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split("T")[0]; })(), category: "daily_sales" },
  { id: "t4", type: "expense", amount: 3500, date: (() => { const d = new Date(); d.setDate(d.getDate() - 2); return d.toISOString().split("T")[0]; })(), category: "rent", note: "שכירות חודשי" },
  { id: "t5", type: "income", amount: 2750, date: (() => { const d = new Date(); d.setDate(d.getDate() - 2); return d.toISOString().split("T")[0]; })(), category: "daily_sales" },
  { id: "t6", type: "expense", amount: 890, date: (() => { const d = new Date(); d.setDate(d.getDate() - 3); return d.toISOString().split("T")[0]; })(), category: "salaries" },
  { id: "t7", type: "income", amount: 4100, date: (() => { const d = new Date(); d.setDate(d.getDate() - 3); return d.toISOString().split("T")[0]; })(), category: "daily_sales" },
  { id: "t8", type: "expense", amount: 320, date: (() => { const d = new Date(); d.setDate(d.getDate() - 4); return d.toISOString().split("T")[0]; })(), category: "marketing", note: "קמפיין אינסטגרם" },
  { id: "t9", type: "income", amount: 650, date: (() => { const d = new Date(); d.setDate(d.getDate() - 5); return d.toISOString().split("T")[0]; })(), category: "refund", note: "החזר ביטוח" },
  { id: "t10", type: "expense", amount: 1200, date: (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().split("T")[0]; })(), category: "suppliers" },
];

const DEMO_UPCOMING: UpcomingPayment[] = [
  {
    id: "u1",
    name: "שכירות חנות",
    amount: 3500,
    dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().split("T")[0]; })(),
    status: "pending",
    recurrence: "monthly",
    recurringDay: 1,
  },
  {
    id: "u2",
    name: "ספקי חלב ומוצרי בסיס",
    amount: 800,
    dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().split("T")[0]; })(),
    status: "pending",
    recurrence: "once",
    note: "הזמנה שבועית",
  },
  {
    id: "u3",
    name: "חשבון חשמל",
    amount: 420,
    dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 12); return d.toISOString().split("T")[0]; })(),
    status: "pending",
    recurrence: "monthly",
    recurringDay: 15,
  },
  {
    id: "u4",
    name: "עמלת כרטיסי אשראי",
    amount: 185,
    dueDate: (() => { const d = new Date(); d.setDate(d.getDate() - 3); return d.toISOString().split("T")[0]; })(),
    status: "paid",
    recurrence: "monthly",
    recurringDay: 10,
  },
];

const DEMO_PARTNERS: CashflowPartner[] = [
  { id: "p1", name: "יוסי כהן", ownershipPercent: 60, investedAmount: 180000, targetInvestment: 200000 },
  { id: "p2", name: "דנה לוי", ownershipPercent: 40, investedAmount: 90000, targetInvestment: 120000 },
];

const DEFAULT_DATA: CashflowData = {
  settings: {
    currency: "ILS",
    bankBalance: 28500,
    cashInRegister: 1200,
    monthlyExpensesBaseline: 18000,
    monthlyIncomeBaseline: 25000,
    cashflowWarningThreshold: 5000,
  },
  transactions: DEMO_TRANSACTIONS,
  upcomingPayments: DEMO_UPCOMING,
  partners: DEMO_PARTNERS,
  lastUpdated: new Date().toISOString(),
};

export function loadCashflowData(): CashflowData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_DATA, ...JSON.parse(raw) };
    }
  } catch {
    // ignore parse errors
  }
  return structuredClone(DEFAULT_DATA);
}

export function saveCashflowData(data: CashflowData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, lastUpdated: new Date().toISOString() }));
  } catch {
    // ignore write errors
  }
}

// ── ID generator ──────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

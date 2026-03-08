import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Wallet, Plus, Trash2, TrendingUp, PiggyBank, ReceiptText } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type BudgetCategory =
  | "السكن"
  | "الطعام"
  | "المواصلات"
  | "الصحة"
  | "العمل"
  | "الترفيه"
  | "التعليم"
  | "أخرى";

interface ExpenseItem {
  id: string;
  title: string;
  category: BudgetCategory;
  amount: number;
  date: string;
}

interface BudgetData {
  monthlyLimit: number;
  items: ExpenseItem[];
}

const STORAGE_KEY = "planner_hub_budget_v1";
const CATEGORIES: BudgetCategory[] = ["السكن", "الطعام", "المواصلات", "الصحة", "العمل", "الترفيه", "التعليم", "أخرى"];

function createId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function loadBudgetData(): BudgetData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { monthlyLimit: 5000, items: [] };
    }

    const parsed = JSON.parse(raw) as BudgetData;
    return {
      monthlyLimit: typeof parsed.monthlyLimit === "number" ? parsed.monthlyLimit : 5000,
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    return { monthlyLimit: 5000, items: [] };
  }
}

function saveBudgetData(data: BudgetData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function BudgetPlanner() {
  const initial = loadBudgetData();

  const [monthlyLimit, setMonthlyLimit] = useState(initial.monthlyLimit);
  const [items, setItems] = useState<ExpenseItem[]>(initial.items);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<BudgetCategory>("الطعام");
  const [date, setDate] = useState(todayISO());

  const totalSpent = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);
  const remaining = Math.max(monthlyLimit - totalSpent, 0);
  const spentRatio = monthlyLimit > 0 ? Math.min(Math.round((totalSpent / monthlyLimit) * 100), 100) : 0;

  const byCategory = useMemo(() => {
    const map = new Map<BudgetCategory, number>();
    for (const cat of CATEGORIES) map.set(cat, 0);

    for (const item of items) {
      map.set(item.category, (map.get(item.category) || 0) + item.amount);
    }

    return CATEGORIES.map((cat) => ({
      name: cat,
      amount: map.get(cat) || 0,
      ratio: totalSpent > 0 ? Math.round(((map.get(cat) || 0) / totalSpent) * 100) : 0,
    })).filter((row) => row.amount > 0);
  }, [items, totalSpent]);

  const recentItems = useMemo(
    () => [...items].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [items],
  );

  const persist = (nextLimit: number, nextItems: ExpenseItem[]) => {
    saveBudgetData({ monthlyLimit: nextLimit, items: nextItems });
  };

  const updateLimit = (value: string) => {
    const parsed = Number(value || 0);
    const safe = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    setMonthlyLimit(safe);
    persist(safe, items);
  };

  const addItem = () => {
    const parsedAmount = Number(amount);
    if (!title.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    const nextItems = [
      {
        id: createId(),
        title: title.trim(),
        category,
        amount: parsedAmount,
        date,
      },
      ...items,
    ];

    setItems(nextItems);
    persist(monthlyLimit, nextItems);

    setTitle("");
    setAmount("");
    setCategory("الطعام");
    setDate(todayISO());
  };

  const deleteItem = (id: string) => {
    const nextItems = items.filter((item) => item.id !== id);
    setItems(nextItems);
    persist(monthlyLimit, nextItems);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-10" dir="rtl">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
              </Link>
              <ThemeToggle />
            </div>

            <h1 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Wallet className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
              الميزانية
            </h1>

            <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-semibold tabular-nums">
              تحديث فوري
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-5 md:pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">سقف الشهر</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{formatNumber(monthlyLimit)} ₪</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">المصروف</p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">{formatNumber(totalSpent)} ₪</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">المتبقي</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatNumber(remaining)} ₪</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">نسبة الصرف</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{spentRatio}%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5 mb-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-primary" />
              تحكم بالسقف الشهري
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
              type="number"
              min="0"
              value={monthlyLimit}
              onChange={(e) => updateLimit(e.target.value)}
              className="w-full sm:w-56 bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100"
            />
            <div className="flex-1">
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${spentRatio}%` }}
                  transition={{ duration: 0.35 }}
                  className={`h-full rounded-full ${spentRatio >= 90 ? "bg-rose-500" : "bg-emerald-500"}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
            <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              إضافة مصروف
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان المصروف"
                className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100"
              />
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="المبلغ"
                className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 tabular-nums"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BudgetCategory)}
                className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 tabular-nums"
              />
            </div>

            <button
              onClick={addItem}
              className="mt-3 w-full md:w-auto px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:opacity-95 transition-opacity"
            >
              حفظ المصروف
            </button>

            <div className="mt-6">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                توزيع الصرف حسب الفئة
              </h3>
              <div className="space-y-2.5">
                {byCategory.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد مصروفات بعد</p>
                )}
                {byCategory.map((row) => (
                  <div key={row.name} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{row.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">{formatNumber(row.amount)} ₪ • {row.ratio}%</p>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${row.ratio}%` }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-5">
            <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-blue-500" />
              آخر المصروفات
            </h2>

            <div className="space-y-2.5 max-h-[530px] overflow-auto pr-1">
              {recentItems.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">لم يتم إضافة أي مصروف بعد</p>
              )}

              {recentItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/40 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.category} • {item.date}</p>
                    </div>

                    <div className="text-left">
                      <p className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">{formatNumber(item.amount)} ₪</p>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="mt-1 text-slate-400 hover:text-rose-500 transition-colors"
                        aria-label="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

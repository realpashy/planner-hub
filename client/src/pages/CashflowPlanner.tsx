import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BarChart3, CalendarClock, Home, ListOrdered, Settings, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CashflowOverview } from "@/components/cashflow/CashflowOverview";
import { CashflowTransactions } from "@/components/cashflow/CashflowTransactions";
import { CashflowUpcoming } from "@/components/cashflow/CashflowUpcoming";
import { CashflowPartners } from "@/components/cashflow/CashflowPartners";
import { CashflowSettings } from "@/components/cashflow/CashflowSettings";
import { AddEntrySheet, AddUpcomingSheet } from "@/components/cashflow/AddEntrySheet";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CashflowNumericField } from "@/components/cashflow/CashflowNumericField";
import {
  type CashflowData,
  type CashflowPartner,
  type CashflowSettings as CashflowSettingsType,
  type CashflowTransaction,
  type UpcomingPayment,
  formatCashflowAmount,
  loadCashflowData,
  saveCashflowData,
} from "@/lib/cashflow";
import { pullCloudToLocal, pushLocalToCloud } from "@/lib/cloud-sync";

type ScreenKey = "overview" | "transactions" | "upcoming" | "partners" | "settings";

interface NavItem {
  key: ScreenKey;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { key: "overview", label: "סקירה", icon: BarChart3 },
  { key: "transactions", label: "עסקאות", icon: ListOrdered },
  { key: "upcoming", label: "תשלומים", icon: CalendarClock },
  { key: "partners", label: "שותפים", icon: Users },
  { key: "settings", label: "הגדרות", icon: Settings },
];

const SCREEN_TITLES: Record<ScreenKey, string> = {
  overview: "תזרים מזומנים",
  transactions: "עסקאות",
  upcoming: "תשלומים עתידיים",
  partners: "שותפים",
  settings: "הגדרות",
};

interface UpdateBalanceSheetProps {
  open: boolean;
  data: CashflowData;
  onClose: () => void;
  onSave: (bankBalance: number, cashOnHand: number) => void;
}

function UpdateBalanceSheet({ open, data, onClose, onSave }: UpdateBalanceSheetProps) {
  const [bankBalance, setBankBalance] = useState(data.settings.bankBalance?.toString() ?? "");
  const [cashOnHand, setCashOnHand] = useState(data.settings.cashOnHand?.toString() ?? "");

  useEffect(() => {
    if (!open) return;
    setBankBalance(data.settings.bankBalance?.toString() ?? "");
    setCashOnHand(data.settings.cashOnHand?.toString() ?? "");
  }, [data.settings.bankBalance, data.settings.cashOnHand, open]);

  const previewTotal = (Number.parseFloat(bankBalance || "0") || 0) + (Number.parseFloat(cashOnHand || "0") || 0);

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent
        side="bottom"
        dir="rtl"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className={cn(
          "max-h-[72dvh] rounded-t-[1.25rem] border-t border-border/60 p-0 bg-popover md:mx-auto md:mb-4 md:max-w-[60vw] md:rounded-[calc(var(--radius)+1rem)] md:border",
          "bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.03),transparent_40%)]",
          "dark:bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.07),transparent_40%),linear-gradient(180deg,rgba(30,30,30,0.99),rgba(22,22,22,0.99))]",
          "[&>button]:left-4 [&>button]:right-auto [&>button]:top-4",
        )}
      >
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-border/60" />
        </div>
        <SheetHeader className="px-5 pb-2 text-right">
          <SheetTitle>עדכון יתרה זמינה</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-5 pb-6 pt-2">
          <CashflowNumericField label="יתרת בנק" value={bankBalance} onChange={setBankBalance} />
          <CashflowNumericField label="מזומן" value={cashOnHand} onChange={setCashOnHand} />

          <div className="rounded-[calc(var(--radius)+0.25rem)] border border-sky-500/20 bg-sky-500/[0.07] px-3 py-2 text-right">
            <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
              יתרה מחושבת: {formatCashflowAmount(previewTotal, data.settings.currency)}
            </p>
          </div>

          <Button
            size="lg"
            className="h-13 w-full rounded-[calc(var(--radius)+0.5rem)] font-bold"
            onClick={() => {
              onSave(Number.parseFloat(bankBalance || "0") || 0, Number.parseFloat(cashOnHand || "0") || 0);
              onClose();
            }}
          >
            שמור יתרה
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function CashflowPlanner() {
  const [data, setData] = useState<CashflowData>(() => loadCashflowData());
  const [screen, setScreen] = useState<ScreenKey>("overview");
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddUpcoming, setShowAddUpcoming] = useState(false);
  const [showUpdateBalance, setShowUpdateBalance] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<CashflowTransaction | null>(null);
  const [editingUpcoming, setEditingUpcoming] = useState<UpcomingPayment | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "auto" });

    let active = true;
    pullCloudToLocal()
      .then(() => {
        if (active) setData(loadCashflowData());
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [screen]);

  const updateData = useCallback((updater: (previous: CashflowData) => CashflowData) => {
    setData((previous) => {
      const next = { ...updater(previous), lastUpdated: new Date().toISOString() };
      saveCashflowData(next);
      pushLocalToCloud().catch(() => null);
      return next;
    });
  }, []);

  const hasNewTransactionsToday = useMemo(
    () => data.transactions.some((transaction) => transaction.date === new Date().toISOString().split("T")[0]),
    [data.transactions],
  );

  function handleSaveTransaction(transaction: CashflowTransaction) {
    updateData((previous) => {
      const exists = previous.transactions.some((item) => item.id === transaction.id);
      return {
        ...previous,
        transactions: exists
          ? previous.transactions.map((item) => (item.id === transaction.id ? transaction : item))
          : [transaction, ...previous.transactions],
      };
    });
    setEditingTransaction(null);
  }

  function handleSaveUpcoming(payment: UpcomingPayment) {
    updateData((previous) => {
      const exists = previous.upcomingPayments.some((item) => item.id === payment.id);
      return {
        ...previous,
        upcomingPayments: exists
          ? previous.upcomingPayments.map((item) => (item.id === payment.id ? payment : item))
          : [...previous.upcomingPayments, payment],
      };
    });
    setEditingUpcoming(null);
  }

  function handleMarkPaymentPaid(id: string, createExpense: boolean) {
    updateData((previous) => {
      const payment = previous.upcomingPayments.find((item) => item.id === id);
      if (!payment) return previous;

      const updatedPayments = previous.upcomingPayments.map((item) =>
        item.id === id ? { ...item, status: "paid" as const, updatedAt: new Date().toISOString() } : item,
      );

      if (!createExpense) {
        return {
          ...previous,
          upcomingPayments: updatedPayments,
        };
      }

      const expenseTransaction: CashflowTransaction = {
        id: `${id}-expense-${Date.now()}`,
        type: "expense",
        amount: payment.amount,
        date: payment.dueDate,
        category: "recurring",
        note: payment.note ? `${payment.name} • ${payment.note}` : payment.name,
        paidFor: payment.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        ...previous,
        upcomingPayments: updatedPayments,
        transactions: [expenseTransaction, ...previous.transactions],
      };
    });
  }

  function handleSavePartners(partners: CashflowPartner[]) {
    updateData((previous) => {
      return {
        ...previous,
        partners,
      };
    });
  }

  function handleSaveSettings(settings: CashflowSettingsType) {
    updateData((previous) => ({
      ...previous,
      settings,
    }));
  }

  function handleImport(nextData: CashflowData) {
    updateData(() => nextData);
  }

  function handleUpdateBalance(bankBalance: number, cashOnHand: number) {
    updateData((previous) => ({
      ...previous,
      settings: {
        ...previous.settings,
        balanceMode: "split",
        bankBalance,
        cashOnHand,
        overallAvailableCash: undefined,
      },
    }));
  }

  return (
    <div className="app-shell flex min-h-screen flex-col" dir="rtl">
      <nav className="sticky top-0 z-50 shrink-0 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="flex w-full items-center justify-between px-4 py-3 md:px-6 xl:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/[0.15] text-sky-600 dark:text-sky-300">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="space-y-0.5 text-right">
              <div className="font-hebrew flex items-center justify-start gap-2 text-xs font-semibold text-muted-foreground">
                <span className="text-muted-foreground/70">/</span>
                <span>{SCREEN_TITLES[screen]}</span>
                <Link href="/">
                  <button className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-primary transition-colors hover:bg-primary/[0.08]">
                    <Home className="h-3.5 w-3.5" />
                    בית
                  </button>
                </Link>
              </div>
              <span className="font-hebrew block text-base font-black tracking-tight text-foreground">{SCREEN_TITLES[screen]}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/">
              <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-24">
        <div className="w-full px-4 py-5 md:px-6 xl:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {screen === "overview" ? (
                <CashflowOverview
                  data={data}
                  onAddIncome={() => setShowAddIncome(true)}
                  onAddExpense={() => setShowAddExpense(true)}
                  onAddUpcoming={() => setShowAddUpcoming(true)}
                  onUpdateBalance={() => setShowUpdateBalance(true)}
                  onViewUpcoming={() => setScreen("upcoming")}
                />
              ) : null}

              {screen === "transactions" ? (
                <CashflowTransactions
                  data={data}
                  onAddIncome={() => setShowAddIncome(true)}
                  onAddExpense={() => setShowAddExpense(true)}
                  onEditTransaction={(transaction) => setEditingTransaction(transaction)}
                />
              ) : null}

              {screen === "upcoming" ? (
                <CashflowUpcoming
                  data={data}
                  onAddUpcoming={() => setShowAddUpcoming(true)}
                  onEditUpcoming={(payment) => setEditingUpcoming(payment)}
                  onMarkPaid={handleMarkPaymentPaid}
                />
              ) : null}

              {screen === "partners" ? (
                <CashflowPartners data={data} onSavePartners={handleSavePartners} />
              ) : null}

              {screen === "settings" ? (
                <CashflowSettings data={data} onSave={handleSaveSettings} onImport={handleImport} />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <nav className="safe-area-bottom fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-md">
        <div className="flex w-full items-center justify-around px-2 py-2 md:px-6 xl:px-8">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = screen === key;
            const showDot = key === "transactions" && hasNewTransactionsToday && !isActive;

            return (
              <button
                key={key}
                onClick={() => setScreen(key)}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-[calc(var(--radius)+0.25rem)] px-3 py-2 transition-all duration-200",
                  isActive ? "text-sky-600 dark:text-sky-300" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-[calc(var(--radius))] transition-all duration-200",
                    isActive ? "bg-sky-500/[0.15]" : "bg-transparent",
                  )}
                >
                  <Icon className={cn("h-5 w-5 transition-all", isActive && "scale-110")} />
                </div>
                <span className={cn("text-[10px] font-semibold leading-none", isActive && "font-bold")}>{label}</span>
                {showDot ? <span className="absolute right-2.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" /> : null}
              </button>
            );
          })}
        </div>
      </nav>

      <AddEntrySheet
        open={showAddIncome}
        type="income"
        currency={data.settings.currency}
        defaultCategory="daily_sales"
        onClose={() => setShowAddIncome(false)}
        onSave={handleSaveTransaction}
      />
      <AddEntrySheet
        open={showAddExpense}
        type="expense"
        currency={data.settings.currency}
        onClose={() => setShowAddExpense(false)}
        onSave={handleSaveTransaction}
      />
      <AddEntrySheet
        open={Boolean(editingTransaction)}
        type={editingTransaction?.type ?? "income"}
        currency={data.settings.currency}
        initialTransaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={handleSaveTransaction}
      />
      <AddUpcomingSheet
        open={showAddUpcoming}
        currency={data.settings.currency}
        onClose={() => setShowAddUpcoming(false)}
        onSave={handleSaveUpcoming}
      />
      <AddUpcomingSheet
        open={Boolean(editingUpcoming)}
        currency={data.settings.currency}
        initialPayment={editingUpcoming}
        onClose={() => setEditingUpcoming(null)}
        onSave={handleSaveUpcoming}
      />
      <UpdateBalanceSheet
        open={showUpdateBalance}
        data={data}
        onClose={() => setShowUpdateBalance(false)}
        onSave={handleUpdateBalance}
      />
    </div>
  );
}

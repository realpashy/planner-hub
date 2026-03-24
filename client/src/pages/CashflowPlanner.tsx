// ─────────────────────────────────────────────────────────────────────────────
// CashflowPlanner — Main page for the Cashflow module
// Language: Hebrew-first. RTL-first. Mobile-first.
// Architecture: state-driven screen switching with a fixed bottom nav bar.
// Screens: overview | transactions | upcoming | partners | settings
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CashflowOverview } from "@/components/cashflow/CashflowOverview";
import { CashflowTransactions } from "@/components/cashflow/CashflowTransactions";
import { CashflowUpcoming } from "@/components/cashflow/CashflowUpcoming";
import { CashflowPartners } from "@/components/cashflow/CashflowPartners";
import { CashflowSettings } from "@/components/cashflow/CashflowSettings";
import { AddEntrySheet, AddUpcomingSheet } from "@/components/cashflow/AddEntrySheet";
import {
  type CashflowData,
  type CashflowTransaction,
  type UpcomingPayment,
  type CashflowPartner,
  type CashflowSettings as CashflowSettingsType,
  loadCashflowData,
  saveCashflowData,
  generateId,
} from "@/lib/cashflow";
import {
  ArrowLeft,
  BarChart3,
  CalendarClock,
  LayoutGrid,
  ListOrdered,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";

// ── Screen types ──────────────────────────────────────────────────────────────
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

// ── Balance update sheet (inline simple) ─────────────────────────────────────
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCashflowAmount } from "@/lib/cashflow";

interface UpdateBalanceSheetProps {
  open: boolean;
  data: CashflowData;
  onClose: () => void;
  onSave: (bankBalance: number, cashInRegister: number) => void;
}

function UpdateBalanceSheet({ open, data, onClose, onSave }: UpdateBalanceSheetProps) {
  const [bank, setBank] = useState(data.settings.bankBalance?.toString() ?? "");
  const [cash, setCash] = useState(data.settings.cashInRegister?.toString() ?? "");

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className={cn(
          "max-h-[72dvh] rounded-t-[1.25rem] border-t border-border/60 p-0 bg-popover",
          "bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.03),transparent_40%)]",
          "dark:bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.07),transparent_40%),linear-gradient(180deg,rgba(30,30,30,0.99),rgba(22,22,22,0.99))]",
          "[&>button]:left-4 [&>button]:right-auto [&>button]:top-4",
        )}
        dir="rtl"
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border/60" />
        </div>
        <SheetHeader className="px-5 pb-2 text-right">
          <SheetTitle className="text-xl font-black">עדכן יתרה</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-5 pb-6 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">יתרת בנק (₪)</label>
            <div className="relative">
              <span className="absolute end-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground pointer-events-none">₪</span>
              <Input
                type="number" inputMode="decimal" value={bank} onChange={(e) => setBank(e.target.value)}
                className="h-12 pe-8 text-right rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 focus:border-primary/50"
                style={{ direction: "ltr", textAlign: "right" }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">מזומן בקופה (₪)</label>
            <div className="relative">
              <span className="absolute end-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground pointer-events-none">₪</span>
              <Input
                type="number" inputMode="decimal" value={cash} onChange={(e) => setCash(e.target.value)}
                className="h-12 pe-8 text-right rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 focus:border-primary/50"
                style={{ direction: "ltr", textAlign: "right" }}
              />
            </div>
          </div>
          <div className="rounded-[calc(var(--radius)+0.25rem)] border border-sky-500/20 bg-sky-500/[0.07] px-3 py-2 text-right">
            <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
              יתרה כוללת: {formatCashflowAmount((parseFloat(bank || "0") + parseFloat(cash || "0")), data.settings.currency)}
            </p>
          </div>
          <Button
            onClick={() => { onSave(parseFloat(bank || "0"), parseFloat(cash || "0")); onClose(); }}
            size="lg"
            className="w-full h-13 rounded-[calc(var(--radius)+0.5rem)] font-bold"
          >
            עדכן יתרה
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Main page component ───────────────────────────────────────────────────────
export default function CashflowPlanner() {
  const [data, setData] = useState<CashflowData>(() => loadCashflowData());
  const [screen, setScreen] = useState<ScreenKey>("overview");
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddUpcoming, setShowAddUpcoming] = useState(false);
  const [showUpdateBalance, setShowUpdateBalance] = useState(false);

  const updateData = useCallback((updater: (prev: CashflowData) => CashflowData) => {
    setData((prev) => {
      const next = updater(prev);
      saveCashflowData(next);
      return next;
    });
  }, []);

  function handleSaveTransaction(tx: CashflowTransaction) {
    updateData((prev) => ({
      ...prev,
      transactions: [tx, ...prev.transactions],
    }));
  }

  function handleSaveUpcoming(payment: UpcomingPayment) {
    updateData((prev) => ({
      ...prev,
      upcomingPayments: [...prev.upcomingPayments, payment],
    }));
  }

  function handleMarkPaid(id: string) {
    updateData((prev) => ({
      ...prev,
      upcomingPayments: prev.upcomingPayments.map((p) =>
        p.id === id ? { ...p, status: "paid" as const } : p,
      ),
    }));
  }

  function handleSavePartner(partner: CashflowPartner) {
    updateData((prev) => ({
      ...prev,
      partners: [...prev.partners, partner],
    }));
  }

  function handleSaveSettings(settings: CashflowSettingsType) {
    updateData((prev) => ({ ...prev, settings }));
  }

  function handleUpdateBalance(bankBalance: number, cashInRegister: number) {
    updateData((prev) => ({
      ...prev,
      settings: { ...prev.settings, bankBalance, cashInRegister, availableBalanceOverride: undefined },
    }));
  }

  const hasNewTransactions =
    data.transactions.filter((t) => t.date === new Date().toISOString().split("T")[0]).length > 0;

  return (
    <div className="app-shell flex flex-col" dir="rtl">

      {/* ── Sticky top navbar ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md shrink-0">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">

          {/* Brand/back — first in DOM → visual RIGHT in RTL */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/[0.15] text-sky-600 dark:text-sky-300 border border-sky-500/20">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span className="text-base font-black tracking-tight text-foreground">
                {SCREEN_TITLES[screen]}
              </span>
            </div>
          </div>

          {/* Actions — second in DOM → visual LEFT in RTL */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
          </div>

        </div>
      </nav>

      {/* ── Scrollable content area ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="mx-auto max-w-2xl px-4 py-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {screen === "overview" && (
                <CashflowOverview
                  data={data}
                  onAddIncome={() => setShowAddIncome(true)}
                  onAddExpense={() => setShowAddExpense(true)}
                  onAddUpcoming={() => setShowAddUpcoming(true)}
                  onUpdateBalance={() => setShowUpdateBalance(true)}
                  onViewUpcoming={() => setScreen("upcoming")}
                />
              )}
              {screen === "transactions" && (
                <CashflowTransactions
                  data={data}
                  onAddIncome={() => setShowAddIncome(true)}
                  onAddExpense={() => setShowAddExpense(true)}
                />
              )}
              {screen === "upcoming" && (
                <CashflowUpcoming
                  data={data}
                  onAddUpcoming={() => setShowAddUpcoming(true)}
                  onMarkPaid={handleMarkPaid}
                />
              )}
              {screen === "partners" && (
                <CashflowPartners
                  data={data}
                  onSavePartner={handleSavePartner}
                />
              )}
              {screen === "settings" && (
                <CashflowSettings
                  data={data}
                  onSave={handleSaveSettings}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Fixed bottom navigation bar ───────────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-md safe-area-bottom">
        <div className="mx-auto flex max-w-2xl items-center justify-around px-2 py-2">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = screen === key;
            // Show dot indicator for transactions if new transactions today
            const showDot = key === "transactions" && hasNewTransactions && !isActive;
            return (
              <button
                key={key}
                onClick={() => setScreen(key)}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-[calc(var(--radius)+0.25rem)] px-3 py-2 transition-all duration-200",
                  isActive
                    ? "text-sky-600 dark:text-sky-300"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-[calc(var(--radius))] transition-all duration-200",
                  isActive ? "bg-sky-500/[0.15]" : "bg-transparent",
                )}>
                  <Icon className={cn("h-5 w-5 transition-all", isActive && "scale-110")} />
                </div>
                <span className={cn("text-[10px] font-semibold leading-none", isActive && "font-bold")}>
                  {label}
                </span>
                {showDot && (
                  <span className="absolute top-1.5 right-2.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Sheets ────────────────────────────────────────────────────────── */}
      <AddEntrySheet
        open={showAddIncome}
        type="income"
        currency={data.settings.currency}
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
      <AddUpcomingSheet
        open={showAddUpcoming}
        currency={data.settings.currency}
        onClose={() => setShowAddUpcoming(false)}
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

// ─────────────────────────────────────────────────────────────────────────────
// CashflowSettings — Business baseline & balance setup
// Hebrew-first. Non-technical language. Simple form.
// Designed for business owners joining mid-way who need to set an overall picture.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  type CashflowData,
  type CashflowSettings,
  formatCashflowAmount,
} from "@/lib/cashflow";
import { Banknote, Check, Info, Settings, Target, TrendingDown, TrendingUp } from "lucide-react";

interface FieldProps {
  label: string;
  description?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
}

function SettingField({ label, description, placeholder, value, onChange, prefix, suffix }: FieldProps) {
  return (
    <div className="space-y-1.5 text-right">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {description && (
        <p className="text-xs text-muted-foreground leading-5">{description}</p>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground pointer-events-none">
            {prefix}
          </span>
        )}
        {suffix && (
          <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
        <Input
          type="number"
          inputMode="decimal"
          placeholder={placeholder ?? "0"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-12 rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 text-right focus:border-primary/50",
            prefix && "pe-8",
            suffix && "ps-8",
          )}
          style={{ direction: "ltr", textAlign: "right" }}
        />
      </div>
    </div>
  );
}

interface CashflowSettingsProps {
  data: CashflowData;
  onSave: (settings: CashflowSettings) => void;
}

export function CashflowSettings({ data, onSave }: CashflowSettingsProps) {
  const s = data.settings;

  // Balance inputs
  const [bankBalance, setBankBalance] = useState(s.bankBalance?.toString() ?? "");
  const [cashInRegister, setCashInRegister] = useState(s.cashInRegister?.toString() ?? "");
  const [useOverride, setUseOverride] = useState(s.availableBalanceOverride !== undefined);
  const [balanceOverride, setBalanceOverride] = useState(s.availableBalanceOverride?.toString() ?? "");

  // Baselines
  const [monthlyExpenses, setMonthlyExpenses] = useState(s.monthlyExpensesBaseline?.toString() ?? "");
  const [monthlyIncome, setMonthlyIncome] = useState(s.monthlyIncomeBaseline?.toString() ?? "");
  const [warningThreshold, setWarningThreshold] = useState(s.cashflowWarningThreshold?.toString() ?? "");

  const [saved, setSaved] = useState(false);

  function handleSave() {
    onSave({
      ...s,
      bankBalance: bankBalance ? parseFloat(bankBalance) : undefined,
      cashInRegister: cashInRegister ? parseFloat(cashInRegister) : undefined,
      availableBalanceOverride: useOverride && balanceOverride ? parseFloat(balanceOverride) : undefined,
      monthlyExpensesBaseline: monthlyExpenses ? parseFloat(monthlyExpenses) : undefined,
      monthlyIncomeBaseline: monthlyIncome ? parseFloat(monthlyIncome) : undefined,
      cashflowWarningThreshold: warningThreshold ? parseFloat(warningThreshold) : undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const computedBalance = useOverride
    ? parseFloat(balanceOverride || "0")
    : (parseFloat(bankBalance || "0") + parseFloat(cashInRegister || "0"));

  return (
    <div className="space-y-5 pb-8">

      {/* ── Intro ────────────────────────────────────────────────────────── */}
      <div className="text-right space-y-1">
        <h2 className="text-lg font-black">הגדרות תזרים</h2>
        <p className="text-sm text-muted-foreground leading-6">
          הגדר את נקודת ההתחלה של העסק שלך. אלו הם הנתונים הבסיסיים שעוזרים לנו לחשב את יעד ההכנסה היומי ולזהות מצבים של לחץ תזרימי.
        </p>
      </div>

      {/* ── Balance section ──────────────────────────────────────────────── */}
      <Card className="surface-shell rounded-[calc(var(--radius)+0.85rem)] border-border/70">
        <CardHeader className="pb-3 pt-4 px-4 text-right">
          <div className="rtl-title-row">
            <CardTitle className="text-sm font-bold">יתרה זמינה</CardTitle>
            <div className="icon-chip h-9 w-9 shrink-0 rounded-[calc(var(--radius)+0.375rem)] border-sky-500/20 bg-sky-500/[0.1] text-sky-600 dark:text-sky-300">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">

          {/* Toggle: separate vs combined */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: false, label: "בנק + קופה" },
              { id: true, label: "יתרה כוללת" },
            ].map(({ id, label }) => (
              <button
                key={String(id)}
                onClick={() => setUseOverride(id)}
                className={cn(
                  "rounded-[calc(var(--radius)+0.25rem)] border py-2.5 text-sm font-semibold transition-all",
                  useOverride === id
                    ? "border-sky-500/40 bg-sky-500/[0.12] text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/25"
                    : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {useOverride ? (
            <SettingField
              label="יתרה זמינה כוללת (₪)"
              description="סכום כולל של כל הכסף הזמין לעסק כרגע"
              value={balanceOverride}
              onChange={setBalanceOverride}
              prefix="₪"
            />
          ) : (
            <div className="space-y-3">
              <SettingField
                label="יתרת בנק (₪)"
                description="הסכום בחשבון הבנק העסקי"
                value={bankBalance}
                onChange={setBankBalance}
                prefix="₪"
              />
              <SettingField
                label="מזומן בקופה (₪)"
                description="המזומן הפיזי בקופה"
                value={cashInRegister}
                onChange={setCashInRegister}
                prefix="₪"
              />
            </div>
          )}

          {/* Computed balance preview */}
          {computedBalance > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-[calc(var(--radius)+0.25rem)] border border-sky-500/20 bg-sky-500/[0.07] px-3 py-2 text-right"
            >
              <Info className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-300" />
              <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                יתרה זמינה מחושבת: {formatCashflowAmount(computedBalance, data.settings.currency)}
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* ── Baseline section ─────────────────────────────────────────────── */}
      <Card className="surface-shell rounded-[calc(var(--radius)+0.85rem)] border-border/70">
        <CardHeader className="pb-3 pt-4 px-4 text-right">
          <div className="rtl-title-row">
            <CardTitle className="text-sm font-bold">נתוני בסיס חודשיים</CardTitle>
            <div className="icon-chip h-9 w-9 shrink-0 rounded-[calc(var(--radius)+0.375rem)] border-primary/20 bg-primary/[0.1] text-primary">
              <Settings className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <div className="flex items-start gap-2 rounded-[calc(var(--radius)+0.25rem)] border border-border/40 bg-muted/30 px-3 py-2.5 text-right">
            <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground leading-5">
              השתמש בנתונים אלו אם הצטרפת באמצע חודש ורוצה תמונה כוללת מדויקת. אין חובה למלא הכל.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rtl-title-row items-center">
              <label className="text-sm font-semibold text-foreground">הוצאות חודשיות ממוצעות (₪)</label>
              <TrendingDown className="h-4 w-4 text-rose-500 shrink-0" />
            </div>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="לדוגמה: 18000"
              value={monthlyExpenses}
              onChange={(e) => setMonthlyExpenses(e.target.value)}
              className="h-12 rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 text-right focus:border-primary/50"
              style={{ direction: "ltr", textAlign: "right" }}
            />
          </div>

          <div className="space-y-3">
            <div className="rtl-title-row items-center">
              <label className="text-sm font-semibold text-foreground">הכנסה חודשית ממוצעת (₪)</label>
              <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
            </div>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="לדוגמה: 25000"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              className="h-12 rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 text-right focus:border-primary/50"
              style={{ direction: "ltr", textAlign: "right" }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Warning threshold section ─────────────────────────────────────── */}
      <Card className="surface-shell rounded-[calc(var(--radius)+0.85rem)] border-border/70">
        <CardHeader className="pb-3 pt-4 px-4 text-right">
          <div className="rtl-title-row">
            <div>
              <CardTitle className="text-sm font-bold">סף אזהרה תזרימי</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                כשהיתרה הזמינה יורדת מתחת לסף זה, מוצגת אזהרה
              </p>
            </div>
            <div className="icon-chip h-9 w-9 shrink-0 rounded-[calc(var(--radius)+0.375rem)] border-amber-500/20 bg-amber-500/[0.1] text-amber-600 dark:text-amber-300">
              <Target className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="relative">
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground pointer-events-none">₪</span>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="לדוגמה: 5000"
              value={warningThreshold}
              onChange={(e) => setWarningThreshold(e.target.value)}
              className="h-12 pe-8 rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 text-right focus:border-primary/50"
              style={{ direction: "ltr", textAlign: "right" }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Save button ───────────────────────────────────────────────────── */}
      <Button
        onClick={handleSave}
        size="lg"
        className="w-full h-14 rounded-[calc(var(--radius)+0.5rem)] text-base font-bold gap-2"
      >
        {saved ? (
          <>
            <Check className="h-5 w-5" />
            נשמר בהצלחה
          </>
        ) : (
          "שמור הגדרות"
        )}
      </Button>

    </div>
  );
}

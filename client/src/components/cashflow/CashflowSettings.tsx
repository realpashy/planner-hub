import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Banknote, Check, Download, Import, Info, Settings, Target, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type CashflowData, type CashflowSettings as CashflowSettingsType, formatCashflowAmount } from "@/lib/cashflow";
import { CashflowNumericField } from "@/components/cashflow/CashflowNumericField";
import { CashflowImportDialog } from "@/components/cashflow/CashflowImportDialog";
import { downloadCashflowTemplateWorkbook } from "@/lib/cashflow-import";

interface CashflowSettingsProps {
  data: CashflowData;
  onSave: (settings: CashflowSettingsType) => void;
  onImport: (nextData: CashflowData) => void;
}

export function CashflowSettings({ data, onSave, onImport }: CashflowSettingsProps) {
  const settings = data.settings;
  const [bankBalance, setBankBalance] = useState("");
  const [cashOnHand, setCashOnHand] = useState("");
  const [overallAvailableCash, setOverallAvailableCash] = useState("");
  const [overallBankPortion, setOverallBankPortion] = useState("");
  const [monthlyBaselineExpenses, setMonthlyBaselineExpenses] = useState("");
  const [monthlyBaselineIncome, setMonthlyBaselineIncome] = useState("");
  const [cashWarningThreshold, setCashWarningThreshold] = useState("");
  const [balanceMode, setBalanceMode] = useState<"split" | "overall">("split");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    setBankBalance(settings.bankBalance?.toString() ?? "");
    setCashOnHand(settings.cashOnHand?.toString() ?? "");
    setOverallAvailableCash(settings.overallAvailableCash?.toString() ?? "");
    setOverallBankPortion(settings.overallBankPortion?.toString() ?? "");
    setMonthlyBaselineExpenses(settings.monthlyBaselineExpenses?.toString() ?? "");
    setMonthlyBaselineIncome(settings.monthlyBaselineIncome?.toString() ?? "");
    setCashWarningThreshold(settings.cashWarningThreshold?.toString() ?? "");
    setBalanceMode(settings.balanceMode ?? (settings.overallAvailableCash !== undefined ? "overall" : "split"));
    setError("");
  }, [settings]);

  const computedBalance = useMemo(() => {
    if (balanceMode === "overall") return Number.parseFloat(overallAvailableCash || "0") || 0;
    return (Number.parseFloat(bankBalance || "0") || 0) + (Number.parseFloat(cashOnHand || "0") || 0);
  }, [balanceMode, bankBalance, cashOnHand, overallAvailableCash]);

  function handleSave() {
    const totalOverall = Number.parseFloat(overallAvailableCash || "0") || 0;
    const bankPart = Number.parseFloat(overallBankPortion || "0") || 0;

    if (balanceMode === "overall" && bankPart > totalOverall) {
      setError("הסכום שבבנק לא יכול להיות גדול מהיתרה הכוללת.");
      return;
    }

    onSave({
      ...settings,
      balanceMode,
      bankBalance: balanceMode === "split" && bankBalance ? Number.parseFloat(bankBalance) : undefined,
      cashOnHand: balanceMode === "split" && cashOnHand ? Number.parseFloat(cashOnHand) : undefined,
      overallAvailableCash: balanceMode === "overall" && overallAvailableCash ? Number.parseFloat(overallAvailableCash) : undefined,
      overallBankPortion: balanceMode === "overall" && overallBankPortion ? Number.parseFloat(overallBankPortion) : undefined,
      monthlyBaselineExpenses: monthlyBaselineExpenses ? Number.parseFloat(monthlyBaselineExpenses) : undefined,
      monthlyBaselineIncome: monthlyBaselineIncome ? Number.parseFloat(monthlyBaselineIncome) : undefined,
      cashWarningThreshold: cashWarningThreshold ? Number.parseFloat(cashWarningThreshold) : undefined,
    });
    setError("");
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <div className="space-y-5 pb-8">
        <div className="space-y-1 text-right">
          <h2 className="font-hebrew text-lg font-black">הגדרות תזרים</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            קבע את נקודת ההתחלה של העסק. נתוני הבסיס האלו משמשים רק להצגת תמונת מצב, תחזית ויעד יומי נדרש.
          </p>
        </div>

        <Card className="surface-shell rounded-[calc(var(--radius)+0.85rem)] border-border/70">
          <CardHeader className="px-4 pb-3 pt-6 text-right">
            <div className="flex items-center gap-3">
              <div className="icon-chip h-9 w-9 shrink-0 rounded-[calc(var(--radius)+0.375rem)] border-sky-500/20 bg-sky-500/[0.1] text-sky-600 dark:text-sky-300">
                <Banknote className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 text-right">
                <CardTitle className="text-sm font-bold">יתרה זמינה</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "split" as const, label: "בנק + מזומן" },
                { value: "overall" as const, label: "יתרה כוללת" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBalanceMode(option.value)}
                  className={cn(
                    "rounded-[calc(var(--radius)+0.25rem)] border py-2.5 text-sm font-semibold transition-all",
                    balanceMode === option.value
                      ? "border-sky-500/40 bg-sky-500/[0.12] text-sky-700 ring-1 ring-sky-500/25 dark:text-sky-300"
                      : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {balanceMode === "overall" ? (
              <div className="space-y-3">
                <CashflowNumericField
                  label="יתרה זמינה כוללת"
                  description="כשממלאים יתרה כוללת, היא גוברת על שדות בנק + מזומן לצורך חישובי התזרים."
                  value={overallAvailableCash}
                  onChange={(value) => {
                    setOverallAvailableCash(value);
                    setError("");
                  }}
                />
                {overallAvailableCash ? (
                  <CashflowNumericField
                    label="מאלה, בחשבון הבנק:"
                    description="השדה הזה נשמר לצפייה ופיצול עתידי, אבל כרגע החישובים מתבססים על היתרה הכוללת."
                    value={overallBankPortion}
                    onChange={(value) => {
                      setOverallBankPortion(value);
                      setError("");
                    }}
                  />
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                <CashflowNumericField label="יתרת בנק" description="הסכום בחשבון הבנק העסקי." value={bankBalance} onChange={setBankBalance} />
                <CashflowNumericField label="מזומן" description="מזומן זמין שנמצא כרגע בעסק." value={cashOnHand} onChange={setCashOnHand} />
              </div>
            )}

            {computedBalance > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[calc(var(--radius)+0.25rem)] border border-sky-500/20 bg-sky-500/[0.07] px-3 py-2 text-right"
              >
                <div className="flex items-center gap-2">
                  <Info className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-300" />
                  <div className="min-w-0 flex-1 text-right">
                    <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                      יתרה זמינה מחושבת: {formatCashflowAmount(computedBalance, data.settings.currency)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="surface-shell rounded-[calc(var(--radius)+0.85rem)] border-border/70">
          <CardHeader className="px-4 pb-3 pt-5 text-right">
            <div className="flex items-center gap-3">
              <div className="icon-chip h-9 w-9 shrink-0 rounded-[calc(var(--radius)+0.375rem)] border-primary/20 bg-primary/[0.1] text-primary">
                <Settings className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 text-right">
                <CardTitle className="text-sm font-bold">נתוני בסיס חודשיים</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-4">
            <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/40 bg-muted/30 px-3 py-2.5 text-right">
              <p className="text-xs leading-5 text-muted-foreground">
                נתוני הבסיס האלו משמשים רק לתחזית ולסקירה. הם לא יוצרים עסקאות מזויפות ולא משנים את ההיסטוריה שלך.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-right">
                <TrendingDown className="h-4 w-4 shrink-0 text-rose-500" />
                <div className="min-w-0 flex-1 text-right">
                  <label className="text-sm font-semibold text-foreground">הוצאות בסיס חודשיות</label>
                </div>
              </div>
              <CashflowNumericField value={monthlyBaselineExpenses} onChange={setMonthlyBaselineExpenses} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-right">
                <TrendingUp className="h-4 w-4 shrink-0 text-emerald-500" />
                <div className="min-w-0 flex-1 text-right">
                  <label className="text-sm font-semibold text-foreground">הכנסות בסיס חודשיות</label>
                </div>
              </div>
              <CashflowNumericField value={monthlyBaselineIncome} onChange={setMonthlyBaselineIncome} />
            </div>
          </CardContent>
        </Card>

        <Card className="surface-shell rounded-[calc(var(--radius)+0.85rem)] border-border/70">
          <CardHeader className="px-4 pb-3 pt-5 text-right">
            <div className="flex items-center gap-3">
              <div className="icon-chip h-9 w-9 shrink-0 rounded-[calc(var(--radius)+0.375rem)] border-amber-500/20 bg-amber-500/[0.1] text-amber-600 dark:text-amber-300">
                <Target className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 text-right">
                <CardTitle className="text-sm font-bold">סף אזהרה</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">אם היתרה תרד מתחת לסף הזה, יוצג סימון ברור בסקירה.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <CashflowNumericField value={cashWarningThreshold} onChange={setCashWarningThreshold} />
          </CardContent>
        </Card>

        <Card className="surface-shell rounded-[calc(var(--radius)+0.85rem)] border-border/70">
          <CardHeader className="px-4 pb-3 pt-5 text-right">
            <div className="flex items-center gap-3">
              <div className="icon-chip h-9 w-9 shrink-0 rounded-[calc(var(--radius)+0.375rem)] border-primary/20 bg-primary/[0.1] text-primary">
                <Import className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 text-right">
                <CardTitle className="text-sm font-bold">ייבוא נתונים</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">אפשר לעבוד עם תבנית Planner Hub או לייבא קובץ קיים ולעבור על האזורים לפני השמירה.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 px-4 pb-4 md:grid-cols-2">
            <Button type="button" variant="outline" className="h-12 rounded-[calc(var(--radius)+0.5rem)]" onClick={() => downloadCashflowTemplateWorkbook()}>
              <Download className="h-4 w-4" />
              הורדת תבנית מוכנה
            </Button>
            <Button type="button" className="h-12 rounded-[calc(var(--radius)+0.5rem)]" onClick={() => setShowImportDialog(true)}>
              <Import className="h-4 w-4" />
              ייבוא מקובץ קיים
            </Button>
          </CardContent>
        </Card>

        {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}

        <Button onClick={handleSave} size="lg" className="h-14 w-full rounded-[calc(var(--radius)+0.5rem)] text-base font-bold">
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

      <CashflowImportDialog
        open={showImportDialog}
        data={data}
        onClose={() => setShowImportDialog(false)}
        onApply={(nextData) => {
          onImport(nextData);
          setShowImportDialog(false);
        }}
      />
    </>
  );
}

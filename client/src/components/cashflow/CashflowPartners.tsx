// ─────────────────────────────────────────────────────────────────────────────
// CashflowPartners — Partners / ownership screen
// Hebrew-first. Shows ownership split, invested amounts, progress to target.
// Business rule: if 1 partner → 100% ownership shown clearly.
//                if 2+ partners → ownership % must sum to 100.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  type CashflowData,
  type CashflowPartner,
  formatCashflowAmount,
  generateId,
} from "@/lib/cashflow";
import { Check, Plus, Users } from "lucide-react";

// Distinct colors for partner chips/bars
const PARTNER_COLORS = [
  { bg: "bg-sky-500", text: "text-sky-600 dark:text-sky-300", soft: "bg-sky-500/[0.12] border-sky-500/25 text-sky-700 dark:text-sky-300" },
  { bg: "bg-violet-500", text: "text-violet-600 dark:text-violet-300", soft: "bg-violet-500/[0.12] border-violet-500/25 text-violet-700 dark:text-violet-300" },
  { bg: "bg-amber-500", text: "text-amber-600 dark:text-amber-300", soft: "bg-amber-500/[0.12] border-amber-500/25 text-amber-700 dark:text-amber-300" },
  { bg: "bg-rose-500", text: "text-rose-600 dark:text-rose-300", soft: "bg-rose-500/[0.12] border-rose-500/25 text-rose-700 dark:text-rose-300" },
  { bg: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-300", soft: "bg-emerald-500/[0.12] border-emerald-500/25 text-emerald-700 dark:text-emerald-300" },
];

function getColor(index: number) {
  return PARTNER_COLORS[index % PARTNER_COLORS.length];
}

// ── Add partner sheet ─────────────────────────────────────────────────────────
interface AddPartnerSheetProps {
  open: boolean;
  currency: CashflowData["settings"]["currency"];
  existingCount: number;
  onClose: () => void;
  onSave: (partner: CashflowPartner) => void;
}

function AddPartnerSheet({ open, currency, existingCount, onClose, onSave }: AddPartnerSheetProps) {
  const [name, setName] = useState("");
  const [ownershipStr, setOwnershipStr] = useState("");
  const [investedStr, setInvestedStr] = useState("");
  const [targetStr, setTargetStr] = useState("");
  const [error, setError] = useState("");

  function handleSave() {
    const ownership = parseFloat(ownershipStr) || 0;
    const invested = parseFloat(investedStr.replace(/,/g, "")) || 0;
    if (!name.trim()) { setError("נא להכניס שם שותף"); return; }
    if (ownership <= 0 || ownership > 100) { setError("אחוז בעלות חייב להיות בין 1-100"); return; }
    onSave({
      id: generateId(),
      name: name.trim(),
      ownershipPercent: ownership,
      investedAmount: invested,
      targetInvestment: targetStr ? parseFloat(targetStr.replace(/,/g, "")) : undefined,
    });
    onClose();
    setName(""); setOwnershipStr(""); setInvestedStr(""); setTargetStr(""); setError("");
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className={cn(
          "max-h-[88dvh] overflow-y-auto rounded-t-[1.25rem] border-t border-border/60 p-0 bg-popover",
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
          <SheetTitle className="text-xl font-black">הוסף שותף</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 px-5 pb-8 pt-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">שם השותף</label>
            <Input
              placeholder="לדוגמה: יוסי כהן"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              className="h-11 rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 text-right focus:border-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">אחוז בעלות (%)</label>
            <div className="relative">
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-base font-bold text-muted-foreground pointer-events-none">%</span>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0"
                min={0}
                max={100}
                value={ownershipStr}
                onChange={(e) => { setOwnershipStr(e.target.value); setError(""); }}
                className="h-12 pe-8 text-left text-xl font-black tabular-nums rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 focus:border-primary/50"
                style={{ direction: "ltr" }}
              />
            </div>
            {existingCount === 0 && <p className="text-xs text-muted-foreground">שותף יחיד = 100% בעלות</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">השקעה בפועל (₪)</label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={investedStr}
              onChange={(e) => setInvestedStr(e.target.value)}
              className="h-11 rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 text-right focus:border-primary/50"
              style={{ direction: "ltr", textAlign: "right" }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">יעד השקעה (₪, אופציונלי)</label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={targetStr}
              onChange={(e) => setTargetStr(e.target.value)}
              className="h-11 rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 text-right focus:border-primary/50"
              style={{ direction: "ltr", textAlign: "right" }}
            />
          </div>
          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          <Button
            onClick={handleSave}
            size="lg"
            className="w-full h-14 rounded-[calc(var(--radius)+0.5rem)] text-base font-bold"
          >
            הוסף שותף
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Partner card ──────────────────────────────────────────────────────────────
interface PartnerCardProps {
  partner: CashflowPartner;
  index: number;
  currency: CashflowData["settings"]["currency"];
  isSolo: boolean;
}

function PartnerCard({ partner, index, currency, isSolo }: PartnerCardProps) {
  const color = getColor(index);
  const progressPercent = partner.targetInvestment
    ? Math.min((partner.investedAmount / partner.targetInvestment) * 100, 100)
    : 100;

  return (
    <Card className={cn("surface-shell rounded-[calc(var(--radius)+0.75rem)] border-border/60 overflow-hidden")}>
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${["#0ea5e9","#8b5cf6","#f59e0b","#f43f5e","#10b981"][index % 5]},transparent)` }} />
      <CardContent className="p-4 text-right">
        <div className="rtl-title-row">
          <div className="flex-1 space-y-1">
            <p className="text-base font-bold">{partner.name}</p>
            {isSolo && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                <Check className="h-3 w-3" />
                בעלות מלאה
              </span>
            )}
          </div>
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-lg font-black", color.soft)}>
            {partner.ownershipPercent}%
          </div>
        </div>

        {/* Ownership bar */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>אחוז בעלות</span>
            <span>{partner.ownershipPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", color.bg)}
              style={{ width: `${partner.ownershipPercent}%` }}
            />
          </div>
        </div>

        {/* Investment info */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="surface-subtle rounded-[calc(var(--radius)+0.25rem)] p-2.5 text-right">
            <p className="text-[10px] font-semibold text-muted-foreground">השקעה בפועל</p>
            <p className="mt-1 text-sm font-black tabular-nums" style={{ direction: "ltr" }}>
              {formatCashflowAmount(partner.investedAmount, currency)}
            </p>
          </div>
          {partner.targetInvestment ? (
            <div className="surface-subtle rounded-[calc(var(--radius)+0.25rem)] p-2.5 text-right">
              <p className="text-[10px] font-semibold text-muted-foreground">יעד השקעה</p>
              <p className="mt-1 text-sm font-black tabular-nums" style={{ direction: "ltr" }}>
                {formatCashflowAmount(partner.targetInvestment, currency)}
              </p>
            </div>
          ) : (
            <div className="surface-subtle rounded-[calc(var(--radius)+0.25rem)] p-2.5 text-right opacity-50">
              <p className="text-[10px] font-semibold text-muted-foreground">יעד השקעה</p>
              <p className="mt-1 text-xs text-muted-foreground">לא הוגדר</p>
            </div>
          )}
        </div>

        {/* Investment progress bar */}
        {partner.targetInvestment && (
          <div className="mt-2.5 space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>התקדמות</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", color.bg)}
                style={{ width: `${progressPercent}%`, opacity: 0.7 }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CashflowPartnersProps {
  data: CashflowData;
  onSavePartner: (partner: CashflowPartner) => void;
}

export function CashflowPartners({ data, onSavePartner }: CashflowPartnersProps) {
  const [showAdd, setShowAdd] = useState(false);

  const partners = data.partners;
  const isSolo = partners.length === 1;
  const totalOwnership = partners.reduce((s, p) => s + p.ownershipPercent, 0);
  const totalInvested = partners.reduce((s, p) => s + p.investedAmount, 0);
  const totalTarget = partners.reduce((s, p) => s + (p.targetInvestment ?? 0), 0);
  const ownershipValid = partners.length === 0 || Math.abs(totalOwnership - 100) < 0.1;

  return (
    <div className="space-y-4 pb-4">

      {/* ── Summary bar ──────────────────────────────────────────────────── */}
      {partners.length > 0 && (
        <Card className="surface-shell rounded-[calc(var(--radius)+0.85rem)] border-border/70 overflow-hidden">
          <CardHeader className="pb-3 pt-4 px-4 text-right">
            <CardTitle className="text-sm font-bold">סיכום שותפות</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {/* Ownership split visual bar */}
            {partners.length > 1 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">חלוקת בעלות</p>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted gap-0.5">
                  {partners.map((p, i) => (
                    <div
                      key={p.id}
                      style={{ width: `${p.ownershipPercent}%` }}
                      className={cn("h-full transition-all duration-500", getColor(i).bg)}
                      title={`${p.name}: ${p.ownershipPercent}%`}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {partners.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-1.5 text-xs">
                      <span className={cn("inline-block h-2 w-2 rounded-full", getColor(i).bg)} />
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-muted-foreground">{p.ownershipPercent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="surface-subtle rounded-[calc(var(--radius)+0.375rem)] p-3 text-right">
                <p className="text-[10px] font-semibold text-muted-foreground">סה"כ הושקע</p>
                <p className="mt-1 text-base font-black tabular-nums" style={{ direction: "ltr" }}>
                  {formatCashflowAmount(totalInvested, data.settings.currency)}
                </p>
              </div>
              {totalTarget > 0 && (
                <div className="surface-subtle rounded-[calc(var(--radius)+0.375rem)] p-3 text-right">
                  <p className="text-[10px] font-semibold text-muted-foreground">סה"כ יעד</p>
                  <p className="mt-1 text-base font-black tabular-nums" style={{ direction: "ltr" }}>
                    {formatCashflowAmount(totalTarget, data.settings.currency)}
                  </p>
                </div>
              )}
            </div>

            {/* Warning if ownership doesn't sum to 100 */}
            {!ownershipValid && partners.length > 1 && (
              <div className="flex items-center gap-2 rounded-[calc(var(--radius)+0.25rem)] border border-rose-500/20 bg-rose-500/[0.07] px-3 py-2">
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                  סה"כ אחוזי בעלות הם {Math.round(totalOwnership)}% — חייב להיות 100%
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Add partner button ────────────────────────────────────────────── */}
      <Button
        onClick={() => setShowAdd(true)}
        variant="outline"
        className="w-full h-11 rounded-[calc(var(--radius)+0.5rem)] border-dashed border-primary/30 bg-primary/[0.04] text-primary hover:border-primary/50 hover:bg-primary/[0.08] font-semibold gap-2"
      >
        <Plus className="h-4 w-4" />
        הוסף שותף
      </Button>

      {/* ── Partner cards ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {partners.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 py-14 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
              <Users className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">אין שותפים עדיין</p>
              <p className="text-sm text-muted-foreground">הוסף שותפים כדי לעקוב אחרי חלוקת הבעלות וההשקעות</p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <PartnerCard
                  partner={partner}
                  index={index}
                  currency={data.settings.currency}
                  isSolo={isSolo}
                />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <AddPartnerSheet
        open={showAdd}
        currency={data.settings.currency}
        existingCount={partners.length}
        onClose={() => setShowAdd(false)}
        onSave={onSavePartner}
      />
    </div>
  );
}

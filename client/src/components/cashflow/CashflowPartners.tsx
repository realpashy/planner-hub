import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Pencil, Plus, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  type CashflowData,
  type CashflowPartner,
  formatCashflowAmount,
  formatOwnershipPercent,
  generateId,
  getPartnerSummary,
  rebalancePartnerOwnership,
  validatePartnerOwnership,
} from "@/lib/cashflow";
import { CashflowNumericField } from "@/components/cashflow/CashflowNumericField";

const PARTNER_COLORS = [
  { bg: "bg-sky-500", soft: "bg-sky-500/[0.12] border-sky-500/25 text-sky-700 dark:text-sky-300" },
  { bg: "bg-violet-500", soft: "bg-violet-500/[0.12] border-violet-500/25 text-violet-700 dark:text-violet-300" },
  { bg: "bg-amber-500", soft: "bg-amber-500/[0.12] border-amber-500/25 text-amber-700 dark:text-amber-300" },
  { bg: "bg-rose-500", soft: "bg-rose-500/[0.12] border-rose-500/25 text-rose-700 dark:text-rose-300" },
  { bg: "bg-emerald-500", soft: "bg-emerald-500/[0.12] border-emerald-500/25 text-emerald-700 dark:text-emerald-300" },
];

function getPartnerColor(index: number) {
  return PARTNER_COLORS[index % PARTNER_COLORS.length];
}

function PartnerSheet({
  open,
  existingPartners,
  initialPartner,
  onClose,
  onSaveAll,
}: {
  open: boolean;
  existingPartners: CashflowPartner[];
  initialPartner?: CashflowPartner | null;
  onClose: () => void;
  onSaveAll: (partners: CashflowPartner[]) => void;
}) {
  const isEditing = Boolean(initialPartner);
  const [name, setName] = useState("");
  const [ownershipPercent, setOwnershipPercent] = useState("");
  const [investedAmount, setInvestedAmount] = useState("");
  const [targetCommitment, setTargetCommitment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const autoOwnership = !initialPartner && existingPartners.length === 0 ? "100" : initialPartner ? String(initialPartner.ownershipPercent) : "";
    setName(initialPartner?.name ?? "");
    setOwnershipPercent(autoOwnership);
    setInvestedAmount(initialPartner ? String(initialPartner.investedAmount) : "");
    setTargetCommitment(initialPartner?.targetCommitment ? String(initialPartner.targetCommitment) : "");
    setError("");
  }, [existingPartners.length, initialPartner, open]);

  const draftPartner = useMemo<CashflowPartner>(() => {
    const timestamp = new Date().toISOString();
    return {
      id: initialPartner?.id ?? generateId(),
      name: name.trim() || "שותף חדש",
      ownershipPercent: Number.parseFloat(ownershipPercent || "0") || 0,
      investedAmount: Number.parseFloat(investedAmount || "0") || 0,
      targetCommitment: targetCommitment ? Number.parseFloat(targetCommitment || "0") || 0 : undefined,
      createdAt: initialPartner?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
  }, [initialPartner?.createdAt, initialPartner?.id, investedAmount, name, ownershipPercent, targetCommitment]);

  const previewPartners = useMemo(() => {
    if (!name.trim()) return [];
    return rebalancePartnerOwnership(existingPartners, draftPartner);
  }, [draftPartner, existingPartners, name]);

  const liveTotal = useMemo(() => previewPartners.reduce((sum, partner) => sum + partner.ownershipPercent, 0), [previewPartners]);

  function handleSave() {
    if (!name.trim()) {
      setError("נא להכניס שם שותף");
      return;
    }

    if (draftPartner.ownershipPercent <= 0 || draftPartner.ownershipPercent > 100) {
      setError("אחוז הבעלות חייב להיות בין 1 ל-100");
      return;
    }

    const validation = validatePartnerOwnership(previewPartners);
    if (!validation.valid) {
      setError(`סך כל אחוזי הבעלות חייב להיות 100%. כרגע: ${Math.round(validation.total)}%`);
      return;
    }

    onSaveAll(previewPartners);
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent
        side="bottom"
        dir="rtl"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className={cn(
          "max-h-[88dvh] overflow-y-auto rounded-t-[1.25rem] border-t border-border/60 p-0 bg-popover md:mx-auto md:mb-4 md:max-w-[60vw] md:rounded-[calc(var(--radius)+1rem)] md:border",
          "bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.03),transparent_40%)]",
          "dark:bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.07),transparent_40%),linear-gradient(180deg,rgba(30,30,30,0.99),rgba(22,22,22,0.99))]",
          "[&>button]:left-4 [&>button]:right-auto [&>button]:top-4",
        )}
      >
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-border/60" />
        </div>
        <SheetHeader className="px-5 pb-2 text-right">
          <SheetTitle>{isEditing ? "עריכת שותף" : "הוסף שותף"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 px-5 pb-8 pt-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">שם השותף</label>
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              placeholder="לדוגמה: יוסי כהן"
              className="h-12 rounded-[calc(var(--radius)+0.25rem)] border-border/60 bg-muted/40 text-right focus:border-primary/50"
            />
          </div>

          <CashflowNumericField
            label="אחוז בעלות"
            suffix="%"
            value={ownershipPercent}
            onChange={(value) => {
              setOwnershipPercent(value);
              setError("");
            }}
          />
          <p className="text-xs text-muted-foreground">
            {existingPartners.length === 0 ? "השותף הראשון מתחיל ב-100%, אבל אפשר לערוך לפני שמירה." : `סה״כ בעלות מחושב: ${Math.round(liveTotal)}%`}
          </p>

          <CashflowNumericField label="השקעה בפועל" value={investedAmount} onChange={setInvestedAmount} />
          <CashflowNumericField label="יעד התחייבות (אופציונלי)" value={targetCommitment} onChange={setTargetCommitment} />

          {previewPartners.length > 0 ? (
            <div className="space-y-2 rounded-[calc(var(--radius)+0.375rem)] border border-border/50 bg-muted/30 p-3 text-right">
              <p className="text-xs font-semibold text-muted-foreground">חלוקה מחושבת לפני שמירה</p>
              <div className="space-y-1.5">
                {previewPartners.map((partnerPreview) => (
                  <div key={partnerPreview.id} className="flex items-center gap-2">
                    <span className="cashflow-number text-xs font-bold text-primary">{formatOwnershipPercent(partnerPreview.ownershipPercent)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{partnerPreview.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}

          <Button size="lg" className="h-14 w-full rounded-[calc(var(--radius)+0.5rem)] text-base font-bold" onClick={handleSave}>
            {isEditing ? "שמור שינויים" : "הוסף שותף"}
          </Button>

          <p className="text-[11px] text-muted-foreground">
            כל הנתונים נשמרים בפשטות לצורך תמונת שותפים והשקעות בלבד, בלי להפוך את המודול למערכת הנהלת חשבונות.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function PartnerCard({
  partner,
  index,
  currency,
  isSolo,
  onEdit,
}: {
  partner: CashflowPartner;
  index: number;
  currency: CashflowData["settings"]["currency"];
  isSolo: boolean;
  onEdit: (partner: CashflowPartner) => void;
}) {
  const color = getPartnerColor(index);
  const progressPercent = partner.targetCommitment ? Math.min((partner.investedAmount / partner.targetCommitment) * 100, 100) : 100;

  return (
    <Card className="surface-shell overflow-hidden rounded-[calc(var(--radius)+0.75rem)] border-border/60">
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, currentColor)` }} />
      <CardContent className="space-y-3 p-4 text-right">
        <div className="flex items-center gap-3">
          <div className={cn("inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-sm font-black", color.soft)}>
            {formatOwnershipPercent(partner.ownershipPercent)}
          </div>
          <div className="min-w-0 flex-1 space-y-1 text-right">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold">{partner.name}</span>
              {isSolo ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                  <Check className="h-3 w-3" />
                  בעלות מלאה
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>אחוז בעלות</span>
            <span>{formatOwnershipPercent(partner.ownershipPercent)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full transition-all duration-500", color.bg)} style={{ width: `${partner.ownershipPercent}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="surface-subtle rounded-[calc(var(--radius)+0.25rem)] p-2.5 text-right">
            <p className="text-[10px] font-semibold text-muted-foreground">השקעה בפועל</p>
            <p className="cashflow-number mt-1 text-sm font-black">{formatCashflowAmount(partner.investedAmount, currency)}</p>
          </div>
          <div className="surface-subtle rounded-[calc(var(--radius)+0.25rem)] p-2.5 text-right">
            <p className="text-[10px] font-semibold text-muted-foreground">יעד התחייבות</p>
            <p className="cashflow-number mt-1 text-sm font-black">{partner.targetCommitment ? formatCashflowAmount(partner.targetCommitment, currency) : "—"}</p>
          </div>
        </div>

        {partner.targetCommitment ? (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>התקדמות</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full transition-all duration-500", color.bg)} style={{ width: `${progressPercent}%`, opacity: 0.7 }} />
            </div>
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onEdit(partner)}
            className="inline-flex items-center gap-1.5 rounded-[calc(var(--radius)+0.25rem)] border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70"
          >
            <Pencil className="h-3.5 w-3.5" />
            ערוך
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

interface CashflowPartnersProps {
  data: CashflowData;
  onSavePartners: (partners: CashflowPartner[]) => void;
}

export function CashflowPartners({ data, onSavePartners }: CashflowPartnersProps) {
  const [showPartnerSheet, setShowPartnerSheet] = useState(false);
  const [editingPartner, setEditingPartner] = useState<CashflowPartner | null>(null);

  const isSolo = data.partners.length === 1;
  const summary = getPartnerSummary(data);
  const ownershipValidation = validatePartnerOwnership(data.partners);
  const totalTargetCommitment = data.partners.reduce((sum, partner) => sum + (partner.targetCommitment ?? 0), 0);

  return (
    <div className="space-y-4 pb-4">
      {data.partners.length > 0 ? (
        <Card className="surface-shell overflow-hidden rounded-[calc(var(--radius)+0.85rem)] border-border/70">
          <CardHeader className="pb-3 pt-6 text-right">
            <CardTitle className="text-sm font-bold">סיכום שותפים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-4">
            {data.partners.length > 1 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">חלוקת בעלות</p>
                <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-muted">
                  {data.partners.map((partner, index) => (
                    <div
                      key={partner.id}
                      title={`${partner.name}: ${formatOwnershipPercent(partner.ownershipPercent)}`}
                      className={cn("h-full transition-all duration-500", getPartnerColor(index).bg)}
                      style={{ width: `${partner.ownershipPercent}%` }}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {data.partners.map((partner, index) => (
                    <div key={partner.id} className="flex items-center gap-1.5 text-xs">
                      <span className={cn("inline-block h-2 w-2 rounded-full", getPartnerColor(index).bg)} />
                      <span className="font-semibold">{partner.name}</span>
                      <span className="text-muted-foreground">{formatOwnershipPercent(partner.ownershipPercent)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2.5">
              <div className="surface-subtle rounded-[calc(var(--radius)+0.375rem)] p-3 text-right">
                <p className="text-[10px] font-semibold text-muted-foreground">סה"כ הושקע</p>
                <p className="cashflow-number mt-1 text-base font-black">{formatCashflowAmount(summary.totalInvested, data.settings.currency)}</p>
              </div>
              <div className="surface-subtle rounded-[calc(var(--radius)+0.375rem)] p-3 text-right">
                <p className="text-[10px] font-semibold text-muted-foreground">סה"כ יעד</p>
                <p className="cashflow-number mt-1 text-base font-black">{formatCashflowAmount(totalTargetCommitment, data.settings.currency)}</p>
              </div>
            </div>

            {!ownershipValidation.valid && data.partners.length > 1 ? (
              <div className="rounded-[calc(var(--radius)+0.25rem)] border border-rose-500/20 bg-rose-500/[0.07] px-3 py-2 text-right">
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                  סך כל אחוזי הבעלות הוא {Math.round(ownershipValidation.total)}% — צריך להגיע ל-100%.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Button
        variant="outline"
        className="h-11 w-full rounded-[calc(var(--radius)+0.5rem)] border-dashed border-primary/30 bg-primary/[0.04] font-semibold text-primary hover:border-primary/50 hover:bg-primary/[0.08]"
        onClick={() => {
          setEditingPartner(null);
          setShowPartnerSheet(true);
        }}
      >
        <Plus className="h-4 w-4" />
        הוסף שותף
      </Button>

      <AnimatePresence>
        {data.partners.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
              <Users className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">אין שותפים עדיין</p>
              <p className="text-sm text-muted-foreground">הוסף שותפים כדי לראות חלוקת בעלות והשקעות</p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {data.partners.map((partner, index) => (
              <motion.div key={partner.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <PartnerCard
                  partner={partner}
                  index={index}
                  currency={data.settings.currency}
                  isSolo={isSolo}
                  onEdit={(selectedPartner) => {
                    setEditingPartner(selectedPartner);
                    setShowPartnerSheet(true);
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <PartnerSheet
        open={showPartnerSheet}
        existingPartners={data.partners}
        initialPartner={editingPartner}
        onClose={() => {
          setShowPartnerSheet(false);
          setEditingPartner(null);
        }}
        onSaveAll={onSavePartners}
      />
    </div>
  );
}

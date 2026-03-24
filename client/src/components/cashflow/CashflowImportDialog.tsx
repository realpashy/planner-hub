import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Download, FileSpreadsheet, Layers3, UploadCloud } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  applyCashflowImport,
  buildCashflowImportPreview,
  detectCashflowBlocks,
  downloadCashflowTemplateWorkbook,
  getImportReplaceWarnings,
  inferCashflowFieldMapping,
  parseCashflowImportFile,
  type CashflowImportApplyActions,
  type CashflowImportBlock,
  type CashflowImportBlockDraft,
  type CashflowImportBlockType,
  type CashflowImportWorkbook,
} from "@/lib/cashflow-import";
import { type CashflowData, validatePartnerOwnership } from "@/lib/cashflow";

const IMPORT_STEPS = ["העלאת קובץ", "בחירת גיליון", "זיהוי אזורים", "התאמת שדות", "בדיקת נתונים", "סיכום וייבוא"];

const BLOCK_TYPE_OPTIONS: Array<{ value: CashflowImportBlockType; label: string }> = [
  { value: "transactions", label: "טבלת תנועות" },
  { value: "upcoming", label: "טבלת תשלומים עתידיים" },
  { value: "partners", label: "טבלת שותפים" },
  { value: "settings", label: "יתרות / הגדרות" },
  { value: "fixed_expenses", label: "הוצאות קבועות" },
  { value: "unknown", label: "לא מזוהה" },
];

const FIELD_OPTIONS: Record<CashflowImportBlockType, Array<{ value: string; label: string }>> = {
  transactions: [
    { value: "", label: "התעלם" },
    { value: "type", label: "סוג" },
    { value: "amount", label: "סכום" },
    { value: "date", label: "תאריך" },
    { value: "category", label: "קטגוריה" },
    { value: "note", label: "הערה" },
    { value: "paidFor", label: "למי שולם" },
  ],
  upcoming: [
    { value: "", label: "התעלם" },
    { value: "name", label: "שם" },
    { value: "amount", label: "סכום" },
    { value: "dueDate", label: "תאריך יעד" },
    { value: "note", label: "הערה" },
    { value: "status", label: "סטטוס" },
    { value: "recurringMonthly", label: "חוזר חודשי" },
  ],
  partners: [
    { value: "", label: "התעלם" },
    { value: "name", label: "שם" },
    { value: "ownershipPercent", label: "אחוז בעלות" },
    { value: "investedAmount", label: "השקעה בפועל" },
    { value: "targetCommitment", label: "יעד התחייבות" },
  ],
  settings: [
    { value: "", label: "התעלם" },
    { value: "bankBalance", label: "יתרת בנק" },
    { value: "cashOnHand", label: "מזומן" },
    { value: "overallAvailableCash", label: "יתרה כוללת" },
    { value: "overallBankPortion", label: "מאלה, בחשבון הבנק" },
    { value: "monthlyBaselineExpenses", label: "הוצאות בסיס חודשיות" },
    { value: "monthlyBaselineIncome", label: "הכנסות בסיס חודשיות" },
    { value: "cashWarningThreshold", label: "סף אזהרה" },
  ],
  fixed_expenses: [
    { value: "", label: "התעלם" },
    { value: "category", label: "קטגוריה" },
    { value: "amount", label: "סכום" },
    { value: "note", label: "הערה" },
  ],
  unknown: [{ value: "", label: "התעלם" }],
};

const SECTION_ACTION_OPTIONS: Array<{ value: CashflowImportApplyActions[keyof CashflowImportApplyActions]; label: string }> = [
  { value: "append", label: "הוסף" },
  { value: "replace", label: "החלף" },
  { value: "skip", label: "דלג" },
];

type DuplicateMode = "skip" | "import";

interface CashflowImportDialogProps {
  open: boolean;
  data: CashflowData;
  onClose: () => void;
  onApply: (nextData: CashflowData) => void;
}

function showImportToast(title: string, description: string, tone: "success" | "error" = "success") {
  toast({
    duration: 3000,
    description: (
      <div className="relative overflow-hidden rounded-[calc(var(--radius)+0.5rem)] pr-0 text-right" dir="rtl">
        <div className="px-1 py-0.5">
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: 3, ease: "linear" }}
          className={cn(
            "absolute inset-x-0 bottom-0 h-1 origin-right rounded-full",
            tone === "error" ? "bg-rose-500/80" : "bg-primary/80",
          )}
        />
      </div>
    ),
  });
}

function PreviewTable({ block }: { block: CashflowImportBlock }) {
  return (
    <div className="overflow-x-auto rounded-[calc(var(--radius)+0.25rem)] border border-border/50">
      <table className="w-full min-w-[24rem] text-right text-xs">
        <tbody>
          {block.preview.map((row, rowIndex) => (
            <tr key={`${block.id}-${rowIndex}`} className="border-b border-border/30 last:border-b-0">
              <td className="w-10 bg-muted/40 px-2 py-2 text-center text-[10px] font-semibold text-muted-foreground">
                {block.previewRowNumbers[rowIndex]}
              </td>
              {row.map((cell, colIndex) => (
                <td key={`${rowIndex}-${colIndex}`} className="px-2 py-2">
                  {cell || "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CashflowImportDialog({ open, data, onClose, onApply }: CashflowImportDialogProps) {
  const [workbook, setWorkbook] = useState<CashflowImportWorkbook | null>(null);
  const [selectedSheetId, setSelectedSheetId] = useState<string>("");
  const [blocks, setBlocks] = useState<CashflowImportBlock[]>([]);
  const [drafts, setDrafts] = useState<Record<string, CashflowImportBlockDraft>>({});
  const [actions, setActions] = useState<CashflowImportApplyActions>({
    transactions: "append",
    upcomingPayments: "append",
    partners: "append",
    settings: "append",
    fixedExpenses: "skip",
  });
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>("skip");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    setWorkbook(null);
    setSelectedSheetId("");
    setBlocks([]);
    setDrafts({});
    setActions({
      transactions: "append",
      upcomingPayments: "append",
      partners: "append",
      settings: "append",
      fixedExpenses: "skip",
    });
    setDuplicateMode("skip");
    setLoading(false);
    setError("");
    setShowReplaceConfirm(false);
  }, [open]);

  const preview = useMemo(() => {
    if (!workbook || blocks.length === 0) return null;
    return buildCashflowImportPreview(workbook, blocks, drafts, data, {
      allowDuplicates: duplicateMode === "import",
    });
  }, [blocks, data, drafts, duplicateMode, workbook]);

  const replaceWarnings = useMemo(() => getImportReplaceWarnings(data, actions), [actions, data]);
  const partnerValidation = useMemo(
    () => (preview?.partners.length ? validatePartnerOwnership(preview.partners) : { valid: true, total: 0 }),
    [preview?.partners],
  );
  const visibleBlocks = useMemo(
    () => blocks.filter((block) => !selectedSheetId || block.sheetId === selectedSheetId),
    [blocks, selectedSheetId],
  );

  async function handleFile(file: File | null) {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const parsed = await parseCashflowImportFile(file);
      setWorkbook(parsed);
      const bestSheet = parsed.sheets[0];
      setSelectedSheetId(bestSheet?.id ?? "");
      const nextBlocks = parsed.sheets.flatMap((sheet) => detectCashflowBlocks(sheet));
      setBlocks(nextBlocks);
      setDrafts(
        Object.fromEntries(
          nextBlocks.map((block) => [
            block.id,
            {
              id: block.id,
              approved: parsed.templateMatched ? block.suggestedType !== "unknown" : false,
              blockType: block.suggestedType,
              headerRowOffset: block.headerRowOffset,
              mapping: inferCashflowFieldMapping(block.columns, block.suggestedType),
              transactionMode: "mixed",
            },
          ]),
        ),
      );
      showImportToast(
        "הקובץ נטען בהצלחה",
        parsed.templateMatched ? "זוהתה תבנית Planner Hub והמערכת הכינה מיפוי מהיר לבדיקה." : "הקובץ נטען. עכשיו אפשר לעבור על הגיליונות, האזורים והמיפוי לפני שמירה.",
      );
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "לא הצלחנו לקרוא את הקובץ";
      setError(message);
      showImportToast("הייבוא לא הצליח", message, "error");
    } finally {
      setLoading(false);
    }
  }

  function handleSheetChange(sheetId: string) {
    setSelectedSheetId(sheetId);
  }

  function handleApplyImport() {
    if (!preview) return;
    if (preview.partners.length > 1 && !partnerValidation.valid) {
      setError(`סך הבעלות המיובא הוא ${partnerValidation.total}% — צריך להגיע ל-100% לפני שמירת שותפים.`);
      return;
    }

    if (replaceWarnings.length > 0) {
      setShowReplaceConfirm(true);
      return;
    }

    onApply(applyCashflowImport(data, preview, actions));
    showImportToast("הייבוא נשמר", "הנתונים החדשים נכנסו למודול התזרים ונשמרו בסנכרון.");
    onClose();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent dir="rtl" className="max-h-[90dvh] max-w-6xl overflow-y-auto premium-scrollbar p-0 text-right">
          <DialogHeader className="border-b border-border/50 px-6 pb-4 pt-6 text-right">
            <DialogTitle className="text-right">ייבוא נתונים</DialogTitle>
            <DialogDescription className="text-right">
              ייבוא מונחה לקבצי Excel ו-CSV. תמיד בודקים, ממפים ומאשרים לפני שמירה.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 p-6">
            <div className="grid gap-2 md:grid-cols-6">
              {IMPORT_STEPS.map((step, index) => (
                <div key={step} className="surface-subtle rounded-[calc(var(--radius)+0.375rem)] px-3 py-2 text-center">
                  <div className="text-[10px] font-semibold text-muted-foreground">שלב {index + 1}</div>
                  <div className="mt-1 text-xs font-bold">{step}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <label className="surface-shell flex cursor-pointer items-center gap-3 rounded-[calc(var(--radius)+0.625rem)] p-4">
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-sm font-bold">ייבוא מקובץ קיים</p>
                  <p className="text-xs text-muted-foreground">תומך ב-.xlsx, .xls, .csv</p>
                </div>
                <div className="icon-chip h-11 w-11 rounded-[calc(var(--radius)+0.375rem)]">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(event) => void handleFile(event.target.files?.[0] ?? null)} />
              </label>

              <Button type="button" variant="outline" className="h-full min-h-16 rounded-[calc(var(--radius)+0.625rem)] px-5" onClick={() => downloadCashflowTemplateWorkbook()}>
                <Download className="h-4 w-4" />
                הורדת תבנית מוכנה
              </Button>

              {workbook ? (
                <div className="surface-subtle flex min-h-16 items-center gap-3 rounded-[calc(var(--radius)+0.625rem)] px-4">
                  <div className="min-w-0 flex-1 text-right">
                    <p className="truncate text-sm font-bold">{workbook.fileName}</p>
                    <p className="text-xs text-muted-foreground">{workbook.templateMatched ? "זוהתה תבנית Planner Hub" : "קובץ חיצוני לייבוא מונחה"}</p>
                  </div>
                  <FileSpreadsheet className="h-5 w-5 shrink-0 text-primary" />
                </div>
              ) : null}
            </div>

            {loading ? <p className="text-sm text-muted-foreground">מעבד קובץ...</p> : null}
            {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}

            {workbook ? (
              <div className="space-y-4">
                <div className="surface-shell rounded-[calc(var(--radius)+0.75rem)] p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="min-w-0 flex-1 text-right">
                      <p className="text-sm font-bold">בחירת גיליון</p>
                      <p className="text-xs text-muted-foreground">אפשר להתחיל מהגיליון שנראה הכי שימושי</p>
                    </div>
                    <Layers3 className="h-5 w-5 shrink-0 text-primary" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {workbook.sheets.map((sheet) => (
                      <button
                        key={sheet.id}
                        type="button"
                        onClick={() => handleSheetChange(sheet.id)}
                        className={cn(
                          "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
                          selectedSheetId === sheet.id
                            ? "border-primary/40 bg-primary/[0.12] text-primary"
                            : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60",
                        )}
                      >
                        {sheet.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {visibleBlocks.length === 0 ? (
                    <Card className="surface-shell rounded-[calc(var(--radius)+0.75rem)]">
                      <CardContent className="p-5 text-right text-sm text-muted-foreground">
                        לא זוהו אזורים מובנים בגיליון הזה. נסה גיליון אחר או קובץ מסודר יותר.
                      </CardContent>
                    </Card>
                  ) : null}

                  {visibleBlocks.map((block) => {
                    const draft = drafts[block.id];
                    const options = FIELD_OPTIONS[draft?.blockType ?? "unknown"];
                    return (
                      <Card key={block.id} className="surface-shell rounded-[calc(var(--radius)+0.75rem)]">
                        <CardContent className="space-y-4 p-5">
                          <div className="flex items-center gap-3">
                            <div className="min-w-0 flex-1 text-right">
                              <div className="flex items-center justify-start gap-2 text-right">
                                <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                                  {block.confidence}
                                </span>
                                <p className="text-sm font-bold">
                                  {BLOCK_TYPE_OPTIONS.find((option) => option.value === block.suggestedType)?.label ?? "אזור לא מזוהה"}
                                </p>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                שורות {block.startRow + 1}-{block.endRow + 1}, עמודות {block.startCol + 1}-{block.endCol + 1}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setDrafts((current) => ({
                                  ...current,
                                  [block.id]: { ...current[block.id], approved: !current[block.id]?.approved },
                                }))
                              }
                              className={cn(
                                "rounded-[calc(var(--radius)+0.25rem)] border px-3 py-2 text-xs font-semibold",
                                draft?.approved
                                  ? "border-primary/35 bg-primary/[0.12] text-primary"
                                  : "border-border/60 bg-background/70 text-muted-foreground",
                              )}
                            >
                              {draft?.approved ? "אושר" : "בחר לייבוא"}
                            </button>
                          </div>

                          <PreviewTable block={block} />

                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-1.5 text-right">
                              <label className="text-xs font-semibold text-muted-foreground">סוג אזור</label>
                              <select
                                value={draft?.blockType ?? "unknown"}
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [block.id]: {
                                      ...current[block.id],
                                      blockType: event.target.value as CashflowImportBlockType,
                                      mapping: inferCashflowFieldMapping(block.columns, event.target.value as CashflowImportBlockType),
                                    },
                                  }))
                                }
                                className="meal-input modern-select w-full"
                              >
                                {BLOCK_TYPE_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1.5 text-right">
                              <label className="text-xs font-semibold text-muted-foreground">שורת כותרת</label>
                              <select
                                value={String(draft?.headerRowOffset ?? 0)}
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [block.id]: {
                                      ...current[block.id],
                                      headerRowOffset: Number(event.target.value),
                                      mapping: inferCashflowFieldMapping(
                                        block.preview[Number(event.target.value)]?.map((value, index) => value || `עמודה ${index + 1}`) ?? block.columns,
                                        current[block.id]?.blockType ?? "unknown",
                                      ),
                                    },
                                  }))
                                }
                                className="meal-input modern-select w-full"
                              >
                                {block.previewRowNumbers.map((rowNumber, index) => (
                                  <option key={`${block.id}-header-${rowNumber}`} value={index}>
                                    שורה {rowNumber}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {draft?.blockType === "transactions" ? (
                              <div className="space-y-1.5 text-right">
                                <label className="text-xs font-semibold text-muted-foreground">סוג תנועה בקבוצה</label>
                                <select
                                  value={draft.transactionMode}
                                  onChange={(event) =>
                                    setDrafts((current) => ({
                                      ...current,
                                      [block.id]: {
                                        ...current[block.id],
                                        transactionMode: event.target.value as "mixed" | "income" | "expense",
                                      },
                                    }))
                                  }
                                  className="meal-input modern-select w-full"
                                >
                                  <option value="mixed">מעורב / לפי הקובץ</option>
                                  <option value="income">כל השורות הן הכנסה</option>
                                  <option value="expense">כל השורות הן הוצאה</option>
                                </select>
                              </div>
                            ) : (
                              <div />
                            )}
                          </div>

                          {draft?.blockType !== "unknown" ? (
                            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                              {block.columns.map((column) => (
                                <div key={`${block.id}-${column}`} className="space-y-1.5 text-right">
                                  <label className="truncate text-xs font-semibold text-muted-foreground">{column}</label>
                                  <select
                                    value={draft.mapping[column] ?? ""}
                                    onChange={(event) =>
                                      setDrafts((current) => ({
                                        ...current,
                                        [block.id]: {
                                          ...current[block.id],
                                          mapping: {
                                            ...current[block.id].mapping,
                                            [column]: event.target.value,
                                          },
                                        },
                                      }))
                                    }
                                    className="meal-input modern-select w-full"
                                  >
                                    {options.map((option) => (
                                      <option key={`${block.id}-${column}-${option.value || "ignore"}`} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {preview ? (
                  <Card className="surface-shell rounded-[calc(var(--radius)+0.75rem)]">
                    <CardContent className="space-y-4 p-5 text-right">
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1 text-right">
                          <p className="text-sm font-bold">בדיקת נתונים</p>
                          <p className="text-xs text-muted-foreground">לפני שמירה, בודקים תוקף, כפילויות והיקף ייבוא</p>
                        </div>
                        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                      </div>

                      <div className="grid gap-2 md:grid-cols-4">
                        {[
                          { label: "שורות תקינות", value: preview.validRows },
                          { label: "שורות שגויות", value: preview.invalidRows.length },
                          { label: "שורות שדולגו", value: preview.skippedRows.length },
                          { label: "כפילויות", value: preview.duplicates.length },
                        ].map((item) => (
                          <div key={item.label} className="surface-subtle rounded-[calc(var(--radius)+0.375rem)] p-3">
                            <p className="text-[11px] font-semibold text-muted-foreground">{item.label}</p>
                            <p className="mt-1 text-lg font-black">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      {preview.duplicates.length > 0 ? (
                        <div className="space-y-2 rounded-[calc(var(--radius)+0.375rem)] border border-amber-500/25 bg-amber-500/[0.08] p-4">
                          <p className="text-sm font-bold text-amber-700 dark:text-amber-300">נמצאו תנועות שעשויות להיות כפולות</p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setDuplicateMode("skip")}
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                                duplicateMode === "skip" ? "border-primary/40 bg-primary/[0.12] text-primary" : "border-border/50 bg-background/70 text-muted-foreground",
                              )}
                            >
                              דלג על כפילויות
                            </button>
                            <button
                              type="button"
                              onClick={() => setDuplicateMode("import")}
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                                duplicateMode === "import" ? "border-primary/40 bg-primary/[0.12] text-primary" : "border-border/50 bg-background/70 text-muted-foreground",
                              )}
                            >
                              יבא בכל זאת
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {preview.invalidRows.length > 0 ? (
                        <div className="space-y-1 text-xs text-destructive">
                          {preview.invalidRows.slice(0, 6).map((issue) => (
                            <p key={`invalid-${issue.rowNumber}`}>
                              שורה {issue.rowNumber}: {issue.reason}
                            </p>
                          ))}
                        </div>
                      ) : null}

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                        {[
                          { key: "transactions", label: `עסקאות (${preview.transactions.length})` },
                          { key: "upcomingPayments", label: `תשלומים עתידיים (${preview.upcomingPayments.length})` },
                          { key: "partners", label: `שותפים (${preview.partners.length})` },
                          { key: "settings", label: Object.keys(preview.settingsPatch).length > 0 ? "הגדרות" : "הגדרות (ללא שינוי)" },
                          { key: "fixedExpenses", label: preview.fixedExpensesTotal ? `הוצאות בסיס (${preview.fixedExpensesTotal})` : "הוצאות בסיס" },
                        ].map((item) => (
                          <div key={item.key} className="space-y-1.5 text-right">
                            <label className="text-xs font-semibold text-muted-foreground">{item.label}</label>
                            <select
                              value={actions[item.key as keyof CashflowImportApplyActions]}
                              onChange={(event) =>
                                setActions((current) => ({
                                  ...current,
                                  [item.key]: event.target.value as CashflowImportApplyActions[keyof CashflowImportApplyActions],
                                }))
                              }
                              className="meal-input modern-select w-full"
                            >
                              {SECTION_ACTION_OPTIONS.map((option) => (
                                <option key={`${item.key}-${option.value}`} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>

                      {!partnerValidation.valid && preview.partners.length > 1 ? (
                        <p className="text-sm font-semibold text-destructive">חלוקת השותפים המיובאת מגיעה ל-{partnerValidation.total}% וצריך 100% לפני שמירה.</p>
                      ) : null}

                      <div className="flex items-center justify-between gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>
                          סגור
                        </Button>
                        <Button type="button" onClick={handleApplyImport}>
                          שמור ייבוא
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showReplaceConfirm} onOpenChange={setShowReplaceConfirm}>
        <AlertDialogContent dir="rtl" className="max-w-lg text-right">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="text-right">החלפת נתונים קיימים</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              הפעולה הזו תחליף את האזורים הבאים: {replaceWarnings.join(", ")}. לא מבצעים החלפה בלי אישור מפורש.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-col sm:space-x-0">
            <AlertDialogAction
              onClick={() => {
                if (!preview) return;
                onApply(applyCashflowImport(data, preview, actions));
                showImportToast("הייבוא נשמר", "הנתונים נבדקו, נשמרו ועודכנו במודול התזרים.");
                setShowReplaceConfirm(false);
                onClose();
              }}
            >
              אשר החלפה
            </AlertDialogAction>
            <AlertDialogCancel>חזור לבדיקה</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import * as XLSX from "xlsx";
import {
  type CashflowData,
  type CashflowPartner,
  type CashflowSettings,
  type CashflowTransaction,
  type ExpenseCategory,
  type IncomeCategory,
  type UpcomingPayment,
  generateId,
  getTodayKey,
} from "@/lib/cashflow";

export type CashflowImportBlockType =
  | "transactions"
  | "upcoming"
  | "partners"
  | "settings"
  | "fixed_expenses"
  | "unknown";

export type CashflowImportSectionAction = "append" | "replace" | "skip";
export type CashflowImportTransactionMode = "mixed" | "income" | "expense";

export interface CashflowImportSheet {
  id: string;
  name: string;
  rows: string[][];
}

export interface CashflowImportWorkbook {
  fileName: string;
  sheets: CashflowImportSheet[];
  templateMatched: boolean;
}

export interface CashflowImportBlock {
  id: string;
  sheetId: string;
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  nonEmptyCount: number;
  preview: string[][];
  previewRowNumbers: number[];
  suggestedType: CashflowImportBlockType;
  confidence: "גבוהה" | "בינונית" | "נמוכה";
  headerRowOffset: number;
  columns: string[];
}

export interface CashflowImportBlockDraft {
  id: string;
  approved: boolean;
  blockType: CashflowImportBlockType;
  headerRowOffset: number;
  mapping: Record<string, string>;
  transactionMode: CashflowImportTransactionMode;
}

export interface CashflowImportRowIssue {
  rowNumber: number;
  reason: string;
}

export interface CashflowImportDuplicate {
  key: string;
  section: "transactions" | "upcoming" | "partners";
  rowNumber: number;
  reason: string;
}

export interface CashflowImportPreview {
  transactions: CashflowTransaction[];
  upcomingPayments: UpcomingPayment[];
  partners: CashflowPartner[];
  settingsPatch: Partial<CashflowSettings> & { overallBankPortion?: number };
  fixedExpensesTotal?: number;
  validRows: number;
  invalidRows: CashflowImportRowIssue[];
  skippedRows: CashflowImportRowIssue[];
  duplicates: CashflowImportDuplicate[];
}

export interface CashflowImportApplyActions {
  transactions: CashflowImportSectionAction;
  upcomingPayments: CashflowImportSectionAction;
  partners: CashflowImportSectionAction;
  settings: CashflowImportSectionAction;
  fixedExpenses: CashflowImportSectionAction;
}

const TEMPLATE_SHEETS = ["transactions", "upcoming_payments", "partners", "settings"];

const INCOME_ALIAS_MAP: Array<[IncomeCategory, string[]]> = [
  ["daily_sales", ["מכירות היום", "מכירות", "מכירה"]],
  ["other_income", ["הכנסה אחרת", "הכנסה", "אחר"]],
  ["owner_investment", ["השקעת בעלים", "השקעה", "בעלים"]],
  ["grant", ["מענק"]],
  ["loan", ["הלוואה", "הלוואות"]],
  ["refund", ["החזר"]],
  ["one_time", ["הכנסה חד פעמית", "חד פעמית"]],
];

const EXPENSE_ALIAS_MAP: Array<[ExpenseCategory, string[]]> = [
  ["rent", ["שכירות"]],
  ["suppliers", ["ספקים", "ספק"]],
  ["salaries", ["משכורות", "שכר"]],
  ["marketing", ["שיווק", "פרסום"]],
  ["equipment", ["ציוד"]],
  ["operations", ["תפעול", "הוצאות תפעול", "תפעולי"]],
  ["recurring", ["תשלום קבוע", "קבוע", "חוזר"]],
  ["one_time", ["הוצאה חד פעמית", "חד פעמית"]],
  ["other", ["אחר", "שונות"]],
];

const FIELD_ALIASES: Record<CashflowImportBlockType, Record<string, string[]>> = {
  transactions: {
    type: ["סוג", "סוג תנועה", "סוג עסקה", "הכנסה/הוצאה", "תנועה"],
    amount: ["סכום", "סהכ", "סה״כ", "₪", "amount"],
    date: ["תאריך", "תאריך עסקה", "יום"],
    category: ["קטגוריה", "סוג הוצאה", "סוג הכנסה", "עבור מה", "תחום"],
    note: ["הערה", "הערות", "פירוט", "תיאור"],
    paidFor: ["למי שולם", "שולם ל", "ספק", "עבור", "לקוח"],
  },
  upcoming: {
    name: ["שם", "שם התשלום", "לתשלום", "תשלום", "פריט"],
    amount: ["סכום", "₪", "amount"],
    dueDate: ["תאריך יעד", "לתאריך", "מועד", "תאריך"],
    note: ["הערה", "הערות", "פירוט", "תיאור"],
    status: ["שולם", "סטטוס", "status"],
    recurringMonthly: ["חוזר חודשי", "חוזר", "חודשי"],
  },
  partners: {
    name: ["שותף", "שם", "בעלים"],
    ownershipPercent: ["אחוז", "אחוז בעלות", "בעלות", "%"],
    investedAmount: ["השקעה", "השקעה בפועל", "השקיע", "סכום"],
    targetCommitment: ["התחייבות", "יעד", "יעד התחייבות"],
  },
  settings: {
    bankBalance: ["בנק", "יתרת בנק", "חשבון בנק"],
    cashOnHand: ["מזומן", "מזומן בעסק"],
    overallAvailableCash: ["יתרה", "יתרה כוללת", "יתרה זמינה", "יתרה התחלתית", "פתיחה"],
    overallBankPortion: ["בחשבון הבנק", "מתוך זה בבנק", "מאלה בחשבון הבנק"],
    monthlyBaselineExpenses: ["הוצאות בסיס", "הוצאות חודשיות", "הוצאות קבועות"],
    monthlyBaselineIncome: ["הכנסות בסיס", "הכנסות חודשיות"],
    cashWarningThreshold: ["סף אזהרה", "אזהרה", "רף אזהרה"],
  },
  fixed_expenses: {
    category: ["קטגוריה", "שם", "סוג"],
    amount: ["סכום", "₪", "amount"],
    note: ["הערה", "הערות", "פירוט"],
  },
  unknown: {},
};

const BLOCK_TYPE_HINTS: Record<CashflowImportBlockType, string[]> = {
  transactions: ["תאריך", "סכום", "הכנסה", "הוצאה", "סוג תנועה", "למי שולם", "עבור מה", "הערות"],
  upcoming: ["שם", "סכום", "תאריך יעד", "לתשלום", "שולם", "תשלום", "תשלומים"],
  partners: ["שותף", "אחוז", "בעלות", "השקעה", "התחייבות"],
  settings: ["בנק", "מזומן", "יתרה", "יתרה התחלתית", "פתיחה"],
  fixed_expenses: ["שכירות", "ארנונה", "חשמל", "מים", "משכורות", "תקשורת", "אינטרנט", "הוצאות קבועות"],
  unknown: [],
};

function normalizeText(value: unknown) {
  return String(value ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/[־–—]/g, "-")
    .replace(/[״"]/g, "\"")
    .replace(/[׳']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForMatch(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function isMeaningful(value: string) {
  return normalizeText(value).length > 0;
}

function parsePositiveNumber(value: unknown) {
  const normalized = normalizeText(value)
    .replace(/₪/g, "")
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseAnyNumber(value: unknown) {
  const normalized = normalizeText(value)
    .replace(/₪/g, "")
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function excelSerialToIso(serial: number) {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  const dateInfo = new Date(utcValue * 1000);
  return dateInfo.toISOString().split("T")[0];
}

export function parseImportDate(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return excelSerialToIso(value);
  const normalized = normalizeText(value);
  if (!normalized) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  const parts = normalized.split(/[./-]/).map((part) => part.trim()).filter(Boolean);
  if (parts.length === 3) {
    const [a, b, c] = parts;
    if (a.length === 4) {
      const iso = `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`;
      return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
    }
    const day = a.padStart(2, "0");
    const month = b.padStart(2, "0");
    const year = c.length === 2 ? `20${c}` : c;
    const iso = `${year}-${month}-${day}`;
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
  }
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split("T")[0];
}

function sheetToRows(sheet: XLSX.WorkSheet) {
  const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    raw: true,
    defval: "",
    blankrows: false,
  });
  return rows.map((row) => row.map((cell) => normalizeText(cell)));
}

export async function parseCashflowImportFile(file: File): Promise<CashflowImportWorkbook> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false, raw: false });
  const sheets = workbook.SheetNames.map((name) => ({
    id: name,
    name,
    rows: sheetToRows(workbook.Sheets[name]),
  }));
  const normalizedNames = sheets.map((sheet) => normalizeForMatch(sheet.name));
  const templateMatched = TEMPLATE_SHEETS.every((expected) => normalizedNames.includes(expected));
  return { fileName: file.name, sheets, templateMatched };
}

function getBlockCellKey(row: number, col: number) {
  return `${row}:${col}`;
}

function extractBounds(rows: string[][], rowIndices: number[], colIndices: number[]) {
  const startRow = Math.min(...rowIndices);
  const endRow = Math.max(...rowIndices);
  const startCol = Math.min(...colIndices);
  const endCol = Math.max(...colIndices);
  const previewRows = rows.slice(startRow, endRow + 1).map((row) => row.slice(startCol, endCol + 1));
  return { startRow, endRow, startCol, endCol, previewRows };
}

function detectHeaderRow(previewRows: string[][]) {
  const candidateRows = previewRows.slice(0, Math.min(previewRows.length, 5));
  let bestIndex = 0;
  let bestScore = -1;
  candidateRows.forEach((row, index) => {
    const textCells = row.filter((cell) => isMeaningful(cell) && !parsePositiveNumber(cell));
    const matchScore = textCells.reduce((score, cell) => {
      const normalized = normalizeForMatch(cell);
      let matched = 0;
      Object.values(BLOCK_TYPE_HINTS).forEach((tokens) => {
        if (tokens.some((token) => normalized.includes(normalizeForMatch(token)))) matched += 2;
      });
      return score + matched;
    }, 0);
    const score = textCells.length * 3 + matchScore;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function classifyBlock(previewRows: string[][]) {
  const flattened = previewRows.flat().map(normalizeForMatch).filter(Boolean);
  const scores = (Object.keys(BLOCK_TYPE_HINTS) as CashflowImportBlockType[])
    .filter((type) => type !== "unknown")
    .map((type) => {
      const score = BLOCK_TYPE_HINTS[type].reduce((sum, token) => {
        const normalizedToken = normalizeForMatch(token);
        return sum + flattened.filter((cell) => cell.includes(normalizedToken)).length;
      }, 0);
      return { type, score };
    })
    .sort((a, b) => b.score - a.score);
  const best = scores[0];
  if (!best || best.score === 0) return { suggestedType: "unknown" as const, confidence: "נמוכה" as const };
  if (best.score >= 5) return { suggestedType: best.type, confidence: "גבוהה" as const };
  if (best.score >= 2) return { suggestedType: best.type, confidence: "בינונית" as const };
  return { suggestedType: best.type, confidence: "נמוכה" as const };
}

function getColumns(previewRows: string[][], headerRowOffset: number) {
  const headerRow = previewRows[headerRowOffset] ?? [];
  return headerRow.map((value, index) => normalizeText(value) || `עמודה ${index + 1}`);
}

export function detectCashflowBlocks(sheet: CashflowImportSheet): CashflowImportBlock[] {
  const cells = new Set<string>();
  const coords: Array<{ row: number; col: number }> = [];
  sheet.rows.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (isMeaningful(cell)) {
        cells.add(getBlockCellKey(rowIndex, colIndex));
        coords.push({ row: rowIndex, col: colIndex });
      }
    });
  });

  const visited = new Set<string>();
  const blocks: CashflowImportBlock[] = [];

  for (const coord of coords) {
    const startKey = getBlockCellKey(coord.row, coord.col);
    if (visited.has(startKey)) continue;

    const queue = [coord];
    const rowIndices: number[] = [];
    const colIndices: number[] = [];
    let nonEmptyCount = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = getBlockCellKey(current.row, current.col);
      if (visited.has(key)) continue;
      visited.add(key);
      rowIndices.push(current.row);
      colIndices.push(current.col);
      nonEmptyCount += 1;

      for (let row = current.row - 1; row <= current.row + 1; row += 1) {
        for (let col = current.col - 1; col <= current.col + 1; col += 1) {
          const neighborKey = getBlockCellKey(row, col);
          if (cells.has(neighborKey) && !visited.has(neighborKey)) {
            queue.push({ row, col });
          }
        }
      }
    }

    if (nonEmptyCount < 4) continue;

    const bounds = extractBounds(sheet.rows, rowIndices, colIndices);
    const headerRowOffset = detectHeaderRow(bounds.previewRows);
    const { suggestedType, confidence } = classifyBlock(bounds.previewRows);
    const preview = bounds.previewRows.slice(0, 6);
    blocks.push({
      id: `${sheet.id}-${bounds.startRow}-${bounds.startCol}-${bounds.endRow}-${bounds.endCol}`,
      sheetId: sheet.id,
      startRow: bounds.startRow,
      endRow: bounds.endRow,
      startCol: bounds.startCol,
      endCol: bounds.endCol,
      nonEmptyCount,
      preview,
      previewRowNumbers: preview.map((_, index) => bounds.startRow + index + 1),
      suggestedType,
      confidence,
      headerRowOffset,
      columns: getColumns(bounds.previewRows, headerRowOffset),
    });
  }

  return blocks.sort((a, b) => a.startRow - b.startRow || a.startCol - b.startCol);
}

function matchAlias(value: string, aliases: string[]) {
  const normalized = normalizeForMatch(value);
  return aliases.some((alias) => normalized.includes(normalizeForMatch(alias)));
}

export function inferCashflowFieldMapping(columns: string[], blockType: CashflowImportBlockType) {
  const aliases = FIELD_ALIASES[blockType] ?? {};
  const mapping: Record<string, string> = {};
  columns.forEach((column) => {
    const field = Object.entries(aliases).find(([, aliasList]) => matchAlias(column, aliasList))?.[0];
    mapping[column] = field ?? "";
  });
  return mapping;
}

function resolveTransactionType(
  row: Record<string, string>,
  mapping: Record<string, string>,
  mode: CashflowImportTransactionMode,
) {
  if (mode === "income" || mode === "expense") return mode;
  const typeColumn = Object.entries(mapping).find(([, field]) => field === "type")?.[0];
  const typeValue = typeColumn ? normalizeForMatch(row[typeColumn]) : "";
  if (["income", "הכנסה", "נכנס", "זיכוי"].some((token) => typeValue.includes(token))) return "income";
  if (["expense", "הוצאה", "יצא", "חיוב"].some((token) => typeValue.includes(token))) return "expense";

  const categoryColumn = Object.entries(mapping).find(([, field]) => field === "category")?.[0];
  const categoryValue = categoryColumn ? normalizeForMatch(row[categoryColumn]) : "";
  if (INCOME_ALIAS_MAP.some(([, aliases]) => aliases.some((alias) => categoryValue.includes(normalizeForMatch(alias))))) return "income";
  if (EXPENSE_ALIAS_MAP.some(([, aliases]) => aliases.some((alias) => categoryValue.includes(normalizeForMatch(alias))))) return "expense";
  return null;
}

function resolveCategory(type: "income" | "expense", rawValue: string) {
  const normalized = normalizeForMatch(rawValue);
  if (!normalized) return type === "income" ? "daily_sales" : "other";

  const lookup = type === "income" ? INCOME_ALIAS_MAP : EXPENSE_ALIAS_MAP;
  const match = lookup.find(([, aliases]) => aliases.some((alias) => normalized.includes(normalizeForMatch(alias))));
  return match?.[0] ?? (type === "income" ? "other_income" : "other");
}

function getBlockRows(sheet: CashflowImportSheet, block: CashflowImportBlock, headerRowOffset: number) {
  const localRows = sheet.rows
    .slice(block.startRow, block.endRow + 1)
    .map((row) => row.slice(block.startCol, block.endCol + 1));
  const columns = getColumns(localRows, headerRowOffset);
  const rows = localRows.slice(headerRowOffset + 1);

  return rows.map((values, index) => ({
    rowNumber: block.startRow + headerRowOffset + 2 + index,
    values: Object.fromEntries(columns.map((column, columnIndex) => [column, values[columnIndex] ?? ""])),
  }));
}

function isTotalRow(values: Record<string, string>) {
  return Object.values(values).some((value) => {
    const normalized = normalizeForMatch(value);
    return normalized === "סהכ" || normalized === "סה\"כ" || normalized === "סך הכל" || normalized === "total";
  });
}

function buildTransactionDuplicateKey(transaction: CashflowTransaction) {
  return [
    transaction.type,
    transaction.amount,
    transaction.date,
    transaction.category,
    normalizeForMatch(transaction.note ?? ""),
  ].join("|");
}

function buildUpcomingDuplicateKey(payment: UpcomingPayment) {
  return [normalizeForMatch(payment.name), payment.amount, payment.dueDate, normalizeForMatch(payment.note ?? "")].join("|");
}

function buildPartnerDuplicateKey(partner: CashflowPartner) {
  return [normalizeForMatch(partner.name), partner.ownershipPercent, partner.investedAmount].join("|");
}

export function buildCashflowImportPreview(
  workbook: CashflowImportWorkbook,
  blocks: CashflowImportBlock[],
  drafts: Record<string, CashflowImportBlockDraft>,
  existingData: CashflowData,
  options: { allowDuplicates?: boolean } = {},
): CashflowImportPreview {
  const transactions: CashflowTransaction[] = [];
  const upcomingPayments: UpcomingPayment[] = [];
  const partners: CashflowPartner[] = [];
  const settingsPatch: Partial<CashflowSettings> & { overallBankPortion?: number } = {};
  const invalidRows: CashflowImportRowIssue[] = [];
  const skippedRows: CashflowImportRowIssue[] = [];
  const duplicates: CashflowImportDuplicate[] = [];
  let fixedExpensesTotal = 0;
  let validRows = 0;

  const existingTransactionKeys = new Set(existingData.transactions.map(buildTransactionDuplicateKey));
  const existingUpcomingKeys = new Set(existingData.upcomingPayments.map(buildUpcomingDuplicateKey));
  const existingPartnerKeys = new Set(existingData.partners.map(buildPartnerDuplicateKey));
  const importTransactionKeys = new Set<string>();
  const importUpcomingKeys = new Set<string>();
  const importPartnerKeys = new Set<string>();

  blocks.forEach((block) => {
    const draft = drafts[block.id];
    if (!draft?.approved || draft.blockType === "unknown") return;
    const sheet = workbook.sheets.find((item) => item.id === block.sheetId);
    if (!sheet) return;
    const rows = getBlockRows(sheet, block, draft.headerRowOffset);

    rows.forEach(({ rowNumber, values }) => {
      if (Object.values(values).every((value) => !isMeaningful(value))) {
        skippedRows.push({ rowNumber, reason: "שורה ריקה" });
        return;
      }

      if (isTotalRow(values)) {
        skippedRows.push({ rowNumber, reason: "שורת סיכום" });
        return;
      }

      if (draft.blockType === "transactions") {
        const type = resolveTransactionType(values, draft.mapping, draft.transactionMode);
        const amountColumn = Object.entries(draft.mapping).find(([, field]) => field === "amount")?.[0];
        const dateColumn = Object.entries(draft.mapping).find(([, field]) => field === "date")?.[0];
        const categoryColumn = Object.entries(draft.mapping).find(([, field]) => field === "category")?.[0];
        const noteColumn = Object.entries(draft.mapping).find(([, field]) => field === "note")?.[0];
        const paidForColumn = Object.entries(draft.mapping).find(([, field]) => field === "paidFor")?.[0];
        const amount = amountColumn ? parsePositiveNumber(values[amountColumn]) : null;
        const date = dateColumn ? parseImportDate(values[dateColumn]) : null;
        const category = categoryColumn ? resolveCategory(type ?? "expense", values[categoryColumn]) : null;

        if (!type || !amount || !date || !category) {
          invalidRows.push({ rowNumber, reason: "חסרים סוג, סכום, תאריך או קטגוריה" });
          return;
        }

        const transaction: CashflowTransaction = {
          id: generateId(),
          type,
          amount,
          date,
          category,
          note: noteColumn ? normalizeText(values[noteColumn]) || undefined : undefined,
          paidFor: paidForColumn ? normalizeText(values[paidForColumn]) || undefined : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const key = buildTransactionDuplicateKey(transaction);
        if ((existingTransactionKeys.has(key) || importTransactionKeys.has(key)) && !options.allowDuplicates) {
          duplicates.push({ key, section: "transactions", rowNumber, reason: "תנועה כפולה אפשרית" });
          return;
        }
        importTransactionKeys.add(key);
        transactions.push(transaction);
        validRows += 1;
        return;
      }

      if (draft.blockType === "upcoming") {
        const nameColumn = Object.entries(draft.mapping).find(([, field]) => field === "name")?.[0];
        const amountColumn = Object.entries(draft.mapping).find(([, field]) => field === "amount")?.[0];
        const dueDateColumn = Object.entries(draft.mapping).find(([, field]) => field === "dueDate")?.[0];
        const noteColumn = Object.entries(draft.mapping).find(([, field]) => field === "note")?.[0];
        const statusColumn = Object.entries(draft.mapping).find(([, field]) => field === "status")?.[0];
        const recurringColumn = Object.entries(draft.mapping).find(([, field]) => field === "recurringMonthly")?.[0];
        const name = nameColumn ? normalizeText(values[nameColumn]) : "";
        const amount = amountColumn ? parsePositiveNumber(values[amountColumn]) : null;
        const dueDate = dueDateColumn ? parseImportDate(values[dueDateColumn]) : null;

        if (!name || !amount || !dueDate) {
          invalidRows.push({ rowNumber, reason: "חסרים שם, סכום או תאריך יעד" });
          return;
        }

        const statusValue = statusColumn ? normalizeForMatch(values[statusColumn]) : "";
        const recurringValue = recurringColumn ? normalizeForMatch(values[recurringColumn]) : "";
        const payment: UpcomingPayment = {
          id: generateId(),
          name,
          amount,
          dueDate,
          note: noteColumn ? normalizeText(values[noteColumn]) || undefined : undefined,
          status: ["שולם", "paid", "כן"].some((token) => statusValue.includes(token)) ? "paid" : "pending",
          recurringMonthly: ["כן", "true", "חוזר", "חודשי"].some((token) => recurringValue.includes(token)),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const key = buildUpcomingDuplicateKey(payment);
        if ((existingUpcomingKeys.has(key) || importUpcomingKeys.has(key)) && !options.allowDuplicates) {
          duplicates.push({ key, section: "upcoming", rowNumber, reason: "תשלום כפול אפשרי" });
          return;
        }
        importUpcomingKeys.add(key);
        upcomingPayments.push(payment);
        validRows += 1;
        return;
      }

      if (draft.blockType === "partners") {
        const nameColumn = Object.entries(draft.mapping).find(([, field]) => field === "name")?.[0];
        const ownershipColumn = Object.entries(draft.mapping).find(([, field]) => field === "ownershipPercent")?.[0];
        const investedColumn = Object.entries(draft.mapping).find(([, field]) => field === "investedAmount")?.[0];
        const targetColumn = Object.entries(draft.mapping).find(([, field]) => field === "targetCommitment")?.[0];
        const name = nameColumn ? normalizeText(values[nameColumn]) : "";
        const ownershipPercent = ownershipColumn ? parseAnyNumber(values[ownershipColumn]) : null;
        const investedAmount = investedColumn ? parseAnyNumber(values[investedColumn]) : null;

        if (!name || ownershipPercent === null || investedAmount === null) {
          invalidRows.push({ rowNumber, reason: "חסרים שם, אחוז בעלות או סכום השקעה" });
          return;
        }

        const partner: CashflowPartner = {
          id: generateId(),
          name,
          ownershipPercent,
          investedAmount,
          targetCommitment: targetColumn ? parseAnyNumber(values[targetColumn]) ?? undefined : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const key = buildPartnerDuplicateKey(partner);
        if ((existingPartnerKeys.has(key) || importPartnerKeys.has(key)) && !options.allowDuplicates) {
          duplicates.push({ key, section: "partners", rowNumber, reason: "שותף כפול אפשרי" });
          return;
        }
        importPartnerKeys.add(key);
        partners.push(partner);
        validRows += 1;
        return;
      }

      if (draft.blockType === "settings") {
        const mappingEntries = Object.entries(draft.mapping).filter(([, field]) => field);
        if (mappingEntries.length > 0) {
          mappingEntries.forEach(([column, field]) => {
            const value = values[column];
            if (!isMeaningful(value)) return;
            const parsed = parseAnyNumber(value);
            if (parsed !== null) {
              (settingsPatch as Record<string, number>)[field] = parsed;
            }
          });
          validRows += 1;
          return;
        }

        const entries = Object.values(values).filter(Boolean);
        if (entries.length >= 2) {
          const key = normalizeForMatch(entries[0]);
          const rawValue = entries[1];
          const settingField = Object.entries(FIELD_ALIASES.settings).find(([, aliases]) => aliases.some((alias) => key.includes(normalizeForMatch(alias))))?.[0];
          const parsed = parseAnyNumber(rawValue);
          if (settingField && parsed !== null) {
            (settingsPatch as Record<string, number>)[settingField] = parsed;
            validRows += 1;
          }
        }
        return;
      }

      if (draft.blockType === "fixed_expenses") {
        const amountColumn = Object.entries(draft.mapping).find(([, field]) => field === "amount")?.[0];
        const amount = amountColumn ? parsePositiveNumber(values[amountColumn]) : null;
        if (amount === null) {
          invalidRows.push({ rowNumber, reason: "לא נמצא סכום להוצאה קבועה" });
          return;
        }
        fixedExpensesTotal += amount;
        validRows += 1;
      }
    });
  });

  return {
    transactions,
    upcomingPayments,
    partners,
    settingsPatch,
    fixedExpensesTotal: fixedExpensesTotal > 0 ? fixedExpensesTotal : undefined,
    validRows,
    invalidRows,
    skippedRows,
    duplicates,
  };
}

export function applyCashflowImport(
  current: CashflowData,
  preview: CashflowImportPreview,
  actions: CashflowImportApplyActions,
) {
  const next: CashflowData = {
    ...current,
    settings: { ...current.settings },
    transactions: [...current.transactions],
    upcomingPayments: [...current.upcomingPayments],
    partners: [...current.partners],
    lastUpdated: new Date().toISOString(),
  };

  if (actions.transactions === "replace") next.transactions = preview.transactions;
  if (actions.transactions === "append") next.transactions = [...preview.transactions, ...next.transactions];

  if (actions.upcomingPayments === "replace") next.upcomingPayments = preview.upcomingPayments;
  if (actions.upcomingPayments === "append") next.upcomingPayments = [...next.upcomingPayments, ...preview.upcomingPayments];

  if (actions.partners === "replace") next.partners = preview.partners;
  if (actions.partners === "append") next.partners = [...next.partners, ...preview.partners];

  if (actions.settings !== "skip") {
    next.settings = {
      ...next.settings,
      ...(actions.settings === "replace"
        ? {
            bankBalance: undefined,
            cashOnHand: undefined,
            overallAvailableCash: undefined,
            monthlyBaselineExpenses: undefined,
            monthlyBaselineIncome: undefined,
            cashWarningThreshold: undefined,
          }
        : {}),
      ...preview.settingsPatch,
    };
  }

  if (actions.fixedExpenses !== "skip" && preview.fixedExpensesTotal !== undefined) {
    next.settings.monthlyBaselineExpenses = preview.fixedExpensesTotal;
  }

  return next;
}

export function createCashflowTemplateWorkbook() {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["תאריך", "סוג תנועה", "סכום", "קטגוריה", "הערה", "למי שולם"],
      [getTodayKey(), "הכנסה", "2500", "מכירות היום", "", ""],
      [getTodayKey(), "הוצאה", "420", "ספקים", "חשבונית חודשית", "ספק ראשי"],
    ]),
    "transactions",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["שם", "סכום", "תאריך יעד", "הערה", "שולם", "חוזר חודשי"],
      ["שכירות", "5500", getTodayKey(), "", "לא", "כן"],
    ]),
    "upcoming_payments",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["שותף", "אחוז בעלות", "השקעה בפועל", "יעד התחייבות"],
      ["יוסי כהן", "100", "50000", "100000"],
    ]),
    "partners",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["שדה", "ערך"],
      ["יתרה כוללת", "75000"],
      ["מאלה, בחשבון הבנק", "50000"],
      ["מזומן", "25000"],
      ["הוצאות בסיס חודשיות", "20000"],
      ["הכנסות בסיס חודשיות", "35000"],
      ["סף אזהרה", "10000"],
    ]),
    "settings",
  );
  return workbook;
}

export function downloadCashflowTemplateWorkbook() {
  const workbook = createCashflowTemplateWorkbook();
  const array = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([array], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "planner-hub-cashflow-template.xlsx";
  link.click();
  URL.revokeObjectURL(url);
}

export function getImportReplaceWarnings(current: CashflowData, actions: CashflowImportApplyActions) {
  const warnings: string[] = [];
  if (actions.transactions === "replace" && current.transactions.length > 0) warnings.push(`עסקאות (${current.transactions.length})`);
  if (actions.upcomingPayments === "replace" && current.upcomingPayments.length > 0) warnings.push(`תשלומים עתידיים (${current.upcomingPayments.length})`);
  if (actions.partners === "replace" && current.partners.length > 0) warnings.push(`שותפים (${current.partners.length})`);
  if (
    actions.settings === "replace" &&
    (current.settings.bankBalance !== undefined ||
      current.settings.cashOnHand !== undefined ||
      current.settings.overallAvailableCash !== undefined ||
      current.settings.monthlyBaselineExpenses !== undefined ||
      current.settings.monthlyBaselineIncome !== undefined ||
      current.settings.cashWarningThreshold !== undefined)
  ) {
    warnings.push("הגדרות תזרים");
  }
  if (actions.fixedExpenses === "replace" && current.settings.monthlyBaselineExpenses !== undefined) warnings.push("הוצאות בסיס חודשיות");
  return warnings;
}

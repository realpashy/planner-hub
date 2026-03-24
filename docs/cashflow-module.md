# Cashflow Module

This document describes the current MVP for the Planner Hub cashflow module.

## Goal

The cashflow module is a simple, fast cash overview tool for small and medium Israeli businesses.

It is intentionally **not**:

- accounting software
- ERP
- CRM
- a predictive finance engine

It focuses on four practical questions:

- כמה כסף יש עכשיו
- כמה נכנס / יצא
- מה צפוי לצאת
- כמה צריך להכניס כדי לא להפסיד

## Persistence model

- Cashflow data is stored in `app_user_data.cashflow_json`
- Cloud sync is handled through the existing `/api/data` contract
- The client writes to local storage first and then syncs through the shared cloud sync flow
- Receipt attachments are stored separately in `cashflow_attachments`
- Import does not create separate storage. After review, it writes back into the same synced `cashflowData` model

## Data model

### Transactions

- `id`
- `type`: `income | expense`
- `amount`
- `date`
- `category`
- `note?`
- `paidFor?`
- `attachmentId?`
- `createdAt`
- `updatedAt`

Required fields:

- amount
- date
- category

### Upcoming payments

- `id`
- `name`
- `category?`
- `amount`
- `dueDate`
- `note?`
- `status`: `pending | paid`
- `recurringMonthly`
- `scheduledMonths?`
- `createdAt`
- `updatedAt`

When a user creates a recurring monthly payment and selects multiple months, the module saves it as separate upcoming payment items.
Each item keeps the same chosen day-of-month where possible, so one selected setup can be tracked and marked separately month by month.

### Partners

- `id`
- `name`
- `ownershipPercent`
- `investedAmount`
- `targetCommitment?`
- `createdAt`
- `updatedAt`

### Settings

- `bankBalance?`
- `cashOnHand?`
- `overallAvailableCash?`
- `overallBankPortion?`
- `monthlyBaselineExpenses?`
- `monthlyBaselineIncome?`
- `cashWarningThreshold?`
- `balanceMode`: `split | overall`
- `savedPayees?`

## Settings precedence

Two balance modes are supported:

1. `split`
   - uses `bankBalance + cashOnHand`
2. `overall`
   - uses `overallAvailableCash`

When `balanceMode` is `overall`, the explicit overall number overrides the bank + מזומן split.

### Overall bank portion

- `overallBankPortion` is only shown in overall mode
- it must be less than or equal to `overallAvailableCash`
- it is stored for visibility and future split features
- it does **not** change current calculations yet

## Receipt attachment MVP

- one optional file per transaction
- server upload endpoint
- server fetch/view endpoint
- stored durably in Postgres

Intentionally not included:

- OCR
- multiple files per transaction
- advanced attachment management

## Formulas

### Available cash

`starting balance + all income transactions - all expense transactions`

### Monthly totals

- monthly income: sum of income transactions in the current month
- monthly expenses: sum of expense transactions in the current month
- monthly net: income minus expenses

### Upcoming payments total

Sum of pending upcoming payments in the selected period.

### Daily averages

Calculated from the active overview period:

- today: divisor `1`
- week: divisor `7`
- month: divisor `days elapsed in current month`

### Required daily target

The module uses a practical break-even formula:

`max(0, ((remaining upcoming + remaining baseline expenses + warning threshold) - current month income - available cash) / remaining days)`

This keeps the target stable and easy to understand.

### Forecast

The 7-day and 30-day forecast uses:

- current available cash
- pending upcoming payments by due date
- optional remaining monthly baseline expenses
- optional remaining monthly baseline income

Baseline values are distributed across the remaining days of the current month.

Baseline values are used only for overview and forecast logic.
They do **not** create fake transactions.

## Validation rules

### Transactions

- amount must be positive
- date is required
- category is required

### Upcoming payments

- name is required after category/default-name resolution
- amount must be positive
- due date is required
- when `recurringMonthly` is enabled, at least one target month must be selected

### Partners

- if exactly one partner exists, it can still be edited but starts at `100%`
- when adding or editing a partner, the newly entered share is preserved
- existing partner shares are reduced proportionally
- the final ownership total must equal `100%`
- invalid ownership totals are blocked from save

### Settings

- in overall mode, `overallBankPortion <= overallAvailableCash`
- when a cashflow filter or section heading includes an icon, the icon stays on the right before the Hebrew label as one RTL-aligned cluster

## Paid flow

Upcoming payments support a lightweight confirmation:

- `סמן כשולם בלבד`
- `סמן כשולם וצור הוצאה`

When the second option is used, a matching expense transaction is created and linked through `paidFor`.

## Import workflow

The importer is deterministic and review-first.
It never saves immediately after upload.

### Entry points

- `הורדת תבנית מוכנה`
- `ייבוא מקובץ קיים`

### Supported file types

- `.xlsx`
- `.xls`
- `.csv`

### Steps

1. `העלאת קובץ`
2. `בחירת גיליון`
3. `זיהוי אזורים`
4. `התאמת שדות`
5. `בדיקת נתונים`
6. `סיכום וייבוא`

### Detection heuristics

The importer scans each sheet for meaningful blocks instead of assuming one table.

Likely block types:

- transactions
- upcoming payments
- partners
- settings / opening balances
- fixed monthly expenses
- unknown

Hebrew-oriented hints include labels such as:

- transactions: `תאריך`, `סכום`, `הכנסה`, `הוצאה`, `סוג תנועה`, `למי שולם`, `עבור מה`, `הערות`
- upcoming: `שם`, `סכום`, `תאריך יעד`, `שולם`, `תשלום`
- partners: `שותף`, `אחוז`, `בעלות`, `השקעה`, `התחייבות`
- settings: `בנק`, `מזומן`, `יתרה`, `פתיחה`
- fixed expenses: `שכירות`, `ארנונה`, `חשמל`, `מים`, `משכורות`, `אינטרנט`

### Cleanup rules

- trim whitespace
- normalize Hebrew spacing and punctuation
- parse `₪`
- parse comma-separated amounts
- parse Excel serial dates
- parse common local date formats
- ignore empty rows and blank columns
- skip summary rows such as `סה"כ`, `סך הכל`, `total`

### Mapping and validation

- user chooses or confirms block type
- user can choose the header row
- user maps source columns to cashflow fields
- unmapped columns are ignored
- imported rows are classified as:
  - valid
  - invalid
  - skipped
  - duplicates

### Fixed expenses

Fixed expenses do not create fake historical transactions.

They can be used only as:

- monthly baseline expenses total
- or ignored

### Duplicate and replace safeguards

- importer checks likely duplicates against existing saved data and the current import set
- replace is allowed only per section
- replace always shows a clear destructive confirmation with the exact affected section
- there is no silent replacement

## Intentionally deferred features

Not implemented in this MVP:

- recurring income
- exports
- alerts
- advanced accounting logic
- multi-branch support
- localization expansion beyond current module copy

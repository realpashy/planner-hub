# Cashflow Module

This document describes the implemented MVP for the Planner Hub cashflow module.

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
- `amount`
- `dueDate`
- `note?`
- `status`: `pending | paid`
- `recurringMonthly`
- `createdAt`
- `updatedAt`

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
- `monthlyBaselineExpenses?`
- `monthlyBaselineIncome?`
- `cashWarningThreshold?`
- `balanceMode`: `split | overall`

## Settings precedence

Two balance modes are supported:

1. `split`
   - uses `bankBalance + cashOnHand`
2. `overall`
   - uses `overallAvailableCash`

When `balanceMode` is `overall`, the explicit overall number overrides the bank + מזומן split.

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

- name is required
- amount must be positive
- due date is required

### Partners

- if exactly one partner exists, ownership is forced to `100`
- if more than one partner exists, ownership remains editable
- total ownership must equal `100`
- invalid ownership totals are blocked from save

## Paid flow

Upcoming payments support a lightweight confirmation:

- `סמן כשולם בלבד`
- `סמן כשולם וצור הוצאה`

When the second option is used, a matching expense transaction is created and linked through `paidFor`.

## Intentionally deferred features

Not implemented in this MVP:

- recurring income
- exports
- alerts
- advanced accounting logic
- multi-branch support
- localization expansion beyond current module copy

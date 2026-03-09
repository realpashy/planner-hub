# AI Memory

## Source of Truth
- Persistent project memory files:
  - `PROJECT_OVERVIEW.md`
  - `ARCHITECTURE.md`
  - `MODULE_STATUS.md`
  - `AI_MEMORY.md`
- Always read these at new-session start.
- Update them after significant module work.

## Product Rules
- RTL-first app.
- No English UI copy for end users.
- Latin digits only for numbers/time display.
- Keep UX premium, calm, minimal, mobile-first.
- Avoid distracting UI patterns.

## Core Technical Rules
- Maintain modular structure and avoid tight coupling.
- Keep migration path from local-first storage to shared entities.
- Automations must be suggestion-based (accept/dismiss), never silent creation.

## Routing Rules
- Weekly planner canonical route: `/weekly-planner`.
- Keep aliases for reliability and old links:
  - `/weekly-planner/`
  - `/planner/weekly-planner`
  - `/planner/weekly-planner/`
  - `/planner`
  - `/planner/setup` (legacy fallback to weekly planner page)

## Budget Rules
- Module title: "الميزانيّة الشهرية".
- Supported currencies: ILS, USD, AED, SAR, JOD, KWD, QAR, EGP.
- Currency dropdown shows symbol + name + code.
- Display amounts with symbol-first format and LTR lock where needed.
- Add transaction defaults to income.
- Savings type is handled via savings-goals flow (not add-transaction type picker).
- New transactions use current date automatically.
- New savings goals default date to end of selected month.
- Category input in add-transaction is free text and can auto-create category.
- Debt emoji should stay bank-style.
- Financial insights widget should provide scenario-rich warnings.

## Notifications Rules
- Use one global toast system for all module actions.
- Notifications should stack and animate (slide in/out) from top-right.
- Every meaningful add/edit/delete/update action should show a toast.

## UI/Theme Rules
- Light theme must avoid harsh brightness.
- Prefer layered surfaces, stronger contrast separation, and calm palettes.
- Preserve dark mode quality.
- Keep modern scrollbar/select styling where present.

## AI Receipt Feature Rule
- Keep AI receipt parsing disabled in UI while quota is unavailable.
- Re-enable only after confirmed API quota/billing.

## UI Class Map
- Weekly Planner:
  - `weekly-planner-page`
  - `weekly-planner-header`
  - `weekly-template-trigger`
  - `weekly-template-modal`
  - `weekly-template-modal-card`
  - `weekly-template-option`
  - `weekly-template-apply-btn`
  - weekly-template-cancel-btn$add
- Budget Module:
  - `budget-planner-page`
  - `budget-planner-header`
  - `budget-header-controls`
  - `budget-month-picker`
  - `budget-month-select`
  - `budget-currency-select`
  - `budget-summary-grid`
  - `budget-tabs-wrap`
  - `budget-tabs-nav`
  - `budget-tab-btn`
  - `budget-add-transaction-widget`
  - `budget-add-goal-widget`
  - `budget-savings-goals-widget`
  - `budget-overview-widget`
  - `budget-overview-title`
  - `budget-overview-income-expense`
  - `budget-overview-chart-wrap`
  - `budget-overview-donut`
  - `budget-overview-segments`
  - `budget-overview-segment`
  - `budget-recent-transactions-widget`
  - `budget-financial-insights-widget`
  - `budget-categories-settings-widget`
  - `budget-categories-group-widget`

- Light theme tokens use layered SaaS palette (#F6F7FB background, #FFFFFF cards, #F1F3F7 secondary surfaces, #E5E7EB borders) and should avoid pure-white walls.
- Budget donut interaction uses static base ring + expanded active segment only (no full-donut scaling).
- Auth-aware routes are always mounted to prevent mobile dead-route states when session changes.



# AI Memory

## Source of Truth Rule
- These memory files are the persistent source of truth:
  - `PROJECT_OVERVIEW.md`
  - `ARCHITECTURE.md`
  - `MODULE_STATUS.md`
  - `AI_MEMORY.md`
- Do not rely on chat memory alone.
- After major module work, update these files.

## Product Rules
- App is RTL-first.
- End-user UI should avoid English text.
- Use Latin digits for all numbers/time (example: 2026, 57%, 12:30).
- Visual style must remain premium, calm, minimal, mobile-first.
- Keep interaction simple and non-distracting.
- Prefer in-app dialogs for critical inputs; avoid browser-native prompts.

## Architecture Rules
- Maintain modular boundaries; avoid tight coupling.
- Keep code extensible for multi-module integration.
- Prefer shared entity approach for future inter-module links.
- Persist locally for now; keep migration path to Supabase clear.

## Automation Rules
- Automations should suggest actions, not create items silently.
- Suggestions must be accept/dismiss.
- Preserve links between generated suggestions and source modules.

## Planner Rules
- Weekly planner primary route is `/weekly-planner` (`/planner/weekly-planner` and `/planner` kept as aliases).
- Template chooser is an in-page popup trigger in weekly planner header (no dedicated setup route).

## Budget Rules
- Budget module supports multiple transaction types (income, expense, bills, debt, saving).
- Budget tabs must stay focused: overview + category settings by default.
- Transaction management should happen from "آخر عمليات هذا الشهر" with search/filter/edit/delete.
- Currency list must include: ILS, USD, AED, SAR, JOD, KWD, QAR, EGP.
- Currency dropdown shows symbol + text + code.
- Displayed amounts use symbol-only formatting.

## Data Safety Rules
- Deleting or editing categories should not break linked records.
- Prevent destructive operations when categories are in active use.

## Deployment Rules
- GitHub is primary source repository.
- Push to `main` triggers Vercel deployment.
- Keep SPA rewrite in Vercel config to avoid deep-link 404s.





- Budget period selector must use the current language locale month/year labels (Arabic now, extensible for future languages).
- In budget add-transaction form, default type is دخل and ادخار is intentionally excluded.
- Monetary text in RTL views must use an LTR direction lock to keep symbol/sign order readable (example: ₪ -2,000).
- Widget order in budget overview keeps تحليل مالي ذكي as the last card in the right column.
- Amount inputs must accept Arabic/Hebrew keyboard entry and normalize numerals before parsing.
- Bills/debts support recurring monthly creation with an explicit 'exclude this month' action.
- Category and type emojis are part of budget visual clarity and should stay consistent across lists/selects/cards.

- Editing recurring items must offer scope selection: current month only or all months.
- Recurring exclusion must work for both linked bills/debts and recurring templates (income/expense).
- Budget selects and long operation lists should keep modern themed styling (modern-select, modern-scrollbar).


- Use session auth with secure cookies and PostgreSQL session store.
- Keep dashboard/planner/budget routes protected behind auth.
- Cloud sync should pull on login and push periodically while user is active.
- AI receipt parsing should prefill fields as suggestions and may support explicit one-tap user-confirmed auto-add.



- Budget add-transaction uses free-text category input and auto-creates missing categories by type.
- While API quota is unavailable, AI receipt upload UI remains disabled with an in-app notice instead of upload action.
- New budget transactions always use the current date automatically; users do not select a date in the add form.
- New savings goals no longer require a manual target date input; target date defaults to end of selected month.

- Budget UI elements should carry stable unique class names for fast, targeted follow-up edits.
- Budget overview uses an interactive donut + segment hover percentages and should preserve this behavior unless explicitly redesigned.





## UI Class Map
- Weekly Planner:
  - `weekly-planner-page`
  - `weekly-planner-header`
  - `weekly-template-trigger`
  - `weekly-template-modal`
  - `weekly-template-modal-card`
  - `weekly-template-option`
  - `weekly-template-apply-btn`
  - `weekly-template-cancel-btn`
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
  - `budget-toast-notification`

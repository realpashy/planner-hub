# Module Status

## Module 1 - لوحة الوحدات (Dashboard)
Status: Completed
Components:
- modules grid
- theme toggle
- navigation to active modules
Notes:
- Planner and Budget are active.
- Other modules are placeholders pending implementation.

## Module 2 - المخطط الأسبوعي (Weekly Planner)
Status: In Progress
Components:
- week header/navigation
- day strip with selected day model
- daily tasks/events/focus tags/notes
- weekly tasks and habit tracker
- weekly summary and visual widgets
- quick action FAB
- in-page template popup trigger in header
Notes:
- Primary route: `/weekly-planner`.
- Aliases: `/weekly-planner/`, `/planner/weekly-planner`, `/planner/weekly-planner/`, `/planner`, `/planner/setup`.
- Edge blur overlays removed from day strip.
- Uses localStorage + cloud sync when authenticated.

## Module 3 - الميزانيّة الشهرية (Financial Planner)
Status: In Progress
Components:
- monthly KPIs and net indicators
- add/edit/delete transaction flow
- recurring monthly transactions with month-exclusion control
- latest operations list with search/filter and action popup
- category settings and custom categories
- savings goals and contributions
- interactive overview chart and segment list
- financial insights widget with scenario-based warnings
Notes:
- Currency options implemented: ILS, USD, AED, SAR, JOD, KWD, QAR, EGP.
- Add-transaction defaults to دخل and excludes ادخار from type picker.
- New transactions use current date automatically.
- Savings goals default target date to end of selected month.
- Overview chart now renders a static donut with an active-slice overlay so only the hovered category slice grows.
- Budget actions now emit global stacked notifications (add/edit/delete/skip/category/goal/contribution).
- Core budget widgets/classes use unique class names documented in `AI_MEMORY.md`.

## Module 4 - العادات (Standalone Habit Module)
Status: Planned
Components:
- weekly/monthly habit views
- streaks and completion analytics
Notes:
- Some habit features currently exist inside weekly planner only.

## Module 5 - منظم الحياة
Status: Planned

## Module 6 - التخطيط الشهري
Status: Planned

## Module 7 - أهداف السنة
Status: Planned

## Module 8 - تتبع المهام
Status: Planned

## Module 9 - مخطط السفر
Status: Planned

## Module 10 - وجبات الأسبوع
Status: Planned

## Module 11 - المصادقة والحساب
Status: In Progress
Components:
- login/register page
- session auth APIs
- route protection
Notes:
- super admin defaults via env.
- Google login planned next phase.

## Module 12 - مزامنة سحابية
Status: In Progress
Components:
- user data table in Postgres
- pull/push APIs for planner + budget JSON
- periodic client sync after login
Notes:
- JSON persistence chosen for speed and minimal migration risk.

## Module 13 - مساعد الإيصالات بالذكاء الاصطناعي
Status: Paused (Quota)
Components:
- receipt upload and parse endpoint
- smart field suggestion flow
Notes:
- Feature currently disabled in UI until quota/billing is restored.


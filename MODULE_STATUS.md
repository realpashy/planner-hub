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
Notes:
- Template setup flow moved to `/planner/setup` and appears only when entering planner setup.
- Uses localStorage persistence.

## Module 3 - الميزانية (Financial Planner)
Status: In Progress
Components:
- monthly overview KPIs
- transactions log (add/edit/delete/search/filter)
- category management (by transaction type)
- bills tracker with quick payment registration
- debts tracker with progress and quick settlement
- savings goals with contributions
- monthly limit + rollover + currency selector
- in-app amount dialog for payments/savings (replaces browser prompt)
Notes:
- Currency options implemented: ILS, USD, AED, SAR, JOD, KWD, QAR, EGP.
- Dropdown shows symbol + text + code.
- Displayed amounts use symbol-only format.
- Data is localStorage-backed via `client/src/lib/budget.ts`.

## Module 4 - العادات (Standalone Habit Module)
Status: Planned
Components:
- weekly/monthly habit views
- streaks and completion analytics
Notes:
- Some habit features currently exist inside weekly planner only.

## Module 5 - منظم الحياة
Status: Planned
Components:
- personal areas and routines
- cross-linking with tasks/events
Notes:
- UI card exists on dashboard as placeholder.

## Module 6 - التخطيط الشهري
Status: Planned
Components:
- month goals and timeline
- calendar-level planning
Notes:
- UI card exists on dashboard as placeholder.

## Module 7 - أهداف السنة
Status: Planned
Components:
- yearly goals
- progress checkpoints
Notes:
- UI card exists on dashboard as placeholder.

## Module 8 - تتبع المهام
Status: Planned
Components:
- central task hub
- filters/priority/status
Notes:
- Task capability currently embedded in weekly planner.

## Module 9 - مخطط السفر
Status: Planned
Components:
- travel events and checklist
- automation suggestions into planner
Notes:
- UI card exists on dashboard as placeholder.

## Module 10 - وجبات الأسبوع
Status: Planned
Components:
- meal plan grid
- grocery-linked task suggestions
Notes:
- UI card exists on dashboard as placeholder.



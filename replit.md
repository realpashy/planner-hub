# Planner Hub

Premium RTL planner web app for Arabic and Hebrew users. Fully offline using localStorage.

## Architecture

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Express (minimal — health endpoint only, app is offline-first)
- **Data**: localStorage persistence via `client/src/lib/storage.ts`
- **Routing**: wouter (`/` = Dashboard, `/planner` = Weekly Planner)
- **Per-user isolation**: Each browser gets its own localStorage data automatically

## Onboarding System

- First-time visitors see the Onboarding page (template picker)
- 5 templates available: Sports/Fitness, Productivity/Work, Study/Learning, Mental Wellness, Blank
- Templates generate realistic Arabic data for the current week
- Onboarding state tracked via `planner_hub_onboarded` key in localStorage
- Existing users (with data from before onboarding was added) are auto-marked as onboarded
- Template data generated dynamically in `client/src/lib/templates.ts`

## Design System

- Primary: `#4F46E5` (indigo)
- Success: `#22C55E` (green)
- Warning: `#F59E0B` (amber)
- Light mode: Background `#F8FAFC`, Cards `#FFFFFF`, Text `#0F172A`, Borders `#E2E8F0`
- Dark mode: Background `#0F172A`, Cards `#1E293B`, Text `#F1F5F9`, Borders `#1E293B`
- Fonts: Tajawal (Arabic), Heebo (Hebrew)
- All numbers use Latin digits
- Dark/light toggle persisted in localStorage (`planner_hub_theme`)

## Key Files

- `client/src/index.css` — Design system tokens (light + dark), animations, elevation utilities
- `client/src/lib/storage.ts` — localStorage CRUD, onboarding check
- `client/src/lib/templates.ts` — Template definitions and data generators
- `client/src/lib/date-utils.ts` — Arabic/Hebrew date formatting (always Latin digits)
- `client/src/hooks/use-planner.ts` — React Query optimistic mutations for all planner operations
- `client/src/pages/Dashboard.tsx` — Module cards (only Weekly Planner active)
- `client/src/pages/WeeklyPlanner.tsx` — Main planner page
- `client/src/pages/Onboarding.tsx` — Template picker for new users
- `client/src/components/ThemeToggle.tsx` — Dark/light mode toggle button
- `client/src/components/planner/` — DayStrip, FocusTags, EventList, TaskList, HabitTracker, MonthCalendar, WeeklySummary, WeeklyGraphs, FAB, ExpandableText
- `shared/schema.ts` — Zod schemas and TypeScript types

## Modules

- **Weekly Planner** — Fully implemented
- Budget Tracker, Habit Tracker, Life Organizer, Monthly Budget, New Year Goals, Task Tracker, Travel Planner, Meal Planner — Coming soon (placeholder cards)

## Task System

- Daily tasks are added to a specific date
- Weekly tasks are added to the week-start date with `isWeekly: true`
- Weekly tasks view shows ALL tasks for the week (both daily and weekly)
- Tasks are synced: checking a task in either daily or weekly view updates the same task object
- Mutations use optimistic updates (setQueryData) to prevent scroll-to-top issues

## Feature Details

- **Events**: Show with clock icon (no emojis on events), sky-blue CircleDot for items
- **Habits**: Have emoji auto-assignment based on name keywords
- **Text overflow**: ExpandableText component truncates long text with "..." click-to-expand
- **Checkboxes**: Use onPointerDown for instant mobile response, no scroll side effects
- **Calendar**: Navigation arrows use `dir="ltr"` for standard left/right behavior
- **Weekly Graphs**: Bar charts for daily task completion and habit tracking at bottom of planner
- **Layout**: max-w-7xl on desktop for wider view, bigger text/elements on both desktop and mobile
- **DayStrip**: Centered day buttons, scroll only triggers on day selection change

## Dependencies

Key packages: date-fns, framer-motion, canvas-confetti, uuid, vaul, @radix-ui/react-popover

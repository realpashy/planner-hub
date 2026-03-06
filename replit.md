# Planner Hub

Premium RTL planner web app for Arabic and Hebrew users. Fully offline using localStorage.

## Architecture

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Express (minimal — health endpoint only, app is offline-first)
- **Data**: localStorage persistence via `client/src/lib/storage.ts`
- **Routing**: wouter (`/` = Dashboard, `/planner` = Weekly Planner)

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
- `client/src/lib/storage.ts` — localStorage CRUD, seed data generation
- `client/src/lib/date-utils.ts` — Arabic/Hebrew date formatting (always Latin digits)
- `client/src/hooks/use-planner.ts` — React Query mutations for all planner operations
- `client/src/pages/Dashboard.tsx` — Module cards (only Weekly Planner active)
- `client/src/pages/WeeklyPlanner.tsx` — Main planner page
- `client/src/components/ThemeToggle.tsx` — Dark/light mode toggle button
- `client/src/components/planner/` — DayStrip, FocusTags, EventList, TaskList, HabitTracker, MonthCalendar, WeeklySummary, FAB
- `shared/schema.ts` — Zod schemas and TypeScript types

## Modules

- **Weekly Planner** — Fully implemented
- Budget Tracker, Habit Tracker, Life Organizer, Monthly Budget, New Year Goals, Task Tracker, Travel Planner, Meal Planner — Coming soon (placeholder cards)

## Task System

- Daily tasks are added to a specific date
- Weekly tasks are added to the week-start date with `isWeekly: true`
- Weekly tasks view shows ALL tasks for the week (both daily and weekly)
- Tasks are synced: checking a task in either daily or weekly view updates the same task object

## Feature Details

- **Events**: Show with clock icon (no emojis on events)
- **Habits**: Have emoji auto-assignment based on name keywords (💧 water, 💪 exercise, etc.)
- **Separator**: Visible divider between events and tasks sections
- **Calendar**: Navigation arrows use `dir="ltr"` for standard left/right behavior
- **Layout**: max-w-7xl on desktop for wider view, bigger text/elements on both desktop and mobile
- **DayStrip**: Centered day buttons with responsive sizing

## Future-Ready Architecture

- Auth can be added via server middleware + user context
- Backend sync can replace localStorage calls in `storage.ts`
- Cross-module automation architecture: linked entities with `sourceModule`, `linkedEntityIds`, suggestion-based model
- Data model supports `isWeekly` flag for task linking between daily/weekly views

## Dependencies

Key packages: date-fns, framer-motion, canvas-confetti, uuid, vaul, @radix-ui/react-popover

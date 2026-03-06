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
- Background: `#F8FAFC`, Cards: `#FFFFFF`, Text: `#0F172A`, Borders: `#E2E8F0`
- Fonts: Tajawal (Arabic), Heebo (Hebrew)
- All numbers use Latin digits

## Key Files

- `client/src/index.css` — Design system tokens, animations, elevation utilities
- `client/src/lib/storage.ts` — localStorage CRUD, seed data generation
- `client/src/lib/date-utils.ts` — Arabic/Hebrew date formatting (always Latin digits)
- `client/src/hooks/use-planner.ts` — React Query mutations for all planner operations
- `client/src/pages/Dashboard.tsx` — Module cards (only Weekly Planner active)
- `client/src/pages/WeeklyPlanner.tsx` — Main planner page
- `client/src/components/planner/` — DayStrip, FocusTags, EventList, TaskList, HabitTracker, MonthCalendar, WeeklySummary, FAB
- `shared/schema.ts` — Zod schemas and TypeScript types

## Modules

- **Weekly Planner** — Fully implemented
- Budget Tracker, Habit Tracker, Life Organizer, Monthly Budget, New Year Goals, Task Tracker, Travel Planner, Meal Planner — Coming soon (placeholder cards)

## Future-Ready Architecture

- Auth can be added via server middleware + user context
- Backend sync can replace localStorage calls in `storage.ts`
- Cross-module automation architecture: linked entities with `sourceModule`, `linkedEntityIds`, suggestion-based model
- Data model supports `isWeekly` flag for task linking between daily/weekly views

## Dependencies

Key packages: date-fns, framer-motion, canvas-confetti, uuid, vaul, @radix-ui/react-popover

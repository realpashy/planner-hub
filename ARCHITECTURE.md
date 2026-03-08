# Architecture

## Frontend Structure
- Stack: React + TypeScript + Vite + TailwindCSS + Framer Motion
- Entry:
  - `client/src/main.tsx`
  - `client/src/App.tsx`
- Routing (wouter):
  - `/` dashboard
  - `/planner/setup` weekly template onboarding
  - `/planner` weekly planner
  - `/budget` financial planner
- UI layers:
  - Shared UI primitives in `client/src/components/ui`
  - Module components in `client/src/components/planner`
  - Module pages in `client/src/pages`
- Domain utilities:
  - Weekly planner storage/hooks: `client/src/lib/storage.ts`, `client/src/hooks/use-planner.ts`
  - Budget domain/state/calculations: `client/src/lib/budget.ts`

## Backend Structure
- Node/Express server in `server/`
- Current API surface is minimal:
  - Health route from `shared/routes.ts` and `server/routes.ts`
- Dev: Vite middleware through server in development
- Prod: static serving via `server/static.ts`

## Database Schema (Current + Direction)
- Current persistence: localStorage only
- Weekly planner data model (local): settings, tags, events, tasks, habits, notes
- Budget data model (local):
  - settings (currency, monthlyLimit, rolloverEnabled)
  - categories
  - transactions
  - bills
  - debts
  - savingsGoals
- Future DB direction: shared entity model across modules
  - `id`, `type`, `title`, `status`, `sourceModule`, `sourceId`, `linkedEntityIds`, `metadata`, `suggestedByAutomation`

## APIs
- Current:
  - `GET /api/health`
- Planned (future):
  - Auth/user profile endpoints
  - Module CRUD endpoints (planner, budget, habits, etc.)
  - Suggestion/automation endpoints
  - Sync endpoints for linked entities

## State Management
- React state + local domain helpers
- TanStack Query used for planner domain querying/mutations
- Budget module uses local in-module state with centralized domain utilities and persistence in `client/src/lib/budget.ts`

## Automation Logic (Current and Planned)
- Current: manual-first interactions
- Planned automation principle:
  - Cross-module detection (payments, travel, meals, goals, etc.)
  - Show suggestions (accept/dismiss), never silent creation
  - Keep links to source modules/entities for traceability

## Deployment
- GitHub repo: `https://github.com/realpashy/planner-hub`
- Vercel auto-deploy from `main`
- SPA routing rewrite configured in `vercel.json`
- Supabase project exists for future persistence rollout


## Authentication and Persistence (Implemented)
- Session auth with PostgreSQL-backed session store (connect-pg-simple).
- User table: pp_users (email, hashed password, role).
- User cloud data table: pp_user_data (planner_json, budget_json).
- APIs:
  - GET /api/auth/me`r
  - POST /api/auth/register`r
  - POST /api/auth/login`r
  - POST /api/auth/logout`r
  - GET /api/data`r
  - PUT /api/data`r
  - POST /api/ai/receipt`r
- Client periodically syncs local planner/budget data to server for signed-in users.


# Architecture

## Frontend Structure
- Stack: React + TypeScript + Vite + TailwindCSS + Framer Motion.
- Entry points:
  - `client/src/main.tsx`
  - `client/src/App.tsx`
- Routing (wouter):
  - `/` dashboard
  - `/auth` login/register
  - `/weekly-planner` (primary weekly route)
  - `/weekly-planner/` (alias)
  - `/planner/weekly-planner` (alias)
  - `/planner/weekly-planner/` (alias)
  - `/planner/setup` (legacy alias -> weekly planner popup flow)
  - `/planner` (alias)
  - `/budget` monthly budget planner
- UI layers:
  - Shared UI primitives: `client/src/components/ui`
  - Planner components: `client/src/components/planner`
  - Module pages: `client/src/pages`
- Domain utilities:
  - Planner storage/hooks: `client/src/lib/storage.ts`, `client/src/hooks/use-planner.ts`
  - Budget domain/state/calculations: `client/src/lib/budget.ts`

## Backend Structure
- Node/Express server in `server/`.
- Serverless API entry for Vercel in `api/index.ts`.
- Session auth and user data endpoints are available through API routes.
- Production serves built frontend from `dist/public` with Vercel rewrites.

## Database Schema (Current)
- PostgreSQL (Supabase) for auth/session/cloud sync.
- Core app tables:
  - `app_users` (email, password hash, role)
  - `app_user_data` (planner JSON, budget JSON)
- Session storage via `connect-pg-simple`.

## APIs
- Auth:
  - `GET /api/auth/me`
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
- Data sync:
  - `GET /api/data`
  - `PUT /api/data`
- Utility:
  - `GET /api/health`
- AI receipt route exists but feature is currently disabled in UI until quota is restored.

## State Management
- Planner: TanStack Query + optimistic mutations over local model.
- Budget: page-level React state with domain helpers from `client/src/lib/budget.ts`.
- Cloud sync layer periodically pushes local planner/budget JSON for authenticated users.

## Notification System
- Global Radix/Shadcn toast system mounted once in `App` via `Toaster`.
- Toast viewport is top-right and supports stacked notifications with slide-in/out motion.
- Planner and Budget actions now use the same global notification behavior.

## Automation Logic Direction
- Cross-module automation remains suggestion-first (accept/dismiss), never silent creation.
- Shared-entity linking remains the target for future integrations.

## Deployment
- GitHub repo: `https://github.com/realpashy/planner-hub`
- Vercel auto deploy from `main`
- SPA rewrites configured in `vercel.json`
- Supabase project used for auth/session/cloud persistence

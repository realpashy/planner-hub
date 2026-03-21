# Planner Hub Product Tiers

## Required inputs before launch
- `OPENAI_API_KEY`
- `OPENAI_MEAL_MODEL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Optional admin emails or IDs to elevate
- Optional future Stripe env placeholders

## Tiers
- `free`: local-first planner, limited AI generation, manual editing, saved plans, basic analytics.
- `pro`: higher AI quota, richer meal recommendations, advanced insights, future smart optimization hooks.
- `admin`: bypass quotas, inspect cost/usage, adjust flags later.

## Extension rule
- Future modules must use the shared tier config in `shared/plans/plan-tiers.ts`.
- Do not hardcode tier logic inside module components.

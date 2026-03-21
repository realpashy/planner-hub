# Setup Required

## Checklist
- Add `OPENAI_API_KEY`
- Add `OPENAI_MEAL_MODEL=gpt-5-mini`
- Add `NEXT_PUBLIC_SUPABASE_URL`
- Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Add `SUPABASE_SERVICE_ROLE_KEY`
- Add either `DATABASE_URL` or `SUPABASE_DB_PASSWORD`
- Optional: set `SUPER_ADMIN_EMAIL`
- Optional: set `SUPER_ADMIN_PASSWORD`
- Optional later: `STRIPE_SECRET_KEY`
- Optional later: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Optional later: `STRIPE_WEBHOOK_SECRET`

## SQL migrations to run
1. Run all files in `supabase/migrations/` in order.
2. Deploy the latest Vercel build.
3. Hit `/api/health` once to warm the serverless initializer.

## Seeded defaults
- Feature flags:
  - `meal_planner.ai_enabled`
  - `meal_planner.force_local_generation`
  - `meal_planner.admin_dashboard_enabled`
  - `product.upgrade_cta_enabled`
  - `product.credit_packs_enabled`
- Plan tiers:
  - `free`
  - `pro`
  - `admin`

## Admin setup
- Existing `SUPER_ADMIN_EMAIL` user is auto-created if missing.
- To mark another user as admin, update `profiles.role='admin'` and `profiles.plan_tier='admin'`.

## Local quota exhaustion test
1. Set one user to `free`.
2. Manually update `ai_usage_daily.full_generations_used` to the tier limit.
3. Trigger weekly generation again.
4. Confirm the API returns `AI_LIMIT_REACHED` and the UI shows the limit dialog while local planning still works.

## Timezone fallback
- Use `profiles.timezone` when set.
- Fallback is `Asia/Jerusalem`.

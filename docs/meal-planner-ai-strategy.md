# Meal Planner AI Strategy

## Required setup
- Add `OPENAI_API_KEY` in Vercel.
- Add `OPENAI_MEAL_MODEL=gpt-5-mini` unless you intentionally change it.
- Run the SQL files in `supabase/migrations/`.

## Current strategy
- Use request-time structured generation only.
- Build each request from prompt templates, user preferences, saved user context, and current edit context.
- Validate every AI response with zod before saving.
- Save successful outputs to `saved_meal_plans` and reuse them as lightweight context later.

## Cost control
- Full weekly generation and full-week regeneration count against full-generation quota.
- Day regeneration and meal replacement count against light-edit quota.
- If quota is exhausted, the module must fall back to local generation and manual editing without blocking the user.

## Future placeholders
- Fine-tuning is intentionally not implemented.
- Stripe credit pack purchasing is intentionally not implemented.
- Pro-only intelligence features should hang off shared feature flags instead of branching inside prompts.

# Planner Hub agent instructions

Reply in English only.
You may use Arabic only for product-facing UI copy inside the app when needed.

This is an RTL-first Arabic SaaS app. Preserve RTL correctness in all UI changes.

Before changing UI, read and follow:
- `docs/design-system.md`
- `docs/ux-standards.md`
- `docs/meal-planner-dashboard.md`

Planner Hub now uses a dark-first v0 visual system.
Treat these values as the default source of truth for UI work:
- background: `#171717`
- card / muted: `#262626`
- foreground: `#e5e5e5`
- primary / accent: `#95df1e`
- border / input: `#404040`
- ring: `#9ddf36`
- radius: `0.375rem`
- shadow: `2px 2px 5px 2px #0000000d`

Do not leave default shadcn styling in visible screens.
Apply the design system directly to the rendered UI.

Do not ship “mostly RTL-correct” UI.
Manually verify title alignment, subtitle alignment, opposite-side meta placement, and icon/button ordering in every affected row.

Do not fix meal-module RTL or timeline issues with Radix-generated ID selectors or page-instance CSS hacks.
Prefer stable component-level layout patterns:
- right-anchored content clusters for Arabic headers
- badge-inside-title-stack composition instead of floating sibling badges
- shared timeline lane wrappers for popup rails and dots

Do not over-plan.
Do not ask for confirmation for normal implementation work.
Inspect the real codebase first and treat it as the source of truth.

After each completed task:
1. Run the relevant checks if available.
2. Show a short summary of what changed.
3. Run:
   git add .
   git commit -m "<clear task-based message>"
   git push

Do not force push.
Do not rewrite git history.
If git push fails, explain why briefly and stop.

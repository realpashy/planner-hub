# Planner Hub agent instructions

Reply in English only.
You may use Arabic only for product-facing UI copy inside the app when needed.

This is an RTL-first Arabic SaaS app. Preserve RTL correctness in all UI changes.

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

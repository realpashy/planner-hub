# Planner Hub UX Standards

This file is the default UX reference for current and future Planner Hub modules.

## RTL rules

- Arabic product experiences must be RTL-first, not mirrored LTR.
- Titles, body text, helper text, and lists should default to right alignment.
- Put the primary contextual content block on the right side of RTL layouts unless a different hierarchy is clearly needed.
- Directional icons must be placed intentionally for Arabic reading order.
- Do not rely on accidental `justify-between` behavior to solve RTL alignment.
- If a title is on the right, counts, utilities, or secondary controls belong opposite it with clear intent.

## Input hierarchy

Use the lowest-friction control first:

1. toggle / yes-no
2. chips / segmented controls
3. dropdown / searchable select
4. free text only when structured input is not practical

## Interaction rules

- full-card click is preferred for planner cards when the whole card opens one detail view
- hover states should clarify interactivity, not create noise
- destructive or management actions should move to settings when they are not core to the main task
- contextual actions must stay inside the component they affect

## Progressive disclosure

- keep the main surface simple
- move depth into drawers, sheets, dialogs, or expanded states
- do not show heavy controls before the user asks for detail

## Scanability principles

- users should understand the primary surface in seconds
- use fewer, stronger zones
- repeated low-value widgets should be removed
- prefer clear vertical rhythm for planner timelines and weekly flows
- shopping lists and summaries must read naturally in Arabic without visual guessing

## Mandatory reuse rule

Whenever building or modifying UI:

1. Check this file.
2. Match the same RTL, input hierarchy, interaction, and scanability rules.
3. Fix the design if it looks like a generic template or feels LTR-adapted instead of RTL-native.

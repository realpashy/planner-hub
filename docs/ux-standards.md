# Planner Hub UX Standards

This file is the default UX reference for current and future Planner Hub modules.

## RTL system rules

RTL is not a mirrored LTR layout. It must be designed intentionally.

### Text alignment

- Arabic section titles must align right
- Arabic subtitles and helper text under those titles must also align right
- card titles, modal titles, drawer titles, and settings titles default to `text-right`
- long inline content blocks should not drift left just because the container is flex-based
- manual visual inspection is required for stubborn rows; utility classes alone are not enough

### Opposite-side meta pattern

When a row contains a title block plus count/meta/action:

- title block belongs on the right
- count, badge, or secondary meta belongs on the left
- do not rely on `justify-between` alone; DOM order must also match RTL reading order

### Icon placement

- back actions must be intentionally placed on the right edge in RTL headers
- close buttons in drawers and dialogs should respect RTL conventions explicitly
- button icons must be placed inline with the label, not floating or stacked awkwardly
- icon order must be visually checked, not assumed

### Drawer and header conventions

- drawer title block on the right
- contextual utility action opposite it on the left when applicable
- settings sheet close control on the left in RTL
- modal title and description align right
- disclosure rows must place the Arabic label first and the chevron/icon after it when that reads more naturally

## Input hierarchy

Use the lowest-friction control first:

1. yes/no control or toggle
2. chips / segmented controls
3. dropdown / searchable select
4. short numeric input
5. free text only when structured input is not practical

## Interaction rules

- full-card click is preferred when the whole card opens a detail view
- hover states should clarify interactivity, not add noise
- destructive or advanced actions should move to settings
- contextual actions should stay inside the component they affect

## Progressive disclosure

- keep the main weekly dashboard simple
- move editing and detail into drawers, dialogs, and settings
- do not show heavy management UI in the main planner surface

## Scanability principles

- a user should understand the page in seconds
- use fewer, stronger zones
- preserve vertical rhythm for planner timelines and weekly flows
- shopping lists must feel like supermarket lists, not raw ingredient dumps
- remove repeated low-value widgets before adding more UI

## Modal conventions

- title and helper text align right
- field labels align right
- country/phone or similar paired inputs must keep RTL readability while allowing LTR number entry where needed
- CTA icon and label must remain inline and balanced

## Settings panel conventions

- clean grouping by purpose
- normal actions separated from destructive actions
- diagnostics are secondary and collapsible
- no redundant informational cards that merely explain other visible UI

## Mandatory reuse rule

Whenever building or modifying UI:

1. Check this file first.
2. Match the same RTL, interaction, disclosure, and scanability patterns.
3. Fix the component if it still feels LTR-adapted or template-like.

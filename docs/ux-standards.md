# Planner Hub UX Standards

This file is the UX reference for current and future Planner Hub modules.

## RTL is manual, not automatic

Setting `dir="rtl"` is not enough. Each visible row must still be tuned intentionally.

## RTL layout rules

### Titles and subtitles

- Arabic page titles align right
- Arabic section titles align right
- subtitles, helper text, and supporting copy under Arabic titles also align right
- long descriptive copy must stay visually anchored to the right edge, not drift because of flex layout

### Opposite-side meta pattern

For rows with a title block and secondary content:

- title block belongs on the right
- count, chip, badge, or helper meta belongs on the left only when that improves Arabic scanning
- DOM order should match the visual RTL reading order
- do not rely on `justify-between` alone
- when a badge, date pill, icon chip, or quantity block is meant to lead the row in Arabic, place it first in the DOM and use an explicit RTL-first flex row instead of `grid-cols-[1fr_auto]`
- do not hide RTL meaning inside generic helper classes like `row-reverse`, mirrored `grid-cols-[1fr_auto]`, or helper rows that hardcode `justify-between`; helpers should stay neutral and the row itself should define its real Arabic reading order
- when a section header has a supporting badge or label, keep that badge inside the right-hand content cluster unless it is true opposite-side meta

### Icons and controls

- back buttons belong on the right edge in RTL headers
- close buttons belong where the drawer/modal convention defines them, not wherever the default component puts them
- icon + text buttons must be visually checked in Arabic
- when a section label or filter title includes an icon, the icon belongs on the right before the text and both must stay right-aligned as one content cluster
- searchable dropdown triggers and fixed-option dropdown triggers follow the same RTL rule: value text anchors right, supporting iconography stays secondary, and native browser dropdown chrome should not leak into visible product UI
- chevrons, expand icons, and disclosure icons must be manually verified row by row

### Dialogs and drawers

- title and description align right
- header actions are intentionally placed, not mirrored by accident
- dialog and drawer footers should keep the primary action visually coherent in RTL
- settings and admin sheets use a lighter utility hierarchy than main content surfaces

## Input hierarchy

Use the least-friction control first:

1. toggle / yes-no
2. chips / segmented controls
3. dropdown / searchable select
4. numeric input
5. free text only when structure is not practical

## Interaction rules

- full-card click is preferred when the whole card opens a detail view
- keep hover states subtle and useful
- selected and active states should feel intentional, not browser-default
- advanced or destructive actions belong in settings or deeper layers
- contextual actions stay close to the content they affect

## Progressive disclosure

- keep main surfaces simple and easy to scan
- move detail and editing into drawers, dialogs, and secondary layers
- do not crowd primary dashboards with management UI

## Scanability principles

- the page should be understandable in a few seconds
- prefer fewer, stronger zones over many similar boxes
- keep planner flows vertical when that improves weekly scanning
- keep shopping lists human-readable and grouped like real supermarket lists
- if a module uses AI-generated shopping organization, the prompt output language should follow the active app language instead of being hardcoded to Arabic
- remove low-value metrics before adding more

## Component conventions

### Headers

- top bars should separate primary identity from utility controls
- utility controls must stay visually secondary
- avoid grouping every control around the title block

### Cards

- title block right
- supporting meta or chips placed intentionally, not generically
- repeated card families must share the same internal rhythm
- if a card contains a leading icon chip, date pill, or quantity block, it must appear on the right side first in the DOM for Arabic rows
- do not create meal-planner headers from `floating badge + separate text sibling` when the badge belongs to the title context; use one right-anchored content cluster instead

### Timeline and anchored detail layouts

- timeline rails and dots must be built from stable component-level wrappers, not absolute positions tied to Radix IDs or one screen instance
- a timeline dot should be centered on the rail mathematically by the shared wrapper, not visually nudged beside it

### Modals

- labels align right
- helper text aligns right
- phone/email fields may remain LTR internally, but their surrounding labels and structure remain RTL
- CTA text and icons stay inline and balanced

### Settings panels

- group by purpose:
  - generation / workflow
  - normal plan actions
  - destructive actions
  - diagnostics
- diagnostics stay secondary
- avoid redundant explainer cards

## Mandatory reuse rule

Whenever building or modifying UI:

1. Read this file first.
2. Apply RTL manually to the visible rows, not just the container.
3. Fix any component that still feels mirrored-LTR instead of truly Arabic-native.

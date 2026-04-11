# Planner Hub UX Standards

This file is the UX reference for current and future Planner Hub modules.

## Current shell model

Planner Hub uses a shared authenticated shell.

- desktop: permanent right sidebar
- mobile: fixed bottom navigation
- top utility row: glassy top bar for search, profile, alerts, and page context
- dashboard: the daily operating system, not a launcher grid

Do not add temporary top-of-page module tabs to authenticated pages unless there is a very specific local workflow reason.

## RTL is manual, not automatic

Setting `dir="rtl"` is not enough. Each visible row must still be tuned intentionally.

## RTL layout rules

### Titles and subtitles

- Arabic page titles align right
- Arabic section titles align right
- subtitles, helper text, and supporting copy under Arabic titles also align right
- long descriptive copy must stay visually anchored to the right edge, not drift because of flex layout
- hero sections should read like editorial content blocks, with the right-aligned title stack clearly separated from utility controls and CTAs

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
- shell navigation icons should stay visually stable between expanded and collapsed sidebar states; collapsing the shell must not scramble RTL icon/label rhythm

### RTL flexbox start/end rule

This is a high-risk source of regressions and must be treated as a manual check, not intuition.

- inside a container with `dir="rtl"`, `justify-start` maps to the visual right edge
- inside a container with `dir="rtl"`, `justify-end` maps to the visual left edge
- do not assume LTR flex intuition when fixing Arabic/Hebrew alignment
- if a row is visually pinned to the wrong side, inspect `dir`, DOM order, and `justify-*` together before changing spacing
- when the goal is "put the whole content cluster on the right", prefer:
  - `dir="rtl"`
  - DOM order that matches the desired RTL reading order
  - `justify-start` for the row if it should sit on the right/start edge
- when the goal is "put the whole content cluster on the left/opposite edge", use `justify-end` intentionally and only after verifying that the row is truly opposite-side meta

### RTL text flow inside aligned clusters

Right alignment alone is not enough.

- a cluster can be visually anchored on the right while still reading with the wrong internal flow
- if text "sits on the right" but still feels left-to-right, verify the row direction and DOM order
- for Hebrew/Arabic text clusters:
  - the cluster itself should live in an RTL row
  - labels and helper text should inherit RTL flow
  - only the numeric token itself should opt into LTR when needed
- be careful with `items-end` on `flex-col` wrappers:
  - it can force the whole text stack to align from the wrong internal edge
  - this often makes Hebrew/Arabic copy look "right aligned but still reading left-to-right"
  - prefer the default stretch behavior, or a full-width wrapper plus `text-right`, unless the column truly needs cross-axis end alignment
- for mixed text + numeric rows, keep the text wrapper RTL and isolate the number with a dedicated helper such as `.cashflow-number`

### Shadcn defaults that commonly break RTL intent

Shared primitives can silently override local fixes.

- do not assume a local `pt-*`, `justify-*`, or `text-right` class is winning just because it appears in the JSX
- inspect the shared primitive when a fix "should work" but does not
- example from cashflow:
  - `CardContent` carries `md:pt-0` by default
  - on desktop this can wipe the intended top padding from a card even if the local component sets a mobile `pt-*`
  - if a card needs top breathing room on desktop, override the desktop padding explicitly in the component class list
- another recurring trap:
  - multi-line text wrappers built with `flex-col items-end` can make Arabic/Hebrew text look right-aligned while its internal reading flow still feels wrong
  - prefer a full-width wrapper plus `text-right` unless you truly need cross-axis end alignment
- another recurring trap:
  - premium header glows often fail because the glow element uses a short fixed height like `h-28` or `h-32`
  - when the subtitle or helper line falls outside the tinted area, fix the glow layer itself instead of adding random margins to the text
  - prefer a shared utility that fills the real header block over one-off local heights

### Dialogs and drawers

- title and description align right
- header actions are intentionally placed, not mirrored by accident
- dialog and drawer footers should keep the primary action visually coherent in RTL
- settings and admin sheets use a lighter utility hierarchy than main content surfaces
- floating surfaces should feel like glass layers, not flat detached sheets with hard borders

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
- quick actions on the dashboard must do real work or open a real flow; do not ship decorative CTA tiles
- AI widgets must stay concise and actionable; they should feel assistive, not demanding

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

For the home dashboard specifically:

- the user should immediately understand:
  - what matters today
  - what is at risk
  - what the next action should be
- treat the dashboard like a decision surface, not a report
- avoid equal-weight card grids when one zone should clearly lead the page

## Component conventions

### Headers

- top bars should separate primary identity from utility controls
- utility controls must stay visually secondary
- avoid grouping every control around the title block
- shell top bars should use search and utilities sparingly; do not turn them into navigation rows

### Cards

- title block right
- supporting meta or chips placed intentionally, not generically
- repeated card families must share the same internal rhythm
- if a card contains a leading icon chip, date pill, or quantity block, it must appear on the right side first in the DOM for Arabic rows
- do not create meal-planner headers from `floating badge + separate text sibling` when the badge belongs to the title context; use one right-anchored content cluster instead
- premium dashboard cards should separate sections using spacing and tonal nesting, not divider lines
- do not default to four identical analytics tiles if the content needs hierarchy; asymmetry is allowed when it improves understanding

### Timeline and anchored detail layouts

- timeline rails and dots must be built from stable component-level wrappers, not absolute positions tied to Radix IDs or one screen instance
- a timeline dot should be centered on the rail mathematically by the shared wrapper, not visually nudged beside it
- for dashboard timelines, use clear day-part grouping such as morning / afternoon / evening and avoid fake precision when an item is untimed
- if a timeline item supports a safe quick action, keep that interaction small and obvious inside the card; do not overload the timeline with management controls

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

## Dashboard AI behavior

- the dashboard AI should produce short, practical outputs
- one auto-generated daily briefing is preferred over repeated unsolicited AI calls
- on-demand AI actions should be button-led, scoped, and visibly loading
- AI results should map back to a real next action or destination whenever possible
- do not ship a full chatbot when a concise assistant card solves the need better

## Mobile shell behavior

- mobile navigation uses a fixed bottom bar with strong active state clarity
- the bar may scroll horizontally if needed, but tap targets must remain comfortable
- mobile shell controls should never crowd out the main task content
- dashboard sections should stack vertically with the same hierarchy as desktop, not collapse into an undifferentiated feed

## Mandatory reuse rule

Whenever building or modifying UI:

1. Read this file first.
2. Apply RTL manually to the visible rows, not just the container.
3. Fix any component that still feels mirrored-LTR instead of truly Arabic-native.

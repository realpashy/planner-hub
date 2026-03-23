# Meal Planner Dashboard Reference

This file defines the generated Meal Planner dashboard as the reference implementation for Planner Hub’s premium dark planner UI.

## Final information architecture

The generated dashboard keeps 4 primary zones:

1. top bar
2. weekly planner
3. shopping list
4. weekly guidance

The day drawer is the secondary detail layer.

## Visual direction

The dashboard should feel:

- premium
- dark-first
- calm
- clearly layered
- highly readable in Arabic

It must not feel like:

- a generic admin dashboard
- a pile of identical cards
- default shadcn dark mode

## Top bar

- back action is a clear RTL-first control on the right
- title and subtitle stay right-aligned
- utility controls stay secondary and visually lighter
- the shell is elevated and distinct from the page background

## Weekly planner structure

- weekly plan is a single vertical stack
- no day grid
- each day is one full-width planner card
- cards scan top-to-bottom naturally in RTL

## Day card structure

Each day card contains:

- small contextual status/meta row
- day title + date pill
- meal preview list
- compact macro row
- integrated bottom CTA area

Rules:

- full-card clickable
- premium but compact
- tighter vertical spacing than early versions
- distinct meal-type icon chips
- in light theme, the main icon chips use the primary green background with black foreground
- macro chips visually related but secondary to the meals
- no detached `تفاصيل اليوم` button

## Day drawer structure

- focused dark detail surface
- sticky header
- day pill, date title, and helper copy stacked clearly in RTL
- compact macro chips
- meal timeline flow with stronger editorial hierarchy

Meal cards inside the drawer should:

- keep title and type cues right-aligned
- keep actions secondary
- use chips for ingredients and macros
- keep detail toggles visually correct in Arabic

## Shopping list structure

The grocery UI must render from an AI-organized shopping model, not raw ingredient strings.

Rules:

- grouped by supermarket-style sections
- item name on the right
- a compact quantity block appears before the text in Arabic rows and reads as `×` then quantity
- the remove action stays visible and never overlaps text
- removed items persist for the active weekly plan only

### Grocery normalization behavior

Primary source:

- GPT-5 mini organizes the weekly grocery list into grouped supermarket sections
- the AI prompt must consolidate equivalent ingredient variants into one shopper-friendly item
- the AI output language should follow the active app language when language context is available

Fallback only if AI grocery data is missing:

- strip noisy descriptors
- detect a canonical grocery base item
- merge equivalent phrasing and unit order variants
- aggregate grams, counts, or approximate quantities
- keep only distinctions that matter in real shopping
- respect the current app language for shopping-friendly ingredient naming whenever language context is available

Example:

- `120غ صدر دجاج مشوي`
- `150غ صدر دجاج بدون جلد`
- `150غ صدر دجاج`
- `صدور دجاج 150غ`

should consolidate into one human-friendly chicken entry.

## WhatsApp flow

- share button lives inside the grocery zone
- button uses WhatsApp styling, not generic primary styling
- country selection should update the flag instantly
- default country is detected from browser locale when possible
- fallback stays sensible
- phone preview updates live
- output uses `wa.me`
- message is grouped by grocery category

## Guidance widget

- maximum 3 suggestions
- icon + sentence rows only
- light editorial tone
- distinct tinted shell from the grocery and planner surfaces

## Settings containment rules

Keep these in settings, not the main dashboard:

- regenerate week
- destructive delete/reset actions
- diagnostics/admin controls

Remove from the main planner surface:

- duplicate management actions
- low-value graphs
- quick-action clutter
- redundant labels and version noise

## RTL conventions for this module

- section titles on the right
- supporting subtitles on the right
- counts/meta opposite on the left only when helpful
- date pills, helper badges, and category chips that lead the row should appear first on the right in RTL, not as the trailing element of a mirrored LTR grid
- shopping rows: label right, quantity left
- generic RTL helper rows must not encode the meaning of the layout; meal planner rows should use explicit Arabic-first DOM order instead of `row-reverse` tricks
- drawer title block right
- drawer and modal helper text right
- settings and modal close controls follow explicit RTL placement, not defaults

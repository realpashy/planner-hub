# Meal Planner Dashboard Reference

This file defines the generated Meal Planner dashboard as the reference implementation for future Planner Hub modules.

## Final information architecture

The generated dashboard contains 4 primary zones only:

1. top bar
2. weekly planner
3. shopping list
4. weekly guidance

The day drawer is the secondary detail layer.

## Weekly planner structure

- the weekly planner is always a single vertical stacked flow
- no multi-column day grid
- each day is one planner card
- cards should scan naturally from top to bottom in RTL

## Day card structure

Each card contains:

- day title
- date
- meal preview list
- compact macro / nutrition row

Day cards should be:

- full-card clickable
- visually rich but not cluttered
- clearly differentiated from summary and grocery surfaces

Remove from unopened cards:

- progress widgets
- AI tip boxes
- loud gradients
- regenerate controls
- detached detail buttons

## Shopping list structure

The shopping list must render from a normalized shopping model, not raw ingredient strings.

Rules:

- group by supermarket-style categories
- item name on the right
- quantity on the left
- delete action appears cleanly on hover
- removed items persist for the active weekly plan only

### Grocery normalization behavior

- merge equivalent ingredient phrasing into one human-friendly grocery item
- aggregate grams or simple counts when possible
- keep distinctions only when they matter in real shopping
- output should feel like a supermarket list, not an AI ingredient dump

Examples of intended consolidation:

- `120غ صدر دجاج مشوي`
- `150غ صدر دجاج بدون جلد`
- `صدور دجاج 150غ`

should render as one normalized chicken entry with a combined approximate quantity.

## WhatsApp flow

- share action lives inside the shopping module
- button uses WhatsApp styling and iconography
- modal aligns fully right in RTL
- changing country code updates the flag immediately
- default country should be detected from browser locale when possible
- fallback remains sensible
- use `wa.me` link flow only
- the WhatsApp message should be grouped by shopping category

## Guidance widget

- lightweight only
- maximum 3 suggestions
- icon + short sentence
- no heavy boxed cards inside the zone

## Drawer structure

- right-aligned titles and content
- stronger hierarchy than the day card
- meal blocks with clean macro visibility
- actions remain contextual and secondary
- close and action placement must follow RTL conventions deliberately

## Settings containment rules

Keep these inside settings, not the main dashboard:

- regenerate week
- destructive reset/delete actions
- diagnostics/admin controls

Remove from the main dashboard:

- duplicate management actions
- version labels
- hydration widget cards
- broken or low-value graphs
- noisy quick actions

## RTL conventions for this module

- section titles right, meta/count opposite on the left
- drawer title block right, utility opposite
- settings close control left
- modal titles, labels, and helper text right
- shopping rows always render item right and quantity left

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

- use a single vertical stacked flow
- no multi-column grid
- each day is one card
- cards should scan naturally from top to bottom

## Day card structure

Each day card should contain:

- day name
- date
- meal preview list
- compact nutrition / macro tags

Remove from unopened cards:

- progress widgets
- AI tip boxes
- loud gradients
- repeated icon clusters
- detached detail buttons
- regenerate controls

## Shopping list structure

- grouped by supermarket-style categories
- item name on the right
- quantity on the left
- delete action appears cleanly on hover
- removed items persist for the active weekly plan only

## WhatsApp flow

- send action lives inside the shopping module
- open a modal
- default country code is `+972`
- normalize local Israeli numbers by removing leading `0` after `972`
- build one grouped Arabic message
- use `wa.me` link flow only

## Guidance widget

- lightweight only
- maximum 3 suggestions
- icon + short sentence
- no heavy boxed cards

## Drawer structure

- right-aligned titles and content
- strong section hierarchy
- clean meal blocks
- macros clearly visible
- actions remain contextual and secondary

## Moved to settings

- regenerate week
- destructive reset/delete actions
- advanced management / admin controls

## Removed from the main dashboard

- noisy quick actions
- version labels
- hydration widget cards
- broken or low-value graphs
- duplicate management actions

# Planner Hub Design System

This file is the visual reference for Planner Hub. Any new UI work must match this system before it is considered complete.

## Spacing scale

Use this rhythm first:

- `4`
- `8`
- `12`
- `16`
- `24`
- `32`

Avoid one-off spacing unless there is a clear structural reason.

## Border radius

- major cards and section shells: `rounded-2xl`
- inner surfaces and nested containers: `rounded-xl`
- pills, chips, micro-badges: `rounded-full`

## Shadow system

- base surface: soft shadow only
- hover state: slight elevation increase
- modal and drawer surfaces: stronger, deeper shadow than cards

Do not stack multiple loud shadows or use muddy dark glows.

## Typography hierarchy

- page title: large, bold, highest contrast
- section title: medium-large, bold
- card title: bold and compact
- body content: regular readable weight
- helper text / subtitle / meta: smaller and muted

Arabic product text should default to right alignment.

## Color usage

The product should not feel monochrome or like duplicated white cards.

Use restrained tinted surfaces by zone:

- overview strip: soft cool tint
- weekly planner cards: soft neutral with planner accent
- shopping list: fresh grocery tint
- guidance widget: warm or insight tint
- day drawer: elevated focused tint
- settings drawer: quiet administrative tint

Rules:

- use accent colors intentionally, not everywhere
- major zones should feel visually distinct
- avoid rainbow treatment
- avoid identical backgrounds for all sections
- gradients are allowed only when subtle and hierarchy-driven

## Card hierarchy

- page shell: calm, large framing surface
- zone shell: visually distinct but secondary to content
- card: compact, readable, premium
- inner sub-surface: quieter than the parent card

Every card family should feel related but not identical. Summary, day, grocery, guidance, and settings surfaces should not all look like the same template block.

## Stat card family rules

- all cards in one stat row must share the same height logic
- all cards in one stat row must share the same padding, radius, shadow, and typography hierarchy
- variation should come from icon-chip tint or a subtle accent, not from unrelated card bodies
- if one stat card looks more premium than the others, upgrade the others to match it

## Chip rules

- chips should be content-signaling, not decorative noise
- use dedicated chip tones by purpose:
  - neutral meta
  - meal type
  - macro
  - warning / repeated / shared ingredient
- selected or active states must not look identical to the primary navigation button

## Icon system

- use `lucide-react` for structural product UI
- keep icon size and visual weight consistent
- emoji are allowed only when directly tied to meal semantics, not for structural navigation
- brand icons may be custom only when the brand itself is the action, such as WhatsApp sharing

## Motion

- use `framer-motion`
- motion should be subtle, fast, and premium
- preferred patterns:
  - hover lift
  - drawer / modal reveal
  - list reveal
  - compact micro-state transitions

Avoid decorative or looping motion that creates anxiety or false progress.

## Mandatory reuse rule

Whenever building or changing UI:

1. Read this file first.
2. Reuse the same spacing, tint, radius, shadow, and motion logic.
3. Adjust the new UI if it feels flatter, louder, or more generic than the existing system.

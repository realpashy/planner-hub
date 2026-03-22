# Planner Hub Design System

This file is the default visual reference for Planner Hub modules.

## Spacing scale

- `4`
- `8`
- `12`
- `16`
- `24`
- `32`

Use this rhythm before introducing any new spacing value.

## Border radius

- cards: `rounded-2xl`
- inner containers: `rounded-xl`
- pills / badges / chips: `rounded-full`

## Shadows

- base surfaces: soft shadow only
- hover states: slight elevation increase
- drawers / sheets: stronger shadow than cards

Avoid heavy, muddy, or stacked shadows.

## Typography hierarchy

- page title: large, bold, high contrast
- section title: medium-large, bold
- content text: regular readable weight
- metadata: smaller and muted

Arabic layouts should default to right-aligned text for titles, body, and helper content.

## Color usage

- keep palette minimal
- accent color is for highlights and active emphasis only
- avoid decorative gradients unless they serve hierarchy clearly
- do not let utility areas compete with the planner itself

## Icon system

- use `lucide-react` for product UI
- keep icon stroke/style consistent
- emoji are optional only inside meal content where they add direct meaning
- avoid mixing unrelated icon families

## Motion

- use `framer-motion`
- keep motion subtle, fast, and premium
- preferred patterns:
  - hover lift
  - tap compression
  - open/close transitions
  - gentle list/card reveal

Avoid theatrical animation, bouncy motion, and decorative loading behavior.

## Mandatory reuse rule

Whenever building or changing UI:

1. Check this file first.
2. Match the same spacing, radius, shadow, icon, and motion system.
3. Adjust the new UI if it does not fit the system.

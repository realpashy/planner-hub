# Planner Hub Design System

This file is the visual source of truth for Planner Hub. New UI must match this implemented system, not default shadcn styling.

## Core tokens

### Dark-first palette

- primary: `#95df1e`
- primary foreground: `#000000`
- secondary: `#262626`
- secondary foreground: `#e5e5e5`
- accent: `#95df1e`
- accent foreground: `#000000`
- background: `#171717`
- foreground: `#e5e5e5`
- card: `#262626`
- card foreground: `#e5e5e5`
- popover: `#262626`
- popover foreground: `#e5e5e5`
- muted: `#262626`
- muted foreground: `#a3a3a3`
- destructive: `#ef4444`
- destructive foreground: `#ffffff`
- border: `#404040`
- input: `#404040`
- ring: `#9ddf36`

### Charts

- chart 1: `#6da01b`
- chart 2: `#a3f02b`
- chart 3: `#69991d`
- chart 4: `#68a505`
- chart 5: `#c6f789`

### Sidebar

- sidebar: `#171717`
- sidebar foreground: `#e5e5e5`
- sidebar primary: `#95df1e`
- sidebar primary foreground: `#000000`
- sidebar accent: `#95df1e`
- sidebar accent foreground: `#000000`
- sidebar border: `#404040`
- sidebar ring: `#95df1e`

### Light palette

- primary: `#95df1e`
- primary foreground: `#000000`
- secondary: `#f3f4f6`
- secondary foreground: `#4e583f`
- accent: `#eaffcf`
- accent foreground: `#000000`
- background: `#ffffff`
- foreground: `#333333`
- card: `#ffffff`
- card foreground: `#333333`
- popover: `#ffffff`
- popover foreground: `#333333`
- muted: `#f9fafb`
- muted foreground: `#6b7280`
- border: `#e5e7eb`
- input: `#e5e7eb`
- ring: `#95df1e`
- sidebar: `#f9fafb`
- sidebar foreground: `#333333`
- sidebar border: `#95df1e`
- sidebar ring: `#ffffff`

## Spacing scale

Use this scale first:

- `4`
- `8`
- `12`
- `16`
- `24`
- `32`

Avoid one-off spacing unless a real layout constraint requires it.

## Radius

- base radius token: `0.375rem`
- cards and section shells: around `radius + 0.5rem` to `radius + 1rem`
- inner surfaces: around `radius + 0.25rem` to `radius + 0.5rem`
- pills, chips, meta badges: `rounded-full`

## Shadow

Base system shadow:

- `2px 2px 1px 1px #0000000d`

Use it as the standard soft elevation layer. Larger shadows are allowed only for major hover states, modals, and drawers.

## Typography hierarchy

- page title: bold / black, high contrast, largest type in the section
- section title: bold, compact, clearly separated from body copy
- card title: bold, smaller than section title
- body: regular, readable line height
- helper/meta/subtitle: smaller and muted
- numeric highlight: bold or black, stronger than its label

Arabic content defaults to right alignment unless the content itself is numeric or intentionally LTR.

## Surface strategy

The app should feel dark, calm, and premium, not flat black and not neon.

Use a layered dark surface system:

- page shell: dark canvas with restrained radial tint
- section shell: elevated dark surface
- subtle shell: quieter inner surface
- accent shell: limited to high-signal callouts

Major zones should have restrained differentiation:

- dashboard / planner shell: neutral dark with lime radial highlight
- weekly summary surfaces: cool/neutral dark
- meal planner cards: slightly elevated neutral dark with selective food-tone accents
- grocery section: fresh market tint
- guidance section: warm insight tint
- drawers and dialogs: tighter focused dark surfaces

Do not make every surface the same charcoal block.

## Buttons

- primary buttons use lime background with black text
- secondary and outline buttons stay dark, elevated, and readable
- ghost buttons remain quiet but must still feel intentional
- destructive actions use red sparingly
- button states must be visible:
  - hover
  - focus
  - active
  - disabled

## Cards and stat families

- cards should feel compact, elevated, and readable
- avoid oversized empty space
- summary stat cards in the same row must feel like one family:
  - same height
  - same padding
  - same icon-chip treatment
  - same border/radius/shadow logic
  - same label/value hierarchy

## Chips and badges

- chips are for meaning, not decoration
- keep one consistent family for:
  - meta
  - date pills
  - macro chips
  - meal-type chips
  - warning/shared/repeated flags
- selected chips must not look identical to the app’s primary CTA unless selection is the main action
- in light theme, icon chips and key small-status chips may use the primary green background with black foreground when that improves scanability

## Icon system

- use `lucide-react` for app structure
- keep icon size and stroke visually consistent
- use custom brand icons only for actual brand actions, like WhatsApp
- emoji are allowed only for content semantics, not navigation or product chrome

## Motion

- use `framer-motion`
- keep motion subtle and fast
- preferred motion:
  - hover lift
  - fade/slide reveal
  - drawer open/close
  - compact progress or list transitions

Avoid decorative loops and fake progress behavior.

## Mandatory reuse rule

Whenever building or modifying UI:

1. Read this file first.
2. Reuse the exact token and surface system above.
3. Fix the component if it still feels like default shadcn or a disconnected mini-design system.

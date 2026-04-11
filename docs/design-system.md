# Planner Hub Design System

This file is the visual source of truth for Planner Hub. New UI must match this implemented system, not default shadcn styling.

## Current direction: Lumina Noir

Planner Hub now uses a **Lumina Noir** visual language for the shared app shell, dashboard, floating surfaces, and any newly built premium screens.

The intended feeling is:

- deep black canvas, not gray admin panels
- atmospheric depth through glow and tonal layers, not border boxes
- premium Arabic-first hierarchy
- sharp lime used as energy and focus, not as a generic fill color
- glassy overlays and utility chrome that feel modern and light

When a screen is choosing between the older border-led v0 treatment and the newer shell/dashboard language, the **Lumina Noir shell language wins** for:

- app shell
- home dashboard
- top bars
- sidebars and bottom navigation
- modals, drawers, tooltips, dropdowns
- shared card families that appear in cross-module surfaces

## Core tokens

### Dark-first palette

Primary shell/dashboard tokens:

- background: `#0e0e0e`
- card / module surface: `#171717` to `#1a1919`
- bright interaction surface: `#232323` to `#2c2c2c`
- foreground: `#f3f3f3`
- muted foreground: `#adaaaa`
- primary / sharp lime: `#c2fe4c`
- primary container: `#8fc708`
- secondary accent / violet: `#a68cff`
- tertiary alert / coral: `#ff9c7e`
- ghost border fallback: `rgba(119, 117, 115, 0.15)`
- ambient shadow: `0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 15px rgba(194, 254, 76, 0.05)`

Legacy module-specific tokens can continue to exist internally where a module has not been restyled yet, but new shared UI should start from the Lumina Noir palette first.

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

- primary: `#c2fe4c`
- primary foreground: `#000000`
- secondary: warm stone around `#e7e1d8`
- secondary foreground: `#433d35`
- accent: soft lime wash, not flat neon fill
- accent foreground: `#000000`
- background: warm canvas around `#f1ede8`
- foreground: `#2c2924`
- card: ivory surface around `#f8f4ed`
- card foreground: `#2c2924`
- popover: soft ivory around `#f3eee6`
- popover foreground: `#2c2924`
- muted: toned stone around `#e7e1d8`
- muted foreground: `#6f675d`
- border: warm ghost border around `#cfc4b8`
- input: warm ghost border around `#d6ccc0`
- ring: `#c2fe4c`
- sidebar: warm glass / taupe shell, not flat white
- sidebar foreground: `#2c2924`
- sidebar border: subtle warm outline, not neon
- sidebar ring: `#c2fe4c`

### Meal module light-theme surfaces

For light theme generally, do not fall back to pure white dashboards.

The light mode should feel like a softer Lumina Noir variant:

- warm stone page canvas
- ivory cards
- taupe or smoky glass shell surfaces
- restrained lime/violet atmospheric glow
- dark readable text with reduced glare

For the meal module in light theme, prefer a bright editorial hierarchy:

- page canvas: white with a faint neutral wash
- main shell: white card with subtle border and the base soft shadow
- overview and summary: white elevated panel with restrained lime wash only
- weekly cards: white elevated cards with lighter inner meal containers
- grocery and guidance: white shells with soft differentiated tint, not dark-first overlays copied into light mode
- popup: focused white detail surface with a softer modal shadow than dark mode

Lime green should stay a high-signal accent in light mode, not the fill color for every surface.

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
- main shell containers and large editorial dashboard cards may stretch up to `rounded-[1.5rem]` when that helps the premium hierarchy

## Shadow

Base system shadow:

- `2px 2px 1px 1px #0000000d`

Use it as the standard soft elevation layer. Larger shadows are allowed only for major hover states, modals, and drawers.

For Lumina Noir hero modules, the preferred elevation is an **ambient glow**, not a dark smudge:

- `0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 15px rgba(194, 254, 76, 0.05)`

If contrast is needed, prefer a ghost border over a visible border wall.

## Typography hierarchy

Typography pairing:

- Arabic UI: `IBM Plex Sans Arabic`
- Latin and numeric emphasis: `Plus Jakarta Sans`

- page title: bold / black, high contrast, largest type in the section
- section title: bold, compact, clearly separated from body copy
- card title: bold, smaller than section title
- body: regular, readable line height
- helper/meta/subtitle: smaller and muted
- numeric highlight: bold or black, stronger than its label

Arabic content defaults to right alignment unless the content itself is numeric or intentionally LTR.

For mixed Arabic + numeric surfaces:

- keep the wrapper Arabic-first and right-aligned
- isolate numbers with the Latin/numeric family only where needed
- do not let Latin font defaults leak into full Arabic title stacks

## Surface strategy

The app should feel dark, calm, and premium, not flat black and not neon.

Use a layered dark surface system:

- page shell: dark canvas with restrained radial tint
- section shell: elevated dark surface
- subtle shell: quieter inner surface
- accent shell: limited to high-signal callouts
- shell glass: semi-transparent dark surface with backdrop blur for top bars, dropdowns, dialogs, and search
- AI surface: a distinct premium surface with lime or violet atmospheric tint so AI never looks like a normal module card

Major zones should have restrained differentiation:

- dashboard / planner shell: neutral dark with lime radial highlight
- weekly summary surfaces: cool/neutral dark
- meal planner cards: slightly elevated neutral dark with selective food-tone accents
- grocery section: fresh market tint
- guidance section: warm insight tint
- drawers and dialogs: tighter focused dark surfaces
- meal planner popup details use a centered dialog with the same system scrollbar and do not fall back to a sidebar sheet

Do not make every surface the same charcoal block.

### The no-line rule

Heavy visible borders are not allowed on premium shell/dashboard surfaces.

Separate modules and cards using:

1. tonal background shifts
2. ambient glow
3. blur and transparency
4. negative space

Use a ghost border only when accessibility contrast truly needs reinforcement.

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

For Lumina Noir hero actions:

- the primary CTA may use a subtle neon outer glow
- the secondary CTA should feel glassy and premium, not like a flat outline button

## Cards and stat families

- cards should feel compact, elevated, and readable
- avoid oversized empty space
- primary dashboard cards should read as tonal modules, not bordered tiles
- summary stat cards in the same row must feel like one family:
  - same height
  - same padding
  - same icon-chip treatment
  - same border/radius/shadow logic
  - same label/value hierarchy
- in the meal module light theme, summary cards should read as clean white SaaS cards first, with accent only in icon chips and active highlights
- premium card headers that use a tinted or glowing top accent must size that tint to the real rendered header area, not to a short fixed height
- if a glow stops above the subtitle or badge stack, the header layer is wrong even if the card padding looks correct
- when the same header-tint pattern exists across modules, move it into a shared utility or shared card recipe instead of repeating one-off `h-*` overlays

### Lumina Noir shell card rules

- avoid internal divider lines inside premium cards
- use spacing or nested tonal blocks instead
- card headers should often include a small accent icon chip on the top-right in RTL
- AI cards may use a distinct grain, mesh, or atmospheric gradient layer to feel separate from standard module cards
- charts belong inside calm surfaces with strong negative space, not boxed mini-panels inside a bordered container

### RTL summary-card composition rule

For Hebrew/Arabic summary widgets, treat the card content as a single anchored cluster, not as "right-aligned text inside a full-width row".

- when a summary widget has an icon chip plus a text/value stack, the whole cluster should be authored as one RTL row
- the icon chip belongs on the right side first in the RTL reading order
- the text/value stack follows it and remains right-aligned internally
- avoid fixing these cards with random margin nudges or by pushing a full-width flex row with the wrong `justify-*` value
- do not default the inner text stack to `flex-col items-end` unless that cross-axis behavior is required; for summary cards this often breaks Hebrew/Arabic reading flow even when the text is visually on the right
- if the row uses `dir="rtl"`, remember:
  - `justify-start` places the cluster on the visual right
  - `justify-end` places the cluster on the visual left
- if the card still feels misaligned after a local JSX fix, inspect shared primitives such as `CardContent` for desktop padding or inherited layout defaults

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
- note surfaces such as helper reminders use the same `5px` radius, no visible border, smaller muted text, and a leading water-drop emoji marker instead of a heavy icon treatment

## Dropdowns and searchable selects

- Planner Hub should not use visible native browser `select` styling on product screens
- fixed-option dropdowns use the shared `ui/select.tsx` primitive with the same border, shadow, radius, and RTL text alignment as other form controls
- reusable typed values such as suppliers, payees, and similar saved labels should use a searchable/taggable dropdown pattern instead of raw `datalist`
- dropdown labels and trigger text remain right-aligned in RTL, while disclosure icons stay visually secondary
- if a dropdown option includes helper text on a second line, that helper line must remain high-contrast on hover, highlight, and checked states; muted helper text inside an active option is a UX bug
- for multi-line dropdown items, prefer a full-width right-aligned text wrapper instead of `flex-col items-end`, so Arabic/Hebrew text keeps the right internal flow

## Icon system

- use `lucide-react` for app structure
- keep icon size and stroke visually consistent
- use custom brand icons only for actual brand actions, like WhatsApp
- emoji are allowed only for content semantics, not navigation or product chrome
- inside the meal planner, structural icon chips should use one consistent primary-green family rather than mixing unrelated accent colors across similar rows

## Motion

- use `framer-motion`
- keep motion subtle and fast
- preferred motion:
  - hover lift
  - fade/slide reveal
  - drawer open/close
  - compact progress or list transitions

Avoid decorative loops and fake progress behavior.

For the app shell and dashboard:

- sidebar collapse/expand should feel smooth and architectural, not springy or playful
- hover elevation should be short and restrained
- glowing elements should not pulse endlessly
- mobile bottom navigation should feel responsive and premium without bouncing

## Shell layout rules

Planner Hub now uses a shared shell.

- desktop navigation lives in a permanent **right sidebar**
- mobile navigation uses a **fixed bottom navigation**
- top utility chrome uses a glassy top bar, not module tabs
- module pages live inside the shell content region
- settings belongs to the same shell system

Do not reintroduce ad hoc top navigation bars for module switching on authenticated screens.

## Mandatory reuse rule

Whenever building or modifying UI:

1. Read this file first.
2. Reuse the exact token and surface system above.
3. Fix the component if it still feels like default shadcn or a disconnected mini-design system.

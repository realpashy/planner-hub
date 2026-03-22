# UX & Interaction Principles

Planner Hub uses **shadcn/ui as the official design system** for all current and future modules. New UI must be built from shared components first, not from one-off Tailwind-only patterns.

## Mandatory system rules

- All modules must be highly interactive. Static UI blocks without state feedback are not acceptable.
- All repeated UI patterns must use shared components.
- Laws of UX are mandatory decision frameworks, not optional guidance.
- The interface must reduce cognitive load, reduce visible choices, and increase clarity.
- Progressive disclosure is the default approach for dense workflows.
- Every meaningful action must provide visible feedback.

## Laws of UX in practice

- `Hick's Law`: reduce concurrent visible choices and keep each step focused.
- `Progressive Disclosure`: show advanced content only when the user asks for it.
- `Fitts's Law`: make primary actions large, reachable, and visually obvious.
- `Jakob's Law`: follow familiar tab, card, dialog, form, and sheet patterns.
- `Miller's Law`: keep visible chunks small and scan-friendly.
- `Aesthetic-Usability Effect`: polish, spacing, and hierarchy are part of usability.
- `Law of Proximity` and `Law of Common Region`: related controls must be grouped inside clear shared containers.
- `Tesler's Law`: move complexity to the system through defaults, smart generation, and helper actions.
- `Goal-Gradient Effect`: show progress, completion, and next-step momentum.
- `Feedback Principle`: loading, hover, focus, active, success, error, and empty states are required.

## Official shared component layer

All repeated patterns must be routed through the shared UI layer:

- `InteractiveButton` for all buttons
- `InteractiveCard` for all cards and selectable panels
- `LoadingSkeleton` for loading placeholders
- `EmptyState` for no-data or blocked states
- `FeedbackToast` for user-facing feedback

Domain components must derive from these shared building blocks instead of re-implementing them. Examples:

- `MealCard`
- `DayCard`

## Interaction requirements

Every shared or module component must support, where relevant:

- hover state
- keyboard focus state
- active / pressed state
- selected state
- disabled state
- loading state
- success / error feedback
- empty state
- expand / click behavior for detailed content

## Design system enforcement

- shadcn/ui is the primary UI system for buttons, cards, inputs, dialogs, sheets, forms, dropdowns, tabs, and related controls.
- Do not mix unrelated UI systems into Planner Hub.
- Do not build raw UI from scratch when a shadcn primitive exists.
- Shared tokens for spacing, radius, color, and typography must stay consistent across modules.
- RTL behavior must be preserved in all shared components and all module UIs.

## Planner Hub visual system

- Planner Hub must feel custom-designed, not assembled from default shadcn examples.
- The Meal Planner redesign is the reference implementation for future modules.
- Every screen should use intentional visual layers:
  - canvas/background surface
  - module shell
  - elevated hero/detail surface
  - lighter secondary utility surface
- Different component families must look meaningfully different:
  - hero overview
  - planner/day cards
  - drawer/detail meal cards
  - grocery/utility modules
  - suggestion/editorial modules
- Avoid repeating the same border, shadow, radius, and background treatment across unrelated sections.

## RTL-first rules

- Set `dir="rtl"` at the module root for Arabic experiences.
- Prefer logical layout patterns and avoid casual left/right hardcoding in visible UI.
- Directional icons must be intentionally mirrored or chosen for RTL.
- Headers, chips, actions, metadata rows, sheets, and timeline/detail flows must be visually correct in RTL.
- Contextual controls must align to RTL reading order, not copied LTR layouts.

## Hierarchy and density

- The top section must establish a clear focal point before secondary content.
- Every section must justify its height and width; oversized low-value containers are not acceptable.
- Summary comes first; rich detail appears on interaction.
- Dense cards should stay scanable through icons, pills, and concise metadata instead of long paragraphs.
- Drawers/sheets are the premium detail stage and should carry richer content than the main grid.

## Motion rules

- Motion is part of the product feel, not decoration.
- Use motion to guide attention, confirm interaction, and improve perceived responsiveness.
- Preferred patterns:
  - staggered reveals
  - hover lift
  - tap compression
  - layout animations for expand/collapse
  - drawer slide/fade
  - skeleton-to-content transitions
- Motion must stay fast, soft, premium, and never block usability.

## Light and dark theme rules

- Both themes must be art-directed intentionally.
- Light mode should feel airy, crisp, and premium with clear separation between shell, hero, and secondary modules.
- Dark mode should use layered charcoal/graphite surfaces with restrained glow and avoid muddy gray repetition.
- Do not simply invert colors; tune contrast, chips, borders, and shadows per theme.

## Icon and asset rules

- Use Lucide React, Heroicons, or custom SVG accents for structure and scanability.
- Prefer icons and elegant placeholders over inconsistent random thumbnails.
- If imagery is used, it must be small, consistent, and secondary.
- Free/open assets only.

## Anti-patterns to avoid

- repeated default cards everywhere
- card-inside-card-inside-card composition
- the same muted border on every section
- giant empty containers
- detached contextual actions
- flat admin-dashboard composition
- form-like grocery panels
- decorative motion with no UX purpose

## Contextual action rule

- Contextual actions must live inside the component they affect.
- Examples:
  - meal swap and regenerate-meal actions live inside the meal card
  - day regenerate action lives inside the day card or drawer header
  - drawer-specific actions stay in the drawer, not detached at page bottom

## Scope

These standards apply to:

- Meal Planner
- Weekly Planner
- Budgeting
- Dashboard
- all future modules and shared components by default

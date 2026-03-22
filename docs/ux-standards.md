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

## Scope

These standards apply to:

- Meal Planner
- Weekly Planner
- Budgeting
- Dashboard
- all future modules and shared components by default

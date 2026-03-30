# Habits Tracker Module

## 1. Overview
Habits Tracker is a daily-use module inside Planner Hub designed for fast, guilt-free consistency tracking. It combines healthy habits, self-development habits, light mood check-ins, simple in-app reminders, and visible premium AI placeholders without turning into a heavy productivity or medical product.

The module is intentionally optimized for:
- one-screen clarity
- Arabic-first RTL interaction
- mobile-first daily check-ins
- premium dark-first SaaS presentation
- simple local-first state for the current MVP

## 2. Goals
- Help users complete daily habits with minimal friction.
- Show progress in a visually satisfying way without overwhelming detail.
- Make today’s state obvious at a glance: what is done, what is left, and how the user feels.
- Encourage consistency through streaks, summaries, and gentle reminders.
- Surface future premium AI value without pretending the feature is already available.

## 3. Target User
- Arabic-first users who want a simple, attractive daily habit experience.
- Users who track both wellness and self-improvement habits.
- Users who prefer fast interaction over deep configuration.
- Users who need motivation and visual clarity, not complex productivity systems.

## 4. Key Use Cases
- Open the dashboard and complete today’s habits in under one minute.
- Log a quick mood for the day with one tap.
- Create habits for binary, count-based, or duration-based routines.
- Edit, pause, or remove habits without losing control of the interface.
- Review weekly and monthly consistency without reading complicated analytics.
- See locked AI coaching ideas and understand the premium direction.

## 5. Feature Breakdown

### Dashboard
- Today’s habits list
- completion progress ring
- mood selector
- reminder banner based on incomplete habits with reminder times
- quick actions to add a habit or jump to the habits list

### Habits
- create, edit, delete habits
- habit types:
  - binary
  - count
  - duration
- category system for healthier visual grouping
- fast daily logging controls

### Insights
- weekly completion trend
- monthly completion summary
- category performance snapshot
- mood distribution summary

### AI Coach
- locked premium feature cards only
- no fake AI functionality in MVP

## 6. User Flows

### Daily check-in
1. User opens Habits Tracker.
2. Dashboard shows today’s completion progress and remaining habits.
3. User taps binary habits or increments count/duration habits.
4. User selects a mood in one tap.
5. Reminders update automatically as habits are completed.

### Create habit
1. User taps add habit.
2. Form opens in an RTL-first sheet.
3. User chooses category, type, target, and optional reminder.
4. User saves.
5. New habit appears immediately in the dashboard and habits list.

### Edit habit
1. User opens a habit from the list or dashboard.
2. User updates the habit fields or deletes the habit.
3. The module recalculates progress, streaks, reminders, and insights.

### Review insights
1. User opens Insights.
2. Weekly and monthly charts show completion patterns.
3. Summary cards explain progress in simple, motivational language.

### Explore AI premium
1. User opens AI Coach.
2. Locked premium cards show future features and value.
3. No AI actions are executed in MVP.

## 7. Data Structure

### Habit
- `id`
- `name`
- `description?`
- `category`
- `type`
- `target`
- `unit?`
- `emoji?`
- `reminderTime?`
- `createdAt`
- `updatedAt`

### Habit Log
- `id`
- `habitId`
- `date`
- `value`
- `completed`
- `createdAt`
- `updatedAt`

### Mood Log
- `date`
- `mood`

### Module State
- `habits`
- `logs`
- `moods`
- `lastUpdated`

## 8. UX Principles
- Daily use must feel fast and frictionless.
- Progress should motivate, not shame.
- Empty states should feel inviting, not broken.
- The dashboard should remain understandable with a single glance.
- Actions should require minimal taps.
- RTL must be structural, not patched later.

## 9. Design Principles
- Dark-first premium surfaces using Planner Hub tokens.
- Bold hierarchy with restrained color usage.
- Rounded cards, soft borders, and subtle glow accents.
- Strong right-anchored RTL content clusters.
- Numbers may opt into LTR direction when needed, but text clusters remain RTL.
- Motion should reinforce success and clarity, never distract.

## 10. Monetization
The module includes a visible premium AI Coach area, but it is locked in MVP.

Planned premium positioning:
- adaptive habit coaching
- consistency nudges
- weekly reflection summaries
- smart recovery suggestions after missed days

Current MVP behavior:
- AI cards are visible
- premium value is communicated
- no AI processing or fake responses are shown

## 11. Future Roadmap
- cloud sync and account-level persistence
- shared streak milestones
- richer reminder logic inside the app
- monthly habit challenges
- premium AI coach unlock
- integrations with broader Planner Hub goals and planning modules
- localization expansion beyond Arabic-first defaults

## Implementation Notes
- Current MVP uses local-first persistence in browser storage.
- Charts are deterministic and based only on user-entered habit logs.
- The module should stay lightweight and avoid turning into a productivity suite.
- Reusable RTL-safe layout patterns from `docs/design-system.md` and `docs/ux-standards.md` are the source of truth for alignment decisions.

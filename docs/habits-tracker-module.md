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
- live in-app reminder toast when the app is open and a reminder time is reached
- quick actions to add a habit or jump to the habits list

### Habits
- create, edit, delete habits
- habit types:
  - binary
  - count
  - duration
- completion style:
  - one-tap completion for habits that should only be marked done
  - gradual progress for habits that are better tracked numerically
- category system for healthier visual grouping
- fast daily logging controls

### Insights
- weekly completion trend
- monthly completion summary
- category performance snapshot
- mood distribution summary

### AI Coach
- one live AI coach brief based on the user’s current habits summary
- coach signals row for mood, pending habits, weekly average, and reminders
- automatic generation happens once per day
- manual refresh is limited to two updates per day from the refresh button
- focus habits inside the AI card can jump the user directly to the matching habit
- advanced premium AI cards remain visibly locked
- no open-ended chat interface
- no fake “magic” analytics beyond the available habit data

## 6. User Flows

### Daily check-in
1. User opens Habits Tracker.
2. Dashboard shows today’s completion progress and remaining habits.
3. User taps one-tap habits once, or increments progressive habits when numeric tracking is actually useful.
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
2. If there is already a coach brief for today, the cached brief is shown immediately.
3. If there is no brief for today yet, the module sends a compact habits summary to a server-side AI route.
4. The user receives one short Arabic coaching brief for the current day.
5. The refresh button can request up to two manual updates in the same day.
6. Clicking a focus habit from the AI card opens the matching habit context in the habits screen.
7. Advanced premium cards stay visible but locked.

## 7. Data Structure

### Habit
- `id`
- `name`
- `description?`
- `category`
- `type`
- `trackingMode`
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

### AI Coach Payload
- `generatedAt`
- `totalHabits`
- `completedToday`
- `pendingToday`
- `progressPercent`
- `bestStreak`
- `averagePercent`
- `bestDayLabel`
- `bestDayPercent`
- `todayMoodLabel?`
- `todayMoodHint?`
- `reminders[]`
- `habits[]`
- `categoryBreakdown[]`
- `weeklyTrend[]`

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

Current shipped behavior:
- one concise AI coach brief is available inside the AI tab
- the brief includes a clear win condition and a watch-out note for the current day
- the screen caches the latest brief locally when the daily state has not changed, to keep reloads fast
- the first AI generation is automatic once per day
- manual refresh is capped at two times per day
- deeper premium AI features remain locked and visible
- the AI brief is server-side and uses the current habits summary only
- there is no full conversational assistant yet

## 11. Future Roadmap
- cloud sync and account-level persistence
- shared streak milestones
- richer reminder logic inside the app
- monthly habit challenges
- deeper premium AI coach unlock
- integrations with broader Planner Hub goals and planning modules
- localization expansion beyond Arabic-first defaults

## Implementation Notes
- Current MVP uses local-first persistence in browser storage.
- Charts are deterministic and based only on user-entered habit logs.
- Duration habits can now be configured either as one-tap completion or as gradual numeric progress, depending on what feels more natural for the habit.
- In-app reminders are not push notifications:
  - they appear only while the user has the app open
  - they trigger once per habit per day when the reminder time has passed and the habit is still incomplete
  - each reminder toast can jump directly to the relevant habit
- The live AI brief uses server-side OpenAI when `OPENAI_API_KEY` is available.
- `OPENAI_HABITS_MODEL` can override the default habits AI model in server environments.
- If AI is unavailable, the server returns a safe deterministic fallback brief instead of breaking the screen.
- The module should stay lightweight and avoid turning into a productivity suite.
- Reusable RTL-safe layout patterns from `docs/design-system.md` and `docs/ux-standards.md` are the source of truth for alignment decisions.

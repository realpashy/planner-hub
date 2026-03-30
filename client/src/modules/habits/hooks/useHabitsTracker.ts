import { useEffect, useMemo, useState } from "react";
import type {
  HabitDefinition,
  HabitFormValues,
  HabitsState,
  MoodValue,
} from "@/modules/habits/types";
import {
  buildHabitFromValues,
  createEmptyHabitsState,
  deleteHabitLogs,
  getDashboardSummary,
  getMonthlySummary,
  getReminderItems,
  getTodayKey,
  getTodayMood,
  loadHabitsState,
  saveHabitsState,
  setMoodEntry,
  upsertHabitLog,
} from "@/modules/habits/utils/habits";

export function useHabitsTracker() {
  const [state, setState] = useState(loadHabitsState);

  useEffect(() => {
    saveHabitsState(state);
  }, [state]);

  const touchState = (updater: (previous: HabitsState) => HabitsState) => {
    setState((previous) => ({
      ...updater(previous),
      lastUpdated: new Date().toISOString(),
    }));
  };

  const todayKey = getTodayKey();

  const derived = useMemo(() => {
    const dashboard = getDashboardSummary(state);
    const reminders = getReminderItems(state);
    const insights = getMonthlySummary(state);
    const todayMood = getTodayMood(state);
    return {
      dashboard,
      reminders,
      insights,
      todayMood,
    };
  }, [state]);

  const actions = {
    saveHabit(values: HabitFormValues, existingHabit?: HabitDefinition) {
      const nextHabit = {
        ...buildHabitFromValues(values, existingHabit?.id),
        createdAt: existingHabit?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      touchState((previous) => ({
        ...previous,
        habits: existingHabit
          ? previous.habits.map((habit) => (habit.id === existingHabit.id ? nextHabit : habit))
          : [nextHabit, ...previous.habits],
      }));
    },
    deleteHabit(habitId: string) {
      touchState((previous) => ({
        ...previous,
        habits: previous.habits.filter((habit) => habit.id !== habitId),
        logs: deleteHabitLogs(previous.logs, habitId),
      }));
    },
    setHabitValue(habit: HabitDefinition, nextValue: number, date = todayKey) {
      touchState((previous) => ({
        ...previous,
        logs: upsertHabitLog(previous.logs, habit, date, nextValue),
      }));
    },
    toggleHabit(habit: HabitDefinition, date = todayKey) {
      touchState((previous) => ({
        ...previous,
        logs: upsertHabitLog(
          previous.logs,
          habit,
          date,
          (previous.logs.find((log) => log.habitId === habit.id && log.date === date)?.value ?? 0) >= 1
            ? 0
            : habit.target,
        ),
      }));
    },
    setMood(mood: MoodValue) {
      touchState((previous) => ({
        ...previous,
        moods: setMoodEntry(previous.moods, mood),
      }));
    },
    resetAll() {
      setState(createEmptyHabitsState());
    },
  };

  return {
    state,
    todayKey,
    ...derived,
    ...actions,
  };
}

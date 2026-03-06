import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlannerData, savePlannerData, type PlannerData } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";
import type { TaskItem, EventItem, DayTag, HabitItem, NoteItem } from "@shared/schema";

const QUERY_KEY = ["planner_data"];

export function usePlannerData() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      await new Promise(res => setTimeout(res, 100)); 
      return getPlannerData();
    },
  });
}

function useOptimisticMutation<TArg>(
  mutateFn: (data: PlannerData, arg: TArg) => void
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (arg: TArg) => {
      const data = getPlannerData();
      mutateFn(data, arg);
      savePlannerData(data);
    },
    onMutate: async (arg: TArg) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const previous = qc.getQueryData<PlannerData>(QUERY_KEY);
      if (previous) {
        const optimistic = JSON.parse(JSON.stringify(previous)) as PlannerData;
        mutateFn(optimistic, arg);
        qc.setQueryData(QUERY_KEY, optimistic);
      }
      return { previous };
    },
    onError: (_err, _arg, context) => {
      if (context?.previous) {
        qc.setQueryData(QUERY_KEY, context.previous);
      }
    },
  });
}

export function useCreateTask() {
  return useOptimisticMutation<Omit<TaskItem, "id">>((data, task) => {
    data.tasks.push({ ...task, id: uuidv4() });
  });
}

export function useUpdateTask() {
  return useOptimisticMutation<Partial<TaskItem> & { id: string }>((data, { id, ...updates }) => {
    data.tasks = data.tasks.map(t => t.id === id ? { ...t, ...updates } : t);
  });
}

export function useDeleteTask() {
  return useOptimisticMutation<string>((data, id) => {
    data.tasks = data.tasks.filter(t => t.id !== id);
  });
}

export function useCreateEvent() {
  return useOptimisticMutation<Omit<EventItem, "id">>((data, event) => {
    data.events.push({ ...event, id: uuidv4() });
  });
}

export function useUpdateEvent() {
  return useOptimisticMutation<Partial<EventItem> & { id: string }>((data, { id, ...updates }) => {
    data.events = data.events.map(e => e.id === id ? { ...e, ...updates } : e);
  });
}

export function useDeleteEvent() {
  return useOptimisticMutation<string>((data, id) => {
    data.events = data.events.filter(e => e.id !== id);
  });
}

export function useCreateTag() {
  return useOptimisticMutation<Omit<DayTag, "id">>((data, tag) => {
    data.tags.push({ ...tag, id: uuidv4() });
  });
}

export function useDeleteTag() {
  return useOptimisticMutation<string>((data, id) => {
    data.tags = data.tags.filter(t => t.id !== id);
  });
}

export function useToggleHabitDay() {
  return useOptimisticMutation<{ id: string, dateISO: string }>((data, { id, dateISO }) => {
    const habit = data.habits.find(h => h.id === id);
    if (habit) {
      const idx = habit.completedDates.indexOf(dateISO);
      if (idx >= 0) habit.completedDates.splice(idx, 1);
      else habit.completedDates.push(dateISO);
    }
  });
}

export function useCreateHabit() {
  return useOptimisticMutation<string>((data, name) => {
    data.habits.push({ id: uuidv4(), name, completedDates: [] });
  });
}

export function useDeleteHabit() {
  return useOptimisticMutation<string>((data, id) => {
    data.habits = data.habits.filter(h => h.id !== id);
  });
}

export function useSaveNote() {
  return useOptimisticMutation<Omit<NoteItem, "id">>((data, note) => {
    const existingIdx = data.notes.findIndex(n => n.date === note.date);
    if (existingIdx >= 0) {
      data.notes[existingIdx].content = note.content;
    } else {
      data.notes.push({ ...note, id: uuidv4() });
    }
  });
}

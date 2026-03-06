import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlannerData, savePlannerData, type PlannerData } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";
import type { TaskItem, EventItem, DayTag, HabitItem, NoteItem } from "@shared/schema";

const QUERY_KEY = ["planner_data"];

// Base hook to get all data
export function usePlannerData() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      // Small artificial delay to ensure smooth loading states visually
      await new Promise(res => setTimeout(res, 100)); 
      return getPlannerData();
    },
  });
}

// MUTATIONS
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: Omit<TaskItem, "id">) => {
      const data = getPlannerData();
      const newTask = { ...task, id: uuidv4() };
      data.tasks.push(newTask);
      savePlannerData(data);
      return newTask;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY })
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaskItem> & { id: string }) => {
      const data = getPlannerData();
      data.tasks = data.tasks.map(t => t.id === id ? { ...t, ...updates } : t);
      savePlannerData(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY })
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const data = getPlannerData();
      data.tasks = data.tasks.filter(t => t.id !== id);
      savePlannerData(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY })
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: Omit<EventItem, "id">) => {
      const data = getPlannerData();
      const newEvent = { ...event, id: uuidv4() };
      data.events.push(newEvent);
      savePlannerData(data);
      return newEvent;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY })
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const data = getPlannerData();
      data.events = data.events.filter(e => e.id !== id);
      savePlannerData(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY })
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tag: Omit<DayTag, "id">) => {
      const data = getPlannerData();
      const newTag = { ...tag, id: uuidv4() };
      data.tags.push(newTag);
      savePlannerData(data);
      return newTag;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY })
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const data = getPlannerData();
      data.tags = data.tags.filter(t => t.id !== id);
      savePlannerData(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY })
  });
}

export function useToggleHabitDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dateISO }: { id: string, dateISO: string }) => {
      const data = getPlannerData();
      const habit = data.habits.find(h => h.id === id);
      if (habit) {
        const idx = habit.completedDates.indexOf(dateISO);
        if (idx >= 0) habit.completedDates.splice(idx, 1);
        else habit.completedDates.push(dateISO);
        savePlannerData(data);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY })
  });
}

export function useCreateHabit() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (name: string) => {
        const data = getPlannerData();
        const newHabit = { id: uuidv4(), name, completedDates: [] };
        data.habits.push(newHabit);
        savePlannerData(data);
        return newHabit;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY })
    });
}

export function useDeleteHabit() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        const data = getPlannerData();
        data.habits = data.habits.filter(h => h.id !== id);
        savePlannerData(data);
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY })
    });
  }

export function useSaveNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note: Omit<NoteItem, "id">) => {
      const data = getPlannerData();
      const existingIdx = data.notes.findIndex(n => n.date === note.date);
      if (existingIdx >= 0) {
        data.notes[existingIdx].content = note.content;
      } else {
        data.notes.push({ ...note, id: uuidv4() });
      }
      savePlannerData(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY })
  });
}

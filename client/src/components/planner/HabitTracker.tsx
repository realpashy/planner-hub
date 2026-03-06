import React, { useState } from "react";
import { HabitItem } from "@shared/schema";
import { getWeekDays, formatISODate, getArabicDay } from "@/lib/date-utils";
import { useCreateHabit, useToggleHabitDay, useDeleteHabit } from "@/hooks/use-planner";
import { Activity, Plus, Check, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { ResponsiveConfirm } from "../ResponsiveConfirm";

export function HabitTracker({ habits, weekStart }: { habits: HabitItem[], weekStart: Date }) {
  const weekDays = getWeekDays(weekStart);
  const toggleHabit = useToggleHabitDay();
  const createHabit = useCreateHabit();
  const deleteHabit = useDeleteHabit();

  const [newHabitName, setNewHabitName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    if (newHabitName.trim()) {
      createHabit.mutate(newHabitName.trim());
      setNewHabitName("");
    }
  };

  return (
    <div className="mb-8 p-5 bg-white rounded-3xl border border-slate-100 card-shadow overflow-hidden">
      <div className="flex items-center gap-2 text-slate-700 mb-6">
        <Activity className="w-5 h-5 text-indigo-500" />
        <h3 className="font-bold text-lg">متتبع العادات</h3>
      </div>

      <div className="overflow-x-auto hide-scrollbar pb-2">
        <div className="min-w-[600px]">
          {/* Header Row */}
          <div className="flex items-center mb-3 text-sm font-bold text-slate-400">
            <div className="w-[30%]">العادة</div>
            <div className="flex-1 flex justify-between px-2">
              {weekDays.map(date => (
                <div key={date.toISOString()} className="w-8 text-center">{getArabicDay(date).charAt(2)}</div>
              ))}
            </div>
            <div className="w-8"></div>
          </div>

          {/* Habits */}
          {habits.map(habit => {
            // Check if all 7 days in this week are completed
            const weekISODates = weekDays.map(d => formatISODate(d));
            const completedThisWeek = weekISODates.filter(iso => habit.completedDates.includes(iso)).length;
            const isPerfect = completedThisWeek === 7;

            return (
              <motion.div 
                key={habit.id}
                layout
                className={`group flex items-center mb-2 p-2 rounded-xl transition-colors ${isPerfect ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
              >
                <div className="w-[30%] font-semibold text-slate-700 truncate pl-2">{habit.name}</div>
                <div className="flex-1 flex justify-between px-2">
                  {weekDays.map(date => {
                    const iso = formatISODate(date);
                    const isDone = habit.completedDates.includes(iso);
                    return (
                      <button
                        key={iso}
                        onClick={() => toggleHabit.mutate({ id: habit.id, dateISO: iso })}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${isDone ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20 scale-110' : 'bg-slate-100 text-transparent hover:bg-slate-200'}`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
                <button 
                  onClick={() => setDeleteId(habit.id)}
                  className="w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
          
          {/* Add Habit */}
          <div className="flex items-center p-2 mt-2 border-t border-slate-100">
            <div className="w-[30%] pr-2">
              <input 
                type="text" 
                value={newHabitName}
                onChange={e => setNewHabitName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="عادة جديدة..."
                className="w-full bg-transparent text-sm font-medium focus:outline-none placeholder:text-slate-400 text-slate-700"
              />
            </div>
            <button 
              onClick={handleAdd}
              disabled={!newHabitName.trim()}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-600 font-semibold text-xs rounded-lg disabled:opacity-50"
            >
              إضافة
            </button>
          </div>
        </div>
      </div>

      <ResponsiveConfirm 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteHabit.mutate(deleteId)}
        title="حذف العادة"
        description="هل أنت متأكد؟ سيتم حذف سجل هذه العادة بالكامل."
      />
    </div>
  );
}

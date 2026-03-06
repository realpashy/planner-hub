import { useState } from "react";
import type { HabitItem } from "@shared/schema";
import { getWeekDays, formatISODate, getDayShortName } from "@/lib/date-utils";
import { useCreateHabit, useToggleHabitDay, useDeleteHabit } from "@/hooks/use-planner";
import { Activity, Plus, Check, Trash2, Sparkles } from "lucide-react";
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

  const totalHabitChecks = habits.length * 7;
  const completedHabitChecks = habits.reduce((sum, h) => {
    const weekISOs = weekDays.map(d => formatISODate(d));
    return sum + weekISOs.filter(iso => h.completedDates.includes(iso)).length;
  }, 0);
  const habitProgress = totalHabitChecks === 0 ? 0 : Math.round((completedHabitChecks / totalHabitChecks) * 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4" data-testid="habit-tracker">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center">
            <Activity className="w-4 h-4 text-violet-600" />
          </div>
          <h3 className="font-bold text-base text-slate-800">متتبع العادات</h3>
        </div>
        {habits.length > 0 && (
          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{habitProgress}%</span>
        )}
      </div>

      {habits.length > 0 && (
        <div className="w-full bg-slate-100 h-1 rounded-full mb-4 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${habitProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full rounded-full bg-violet-500"
          />
        </div>
      )}

      <div className="overflow-x-auto hide-scrollbar">
        <div className="min-w-[480px]">
          <div className="flex items-center mb-2 text-[11px] font-bold text-slate-400 uppercase">
            <div className="w-[35%] pr-2">العادة</div>
            <div className="flex-1 flex">
              {weekDays.map(date => (
                <div key={date.toISOString()} className="flex-1 text-center">{getDayShortName(date)}</div>
              ))}
            </div>
            <div className="w-7"></div>
          </div>

          {habits.map(habit => {
            const weekISODates = weekDays.map(d => formatISODate(d));
            const completedThisWeek = weekISODates.filter(iso => habit.completedDates.includes(iso)).length;
            const isPerfect = completedThisWeek === 7;

            return (
              <motion.div
                key={habit.id}
                layout
                className={`group flex items-center py-2 px-1 rounded-xl mb-1 transition-colors duration-300 ${isPerfect ? 'bg-violet-50/80' : 'hover:bg-slate-50/50'}`}
                data-testid={`habit-row-${habit.id}`}
              >
                <div className="w-[35%] pr-2 flex items-center gap-1.5">
                  {isPerfect && <Sparkles className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />}
                  <span className={`text-sm font-semibold truncate ${isPerfect ? 'text-violet-700' : 'text-slate-700'}`}>{habit.name}</span>
                </div>
                <div className="flex-1 flex">
                  {weekDays.map(date => {
                    const iso = formatISODate(date);
                    const isDone = habit.completedDates.includes(iso);
                    return (
                      <div key={iso} className="flex-1 flex justify-center">
                        <button
                          onClick={() => toggleHabit.mutate({ id: habit.id, dateISO: iso })}
                          className={`
                            w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200
                            ${isDone
                              ? 'bg-violet-500 text-white shadow-sm'
                              : 'bg-slate-100 text-transparent hover:bg-slate-200'}
                          `}
                          data-testid={`habit-checkbox-${habit.id}-${iso}`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => setDeleteId(habit.id)}
                  className="w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                  data-testid={`button-delete-habit-${habit.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}

          <div className="flex items-center gap-2 pt-2 mt-2 border-t border-slate-100/80">
            <div className="w-[35%] pr-2">
              <input
                type="text"
                value={newHabitName}
                onChange={e => setNewHabitName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="عادة جديدة..."
                className="w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-300 text-slate-700"
                data-testid="input-new-habit"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!newHabitName.trim()}
              className="px-2.5 py-1 bg-violet-50 text-violet-600 font-semibold text-xs rounded-lg disabled:opacity-40 hover:bg-violet-100 transition-colors"
              data-testid="button-add-habit"
            >
              <Plus className="w-3.5 h-3.5" />
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

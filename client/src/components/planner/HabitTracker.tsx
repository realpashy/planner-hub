import { useState } from "react";
import type { HabitItem } from "@shared/schema";
import { getWeekDays, formatISODate, getDayShortName } from "@/lib/date-utils";
import { useCreateHabit, useToggleHabitDay, useDeleteHabit } from "@/hooks/use-planner";
import { Activity, Plus, Check, Trash2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ResponsiveConfirm } from "../ResponsiveConfirm";

function getHabitEmoji(name: string): string | undefined {
  if (name.includes('ماء') || name.includes('شرب')) return '💧';
  if (name.includes('رياض') || name.includes('تمرين') || name.includes('مشي') || name.includes('جري')) return '💪';
  if (name.includes('قراء') || name.includes('كتاب')) return '📚';
  if (name.includes('تأمل') || name.includes('يوغا')) return '🧘';
  if (name.includes('نوم') || name.includes('استيقاظ')) return '😴';
  if (name.includes('فيتامين') || name.includes('دواء')) return '💊';
  if (name.includes('صلا') || name.includes('دعاء')) return '🤲';
  if (name.includes('فاكه') || name.includes('خضار') || name.includes('أكل')) return '🥗';
  if (name.includes('دراس') || name.includes('تعلم') || name.includes('لغة')) return '📖';
  if (name.includes('تدوين')) return '✍️';
  return undefined;
}

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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 md:p-5" data-testid="habit-tracker">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-violet-50 dark:bg-violet-500/15 flex items-center justify-center">
            <Activity className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="font-bold text-base md:text-lg text-slate-800 dark:text-slate-100">متتبع العادات</h3>
        </div>
        {habits.length > 0 && (
          <span className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-0.5 rounded-full">{habitProgress}%</span>
        )}
      </div>

      {habits.length > 0 && (
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mb-4 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${habitProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full rounded-full bg-violet-500"
          />
        </div>
      )}

      <div className="space-y-3">
        {habits.map(habit => {
          const weekISODates = weekDays.map(d => formatISODate(d));
          const completedThisWeek = weekISODates.filter(iso => habit.completedDates.includes(iso)).length;
          const isPerfect = completedThisWeek === 7;
          const emoji = getHabitEmoji(habit.name);

          return (
            <motion.div
              key={habit.id}
              layout
              className={`group rounded-xl p-3 transition-colors duration-300 ${isPerfect ? 'bg-violet-50/80 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20' : 'bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/60 dark:border-slate-800'}`}
              data-testid={`habit-row-${habit.id}`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {emoji && <span className="text-base flex-shrink-0">{emoji}</span>}
                  {isPerfect && !emoji && <Sparkles className="w-4 h-4 text-violet-500 flex-shrink-0" />}
                  <span className={`text-sm font-bold ${isPerfect ? 'text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-200'}`}>{habit.name}</span>
                  <span className="text-[10px] font-semibold text-slate-300 dark:text-slate-600 mr-auto">{completedThisWeek}/7</span>
                </div>
                <button
                  onClick={() => setDeleteId(habit.id)}
                  className="w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0"
                  data-testid={`button-delete-habit-${habit.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="flex gap-1.5">
                {weekDays.map(date => {
                  const iso = formatISODate(date);
                  const isDone = habit.completedDates.includes(iso);
                  return (
                    <div key={iso} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-none">
                        {getDayShortName(date)}
                      </span>
                      <div
                        role="checkbox"
                        aria-checked={isDone}
                        tabIndex={0}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); toggleHabit.mutate({ id: habit.id, dateISO: iso }); }}
                        onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); toggleHabit.mutate({ id: habit.id, dateISO: iso }); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleHabit.mutate({ id: habit.id, dateISO: iso }); } }}
                        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
                        className={`
                          w-full aspect-square max-w-[32px] rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer select-none
                          ${isDone
                            ? 'bg-violet-500 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}
                        `}
                        data-testid={`habit-checkbox-${habit.id}-${iso}`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        <div className="flex items-center gap-2 pt-2 mt-1 border-t border-slate-100/80 dark:border-slate-800">
          <input
            type="text"
            value={newHabitName}
            onChange={e => setNewHabitName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="عادة جديدة..."
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-700 dark:text-slate-200"
            data-testid="input-new-habit"
          />
          <button
            onClick={handleAdd}
            disabled={!newHabitName.trim()}
            className="px-3 py-1.5 bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 font-semibold text-xs rounded-lg disabled:opacity-40 hover:bg-violet-100 dark:hover:bg-violet-500/25 transition-colors"
            data-testid="button-add-habit"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
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

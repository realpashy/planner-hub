import { useState, useEffect, useCallback } from "react";
import type { TaskItem } from "@shared/schema";
import { formatISODate, getWeekDays } from "@/lib/date-utils";
import { useUpdateTask, useCreateTask, useDeleteTask } from "@/hooks/use-planner";
import { Plus, Trash2, ListTodo, Check, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { ResponsiveConfirm } from "../ResponsiveConfirm";

interface TaskListProps {
  tasks: TaskItem[];
  selectedDate: Date;
  isWeeklyMode?: boolean;
}

function AnimatedCheckbox({ checked, onChange, taskId }: { checked: boolean, onChange: () => void, taskId: string }) {
  return (
    <button
      onClick={onChange}
      className={`
        flex-shrink-0 w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center transition-all duration-200
        ${checked
          ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-500/25'
          : 'border-slate-300 hover:border-primary bg-white'}
      `}
      data-testid={`button-checkbox-${taskId}`}
    >
      {checked && (
        <svg viewBox="0 0 12 12" className="w-3 h-3 animate-check-pop">
          <path
            d="M2 6L5 9L10 3"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-check-draw"
          />
        </svg>
      )}
    </button>
  );
}

export function TaskList({ tasks, selectedDate, isWeeklyMode = false }: TaskListProps) {
  const dateISO = formatISODate(selectedDate);
  const weekDays = getWeekDays(selectedDate);
  const weekStartISO = formatISODate(weekDays[0]);

  const relevantTasks = isWeeklyMode
    ? tasks.filter(t => t.isWeekly)
    : tasks.filter(t => t.date === dateISO && !t.isWeekly);

  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();

  const [newTaskText, setNewTaskText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const completedCount = relevantTasks.filter(t => t.completed).length;
  const totalCount = relevantTasks.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  const [prevAllCompleted, setPrevAllCompleted] = useState(allCompleted);

  const triggerCelebration = useCallback(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#22C55E', '#4F46E5', '#F59E0B'],
      disableForReducedMotion: true,
    });
  }, []);

  useEffect(() => {
    if (allCompleted && !prevAllCompleted && totalCount > 0) {
      triggerCelebration();
    }
    setPrevAllCompleted(allCompleted);
  }, [allCompleted, prevAllCompleted, totalCount, triggerCelebration]);

  const handleAdd = () => {
    if (newTaskText.trim()) {
      createTask.mutate({
        date: isWeeklyMode ? weekStartISO : dateISO,
        text: newTaskText.trim(),
        completed: false,
        isWeekly: isWeeklyMode,
      });
      setNewTaskText("");
    }
  };

  return (
    <div
      className={`
        rounded-2xl transition-all duration-500
        ${isWeeklyMode
          ? 'bg-white border border-slate-100 shadow-sm p-4'
          : allCompleted
            ? 'animate-celebration-glow'
            : ''
        }
      `}
      data-testid={isWeeklyMode ? "weekly-tasks" : "daily-tasks"}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isWeeklyMode ? 'bg-primary/8' : 'bg-emerald-50'}`}>
            <ListTodo className={`w-4 h-4 ${isWeeklyMode ? 'text-primary' : 'text-emerald-600'}`} />
          </div>
          <h3 className="font-bold text-base text-slate-800">{isWeeklyMode ? 'مهام الأسبوع' : 'مهام اليوم'}</h3>
        </div>
        {totalCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">{completedCount}/{totalCount}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${allCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {progress}%
            </span>
          </div>
        )}
      </div>

      {totalCount > 0 && (
        <div className="w-full bg-slate-100 h-1 rounded-full mb-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full rounded-full transition-colors duration-300 ${allCompleted ? 'bg-emerald-500' : 'bg-primary'}`}
          />
        </div>
      )}

      {allCompleted && !isWeeklyMode && totalCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-bold px-3 py-2 rounded-xl mb-3"
        >
          <Trophy className="w-4 h-4" />
          <span>أحسنت! اكتمل اليوم</span>
        </motion.div>
      )}

      <div className="space-y-0.5">
        <AnimatePresence>
          {relevantTasks.map(task => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="group flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-slate-50/50 transition-colors"
              data-testid={`task-item-${task.id}`}
            >
              <AnimatedCheckbox
                checked={task.completed}
                onChange={() => updateTask.mutate({ id: task.id, completed: !task.completed })}
                taskId={task.id}
              />
              <span className={`flex-1 text-sm transition-all duration-300 ${task.completed ? 'text-slate-400 line-through opacity-60' : 'text-slate-700 font-medium'}`}>
                {task.text}
              </span>
              <button
                onClick={() => setDeleteId(task.id)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                data-testid={`button-delete-task-${task.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex items-center gap-3 pt-2 mt-1 border-t border-slate-100/80">
          <div className="p-0.5 text-slate-300"><Plus className="w-4 h-4" /></div>
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={isWeeklyMode ? "أضف مهمة أسبوعية..." : "أضف مهمة..."}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-slate-700 placeholder:text-slate-300"
            data-testid={isWeeklyMode ? "input-weekly-task" : "input-daily-task"}
          />
        </div>
      </div>

      <ResponsiveConfirm
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteTask.mutate(deleteId)}
        title="حذف المهمة"
        description="هل أنت متأكد من حذف هذه المهمة؟"
      />
    </div>
  );
}

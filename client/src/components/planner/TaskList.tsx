import React, { useState, useEffect } from "react";
import { TaskItem } from "@shared/schema";
import { formatISODate } from "@/lib/date-utils";
import { useUpdateTask, useCreateTask, useDeleteTask } from "@/hooks/use-planner";
import { CheckSquare, Square, Plus, Trash2, ListTodo } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { ResponsiveConfirm } from "../ResponsiveConfirm";

interface TaskListProps {
  tasks: TaskItem[];
  selectedDate: Date;
  isWeeklyMode?: boolean;
}

export function TaskList({ tasks, selectedDate, isWeeklyMode = false }: TaskListProps) {
  const dateISO = formatISODate(selectedDate);
  const relevantTasks = tasks.filter(t => isWeeklyMode ? t.isWeekly : (t.date === dateISO && !t.isWeekly));
  
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();

  const [newTaskText, setNewTaskText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const completedCount = relevantTasks.filter(t => t.completed).length;
  const totalCount = relevantTasks.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  // Track previous state to trigger confetti only once per completion
  const [prevAllCompleted, setPrevAllCompleted] = useState(allCompleted);

  useEffect(() => {
    if (allCompleted && !prevAllCompleted && totalCount > 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22C55E', '#4F46E5', '#F59E0B']
      });
    }
    setPrevAllCompleted(allCompleted);
  }, [allCompleted, prevAllCompleted, totalCount]);

  const handleAdd = () => {
    if (newTaskText.trim()) {
      createTask.mutate({
        date: dateISO,
        text: newTaskText.trim(),
        completed: false,
        isWeekly: isWeeklyMode
      });
      setNewTaskText("");
    }
  };

  return (
    <div className={`mb-8 p-5 rounded-3xl transition-colors duration-500 ${allCompleted && !isWeeklyMode ? 'bg-success/5 border border-success/20' : 'bg-white border border-slate-100 card-shadow'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-700">
          <ListTodo className={`w-5 h-5 ${isWeeklyMode ? 'text-primary' : 'text-success'}`} />
          <h3 className="font-bold text-lg">{isWeeklyMode ? 'مهام الأسبوع' : 'مهام اليوم'}</h3>
        </div>
        {totalCount > 0 && (
          <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${allCompleted ? 'bg-success text-white' : 'bg-slate-100 text-slate-500'}`}>
            {progress}%
          </span>
        )}
      </div>

      {totalCount > 0 && (
        <div className="w-full bg-slate-100 h-1.5 rounded-full mb-5 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full rounded-full ${allCompleted ? 'bg-success' : 'bg-primary'}`} 
          />
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence>
          {relevantTasks.map(task => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="group flex items-start gap-3 py-2"
            >
              <button 
                onClick={() => updateTask.mutate({ id: task.id, completed: !task.completed })}
                className={`mt-0.5 flex-shrink-0 transition-colors ${task.completed ? 'text-success' : 'text-slate-300 hover:text-primary'}`}
              >
                {task.completed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              </button>
              <span className={`flex-1 text-base transition-all duration-300 ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                {task.text}
              </span>
              <button 
                onClick={() => setDeleteId(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex items-center gap-3 pt-3 mt-3 border-t border-slate-100/50">
          <div className="p-1 text-slate-300"><Plus className="w-4 h-4" /></div>
          <input 
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={isWeeklyMode ? "أضف مهمة أسبوعية..." : "أضف مهمة جديدة..."}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
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

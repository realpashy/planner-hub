import { useState, useEffect, useCallback } from "react";
import type { TaskItem } from "@shared/schema";
import { formatISODate, getWeekDays } from "@/lib/date-utils";
import { useUpdateTask, useCreateTask, useDeleteTask } from "@/hooks/use-planner";
import { Plus, Trash2, ListTodo, Check, Trophy, Clock, X, Timer } from "lucide-react";
import { ExpandableText } from "./ExpandableText";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { ResponsiveConfirm } from "../ResponsiveConfirm";
import { Drawer } from "vaul";
import { useIsMobile } from "@/hooks/use-mobile";

interface TaskListProps {
  tasks: TaskItem[];
  selectedDate: Date;
  isWeeklyMode?: boolean;
}

function AnimatedCheckbox({ checked, onChange, taskId }: { checked: boolean, onChange: () => void, taskId: string }) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onChange(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(); } }}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
      className={`
        flex-shrink-0 w-[28px] h-[28px] rounded-md border-2 flex items-center justify-center transition-all duration-200 cursor-pointer select-none
        ${checked
          ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-500/25'
          : 'border-slate-300 dark:border-slate-600 hover:border-primary bg-white dark:bg-slate-900'}
      `}
      data-testid={`button-checkbox-${taskId}`}
    >
      {checked && (
        <svg viewBox="0 0 12 12" className="w-3.5 h-3.5 animate-check-pop">
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
    </div>
  );
}

function getDeadlineInfo(deadline: string): { label: string; color: string; urgent: boolean } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(deadline + "T00:00:00");
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `متأخر ${Math.abs(diffDays)} يوم`, color: "text-red-500 bg-red-50 dark:bg-red-500/15 border-red-200 dark:border-red-500/25", urgent: true };
  }
  if (diffDays === 0) {
    return { label: "اليوم", color: "text-red-500 bg-red-50 dark:bg-red-500/15 border-red-200 dark:border-red-500/25", urgent: true };
  }
  if (diffDays === 1) {
    return { label: "غدا", color: "text-amber-600 bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/25", urgent: true };
  }
  if (diffDays <= 3) {
    return { label: `${diffDays} أيام`, color: "text-amber-600 bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/25", urgent: false };
  }
  if (diffDays <= 7) {
    return { label: `${diffDays} أيام`, color: "text-blue-500 bg-blue-50 dark:bg-blue-500/15 border-blue-200 dark:border-blue-500/25", urgent: false };
  }
  return { label: `${diffDays} يوم`, color: "text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700", urgent: false };
}

interface AddTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string, deadline?: string) => void;
  initialText: string;
  isWeeklyMode: boolean;
}

function AddTaskContent({ onSubmit, onClose, initialText, isWeeklyMode }: Omit<AddTaskDialogProps, 'isOpen'>) {
  const [text, setText] = useState(initialText);
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState("");

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim(), hasDeadline && deadlineDate ? deadlineDate : undefined);
    setText("");
    setHasDeadline(false);
    setDeadlineDate("");
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = formatISODate(new Date());

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2 block">
          {isWeeklyMode ? "المهمة الأسبوعية" : "المهمة"}
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) handleSubmit(); }}
          placeholder={isWeeklyMode ? "أضف مهمة أسبوعية..." : "أضف مهمة..."}
          autoFocus
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm md:text-base text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all"
          data-testid="input-task-dialog-text"
        />
      </div>

      <div
        onPointerDown={(e) => { e.preventDefault(); setHasDeadline(!hasDeadline); }}
        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
          hasDeadline
            ? 'border-primary/30 bg-primary/5 dark:bg-primary/10'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        data-testid="toggle-deadline"
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          hasDeadline ? 'bg-primary/15 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
        }`}>
          <Timer className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <span className={`text-sm font-bold ${hasDeadline ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>
            موعد نهائي
          </span>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            إضافة تاريخ تسليم أو انتهاء
          </p>
        </div>
        <div className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ${
          hasDeadline ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
        }`}>
          <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            hasDeadline ? '-translate-x-4' : 'translate-x-0'
          }`} />
        </div>
      </div>

      <AnimatePresence>
        {hasDeadline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2 block">
              تاريخ الموعد النهائي
            </label>
            <input
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              min={minDate}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-sans text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
              data-testid="input-task-deadline"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary/20"
          data-testid="button-submit-task"
        >
          إضافة المهمة
        </button>
        <button
          onClick={onClose}
          className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          data-testid="button-cancel-task"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}

function AddTaskDialog({ isOpen, onClose, onSubmit, initialText, isWeeklyMode }: AddTaskDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[24px] fixed bottom-0 left-0 right-0 z-50 outline-none" dir="rtl">
            <div className="p-5 pb-8">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 mb-6" />
              <Drawer.Title className="font-bold text-lg text-slate-900 dark:text-slate-50 mb-4">
                {isWeeklyMode ? "مهمة أسبوعية جديدة" : "مهمة جديدة"}
              </Drawer.Title>
              <Drawer.Description className="sr-only">إضافة مهمة جديدة مع خيار تحديد موعد نهائي</Drawer.Description>
              <AddTaskContent onSubmit={onSubmit} onClose={onClose} initialText={initialText} isWeeklyMode={isWeeklyMode} />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl relative z-10"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {isWeeklyMode ? "مهمة أسبوعية جديدة" : "مهمة جديدة"}
              </h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors"
                data-testid="button-close-task-dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AddTaskContent onSubmit={onSubmit} onClose={onClose} initialText={initialText} isWeeklyMode={isWeeklyMode} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function TaskList({ tasks, selectedDate, isWeeklyMode = false }: TaskListProps) {
  const dateISO = formatISODate(selectedDate);
  const weekDays = getWeekDays(selectedDate);
  const weekStartISO = formatISODate(weekDays[0]);
  const weekISOs = weekDays.map(d => formatISODate(d));

  const relevantTasks = isWeeklyMode
    ? tasks.filter(t => t.isWeekly || weekISOs.includes(t.date))
    : tasks.filter(t => t.date === dateISO && !t.isWeekly);

  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();

  const [newTaskText, setNewTaskText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

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

  const openAddDialog = () => {
    setShowAddDialog(true);
  };

  const handleDialogSubmit = (text: string, deadline?: string) => {
    createTask.mutate({
      date: isWeeklyMode ? weekStartISO : dateISO,
      text,
      completed: false,
      isWeekly: isWeeklyMode,
      deadline,
    });
    setNewTaskText("");
    setShowAddDialog(false);
  };

  const handleQuickAdd = () => {
    if (newTaskText.trim()) {
      openAddDialog();
    }
  };

  return (
    <div
      className={`
        rounded-2xl transition-all duration-500
        ${isWeeklyMode
          ? 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm p-4 md:p-5'
          : allCompleted
            ? 'animate-celebration-glow'
            : ''
        }
      `}
      data-testid={isWeeklyMode ? "weekly-tasks" : "daily-tasks"}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isWeeklyMode ? 'bg-primary/8 dark:bg-primary/15' : 'bg-emerald-50 dark:bg-emerald-500/15'}`}>
            <ListTodo className={`w-4.5 h-4.5 ${isWeeklyMode ? 'text-primary' : 'text-emerald-600 dark:text-emerald-400'}`} />
          </div>
          <h3 className="font-bold text-base md:text-lg text-slate-800 dark:text-slate-100">{isWeeklyMode ? 'مهام الأسبوع' : 'مهام اليوم'}</h3>
        </div>
        {totalCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{completedCount}/{totalCount}</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${allCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              {progress}%
            </span>
          </div>
        )}
      </div>

      {totalCount > 0 && (
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mb-3 overflow-hidden">
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
          className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-sm font-bold px-3 py-2.5 rounded-xl mb-3"
        >
          <Trophy className="w-4 h-4" />
          <span>أحسنت! اكتمل اليوم</span>
        </motion.div>
      )}

      <div className="space-y-0.5">
        <AnimatePresence>
          {relevantTasks.map(task => {
            const deadlineInfo = task.deadline ? getDeadlineInfo(task.deadline) : null;

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="group flex items-center gap-3 py-2.5 px-1 rounded-lg hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                data-testid={`task-item-${task.id}`}
              >
                <AnimatedCheckbox
                  checked={task.completed}
                  onChange={() => updateTask.mutate({ id: task.id, completed: !task.completed })}
                  taskId={task.id}
                />
                <div className="flex-1 min-w-0">
                  <span className={`text-sm md:text-base transition-all duration-300 ${task.completed ? 'text-slate-400 dark:text-slate-500 line-through opacity-60' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>
                    <ExpandableText text={task.text} maxLength={55} />
                  </span>
                  {deadlineInfo && !task.completed && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${deadlineInfo.color}`}>
                        <Clock className="w-2.5 h-2.5" />
                        {deadlineInfo.label}
                      </span>
                    </div>
                  )}
                </div>
                {isWeeklyMode && task.date && !task.isWeekly && (
                  <span className="text-[10px] font-semibold text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded flex-shrink-0">يومية</span>
                )}
                <button
                  onClick={() => setDeleteId(task.id)}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0"
                  data-testid={`button-delete-task-${task.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div className="flex items-center gap-3 pt-2.5 mt-1 border-t border-slate-100/80 dark:border-slate-800">
          <div className="p-0.5 text-slate-300 dark:text-slate-600"><Plus className="w-4 h-4" /></div>
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newTaskText.trim()) {
                e.preventDefault();
                openAddDialog();
              }
            }}
            placeholder={isWeeklyMode ? "أضف مهمة أسبوعية..." : "أضف مهمة..."}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm md:text-base text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600"
            data-testid={isWeeklyMode ? "input-weekly-task" : "input-daily-task"}
          />
          {newTaskText.trim() && (
            <button
              onClick={openAddDialog}
              className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
              data-testid="button-open-add-task"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <AddTaskDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleDialogSubmit}
        initialText={newTaskText}
        isWeeklyMode={isWeeklyMode}
      />

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

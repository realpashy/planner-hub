import { useState, useEffect, useCallback } from "react";
import type { TaskItem } from "@shared/schema";
import { formatISODate, getWeekDays } from "@/lib/date-utils";
import { useUpdateTask, useCreateTask, useDeleteTask } from "@/hooks/use-planner";
import { Plus, Trash2, ListTodo, Check, Trophy, Clock, X, Timer, CalendarDays, Hourglass } from "lucide-react";
import { ExpandableText } from "./ExpandableText";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { ResponsiveConfirm } from "../ResponsiveConfirm";
import { Drawer } from "vaul";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
          <path d="M2 6L5 9L10 3" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-check-draw" />
        </svg>
      )}
    </div>
  );
}

function useCountdown(deadline?: string, deadlineTime?: string, countdownEnd?: number): string | null {
  const [now, setNow] = useState(Date.now());
  const hasTime = !!deadlineTime;
  const hasCountdown = !!countdownEnd;

  useEffect(() => {
    if ((!deadline || !hasTime) && !hasCountdown) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [deadline, hasTime, hasCountdown]);

  if (countdownEnd) {
    const diff = countdownEnd - now;
    if (diff <= 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  if (!deadline) return null;

  const target = new Date(deadline + "T" + (deadlineTime || "23:59") + ":00");
  const diff = target.getTime() - now;

  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (!hasTime) {
    if (days > 0) return `${days} يوم`;
    return "اليوم";
  }

  if (days > 0) return `${days}ي ${hours}س ${minutes}د`;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getDeadlineStatus(deadline: string, deadlineTime?: string, completed?: boolean): { label: string; color: string; status: 'done' | 'ontime' | 'late' | 'upcoming' } {
  if (completed) {
    return { label: "تم الإنجاز", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/25", status: 'done' };
  }

  const now = new Date();
  const target = new Date(deadline + "T" + (deadlineTime || "23:59") + ":00");
  const diff = target.getTime() - now.getTime();

  if (diff < 0) {
    const hoursLate = Math.abs(Math.floor(diff / (1000 * 60 * 60)));
    const daysLate = Math.floor(hoursLate / 24);
    const label = daysLate > 0 ? `متأخر ${daysLate} يوم` : `متأخر ${hoursLate} ساعة`;
    return { label, color: "text-red-500 bg-red-50 dark:bg-red-500/15 border-red-200 dark:border-red-500/25", status: 'late' };
  }

  const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
  const daysLeft = Math.floor(hoursLeft / 24);

  if (hoursLeft < 2) {
    return { label: "وقت ضيق!", color: "text-red-500 bg-red-50 dark:bg-red-500/15 border-red-200 dark:border-red-500/25", status: 'upcoming' };
  }
  if (daysLeft === 0) {
    return { label: "اليوم", color: "text-amber-600 bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/25", status: 'upcoming' };
  }
  if (daysLeft === 1) {
    return { label: "غدا", color: "text-amber-600 bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/25", status: 'upcoming' };
  }
  if (daysLeft <= 3) {
    return { label: `${daysLeft} أيام`, color: "text-amber-600 bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/25", status: 'ontime' };
  }
  return { label: `${daysLeft} يوم`, color: "text-blue-500 bg-blue-50 dark:bg-blue-500/15 border-blue-200 dark:border-blue-500/25", status: 'ontime' };
}

function getCountdownStatus(countdownEnd: number, completed?: boolean): { label: string; color: string; status: 'done' | 'active' | 'expired' } {
  if (completed) {
    return { label: "تم الإنجاز", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/25", status: 'done' };
  }
  const diff = countdownEnd - Date.now();
  if (diff <= 0) {
    return { label: "انتهى الوقت!", color: "text-red-500 bg-red-50 dark:bg-red-500/15 border-red-200 dark:border-red-500/25", status: 'expired' };
  }
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 5) {
    return { label: "وقت ضيق!", color: "text-red-500 bg-red-50 dark:bg-red-500/15 border-red-200 dark:border-red-500/25", status: 'active' };
  }
  return { label: "جارٍ", color: "text-violet-600 bg-violet-50 dark:bg-violet-500/15 border-violet-200 dark:border-violet-500/25", status: 'active' };
}

function QuickDateButton({ label, isSelected, onClick, testId }: { label: string; isSelected: boolean; onClick: () => void; testId: string }) {
  return (
    <Button type="button" variant={isSelected ? "default" : "secondary"} size="sm" onClick={onClick} data-testid={testId} className="text-xs font-bold">
      {label}
    </Button>
  );
}

function DurationButton({ label, minutes, isSelected, onClick, testId }: { label: string; minutes: number; isSelected: boolean; onClick: () => void; testId: string }) {
  return (
    <Button
      type="button"
      size="sm"
      onClick={onClick}
      data-testid={testId}
      className={cn("text-xs font-bold", isSelected ? "bg-violet-500 hover:bg-violet-600 text-white" : "")}
      variant={isSelected ? "default" : "secondary"}
    >
      {label}
    </Button>
  );
}

type TimingMode = 'none' | 'deadline' | 'countdown';

interface AddTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string, deadline?: string, deadlineTime?: string, countdownEnd?: number) => void;
  initialText: string;
  isWeeklyMode: boolean;
  defaultDate: string;
}

function AddTaskContent({ onSubmit, onClose, initialText, isWeeklyMode, defaultDate }: Omit<AddTaskDialogProps, 'isOpen'>) {
  const [text, setText] = useState(initialText);
  const [timingMode, setTimingMode] = useState<TimingMode>('none');
  const [deadlineDate, setDeadlineDate] = useState(defaultDate);
  const [hasTime, setHasTime] = useState(false);
  const [deadlineTime, setDeadlineTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [countdownMinutes, setCountdownMinutes] = useState(30);
  const [customHours, setCustomHours] = useState(0);
  const [customMins, setCustomMins] = useState(30);

  useEffect(() => { setText(initialText); }, [initialText]);
  useEffect(() => { setDeadlineDate(defaultDate); }, [defaultDate]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    if (timingMode === 'deadline') {
      onSubmit(text.trim(), deadlineDate, hasTime ? deadlineTime : undefined, undefined);
    } else if (timingMode === 'countdown') {
      const endTime = Date.now() + countdownMinutes * 60 * 1000;
      onSubmit(text.trim(), undefined, undefined, endTime);
    } else {
      onSubmit(text.trim(), undefined, undefined, undefined);
    }
  };

  const today = formatISODate(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = formatISODate(tomorrow);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekISO = formatISODate(nextWeek);

  const presetDurations = [
    { label: "5 دقائق", minutes: 5 },
    { label: "15 دقيقة", minutes: 15 },
    { label: "30 دقيقة", minutes: 30 },
    { label: "1 ساعة", minutes: 60 },
    { label: "2 ساعة", minutes: 120 },
    { label: "3 ساعات", minutes: 180 },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-bold">
          {isWeeklyMode ? "المهمة الأسبوعية" : "المهمة"}
        </Label>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) handleSubmit(); }}
          placeholder={isWeeklyMode ? "أضف مهمة أسبوعية..." : "أضف مهمة..."}
          autoFocus
          className="h-11"
          data-testid="input-task-dialog-text"
        />
      </div>

      <div className="space-y-2">
        <div
          onPointerDown={(e) => { e.preventDefault(); setTimingMode(timingMode === 'deadline' ? 'none' : 'deadline'); }}
          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
            timingMode === 'deadline'
              ? 'border-primary/30 bg-primary/5 dark:bg-primary/10'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          data-testid="toggle-deadline"
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            timingMode === 'deadline' ? 'bg-primary/15 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}>
            <Timer className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <span className={`text-sm font-bold ${timingMode === 'deadline' ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>
              موعد نهائي
            </span>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">تحديد تاريخ ووقت التسليم</p>
          </div>
          <div className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ${timingMode === 'deadline' ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${timingMode === 'deadline' ? '-translate-x-4' : 'translate-x-0'}`} />
          </div>
        </div>

        <div
          onPointerDown={(e) => { e.preventDefault(); setTimingMode(timingMode === 'countdown' ? 'none' : 'countdown'); }}
          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
            timingMode === 'countdown'
              ? 'border-violet-300/50 bg-violet-50/50 dark:bg-violet-500/10'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          data-testid="toggle-countdown"
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            timingMode === 'countdown' ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}>
            <Hourglass className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <span className={`text-sm font-bold ${timingMode === 'countdown' ? 'text-violet-700 dark:text-violet-300' : 'text-slate-600 dark:text-slate-300'}`}>
              عداد تنازلي
            </span>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">تحديد مدة زمنية (دقائق أو ساعات)</p>
          </div>
          <div className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ${timingMode === 'countdown' ? 'bg-violet-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${timingMode === 'countdown' ? '-translate-x-4' : 'translate-x-0'}`} />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {timingMode === 'deadline' && (
          <motion.div
            key="deadline"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div>
              <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <CalendarDays className="w-4.5 h-4.5 text-primary" />
                التاريخ
              </label>
              <div className="flex gap-2 mb-2">
                <QuickDateButton label="اليوم" isSelected={deadlineDate === today} onClick={() => setDeadlineDate(today)} testId="button-deadline-today" />
                <QuickDateButton label="غدا" isSelected={deadlineDate === tomorrowISO} onClick={() => setDeadlineDate(tomorrowISO)} testId="button-deadline-tomorrow" />
                <QuickDateButton label="بعد أسبوع" isSelected={deadlineDate === nextWeekISO} onClick={() => setDeadlineDate(nextWeekISO)} testId="button-deadline-nextweek" />
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  min={today}
                  className="w-full bg-primary text-white font-bold border-0 rounded-xl px-4 py-3 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  data-testid="input-task-deadline-date"
                />
                <CalendarDays className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white pointer-events-none" />
              </div>
            </div>

            <div
              onPointerDown={(e) => { e.preventDefault(); setHasTime(!hasTime); }}
              className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
                hasTime
                  ? 'border-amber-300/50 bg-amber-50/50 dark:bg-amber-500/10'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
              }`}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              data-testid="toggle-deadline-time"
            >
              <Clock className={`w-4 h-4 ${hasTime ? 'text-amber-600' : 'text-slate-400'}`} />
              <span className={`text-sm font-bold flex-1 ${hasTime ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>
                تحديد وقت محدد
              </span>
              <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${hasTime ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${hasTime ? '-translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>

            <AnimatePresence>
              {hasTime && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <Clock className="w-4.5 h-4.5 text-amber-500" />
                    الوقت
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      className="w-full bg-amber-500 text-white font-bold border-0 rounded-xl px-4 py-3 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      data-testid="input-task-deadline-time"
                    />
                    <Clock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white pointer-events-none" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {timingMode === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div>
              <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Hourglass className="w-4.5 h-4.5 text-violet-500" />
                اختر المدة
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {presetDurations.map(d => (
                  <DurationButton
                    key={d.minutes}
                    label={d.label}
                    minutes={d.minutes}
                    isSelected={countdownMinutes === d.minutes}
                    onClick={() => {
                      setCountdownMinutes(d.minutes);
                      setCustomHours(Math.floor(d.minutes / 60));
                      setCustomMins(d.minutes % 60);
                    }}
                    testId={`button-duration-${d.minutes}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Timer className="w-4.5 h-4.5 text-violet-500" />
                مدة مخصصة
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 block">ساعات</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={customHours}
                    onChange={(e) => {
                      const h = Math.max(0, Math.min(24, parseInt(e.target.value) || 0));
                      setCustomHours(h);
                      setCountdownMinutes(h * 60 + customMins);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg font-bold font-sans text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 transition-all"
                    data-testid="input-countdown-hours"
                  />
                </div>
                <div className="flex items-end pb-3 text-xl font-bold text-slate-300 dark:text-slate-600">:</div>
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 block">دقائق</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customMins}
                    onChange={(e) => {
                      const m = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                      setCustomMins(m);
                      setCountdownMinutes(customHours * 60 + m);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg font-bold font-sans text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 transition-all"
                    data-testid="input-countdown-minutes"
                  />
                </div>
              </div>
              {countdownMinutes > 0 && (
                <p className="text-xs font-bold text-violet-500 mt-2 text-center">
                  سيبدأ العد التنازلي: {customHours > 0 ? `${customHours} ساعة` : ''}{customHours > 0 && customMins > 0 ? ' و ' : ''}{customMins > 0 ? `${customMins} دقيقة` : ''}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || (timingMode === 'countdown' && countdownMinutes === 0)}
          className="flex-1"
          data-testid="button-submit-task"
        >
          إضافة المهمة
        </Button>
        <Button variant="secondary" onClick={onClose} data-testid="button-cancel-task">
          إلغاء
        </Button>
      </div>
    </div>
  );
}

function AddTaskDialog({ isOpen, onClose, onSubmit, initialText, isWeeklyMode, defaultDate }: AddTaskDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[24px] fixed bottom-0 left-0 right-0 z-50 outline-none max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="p-5 pb-8">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 mb-6" />
              <Drawer.Title className="font-bold text-lg text-slate-900 dark:text-slate-50 mb-4">
                {isWeeklyMode ? "مهمة أسبوعية جديدة" : "مهمة جديدة"}
              </Drawer.Title>
              <Drawer.Description className="sr-only">إضافة مهمة جديدة</Drawer.Description>
              <AddTaskContent onSubmit={onSubmit} onClose={onClose} initialText={initialText} isWeeklyMode={isWeeklyMode} defaultDate={defaultDate} />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{isWeeklyMode ? "مهمة أسبوعية جديدة" : "مهمة جديدة"}</DialogTitle>
          <DialogDescription className="sr-only">إضافة مهمة جديدة</DialogDescription>
        </DialogHeader>
        <AddTaskContent onSubmit={onSubmit} onClose={onClose} initialText={initialText} isWeeklyMode={isWeeklyMode} defaultDate={defaultDate} />
      </DialogContent>
    </Dialog>
  );
}

function LiveCountdownBadge({ deadline, deadlineTime, countdownEnd, completed }: { deadline?: string; deadlineTime?: string; countdownEnd?: number; completed: boolean }) {
  const countdown = useCountdown(deadline, deadlineTime, countdownEnd);

  if (countdownEnd) {
    const status = getCountdownStatus(countdownEnd, completed);
    return (
      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${status.color}`}>
          {status.status === 'done' && <Check className="w-2.5 h-2.5" />}
          {status.status === 'expired' && <Clock className="w-2.5 h-2.5" />}
          {status.status === 'active' && <Hourglass className="w-2.5 h-2.5" />}
          {status.label}
        </span>
        {countdown && !completed && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold font-sans tabular-nums px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-500/15 border border-violet-200 dark:border-violet-500/25 text-violet-600 dark:text-violet-300 animate-pulse">
            <Hourglass className="w-2.5 h-2.5" />
            {countdown}
          </span>
        )}
      </div>
    );
  }

  if (!deadline) return null;

  const status = getDeadlineStatus(deadline, deadlineTime, completed);
  return (
    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${status.color}`}>
        {status.status === 'done' && <Check className="w-2.5 h-2.5" />}
        {status.status === 'late' && <Clock className="w-2.5 h-2.5" />}
        {(status.status === 'ontime' || status.status === 'upcoming') && <Timer className="w-2.5 h-2.5" />}
        {status.label}
      </span>
      {countdown && !completed && deadlineTime && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold font-sans tabular-nums px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
          <Timer className="w-2.5 h-2.5" />
          {countdown}
        </span>
      )}
    </div>
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
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: ['#22C55E', '#4F46E5', '#F59E0B'], disableForReducedMotion: true });
  }, []);

  useEffect(() => {
    if (allCompleted && !prevAllCompleted && totalCount > 0) triggerCelebration();
    setPrevAllCompleted(allCompleted);
  }, [allCompleted, prevAllCompleted, totalCount, triggerCelebration]);

  const handleDialogSubmit = (text: string, deadline?: string, deadlineTime?: string, countdownEnd?: number) => {
    createTask.mutate({
      date: isWeeklyMode ? weekStartISO : dateISO,
      text,
      completed: false,
      isWeekly: isWeeklyMode,
      deadline,
      deadlineTime,
      countdownEnd,
    });
    setNewTaskText("");
    setShowAddDialog(false);
  };

  return (
    <>
    <Card
      className={cn(
        "transition-all duration-300",
        isWeeklyMode && "shadow-sm",
        !isWeeklyMode && allCompleted && "animate-celebration-glow"
      )}
      data-testid={isWeeklyMode ? "weekly-tasks" : "daily-tasks"}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", isWeeklyMode ? "bg-primary/10" : "bg-emerald-500/10")}>
              <ListTodo className={cn("w-4.5 h-4.5", isWeeklyMode ? "text-primary" : "text-emerald-600 dark:text-emerald-400")} />
            </div>
            <h3 className="font-bold text-base md:text-lg text-foreground">{isWeeklyMode ? 'مهام الأسبوع' : 'مهام اليوم'}</h3>
          </div>
          {totalCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">{completedCount}/{totalCount}</span>
              <Badge variant={allCompleted ? "default" : "secondary"} className={cn(allCompleted && "bg-emerald-500 hover:bg-emerald-600")}>
                {progress}%
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {totalCount > 0 && (
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={cn("h-full rounded-full transition-colors duration-300", allCompleted ? "bg-emerald-500" : "bg-primary")}
            />
          </div>
        )}

        {allCompleted && !isWeeklyMode && totalCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm font-bold px-3 py-2.5 rounded-lg"
          >
            <Trophy className="w-4 h-4" />
            <span>أحسنت! اكتمل اليوم</span>
          </motion.div>
        )}

        <div className="space-y-0.5">
          <AnimatePresence>
            {relevantTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  "group flex items-center gap-3 py-2.5 px-1 rounded-lg transition-colors",
                  isWeeklyMode && "hover:bg-muted/50",
                  index < relevantTasks.length - 1 && "border-b border-border"
                )}
                data-testid={`task-item-${task.id}`}
              >
                <AnimatedCheckbox
                  checked={task.completed}
                  onChange={() => updateTask.mutate({ id: task.id, completed: !task.completed })}
                  taskId={task.id}
                />
                <div className="flex-1 min-w-0">
                  <span className={cn("text-sm md:text-base transition-all duration-300", task.completed ? "text-muted-foreground line-through opacity-60" : "text-foreground font-medium")}>
                    <ExpandableText text={task.text} maxLength={55} />
                  </span>
                  {(task.deadline || task.countdownEnd) && (
                    <LiveCountdownBadge deadline={task.deadline} deadlineTime={task.deadlineTime} countdownEnd={task.countdownEnd} completed={task.completed} />
                  )}
                </div>
                {isWeeklyMode && task.date && !task.isWeekly && (
                  <Badge variant="outline" className="text-[10px] flex-shrink-0">يومية</Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                  onClick={() => setDeleteId(task.id)}
                  data-testid={`button-delete-task-${task.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="flex items-center gap-3 pt-2.5 mt-1 border-t border-border">
            <Plus className="w-4 h-4 text-muted-foreground" />
            <Input
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newTaskText.trim()) { e.preventDefault(); setShowAddDialog(true); } }}
              placeholder={isWeeklyMode ? "أضف مهمة أسبوعية..." : "أضف مهمة..."}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-9 px-0"
              data-testid={isWeeklyMode ? "input-weekly-task" : "input-daily-task"}
            />
            {newTaskText.trim() && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setShowAddDialog(true)} data-testid="button-open-add-task">
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      </Card>

      <AddTaskDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleDialogSubmit}
        initialText={newTaskText}
        isWeeklyMode={isWeeklyMode}
        defaultDate={dateISO}
      />

      <ResponsiveConfirm
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteTask.mutate(deleteId)}
        title="حذف المهمة"
        description="هل أنت متأكد من حذف هذه المهمة؟"
      />
    </>
  );
}




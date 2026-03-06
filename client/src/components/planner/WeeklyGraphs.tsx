import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import type { TaskItem, HabitItem, EventItem } from "@shared/schema";
import { getWeekDays, formatISODate, getDayShortName } from "@/lib/date-utils";

interface WeeklyGraphsProps {
  tasks: TaskItem[];
  habits: HabitItem[];
  events: EventItem[];
  selectedDate: Date;
}

export function WeeklyGraphs({ tasks, habits, events, selectedDate }: WeeklyGraphsProps) {
  const weekDays = getWeekDays(selectedDate);
  const weekISOs = weekDays.map(d => formatISODate(d));

  const dailyStats = weekDays.map((day, i) => {
    const iso = weekISOs[i];
    const dayTasks = tasks.filter(t => t.date === iso && !t.isWeekly);
    const completed = dayTasks.filter(t => t.completed).length;
    const total = dayTasks.length;
    const dayEvents = events.filter(e => e.date === iso).length;
    const habitsDone = habits.reduce((sum, h) => sum + (h.completedDates.includes(iso) ? 1 : 0), 0);

    return {
      day,
      iso,
      label: getDayShortName(day),
      tasksCompleted: completed,
      tasksTotal: total,
      taskPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
      events: dayEvents,
      habits: habitsDone,
    };
  });

  const maxTasks = Math.max(...dailyStats.map(d => d.tasksTotal), 1);
  const totalHabits = habits.length || 1;

  const weeklyTasksTotal = tasks.filter(t => t.isWeekly);
  const weeklyCompleted = weeklyTasksTotal.filter(t => t.completed).length;

  const allDailyTasks = dailyStats.reduce((s, d) => s + d.tasksTotal, 0);
  const allDailyCompleted = dailyStats.reduce((s, d) => s + d.tasksCompleted, 0);
  const overallPercent = (allDailyTasks + weeklyTasksTotal.length) === 0
    ? 0
    : Math.round(((allDailyCompleted + weeklyCompleted) / (allDailyTasks + weeklyTasksTotal.length)) * 100);

  const totalHabitChecks = habits.length * 7;
  const completedHabitChecks = habits.reduce((sum, h) => {
    return sum + weekISOs.filter(iso => h.completedDates.includes(iso)).length;
  }, 0);
  const habitPercent = totalHabitChecks === 0 ? 0 : Math.round((completedHabitChecks / totalHabitChecks) * 100);

  const totalEvents = dailyStats.reduce((s, d) => s + d.events, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 md:p-7" data-testid="weekly-graphs">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-9 h-9 rounded-full bg-primary/8 dark:bg-primary/15 flex items-center justify-center">
          <BarChart3 className="w-4.5 h-4.5 text-primary" />
        </div>
        <h3 className="font-bold text-base md:text-lg text-slate-800 dark:text-slate-100">ملخص الأسبوع</h3>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="text-center p-3 rounded-xl bg-primary/5 dark:bg-primary/10">
          <div className="text-2xl md:text-3xl font-bold text-primary mb-0.5">{overallPercent}%</div>
          <div className="text-[11px] md:text-xs font-medium text-slate-400 dark:text-slate-500">إنجاز المهام</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-violet-50 dark:bg-violet-500/10">
          <div className="text-2xl md:text-3xl font-bold text-violet-600 dark:text-violet-400 mb-0.5">{habitPercent}%</div>
          <div className="text-[11px] md:text-xs font-medium text-slate-400 dark:text-slate-500">العادات</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10">
          <div className="text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400 mb-0.5">{totalEvents}</div>
          <div className="text-[11px] md:text-xs font-medium text-slate-400 dark:text-slate-500">المواعيد</div>
        </div>
      </div>

      <div className="mb-2">
        <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-4">إنجاز المهام اليومية</h4>
        <div className="flex items-end gap-2 md:gap-3 h-32 md:h-40">
          {dailyStats.map((stat, i) => {
            const barHeight = maxTasks === 0 ? 0 : (stat.tasksTotal / maxTasks) * 100;
            const fillHeight = stat.tasksTotal === 0 ? 0 : (stat.tasksCompleted / stat.tasksTotal) * barHeight;
            const isToday = stat.iso === formatISODate(new Date());

            return (
              <div key={stat.iso} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                  {stat.tasksTotal > 0 ? `${stat.tasksCompleted}/${stat.tasksTotal}` : '-'}
                </span>
                <div className="w-full relative flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-lg bg-slate-100 dark:bg-slate-800 relative overflow-hidden transition-all"
                    style={{ height: `${Math.max(barHeight, 8)}%` }}
                  >
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${stat.tasksTotal === 0 ? 0 : (stat.tasksCompleted / stat.tasksTotal) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                      className={`absolute bottom-0 left-0 right-0 rounded-t-lg ${
                        stat.taskPercent === 100 ? 'bg-emerald-500' : 'bg-primary'
                      }`}
                    />
                  </div>
                </div>
                <span className={`text-[10px] md:text-xs font-bold ${isToday ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-800 my-5" />

      <div>
        <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-4">العادات اليومية</h4>
        <div className="flex items-end gap-2 md:gap-3 h-24 md:h-32">
          {dailyStats.map((stat, i) => {
            const barHeight = (stat.habits / totalHabits) * 100;
            const isToday = stat.iso === formatISODate(new Date());

            return (
              <div key={stat.iso} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                  {stat.habits > 0 ? stat.habits : '-'}
                </span>
                <div className="w-full relative flex-1 flex items-end">
                  <div className="w-full rounded-t-lg bg-slate-100 dark:bg-slate-800 relative overflow-hidden" style={{ height: '100%' }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${barHeight}%` }}
                      transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                      className={`absolute bottom-0 left-0 right-0 rounded-t-lg ${
                        barHeight === 100 ? 'bg-emerald-500' : 'bg-violet-500'
                      }`}
                    />
                  </div>
                </div>
                <span className={`text-[10px] md:text-xs font-bold ${isToday ? 'text-violet-500' : 'text-slate-400 dark:text-slate-500'}`}>
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { TrendingUp, CheckSquare, Activity, Calendar } from "lucide-react";
import type { TaskItem, HabitItem, EventItem } from "@shared/schema";
import { getWeekDays, formatISODate } from "@/lib/date-utils";

interface WeeklySummaryProps {
  tasks: TaskItem[];
  habits: HabitItem[];
  events: EventItem[];
  selectedDate: Date;
}

export function WeeklySummary({ tasks, habits, events, selectedDate }: WeeklySummaryProps) {
  const weekDays = getWeekDays(selectedDate);
  const weekISOs = weekDays.map(d => formatISODate(d));
  const todayISO = formatISODate(new Date());

  const weeklyTasks = tasks.filter(t => t.isWeekly);
  const dailyTasksThisWeek = tasks.filter(t => !t.isWeekly && weekISOs.includes(t.date));
  const allWeekTasks = [...weeklyTasks, ...dailyTasksThisWeek];
  const completedWeekTasks = allWeekTasks.filter(t => t.completed).length;
  const totalWeekTasks = allWeekTasks.length;
  const weekTaskPercent = totalWeekTasks === 0 ? 0 : Math.round((completedWeekTasks / totalWeekTasks) * 100);

  const totalHabitChecks = habits.length * 7;
  const completedHabitChecks = habits.reduce((sum, h) => {
    return sum + weekISOs.filter(iso => h.completedDates.includes(iso)).length;
  }, 0);
  const habitPercent = totalHabitChecks === 0 ? 0 : Math.round((completedHabitChecks / totalHabitChecks) * 100);

  const todayEvents = events.filter(e => e.date === todayISO).length;

  const cards = [
    {
      label: 'إنجاز الأسبوع',
      value: `${weekTaskPercent}%`,
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-primary',
      bg: 'bg-primary/8',
    },
    {
      label: 'المهام',
      value: `${completedWeekTasks}/${totalWeekTasks}`,
      icon: <CheckSquare className="w-4 h-4" />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'العادات',
      value: `${habitPercent}%`,
      icon: <Activity className="w-4 h-4" />,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'أحداث اليوم',
      value: `${todayEvents}`,
      icon: <Calendar className="w-4 h-4" />,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2" data-testid="weekly-summary">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3"
        >
          <div className={`w-9 h-9 rounded-lg ${card.bg} ${card.color} flex items-center justify-center flex-shrink-0`}>
            {card.icon}
          </div>
          <div className="min-w-0">
            <div className={`text-lg font-bold ${card.color} leading-none mb-0.5`}>{card.value}</div>
            <div className="text-[11px] font-medium text-slate-400 truncate">{card.label}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

import { motion } from "framer-motion";
import { TrendingUp, CheckSquare, Activity, Calendar } from "lucide-react";
import type { TaskItem, HabitItem, EventItem } from "@shared/schema";
import { getWeekDays, formatISODate } from "@/lib/date-utils";
import { Card, CardContent } from "@/components/ui/card";

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
      icon: <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />,
      color: 'text-primary',
      bg: 'bg-primary/8 dark:bg-primary/15',
    },
    {
      label: 'المهام',
      value: `${completedWeekTasks}/${totalWeekTasks}`,
      icon: <CheckSquare className="w-4 h-4 md:w-5 md:h-5" />,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-500/15',
    },
    {
      label: 'العادات',
      value: `${habitPercent}%`,
      icon: <Activity className="w-4 h-4 md:w-5 md:h-5" />,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-500/15',
    },
    {
      label: 'أحداث اليوم',
      value: `${todayEvents}`,
      icon: <Calendar className="w-4 h-4 md:w-5 md:h-5" />,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/15',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4" data-testid="weekly-summary">
      {cards.map((card, i) => (
        <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <Card className="p-3 md:p-4 flex flex-row items-center gap-3">
            <CardContent className="p-0 flex items-center gap-3 w-full">
              <div className={`w-10 h-10 md:w-11 md:h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${card.bg} ${card.color}`}>
                {card.icon}
              </div>
              <div className="min-w-0">
                <div className={`text-lg md:text-xl font-bold leading-none mb-0.5 ${card.color}`}>{card.value}</div>
                <div className="text-[11px] md:text-xs font-medium text-muted-foreground truncate">{card.label}</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}


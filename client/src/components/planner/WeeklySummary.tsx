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
      bg: 'border-primary/20 bg-primary/[0.1]',
    },
    {
      label: 'المهام',
      value: `${completedWeekTasks}/${totalWeekTasks}`,
      icon: <CheckSquare className="w-4 h-4 md:w-5 md:h-5" />,
      color: 'text-emerald-300',
      bg: 'border-emerald-500/20 bg-emerald-500/[0.1]',
    },
    {
      label: 'العادات',
      value: `${habitPercent}%`,
      icon: <Activity className="w-4 h-4 md:w-5 md:h-5" />,
      color: 'text-sky-300',
      bg: 'border-sky-500/20 bg-sky-500/[0.1]',
    },
    {
      label: 'أحداث اليوم',
      value: `${todayEvents}`,
      icon: <Calendar className="w-4 h-4 md:w-5 md:h-5" />,
      color: 'text-amber-300',
      bg: 'border-amber-500/20 bg-amber-500/[0.1]',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4" data-testid="weekly-summary">
      {cards.map((card, i) => (
        <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <Card className="surface-shell p-3 md:p-4">
            <CardContent className="rtl-title-row w-full items-center p-0">
              <div className="min-w-0 flex-1 text-right">
                <div className={`text-lg md:text-xl font-black leading-none mb-0.5 ${card.color}`}>{card.value}</div>
                <div className="text-[11px] md:text-xs font-medium text-muted-foreground truncate">{card.label}</div>
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[calc(var(--radius)+0.25rem)] border ${card.bg} ${card.color}`}>
                {card.icon}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

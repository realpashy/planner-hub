import { motion } from "framer-motion";
import { TrendingUp, CheckSquare, Activity, Calendar, type LucideIcon } from "lucide-react";
import type { TaskItem, HabitItem, EventItem } from "@shared/schema";
import { getWeekDays, formatISODate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

interface WeeklySummaryProps {
  tasks: TaskItem[];
  habits: HabitItem[];
  events: EventItem[];
  selectedDate: Date;
}

interface StatCardData {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  iconClass: string;
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
  const weekEvents = events.filter(e => weekISOs.includes(e.date)).length;

  const cards: StatCardData[] = [
    {
      label: 'إنجاز الأسبوع',
      value: `${weekTaskPercent}%`,
      note: weekTaskPercent === 100 ? 'أنجزت كل المهام' : `${totalWeekTasks - completedWeekTasks} متبقية`,
      icon: TrendingUp,
      iconClass: 'border-primary/15 bg-primary/10 text-primary',
    },
    {
      label: 'المهام',
      value: `${completedWeekTasks}/${totalWeekTasks}`,
      note: `${weeklyTasks.length} أسبوعية - ${dailyTasksThisWeek.length} يومية`,
      icon: CheckSquare,
      iconClass: 'border-emerald-500/15 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'العادات',
      value: `${habitPercent}%`,
      note: habits.length === 0 ? 'لا توجد عادات بعد' : `${completedHabitChecks}/${totalHabitChecks} مرة هذا الأسبوع`,
      icon: Activity,
      iconClass: 'border-violet-500/15 bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
    {
      label: 'أحداث اليوم',
      value: `${todayEvents}`,
      note: weekEvents > todayEvents ? `${weekEvents} أحداث هذا الأسبوع` : 'لا مزيد من الأحداث',
      icon: Calendar,
      iconClass: 'border-amber-500/15 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4" data-testid="weekly-summary">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
          >
            <div className="rounded-[1.5rem] border border-white/70 bg-background/80 p-4 text-right shadow-sm backdrop-blur dark:border-white/10 dark:bg-background/60">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
                  <p className="truncate text-lg font-extrabold text-foreground md:text-xl">{card.value}</p>
                  <p className="truncate text-xs leading-5 text-muted-foreground">{card.note}</p>
                </div>
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border md:h-11 md:w-11",
                    card.iconClass
                  )}
                >
                  <Icon className="h-4 w-4 md:h-5 md:w-5" />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}


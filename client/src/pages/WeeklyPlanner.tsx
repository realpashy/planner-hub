import { useState } from "react";
import { Link } from "wouter";
import { usePlannerData, useSaveNote } from "@/hooks/use-planner";
import { getWeekHeader, getWeekDays, addWeeks, subWeeks, formatISODate, formatDayDate, getArabicDayFull } from "@/lib/date-utils";
import { DayStrip } from "@/components/planner/DayStrip";
import { FocusTags } from "@/components/planner/FocusTags";
import { EventList } from "@/components/planner/EventList";
import { TaskList } from "@/components/planner/TaskList";
import { HabitTracker } from "@/components/planner/HabitTracker";
import { MonthCalendar } from "@/components/planner/MonthCalendar";
import { WeeklySummary } from "@/components/planner/WeeklySummary";
import { FAB } from "@/components/planner/FAB";
import { ChevronRight, ChevronLeft, ArrowRight, Calendar as CalendarIcon, FileText } from "lucide-react";
import { motion } from "framer-motion";
import * as Popover from "@radix-ui/react-popover";

export default function WeeklyPlanner() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data, isLoading } = usePlannerData();
  const saveNote = useSaveNote();

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const weekDays = getWeekDays(selectedDate);
  const weekStart = weekDays[0];
  const dateISO = formatISODate(selectedDate);
  const currentNote = data.notes.find(n => n.date === dateISO)?.content || "";

  const dayTasks = data.tasks.filter(t => t.date === dateISO && !t.isWeekly);
  const completedDayTasks = dayTasks.filter(t => t.completed).length;
  const totalDayTasks = dayTasks.length;
  const dayProgress = totalDayTasks === 0 ? 0 : Math.round((completedDayTasks / totalDayTasks) * 100);
  const allDayDone = totalDayTasks > 0 && completedDayTasks === totalDayTasks;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8" dir="rtl">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-50" data-testid="link-back-dashboard">
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Popover.Root>
              <Popover.Trigger asChild>
                <button className="flex flex-col items-center group" data-testid="button-open-calendar">
                  <h2 className="text-sm md:text-base font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-primary transition-colors">
                    {getWeekHeader(selectedDate)}
                    <CalendarIcon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                  </h2>
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content className="z-50" align="center" sideOffset={8}>
                  <MonthCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            <div className="flex items-center gap-0.5" dir="ltr">
              <button onClick={() => setSelectedDate(subWeeks(selectedDate, 1))} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors" data-testid="button-prev-week">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setSelectedDate(addWeeks(selectedDate, 1))} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors" data-testid="button-next-week">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <DayStrip days={weekDays} selectedDate={selectedDate} onSelect={setSelectedDate} tasks={data.tasks} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-5 pb-4">
        <div className="mb-5">
          <WeeklySummary tasks={data.tasks} habits={data.habits} events={data.events} selectedDate={selectedDate} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8">
            <motion.div
              key={dateISO}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`bg-white rounded-2xl p-5 md:p-6 shadow-sm border transition-all duration-500 ${allDayDone ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100'}`}
              data-testid="selected-day-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{getArabicDayFull(selectedDate)}</h3>
                  <p className="text-sm text-slate-400 font-semibold tabular-nums">{formatDayDate(selectedDate)}</p>
                </div>
                {totalDayTasks > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dayProgress}%` }}
                        transition={{ duration: 0.4 }}
                        className={`h-full rounded-full ${allDayDone ? 'bg-emerald-500' : 'bg-primary'}`}
                      />
                    </div>
                    <span className={`text-xs font-bold ${allDayDone ? 'text-emerald-600' : 'text-slate-400'}`}>{dayProgress}%</span>
                  </div>
                )}
              </div>

              <FocusTags tags={data.tags} selectedDate={selectedDate} />

              <div className="h-px bg-slate-100 my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <EventList events={data.events} selectedDate={selectedDate} />
                <TaskList tasks={data.tasks} selectedDate={selectedDate} />
              </div>

              <div className="h-px bg-slate-100 my-4" />

              <div data-testid="notes-section">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-800">ملاحظات</h3>
                </div>
                <textarea
                  value={currentNote}
                  onChange={(e) => saveNote.mutate({ date: dateISO, content: e.target.value })}
                  placeholder="اكتب أفكارك هنا..."
                  className="w-full h-24 bg-slate-50/80 border border-slate-100 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/8 resize-none transition-all placeholder:text-slate-300"
                  data-testid="textarea-notes"
                />
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-4 space-y-5">
            <TaskList tasks={data.tasks} selectedDate={weekStart} isWeeklyMode={true} />
            <HabitTracker habits={data.habits} weekStart={weekStart} />
          </div>
        </div>
      </main>

      <FAB onAction={(action) => {
        const el = document.querySelector(`[data-testid="${action === 'task' ? 'input-daily-task' : action === 'event' ? 'button-add-event' : action === 'tag' ? 'input-focus-tag' : 'textarea-notes'}"]`) as HTMLElement;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => el.focus?.(), 400);
          if (action === 'event') el.click?.();
        }
      }} />
    </div>
  );
}

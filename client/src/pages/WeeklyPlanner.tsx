import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { GanttTimeline } from "@/components/planner/GanttTimeline";
import { WeeklyGraphs } from "@/components/planner/WeeklyGraphs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TEMPLATES, generateTemplateData } from "@/lib/templates";
import { savePlannerData } from "@/lib/storage";
import { ChevronRight, ChevronLeft, ArrowRight, Calendar as CalendarIcon, FileText, WandSparkles, Check } from "lucide-react";
import { motion } from "framer-motion";
import * as Popover from "@radix-ui/react-popover";

export default function WeeklyPlanner() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("blank");

  const { data, isLoading } = usePlannerData();
  const saveNote = useSaveNote();
  const eventsRef = useRef<HTMLDivElement>(null);
  const scrollToEvents = useCallback(() => {
    eventsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const applyTemplateInPlace = () => {
    const nextData = generateTemplateData(selectedTemplateId);
    savePlannerData(nextData);
    queryClient.invalidateQueries({ queryKey: ["planner_data"] });
    setTemplatePickerOpen(false);
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const weekDays = getWeekDays(selectedDate);
  const weekStart = weekDays[0];
  const dateISO = formatISODate(selectedDate);
  const currentNote = data.notes.find((n) => n.date === dateISO)?.content || "";

  const dayTasks = data.tasks.filter((t) => t.date === dateISO && !t.isWeekly);
  const completedDayTasks = dayTasks.filter((t) => t.completed).length;
  const totalDayTasks = dayTasks.length;
  const dayProgress = totalDayTasks === 0 ? 0 : Math.round((completedDayTasks / totalDayTasks) * 100);
  const allDayDone = totalDayTasks > 0 && completedDayTasks === totalDayTasks;

  return (
    <div className="weekly-planner-page min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 md:pb-8" dir="rtl">
      <header className="weekly-planner-header bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Link href="/" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" data-testid="link-back-dashboard">
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
              </Link>
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setTemplatePickerOpen(true)}
                className="weekly-template-trigger p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                title="اختيار قالب"
              >
                <WandSparkles className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            <Popover.Root>
              <Popover.Trigger asChild>
                <button className="flex flex-col items-center group" data-testid="button-open-calendar">
                  <h2 className="text-sm md:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 group-hover:text-primary transition-colors">
                    {getWeekHeader(selectedDate)}
                    <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-slate-400 group-hover:text-primary transition-colors" />
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
              <button onClick={() => setSelectedDate(subWeeks(selectedDate, 1))} className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors" data-testid="button-prev-week">
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <button onClick={() => setSelectedDate(addWeeks(selectedDate, 1))} className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors" data-testid="button-next-week">
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>

          <DayStrip days={weekDays} selectedDate={selectedDate} onSelect={setSelectedDate} tasks={data.tasks} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-5 md:pt-6 pb-4">
        <div className="mb-5 md:mb-6">
          <WeeklySummary tasks={data.tasks} habits={data.habits} events={data.events} selectedDate={selectedDate} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
          <div className="lg:col-span-8">
            <motion.div
              key={dateISO}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-7 shadow-sm border transition-all duration-500 ${allDayDone ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-500/5" : "border-slate-100 dark:border-slate-800"}`}
              data-testid="selected-day-card"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-50">{getArabicDayFull(selectedDate)}</h3>
                  <p className="text-sm md:text-base text-slate-400 dark:text-slate-500 font-semibold tabular-nums">{formatDayDate(selectedDate)}</p>
                </div>
                {totalDayTasks > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dayProgress}%` }}
                        transition={{ duration: 0.4 }}
                        className={`h-full rounded-full ${allDayDone ? "bg-emerald-500" : "bg-primary"}`}
                      />
                    </div>
                    <span className={`text-sm font-bold ${allDayDone ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>{dayProgress}%</span>
                  </div>
                )}
              </div>

              <FocusTags tags={data.tags} selectedDate={selectedDate} />

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-5" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div ref={eventsRef}>
                  <EventList events={data.events} selectedDate={selectedDate} />
                </div>
                <div className="relative">
                  <div className="md:hidden h-px bg-slate-100 dark:bg-slate-800 mb-5" />
                  <div className="hidden md:block absolute right-0 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />
                  <TaskList tasks={data.tasks} selectedDate={selectedDate} />
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-5" />

              <div data-testid="notes-section">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-base md:text-lg text-slate-800 dark:text-slate-100">ملاحظات</h3>
                </div>
                <textarea
                  value={currentNote}
                  onChange={(e) => saveNote.mutate({ date: dateISO, content: e.target.value })}
                  placeholder="اكتب أفكارك هنا..."
                  className="w-full h-28 md:h-32 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl p-3 md:p-4 text-sm md:text-base text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/8 resize-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  data-testid="textarea-notes"
                />
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-4 space-y-5 md:space-y-6">
            <HabitTracker habits={data.habits} weekStart={weekStart} />
            <TaskList tasks={data.tasks} selectedDate={weekStart} isWeeklyMode={true} />
          </div>
        </div>

        <div className="mt-5 md:mt-6">
          <GanttTimeline events={data.events} selectedDate={selectedDate} onScrollToEvents={scrollToEvents} />
        </div>

        <div className="mt-5 md:mt-6">
          <WeeklyGraphs tasks={data.tasks} habits={data.habits} events={data.events} selectedDate={selectedDate} />
        </div>
      </main>

      {templatePickerOpen && (
        <div className="weekly-template-modal fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setTemplatePickerOpen(false)}>
          <div className="weekly-template-modal-card w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 md:p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-1">اختر قالبًا للمخطط الأسبوعي</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">سيتم تعبئة الصفحة مباشرة بدون الانتقال لصفحة إعداد.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-auto modern-scrollbar pr-1">
              {TEMPLATES.map((template) => {
                const selected = selectedTemplateId === template.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`weekly-template-option text-right rounded-xl border p-3 transition ${selected ? "border-primary bg-primary/5" : "border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50"}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{template.emoji}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{template.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{template.description}</p>
                      </div>
                      {selected && <Check className="w-4 h-4 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button onClick={applyTemplateInPlace} className="weekly-template-apply-btn flex-1 rounded-xl bg-primary text-white py-2.5 font-semibold">تطبيق القالب</button>
              <button onClick={() => setTemplatePickerOpen(false)} className="weekly-template-cancel-btn flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-2.5">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <FAB
        onAction={(action) => {
          const el = document.querySelector(`[data-testid="${action === "task" ? "input-daily-task" : action === "event" ? "button-add-event" : action === "tag" ? "input-focus-tag" : "textarea-notes"}"]`) as HTMLElement;
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => el.focus?.(), 400);
            if (action === "event") el.click?.();
          }
        }}
      />
    </div>
  );
}

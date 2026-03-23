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
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, FileText, WandSparkles, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
      <div className="app-shell flex min-h-screen items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const weekDays = getWeekDays(selectedDate);
  const dateISO = formatISODate(selectedDate);
  const currentNote = data.notes.find((n) => n.date === dateISO)?.content || "";

  const dayTasks = data.tasks.filter((t) => t.date === dateISO && !t.isWeekly);
  const completedDayTasks = dayTasks.filter((t) => t.completed).length;
  const totalDayTasks = dayTasks.length;
  const dayProgress = totalDayTasks === 0 ? 0 : Math.round((completedDayTasks / totalDayTasks) * 100);
  const allDayDone = totalDayTasks > 0 && completedDayTasks === totalDayTasks;

  return (
    <div className="app-shell relative pb-24 md:pb-8" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(149,223,30,0.12),transparent_25%),radial-gradient(circle_at_top_left,rgba(255,255,255,0.02),transparent_22%)]" />
      <header className="sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <div className="surface-shell rounded-[calc(var(--radius)+0.9rem)] p-4 backdrop-blur-xl">
            <div className="space-y-4">
              <div className="rtl-title-row items-start">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Button variant="ghost" size="icon" className="mt-0.5 shrink-0" asChild>
                    <Link href="/" data-testid="link-back-dashboard">
                      <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                    </Link>
                  </Button>
                  <div className="rtl-title-stack min-w-0 flex-1">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.1] px-3 py-1 text-xs font-semibold text-primary shadow-[var(--app-shadow)]">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      مساحة تخطيط أسبوعية
                    </div>
                    <h1 className="mt-3 text-2xl font-black tracking-tight text-foreground md:text-3xl">المخطط الأسبوعي</h1>
                    <p className="mt-1 text-sm leading-7 text-muted-foreground">
                      تنظيم الأيام، المهام، العادات، والملاحظات من واجهة واحدة واضحة ومصقولة.
                    </p>
                  </div>
                </div>

                <div className="surface-subtle rtl-actions-inline shrink-0 rounded-full px-2 py-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTemplatePickerOpen(true)}
                    title="اختيار قالب"
                  >
                    <WandSparkles className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                  <ThemeToggle />
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1.25fr_auto]">
                <div className="surface-subtle rtl-title-row rounded-[calc(var(--radius)+0.6rem)] px-4 py-3">
                  <div className="rtl-title-stack flex-1">
                    <p className="text-sm font-black text-foreground md:text-base">{getWeekHeader(selectedDate)}</p>
                    <p className="text-xs leading-6 text-muted-foreground">اختر الأسبوع أو حرّك العرض بين الأسابيع بدون مغادرة الصفحة.</p>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="min-h-10 rounded-[calc(var(--radius)+0.3rem)] px-3 text-sm"
                        data-testid="button-open-calendar"
                      >
                        <span>{getWeekHeader(selectedDate)}</span>
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" sideOffset={8} dir="rtl">
                      <MonthCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="surface-subtle flex items-center justify-between gap-2 rounded-[calc(var(--radius)+0.6rem)] px-2 py-2 sm:justify-start" dir="ltr">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedDate(subWeeks(selectedDate, 1))}
                    data-testid="button-prev-week"
                  >
                    <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedDate(addWeeks(selectedDate, 1))}
                    data-testid="button-next-week"
                  >
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                  </Button>
                </div>
              </div>

              <DayStrip days={weekDays} selectedDate={selectedDate} onSelect={setSelectedDate} tasks={data.tasks} />
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 pb-4 pt-5 md:px-6 md:pt-6">
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
            >
              <Card
                className={cn(
                  "surface-shell lg:sticky lg:top-24 transition-all duration-300",
                  allDayDone && "border-emerald-500/25 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_24%),linear-gradient(180deg,rgba(39,39,39,0.98),rgba(28,28,28,0.98))]"
                )}
                data-testid="selected-day-card"
              >
                <CardHeader className="pb-4">
                  <div className="rtl-title-row items-start">
                    <div className="rtl-title-stack flex-1">
                      <h3 className="text-lg md:text-xl font-bold text-foreground">{getArabicDayFull(selectedDate)}</h3>
                      <p className="text-sm md:text-base text-muted-foreground font-semibold tabular-nums">{formatDayDate(selectedDate)}</p>
                    </div>
                    {totalDayTasks > 0 && (
                      <div className="surface-subtle flex items-center gap-2 rounded-full px-3 py-2">
                        <span className={cn("text-sm font-bold", allDayDone ? "text-emerald-400" : "text-muted-foreground")}>
                          {dayProgress}%
                        </span>
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${dayProgress}%` }}
                            transition={{ duration: 0.4 }}
                            className={cn("h-full rounded-full", allDayDone ? "bg-emerald-500" : "bg-primary")}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <FocusTags tags={data.tags} selectedDate={selectedDate} />

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div ref={eventsRef}>
                      <EventList events={data.events} selectedDate={selectedDate} />
                    </div>
                    <div className="relative md:pr-3">
                      <div className="md:hidden">
                        <Separator className="mb-5" />
                      </div>
                      <div className="hidden md:block absolute right-0 top-0 bottom-0">
                        <Separator orientation="vertical" className="h-full" />
                      </div>
                      <TaskList tasks={data.tasks} selectedDate={selectedDate} />
                    </div>
                  </div>

                  <Separator />

                  <div data-testid="notes-section">
                    <div className="rtl-title-row mb-3 items-center">
                      <h3 className="font-bold text-base md:text-lg text-foreground">ملاحظات</h3>
                      <div className="icon-chip h-9 w-9 rounded-full border-primary/20 bg-primary/[0.1] text-primary">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    <Textarea
                      value={currentNote}
                      onChange={(e) => saveNote.mutate({ date: dateISO, content: e.target.value })}
                      placeholder="اكتب أفكارك هنا..."
                      className="min-h-[7rem] md:min-h-[8rem] resize-none"
                      data-testid="textarea-notes"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="lg:col-span-4 space-y-5 md:space-y-6">
            <HabitTracker habits={data.habits} weekStart={weekDays[0]} />
            <TaskList tasks={data.tasks} selectedDate={weekDays[0]} isWeeklyMode={true} />
          </div>
        </div>

        <div className="mt-5 md:mt-6">
          <GanttTimeline events={data.events} selectedDate={selectedDate} onScrollToEvents={scrollToEvents} />
        </div>

        <div className="mt-5 md:mt-6">
          <WeeklyGraphs tasks={data.tasks} habits={data.habits} events={data.events} selectedDate={selectedDate} />
        </div>
      </main>

      <Dialog open={templatePickerOpen} onOpenChange={setTemplatePickerOpen}>
        <DialogContent className="max-w-2xl" dir="rtl" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>اختر قالبًا للمخطط الأسبوعي</DialogTitle>
            <DialogDescription>سيتم تعبئة الصفحة مباشرة بدون الانتقال لصفحة إعداد.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-auto pr-1">
            {TEMPLATES.map((template) => {
              const selected = selectedTemplateId === template.id;
              return (
                <Button
                  key={template.id}
                  type="button"
                  variant={selected ? "default" : "outline"}
                  className={cn(
                    "h-auto py-3 px-3 justify-start text-right",
                    selected && "ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <div className="flex items-start gap-2 w-full">
                    <span className="text-xl">{template.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{template.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{template.description}</p>
                    </div>
                    {selected && <Check className="w-4 h-4 shrink-0 text-primary-foreground" />}
                  </div>
                </Button>
              );
            })}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTemplatePickerOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={applyTemplateInPlace}>تطبيق القالب</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

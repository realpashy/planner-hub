import React, { useState } from "react";
import { Link } from "wouter";
import { usePlannerData, useSaveNote } from "@/hooks/use-planner";
import { getWeekHeader, getWeekDays, addWeeks, subWeeks, formatISODate } from "@/lib/date-utils";
import { DayStrip } from "@/components/planner/DayStrip";
import { FocusTags } from "@/components/planner/FocusTags";
import { EventList } from "@/components/planner/EventList";
import { TaskList } from "@/components/planner/TaskList";
import { HabitTracker } from "@/components/planner/HabitTracker";
import { MonthCalendar } from "@/components/planner/MonthCalendar";
import { FAB } from "@/components/planner/FAB";
import { ChevronRight, ChevronLeft, ArrowRight, Calendar as CalendarIcon } from "lucide-react";
import { motion } from "framer-motion";
import * as Popover from "@radix-ui/react-popover";

export default function WeeklyPlanner() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const { data, isLoading } = usePlannerData();
  const saveNote = useSaveNote();
  
  if (isLoading || !data) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  const weekDays = getWeekDays(selectedDate);
  const weekStart = weekDays[0];
  const dateISO = formatISODate(selectedDate);
  const currentNote = data.notes.find(n => n.date === dateISO)?.content || "";

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12" dir="rtl">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors p-2 -ml-2 rounded-full hover:bg-slate-100">
              <ArrowRight className="w-6 h-6" />
            </Link>
            
            <Popover.Root>
              <Popover.Trigger asChild>
                <button className="flex flex-col items-center group">
                  <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2 group-hover:text-primary transition-colors">
                    {getWeekHeader(selectedDate)}
                    <CalendarIcon className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                  </h2>
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content className="z-50" align="center" sideOffset={8}>
                  <MonthCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            <div className="flex items-center gap-1" dir="ltr">
              <button onClick={() => setSelectedDate(subWeeks(selectedDate, 1))} className="p-2 rounded-full hover:bg-slate-100 text-slate-600">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={() => setSelectedDate(addWeeks(selectedDate, 1))} className="p-2 rounded-full hover:bg-slate-100 text-slate-600">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <DayStrip days={weekDays} selectedDate={selectedDate} onSelect={setSelectedDate} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Day Column */}
        <div className="lg:col-span-8 space-y-6">
          <motion.div 
            key={dateISO} // Re-animate on date change
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-[2rem] p-6 md:p-8 card-shadow border border-slate-100"
          >
            <FocusTags tags={data.tags} selectedDate={selectedDate} />
            
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-8" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <EventList events={data.events} selectedDate={selectedDate} />
              <TaskList tasks={data.tasks} selectedDate={selectedDate} />
            </div>

            <div className="mt-8">
              <h3 className="font-bold text-lg text-slate-700 mb-3">ملاحظات اليوم</h3>
              <textarea
                value={currentNote}
                onChange={(e) => saveNote.mutate({ date: dateISO, content: e.target.value })}
                placeholder="اكتب أفكارك وملاحظاتك هنا..."
                className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none transition-all"
              />
            </div>
          </motion.div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-8">
          <TaskList tasks={data.tasks} selectedDate={weekStart} isWeeklyMode={true} />
          <HabitTracker habits={data.habits} weekStart={weekStart} />
        </div>
      </main>

      <FAB onAction={(action) => {
         window.scrollTo({ top: 0, behavior: 'smooth' });
         // In a real complex app, FAB would open specific modals based on action ID
      }} />
    </div>
  );
}

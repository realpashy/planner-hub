import { useRef, useEffect, useState } from "react";
import type { EventItem } from "@shared/schema";
import { formatISODate, getWeekDays, getDayShortName } from "@/lib/date-utils";
import { motion } from "framer-motion";
import { Clock, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { useUpdateEvent } from "@/hooks/use-planner";
import { Drawer } from "vaul";
import { useIsMobile } from "@/hooks/use-mobile";
import { X } from "lucide-react";
import { AnimatePresence } from "framer-motion";

interface GanttTimelineProps {
  events: EventItem[];
  selectedDate: Date;
  onScrollToEvents?: () => void;
}

function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function formatHour(h: number): string {
  if (h === 0) return "12 ص";
  if (h < 12) return `${h} ص`;
  if (h === 12) return "12 م";
  return `${h - 12} م`;
}

function EventCommentDialog({ isOpen, onClose, event, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  onSave: (id: string, comment: string) => void;
}) {
  const [comment, setComment] = useState(event?.comment || "");
  const isMobile = useIsMobile();

  useEffect(() => {
    if (event) setComment(event.comment || "");
  }, [event]);

  if (!event) return null;

  const content = (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400 font-sans tabular-nums">{event.time}</span>
        </div>
        <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">{event.title}</h4>
      </div>
      <div>
        <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2 block">ملاحظات</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="أضف ملاحظات لهذا الموعد..."
          rows={4}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none transition-all"
          data-testid="textarea-event-comment"
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => { onSave(event.id, comment); onClose(); }}
          className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          data-testid="button-save-event-comment"
        >
          حفظ
        </button>
        <button
          onClick={onClose}
          className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          data-testid="button-cancel-event-comment"
        >
          إلغاء
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[24px] fixed bottom-0 left-0 right-0 z-50 outline-none" dir="rtl">
            <div className="p-5 pb-8">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 mb-6" />
              <Drawer.Title className="font-bold text-lg text-slate-900 dark:text-slate-50 mb-4">تفاصيل الموعد</Drawer.Title>
              <Drawer.Description className="sr-only">عرض وتعديل ملاحظات الموعد</Drawer.Description>
              {content}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl relative z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">تفاصيل الموعد</h3>
              <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors" data-testid="button-close-event-comment">
                <X className="w-5 h-5" />
              </button>
            </div>
            {content}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function GanttTimeline({ events, selectedDate, onScrollToEvents }: GanttTimelineProps) {
  const weekDays = getWeekDays(selectedDate);
  const weekISOs = weekDays.map(d => formatISODate(d));
  const weekEvents = events.filter(e => weekISOs.includes(e.date)).sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    return dateComp !== 0 ? dateComp : a.time.localeCompare(b.time);
  });

  const updateEvent = useUpdateEvent();
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (weekEvents.length === 0) return null;

  const allMinutes = weekEvents.map(e => parseTime(e.time));
  const minHour = Math.max(0, Math.floor(Math.min(...allMinutes) / 60) - 1);
  const maxHour = Math.min(24, Math.ceil(Math.max(...allMinutes) / 60) + 1);
  const totalHours = maxHour - minHour;
  const hourWidth = 80;
  const dayHeight = 44;

  const eventsByDay = weekISOs.map(iso => weekEvents.filter(e => e.date === iso));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden" data-testid="gantt-timeline">
      <div className="flex items-center justify-between px-4 md:px-5 pt-4 md:pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center">
            <Clock className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-bold text-base md:text-lg text-slate-800 dark:text-slate-100">جدول المواعيد</h3>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full">{weekEvents.length}</span>
        </div>
        <div className="flex items-center gap-1">
          {onScrollToEvents && (
            <button
              onClick={onScrollToEvents}
              className="text-xs font-semibold text-primary px-2.5 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
              data-testid="button-goto-events"
            >
              عرض التفاصيل
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            data-testid="button-toggle-gantt"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div ref={scrollRef} className="overflow-x-auto hide-scrollbar pb-4 px-4 md:px-5" dir="ltr">
              <div style={{ minWidth: totalHours * hourWidth + 60 }}>
                <div className="flex" style={{ marginRight: 60 }}>
                  {Array.from({ length: totalHours }, (_, i) => {
                    const hour = minHour + i;
                    const isNowHour = new Date().getHours() === hour && weekISOs.includes(formatISODate(new Date()));
                    return (
                      <div key={hour} className="flex-shrink-0 text-center" style={{ width: hourWidth }}>
                        <span className={`text-[10px] font-bold tabular-nums ${isNowHour ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
                          {formatHour(hour)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="relative mt-1">
                  {Array.from({ length: totalHours + 1 }, (_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800"
                      style={{ left: 60 + i * hourWidth }}
                    />
                  ))}

                  {(() => {
                    const now = new Date();
                    const nowISO = formatISODate(now);
                    if (weekISOs.includes(nowISO)) {
                      const nowMinutes = now.getHours() * 60 + now.getMinutes();
                      const nowPos = ((nowMinutes - minHour * 60) / (totalHours * 60)) * (totalHours * hourWidth);
                      if (nowPos >= 0 && nowPos <= totalHours * hourWidth) {
                        return (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                            style={{ left: 60 + nowPos }}
                          >
                            <div className="w-2 h-2 rounded-full bg-red-400 -translate-x-[3px] -translate-y-1" />
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}

                  {weekISOs.map((iso, dayIdx) => {
                    const dayEvts = eventsByDay[dayIdx];
                    const dayLabel = getDayShortName(weekDays[dayIdx]);
                    const isToday = iso === formatISODate(new Date());

                    return (
                      <div key={iso} className="flex items-center" style={{ height: dayHeight }}>
                        <div className="flex-shrink-0 w-[60px] pr-2 text-left">
                          <span className={`text-[11px] font-bold ${isToday ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
                            {dayLabel}
                          </span>
                        </div>
                        <div className="flex-1 relative" style={{ height: dayHeight - 8 }}>
                          {dayEvts.map((evt, evtIdx) => {
                            const minutes = parseTime(evt.time);
                            const leftPos = ((minutes - minHour * 60) / (totalHours * 60)) * (totalHours * hourWidth);
                            const hasComment = !!evt.comment;
                            const now = new Date();
                            const evtDate = new Date(evt.date + "T" + evt.time);
                            const isPast = evtDate < now;

                            return (
                              <motion.div
                                key={evt.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: evtIdx * 0.05 }}
                                onClick={() => setSelectedEvent(evt)}
                                className={`absolute top-1/2 -translate-y-1/2 cursor-pointer group z-10 ${isPast ? 'opacity-60' : ''}`}
                                style={{ left: leftPos }}
                                data-testid={`gantt-event-${evt.id}`}
                              >
                                <div className={`
                                  flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap
                                  transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
                                  ${isPast
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                    : 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-500/25'
                                  }
                                `}>
                                  <span className="font-sans tabular-nums text-[10px]">{evt.time}</span>
                                  <span className="max-w-[120px] truncate">{evt.title}</span>
                                  {hasComment && <MessageSquare className="w-2.5 h-2.5 flex-shrink-0 opacity-60" />}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <EventCommentDialog
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
        onSave={(id, comment) => updateEvent.mutate({ id, comment })}
      />
    </div>
  );
}

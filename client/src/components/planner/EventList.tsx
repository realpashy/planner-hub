import { useState, useEffect } from "react";
import type { EventItem } from "@shared/schema";
import { formatISODate } from "@/lib/date-utils";
import { useCreateEvent, useDeleteEvent, useUpdateEvent } from "@/hooks/use-planner";
import { Clock, Plus, Trash2, CircleDot, MessageSquare, X } from "lucide-react";
import { ExpandableText } from "./ExpandableText";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveConfirm } from "../ResponsiveConfirm";
import { Drawer } from "vaul";
import { useIsMobile } from "@/hooks/use-mobile";

function EventDetailDialog({ isOpen, onClose, event, onSave }: {
  isOpen: boolean; onClose: () => void; event: EventItem | null;
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
          rows={3}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none transition-all"
          data-testid="textarea-event-detail-comment"
        />
      </div>
      <div className="flex gap-3">
        <button onClick={() => { onSave(event.id, comment); onClose(); }} className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20" data-testid="button-save-detail-comment">حفظ</button>
        <button onClick={onClose} className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" data-testid="button-cancel-detail-comment">إلغاء</button>
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
              <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors" data-testid="button-close-event-detail"><X className="w-5 h-5" /></button>
            </div>
            {content}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function EventList({ events, selectedDate }: { events: EventItem[], selectedDate: Date }) {
  const dateISO = formatISODate(selectedDate);
  const dayEvents = events.filter(e => e.date === dateISO).sort((a, b) => a.time.localeCompare(b.time));

  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const updateEvent = useUpdateEvent();

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null);

  const handleAdd = () => {
    if (newTitle && newTime) {
      createEvent.mutate({ date: dateISO, title: newTitle, time: newTime });
      setNewTitle("");
      setNewTime("");
      setIsAdding(false);
    }
  };

  return (
    <div className="weekly-events-widget" data-testid="events-section">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center">
            <Clock className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-bold text-base md:text-lg text-slate-800 dark:text-slate-100">المواعيد</h3>
          {dayEvents.length > 0 && (
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full">{dayEvents.length}</span>
          )}
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            const now = new Date();
            setNewTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
          }}
          className="weekly-events-add-btn text-sm font-semibold text-white flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all"
          data-testid="button-add-event"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة</span>
        </button>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {dayEvents.map(event => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={() => setDetailEvent(event)}
              className="weekly-event-row group flex items-center gap-3 bg-slate-100/90 dark:bg-slate-800/60 rounded-xl p-3 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              data-testid={`event-item-${event.id}`}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-50 dark:bg-sky-500/15 flex items-center justify-center">
                <CircleDot className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-700 dark:text-slate-200 text-sm md:text-base">
                  <ExpandableText text={event.title} maxLength={40} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold font-sans tabular-nums">{event.time}</span>
                  {event.comment && (
                    <span className="flex items-center gap-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                      <MessageSquare className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteId(event.id); }}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0"
                data-testid={`button-delete-event-${event.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3"
          >
            <div className="flex gap-2 mb-2">
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2.5 text-sm font-sans focus:outline-none focus:border-primary w-28 text-slate-700 dark:text-slate-200" data-testid="input-event-time" />
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="عنوان الموعد..." autoFocus className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600" onKeyDown={(e) => e.key === 'Enter' && handleAdd()} data-testid="input-event-title" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsAdding(false)} className="text-sm px-4 py-2 font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" data-testid="button-cancel-event">إلغاء</button>
              <button onClick={handleAdd} className="text-sm px-4 py-2 font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors" data-testid="button-save-event">حفظ</button>
            </div>
          </motion.div>
        )}

        {!isAdding && dayEvents.length === 0 && (
          <div className="text-center py-6 text-slate-300 dark:text-slate-600 text-sm rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            لا توجد مواعيد
          </div>
        )}
      </div>

      <EventDetailDialog
        isOpen={!!detailEvent}
        onClose={() => setDetailEvent(null)}
        event={detailEvent}
        onSave={(id, comment) => updateEvent.mutate({ id, comment })}
      />

      <ResponsiveConfirm
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteEvent.mutate(deleteId)}
        title="حذف الموعد"
        description="هل أنت متأكد من حذف هذا الموعد؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
}


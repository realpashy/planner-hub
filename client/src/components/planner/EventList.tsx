import { useState } from "react";
import type { EventItem } from "@shared/schema";
import { formatISODate } from "@/lib/date-utils";
import { useCreateEvent, useDeleteEvent } from "@/hooks/use-planner";
import { Clock, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveConfirm } from "../ResponsiveConfirm";

function getEmojiForTitle(title: string) {
  if (title.includes('رياض') || title.includes('تمرين') || title.includes('نادي')) return '💪';
  if (title.includes('تسوق') || title.includes('شراء') || title.includes('سوق')) return '🛒';
  if (title.includes('اجتماع') || title.includes('عمل') || title.includes('لقاء')) return '📅';
  if (title.includes('دراس') || title.includes('مذاكر') || title.includes('كتاب')) return '📚';
  if (title.includes('طعام') || title.includes('عشاء') || title.includes('غداء') || title.includes('فطور')) return '🍽️';
  if (title.includes('سفر') || title.includes('رحل') || title.includes('طيران')) return '✈️';
  if (title.includes('طبيب') || title.includes('صحة') || title.includes('مستشفى')) return '🏥';
  return undefined;
}

export function EventList({ events, selectedDate }: { events: EventItem[], selectedDate: Date }) {
  const dateISO = formatISODate(selectedDate);
  const dayEvents = events.filter(e => e.date === dateISO).sort((a, b) => a.time.localeCompare(b.time));

  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAdd = () => {
    if (newTitle && newTime) {
      const emoji = getEmojiForTitle(newTitle);
      createEvent.mutate({
        date: dateISO,
        title: newTitle,
        time: newTime,
        icon: emoji
      });
      setNewTitle("");
      setNewTime("");
      setIsAdding(false);
    }
  };

  return (
    <div data-testid="events-section">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="font-bold text-base text-slate-800">المواعيد</h3>
          {dayEvents.length > 0 && (
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{dayEvents.length}</span>
          )}
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            const now = new Date();
            setNewTime(`${String(now.getHours()).padStart(2, '0')}:00`);
          }}
          className="text-sm font-semibold text-primary flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-primary/5 transition-colors"
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
              className="group flex items-center gap-3 bg-slate-50/80 rounded-xl p-3 hover:bg-slate-50 transition-colors"
              data-testid={`event-item-${event.id}`}
            >
              <div className="flex-shrink-0 text-xs font-bold text-slate-400 bg-white border border-slate-100 rounded-lg px-2 py-1 min-w-[3rem] text-center font-sans tabular-nums">
                {event.time}
              </div>
              {event.icon && (
                <span className="text-lg flex-shrink-0">{event.icon}</span>
              )}
              <div
                className={`flex-1 min-w-0 font-semibold text-slate-700 text-sm ${expandedId === event.id ? '' : 'truncate'} cursor-pointer`}
                onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
              >
                {event.title}
              </div>
              <button
                onClick={() => setDeleteId(event.id)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
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
            className="bg-slate-50 border border-slate-200 rounded-xl p-3"
          >
            <div className="flex gap-2 mb-2">
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-sm font-sans focus:outline-none focus:border-primary w-24"
                data-testid="input-event-time"
              />
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="عنوان الموعد..."
                autoFocus
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                data-testid="input-event-title"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsAdding(false)} className="text-xs px-3 py-1.5 font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" data-testid="button-cancel-event">إلغاء</button>
              <button onClick={handleAdd} className="text-xs px-3 py-1.5 font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors" data-testid="button-save-event">حفظ</button>
            </div>
          </motion.div>
        )}

        {!isAdding && dayEvents.length === 0 && (
          <div className="text-center py-5 text-slate-300 text-sm rounded-xl border border-dashed border-slate-200">
            لا توجد مواعيد
          </div>
        )}
      </div>

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

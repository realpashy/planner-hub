import React, { useState } from "react";
import { EventItem } from "@shared/schema";
import { formatISODate } from "@/lib/date-utils";
import { useCreateEvent, useDeleteEvent } from "@/hooks/use-planner";
import { Clock, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveConfirm } from "../ResponsiveConfirm";

function getEmojiForTitle(title: string) {
  if (title.includes('رياض') || title.includes('تمرين')) return '💪';
  if (title.includes('تسوق') || title.includes('شراء')) return '🛒';
  if (title.includes('اجتماع') || title.includes('عمل') || title.includes('لقاء')) return '📅';
  if (title.includes('دراس') || title.includes('مذاكر') || title.includes('كتاب')) return '📚';
  if (title.includes('طعام') || title.includes('عشاء') || title.includes('غداء')) return '🍽️';
  if (title.includes('سفر') || title.includes('رحل')) return '✈️';
  return '📌';
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

  const handleAdd = () => {
    if (newTitle && newTime) {
      createEvent.mutate({
        date: dateISO,
        title: newTitle,
        time: newTime,
        icon: getEmojiForTitle(newTitle)
      });
      setNewTitle("");
      setNewTime("");
      setIsAdding(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Clock className="w-5 h-5 text-warning" />
          <h3 className="font-bold text-lg">المواعيد</h3>
        </div>
        <button 
          onClick={() => {
            setIsAdding(true);
            const now = new Date();
            setNewTime(`${String(now.getHours()).padStart(2,'0')}:00`);
          }}
          className="text-sm font-semibold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 inline-block ml-1" /> إضافة
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {dayEvents.map(event => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="group flex items-center bg-white border border-slate-100 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
            >
              <div className="w-1.5 absolute right-0 top-0 bottom-0 bg-warning/80" />
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 text-xl mr-2 ml-4">
                {event.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 truncate">{event.title}</h4>
                <p className="text-sm text-slate-400 font-medium font-sans">{event.time}</p>
              </div>
              <button 
                onClick={() => setDeleteId(event.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-4"
          >
            <div className="flex gap-3 mb-3">
              <input 
                type="time" 
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-sans focus:outline-primary w-28"
              />
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="عنوان الموعد..."
                autoFocus
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-primary"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsAdding(false)} className="text-xs px-4 py-2 font-semibold text-slate-500">إلغاء</button>
              <button onClick={handleAdd} className="text-xs px-4 py-2 font-semibold bg-primary text-white rounded-lg shadow-sm hover:bg-primary/90">حفظ</button>
            </div>
          </motion.div>
        )}
        
        {!isAdding && dayEvents.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-sm bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            لا توجد مواعيد مضافة اليوم
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

import { useState, useEffect } from "react";
import type { EventItem } from "@shared/schema";
import { formatISODate } from "@/lib/date-utils";
import { useCreateEvent, useDeleteEvent, useUpdateEvent } from "@/hooks/use-planner";
import { Clock, Plus, Trash2, CircleDot, MessageSquare } from "lucide-react";
import { ExpandableText } from "./ExpandableText";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveConfirm } from "../ResponsiveConfirm";
import { Drawer } from "vaul";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
          <span className="text-sm font-bold text-muted-foreground font-sans tabular-nums">{event.time}</span>
        </div>
        <h4 className="font-bold text-base text-foreground">{event.title}</h4>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-bold">ملاحظات</Label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="أضف ملاحظات لهذا الموعد..."
          rows={3}
          className="resize-none"
          data-testid="textarea-event-detail-comment"
        />
      </div>
      <div className="flex gap-3">
        <Button className="flex-1" onClick={() => { onSave(event.id, comment); onClose(); }} data-testid="button-save-detail-comment">حفظ</Button>
        <Button variant="secondary" onClick={onClose} data-testid="button-cancel-detail-comment">إلغاء</Button>
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تفاصيل الموعد</DialogTitle>
          <DialogDescription className="sr-only">عرض وتعديل ملاحظات الموعد</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
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
    <div className="space-y-4" data-testid="events-section">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Clock className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-bold text-base md:text-lg text-foreground">المواعيد</h3>
          {dayEvents.length > 0 && (
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{dayEvents.length}</span>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => {
            setIsAdding(true);
            const now = new Date();
            setNewTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
          }}
          data-testid="button-add-event"
        >
          <Plus className="w-4 h-4" />
          إضافة
        </Button>
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
              className="group flex items-center gap-3 bg-muted/80 rounded-xl p-3 hover:bg-muted transition-colors cursor-pointer border border-transparent hover:border-border"
              data-testid={`event-item-${event.id}`}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <CircleDot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground text-sm md:text-base">
                  <ExpandableText text={event.title} maxLength={40} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-semibold font-sans tabular-nums">{event.time}</span>
                  {event.comment && <MessageSquare className="w-2.5 h-2.5 text-muted-foreground" />}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); setDeleteId(event.id); }}
                data-testid={`button-delete-event-${event.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>

        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-xl border bg-card p-3 space-y-2"
          >
            <div className="flex gap-2">
              <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-28" data-testid="input-event-time" />
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="عنوان الموعد..." autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAdd()} className="flex-1" data-testid="input-event-title" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsAdding(false)} data-testid="button-cancel-event">إلغاء</Button>
              <Button size="sm" onClick={handleAdd} data-testid="button-save-event">حفظ</Button>
            </div>
          </motion.div>
        )}

        {!isAdding && dayEvents.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm rounded-xl border border-dashed border-border">
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


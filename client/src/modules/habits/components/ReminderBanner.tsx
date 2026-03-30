import { BellRing, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReminderItem } from "@/modules/habits/types";

interface ReminderBannerProps {
  reminders: ReminderItem[];
}

export function ReminderBanner({ reminders }: ReminderBannerProps) {
  if (!reminders.length) {
    return (
      <div className="surface-subtle rounded-[calc(var(--radius)+0.75rem)] p-4 text-right">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-black text-foreground">اليوم هادئ وواضح</p>
            <p className="text-xs leading-6 text-muted-foreground">لا توجد تذكيرات مفتوحة الآن. أكمل على نفس الإيقاع.</p>
          </div>
          <div className="icon-chip h-11 w-11 rounded-[calc(var(--radius)+0.375rem)] border-emerald-500/20 bg-emerald-500/[0.12] text-emerald-300">
            <BellRing className="h-5 w-5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-subtle rounded-[calc(var(--radius)+0.75rem)] p-4 text-right">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-black text-foreground">تذكيرات اليوم</p>
          <p className="text-xs leading-6 text-muted-foreground">تظهر هنا فقط العادات التي ما زالت بحاجة لخطوة اليوم.</p>
        </div>
        <div className="icon-chip h-11 w-11 rounded-[calc(var(--radius)+0.375rem)] border-sky-500/20 bg-sky-500/[0.12] text-sky-300">
          <Clock3 className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-2">
        {reminders.slice(0, 3).map((reminder) => (
          <div
            key={reminder.id}
            className={cn(
              "rounded-[calc(var(--radius)+0.375rem)] border px-3.5 py-3 text-right",
              reminder.tone === "attention"
                ? "border-amber-500/20 bg-amber-500/[0.07]"
                : "border-sky-500/20 bg-sky-500/[0.07]",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">{reminder.title}</p>
                <p className="text-xs leading-6 text-muted-foreground">{reminder.description}</p>
              </div>
              {reminder.time ? (
                <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  {reminder.time}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

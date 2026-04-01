import { BellRing, CalendarClock, HeartPulse, TimerReset } from "lucide-react";

interface AICoachSignalsProps {
  moodLabel?: string | null;
  moodHint?: string | null;
  pendingToday: number;
  averagePercent: number;
  reminderCount: number;
  bestStreak: number;
}

export function AICoachSignals({
  moodLabel,
  moodHint,
  pendingToday,
  averagePercent,
  reminderCount,
  bestStreak,
}: AICoachSignalsProps) {
  const items = [
    {
      key: "mood",
      label: "مزاج اليوم",
      value: moodLabel ?? "غير مسجل",
      helper: moodHint ?? "اختيار سريع فقط",
      icon: HeartPulse,
      tone:
        "border-primary/20 text-primary shadow-[0_0_0_1px_rgba(149,223,30,0.16),0_0_16px_rgba(149,223,30,0.12)]",
    },
    {
      key: "pending",
      label: "المتبقي اليوم",
      value: `${pendingToday}`,
      helper: "عادات تحتاج خطوة",
      icon: TimerReset,
      tone:
        "border-sky-500/20 text-sky-300 shadow-[0_0_0_1px_rgba(14,165,233,0.16),0_0_16px_rgba(14,165,233,0.12)]",
    },
    {
      key: "average",
      label: "متوسط الأسبوع",
      value: `${averagePercent}%`,
      helper: "قراءة سريعة للإيقاع",
      icon: CalendarClock,
      tone:
        "border-amber-500/20 text-amber-300 shadow-[0_0_0_1px_rgba(245,158,11,0.16),0_0_16px_rgba(245,158,11,0.12)]",
    },
    {
      key: "reminders",
      label: "تذكيرات مفتوحة",
      value: `${reminderCount}`,
      helper: `أفضل سلسلة: ${bestStreak} أيام`,
      icon: BellRing,
      tone:
        "border-emerald-500/20 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.16),0_0_16px_rgba(16,185,129,0.12)]",
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map(({ key, label, value, helper, icon: Icon, tone }) => (
        <div
          key={key}
          className="rounded-[calc(var(--radius)+0.55rem)] border border-border/70 bg-background/55 p-3 text-right"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">{label}</p>
              <p className="text-base font-black text-foreground">{value}</p>
              <p className="text-[11px] leading-6 text-muted-foreground">{helper}</p>
            </div>
            <div
              className={`inline-flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius)+0.35rem)] border bg-background/70 ${tone}`}
            >
              <Icon className="h-4 w-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export function PlannerSkeleton() {
  return (
    <div className="space-y-6" dir="rtl">
      <LoadingSkeleton className="rounded-[2rem] border-white/50 bg-white/70 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.06)] dark:bg-slate-900/80" lines={4} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <LoadingSkeleton className="rounded-[1.75rem] border-white/50 bg-white/70 p-5 dark:bg-slate-900/80" lines={4} />
        <LoadingSkeleton className="rounded-[1.75rem] border-white/50 bg-white/70 p-5 dark:bg-slate-900/80" lines={4} />
        <LoadingSkeleton className="rounded-[1.75rem] border-white/50 bg-white/70 p-5 dark:bg-slate-900/80" lines={4} />
      </div>
    </div>
  );
}

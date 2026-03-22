import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlannerStatPillProps {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "neutral" | "accent" | "soft";
  className?: string;
}

export function PlannerStatPill({
  icon: Icon,
  label,
  value,
  tone = "neutral",
  className,
}: PlannerStatPillProps) {
  return (
    <div
      className={cn(
        "flex min-h-[92px] items-center justify-between gap-4 rounded-[1.1rem] border px-4 py-3 text-right shadow-[0_14px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm",
        "border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,247,255,0.92))] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.92),rgba(15,23,42,0.82))]",
        tone === "accent" && "shadow-[0_16px_34px_rgba(99,102,241,0.08)]",
        tone === "soft" && "shadow-[0_16px_34px_rgba(16,185,129,0.08)]",
        tone === "neutral" && "shadow-[0_14px_30px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      <div className="space-y-1.5 text-right">
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-black tracking-tight text-foreground">{value}</p>
      </div>
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
          tone === "accent" && "border-indigo-200/70 bg-indigo-500/12 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/16 dark:text-indigo-200",
          tone === "soft" && "border-emerald-200/70 bg-emerald-500/12 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/16 dark:text-emerald-200",
          tone === "neutral" && "border-slate-200/80 bg-slate-900/[0.04] text-slate-700 dark:border-slate-600/70 dark:bg-white/10 dark:text-slate-100",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}

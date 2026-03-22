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
        "flex min-h-[88px] items-center justify-between gap-4 rounded-[1rem] border px-4 py-3 text-right shadow-[0_10px_24px_rgba(15,23,42,0.04)]",
        tone === "accent" && "border-indigo-200/70 bg-[linear-gradient(180deg,rgba(238,242,255,0.95),rgba(224,231,255,0.85))] dark:border-indigo-400/20 dark:bg-[linear-gradient(180deg,rgba(49,46,129,0.28),rgba(30,41,59,0.58))]",
        tone === "soft" && "border-emerald-200/60 bg-[linear-gradient(180deg,rgba(236,253,245,0.95),rgba(209,250,229,0.82))] dark:border-emerald-400/20 dark:bg-[linear-gradient(180deg,rgba(6,78,59,0.26),rgba(15,23,42,0.58))]",
        tone === "neutral" && "border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,245,249,0.92))] dark:border-slate-700/70 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.9),rgba(15,23,42,0.76))]",
        className,
      )}
    >
      <div className="space-y-1 text-right">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="text-lg font-black tracking-tight text-foreground">{value}</p>
      </div>
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full",
        tone === "accent" && "bg-indigo-500/12 text-indigo-700 dark:bg-indigo-400/16 dark:text-indigo-200",
        tone === "soft" && "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/16 dark:text-emerald-200",
        tone === "neutral" && "bg-slate-900/[0.05] text-slate-700 dark:bg-white/10 dark:text-slate-100",
      )}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}

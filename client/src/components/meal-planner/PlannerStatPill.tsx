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
        "flex min-h-[98px] items-center justify-between gap-4 rounded-[calc(var(--radius)+0.5rem)] border border-border/80 bg-[linear-gradient(180deg,rgba(42,42,42,0.96),rgba(33,33,33,0.96))] px-4 py-3 text-right shadow-[var(--app-shadow)] backdrop-blur-sm transition-colors duration-200 hover:border-primary/15",
        className,
      )}
    >
      <div className="space-y-1.5 text-right flex-1">
        <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
        <p className="text-xl font-black tracking-tight text-foreground">{value}</p>
      </div>
      <div
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-[calc(var(--radius)+0.375rem)] border shadow-[var(--app-shadow)]",
          tone === "accent" && "border-primary/25 bg-primary/[0.12] text-primary",
          tone === "soft" && "border-emerald-500/20 bg-emerald-500/[0.1] text-emerald-300",
          tone === "neutral" && "border-sky-500/20 bg-sky-500/[0.1] text-sky-300",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}

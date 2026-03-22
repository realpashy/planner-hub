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
        "flex items-center justify-between gap-3 rounded-[1.15rem] border px-3 py-2.5 text-right shadow-sm",
        tone === "accent" && "border-primary/15 bg-primary/10 text-primary dark:border-primary/25 dark:bg-primary/15",
        tone === "soft" && "border-white/10 bg-white/70 dark:bg-white/5",
        tone === "neutral" && "border-border/60 bg-background/80 dark:bg-white/5",
        className,
      )}
    >
      <div className="space-y-0.5">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-extrabold text-foreground">{value}</p>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-foreground/[0.04] text-foreground/80 dark:bg-white/10">
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}

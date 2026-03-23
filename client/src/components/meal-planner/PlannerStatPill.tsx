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
        "meal-surface-soft flex min-h-[102px] items-center justify-start gap-4 rounded-[5px] px-4 py-3.5 text-right backdrop-blur-sm transition-colors duration-200 hover:border-primary/15",
        className,
      )}
    >
      <div
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-[5px] border border-primary/25 bg-primary text-primary-foreground shadow-[var(--app-shadow)] dark:border-primary/20 dark:bg-primary/[0.12] dark:text-primary",
          tone === "accent" && "bg-primary text-primary-foreground dark:bg-primary/[0.12] dark:text-primary",
          tone === "soft" && "bg-primary text-primary-foreground dark:bg-primary/[0.12] dark:text-primary",
          tone === "neutral" && "bg-primary text-primary-foreground dark:bg-primary/[0.12] dark:text-primary",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-1.5 text-right flex-1">
        <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
        <p className="text-xl font-black tracking-tight text-foreground">{value}</p>
      </div>
    </div>
  );
}

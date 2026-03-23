import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlannerMetaBadgeProps {
  icon: LucideIcon;
  label: string;
  tone?: "default" | "accent" | "success" | "warning";
  className?: string;
}

export function PlannerMetaBadge({
  icon: Icon,
  label,
  tone = "default",
  className,
}: PlannerMetaBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-[var(--app-shadow)] backdrop-blur-sm",
        tone === "accent" && "border-primary/25 bg-primary/[0.12] text-primary",
        tone === "success" && "border-emerald-500/20 bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300",
        tone === "warning" && "border-amber-500/20 bg-amber-500/[0.12] text-amber-700 dark:text-amber-300",
        tone === "default" && "border-border/70 bg-card/80 text-muted-foreground",
        className,
      )}
    >
      {label}
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

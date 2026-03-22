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
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold backdrop-blur-sm",
        tone === "accent" && "border-primary/20 bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-primary/25 dark:bg-primary/15",
        tone === "success" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        tone === "warning" && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        tone === "default" && "border-border/60 bg-background/75 text-muted-foreground dark:bg-white/5",
        className,
      )}
    >
      {label}
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

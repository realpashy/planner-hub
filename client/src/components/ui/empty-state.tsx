import type { LucideIcon } from "lucide-react";
import { InteractiveCard } from "@/components/ui/interactive-card";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <InteractiveCard className={cn("overflow-hidden bg-[linear-gradient(145deg,rgba(20,184,166,0.08),rgba(255,255,255,0.85))] p-6 text-right dark:bg-[linear-gradient(145deg,rgba(20,184,166,0.14),rgba(15,23,42,0.92))]", className)}>
      <div className="space-y-4">
        <div className="flex justify-end">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-extrabold text-foreground">{title}</h3>
          <p className="text-sm leading-7 text-muted-foreground">{description}</p>
        </div>
        {actionLabel && onAction ? (
          <InteractiveButton className="h-11 w-full" onClick={onAction}>
            {actionLabel}
          </InteractiveButton>
        ) : null}
      </div>
    </InteractiveCard>
  );
}

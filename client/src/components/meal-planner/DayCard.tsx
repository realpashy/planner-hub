import { Droplets } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { InteractiveCard } from "@/components/ui/interactive-card";
import { cn } from "@/lib/utils";

interface DayCardProps {
  title: string;
  subtitle: string;
  mealCount: number;
  completionPercent: number;
  waterLabel: string;
  selected?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export function DayCard({
  title,
  subtitle,
  mealCount,
  completionPercent,
  waterLabel,
  selected = false,
  interactive = true,
  onClick,
  children,
  footer,
}: DayCardProps) {
  return (
    <InteractiveCard
      interactive={interactive}
      selected={selected}
      className={cn("overflow-hidden border-border/80 bg-card/95", selected && "shadow-xl")}
      onClick={onClick}
    >
      <div className="space-y-4 p-4 text-right">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-base font-extrabold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <Badge className="rounded-full border-primary/15 bg-primary/10 text-primary">
            {completionPercent}%
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>{mealCount} وجبات</span>
            <span className="inline-flex items-center gap-1">
              <Droplets className="h-3.5 w-3.5" />
              {waterLabel}
            </span>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </div>
        {children}
        {footer}
      </div>
    </InteractiveCard>
  );
}

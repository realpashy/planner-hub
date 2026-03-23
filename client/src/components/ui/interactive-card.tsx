import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface InteractiveCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  interactive?: boolean;
  selected?: boolean;
  compact?: boolean;
}

export const InteractiveCard = React.forwardRef<HTMLDivElement, InteractiveCardProps>(
  ({ className, interactive = false, selected = false, compact = false, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn(
        "rounded-[calc(var(--radius)+0.5rem)] border-border/80 bg-card/95 transition-all duration-200",
        compact ? "shadow-[var(--app-shadow)]" : "shadow-lg",
        interactive && "cursor-pointer hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted/70 hover:shadow-xl active:translate-y-0 active:scale-[0.997]",
        selected && "border-primary/35 bg-primary/[0.08] shadow-lg ring-1 ring-primary/[0.12]",
        className,
      )}
      {...props}
    />
  ),
);

InteractiveCard.displayName = "InteractiveCard";

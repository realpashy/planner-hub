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
        "rounded-[1.6rem] border-border/70 bg-card/95 transition-all duration-200",
        compact ? "shadow-sm" : "shadow-md",
        interactive && "cursor-pointer hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl active:translate-y-0 active:scale-[0.997]",
        selected && "border-primary/40 bg-primary/5 shadow-lg ring-1 ring-primary/15",
        className,
      )}
      {...props}
    />
  ),
);

InteractiveCard.displayName = "InteractiveCard";

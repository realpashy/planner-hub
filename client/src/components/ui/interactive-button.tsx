import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface InteractiveButtonProps extends ButtonProps {
  loading?: boolean;
  active?: boolean;
  feedbackTone?: "default" | "success" | "warning";
}

export const InteractiveButton = React.forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  ({ className, children, loading = false, active = false, feedbackTone = "default", disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "relative overflow-hidden rounded-[calc(var(--radius)+0.25rem)] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/40",
          "hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.99]",
          "whitespace-nowrap",
          active && "border-primary/40 bg-primary/[0.12] text-primary shadow-[var(--app-shadow)]",
          feedbackTone === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
          feedbackTone === "warning" && "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
          className,
        )}
        {...props}
      >
        <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-center">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          <span className={cn("inline-flex items-center justify-center gap-2 whitespace-nowrap", loading && "opacity-90")}>{children}</span>
        </span>
      </Button>
    );
  },
);

InteractiveButton.displayName = "InteractiveButton";

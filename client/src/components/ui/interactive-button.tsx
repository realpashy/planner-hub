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
          "relative overflow-hidden rounded-2xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/40",
          "hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.99]",
          active && "border-primary/50 bg-primary/10 text-primary shadow-md",
          feedbackTone === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
          feedbackTone === "warning" && "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
          className,
        )}
        {...props}
      >
        <span className="flex items-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          <span className={cn(loading && "opacity-90")}>{children}</span>
        </span>
      </Button>
    );
  },
);

InteractiveButton.displayName = "InteractiveButton";

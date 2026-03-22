import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Whitespace-nowrap: Badges should never wrap.
  "whitespace-nowrap inline-flex items-center border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover-elevate",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-xs",
        outline: "border [border-color:var(--badge-outline)] shadow-xs",
        // Premium variants with subtle glass effect
        "primary-soft":
          "border-primary/20 bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
        "success-soft":
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
        "warning-soft":
          "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
        "info-soft":
          "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
        "neutral-soft":
          "border-slate-200/70 bg-white/80 text-slate-600 dark:border-slate-600/50 dark:bg-white/10 dark:text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
        // Glass chip style
        glass:
          "border-white/60 bg-white/80 text-slate-700 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/15 dark:bg-white/10 dark:text-slate-200",
      },
      size: {
        default: "rounded-md px-2.5 py-0.5",
        sm: "rounded px-2 py-0.5 text-[11px]",
        lg: "rounded-lg px-3 py-1",
        pill: "rounded-full px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants }

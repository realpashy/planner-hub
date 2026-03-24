import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Whitespace-nowrap: Badges should never wrap.
  "whitespace-nowrap inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background shadow-[var(--app-shadow)]" +
  " hover-elevate " ,
  {
    variants: {
      variant: {
        default:
          "border-primary/25 bg-primary/[0.1] text-primary dark:bg-primary/[0.15] dark:text-primary",
        secondary: "border-border/80 bg-muted text-muted-foreground",
        destructive:
          "border-destructive/25 bg-destructive/[0.12] text-destructive",

        outline: "border [border-color:var(--badge-outline)] bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants }

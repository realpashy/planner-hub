import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "shadcn-card rounded-xl border text-card-foreground",
  {
    variants: {
      variant: {
        default: "bg-card border-card-border shadow-sm",
        elevated: "border-white/60 bg-card/95 shadow-lg backdrop-blur dark:border-white/10",
        premium: "border-white/70 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.06),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.96))] shadow-[0_24px_64px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent_16%),linear-gradient(180deg,rgba(2,6,23,0.82),rgba(15,23,42,0.94))] dark:shadow-[0_24px_64px_rgba(2,6,23,0.42)]",
        glass: "border-white/50 bg-white/70 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70",
        outline: "border-border bg-transparent shadow-none",
        ghost: "border-transparent bg-transparent shadow-none",
      },
      radius: {
        default: "rounded-xl",
        lg: "rounded-2xl",
        xl: "rounded-[1.5rem]",
        "2xl": "rounded-[1.75rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      radius: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, radius, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, radius, className }))}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}

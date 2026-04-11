import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[calc(var(--radius)+0.35rem)] border text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-[var(--app-shadow)] hover-elevate active-elevate-2",
  {
    variants: {
      variant: {
        default:
          "border-primary/30 bg-[linear-gradient(135deg,rgba(195,255,77,1),rgba(143,199,8,0.95))] text-primary-foreground shadow-[0_0_0_1px_rgba(195,255,77,0.1),0_0_28px_rgba(195,255,77,0.18),0_16px_36px_rgba(0,0,0,0.35)] hover:brightness-[1.03] active:brightness-[0.96]",
        destructive:
          "border-[#ff9c7e]/25 bg-[#ff9c7e]/12 text-[#ffb69f] hover:bg-[#ff9c7e]/18",
        outline:
          "border-white/[0.08] bg-white/[0.04] text-foreground backdrop-blur-xl hover:bg-white/[0.07]",
        secondary: "border-white/[0.06] bg-white/[0.05] text-foreground hover:bg-white/[0.08]",
        ghost: "border-transparent bg-transparent text-muted-foreground shadow-none hover:bg-white/[0.05] hover:text-foreground",
      },
      // Heights are set as "min" heights, because sometimes Ai will place large amount of content
      // inside buttons. With a min-height they will look appropriate with small amounts of content,
      // but will expand to fit large amounts of content.
      size: {
        default: "min-h-11 px-4 py-2.5",
        sm: "min-h-9 px-3 text-xs",
        lg: "min-h-12 px-6 text-sm",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }

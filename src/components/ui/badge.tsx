import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0 sm:py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--brand-navy)] text-white",
        secondary:
          "border-transparent bg-[var(--brand-emerald)] text-white",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-[var(--border)]",
        success:
          "border-transparent bg-emerald-50 text-[var(--success)] border border-emerald-200",
        warning:
          "border-transparent bg-amber-50 text-[var(--warning)] border border-amber-200",
        inactive:
          "border-transparent bg-slate-100 text-[var(--text-secondary)] border border-slate-200",
        premium:
          "border-transparent bg-amber-50 text-amber-900 border border-amber-200/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

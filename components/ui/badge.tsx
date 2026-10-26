import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
    secondary: "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200",
    destructive: "border-transparent bg-rose-100 text-rose-800 hover:bg-rose-200",
    outline: "text-gray-700 border-gray-300",
    success: "border-transparent bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
    warning: "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-200",
  }[variant]

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        variantStyles,
        className
      )}
      {...props}
    />
  )
}

export { Badge }

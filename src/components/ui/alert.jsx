import { cn } from "@/lib/utils"

const variants = {
  default: "bg-muted text-foreground border-border",
  destructive:
    "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
}

export function Alert({ className, variant = "default", children, ...props }) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

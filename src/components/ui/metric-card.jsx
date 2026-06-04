import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export function MetricCard({
  label,
  value,
  hint,
  variant = "default",
  className,
}) {
  const variants = {
    default: "",
    positive:
      "ring-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-card dark:from-emerald-950/20",
    negative:
      "ring-red-200/80 bg-gradient-to-br from-red-50/80 to-card dark:from-red-950/20",
  }

  const valueColors = {
    default: "text-foreground",
    positive: "text-emerald-700 dark:text-emerald-400",
    negative: "text-red-700 dark:text-red-400",
  }

  return (
    <Card
      className={cn(
        "transition-shadow hover:shadow-md",
        variants[variant],
        className
      )}
    >
      <CardContent className="pt-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-2 text-3xl font-semibold tracking-tight tabular-nums",
            valueColors[variant]
          )}
        >
          {value}
        </p>
        {hint && (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )}
      </CardContent>
    </Card>
  )
}

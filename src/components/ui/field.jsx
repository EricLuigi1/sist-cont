import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={htmlFor} className="text-muted-foreground">
          {label}
        </Label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

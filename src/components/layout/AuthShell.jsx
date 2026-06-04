import Link from "next/link"
import { cn } from "@/lib/utils"

export function AuthShell({ children, title, subtitle, footer }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.55_0.16_264/0.12),transparent)]"
        aria-hidden
      />
      <div className="mb-8 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            CP
          </span>
          ContaPro
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestão contábil profissional
        </p>
      </div>
      <div
        className={cn(
          "w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm ring-1 ring-foreground/5"
        )}
      >
        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
      {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
    </div>
  )
}

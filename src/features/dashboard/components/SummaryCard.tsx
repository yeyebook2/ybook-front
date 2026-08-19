import type { LucideIcon } from "lucide-react"

type SummaryCardProps = {
  label: string
  value: number
  icon: LucideIcon
  tone?: "rose" | "wine" | "neutral"
}

const toneClasses = {
  rose: "bg-brand-tertiary text-brand-primary",
  wine: "bg-[#f6e6eb] text-brand-muted",
  neutral: "bg-surface-hover text-text-secondary",
}

export function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: SummaryCardProps) {
  return (
    <article className="flex items-start justify-between rounded-corner-lg border border-border-secondary bg-surface-bg p-xl shadow-sm">
      <div className="flex flex-col gap-xs">
        <span className="text-video-title font-semibold uppercase tracking-[0.13em] text-text-tertiary">
          {label}
        </span>
        <strong className="font-serif text-[32px] leading-none tracking-[-0.04em] text-text-primary">
          {value}
        </strong>
      </div>
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-corner-full ${toneClasses[tone]}`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
      </span>
    </article>
  )
}

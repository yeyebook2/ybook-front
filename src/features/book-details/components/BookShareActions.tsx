import {
  AtSign,
  CircleUserRound,
  Link2,
  MessageCircle,
  Share2,
} from "lucide-react"

type BookShareActionsProps = {
  onShare: (network: "whatsapp" | "facebook" | "x" | "copy") => void
}

export function BookShareActions({ onShare }: BookShareActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-md">
      <span className="inline-flex items-center gap-xs text-label-sm font-medium text-text-secondary">
        <Share2 className="h-4 w-4" aria-hidden="true" />
        Partager
      </span>
      <button
        type="button"
        onClick={() => onShare("whatsapp")}
        aria-label="Partager sur WhatsApp"
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-corner-full border border-border-secondary bg-surface-secondary-bg text-label-sm font-semibold text-text-secondary transition-colors hover:border-brand-primary hover:bg-brand-tertiary hover:text-brand-primary"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onShare("facebook")}
        aria-label="Partager sur Facebook"
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-corner-full border border-border-secondary bg-surface-secondary-bg text-text-secondary transition-colors hover:border-brand-primary hover:bg-brand-tertiary hover:text-brand-primary"
      >
        <CircleUserRound className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onShare("x")}
        aria-label="Partager sur X"
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-corner-full border border-border-secondary bg-surface-secondary-bg text-text-secondary transition-colors hover:border-brand-primary hover:bg-brand-tertiary hover:text-brand-primary"
      >
        <AtSign className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onShare("copy")}
        aria-label="Copier le lien du livre"
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-corner-full border border-border-secondary bg-surface-secondary-bg text-text-secondary transition-colors hover:border-brand-primary hover:bg-brand-tertiary hover:text-brand-primary"
      >
        <Link2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

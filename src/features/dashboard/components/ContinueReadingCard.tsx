import { ArrowRight, BookOpen } from "lucide-react"

import type { DashboardBook } from "../types"

type ContinueReadingCardProps = {
  book: DashboardBook
  onContinue: (book: DashboardBook) => void
}

export function ContinueReadingCard({
  book,
  onContinue,
}: ContinueReadingCardProps) {
  const progress = book.progress ?? 0

  return (
    <article className="group flex min-w-0 gap-lg rounded-corner-lg border border-border-secondary bg-surface-bg p-lg shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <img
        src={book.cover}
        alt={`Couverture de ${book.title}`}
        className="h-28 w-20 shrink-0 rounded-corner-md object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-md py-xs">
        <div className="flex min-w-0 flex-col gap-xs">
          <span className="text-video-title font-semibold uppercase tracking-[0.12em] text-brand-muted">
            {book.category}
          </span>
          <h3 className="truncate font-serif text-heading font-bold text-text-primary">
            {book.title}
          </h3>
          <p className="truncate text-label-sm text-text-secondary">
            {book.author}
          </p>
        </div>
        <div className="flex flex-col gap-sm">
          <div className="flex items-center justify-between text-video-title text-text-tertiary">
            <span>{progress}% lu</span>
            <button
              type="button"
              onClick={() => onContinue(book)}
              className="inline-flex cursor-pointer items-center gap-xs font-semibold text-brand-primary transition-colors hover:text-brand-hover"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              Reprendre
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <div className="h-1.5 overflow-hidden rounded-corner-full bg-surface-hover">
            <div
              className="h-full rounded-corner-full bg-brand-primary transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </article>
  )
}

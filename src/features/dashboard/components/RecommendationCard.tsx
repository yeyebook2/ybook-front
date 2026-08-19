import { ArrowRight, Plus } from "lucide-react"

import type { DashboardBook } from "../types"

type RecommendationCardProps = {
  book: DashboardBook
  onOpen: (book: DashboardBook) => void
  onAdd: (book: DashboardBook) => void
}

export function RecommendationCard({
  book,
  onOpen,
  onAdd,
}: RecommendationCardProps) {
  return (
    <article className="group flex min-w-0 flex-col gap-lg">
      <button
        type="button"
        onClick={() => onOpen(book)}
        className="relative aspect-[2/3] w-full cursor-pointer overflow-hidden rounded-corner-lg border border-border-secondary bg-brand-tertiary text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        aria-label={`Voir la fiche de ${book.title}`}
      >
        <img
          src={book.cover}
          alt={`Couverture de ${book.title}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-[#100908]/45 opacity-0 transition-opacity group-hover:opacity-100" />
        {book.isNew ? (
          <span className="absolute left-md top-md rounded-corner-full bg-brand-primary px-md py-xs text-video-title font-semibold text-on-brand">
            Nouveau
          </span>
        ) : null}
        <span className="absolute bottom-md left-md inline-flex translate-y-2 items-center gap-xs rounded-corner-full bg-[#100908]/72 px-md py-xs text-video-title font-semibold text-white opacity-0 backdrop-blur-sm transition-all group-hover:translate-y-0 group-hover:opacity-100">
          Voir le livre
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </span>
      </button>
      <div className="flex min-w-0 items-start justify-between gap-md">
        <button
          type="button"
          onClick={() => onOpen(book)}
          className="min-w-0 cursor-pointer text-left"
        >
          <h3 className="truncate font-serif text-label font-bold text-text-primary transition-colors hover:text-brand-primary">
            {book.title}
          </h3>
          <p className="truncate text-label-sm text-text-secondary">
            {book.author}
          </p>
        </button>
        <button
          type="button"
          onClick={() => onAdd(book)}
          aria-label={`Ajouter ${book.title} au panier`}
          className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-corner-full border border-border-primary text-brand-primary transition-all hover:border-brand-primary hover:bg-brand-primary hover:text-on-brand"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}

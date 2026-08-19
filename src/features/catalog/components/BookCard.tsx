import { ArrowRight, Plus } from "lucide-react"
import { Badge } from "@figma/astraui"

import type { CatalogBook } from "../types"
import { formatPrice, handleCoverError } from "../catalog.utils"

type BookCardProps = {
  book: CatalogBook
  onOpen: () => void
  onAdd: () => void
}

export function BookCard({ book, onOpen, onAdd }: BookCardProps) {
  return (
    <article className="group flex min-w-0 flex-col gap-lg">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Voir la fiche de « ${book.title} » par ${book.author}`}
        className="relative aspect-[2/3] w-full cursor-pointer overflow-hidden rounded-corner-lg border border-border-secondary bg-brand-tertiary text-left shadow-sm transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl"
      >
        <img
          src={book.cover}
          alt={`Couverture de « ${book.title} »`}
          onError={handleCoverError}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-[#100908]/45 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute left-md top-md">
          <Badge variant="secondary" label={book.category} />
        </div>
        <div className="absolute inset-x-md bottom-md translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="inline-flex items-center gap-xs rounded-corner-full bg-[#100908]/70 px-md py-xs text-video-title font-semibold text-white backdrop-blur-sm">
            Voir le livre <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </span>
        </div>
      </button>
      <div className="flex min-w-0 flex-col gap-xs">
        <button
          type="button"
          onClick={onOpen}
          className="line-clamp-2 cursor-pointer text-left text-label font-semibold text-text-primary transition-colors hover:text-brand-primary"
        >
          {book.title}
        </button>
        <p className="truncate text-label-sm text-text-secondary">
          {book.author}
        </p>
        <div className="mt-xs flex items-center justify-between gap-sm">
          <span className="text-label font-semibold text-text-primary">
            {formatPrice(book.price)}
          </span>
          <button
            type="button"
            onClick={onAdd}
            aria-label={`Ajouter « ${book.title} » au panier`}
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-corner-full border border-border-primary text-brand-primary transition-all hover:border-brand-primary hover:bg-brand-primary hover:text-on-brand"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  )
}

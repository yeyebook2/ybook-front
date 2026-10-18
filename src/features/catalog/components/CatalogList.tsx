import { Plus, BookOpen } from "lucide-react"
import { Button } from "@figma/astraui"

import type { CatalogBook } from "../types"
import { formatPrice, handleCoverError } from "../catalog.utils"
import { RatingStars } from "./RatingStars"

type CatalogListProps = {
  books: CatalogBook[]
  onOpen: (book: CatalogBook) => void
  onAdd: (book: CatalogBook) => void
  ownedBookIds?: Set<string>
  onRead?: (book: CatalogBook) => void
}

export function CatalogList({ books, onOpen, onAdd, ownedBookIds, onRead }: CatalogListProps) {
  return (
    <ul className="flex flex-col gap-lg">
      {books.map((book) => {
        const isOwned = ownedBookIds ? ownedBookIds.has(book.id) : false
        return (
          <li key={book.id}>
            <article className="flex flex-col gap-lg rounded-corner-lg border border-border-secondary bg-surface-bg p-lg transition-shadow hover:shadow-md sm:flex-row">
              <button
                type="button"
                onClick={() => (isOwned && onRead ? onRead(book) : onOpen(book))}
                aria-label={`Voir la fiche de « ${book.title} »`}
                className="h-40 w-28 shrink-0 cursor-pointer overflow-hidden rounded-corner-md bg-brand-tertiary"
              >
                <img
                  src={book.cover}
                  alt={`Couverture de « ${book.title} »`}
                  onError={handleCoverError}
                  className="h-full w-full object-cover"
                />
              </button>
              <div className="flex min-w-0 flex-1 flex-col gap-xs">
                <button
                  type="button"
                  onClick={() => onOpen(book)}
                  className="line-clamp-2 cursor-pointer text-left text-label font-semibold text-text-primary hover:text-brand-primary"
                >
                  {book.title}
                </button>
                <p className="text-label-sm text-text-secondary">
                  {book.author} · {book.category}
                </p>
                <div className="flex items-center gap-sm">
                  {book.reviews > 0 ? (
                    <>
                      <RatingStars rating={book.rating} size="sm" />
                      <span className="text-video-title text-text-tertiary">
                        ({book.reviews} avis)
                      </span>
                    </>
                  ) : (
                    <span className="text-video-title text-text-tertiary italic">
                      Pas encore d'avis
                    </span>
                  )}
                </div>
                <p className="mt-xs line-clamp-3 text-label-sm leading-relaxed text-text-secondary">
                  {book.description}
                </p>
              </div>
              <div className="flex shrink-0 flex-row items-center justify-between gap-md sm:flex-col sm:items-end sm:justify-between">
                <span className="text-label font-semibold text-text-primary">
                  {formatPrice(book.price)}
                </span>
                {isOwned ? (
                  <Button
                    variant="primary"
                    iconStart={<BookOpen className="h-4 w-4" aria-hidden="true" />}
                    onClick={(e) => {
                      e?.stopPropagation?.()
                      if (onRead) onRead(book)
                      else onOpen(book)
                    }}
                  >
                    Lire
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    iconStart={<Plus className="h-4 w-4" aria-hidden="true" />}
                    onClick={(e) => {
                      e?.stopPropagation?.()
                      onAdd(book)
                    }}
                  >
                    Ajouter
                  </Button>
                )}
              </div>
            </article>
          </li>
        )
      })}
    </ul>
  )
}

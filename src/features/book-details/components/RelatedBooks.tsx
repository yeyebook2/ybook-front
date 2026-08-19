import { ArrowRight } from "lucide-react"

import { BookCard } from "@/features/catalog/components/BookCard"
import type { CatalogBook } from "@/features/catalog/types"

type RelatedBooksProps = {
  books: CatalogBook[]
  onOpen: (book: CatalogBook) => void
  onAdd: (book: CatalogBook) => void
  onSeeAll: () => void
}

export function RelatedBooks({
  books,
  onOpen,
  onAdd,
  onSeeAll,
}: RelatedBooksProps) {
  if (books.length === 0) {
    return (
      <p className="rounded-corner-lg border border-dashed border-border-primary p-xl text-label-sm text-text-secondary">
        Aucun autre titre associé pour le moment.
      </p>
    )
  }

  return (
    <section className="flex flex-col gap-xl">
      <div className="flex flex-wrap items-end justify-between gap-md">
        <div>
          <p className="text-overline text-brand-primary">À découvrir</p>
          <h2 className="font-serif text-heading-lg text-text-primary">
            Vous aimerez peut-être aussi
          </h2>
        </div>
        <button
          type="button"
          onClick={onSeeAll}
          className="inline-flex cursor-pointer items-center gap-xs text-label-sm font-semibold text-brand-primary hover:text-brand-primary-hover"
        >
          Voir tout <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-xl md:grid-cols-4">
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            onOpen={() => onOpen(book)}
            onAdd={() => onAdd(book)}
          />
        ))}
      </div>
    </section>
  )
}

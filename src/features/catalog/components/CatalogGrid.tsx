import type { CatalogBook } from "../types"
import { BookCard } from "./BookCard"

type CatalogGridProps = {
  books: CatalogBook[]
  onOpen: (book: CatalogBook) => void
  onAdd: (book: CatalogBook) => void
  ownedBookIds?: Set<string>
  onRead?: (book: CatalogBook) => void
}

export function CatalogGrid({ books, onOpen, onAdd, ownedBookIds, onRead }: CatalogGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2xl md:grid-cols-3">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onOpen={() => onOpen(book)}
          onAdd={() => onAdd(book)}
          owned={ownedBookIds ? ownedBookIds.has(book.id) : false}
          onRead={() => (onRead ? onRead(book) : onOpen(book))}
        />
      ))}
    </div>
  )
}

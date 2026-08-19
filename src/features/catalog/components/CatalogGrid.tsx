import type { CatalogBook } from "../types"
import { BookCard } from "./BookCard"

type CatalogGridProps = {
  books: CatalogBook[]
  onOpen: (book: CatalogBook) => void
  onAdd: (book: CatalogBook) => void
}

export function CatalogGrid({ books, onOpen, onAdd }: CatalogGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2xl md:grid-cols-3">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onOpen={() => onOpen(book)}
          onAdd={() => onAdd(book)}
        />
      ))}
    </div>
  )
}

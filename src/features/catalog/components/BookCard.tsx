import { ArrowRight, Plus, BookOpen } from "lucide-react"

import type { CatalogBook } from "../types"
import { formatPrice, handleCoverError } from "../catalog.utils"

type BookCardProps = {
  book: CatalogBook
  onOpen: () => void
  onAdd: () => void
  owned?: boolean
  onRead?: () => void
}

export function BookCard({ book, onOpen, onAdd, owned, onRead }: BookCardProps) {
  const handleRead = () => {
    if (onRead) onRead()
    else onOpen()
  }

  return (
    <article className="group flex min-w-0 flex-col gap-lg">
      <button
        type="button"
        onClick={owned ? handleRead : onOpen}
        aria-label={`${owned ? "Lire" : "Voir la fiche de"} « ${book.title} » par ${book.author}`}
        className="relative aspect-[2/3] w-full cursor-pointer overflow-hidden rounded-corner-lg border border-border-secondary bg-brand-tertiary text-left shadow-sm transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl"
      >
        <img
          src={book.cover}
          alt={`Couverture de « ${book.title} »`}
          onError={handleCoverError}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute left-md top-md z-10 flex flex-col items-start gap-xs">
          <span className="inline-flex items-center px-2.5 py-1 rounded-corner-full text-[12px] font-semibold tracking-wide bg-[#100908]/85 text-[#FFF6EB] backdrop-blur-md shadow-md border border-white/20">
            {book.category}
          </span>
          {book.has_file === false && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-corner-full text-[11px] font-semibold bg-amber-600 text-white shadow-md">
              Bientôt disponible
            </span>
          )}
        </div>
        <div className="absolute inset-x-md bottom-md translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {owned ? (
            <span className="inline-flex items-center gap-xs rounded-corner-full bg-brand-primary px-md py-xs text-video-title font-semibold text-on-brand shadow-sm">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Lire l'e-book
            </span>
          ) : (
            <span className="inline-flex items-center gap-xs rounded-corner-full bg-[#100908]/70 px-md py-xs text-video-title font-semibold text-white backdrop-blur-sm">
              Voir le livre <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </span>
          )}
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
          {owned ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                handleRead()
              }}
              aria-label={`Lire « ${book.title} »`}
              className="inline-flex h-9 items-center gap-xs px-md shrink-0 cursor-pointer rounded-corner-full bg-brand-primary text-on-brand text-video-title font-semibold transition-all hover:bg-brand-hover active:scale-95 shadow-xs"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Lire</span>
            </button>
          ) : book.has_file === false ? (
            <span
              className="text-video-title text-text-tertiary italic"
              title="Fichier ePub bientôt disponible"
            >
              Bientôt dispo
            </span>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onAdd()
              }}
              aria-label={`Ajouter « ${book.title} » au panier`}
              className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-corner-full border border-border-primary text-brand-primary transition-all hover:border-brand-primary hover:bg-brand-primary hover:text-on-brand active:scale-95"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

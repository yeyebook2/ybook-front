import { useEffect, useState } from "react"
import { Maximize2, X } from "lucide-react"

import { handleCoverError } from "@/features/catalog/catalog.utils"
import type { BookDetail } from "../types"

type BookCoverGalleryProps = {
  book: BookDetail
}

export function BookCoverGallery({ book }: BookCoverGalleryProps) {
  const [zoomOpen, setZoomOpen] = useState(false)

  useEffect(() => {
    if (!zoomOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [zoomOpen])

  return (
    <>
      <div className="flex flex-col gap-lg">
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          aria-label={`Agrandir la couverture de « ${book.title} »`}
          className="group relative aspect-[2/3] w-full cursor-zoom-in overflow-hidden rounded-corner-xl border border-border-secondary bg-brand-tertiary shadow-2xl"
        >
          <img
            src={book.cover}
            alt={`Couverture de « ${book.title} »`}
            onError={handleCoverError}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <span className="absolute bottom-lg right-lg inline-flex items-center gap-xs rounded-corner-full bg-[#100908]/70 px-md py-sm text-video-title font-semibold text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            Agrandir
          </span>
        </button>
        <div className="flex justify-center">
          <div className="h-20 w-16 overflow-hidden rounded-corner-sm border-2 border-brand-primary bg-brand-tertiary">
            <img
              src={book.cover}
              alt=""
              onError={handleCoverError}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {zoomOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#100908]/80 p-xl"
          role="dialog"
          aria-modal="true"
          aria-label={`Couverture agrandie de « ${book.title} »`}
          onClick={() => setZoomOpen(false)}
        >
          <div className="relative max-h-full max-w-[min(80vw,560px)]">
            <img
              src={book.cover}
              alt={`Couverture agrandie de « ${book.title} »`}
              onError={handleCoverError}
              className="max-h-[85vh] w-auto rounded-corner-lg object-contain shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setZoomOpen(false)}
              aria-label="Fermer la couverture agrandie"
              className="absolute -right-md -top-md inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-corner-full bg-surface-bg text-text-primary shadow-lg"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

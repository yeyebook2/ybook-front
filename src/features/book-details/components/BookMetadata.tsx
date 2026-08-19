import type { BookDetail } from "../types"

type BookMetadataProps = {
  book: BookDetail
}

export function BookMetadata({ book }: BookMetadataProps) {
  const rows = [
    { label: "Format", value: book.format ?? "ePub" },
    { label: "Pages", value: String(book.pages) },
    { label: "Langue", value: book.language ?? "Français" },
    { label: "ISBN", value: book.isbn ?? "Non renseigné" },
    { label: "Publié", value: String(book.year) },
    { label: "Catégorie", value: book.category },
  ]

  return (
    <dl className="grid grid-cols-1 gap-x-2xl gap-y-xs text-label-sm sm:grid-cols-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex justify-between gap-md border-b border-border-secondary py-sm"
        >
          <dt className="text-text-tertiary">{row.label}</dt>
          <dd className="text-right font-medium text-text-primary">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

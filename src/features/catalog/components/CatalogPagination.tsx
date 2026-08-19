type CatalogPaginationProps = {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function CatalogPagination({
  page,
  totalPages,
  onChange,
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <nav
      className="flex justify-center pt-lg"
      aria-label="Pagination du catalogue"
    >
      <div className="flex flex-wrap justify-center gap-sm">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="cursor-pointer rounded-corner-md border border-border-secondary px-lg py-sm text-label-sm text-text-secondary hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Précédent
        </button>
        {pages.map((pageNumber) => (
          <button
            type="button"
            key={pageNumber}
            onClick={() => onChange(pageNumber)}
            aria-current={page === pageNumber ? "page" : undefined}
            aria-label={`Page ${pageNumber}`}
            className={`cursor-pointer rounded-corner-md px-lg py-sm text-label-sm ${
              page === pageNumber
                ? "bg-brand-primary font-medium text-on-brand"
                : "border border-border-secondary text-text-secondary hover:bg-surface-hover"
            }`}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="cursor-pointer rounded-corner-md border border-border-secondary px-lg py-sm text-label-sm text-text-secondary hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Suivant
        </button>
      </div>
    </nav>
  )
}

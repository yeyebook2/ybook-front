import { useState } from "react"
import { ChevronLeft, X } from "lucide-react"
import { Button } from "@figma/astraui"

import { CATALOG_PAGE_SIZE } from "../catalog.constants"
import { CatalogFilters } from "../components/CatalogFilters"
import { CatalogGrid } from "../components/CatalogGrid"
import { CatalogList } from "../components/CatalogList"
import { CatalogPagination } from "../components/CatalogPagination"
import {
  CatalogErrorState,
  CatalogLoadingState,
  CatalogNoResultsState,
} from "../components/CatalogStates"
import { CatalogToolbar } from "../components/CatalogToolbar"
import { useCatalog } from "../hooks/useCatalog"
import type { Book, CatalogBook } from "../types"

type CatalogPageProps = {
  books: Book[]
  initialCategory?: string
  initialSearch?: string
  onHome: () => void
  onSearchChange?: (search: string) => void
  onOpenBook: (book: CatalogBook) => void
  onAddToCart: (book: CatalogBook) => void
}

export function CatalogPage({
  books,
  initialCategory,
  initialSearch,
  onHome,
  onSearchChange,
  onOpenBook,
  onAddToCart,
}: CatalogPageProps) {
  const { filters, data, loading, error, updateFilters, resetFilters, reload } =
    useCatalog({
      previewBooks: books,
      initialCategory,
      initialSearch,
    })
  const [gridView, setGridView] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const handleFilterChange = (patch: Partial<typeof filters>) => {
    if ("search" in patch && patch.search !== undefined) {
      onSearchChange?.(patch.search)
    }
    updateFilters(patch)
  }

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.categories.length > 0 ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.minRating > 0 ||
      filters.language ||
      filters.publishedDate !== "all",
  )

  const handlePageChange = (page: number) => {
    handleFilterChange({ page })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleReset = () => {
    onSearchChange?.("")
    resetFilters()
    setMobileFiltersOpen(false)
  }

  return (
    <div className="min-h-screen animate-fade">
      <section className="border-b border-border-secondary bg-[#b84870] text-on-brand">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-lg px-xl py-3xl md:px-2xl md:py-4xl">
          <p className="text-video-title font-semibold uppercase tracking-[0.22em] text-brand-tertiary">
            La bibliothèque YéYéBook
          </p>
          <div className="flex flex-col gap-lg md:flex-row md:items-end md:justify-between">
            <div className="w-full max-w-[640px] flex-1">
              <h1 className="font-serif text-[38px] leading-[1.05] md:text-[52px]">
                Trouvez votre prochaine histoire.
              </h1>
              <p className="mt-md max-w-[560px] text-label-sm leading-relaxed text-on-brand/75 md:text-label">
                Explorez des e-books d’auteurs africains francophones,
                sélectionnés pour accompagner chaque envie de lecture.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-sm text-label-sm text-on-brand/75">
              <span
                className="h-2 w-2 rounded-full bg-brand-primary"
                aria-hidden="true"
              />
              Prix affichés en FCFA, toutes taxes comprises
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1320px] flex-col gap-2xl px-xl py-3xl md:px-2xl">
        <nav
          className="flex items-center gap-sm text-label-sm text-text-tertiary"
          aria-label="Fil d’ariane"
        >
          <button
            type="button"
            onClick={onHome}
            className="cursor-pointer hover:text-text-primary"
          >
            Accueil
          </button>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-text-primary">Catalogue</span>
          {filters.categories.length > 0 && (
            <>
              <span aria-hidden="true">/</span>
              <span className="font-medium text-text-primary">
                {filters.categories.join(", ")}
              </span>
            </>
          )}
        </nav>

        <div className="flex flex-col gap-2xl lg:flex-row lg:items-start">
          <div className="hidden lg:block">
            <CatalogFilters
              filters={filters}
              facets={data.facets}
              onChange={handleFilterChange}
              onReset={handleReset}
            />
          </div>

          <main id="main" className="flex min-w-0 flex-1 flex-col gap-lg">
            <CatalogToolbar
              filters={filters}
              total={data.total}
              gridView={gridView}
              onChange={handleFilterChange}
              onToggleGrid={setGridView}
              onOpenMobileFilters={() => setMobileFiltersOpen(true)}
            />

            {loading && <CatalogLoadingState count={CATALOG_PAGE_SIZE} />}
            {!loading && error && (
              <CatalogErrorState message={error} onRetry={reload} />
            )}
            {!loading && !error && data.total === 0 && (
              <CatalogNoResultsState
                hasActiveFilters={hasActiveFilters}
                onReset={handleReset}
              />
            )}
            {!loading && !error && data.total > 0 && (
              <>
                {gridView ? (
                  <CatalogGrid
                    books={data.items}
                    onOpen={onOpenBook}
                    onAdd={onAddToCart}
                  />
                ) : (
                  <CatalogList
                    books={data.items}
                    onOpen={onOpenBook}
                    onAdd={onAddToCart}
                  />
                )}
                <CatalogPagination
                  page={filters.page}
                  totalPages={data.totalPages}
                  onChange={handlePageChange}
                />
              </>
            )}
          </main>
        </div>
      </div>

      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-catalog-filters"
        >
          <button
            type="button"
            aria-label="Fermer les filtres"
            onClick={() => setMobileFiltersOpen(false)}
            className="absolute inset-0 cursor-pointer bg-[#100908]/45"
          />
          <aside className="relative ml-auto flex h-full w-[min(92vw,380px)] flex-col overflow-y-auto bg-surface-secondary-bg p-xl shadow-2xl">
            <div className="mb-lg flex items-center justify-between">
              <h2
                id="mobile-catalog-filters"
                className="text-heading font-semibold text-text-primary"
              >
                Filtrer le catalogue
              </h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Fermer"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-corner-full text-text-secondary hover:bg-surface-hover"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <CatalogFilters
              filters={filters}
              facets={data.facets}
              onChange={handleFilterChange}
              onReset={handleReset}
            />
            <Button
              variant="primary"
              iconStart={
                <ChevronLeft
                  className="h-4 w-4 rotate-180"
                  aria-hidden="true"
                />
              }
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-xl"
            >
              Voir les résultats
            </Button>
          </aside>
        </div>
      )}
    </div>
  )
}

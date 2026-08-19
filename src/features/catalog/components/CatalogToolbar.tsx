import { LayoutGrid, List, Search, SlidersHorizontal } from "lucide-react"

import { SearchComponent } from "@figma/astraui"

import { CATALOG_SORTS } from "../catalog.constants"
import type { CatalogFilters } from "../types"

type CatalogToolbarProps = {
  filters: CatalogFilters
  total: number
  gridView: boolean
  onChange: (patch: Partial<CatalogFilters>) => void
  onToggleGrid: (grid: boolean) => void
  onOpenMobileFilters: () => void
}

export function CatalogToolbar({
  filters,
  total,
  gridView,
  onChange,
  onToggleGrid,
  onOpenMobileFilters,
}: CatalogToolbarProps) {
  const selectedSort = CATALOG_SORTS.find(
    (sort) => sort.value === filters.sortBy && sort.order === filters.sortOrder,
  )

  return (
    <div className="flex flex-col gap-lg rounded-corner-lg border border-border-secondary bg-surface-bg p-lg">
      <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:max-w-lg">
          <SearchComponent
            placeholder="Rechercher un titre ou un auteur…"
            value={filters.search}
            onChange={(search) => onChange({ search, page: 1 })}
          />
        </div>
        <button
          type="button"
          onClick={onOpenMobileFilters}
          className="inline-flex cursor-pointer items-center justify-center gap-sm rounded-corner-md border border-border-secondary px-md py-sm text-label-sm font-medium text-text-secondary hover:bg-surface-hover lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filtres
        </button>
      </div>

      <div className="flex flex-col gap-md border-t border-border-secondary pt-lg sm:flex-row sm:items-center sm:justify-between">
        <p className="text-label-sm text-text-tertiary" aria-live="polite">
          <span className="font-semibold text-text-primary">{total}</span>{" "}
          {total > 1 ? "titres disponibles" : "titre disponible"}
        </p>
        <div className="flex flex-wrap items-center gap-md">
          <label className="flex items-center gap-sm text-label-sm text-text-tertiary">
            Trier par
            <select
              value={
                selectedSort
                  ? `${selectedSort.value}:${selectedSort.order}`
                  : "relevance:desc"
              }
              onChange={(event) => {
                const [sortBy, sortOrder] = event.target.value.split(
                  ":",
                ) as [CatalogFilters["sortBy"], CatalogFilters["sortOrder"]]
                onChange({ sortBy, sortOrder, page: 1 })
              }}
              className="rounded-corner-md border border-border-secondary bg-surface-bg px-md py-sm text-label-sm font-medium text-text-primary"
            >
              {CATALOG_SORTS.map((sort) => (
                <option
                  key={`${sort.value}:${sort.order}`}
                  value={`${sort.value}:${sort.order}`}
                >
                  {sort.label}
                </option>
              ))}
            </select>
          </label>
          <div
            className="flex overflow-hidden rounded-corner-md border border-border-secondary"
            role="group"
            aria-label="Mode d’affichage"
          >
            <button
              type="button"
              onClick={() => onToggleGrid(true)}
              aria-pressed={gridView}
              aria-label="Afficher en grille"
              className={`cursor-pointer p-sm ${
                gridView
                  ? "bg-brand-primary text-on-brand"
                  : "bg-surface-bg text-text-tertiary hover:bg-surface-hover"
              }`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onToggleGrid(false)}
              aria-pressed={!gridView}
              aria-label="Afficher en liste"
              className={`cursor-pointer p-sm ${
                !gridView
                  ? "bg-brand-primary text-on-brand"
                  : "bg-surface-bg text-text-tertiary hover:bg-surface-hover"
              }`}
            >
              <List className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

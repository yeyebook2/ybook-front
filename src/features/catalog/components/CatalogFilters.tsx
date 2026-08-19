import { RotateCcw, SlidersHorizontal } from "lucide-react"

import {
  CATALOG_CATEGORIES,
  CATALOG_DATE_FILTERS,
  CATALOG_LANGUAGES,
} from "../catalog.constants"
import type {
  CatalogFacet,
  CatalogFilters as CatalogFiltersState,
} from "../types"

type CatalogFiltersProps = {
  filters: CatalogFiltersState
  facets?: {
    categories: CatalogFacet[]
    languages: CatalogFacet[]
  }
  onChange: (patch: Partial<CatalogFiltersState>) => void
  onReset: () => void
}

function getFacetCount(facets: CatalogFacet[] | undefined, value: string) {
  return facets?.find((facet) => facet.value === value)?.count ?? 0
}

export function CatalogFilters({
  filters,
  facets,
  onChange,
  onReset,
}: CatalogFiltersProps) {
  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="flex flex-col gap-2xl rounded-corner-lg border border-border-secondary bg-surface-bg p-xl lg:sticky lg:top-[96px]">
        <div className="flex items-center justify-between gap-md">
          <div className="flex items-center gap-sm">
            <SlidersHorizontal
              className="h-4 w-4 text-brand-primary"
              aria-hidden="true"
            />
            <h2 className="font-semibold text-text-primary">Filtres</h2>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex cursor-pointer items-center gap-xs text-video-title text-brand-primary hover:underline"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Réinitialiser
          </button>
        </div>

        <fieldset className="flex flex-col gap-md">
          <legend className="mb-sm text-label-sm font-semibold text-text-primary">
            Catégories
          </legend>
          {CATALOG_CATEGORIES.map((category) => (
            <label
              key={category.value}
              className="flex cursor-pointer items-center gap-md text-label-sm text-text-secondary"
            >
              <input
                type="checkbox"
                checked={filters.categories.includes(category.value)}
                onChange={() => {
                  const categories = filters.categories.includes(category.value)
                    ? filters.categories.filter(
                        (value) => value !== category.value,
                      )
                    : [...filters.categories, category.value]
                  onChange({ categories, page: 1 })
                }}
                className="h-4 w-4 rounded-corner-sm accent-[#e04070]"
              />
              <span>{category.label}</span>
              <span className="ml-auto text-video-title text-text-tertiary">
                ({getFacetCount(facets?.categories, category.value)})
              </span>
            </label>
          ))}
        </fieldset>

        <div className="flex flex-col gap-md">
          <h3 className="text-label-sm font-semibold text-text-primary">
            Prix (FCFA)
          </h3>
          <div className="flex items-center gap-sm">
            <label className="sr-only" htmlFor="catalog-min-price">
              Prix minimum
            </label>
            <input
              id="catalog-min-price"
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(event) =>
                onChange({ minPrice: event.target.value, page: 1 })
              }
              className="w-full rounded-corner-md border border-border-secondary bg-surface-bg px-md py-sm text-label-sm"
            />
            <span className="text-text-tertiary" aria-hidden="true">
              –
            </span>
            <label className="sr-only" htmlFor="catalog-max-price">
              Prix maximum
            </label>
            <input
              id="catalog-max-price"
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(event) =>
                onChange({ maxPrice: event.target.value, page: 1 })
              }
              className="w-full rounded-corner-md border border-border-secondary bg-surface-bg px-md py-sm text-label-sm"
            />
          </div>
        </div>

        <fieldset className="flex flex-col gap-sm">
          <legend className="mb-sm text-label-sm font-semibold text-text-primary">
            Note minimale
          </legend>
          {[0, 5, 4, 3].map((rating) => (
            <label
              key={rating}
              className="flex cursor-pointer items-center gap-md text-label-sm text-text-secondary"
            >
              <input
                type="radio"
                name="catalog-rating"
                checked={filters.minRating === rating}
                onChange={() => onChange({ minRating: rating, page: 1 })}
                className="h-4 w-4 accent-[#e04070]"
              />
              <span>
                {rating === 0
                  ? "Toutes les notes"
                  : `${rating} étoiles et plus`}
              </span>
            </label>
          ))}
        </fieldset>

        <label className="flex flex-col gap-md text-label-sm font-semibold text-text-primary">
          Langue
          <select
            value={filters.language}
            onChange={(event) =>
              onChange({ language: event.target.value, page: 1 })
            }
            className="w-full rounded-corner-md border border-border-secondary bg-surface-bg px-md py-sm font-normal"
          >
            {CATALOG_LANGUAGES.map((language) => (
              <option key={language.value || "all"} value={language.value}>
                {language.label}
                {language.value
                  ? ` (${getFacetCount(facets?.languages, language.value)})`
                  : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-md text-label-sm font-semibold text-text-primary">
          Date de publication
          <select
            value={filters.publishedDate}
            onChange={(event) =>
              onChange({
                publishedDate: event.target
                  .value as CatalogFiltersState["publishedDate"],
                page: 1,
              })
            }
            className="w-full rounded-corner-md border border-border-secondary bg-surface-bg px-md py-sm font-normal"
          >
            {CATALOG_DATE_FILTERS.map((dateFilter) => (
              <option key={dateFilter.value} value={dateFilter.value}>
                {dateFilter.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </aside>
  )
}

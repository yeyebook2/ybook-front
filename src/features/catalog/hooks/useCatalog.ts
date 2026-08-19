import { useCallback, useEffect, useMemo, useState } from "react"

import { DEFAULT_CATALOG_FILTERS } from "../catalog.constants"
import { getCatalog } from "../catalog.api"
import type { Book, CatalogFilters, CatalogResponse } from "../types"

type UseCatalogOptions = {
  previewBooks: Book[]
  initialCategory?: string
  initialSearch?: string
}

const EMPTY_RESPONSE: CatalogResponse = {
  items: [],
  total: 0,
  page: 1,
  limit: DEFAULT_CATALOG_FILTERS.limit,
  totalPages: 1,
}

export function useCatalog({
  previewBooks,
  initialCategory,
  initialSearch = "",
}: UseCatalogOptions) {
  const initialFilters = useMemo<CatalogFilters>(
    () => ({
      ...DEFAULT_CATALOG_FILTERS,
      search: initialSearch,
      categories: initialCategory ? [initialCategory] : [],
    }),
    [initialCategory, initialSearch],
  )
  const [filters, setFilters] = useState<CatalogFilters>(initialFilters)
  const [data, setData] = useState<CatalogResponse>(EMPTY_RESPONSE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    setFilters((current) => {
      const nextSearch = initialSearch
      const nextCategories = initialCategory ? [initialCategory] : []
      if (
        current.search === nextSearch &&
        current.categories.join("|") === nextCategories.join("|")
      ) {
        return current
      }
      return {
        ...current,
        search: nextSearch,
        categories: nextCategories,
        page: 1,
      }
    })
  }, [initialCategory, initialSearch])

  useEffect(() => {
    let active = true
    const timeout = window.setTimeout(() => {
      setLoading(true)
      setError(null)
      void getCatalog(filters, previewBooks)
        .then((response) => {
          if (!active) return
          setData(response)
        })
        .catch((reason: unknown) => {
          if (!active) return
          setData(EMPTY_RESPONSE)
          setError(
            reason instanceof Error
              ? reason.message
              : "Impossible de charger le catalogue.",
          )
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, 180)

    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [filters, previewBooks, reloadToken])

  const updateFilters = useCallback((patch: Partial<CatalogFilters>) => {
    setFilters((current) => ({ ...current, ...patch }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_CATALOG_FILTERS })
  }, [])

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  return {
    filters,
    data,
    loading,
    error,
    updateFilters,
    resetFilters,
    reload,
  }
}

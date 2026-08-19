import type {
  CatalogDateFilter,
  CatalogSortBy,
  CatalogSortOrder,
} from "./types"

export const CATALOG_CATEGORIES = [
  { value: "Roman", label: "Roman" },
  { value: "Histoire", label: "Histoire" },
  { value: "Poésie", label: "Poésie" },
  { value: "Contes", label: "Contes" },
] as const

export const CATALOG_LANGUAGES = [
  { value: "", label: "Toutes les langues" },
  { value: "fr", label: "Français" },
  { value: "en", label: "Anglais" },
] as const

export const CATALOG_DATE_FILTERS: Array<{
  value: CatalogDateFilter
  label: string
}> = [
  { value: "all", label: "Toutes les dates" },
  { value: "last-30-days", label: "30 derniers jours" },
  { value: "last-6-months", label: "6 derniers mois" },
  { value: "last-year", label: "12 derniers mois" },
]

export const CATALOG_SORTS: Array<{
  value: CatalogSortBy
  order: CatalogSortOrder
  label: string
}> = [
  { value: "relevance", order: "desc", label: "Pertinence" },
  { value: "popularity", order: "desc", label: "Popularité" },
  { value: "rating", order: "desc", label: "Mieux notés" },
  { value: "published_at", order: "desc", label: "Plus récents" },
  { value: "price", order: "asc", label: "Prix croissant" },
  { value: "price", order: "desc", label: "Prix décroissant" },
]

export const DEFAULT_CATALOG_FILTERS = {
  search: "",
  categories: [],
  minPrice: "",
  maxPrice: "",
  minRating: 0,
  language: "",
  publishedDate: "all" as CatalogDateFilter,
  sortBy: "relevance" as CatalogSortBy,
  sortOrder: "desc" as CatalogSortOrder,
  page: 1,
  limit: 8,
}

export const CATALOG_PAGE_SIZE = 8

export const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=1200&fit=crop&auto=format"

export type Chapter = {
  title: string
  content: string[]
}

export type Book = {
  id: number
  title: string
  subtitle?: string
  author: string
  authorSlug?: string
  price: number
  category: string
  rating: number
  reviews: number
  pages: number
  year: number
  isbn?: string
  format?: string
  cover: string
  description: string
  tags?: string[]
  chapters: Chapter[]
  published?: boolean
  slug?: string
  language?: string
  publishedAt?: string
}

export type CatalogBook = {
  id: number
  slug?: string
  title: string
  subtitle?: string
  author: string
  authorSlug?: string
  price: number
  category: string
  rating: number
  reviews: number
  pages: number
  year: number
  isbn?: string
  format?: string
  cover: string
  description: string
  tags?: string[]
  language?: string
  publishedAt?: string
  published?: boolean
}

export type CatalogSortBy = "relevance" | "price" | "published_at" | "popularity" | "rating"

export type CatalogSortOrder = "asc" | "desc"

export type CatalogDateFilter = "all" | "last-30-days" | "last-6-months" | "last-year"

export type CatalogFilters = {
  search: string
  categories: string[]
  minPrice: string
  maxPrice: string
  minRating: number
  language: string
  publishedDate: CatalogDateFilter
  sortBy: CatalogSortBy
  sortOrder: CatalogSortOrder
  page: number
  limit: number
}

export type CatalogFacet = {
  value: string
  label: string
  count: number
}

export type CatalogFacets = {
  categories: CatalogFacet[]
  languages: CatalogFacet[]
}

export type CatalogResponse = {
  items: CatalogBook[]
  total: number
  page: number
  limit: number
  totalPages: number
  facets?: CatalogFacets
}

type BackendAuthor = {
  name?: string
  slug?: string
}

export type BackendBook = {
  id: number | string
  slug?: string
  title: string
  subtitle?: string
  author?: string | BackendAuthor
  author_name?: string
  author_slug?: string
  category?: string
  category_name?: string
  categories?: Array<string | { name?: string }>
  cover?: string
  cover_url?: string
  price?: number
  price_fcfa?: number
  rating?: number
  average_rating?: number
  reviews?: number
  reviews_count?: number
  pages?: number
  page_count?: number
  isbn?: string
  format?: string
  year?: number
  publication_year?: number
  language?: string
  description?: string
  tags?: string[]
  published?: boolean
  published_at?: string
}

type BackendFacet = {
  value?: string
  label?: string
  count?: number
}

export type BackendCatalogResponse = {
  items?: BackendBook[]
  books?: BackendBook[]
  total?: number
  page?: number
  limit?: number
  total_pages?: number
  facets?: {
    categories?: BackendFacet[]
    languages?: BackendFacet[]
  }
}

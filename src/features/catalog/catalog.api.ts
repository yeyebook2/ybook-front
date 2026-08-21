import { CATALOG_CATEGORIES, CATALOG_LANGUAGES } from "./catalog.constants"
import { getPublicApiBaseUrl } from "@/lib/runtime-env"
import type {
  BackendBook,
  BackendCatalogResponse,
  Book,
  CatalogBook,
  CatalogFacet,
  CatalogFilters,
  CatalogResponse,
} from "./types"

const API_BASE_URL = getPublicApiBaseUrl()
const API_PREFIX = "/api/v1"
const USE_PREVIEW_DATA = !API_BASE_URL

function asNumber(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function resolveAuthor(book: BackendBook): string {
  if (typeof book.author === "string") return book.author
  return book.author?.name ?? book.author_name ?? "Auteur YéYéBook"
}

function resolveAuthorSlug(book: BackendBook): string | undefined {
  if (typeof book.author === "object") return book.author.slug
  return book.author_slug
}

function resolveCategory(book: BackendBook): string {
  if (book.category) return book.category
  if (book.category_name) return book.category_name
  const firstCategory = book.categories?.[0]
  if (typeof firstCategory === "string") return firstCategory
  return firstCategory?.name ?? "Littérature"
}

export function mapBackendBook(book: BackendBook): CatalogBook {
  return {
    id: asNumber(book.id, 0),
    slug: book.slug,
    title: book.title,
    subtitle: book.subtitle,
    author: resolveAuthor(book),
    authorSlug: resolveAuthorSlug(book),
    price: asNumber(book.price ?? book.price_fcfa, 0),
    category: resolveCategory(book),
    rating: asNumber(book.rating ?? book.average_rating, 0),
    reviews: asNumber(book.reviews ?? book.reviews_count, 0),
    pages: asNumber(book.pages ?? book.page_count, 0),
    isbn: book.isbn,
    format: book.format,
    year: asNumber(
      book.year ?? book.publication_year,
      new Date().getFullYear(),
    ),
    cover:
      book.cover_url ??
      book.cover ??
      "/src/imports/ybook-symbol-primary-1024px.png",
    description:
      book.description ?? "Découvrez ce titre dans la bibliothèque YéYéBook.",
    tags: book.tags,
    language: book.language,
    publishedAt: book.published_at,
    published: book.published,
  }
}

function toFacet(value: string, count: number, label = value): CatalogFacet {
  return { value, label, count }
}

function buildFacets(books: CatalogBook[]) {
  const categoryCounts = new Map<string, number>()
  const languageCounts = new Map<string, number>()

  books.forEach((book) => {
    categoryCounts.set(
      book.category,
      (categoryCounts.get(book.category) ?? 0) + 1,
    )
    if (book.language) {
      languageCounts.set(
        book.language,
        (languageCounts.get(book.language) ?? 0) + 1,
      )
    }
  })

  const categories = CATALOG_CATEGORIES.map(({ value, label }) =>
    toFacet(value, categoryCounts.get(value) ?? 0, label),
  )
  const languages = CATALOG_LANGUAGES.filter(({ value }) => value).map(
    ({ value, label }) => toFacet(value, languageCounts.get(value) ?? 0, label),
  )

  return { categories, languages }
}

function isWithinDateFilter(
  book: CatalogBook,
  publishedDate: CatalogFilters["publishedDate"],
): boolean {
  if (publishedDate === "all" || !book.publishedAt) return true

  const publishedAt = new Date(book.publishedAt).getTime()
  if (Number.isNaN(publishedAt)) return true

  const now = new Date()
  const days =
    publishedDate === "last-30-days"
      ? 30
      : publishedDate === "last-6-months"
        ? 183
        : 365
  const threshold = new Date(now)
  threshold.setDate(now.getDate() - days)
  return publishedAt >= threshold.getTime()
}

function sortPreviewBooks(
  books: CatalogBook[],
  filters: CatalogFilters,
): CatalogBook[] {
  const query = filters.search.trim().toLocaleLowerCase("fr-FR")
  const sorted = [...books]

  if (filters.sortBy === "price") {
    sorted.sort((a, b) =>
      filters.sortOrder === "asc" ? a.price - b.price : b.price - a.price,
    )
  } else if (filters.sortBy === "rating") {
    sorted.sort((a, b) => b.rating - a.rating)
  } else if (filters.sortBy === "published_at") {
    sorted.sort(
      (a, b) =>
        new Date(b.publishedAt ?? 0).getTime() -
        new Date(a.publishedAt ?? 0).getTime(),
    )
  } else if (filters.sortBy === "relevance" && query) {
    sorted.sort((a, b) => {
      const aTitle = a.title.toLocaleLowerCase("fr-FR").startsWith(query)
      const bTitle = b.title.toLocaleLowerCase("fr-FR").startsWith(query)
      return Number(bTitle) - Number(aTitle)
    })
  } else {
    sorted.sort((a, b) => b.reviews - a.reviews)
  }

  return sorted
}

function loadPreviewCatalog(
  filters: CatalogFilters,
  previewBooks: Book[],
): CatalogResponse {
  const books = previewBooks.map((book) => ({ ...book }))
  const query = filters.search.trim().toLocaleLowerCase("fr-FR")
  const minPrice = filters.minPrice ? Number(filters.minPrice) : 0
  const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : Infinity

  const filtered = books.filter((book) => {
    const matchesSearch =
      !query ||
      book.title.toLocaleLowerCase("fr-FR").includes(query) ||
      book.author.toLocaleLowerCase("fr-FR").includes(query)
    const matchesCategory =
      filters.categories.length === 0 ||
      filters.categories.includes(book.category)
    const matchesPrice = book.price >= minPrice && book.price <= maxPrice
    const matchesRating = book.rating >= filters.minRating
    const matchesLanguage =
      !filters.language || book.language === filters.language
    const matchesDate = isWithinDateFilter(book, filters.publishedDate)
    return (
      matchesSearch &&
      matchesCategory &&
      matchesPrice &&
      matchesRating &&
      matchesLanguage &&
      matchesDate &&
      book.published !== false
    )
  })

  const sorted = sortPreviewBooks(filtered, filters)
  const start = (filters.page - 1) * filters.limit
  const items = sorted.slice(start, start + filters.limit)

  return {
    items,
    total: sorted.length,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.max(1, Math.ceil(sorted.length / filters.limit)),
    facets: buildFacets(filtered),
  }
}

async function requestCatalog(
  filters: CatalogFilters,
): Promise<CatalogResponse> {
  const params = new URLSearchParams()
  params.set("page", String(filters.page))
  params.set("limit", String(filters.limit))
  if (filters.search.trim()) params.set("search", filters.search.trim())
  if (filters.categories.length > 0) {
    params.set("category", filters.categories.join(","))
  }
  if (filters.minPrice) params.set("min_price", filters.minPrice)
  if (filters.maxPrice) params.set("max_price", filters.maxPrice)
  if (filters.minRating > 0) params.set("rating", String(filters.minRating))
  if (filters.language) params.set("language", filters.language)
  params.set("sort_by", filters.sortBy)
  params.set("sort_order", filters.sortOrder)

  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/books?${params}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  })
  const payload = (await response
    .json()
    .catch(() => null)) as BackendCatalogResponse | { message?: string } | null

  if (!response.ok) {
    throw new Error(
      payload && "message" in payload && payload.message
        ? payload.message
        : "Impossible de charger le catalogue.",
    )
  }

  const data = payload as BackendCatalogResponse
  const items = (data.items ?? data.books ?? []).map(mapBackendBook)
  const total = data.total ?? items.length
  const page = data.page ?? filters.page
  const limit = data.limit ?? filters.limit

  return {
    items,
    total,
    page,
    limit,
    totalPages: data.total_pages ?? Math.max(1, Math.ceil(total / limit)),
    facets: data.facets
      ? {
          categories: (data.facets.categories ?? []).map((facet) =>
            toFacet(
              facet.value ?? facet.label ?? "",
              facet.count ?? 0,
              facet.label,
            ),
          ),
          languages: (data.facets.languages ?? []).map((facet) =>
            toFacet(
              facet.value ?? facet.label ?? "",
              facet.count ?? 0,
              facet.label,
            ),
          ),
        }
      : undefined,
  }
}

export async function getCatalog(
  filters: CatalogFilters,
  previewBooks: Book[],
): Promise<CatalogResponse> {
  if (USE_PREVIEW_DATA) return loadPreviewCatalog(filters, previewBooks)
  return requestCatalog(filters)
}

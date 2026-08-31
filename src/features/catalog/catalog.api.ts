import { CATALOG_CATEGORIES, CATALOG_LANGUAGES } from "./catalog.constants"
import { getPublicApiBaseUrl } from "@/lib/runtime-env"
import type {
  BackendBook,
  BackendCatalogResponse,
  CatalogBook,
  CatalogFacet,
  CatalogFilters,
  CatalogResponse,
} from "./types"

const API_BASE_URL = getPublicApiBaseUrl()
const API_PREFIX = "/api/v1"

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
      "",
    description:
      book.description ?? "",
    tags: book.tags,
    language: book.language,
    publishedAt: book.published_at,
    published: book.published,
  }
}

function toFacet(value: string, count: number, label = value): CatalogFacet {
  return { value, label, count }
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
): Promise<CatalogResponse> {
  if (!API_BASE_URL) {
    throw new Error("L’URL de l’API n’est pas configurée.")
  }
  return requestCatalog(filters)
}
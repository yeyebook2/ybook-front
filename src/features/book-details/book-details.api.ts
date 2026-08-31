import { getPublicApiBaseUrl } from "@/lib/runtime-env"
import { mapBackendBook } from "@/features/catalog/catalog.api"
import type {
  BackendBook,
  BackendCatalogResponse,
  Book,
  CatalogBook,
} from "@/features/catalog/types"
import type {
  BookDetail,
  BookDetailResponse,
  BookReview,
  BookReviewPage,
  ReviewFormValues,
} from "./types"

const API_BASE_URL = getPublicApiBaseUrl()
const API_PREFIX = "/api/v1"

function normalizeReview(
  value: Record<string, unknown>,
  index: number,
): BookReview {
  return {
    id: String(value.id ?? `review-${index}`),
    authorName:
      typeof value.author_name === "string"
        ? value.author_name
        : typeof value.author === "object" && value.author
          ? String(
              (value.author as { name?: unknown }).name ?? "Lecteur YéYéBook",
            )
          : "Lecteur YéYéBook",
    rating: Number(value.rating ?? 0),
    comment: String(value.comment ?? ""),
    createdAt: String(value.created_at ?? new Date().toISOString()),
    verifiedPurchase: Boolean(value.verified_purchase),
  }
}

function normalizeReviewPage(payload: Record<string, unknown>): BookReviewPage {
  const rawItems = Array.isArray(payload.items) ? payload.items : []
  const items = rawItems.map((item, index) =>
    normalizeReview((item ?? {}) as Record<string, unknown>, index),
  )
  const total = Number(payload.total ?? items.length)
  const limit = Number(payload.limit ?? 5)
  const page = Number(payload.page ?? 1)

  return {
    items,
    total,
    averageRating: Number(payload.avg_rating ?? payload.average_rating ?? 0),
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}

function normalizeDetailBook(payload: BackendBook): BookDetail {
  const book = mapBackendBook(payload)
  const author =
    typeof payload.author === "object" && payload.author
      ? payload.author
      : undefined

  return {
    ...book,
    subtitle: payload.subtitle,
    isbn: payload.isbn,
    format: payload.format,
    tags: payload.tags,
    authorSlug: author?.slug ?? payload.author_slug,
    chapters:
      payload.chapters?.map((chapter, index) => ({
        title: chapter.title ?? `Chapitre ${index + 1}`,
        content: chapter.content ?? [],
      })) ?? [],
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  })
  const payload = (await response.json().catch(() => null)) as T | {
    message?: string
  } | null

  if (!response.ok) {
    throw new Error(
      payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string"
        ? payload.message
        : "Impossible de charger cette fiche livre.",
    )
  }

  return payload as T
}

export async function getBookDetail(
  slug: string | undefined,
  _fallbackBook?: Book,
): Promise<BookDetailResponse> {
  if (!API_BASE_URL) {
    throw new Error("L’URL de l’API n’est pas configurée.")
  }

  if (!slug) throw new Error("Le slug du livre est requis.")
  const payload = await request<{
    book?: BackendBook
    items?: BackendBook[]
    reviews?: Record<string, unknown>
    related?: BackendCatalogResponse
  }>(`/books/${encodeURIComponent(slug)}`)
  const rawBook = payload.book ?? payload.items?.[0]
  if (!rawBook) throw new Error("Livre introuvable.")

  const book = normalizeDetailBook(rawBook)
  const reviews = payload.reviews
    ? normalizeReviewPage(payload.reviews)
    : await getBookReviews(slug)
  const relatedBooks = payload.related
    ? (payload.related.items ?? payload.related.books ?? []).map(mapBackendBook)
    : await getBookRelated(slug)
  return { book, reviews, relatedBooks }
}

export async function getBookRelated(
  slug: string,
  limit = 4,
): Promise<CatalogBook[]> {
  if (!API_BASE_URL) {
    throw new Error("L’URL de l’API n’est pas configurée.")
  }

  const params = new URLSearchParams({ limit: String(limit) })
  const payload = await request<BackendCatalogResponse>(
    `/books/${encodeURIComponent(slug)}/related?${params.toString()}`,
  )
  return (payload.items ?? payload.books ?? []).map(mapBackendBook)
}

export async function getBookReviews(
  slug: string,
  page = 1,
  limit = 5,
): Promise<BookReviewPage> {
  if (!API_BASE_URL) {
    throw new Error("L’URL de l’API n’est pas configurée.")
  }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort_by: "recent",
  })
  const payload = await request<Record<string, unknown>>(
    `/books/${encodeURIComponent(slug)}/reviews?${params.toString()}`,
  )
  return normalizeReviewPage(payload)
}

export async function submitBookReview(
  slug: string,
  values: ReviewFormValues,
): Promise<BookReview> {
  if (!API_BASE_URL) {
    throw new Error("L’URL de l’API n’est pas configurée.")
  }

  const payload = await request<{ review?: Record<string, unknown> }>(
    `/books/${encodeURIComponent(slug)}/reviews`,
    {
      method: "POST",
      body: JSON.stringify(values),
    },
  )
  return normalizeReview(payload.review ?? {}, 0)
}

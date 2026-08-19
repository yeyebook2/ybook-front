import { PREVIEW_BOOKS } from "@/features/catalog/catalog.preview"
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

const API_BASE_URL = (import.meta.env
  .VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "")
const API_PREFIX = "/api/v1"
const USE_PREVIEW_DETAIL = !API_BASE_URL

const PREVIEW_REVIEWS: Record<number, BookReview[]> = {
  1: [
    {
      id: "review-1-1",
      authorName: "Aminata D.",
      rating: 5,
      comment:
        "Un texte bouleversant, porté par une langue superbe. Je l'ai lu d'une traite.",
      createdAt: "2026-07-16",
      verifiedPurchase: true,
    },
    {
      id: "review-1-2",
      authorName: "Kofi M.",
      rating: 4,
      comment:
        "Une lecture exigeante mais profondément marquante. À recommander.",
      createdAt: "2026-06-28",
      verifiedPurchase: true,
    },
  ],
  4: [
    {
      id: "review-4-1",
      authorName: "Fatou N.",
      rating: 5,
      comment: "Chaque page respire la mémoire du continent. Magnifique.",
      createdAt: "2026-07-04",
      verifiedPurchase: true,
    },
    {
      id: "review-4-2",
      authorName: "Awa K.",
      rating: 5,
      comment: "Une œuvre intime et lumineuse qui reste longtemps en tête.",
      createdAt: "2026-06-19",
      verifiedPurchase: true,
    },
  ],
}

function previewReviewPage(book: Book): BookReviewPage {
  const items = PREVIEW_REVIEWS[book.id] ?? []
  return {
    items,
    total: Math.max(book.reviews, items.length),
    averageRating: book.rating,
    page: 1,
    limit: 5,
    totalPages: 1,
  }
}

function previewDetail(book: Book): BookDetailResponse {
  const relatedBooks = PREVIEW_BOOKS.filter(
    (candidate) =>
      candidate.id !== book.id && candidate.category === book.category,
  ).slice(0, 4)

  return {
    book,
    reviews: previewReviewPage(book),
    relatedBooks,
  }
}

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
  fallbackBook?: Book,
): Promise<BookDetailResponse> {
  if (USE_PREVIEW_DETAIL) {
    const book =
      PREVIEW_BOOKS.find((candidate) => candidate.slug === slug) ?? fallbackBook
    if (!book) throw new Error("Livre introuvable.")
    return previewDetail(book)
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
  if (USE_PREVIEW_DETAIL) {
    const book = PREVIEW_BOOKS.find((candidate) => candidate.slug === slug)
    return book
      ? PREVIEW_BOOKS.filter(
          (candidate) =>
            candidate.id !== book.id && candidate.category === book.category,
        ).slice(0, limit)
      : []
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
  if (USE_PREVIEW_DETAIL) {
    const book = PREVIEW_BOOKS.find((candidate) => candidate.slug === slug)
    return book
      ? previewReviewPage(book)
      : { items: [], total: 0, averageRating: 0, page, limit, totalPages: 1 }
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
  if (USE_PREVIEW_DETAIL) {
    return {
      id: `preview-review-${Date.now()}`,
      authorName: "Vous",
      rating: values.rating,
      comment: values.comment.trim(),
      createdAt: new Date().toISOString(),
      verifiedPurchase: false,
    }
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

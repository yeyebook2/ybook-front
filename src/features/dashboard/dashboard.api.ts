import { handleNetworkOrFetchError, parseApiError } from "@/lib/api-errors"
import { createApiHeaders } from "@/lib/api-headers"
import { getPublicApiBaseUrl } from "@/lib/runtime-env"
import type { AuthUser } from "@/features/auth/types"

import type {
  DashboardBook,
  DashboardResponse,
  LibraryBookItem,
  LibraryResponse,
  LibraryStats,
  UserOrder,
} from "./types"

const API_BASE_URL = getPublicApiBaseUrl()
const API_PREFIX = "/api/v1"

type BackendBook = {
  id: number | string
  title: string
  author?: string | { name?: string }
  author_name?: string
  category?: string
  category_name?: string
  cover?: string
  cover_url?: string
  slug?: string
  price?: number
  price_fcfa?: number
}

type BackendLibraryItem = {
  book_id?: number | string
  book?: BackendBook
  title?: string
  author?: string
  category?: string
  cover?: string
  progress?: number
  progress_percent?: number
}

type CollectionResponse<T,> = {
  items: T[]
  total?: number
}

import { apiClient } from "@/lib/api-client"

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  return apiClient<T>(path, {
    ...init,
    fallbackErrorMessage: "Impossible de charger votre espace lecteur. Vérifiez votre connexion internet.",
  })
}

function mapBook(book: BackendBook | BackendLibraryItem): DashboardBook {
  const nestedBook = "book" in book ? book.book : undefined
  const rawAuthor = nestedBook?.author ?? book.author ?? nestedBook?.author_name
  const author =
    typeof rawAuthor === "string"
      ? rawAuthor
      : (rawAuthor?.name ?? nestedBook?.author_name ?? "Auteur YéYéBook")
  const id =
    nestedBook?.id ??
    ("book_id" in book && book.book_id
      ? book.book_id
      : "id" in book
        ? book.id
        : 0)
  const progress =
    "progress_percent" in book
      ? book.progress_percent
      : "progress" in book
        ? book.progress
        : undefined

  const hasFile =
    nestedBook && typeof (nestedBook as any).has_file === "boolean"
      ? (nestedBook as any).has_file
      : "has_file" in (book as any) && typeof (book as any).has_file === "boolean"
        ? (book as any).has_file
        : true

  const readingStatus =
    "reading_status" in (book as any) && typeof (book as any).reading_status === "string"
      ? (book as any).reading_status
      : nestedBook && "reading_status" in (nestedBook as any) && typeof (nestedBook as any).reading_status === "string"
        ? (nestedBook as any).reading_status
        : undefined

  return {
    id: String(id),
    title:
      nestedBook?.title ??
      ("title" in book ? book.title : undefined) ??
      "Livre YéYéBook",
    author,
    category:
      nestedBook?.category ??
      nestedBook?.category_name ??
      ("category" in book ? book.category : undefined) ??
      "Littérature",
    price: nestedBook?.price ?? nestedBook?.price_fcfa,
    slug: nestedBook?.slug,
    cover:
      nestedBook?.cover_url ??
      nestedBook?.cover ??
      ("cover" in book ? book.cover : undefined) ??
      "/src/imports/ybook-symbol-primary-1024px.png",
    progress:
      progress === undefined ? undefined : Math.max(0, Math.min(100, progress)),
    has_file: hasFile,
    reading_status: readingStatus,
    progress_percent: progress === undefined ? undefined : Math.max(0, Math.min(100, progress)),
  }
}

async function loadProductionDashboard(
  user: AuthUser,
): Promise<DashboardResponse> {
  const [libraryData, booksResponse, ordersResponse] = await Promise.all([
    getLibrary(),
    request<CollectionResponse<BackendBook>>(
      "/books?page=1&limit=12&sort_order=desc&sort_by=created_at",
    ),
    request<{ items?: UserOrder[]; orders?: UserOrder[] }>("/orders").catch(
      (): { items?: UserOrder[]; orders?: UserOrder[] } => ({ items: [] }),
    ),
  ])

  const libraryBooks = libraryData.items
  const ownedIds = new Set(
    libraryBooks.map((item) => String(item.id)),
  )

  const continueReading = libraryBooks
    .filter((book) => (book.progress ?? 0) > 0 && (book.progress ?? 0) < 100)
    .slice(0, 4)

  const recommendations = booksResponse.items
    .map(mapBook)
    .filter((book) => !ownedIds.has(String(book.id)))
    .slice(0, 6)

  const userOrders = ordersResponse.items ?? ordersResponse.orders ?? []
  const commandes = userOrders.filter((o: UserOrder) =>
    ["paid", "completed"].includes(o.status),
  ).length

  const achetes = libraryData.stats?.books ?? libraryData.total ?? libraryBooks.length
  const enCours =
    libraryData.stats?.reading ??
    libraryBooks.filter(
      (i) => (i.progress ?? 0) > 0 && (i.progress ?? 0) < 100,
    ).length
  const termines =
    libraryData.stats?.finished ??
    libraryBooks.filter((i) => (i.progress ?? 0) >= 100).length

  return {
    user,
    summary: {
      booksInLibrary: achetes,
      readingNow: enCours,
      completedBooks: termines,
      ordersCount: libraryData.stats?.orders ?? commandes,
    },
    continueReading,
    recommendations,
  }
}

export async function getMyOrders(): Promise<UserOrder[]> {
  const response = await request<{ items?: UserOrder[]; orders?: UserOrder[] }>(
    "/orders",
  )
  return response.items ?? response.orders ?? []
}

export async function getDashboard(user: AuthUser): Promise<DashboardResponse> {
  if (!API_BASE_URL) {
    throw new Error("L’URL de l’API n’est pas configurée.")
  }
  return loadProductionDashboard(user)
}

export async function getLibraryBookIds(): Promise<string[]> {
  try {
    const response = await request<CollectionResponse<BackendLibraryItem>>(
      "/library?page=1&limit=100&sort_by=recent",
    )
    return response.items
      .map((item) => {
        const id = item.book?.id ?? item.book_id
        return id !== undefined && id !== null ? String(id) : null
      })
      .filter((id): id is string => Boolean(id))
  } catch {
    return []
  }
}

export async function getLibrary(): Promise<LibraryResponse> {
  try {
    const response = await request<any>(
      "/library?page=1&limit=100&sort_by=recent",
    )
    const list: BackendLibraryItem[] = Array.isArray(response)
      ? response
      : response?.items || response?.books || response?.data || []

    const items: LibraryBookItem[] = list.map((item) => {
      const base = mapBook(item)
      const raw = item as any
      const reading_status =
        raw.reading_status ??
        raw.book?.reading_status ??
        base.reading_status ??
        (base.progress !== undefined && base.progress >= 100
          ? "finished"
          : base.progress !== undefined && base.progress > 0
            ? "reading"
            : "not_started")
      const progress_percent =
        raw.progress_percent ??
        raw.progress ??
        raw.book?.progress_percent ??
        raw.book?.progress ??
        base.progress_percent ??
        base.progress ??
        0
      const has_file =
        typeof raw.has_file === "boolean"
          ? raw.has_file
          : typeof base.has_file === "boolean"
            ? base.has_file
            : true

      return {
        ...base,
        has_file,
        reading_status,
        progress_percent,
      }
    })

    const rawStats = response?.stats
    const stats: LibraryStats | undefined = rawStats
      ? {
          books: Number(rawStats.books ?? items.length),
          reading: Number(
            rawStats.reading ??
              items.filter((i) => i.reading_status === "reading").length,
          ),
          finished: Number(
            rawStats.finished ??
              items.filter((i) => i.reading_status === "finished").length,
          ),
          not_started: Number(
            rawStats.not_started ??
              items.filter((i) => i.reading_status === "not_started").length,
          ),
          orders:
            rawStats.orders !== undefined ? Number(rawStats.orders) : undefined,
        }
      : undefined

    return {
      items,
      stats,
      total: response?.total ?? items.length,
    }
  } catch {
    return { items: [], total: 0 }
  }
}

export async function getLibraryItems(): Promise<DashboardBook[]> {
  const lib = await getLibrary()
  return lib.items
}

export async function getBookReadingProgress(
  bookId: string | number,
): Promise<{ cfi?: string; percent?: number }> {
  try {
    const res = await request<{
      cfi?: string
      percent?: number
      progress?: number
      progress_percent?: number
    }>(`/library/${bookId}/progress`)
    return {
      cfi: res.cfi,
      percent: res.percent ?? res.progress_percent ?? res.progress,
    }
  } catch {
    return {}
  }
}

export async function saveBookReadingProgress(
  bookId: string | number,
  data: { cfi: string; percent: number },
): Promise<void> {
  try {
    await apiClient(`/library/${bookId}/progress`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  } catch (err) {
    console.warn("[Library API] Erreur lors de la sauvegarde de progression:", err)
  }
}
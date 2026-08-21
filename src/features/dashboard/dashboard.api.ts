import { getPublicApiBaseUrl } from "@/lib/runtime-env"
import type { AuthUser } from "@/features/auth/types"

import type { DashboardBook, DashboardResponse } from "./types"

const API_BASE_URL = getPublicApiBaseUrl()
const API_PREFIX = "/api/v1"
const USE_PREVIEW_DATA = !API_BASE_URL

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

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  })

  const payload = (await response.json().catch(() => null)) as T | {
    message?: string
  } | null

  if (!response.ok) {
    throw new Error(
      payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string" &&
        payload.message
        ? payload.message
        : "Impossible de charger votre espace.",
    )
  }

  return payload as T
}

function mapBook(book: BackendBook | BackendLibraryItem): DashboardBook {
  const nestedBook = "book" in book ? book.book : undefined
  const rawAuthor = nestedBook?.author ?? book.author ?? nestedBook?.author_name
  const author =
    typeof rawAuthor === "string"
      ? rawAuthor
      : (rawAuthor?.name ?? nestedBook?.author_name ?? "Auteur YéYéBook")
  const id = nestedBook?.id ?? ("id" in book ? book.id : book.book_id) ?? 0
  const progress =
    "progress_percent" in book
      ? book.progress_percent
      : "progress" in book
        ? book.progress
        : undefined

  return {
    id: Number(id),
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
  }
}

const PREVIEW_BOOKS = {
  continueReading: [
    {
      id: 4,
      title: "Une si longue lettre",
      author: "Mariama Bâ",
      category: "Roman",
      cover:
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=1200&fit=crop&auto=format",
      progress: 68,
    },
    {
      id: 2,
      title: "Le Soleil des Indépendances",
      author: "Ahmadou Kourouma",
      category: "Roman",
      cover:
        "https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&h=1200&fit=crop&auto=format",
      progress: 24,
    },
  ],
  recommendations: [
    {
      id: 3,
      title: "Soundjata, l’épopée mandingue",
      author: "Djibril Tamsir Niane",
      category: "Histoire",
      cover:
        "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&h=1200&fit=crop&auto=format",
      isNew: true,
    },
    {
      id: 5,
      title: "Les Bouts de bois de Dieu",
      author: "Ousmane Sembène",
      category: "Roman",
      cover:
        "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&h=1200&fit=crop&auto=format",
    },
    {
      id: 6,
      title: "Cahier d’un retour au pays natal",
      author: "Aimé Césaire",
      category: "Poésie",
      cover:
        "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800&h=1200&fit=crop&auto=format",
    },
  ],
} as const

async function loadProductionDashboard(
  user: AuthUser,
): Promise<DashboardResponse> {
  const [libraryResponse, booksResponse] = await Promise.all([
    request<CollectionResponse<BackendLibraryItem>>(
      "/library?page=1&limit=12&sort_by=recent",
    ),
    request<CollectionResponse<BackendBook>>(
      "/books?page=1&limit=6&sort_order=desc&sort_by=created_at",
    ),
  ])

  const libraryBooks = libraryResponse.items.map(mapBook)
  const progressResults = await Promise.all(
    libraryBooks.map(async (book) => {
      try {
        const progressResponse = await request<{
          progress?: number
          progress_percent?: number
        }>(`/library/${book.id}/progress`)
        return {
          ...book,
          progress:
            progressResponse.progress_percent ??
            progressResponse.progress ??
            book.progress,
        }
      } catch {
        return book
      }
    }),
  )
  const continueReading = progressResults
    .filter((book) => (book.progress ?? 0) > 0 && (book.progress ?? 0) < 100)
    .slice(0, 4)
  const recommendations = booksResponse.items.map(mapBook).slice(0, 6)

  return {
    user,
    summary: {
      booksInLibrary: libraryResponse.total ?? libraryBooks.length,
      readingNow: continueReading.length,
      completedBooks: progressResults.filter((book) => book.progress === 100)
        .length,
    },
    continueReading,
    recommendations,
  }
}

export async function getDashboard(user: AuthUser): Promise<DashboardResponse> {
  if (USE_PREVIEW_DATA) {
    return {
      user,
      summary: {
        booksInLibrary: 6,
        readingNow: 2,
        completedBooks: 3,
      },
      continueReading: [...PREVIEW_BOOKS.continueReading],
      recommendations: [...PREVIEW_BOOKS.recommendations],
    }
  }

  return loadProductionDashboard(user)
}

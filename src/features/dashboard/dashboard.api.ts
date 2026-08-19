import type { AuthUser } from "@/features/auth/types"

import type { DashboardResponse } from "./types"

const API_BASE_URL = (import.meta.env
  .VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "")
const USE_PREVIEW_DATA = !API_BASE_URL

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  })

  const payload = (await response.json().catch(() => null)) as T | {
    message?: string
  } | null

  if (!response.ok) {
    throw new Error(
      payload && "message" in payload && payload.message
        ? payload.message
        : "Impossible de charger votre espace.",
    )
  }

  return payload as T
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

  return request<DashboardResponse>("/dashboard")
}

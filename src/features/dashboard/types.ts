import type { AuthUser } from "@/features/auth/types"

export type DashboardBook = {
  id: number
  title: string
  author: string
  category: string
  cover: string
  progress?: number
  isNew?: boolean
}

export type DashboardSummary = {
  booksInLibrary: number
  readingNow: number
  completedBooks: number
}

export type DashboardResponse = {
  user: AuthUser
  summary: DashboardSummary
  continueReading: DashboardBook[]
  recommendations: DashboardBook[]
}

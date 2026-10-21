import type { AuthUser } from "@/features/auth/types"

export type DashboardBook = {
  id: string
  title: string
  author: string
  category: string
  price?: number
  slug?: string
  cover: string
  progress?: number
  isNew?: boolean
  has_file?: boolean
  reading_status?: "not_started" | "reading" | "finished"
  progress_percent?: number
}

export type LibraryStats = {
  books: number
  reading: number
  finished: number
  not_started: number
  orders?: number
}

export type LibraryBookItem = DashboardBook

export type LibraryResponse = {
  items: LibraryBookItem[]
  stats?: LibraryStats
  total?: number
}

export type DashboardSummary = {
  booksInLibrary: number
  readingNow: number
  completedBooks: number
  ordersCount?: number
}

export type DashboardResponse = {
  user: AuthUser
  summary: DashboardSummary
  continueReading: DashboardBook[]
  recommendations: DashboardBook[]
}

export type UserOrderItem = {
  title: string
  slug?: string
  cover_url?: string
  unit_price: number
  quantity?: number
}

export type UserOrder = {
  id: string
  status: "pending" | "paid" | "completed" | "cancelled" | "refunded"
  total_amount: number
  currency: string
  created_at: string
  items: UserOrderItem[]
}

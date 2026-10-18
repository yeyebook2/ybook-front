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

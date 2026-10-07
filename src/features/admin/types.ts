export type MonthlySale = {
  month: string
  year: number
  revenue: number
  orders_count: number
}

export type CategorySale = {
  category: string
  revenue: number
  percentage: number
}

export type TopBook = {
  id: string
  title: string
  author: string
  cover?: string
  units_sold: number
  revenue: number
}

export type AdminStats = {
  revenue_total: number
  orders_count: number
  orders_paid_count: number
  orders_pending_count: number
  orders_cancelled_count: number
  books_total: number
  books_published_count: number
  books_draft_count: number
  average_rating: number
  monthly_sales: MonthlySale[]
  category_sales: CategorySale[]
  top_books: TopBook[]
}

export type AdminBook = {
  id: string
  slug?: string
  title: string
  author: string
  category: string
  price: number
  pages: number
  year: number
  rating: number
  reviews: number
  cover: string
  description: string
  status: "published" | "draft" | "archived"
  published: boolean
  created_at?: string
}

export type AdminBookInput = {
  title: string
  author: string
  category: string
  price: number
  pages?: number
  year?: number
  cover?: string
  description?: string
  status?: "published" | "draft"
  published?: boolean
}

export type AdminOrderItem = {
  book_id: string
  title: string
  price: number
  quantity: number
}

export type AdminOrder = {
  id: string
  user_id?: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  provider: string
  status: "paid" | "pending" | "cancelled" | "refunded"
  total_amount: number
  currency?: string
  created_at: string
  items: AdminOrderItem[]
}

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
  file_url?: string
  epub_filename?: string
  has_file?: boolean
  file_size?: number
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
  file_url?: string
  epub_filename?: string
}

export type UploadCoverResponse = {
  success: boolean
  url: string
  width?: number
  height?: number
  message?: string
}

export type UploadEpubResponse = {
  success: boolean
  file_url: string
  filename: string
  size_bytes?: number
  message?: string
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

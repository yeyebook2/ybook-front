import type { Book, CatalogBook } from "@/features/catalog/types"

export type BookReview = {
  id: string
  authorName: string
  rating: number
  comment: string
  createdAt: string
  verifiedPurchase?: boolean
}

export type BookReviewPage = {
  items: BookReview[]
  total: number
  averageRating: number
  page: number
  limit: number
  totalPages: number
}

export type BookDetail = Book & {
  authorSlug?: string
  authorBio?: string
  tags?: string[]
}

export type BookDetailResponse = {
  book: BookDetail
  reviews: BookReviewPage
  relatedBooks: CatalogBook[]
}

export type ReviewFormValues = {
  rating: number
  comment: string
}

export type BookDetailTab = "description" | "reviews" | "related"

export type BookDetailPageProps = {
  bookSlug?: string
  fallbackBook?: Book
  isAuthenticated: boolean
  owned: boolean
  progress?: number
  onBack: () => void
  onOpenBook: (book: CatalogBook) => void
  onAddToCart: (book: Book) => void
  onBuyNow: (book: Book) => void
  onStartReading: (book: Book) => void
  onToast: (
    message: string,
    variant?: "default" | "success" | "error" | "warning",
  ) => void
}

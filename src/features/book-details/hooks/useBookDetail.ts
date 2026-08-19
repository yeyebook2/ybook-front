import { useCallback, useEffect, useState } from "react"

import { getBookDetail, submitBookReview } from "../book-details.api"
import type { BookDetailResponse, BookReview, ReviewFormValues } from "../types"
import type { Book } from "@/features/catalog/types"

export function useBookDetail(slug?: string, fallbackBook?: Book) {
  const [data, setData] = useState<BookDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    void getBookDetail(slug, fallbackBook)
      .then((nextData) => {
        if (active) setData(nextData)
      })
      .catch((reason) => {
        if (!active) return
        setData(null)
        setError(
          reason instanceof Error
            ? reason.message
            : "Impossible de charger cette fiche livre.",
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [fallbackBook, reloadToken, slug])

  const reload = useCallback(() => setReloadToken((value) => value + 1), [])

  const addReview = useCallback(
    async (values: ReviewFormValues): Promise<BookReview> => {
      if (!data?.book.slug) throw new Error("Le livre ne possède pas de slug.")
      const review = await submitBookReview(data.book.slug, values)
      setData((current) => {
        if (!current) return current
        return {
          ...current,
          reviews: {
            ...current.reviews,
            items: [review, ...current.reviews.items],
            total: current.reviews.total + 1,
            averageRating:
              (current.reviews.averageRating * current.reviews.total +
                review.rating) /
              (current.reviews.total + 1),
          },
        }
      })
      return review
    },
    [data?.book.slug],
  )

  return { data, loading, error, reload, addReview }
}

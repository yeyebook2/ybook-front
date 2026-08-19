import { useState } from "react"
import { Star } from "lucide-react"

import type { BookReview, ReviewFormValues } from "../types"

type BookReviewsProps = {
  reviews: {
    items: BookReview[]
    total: number
    averageRating: number
  }
  isAuthenticated: boolean
  onSubmit: (values: ReviewFormValues) => Promise<void>
  onToast: (
    message: string,
    variant?: "default" | "success" | "error" | "warning",
  ) => void
}

type StarsProps = {
  rating: number
  label?: string
}

function Stars({ rating, label }: StarsProps) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={label ?? `${rating} sur 5`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < Math.round(rating)
              ? "fill-current text-brand-primary"
              : "text-black/12"
          }`}
          strokeWidth={index < Math.round(rating) ? 1.5 : 1}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

export function BookReviews({
  reviews,
  isAuthenticated,
  onSubmit,
  onToast,
}: BookReviewsProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (rating < 1 || comment.trim().length < 10) {
      onToast("Choisissez une note et écrivez au moins 10 caractères.", "error")
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({ rating, comment })
      setRating(0)
      setComment("")
      onToast("Votre avis a bien été ajouté.", "success")
    } catch (reason) {
      onToast(
        reason instanceof Error
          ? reason.message
          : "Votre avis n’a pas pu être envoyé.",
        "error",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-2xl lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="flex h-fit flex-col items-center gap-sm rounded-corner-lg border border-border-secondary bg-surface-secondary-bg p-xl text-center">
        <span className="text-display font-bold text-text-primary">
          {reviews.averageRating.toFixed(1)}
        </span>
        <Stars rating={reviews.averageRating} />
        <span className="text-label-sm text-text-secondary">
          {reviews.total} avis
        </span>
      </aside>

      <div className="flex flex-col gap-lg">
        {reviews.items.length > 0 ? (
          reviews.items.map((review) => (
            <article
              key={review.id}
              className="rounded-corner-lg border border-border-secondary bg-surface-bg p-lg"
            >
              <div className="flex flex-wrap items-center justify-between gap-md">
                <div className="flex items-center gap-md">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-corner-full bg-brand-tertiary text-label-sm font-bold text-brand-primary">
                    {review.authorName.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h3 className="text-label font-semibold text-text-primary">
                      {review.authorName}
                    </h3>
                    <p className="text-video-title text-text-tertiary">
                      {new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "medium",
                      }).format(new Date(review.createdAt))}
                    </p>
                  </div>
                </div>
                <Stars rating={review.rating} />
              </div>
              <p className="mt-md text-label-sm leading-relaxed text-text-secondary">
                {review.comment}
              </p>
              {review.verifiedPurchase && (
                <span className="mt-md inline-flex rounded-corner-full bg-brand-tertiary px-md py-xs text-video-title font-semibold text-brand-primary">
                  Achat vérifié
                </span>
              )}
            </article>
          ))
        ) : (
          <p className="rounded-corner-lg border border-dashed border-border-primary p-xl text-label-sm text-text-secondary">
            Aucun avis pour le moment. Soyez le premier à partager votre
            lecture.
          </p>
        )}

        {isAuthenticated ? (
          <form
            onSubmit={handleSubmit}
            className="rounded-corner-lg border border-border-secondary bg-surface-secondary-bg p-xl"
          >
            <h3 className="text-heading font-semibold text-text-primary">
              Votre avis
            </h3>
            <div className="mt-lg flex flex-col gap-md">
              <fieldset>
                <legend className="text-label-sm font-medium text-text-secondary">
                  Votre note
                </legend>
                <div className="mt-sm flex gap-xs">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const value = index + 1
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                        aria-pressed={rating === value}
                        className="cursor-pointer rounded-corner-sm p-xs text-brand-primary hover:bg-brand-tertiary"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            value <= rating ? "fill-current" : ""
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    )
                  })}
                </div>
              </fieldset>
              <label className="flex flex-col gap-xs text-label-sm font-medium text-text-secondary">
                Votre commentaire
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={4}
                  minLength={10}
                  maxLength={1000}
                  placeholder="Partagez votre expérience de lecture…"
                  className="resize-y rounded-corner-md border border-border-primary bg-surface-bg p-md font-normal text-text-primary outline-none transition-shadow focus:ring-2 focus:ring-brand-primary/30"
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="self-start rounded-corner-md bg-brand-primary px-lg py-md text-label-sm font-semibold text-on-brand transition-colors hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Envoi…" : "Publier mon avis"}
              </button>
            </div>
          </form>
        ) : (
          <p className="rounded-corner-lg bg-brand-tertiary p-lg text-label-sm text-text-secondary">
            Connectez-vous pour publier un avis sur ce livre.
          </p>
        )}
      </div>
    </div>
  )
}

import { Star } from "lucide-react"

type RatingStarsProps = {
  rating: number
  showValue?: boolean
  size?: "sm" | "md"
}

export function RatingStars({
  rating,
  showValue = true,
  size = "md",
}: RatingStarsProps) {
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"

  return (
    <span
      className="inline-flex items-center gap-xs text-brand-primary"
      aria-label={`${rating.toFixed(1)} sur 5 étoiles`}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`${iconClass} ${
              index < Math.round(rating)
                ? "fill-current text-brand-primary"
                : "fill-current text-black/12"
            }`}
            strokeWidth={0}
          />
        ))}
      </span>
      {showValue && (
        <span className="text-label-sm font-semibold text-text-primary">
          {rating.toFixed(1)}
          <span className="sr-only"> sur 5</span>
        </span>
      )}
    </span>
  )
}

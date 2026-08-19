import { BookText, Heart, ShieldCheck, ShoppingBag } from "lucide-react"
import { Button } from "@figma/astraui"

import { formatPrice } from "@/features/catalog/catalog.utils"
import type { BookDetail } from "../types"

type BookPurchasePanelProps = {
  book: BookDetail
  owned: boolean
  progress?: number
  wished: boolean
  onBuyNow: () => void
  onAddToCart: () => void
  onStartReading: () => void
  onToggleWishlist: () => void
}

export function BookPurchasePanel({
  book,
  owned,
  progress,
  wished,
  onBuyNow,
  onAddToCart,
  onStartReading,
  onToggleWishlist,
}: BookPurchasePanelProps) {
  return (
    <section className="flex flex-col gap-lg rounded-corner-lg border border-border-secondary bg-surface-secondary-bg p-xl">
      <div className="flex flex-wrap items-baseline gap-md">
        <span className="text-display font-bold text-text-primary">
          {formatPrice(book.price)}
        </span>
        <span className="text-label-sm text-text-tertiary">TTC</span>
      </div>

      <div className="flex flex-wrap gap-md">
        {owned ? (
          <Button
            variant="primary"
            iconStart={<BookText className="h-4 w-4" aria-hidden="true" />}
            onClick={onStartReading}
          >
            {progress && progress > 0
              ? "Reprendre la lecture"
              : "Lire maintenant"}
          </Button>
        ) : (
          <>
            <Button
              variant="primary"
              iconStart={<ShoppingBag className="h-4 w-4" aria-hidden="true" />}
              onClick={onBuyNow}
            >
              Acheter maintenant
            </Button>
            <Button variant="neutral" onClick={onAddToCart}>
              Ajouter au panier
            </Button>
          </>
        )}
        <button
          type="button"
          onClick={onToggleWishlist}
          aria-pressed={wished}
          aria-label={
            wished
              ? "Retirer le livre de la liste de souhaits"
              : "Ajouter le livre à la liste de souhaits"
          }
          className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-corner-md border transition-colors ${
            wished
              ? "border-brand-primary bg-brand-tertiary text-brand-primary"
              : "border-border-primary text-text-secondary hover:bg-surface-hover"
          }`}
        >
          <Heart
            className={`h-5 w-5 ${wished ? "fill-current" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <p className="inline-flex items-center justify-center gap-xs text-center text-video-title text-text-tertiary">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Paiement Mobile Money sécurisé · lecture en ligne
      </p>
    </section>
  )
}

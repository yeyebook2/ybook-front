import { useState } from "react"

import { RatingStars } from "@/features/catalog/components/RatingStars"
import type { CatalogBook } from "@/features/catalog/types"
import { formatPrice } from "@/features/catalog/catalog.utils"
import type { BookDetailTab } from "../types"
import type { BookDetailPageProps } from "../types"
import { useBookDetail } from "../hooks/useBookDetail"
import { BookCoverGallery } from "../components/BookCoverGallery"
import { BookDetailStates } from "../components/BookDetailStates"
import { BookDetailTabs } from "../components/BookDetailTabs"
import { BookMetadata } from "../components/BookMetadata"
import { BookPurchasePanel } from "../components/BookPurchasePanel"
import { BookShareActions } from "../components/BookShareActions"

export function BookDetailPage({
  bookSlug,
  fallbackBook,
  isAuthenticated,
  owned,
  progress,
  onBack,
  onOpenBook,
  onOpenAuthor,
  onAddToCart,
  onBuyNow,
  onStartReading,
  onToast,
}: BookDetailPageProps) {
  const { data, loading, error, reload, addReview } = useBookDetail(
    bookSlug,
    fallbackBook,
  )
  const [activeTab, setActiveTab] = useState<BookDetailTab>("description")
  const [wished, setWished] = useState(false)

  if (loading) {
    return <BookDetailStates state="loading" onBack={onBack} />
  }

  if (error || !data) {
    return (
      <BookDetailStates
        state={fallbackBook ? "error" : "not-found"}
        message={error ?? undefined}
        onRetry={reload}
        onBack={onBack}
      />
    )
  }

  const { book, reviews, relatedBooks } = data
  const bookSchema = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: {
      "@type": "Person",
      name: book.author,
    },
    image: book.cover,
    description: book.description,
    isbn: book.isbn,
    numberOfPages: book.pages,
    inLanguage: book.language ?? "fr",
    aggregateRating:
      reviews.total > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: book.rating,
            reviewCount: reviews.total,
            bestRating: 5,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      price: book.price,
      priceCurrency: "XOF",
      availability: "https://schema.org/InStock",
      url: window.location.href,
    },
  }

  const handleShare = (network: "whatsapp" | "facebook" | "x" | "copy") => {
    const url = window.location.href
    const text = `Découvrez « ${book.title} » sur YéYéBook.`
    if (network === "copy") {
      void navigator.clipboard
        ?.writeText(url)
        .then(() => onToast("Lien copié.", "success"))
        .catch(() => onToast("Le lien n’a pas pu être copié.", "error"))
      return
    }

    const shareUrl =
      network === "whatsapp"
        ? `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`
        : network === "facebook"
          ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
          : `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(shareUrl, "_blank", "noopener,noreferrer")
    onToast(`Lien partagé sur ${network === "x" ? "X" : network}.`, "success")
  }

  const handleOpenRelated = (relatedBook: CatalogBook) => {
    onOpenBook(relatedBook)
  }

  const handleAddRelated = (relatedBook: CatalogBook) => {
    onAddToCart({ ...relatedBook, chapters: [] })
  }

  return (
    <main className="animate-fade">
      <script type="application/ld+json">
        {JSON.stringify(bookSchema).replace(/</g, "\\u003c")}
      </script>
      <div className="mx-auto max-w-[1200px] px-xl py-3xl md:px-2xl">
        <nav
          className="mb-2xl flex flex-wrap items-center gap-sm text-label-sm text-text-tertiary"
          aria-label="Fil d’Ariane"
        >
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer hover:text-text-primary"
          >
            Catalogue
          </button>
          <span aria-hidden="true">/</span>
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer hover:text-text-primary"
          >
            {book.category}
          </button>
          <span aria-hidden="true">/</span>
          <span className="max-w-[40ch] truncate font-medium text-text-primary">
            {book.title}
          </span>
        </nav>

        <section className="grid gap-4xl lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)]">
          <BookCoverGallery book={book} />

          <div className="flex flex-col gap-xl">
            <div className="flex flex-col gap-md">
              <div className="flex flex-wrap items-center gap-sm">
                <span className="rounded-corner-sm bg-[#2e8b57]/14 px-md py-xs text-video-title font-bold text-[#1f6642]">
                  Disponible
                </span>
                {book.reviews > 300 && (
                  <span className="rounded-corner-sm bg-brand-tertiary px-md py-xs text-video-title font-bold text-brand-primary">
                    Best-seller
                  </span>
                )}
              </div>
              <h1 className="font-serif text-[36px] leading-[1.05] text-text-primary md:text-[48px]">
                {book.title}
              </h1>
              {book.subtitle && (
                <p className="text-label text-text-secondary">
                  {book.subtitle}
                </p>
              )}
              <p className="text-heading text-text-secondary">
                par{" "}
                {onOpenAuthor ? (
                  <button
                    type="button"
                    onClick={() => onOpenAuthor(book.author, book.authorSlug)}
                    className="cursor-pointer font-medium text-brand-primary hover:text-brand-primary-hover"
                  >
                    {book.author}
                  </button>
                ) : (
                  <span className="font-medium text-brand-primary">
                    {book.author}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-lg text-label-sm text-text-secondary">
              <RatingStars rating={book.rating} />
              <span aria-hidden="true" className="text-border-primary">
                |
              </span>
              <span>{reviews.total} avis</span>
              <span aria-hidden="true" className="text-border-primary">
                |
              </span>
              <span>
                {book.pages} pages · {book.year}
              </span>
            </div>

            <BookPurchasePanel
              book={book}
              owned={owned}
              progress={progress}
              wished={wished}
              onBuyNow={() => onBuyNow(book)}
              onAddToCart={() => onAddToCart(book)}
              onStartReading={() => onStartReading(book)}
              onToggleWishlist={() => {
                setWished((current) => !current)
                onToast(
                  wished
                    ? "Livre retiré de votre liste de souhaits."
                    : "Livre ajouté à votre liste de souhaits.",
                  "success",
                )
              }}
            />

            <BookMetadata book={book} />
            <BookShareActions onShare={handleShare} />

            {book.authorBio && (
              <p className="border-l-2 border-brand-primary pl-lg text-label-sm leading-relaxed text-text-secondary">
                {book.authorBio}
              </p>
            )}
            <p className="text-label-sm text-text-tertiary">
              {formatPrice(book.price)} · Prix TTC en FCFA
            </p>
          </div>
        </section>

        <div className="mt-4xl">
          <BookDetailTabs
            book={book}
            activeTab={activeTab}
            reviews={reviews}
            isAuthenticated={isAuthenticated}
            relatedBooks={relatedBooks}
            onTabChange={setActiveTab}
            onOpenRelated={handleOpenRelated}
            onAddRelated={handleAddRelated}
            onSeeAllRelated={onBack}
            onSubmitReview={async (values) => {
              await addReview(values)
            }}
            onToast={onToast}
          />
        </div>
      </div>
    </main>
  )
}

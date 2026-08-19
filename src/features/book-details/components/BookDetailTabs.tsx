import type { CatalogBook } from "@/features/catalog/types"
import type {
  BookDetail,
  BookDetailTab,
  BookReviewPage,
  ReviewFormValues,
} from "../types"
import { BookReviews } from "./BookReviews"
import { RelatedBooks } from "./RelatedBooks"

type BookDetailTabsProps = {
  book: BookDetail
  activeTab: BookDetailTab
  reviews: BookReviewPage
  isAuthenticated: boolean
  relatedBooks: CatalogBook[]
  onTabChange: (tab: BookDetailTab) => void
  onOpenRelated: (book: CatalogBook) => void
  onAddRelated: (book: CatalogBook) => void
  onSeeAllRelated: () => void
  onSubmitReview: (values: ReviewFormValues) => Promise<void>
  onToast: (
    message: string,
    variant?: "default" | "success" | "error" | "warning",
  ) => void
}

type BookTabDefinition = {
  id: BookDetailTab
  label: string
}

const tabs: BookTabDefinition[] = [
  { id: "description", label: "Description" },
  { id: "reviews", label: "Avis" },
  { id: "related", label: "Titres associés" },
]

export function BookDetailTabs({
  book,
  activeTab,
  reviews,
  isAuthenticated,
  relatedBooks,
  onTabChange,
  onOpenRelated,
  onAddRelated,
  onSeeAllRelated,
  onSubmitReview,
  onToast,
}: BookDetailTabsProps) {
  return (
    <section>
      <div className="mb-xl overflow-x-auto border-b border-border-secondary">
        <div
          className="flex min-w-max gap-2xl"
          role="tablist"
          aria-label="Détails du livre"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`book-tabpanel-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`cursor-pointer whitespace-nowrap border-b-2 pb-md text-label-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-brand-primary text-text-primary"
                  : "border-transparent text-text-tertiary hover:text-text-primary"
              }`}
            >
              {tab.label}
              {tab.id === "reviews" && ` (${reviews.total})`}
            </button>
          ))}
        </div>
      </div>

      <div id={`book-tabpanel-${activeTab}`} role="tabpanel" tabIndex={0}>
        {activeTab === "description" && (
          <div className="grid gap-2xl md:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
            <div className="flex flex-col gap-lg text-label leading-relaxed text-text-secondary">
              <p>{book.description}</p>
              <h2 className="text-heading font-semibold text-text-primary">
                Au sommaire
              </h2>
              <ol className="flex flex-col gap-sm">
                {book.chapters.length > 0 ? (
                  book.chapters.map((chapter, index) => (
                    <li
                      key={`${chapter.title}-${index}`}
                      className="flex items-center gap-md text-label-sm"
                    >
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-corner-full bg-brand-tertiary text-video-title font-semibold text-brand-primary">
                        {index + 1}
                      </span>
                      {chapter.title}
                    </li>
                  ))
                ) : (
                  <li className="text-label-sm text-text-tertiary">
                    Le sommaire sera disponible avec la fiche éditoriale
                    complète.
                  </li>
                )}
              </ol>
            </div>
            <aside className="h-fit rounded-corner-lg border border-border-secondary bg-surface-secondary-bg p-xl">
              <h2 className="mb-md text-label font-semibold text-text-primary">
                Tags
              </h2>
              <div className="flex flex-wrap gap-sm">
                {(book.tags ?? [book.category, "Afrique", "Francophone"]).map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-corner-full border border-border-secondary bg-surface-bg px-md py-xs text-video-title text-text-secondary"
                    >
                      {tag}
                    </span>
                  ),
                )}
              </div>
            </aside>
          </div>
        )}

        {activeTab === "reviews" && (
          <BookReviews
            reviews={reviews}
            isAuthenticated={isAuthenticated}
            onSubmit={onSubmitReview}
            onToast={onToast}
          />
        )}

        {activeTab === "related" && (
          <RelatedBooks
            books={relatedBooks}
            onOpen={onOpenRelated}
            onAdd={onAddRelated}
            onSeeAll={onSeeAllRelated}
          />
        )}
      </div>
    </section>
  )
}

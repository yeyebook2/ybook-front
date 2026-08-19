import { useEffect, useMemo, useState } from "react"
import {
  BookOpen,
  CheckCircle2,
  LibraryBig,
  RefreshCw,
  Sparkles,
} from "lucide-react"

import type { AuthUser } from "@/features/auth/types"

import { getDashboard } from "../dashboard.api"
import { ContinueReadingCard } from "../components/ContinueReadingCard"
import { DashboardHeader } from "../components/DashboardHeader"
import { RecommendationCard } from "../components/RecommendationCard"
import { SummaryCard } from "../components/SummaryCard"
import type { DashboardBook, DashboardResponse } from "../types"

type DashboardPageProps = {
  user: AuthUser
  onHome: () => void
  onCatalog: () => void
  onLibrary: () => void
  onLogout: () => void
  onOpenBook: (bookId: number) => void
  onAddToCart: (book: DashboardBook) => void
  onToast: (message: string) => void
}

export function DashboardPage({
  user,
  onHome,
  onCatalog,
  onLibrary,
  onLogout,
  onOpenBook,
  onAddToCart,
  onToast,
}: DashboardPageProps) {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const firstName = useMemo(
    () => user.name.trim().split(" ")[0] || "lecteur",
    [user.name],
  )

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getDashboard(user))
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger votre espace.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [user.id])

  const handleOpenBook = (book: DashboardBook) => {
    onOpenBook(book.id)
  }

  return (
    <div className="min-h-screen bg-surface-secondary-bg text-text-primary">
      <DashboardHeader
        user={user}
        onHome={onHome}
        onCatalog={onCatalog}
        onLibrary={onLibrary}
        onLogout={onLogout}
      />

      <main
        id="dashboard-main"
        className="mx-auto flex w-full max-w-[1320px] flex-col gap-3xl px-xl py-3xl md:px-2xl md:py-4xl"
      >
        <section className="relative overflow-hidden rounded-corner-xl border border-white/10 bg-[#471423] px-2xl py-2xl text-white shadow-lg md:px-3xl md:py-3xl">
          <div
            className="absolute inset-y-0 left-0 w-1 bg-brand-primary"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-2xl md:flex-row md:items-end md:justify-between">
            <div className="flex max-w-[640px] flex-col gap-lg">
              <span className="inline-flex w-fit items-center gap-sm rounded-corner-full border border-white/25 px-lg py-xs text-video-title font-semibold uppercase tracking-[0.18em] text-white/90">
                <span
                  className="h-1.5 w-1.5 rounded-corner-full bg-brand-primary"
                  aria-hidden="true"
                />
                Votre espace lecteur
              </span>
              <h1 className="font-serif text-[40px] font-bold leading-[1.03] tracking-[-0.045em] md:text-[52px]">
                Bonjour,{" "}
                <span className="text-brand-secondary">{firstName}.</span>
              </h1>
              <p className="max-w-[52ch] text-label leading-relaxed text-white/75">
                Retrouvez vos lectures, suivez votre progression et découvrez
                les prochaines voix à ajouter à votre bibliothèque.
              </p>
            </div>
            <button
              type="button"
              onClick={onCatalog}
              className="inline-flex w-fit cursor-pointer items-center gap-sm rounded-corner-md bg-white px-xl py-lg text-label-sm font-semibold text-brand-dark transition-all hover:-translate-y-0.5 hover:bg-brand-tertiary"
            >
              Explorer le catalogue
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </section>

        {loading ? (
          <section
            className="grid gap-lg md:grid-cols-3"
            aria-live="polite"
            aria-busy="true"
          >
            {["Bibliothèque", "En cours", "Terminés"].map((label) => (
              <div
                key={label}
                className="h-[112px] animate-pulse rounded-corner-lg border border-border-secondary bg-surface-bg"
              />
            ))}
          </section>
        ) : error ? (
          <section
            className="flex flex-col items-start gap-lg rounded-corner-lg border border-danger/25 bg-state-error-bg p-xl"
            role="alert"
          >
            <div className="flex items-start gap-md">
              <RefreshCw
                className="mt-0.5 h-5 w-5 shrink-0 text-danger"
                aria-hidden="true"
              />
              <div className="flex flex-col gap-xs">
                <h2 className="font-serif text-heading font-bold text-text-primary">
                  Votre espace est indisponible
                </h2>
                <p className="text-label-sm text-text-secondary">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="inline-flex cursor-pointer items-center gap-sm rounded-corner-md bg-brand-primary px-lg py-md text-label-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Réessayer
            </button>
          </section>
        ) : data ? (
          <>
            <section
              className="grid gap-lg md:grid-cols-3"
              aria-label="Résumé de votre activité"
            >
              <SummaryCard
                label="Livres dans la bibliothèque"
                value={data.summary.booksInLibrary}
                icon={LibraryBig}
                tone="rose"
              />
              <SummaryCard
                label="Lectures en cours"
                value={data.summary.readingNow}
                icon={BookOpen}
                tone="wine"
              />
              <SummaryCard
                label="Livres terminés"
                value={data.summary.completedBooks}
                icon={CheckCircle2}
                tone="neutral"
              />
            </section>

            <section
              className="flex flex-col gap-xl"
              aria-labelledby="continue-reading-title"
            >
              <div className="flex items-end justify-between gap-lg">
                <div className="flex flex-col gap-xs">
                  <span className="text-video-title font-semibold uppercase tracking-[0.16em] text-brand-muted">
                    Reprendre le fil
                  </span>
                  <h2
                    id="continue-reading-title"
                    className="font-serif text-[28px] font-bold tracking-[-0.035em] text-text-primary"
                  >
                    Vos lectures en cours
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onLibrary}
                  className="hidden cursor-pointer text-label-sm font-semibold text-brand-primary underline decoration-brand-primary/30 underline-offset-4 hover:text-brand-hover sm:inline-flex"
                >
                  Voir ma bibliothèque
                </button>
              </div>
              {data.continueReading.length ? (
                <div className="grid gap-lg md:grid-cols-2">
                  {data.continueReading.map((book) => (
                    <ContinueReadingCard
                      key={book.id}
                      book={book}
                      onContinue={handleOpenBook}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-corner-lg border border-dashed border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
                  Votre prochaine lecture apparaîtra ici.
                </div>
              )}
            </section>

            <section
              className="flex flex-col gap-xl"
              aria-labelledby="recommendations-title"
            >
              <div className="flex items-end justify-between gap-lg">
                <div className="flex flex-col gap-xs">
                  <span className="text-video-title font-semibold uppercase tracking-[0.16em] text-brand-muted">
                    Pour vous
                  </span>
                  <h2
                    id="recommendations-title"
                    className="font-serif text-[28px] font-bold tracking-[-0.035em] text-text-primary"
                  >
                    À découvrir ensuite
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onCatalog}
                  className="hidden cursor-pointer text-label-sm font-semibold text-brand-primary underline decoration-brand-primary/30 underline-offset-4 hover:text-brand-hover sm:inline-flex"
                >
                  Explorer tout le catalogue
                </button>
              </div>
              <div className="grid grid-cols-2 gap-xl md:grid-cols-3">
                {data.recommendations.map((book) => (
                  <RecommendationCard
                    key={book.id}
                    book={book}
                    onOpen={handleOpenBook}
                    onAdd={(item) => {
                      onAddToCart(item)
                      onToast(`« ${item.title} » ajouté au panier`)
                    }}
                  />
                ))}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  )
}

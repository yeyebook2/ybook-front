import { AlertCircle, BookOpen, LoaderCircle } from "lucide-react"
import { Button } from "@figma/astraui"

type CatalogLoadingStateProps = {
  count?: number
}

export function CatalogLoadingState({ count = 8 }: CatalogLoadingStateProps) {
  return (
    <div
      className="grid grid-cols-2 gap-2xl md:grid-cols-3"
      aria-label="Chargement du catalogue"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-col gap-lg">
          <div className="aspect-[2/3] animate-pulse rounded-corner-lg bg-brand-tertiary" />
          <div className="flex flex-col gap-sm">
            <div className="h-4 w-4/5 animate-pulse rounded bg-brand-tertiary" />
            <div className="h-3 w-2/5 animate-pulse rounded bg-brand-tertiary" />
          </div>
        </div>
      ))}
    </div>
  )
}

type CatalogErrorStateProps = {
  message: string
  onRetry: () => void
}

export function CatalogErrorState({
  message,
  onRetry,
}: CatalogErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-lg rounded-corner-lg border border-[#b84870]/30 bg-[#b84870]/5 px-xl py-5xl text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-corner-full bg-[#b84870]/10 text-[#b84870]">
        <AlertCircle className="h-7 w-7" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-sm">
        <h2 className="text-heading text-text-primary">
          Le catalogue n’est pas disponible
        </h2>
        <p className="max-w-md text-label-sm leading-relaxed text-text-secondary">
          {message}
        </p>
      </div>
      <Button variant="neutral" onClick={onRetry}>
        <LoaderCircle className="h-4 w-4" aria-hidden="true" />
        Réessayer
      </Button>
    </div>
  )
}

type CatalogEmptyStateProps = {
  hasActiveFilters: boolean
  onReset: () => void
}

export function CatalogNoResultsState({
  hasActiveFilters,
  onReset,
}: CatalogEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-lg rounded-corner-lg border border-dashed border-border-secondary bg-surface-bg px-xl py-5xl text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-corner-full bg-brand-tertiary text-brand-primary">
        <BookOpen className="h-7 w-7" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-sm">
        <h2 className="text-heading text-text-primary">
          {hasActiveFilters ? "Aucun résultat" : "Le catalogue est vide"}
        </h2>
        <p className="max-w-md text-label-sm leading-relaxed text-text-secondary">
          {hasActiveFilters
            ? "Essayez de retirer un filtre ou de rechercher un autre mot-clé."
            : "Les livres seront bientôt disponibles dans le catalogue YéYéBook."}
        </p>
      </div>
      {hasActiveFilters && (
        <Button variant="neutral" onClick={onReset}>
          Réinitialiser les filtres
        </Button>
      )}
    </div>
  )
}

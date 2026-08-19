import { AlertCircle, BookOpen, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@figma/astraui"

type BookDetailStatesProps = {
  state: "loading" | "error" | "not-found"
  message?: string
  onRetry?: () => void
  onBack: () => void
}

export function BookDetailStates({
  state,
  message,
  onRetry,
  onBack,
}: BookDetailStatesProps) {
  if (state === "loading") {
    return (
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3xl px-xl py-3xl md:px-2xl">
        <div className="h-5 w-52 animate-pulse rounded-corner-full bg-brand-tertiary" />
        <div className="grid gap-4xl md:grid-cols-2">
          <div className="aspect-[2/3] animate-pulse rounded-corner-xl bg-brand-tertiary" />
          <div className="flex flex-col gap-lg">
            <div className="h-12 w-3/4 animate-pulse rounded-corner-md bg-brand-tertiary" />
            <div className="h-6 w-1/2 animate-pulse rounded-corner-md bg-brand-tertiary" />
            <div className="h-36 animate-pulse rounded-corner-lg bg-brand-tertiary" />
          </div>
        </div>
      </div>
    )
  }

  const notFound = state === "not-found"
  return (
    <div className="mx-auto flex max-w-[720px] flex-col items-center gap-lg px-xl py-5xl text-center md:px-2xl">
      {notFound ? (
        <BookOpen className="h-10 w-10 text-brand-primary" aria-hidden="true" />
      ) : (
        <AlertCircle
          className="h-10 w-10 text-brand-primary"
          aria-hidden="true"
        />
      )}
      <h1 className="font-serif text-heading-lg text-text-primary">
        {notFound ? "Livre introuvable" : "La fiche n’a pas pu être chargée"}
      </h1>
      <p className="text-label text-text-secondary">
        {message ??
          (notFound
            ? "Ce livre n’est plus disponible dans le catalogue."
            : "Vérifiez votre connexion puis réessayez.")}
      </p>
      <div className="flex flex-wrap justify-center gap-md">
        {!notFound && onRetry && (
          <Button
            variant="neutral"
            iconStart={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
            onClick={onRetry}
          >
            Réessayer
          </Button>
        )}
        <Button variant="primary" onClick={onBack}>
          Retour au catalogue
        </Button>
      </div>
    </div>
  )
}

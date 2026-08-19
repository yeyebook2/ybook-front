import type { ReactNode } from "react"

import { ArrowLeft, BookOpen, ShieldCheck, Sparkles } from "lucide-react"

import { AuthBrand } from "./AuthBrand"

type AuthShellProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footerPrompt: string
  footerAction: string
  onFooterAction: () => void
  onBack: () => void
}

const reassuranceItems = [
  { icon: BookOpen, label: "Votre bibliothèque, partout avec vous" },
  { icon: ShieldCheck, label: "Un accès pensé pour vos lectures" },
  { icon: Sparkles, label: "La littérature africaine en mouvement" },
]

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footerPrompt,
  footerAction,
  onFooterAction,
  onBack,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-surface-secondary-bg px-xl py-2xl text-text-primary md:px-2xl md:py-4xl">
      <div className="mx-auto grid min-h-[calc(100vh-48px)] w-full max-w-[1180px] overflow-hidden rounded-corner-xl border border-border-secondary bg-surface-bg shadow-lg lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden overflow-hidden bg-[#471423] p-3xl text-white lg:flex lg:flex-col lg:justify-between">
          <div
            className="absolute inset-y-0 left-0 w-1 bg-brand-primary"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-3xl">
            <button
              type="button"
              onClick={onBack}
              className="flex w-fit cursor-pointer items-center gap-sm text-label-sm font-semibold text-white/75 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Retour à l’accueil
            </button>
            <div className="flex flex-col gap-xl pt-2xl">
              <span className="inline-flex w-fit items-center gap-sm rounded-corner-full border border-white/25 px-lg py-xs text-video-title font-semibold uppercase tracking-[0.18em] text-white/90">
                <span
                  className="h-1.5 w-1.5 rounded-corner-full bg-brand-primary"
                  aria-hidden="true"
                />
                Le nouveau souffle littéraire
              </span>
              <h2 className="max-w-[9ch] font-serif text-[48px] font-bold leading-[0.98] tracking-[-0.04em]">
                Lire,
                <br />
                <span className="text-brand-secondary">partager,</span>
                <br />
                transmettre.
              </h2>
              <p className="max-w-[36ch] text-label leading-relaxed text-white/72">
                Retrouvez vos textes préférés et découvrez les voix qui font
                vivre la littérature africaine francophone.
              </p>
            </div>
          </div>
          <div className="relative flex flex-col gap-md border-t border-white/15 pt-xl">
            {reassuranceItems.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-md text-label-sm text-white/78"
              >
                <Icon
                  className="h-4 w-4 text-brand-secondary"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col justify-center px-xl py-2xl sm:px-3xl md:px-5xl md:py-4xl">
          <div className="mx-auto w-full max-w-[430px]">
            <div className="mb-2xl lg:hidden">
              <button
                type="button"
                onClick={onBack}
                className="mb-2xl flex cursor-pointer items-center gap-sm text-label-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Retour à l’accueil
              </button>
              <AuthBrand eyebrow={eyebrow} />
            </div>

            <div className="hidden lg:block">
              <div className="mb-3xl flex justify-end">
                <AuthBrand eyebrow={eyebrow} />
              </div>
            </div>

            <div className="mb-2xl flex flex-col gap-md">
              <span className="text-video-title font-semibold uppercase tracking-[0.18em] text-brand-muted">
                {eyebrow}
              </span>
              <h1 className="font-serif text-[36px] font-bold leading-[1.05] tracking-[-0.04em] text-text-primary md:text-[42px]">
                {title}
              </h1>
              <p className="max-w-[42ch] text-label leading-relaxed text-text-secondary">
                {description}
              </p>
            </div>

            {children}

            <p className="mt-2xl text-center text-label-sm text-text-secondary">
              {footerPrompt}{" "}
              <button
                type="button"
                onClick={onFooterAction}
                className="cursor-pointer font-semibold text-brand-primary underline decoration-brand-primary/30 underline-offset-4 transition-colors hover:text-brand-hover hover:decoration-brand-hover"
              >
                {footerAction}
              </button>
            </p>
            <p className="mx-auto mt-xl max-w-[42ch] text-center text-video-title leading-relaxed text-text-tertiary">
              En continuant, vous acceptez les conditions d’utilisation et la
              politique de confidentialité de YéYéBook.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

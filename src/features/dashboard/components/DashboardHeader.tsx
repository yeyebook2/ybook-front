import { LogOut, Search, ShoppingBag } from "lucide-react"

import { Wordmark } from "@/components/brand/Wordmark"
import type { AuthUser } from "@/features/auth/types"

type DashboardHeaderProps = {
  user: AuthUser
  onHome: () => void
  onCatalog: () => void
  onLibrary: () => void
  onLogout: () => void
}

export function DashboardHeader({
  user,
  onHome,
  onCatalog,
  onLibrary,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border-secondary bg-surface-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-[1320px] items-center gap-xl px-xl md:px-2xl">
        <button
          type="button"
          onClick={onHome}
          className="shrink-0 cursor-pointer transition-opacity hover:opacity-80"
          aria-label="YéYéBook — accueil public"
        >
          <Wordmark className="h-8 w-auto" />
        </button>

        <nav
          className="hidden items-center gap-xs lg:flex"
          aria-label="Navigation de votre espace"
        >
          <button
            type="button"
            onClick={onHome}
            className="rounded-corner-full bg-brand-primary px-lg py-sm text-label-sm font-semibold text-on-brand"
          >
            Mon espace
          </button>
          <button
            type="button"
            onClick={onCatalog}
            className="cursor-pointer rounded-corner-full px-lg py-sm text-label-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            Catalogue
          </button>
          <button
            type="button"
            onClick={onLibrary}
            className="cursor-pointer rounded-corner-full px-lg py-sm text-label-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            Ma bibliothèque
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-md">
          <button
            type="button"
            onClick={onCatalog}
            className="hidden h-10 w-10 cursor-pointer items-center justify-center rounded-corner-full text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary sm:inline-flex"
            aria-label="Rechercher un livre"
          >
            <Search className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onCatalog}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-corner-full text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            aria-label="Ouvrir le catalogue et le panier"
          >
            <ShoppingBag
              className="h-5 w-5"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>
          <div className="hidden h-6 w-px bg-border-secondary sm:block" />
          <div className="hidden flex-col items-end leading-none sm:flex">
            <span className="max-w-[140px] truncate text-label-sm font-semibold text-text-primary">
              {user.name}
            </span>
            <span className="mt-xs max-w-[160px] truncate text-video-title text-text-tertiary">
              {user.email}
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-corner-full text-text-secondary transition-colors hover:bg-brand-tertiary hover:text-brand-primary"
            aria-label="Se déconnecter"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}

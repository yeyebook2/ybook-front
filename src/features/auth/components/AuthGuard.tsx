import type { ReactNode } from "react"
import { useEffect } from "react"

import type { AuthUser } from "../types"

type AuthGuardProps = {
  user: AuthUser | null
  checking?: boolean
  onUnauthenticated: () => void
  children: ReactNode
}

export function AuthGuard({
  user,
  checking = false,
  onUnauthenticated,
  children,
}: AuthGuardProps) {
  useEffect(() => {
    if (!checking && !user) onUnauthenticated()
  }, [checking, onUnauthenticated, user])

  if (checking || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-secondary-bg px-xl text-text-secondary">
        <p className="text-label-sm">Vérification de votre session…</p>
      </main>
    )
  }

  return <>{children}</>
}

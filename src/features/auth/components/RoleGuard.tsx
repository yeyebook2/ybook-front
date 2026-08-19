import type { ReactNode } from "react"
import { useEffect } from "react"

import type { AuthUser } from "../types"

type RoleGuardProps = {
  user: AuthUser | null
  checking?: boolean
  allowedRoles: NonNullable<AuthUser["role"]>[]
  onUnauthorized: () => void
  children: ReactNode
}

export function RoleGuard({
  user,
  checking = false,
  allowedRoles,
  onUnauthorized,
  children,
}: RoleGuardProps) {
  const hasRole = Boolean(user?.role && allowedRoles.includes(user.role))

  useEffect(() => {
    if (!checking && user && !hasRole) onUnauthorized()
  }, [checking, hasRole, onUnauthorized, user])

  if (checking || !user || !hasRole) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-secondary-bg px-xl text-text-secondary">
        <p className="text-label-sm">Vérification de vos permissions…</p>
      </main>
    )
  }

  return <>{children}</>
}

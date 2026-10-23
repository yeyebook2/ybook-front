import { ApiError, handleNetworkOrFetchError, parseApiError } from "@/lib/api-errors"
import { createApiHeaders } from "@/lib/api-headers"
import { getPublicApiBaseUrl } from "@/lib/runtime-env"

const API_PREFIX = "/api/v1"

function requireApiBaseUrl(): string {
  const baseUrl = getPublicApiBaseUrl()
  if (!baseUrl) throw new Error("L’URL de l’API n’est pas configurée.")
  return baseUrl
}

let inFlightRefreshPromise: Promise<boolean> | null = null
let onSessionExpiredCallback: (() => void) | null = null

export function setOnSessionExpired(cb: (() => void) | null): void {
  onSessionExpiredCallback = cb
}

/**
 * Renouvelle silencieusement le jeton de session via le cookie HttpOnly de refresh.
 * Utilise un singleton de promesse pour agréger les requêtes concurrentes.
 */
export async function executeSessionRefresh(): Promise<boolean> {
  if (inFlightRefreshPromise) {
    return inFlightRefreshPromise
  }

  inFlightRefreshPromise = (async () => {
    const url = `${requireApiBaseUrl()}${API_PREFIX}/auth/refresh`
    try {
      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: createApiHeaders(undefined, { targetUrl: url }),
      })
      if (!response.ok) {
        if (onSessionExpiredCallback) onSessionExpiredCallback()
        return false
      }
      return true
    } catch {
      return false
    } finally {
      inFlightRefreshPromise = null
    }
  })()

  return inFlightRefreshPromise
}

export type ApiRequestOptions = RequestInit & {
  isFormData?: boolean
  skipAutoRefresh?: boolean
  fallbackErrorMessage?: string
}

/**
 * Client HTTP centralisé YéYéBook avec :
 * - En-têtes standardisés
 * - Gestion des identifiants et cookies sécurisés
 * - Interception automatique et transparente des 401 avec Silent Refresh
 * - Rejeu unique et sécurisé (anti-boucle)
 */
export async function apiClient<T>(
  path: string,
  options: ApiRequestOptions = {},
  isRetry = false,
): Promise<T> {
  const url = `${requireApiBaseUrl()}${API_PREFIX}${path}`
  const { isFormData, skipAutoRefresh, fallbackErrorMessage, ...fetchInit } = options

  let response: Response
  try {
    response = await fetch(url, {
      ...fetchInit,
      credentials: "include",
      headers: createApiHeaders(fetchInit.headers, { isFormData, targetUrl: url }),
    })
  } catch (networkErr) {
    throw handleNetworkOrFetchError(
      networkErr,
      fallbackErrorMessage || "Impossible de joindre le serveur. Vérifiez votre connexion internet.",
    )
  }

  const payload = (await response.json().catch(() => null)) as T | {
    detail?: unknown
    message?: string
    code?: string
    success?: boolean
  } | null

  if (!response.ok) {
    // 401 Interception pour renouvellement silencieux
    const isAuthEndpoint =
      path.startsWith("/auth/login") ||
      path.startsWith("/auth/register") ||
      path.startsWith("/auth/refresh") ||
      path.startsWith("/auth/logout")

    if (response.status === 401 && !skipAutoRefresh && !isRetry && !isAuthEndpoint) {
      const refreshed = await executeSessionRefresh()
      if (refreshed) {
        return apiClient<T>(path, options, true /* isRetry */)
      } else {
        if (onSessionExpiredCallback) onSessionExpiredCallback()
      }
    }

    const apiError = parseApiError(
      payload,
      response.status,
      response.headers,
      fallbackErrorMessage || "Une erreur est survenue lors de la communication avec le serveur.",
    )
    throw apiError
  }

  return payload as T
}

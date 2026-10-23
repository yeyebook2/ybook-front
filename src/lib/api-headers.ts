import { getPublicApiBaseUrl } from "@/lib/runtime-env"

/**
 * Détecte si une URL cible correspond à un tunnel de développement ngrok.
 */
export function isNgrokTunnelUrl(url?: unknown): boolean {
  if (!url || typeof url !== "string") return false
  return (
    url.includes("ngrok-free.dev") ||
    url.includes("ngrok.io") ||
    url.includes("ngrok-free.app")
  )
}

/**
 * En-têtes HTTP standardisés pour tous les appels vers l'API YéYéBook.
 * Par défaut en production et en local, seul le Content-Type standard est envoyé.
 * L'en-tête de contournement "ngrok-skip-browser-warning" est strictement conditionné
 * à la détection d'un tunnel de développement ngrok actif, évitant ainsi d'émettre
 * des requêtes CORS preflight (OPTIONS) superflues sur les serveurs de production.
 */
export function createApiHeaders(
  customHeaders?: HeadersInit,
  options?: { isFormData?: boolean; targetUrl?: string },
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  const effectiveUrl = options?.targetUrl || getPublicApiBaseUrl()
  if (isNgrokTunnelUrl(effectiveUrl)) {
    headers["ngrok-skip-browser-warning"] = "true"
  }

  if (options?.isFormData) {
    delete headers["Content-Type"]
  }

  if (customHeaders) {
    if (customHeaders instanceof Headers) {
      customHeaders.forEach((value, key) => {
        headers[key] = value
      })
    } else if (Array.isArray(customHeaders)) {
      customHeaders.forEach(([key, value]) => {
        headers[key] = value
      })
    } else {
      Object.assign(headers, customHeaders)
    }
  }

  return headers
}

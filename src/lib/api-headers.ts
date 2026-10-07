/**
 * En-têtes HTTP standardisés pour tous les appels vers l'API YéYéBook.
 * Inclut obligatoirement "ngrok-skip-browser-warning": "true" pour contourner
 * la page d'avertissement interstitielle de ngrok en environnement de développement et staging.
 */
export const DEFAULT_API_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
}

export function createApiHeaders(
  customHeaders?: HeadersInit,
): Record<string, string> {
  const headers: Record<string, string> = {
    ...DEFAULT_API_HEADERS,
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

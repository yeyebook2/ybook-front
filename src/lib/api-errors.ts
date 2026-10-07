/**
 * Extraction robuste et universelle des messages d'erreur renvoyés par l'API FastAPI.
 * Gère les formats standard :
 * - { "detail": "Message d'erreur" }
 * - { "detail": { "code": "...", "message": "Message d'erreur" } }
 * - { "detail": [ { "loc": [...], "msg": "Erreur de validation" } ] }
 * - { "message": "Message d'erreur" }
 */
export function extractApiErrorMessage(
  payload: unknown,
  fallback = "Une erreur est survenue. Veuillez réessayer.",
): string {
  if (!payload || typeof payload !== "object") {
    return fallback
  }

  // 1. Format FastAPI "detail"
  if ("detail" in payload) {
    const detail = (payload as { detail: unknown }).detail

    // Cas 1 : "detail": "Message direct"
    if (typeof detail === "string" && detail.trim().length > 0) {
      return detail.trim()
    }

    // Cas 2 : "detail": { "code": "...", "message": "..." }
    if (detail && typeof detail === "object" && !Array.isArray(detail)) {
      if (
        "message" in detail &&
        typeof (detail as { message: unknown }).message === "string" &&
        (detail as { message: string }).message.trim().length > 0
      ) {
        return (detail as { message: string }).message.trim()
      }
    }

    // Cas 3 : "detail": [ { "msg": "Champ requis", "loc": [...] } ] (Pydantic 422)
    if (Array.isArray(detail) && detail.length > 0) {
      const messages = detail
        .map((err) => {
          if (err && typeof err === "object" && "msg" in err && typeof err.msg === "string") {
            const loc = Array.isArray(err.loc) ? err.loc.filter((l: unknown) => l !== "body").join(".") : ""
            return loc ? `${loc} : ${err.msg}` : err.msg
          }
          return null
        })
        .filter(Boolean)

      if (messages.length > 0) {
        return messages.join(" — ")
      }
    }
  }

  // 2. Format standard "message"
  if (
    "message" in payload &&
    typeof (payload as { message: unknown }).message === "string" &&
    (payload as { message: string }).message.trim().length > 0
  ) {
    return (payload as { message: string }).message.trim()
  }

  return fallback
}

export class ApiError extends Error {
  code?: string
  status?: number
  retryAfter?: number
  details?: unknown

  constructor(
    message: string,
    options?: {
      code?: string
      status?: number
      retryAfter?: number
      details?: unknown
    },
  ) {
    super(message)
    this.name = "ApiError"
    this.code = options?.code
    this.status = options?.status
    this.retryAfter = options?.retryAfter
    this.details = options?.details
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

export const NETWORK_OFFLINE_MESSAGE =
  "Connexion impossible. Vérifiez votre connexion internet et réessayez."

export function isNetworkError(err: unknown): boolean {
  if (!err) return false
  if (err instanceof TypeError) {
    const msg = (err.message || "").toLowerCase()
    return (
      msg.includes("fetch") ||
      msg.includes("network") ||
      msg.includes("load") ||
      msg.includes("abort") ||
      msg.includes("failed") ||
      msg.includes("econnrefused")
    )
  }
  if (typeof err === "object" && "name" in err) {
    const name = String((err as { name?: unknown }).name)
    if (name === "TypeError" || name === "NetworkError") return true
  }
  if (typeof err === "object" && "message" in err) {
    const msg = String((err as { message?: unknown }).message).toLowerCase()
    if (
      msg.includes("failed to fetch") ||
      msg.includes("networkerror") ||
      msg.includes("network request failed") ||
      msg.includes("load failed")
    ) {
      return true
    }
  }
  return false
}

export function handleNetworkOrFetchError(
  err: unknown,
  fallback = "Une erreur est survenue. Veuillez vérifier vos informations et réessayer.",
): ApiError {
  if (isNetworkError(err)) {
    console.warn("[YéYéBook Network] Interception perte de connexion / Failed to fetch")
    return new ApiError(NETWORK_OFFLINE_MESSAGE, {
      code: "NETWORK_OFFLINE",
      status: 0,
    })
  }
  if (err instanceof ApiError) {
    return err
  }
  if (err instanceof Error) {
    return new ApiError(err.message, { details: err })
  }
  return new ApiError(fallback)
}

export function parseApiError(
  payload: unknown,
  status?: number,
  headers?: Headers,
  fallback = "Une erreur est survenue. Veuillez réessayer.",
): ApiError {
  const message = extractApiErrorMessage(payload, fallback)
  let code: string | undefined
  let retryAfter: number | undefined

  if (payload && typeof payload === "object") {
    if ("code" in payload && typeof (payload as { code: unknown }).code === "string") {
      code = (payload as { code: string }).code
    } else if (
      "detail" in payload &&
      payload.detail &&
      typeof payload.detail === "object" &&
      !Array.isArray(payload.detail) &&
      "code" in payload.detail &&
      typeof (payload.detail as { code: unknown }).code === "string"
    ) {
      code = (payload.detail as { code: string }).code
    }
  }

  // Fallbacks standardisés selon les spécifications backend
  if (!code) {
    if (status === 429) code = "AUTH_RATE_LIMITED"
    else if (status === 410) code = "ORDER_EXPIRED"
    else if (status === 503) code = "SERVICE_UNAVAILABLE"
    else if (status === 401) code = "SESSION_EXPIRED"
  }

  if (headers) {
    const retryHeader = headers.get("Retry-After")
    if (retryHeader) {
      const parsed = parseInt(retryHeader, 10)
      if (!isNaN(parsed) && parsed > 0) {
        retryAfter = parsed
      }
    }
  }

  return new ApiError(message, { code, status, retryAfter, details: payload })
}

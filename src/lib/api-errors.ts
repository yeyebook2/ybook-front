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

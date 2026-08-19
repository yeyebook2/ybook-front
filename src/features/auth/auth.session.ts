import type { AuthUser } from "./types"

const PREVIEW_SESSION_KEY = "yeyebook.preview.session"

export function getPreviewSession(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(PREVIEW_SESSION_KEY)
    return raw ? JSON.parse(raw) as AuthUser : null
  } catch {
    return null
  }
}

export function setPreviewSession(user: AuthUser) {
  try {
    sessionStorage.setItem(PREVIEW_SESSION_KEY, JSON.stringify(user))
  } catch {
    // Session storage can be unavailable in restricted browser contexts.
  }
}

export function clearPreviewSession() {
  try {
    sessionStorage.removeItem(PREVIEW_SESSION_KEY)
  } catch {
    // Session storage can be unavailable in restricted browser contexts.
  }
}

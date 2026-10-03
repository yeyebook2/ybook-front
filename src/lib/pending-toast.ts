export type ToastVariant = "default" | "success" | "error" | "warning"

export type PendingToast = {
  message: string
  variant?: ToastVariant
}

const PENDING_TOAST_KEY = "yeyebook-pending-toast"

export function setPendingToast(toast: PendingToast): void {
  if (typeof window === "undefined") return
  try {
    if (!toast.message || typeof toast.message !== "string" || !toast.message.trim()) return
    const payload = {
      message: toast.message.trim(),
      variant: toast.variant || "default",
    }
    sessionStorage.setItem(PENDING_TOAST_KEY, JSON.stringify(payload))
    console.log("[YéYéBook Toast] Toast sauvegardé dans sessionStorage (en attente):", payload)
  } catch {}
}

export function consumePendingToast(): PendingToast | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(PENDING_TOAST_KEY)
    if (!raw) return null
    sessionStorage.removeItem(PENDING_TOAST_KEY)
    const parsed = JSON.parse(raw) as PendingToast
    if (parsed && typeof parsed.message === "string" && parsed.message.trim().length > 0) {
      console.log("[YéYéBook Toast] Toast récupéré et retiré de sessionStorage:", parsed)
      return {
        message: parsed.message.trim(),
        variant: parsed.variant || "default",
      }
    }
    return null
  } catch {
    return null
  }
}

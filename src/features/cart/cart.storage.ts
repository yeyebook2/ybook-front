import type { CartItem } from "./types"

export const CART_STORAGE_KEY = "yeyebook-cart"
export const MAX_CART_QUANTITY = 1

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false
  const item = value as Partial<CartItem>
  return typeof item.bookId === "string" && item.bookId.trim().length > 0
}

export function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Ensure every digital e-book is strictly quantity: 1
    return parsed.filter(isCartItem).map((item) => ({
      ...item,
      quantity: 1,
    }))
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]) {
  try {
    const sanitized = items.map((item) => ({
      ...item,
      quantity: 1,
    }))
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(sanitized))
  } catch {
    // Le panier reste utilisable en mémoire si le stockage est indisponible.
  }
}

import type { CartItem } from "./types"

export const CART_STORAGE_KEY = "yeyebook-cart"
export const MAX_CART_QUANTITY = 5

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false
  const item = value as Partial<CartItem>
  return (
    Number.isInteger(item.bookId) &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity >= 1 &&
    item.quantity <= MAX_CART_QUANTITY
  )
}

export function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isCartItem)
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Le panier reste utilisable en mémoire si le stockage est indisponible.
  }
}

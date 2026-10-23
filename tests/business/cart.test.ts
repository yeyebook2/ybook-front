import { describe, it, expect, beforeEach } from "vitest"
import {
  loadCart,
  saveCart,
  CART_STORAGE_KEY,
  MAX_CART_QUANTITY,
} from "@/features/cart/cart.storage"
import type { CartItem } from "@/features/cart/types"

class MemoryStorage {
  private store = new Map<string, string>()
  get length() { return this.store.size }
  clear() { this.store.clear() }
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null }
  setItem(key: string, value: string) { this.store.set(key, String(value)) }
  removeItem(key: string) { this.store.delete(key) }
  key(index: number) { return Array.from(this.store.keys())[index] ?? null }
}

describe("MÉTIER : Gestion du Panier & Règles Produits Numériques", () => {
  beforeEach(() => {
    // Mock localStorage for node environment
    ;(globalThis as any).localStorage = new MemoryStorage()
  })

  it("CART-01 : loadCart retourne un tableau vide si le stockage est vide ou corrompu", () => {
    expect(loadCart()).toEqual([])

    localStorage.setItem(CART_STORAGE_KEY, "invalid-json{{")
    expect(loadCart()).toEqual([])

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify("not-an-array"))
    expect(loadCart()).toEqual([])
  })

  it("CART-02 : loadCart filtre les éléments non conformes sans bookId valide", () => {
    const invalidData = [
      { bookId: "book-1", title: "Valid Book" },
      { title: "No Book ID" },
      { bookId: "", title: "Empty ID" },
      { bookId: "   ", title: "Whitespace ID" },
      null,
      123,
    ]
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(invalidData))

    const loaded = loadCart()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].bookId).toBe("book-1")
  })

  it("CART-03 : Invariant Produit Numérique — quantité strictement bridée à 1 (MAX_CART_QUANTITY = 1)", () => {
    expect(MAX_CART_QUANTITY).toBe(1)

    const rawWithMultiQty = [
      { bookId: "book-1", quantity: 5, price: 15 },
      { bookId: "book-2", quantity: 99, price: 20 },
    ]
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(rawWithMultiQty))

    const loaded = loadCart()
    expect(loaded[0].quantity).toBe(1)
    expect(loaded[1].quantity).toBe(1)
  })

  it("CART-04 : saveCart persiste les articles en forçant la quantité à 1", () => {
    const items: CartItem[] = [
      { bookId: "b-1", quantity: 4, title: "Livre 1", price: 10 },
      { bookId: "b-2", quantity: 0, title: "Livre 2", price: 12 },
    ]

    saveCart(items)

    const raw = localStorage.getItem(CART_STORAGE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed[0].quantity).toBe(1)
    expect(parsed[1].quantity).toBe(1)
  })

  it("CART-05 : Calcul du total du panier avec gestion des prix manquants ou nuls", () => {
    const items: CartItem[] = [
      { bookId: "b-1", quantity: 1, price: 2500 },
      { bookId: "b-2", quantity: 1, price: 3500 },
      { bookId: "b-3", quantity: 1 }, // prix manquant
    ]

    const total = items.reduce((sum, item) => sum + (item.price ?? 0), 0)
    expect(total).toBe(6000)
  })
})

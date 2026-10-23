import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { getCatalog } from "@/features/catalog/catalog.api"
import { getBookDetail } from "@/features/book-details/book-details.api"
import { createOrderApi, confirmPaymentApi } from "@/features/checkout/checkout.api"
import { getBookReadingProgress, saveBookReadingProgress } from "@/features/dashboard/dashboard.api"

describe("INTÉGRATION : Orchestration des Services Métier via apiClient", () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.yeyebook.com"
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it("INT-01 : getCatalog envoie les bons filtres et mappe correctement les livres", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            id: "b-1",
            title: "L'Arbre à Palabres",
            author: "Amadou Hampâté Bâ",
            price: 3500,
            category: "Contes",
            language: "fr",
            published: true,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      }),
    } as Response)

    const res = await getCatalog({
      page: 1,
      limit: 10,
      search: "Arbre",
      categories: ["Contes"],
      sortBy: "published_at",
      sortOrder: "desc",
      minPrice: "",
      maxPrice: "",
      minRating: 0,
      language: "fr",
      publishedDate: "all",
    })

    expect(res.items).toHaveLength(1)
    expect(res.items[0].title).toBe("L'Arbre à Palabres")
    expect(res.items[0].language).toBe("fr")
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/books?"),
      expect.objectContaining({ credentials: "include" }),
    )
  })

  it("INT-02 : getBookDetail charge la fiche livre et normalise les chapitres", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        book: {
          id: "b-detail-1",
          title: "Détail Livre",
          slug: "detail-livre",
          author: { name: "Auteur Test", slug: "auteur-test" },
          price: 2000,
          category: "Littérature",
          chapters: [
            { order: 1, title: "Prologue", content: ["Texte 1"] },
          ],
        },
      }),
    } as Response)

    const detail = await getBookDetail("detail-livre")
    expect(detail.book.id).toBe("b-detail-1")
    expect(detail.book.title).toBe("Détail Livre")
    expect(detail.book.chapters).toHaveLength(1)
    expect(detail.book.chapters[0].title).toBe("Prologue")
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.yeyebook.com/api/v1/books/detail-livre",
      expect.anything(),
    )
  })

  it("INT-03 : createOrderApi sérialise book_ids et confirmPaymentApi appelle fedapay/confirm", async () => {
    const fetchMock = vi.fn()
      // Réponse createOrder
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          order: { id: "ord-99", user_id: "u-1", status: "pending" },
        }),
      } as Response)
      // Réponse confirmPayment
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          payment: { id: "tx-77", order_id: "ord-99", status: "approved" },
          order_status: "paid",
        }),
      } as Response)

    globalThis.fetch = fetchMock

    const orderRes = await createOrderApi(["book-1", "book-2"])
    expect(orderRes.order.id).toBe("ord-99")
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.yeyebook.com/api/v1/orders",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ book_ids: ["book-1", "book-2"] }),
      }),
    )

    const confirmRes = await confirmPaymentApi("tx-77")
    expect(confirmRes.order_status).toBe("paid")
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.yeyebook.com/api/v1/payments/fedapay/confirm?id=tx-77",
      expect.objectContaining({ method: "GET" }),
    )
  })

  it("INT-04 : saveBookReadingProgress utilise apiClient avec credentials et payload JSON", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        book_id: "b-prog-1",
        cfi: "epubcfi(/6/4[chap1]!/4/2)",
        percent: 42,
      }),
    } as Response)

    await saveBookReadingProgress("b-prog-1", {
      cfi: "epubcfi(/6/4[chap1]!/4/2)",
      percent: 42,
    })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.yeyebook.com/api/v1/library/b-prog-1/progress",
      expect.objectContaining({
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({
          cfi: "epubcfi(/6/4[chap1]!/4/2)",
          percent: 42,
        }),
      }),
    )
  })

  it("INT-05 : getBookReadingProgress extrait le pourcentage depuis cfi et fallback percent", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        cfi: "epubcfi(/6/8)",
        progress_percent: 65,
      }),
    } as Response)

    const progress = await getBookReadingProgress("b-prog-2")
    expect(progress.cfi).toBe("epubcfi(/6/8)")
    expect(progress.percent).toBe(65)
  })
})

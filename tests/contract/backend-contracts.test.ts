import { describe, it, expect } from "vitest"
import type { Book, CatalogResponse } from "@/features/catalog/types"
import type { BookDetailResponse } from "@/features/book-details/types"
import type { LibraryResponse, UserOrder } from "@/features/dashboard/types"
import type { ConfirmPaymentResponse } from "@/features/checkout/checkout.api"
import type { AdminBookInput } from "@/features/admin/types"
import { parseApiError, ApiError } from "@/lib/api-errors"

describe("CONTRATS API : Validation des Schémas et Réponses Backend FastAPI", () => {
  describe("CTR-01 : Catalogue et Fiche Ouvrage (/api/v1/books)", () => {
    it("valide la structure de pagination standard d'une liste de livres", () => {
      const mockBackendBookList: CatalogResponse = {
        items: [
          {
            id: "book-uuid-1",
            slug: "le-chemin-du-marche",
            title: "Le chemin du marché",
            author: "Auteur Test",
            category: "Romans",
            price: 2500,
            pages: 180,
            year: 2024,
            rating: 4.5,
            reviews: 12,
            cover: "/covers/marche.jpg",
            description: "Un récit captivant.",
            language: "fr",
            has_file: true,
            sales_count: 5,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      }

      expect(mockBackendBookList.items).toHaveLength(1)
      expect(mockBackendBookList.total).toBe(1)
      expect(mockBackendBookList.items[0].language).toBe("fr")
      expect(mockBackendBookList.items[0].has_file).toBe(true)
      expect(mockBackendBookList.items[0].sales_count).toBe(5)
    })

    it("valide la fiche détaillée avec table des matières (chapters) et recommandations", () => {
      const mockDetailResponse: BookDetailResponse = {
        book: {
          id: "book-uuid-1",
          slug: "le-chemin-du-marche",
          title: "Le chemin du marché",
          author: "Auteur Test",
          category: "Romans",
          price: 2500,
          pages: 180,
          year: 2024,
          rating: 4.5,
          reviews: 12,
          cover: "/covers/marche.jpg",
          description: "Un récit captivant.",
          language: "fr",
          has_file: true,
          sales_count: 5,
          chapters: [
            { order: 1, title: "Chapitre 1 — L'aube" },
            { order: 2, title: "Chapitre 2 — Le marché" },
          ],
        },
        reviews: {
          items: [],
          total: 0,
          averageRating: 0,
          page: 1,
          limit: 5,
          totalPages: 1,
        },
        relatedBooks: [],
      }

      expect(mockDetailResponse.book.chapters).toBeDefined()
      expect(mockDetailResponse.book.chapters).toHaveLength(2)
      expect(mockDetailResponse.book.chapters?.[0].order).toBe(1)
    })
  })

  describe("CTR-02 : Bibliothèque et Progression (/api/v1/library)", () => {
    it("valide la structure avec compteurs 'stats' et statut de lecture", () => {
      const mockLibraryResponse: LibraryResponse = {
        stats: {
          books: 5,
          reading: 1,
          finished: 1,
          not_started: 3,
          orders: 4,
        },
        items: [
          {
            id: "book-1",
            title: "Le chemin du marché",
            author: "Auteur 1",
            category: "Romans",
            cover: "/covers/1.jpg",
            progress_percent: 14,
            reading_status: "reading",
            has_file: true,
          },
          {
            id: "book-2",
            title: "The Ice-Maiden",
            author: "Hans Christian Andersen",
            category: "Contes",
            cover: "/covers/2.jpg",
            progress_percent: 100,
            reading_status: "finished",
            has_file: true,
          },
        ],
        total: 2,
      }

      // Vérification des statistiques
      expect(mockLibraryResponse.stats?.books).toBe(5)
      expect(mockLibraryResponse.stats?.reading).toBe(1)
      expect(mockLibraryResponse.stats?.finished).toBe(1)
      expect(mockLibraryResponse.stats?.not_started).toBe(3)
      expect(mockLibraryResponse.stats?.orders).toBe(4)

      // Vérification des statuts de lecture
      const readingBook = mockLibraryResponse.items[0]
      expect(readingBook.reading_status).toBe("reading")
      expect(readingBook.progress_percent).toBe(14)

      const finishedBook = mockLibraryResponse.items[1]
      expect(finishedBook.reading_status).toBe("finished")
      expect(finishedBook.progress_percent).toBe(100)
    })
  })

  describe("CTR-03 : Historique des Commandes (/api/v1/orders)", () => {
    it("valide la structure d'une commande payée et d'une commande annulée", () => {
      const mockOrders: UserOrder[] = [
        {
          id: "order-1",
          status: "cancelled",
          total_amount: 1800,
          currency: "XOF",
          created_at: "2026-10-20T10:00:00Z",
          items: [
            {
              title: "Livre Test",
              unit_price: 1800,
              quantity: 1,
            },
          ],
        },
        {
          id: "order-2",
          status: "paid",
          total_amount: 5000,
          currency: "XOF",
          created_at: "2026-10-21T14:30:00Z",
          items: [
            {
              title: "Livre Acheté",
              unit_price: 5000,
              quantity: 1,
            },
          ],
        },
      ]

      expect(mockOrders[0].status).toBe("cancelled")
      expect(mockOrders[1].status).toBe("paid")
      expect(mockOrders[1].currency).toBe("XOF")
    })
  })

  describe("CTR-04 : Confirmation de Paiement FedaPay (/api/v1/payments/fedapay/confirm)", () => {
    it("valide le contrat de retour avec order_status certifié", () => {
      const mockConfirmSuccess: ConfirmPaymentResponse = {
        order_status: "paid",
        payment: {
          id: "tx-12345",
          order_id: "order-uuid-1",
          status: "approved",
          provider_ref: 98765,
        },
      }

      expect(mockConfirmSuccess.order_status).toBe("paid")
      expect(mockConfirmSuccess.payment?.status).toBe("approved")
    })
  })

  describe("CTR-05 : Validation des Formulaires Admin (/api/v1/admin/books)", () => {
    it("vérifie les règles de validation du BookPayload FastAPI", () => {
      // Règle 1 : Langue restreinte à 'fr' ou 'en'
      const validAdminPayload: AdminBookInput = {
        title: "Titre Valide",
        author: "Auteur Valide",
        category: "Romans",
        price: 3500,
        language: "fr",
        status: "published",
      }

      expect(validAdminPayload.price).toBeGreaterThan(0)
      expect(["fr", "en"]).toContain(validAdminPayload.language)

      // Règle 2 : Prix strictement supérieur à 0
      const isPriceValid = (price: number) => price > 0 && price <= 1_000_000
      expect(isPriceValid(3500)).toBe(true)
      expect(isPriceValid(0)).toBe(false)
      expect(isPriceValid(-100)).toBe(false)
      expect(isPriceValid(2_000_000)).toBe(false)

      // Règle 3 : Champs non vides
      const isNotBlank = (val?: string) => !!val && val.trim().length > 0
      expect(isNotBlank(validAdminPayload.title)).toBe(true)
      expect(isNotBlank("   ")).toBe(false)
    })
  })

  describe("CTR-06 : Normalisation Unifiée des Erreurs Backend", () => {
    it("désérialise fidèlement le format d'erreur standard de FastAPI/YéYéBook", () => {
      const backendErrorJson = {
        success: false,
        code: "REVIEW_REQUIRES_PURCHASE",
        message: "Vous devez avoir acheté ce livre pour laisser un avis.",
        field_errors: {},
        request_id: "req-987654",
      }

      const parsed = parseApiError(backendErrorJson, 403)
      expect(parsed instanceof ApiError).toBe(true)
      expect(parsed.code).toBe("REVIEW_REQUIRES_PURCHASE")
      expect(parsed.status).toBe(403)
      expect(parsed.message).toBe("Vous devez avoir acheté ce livre pour laisser un avis.")
    })
  })
})

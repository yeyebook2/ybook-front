import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { apiClient } from "@/lib/api-client"
import { ApiError } from "@/lib/api-errors"

describe("SÉCURITÉ : Permissions, Contrôle d'Accès et Détection 403 Forbidden", () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.yeyebook.com"
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it("PERM-01 : Une réponse HTTP 403 Forbidden ne déclenche JAMAIS de refresh de session", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers(),
      json: async () => ({
        detail: "Vous ne possédez pas les droits d'accès à cette ressource.",
      }),
    } as Response)

    globalThis.fetch = fetchMock

    await expect(apiClient("/library/protected-book/files/chapter1.xhtml")).rejects.toThrow(
      "Vous ne possédez pas les droits d'accès à cette ressource.",
    )

    // Un seul appel réseau : AUCUN appel vers /auth/refresh n'est déclenché !
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining("/auth/refresh"),
      expect.anything(),
    )
  })

  it("PERM-02 : Les routes d'authentification directes (/auth/login) avec 401 ne tentent aucun refresh", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers(),
      json: async () => ({
        detail: "Identifiants invalides.",
      }),
    } as Response)

    globalThis.fetch = fetchMock

    await expect(
      apiClient("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", password: "wrong" }),
      }),
    ).rejects.toThrow("Identifiants invalides.")

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining("/auth/refresh"),
      expect.anything(),
    )
  })

  it("PERM-03 : L'endpoint de rafraîchissement lui-même (/auth/refresh) ne déclenche jamais de récursion", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers(),
      json: async () => ({
        detail: "Token de rafraîchissement révoqué ou expiré.",
      }),
    } as Response)

    globalThis.fetch = fetchMock

    await expect(apiClient("/auth/refresh", { method: "POST" })).rejects.toThrow()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("PERM-04 : Les erreurs 403 préservent le code HTTP d'origine dans ApiError", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers(),
      json: async () => ({
        detail: "Accès refusé au panneau d'administration.",
      }),
    } as Response)

    try {
      await apiClient("/admin/stats")
      expect.unreachable("Devrait lever une ApiError")
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(403)
      expect((err as ApiError).message).toBe("Accès refusé au panneau d'administration.")
    }
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  apiClient,
  executeSessionRefresh,
  setOnSessionExpired,
} from "@/lib/api-client"

describe("SÉCURITÉ : Gestion des Sessions & Silent Refresh (SEC-02)", () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.yeyebook.com"
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    setOnSessionExpired(null)
  })

  it("REFRESH-01 : executeSessionRefresh() retourne true en cas de 200 OK", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response)

    const result = await executeSessionRefresh()
    expect(result).toBe(true)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.yeyebook.com/api/v1/auth/refresh",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    )
  })

  it("REFRESH-02 : executeSessionRefresh() retourne false et déclenche onSessionExpired en cas de 401", async () => {
    const sessionExpiredSpy = vi.fn()
    setOnSessionExpired(sessionExpiredSpy)

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers(),
      json: async () => ({ detail: "Token refresh expiré ou invalide" }),
    } as Response)

    const result = await executeSessionRefresh()
    expect(result).toBe(false)
    expect(sessionExpiredSpy).toHaveBeenCalledTimes(1)
  })

  it("REFRESH-03 : Agrégation atomique des requêtes concurrentes (Mutex Anti-Tempête)", async () => {
    let callCount = 0
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      callCount++
      // Simule une latence réseau de 20ms
      await new Promise((r) => setTimeout(r, 20))
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as Response
    })

    // 5 appels lancés simultanément à la même milliseconde
    const results = await Promise.all([
      executeSessionRefresh(),
      executeSessionRefresh(),
      executeSessionRefresh(),
      executeSessionRefresh(),
      executeSessionRefresh(),
    ])

    expect(results).toEqual([true, true, true, true, true])
    // Un SEUL appel HTTP fetch doit avoir été émis grâce au singleton de promesse
    expect(callCount).toBe(1)
  })

  it("REFRESH-04 : apiClient intercepte 401 et rejoue la requête après rafraîchissement réussi", async () => {
    let attempts = 0
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/auth/refresh")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        } as Response
      }
      if (url.includes("/library")) {
        attempts++
        if (attempts === 1) {
          // Premier appel : jeton de 15 min expiré
          return {
            ok: false,
            status: 401,
            headers: new Headers(),
            json: async () => ({ detail: "Access token expiré" }),
          } as Response
        }
        // Deuxième appel rejoué : succès avec le nouveau cookie
        return {
          ok: true,
          status: 200,
          json: async () => ({ items: [{ id: "1", title: "Livre Test" }] }),
        } as Response
      }
      return { ok: true, status: 200, json: async () => ({}) } as Response
    })

    const data = await apiClient<{ items: Array<{ id: string; title: string }> }>("/library")
    expect(data.items).toHaveLength(1)
    expect(data.items[0].title).toBe("Livre Test")
    expect(attempts).toBe(2) // 1er échec 401 puis rejeu avec succès
  })

  it("REFRESH-05 : Protection anti-boucle infinie si le rejeu échoue aussi avec 401", async () => {
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/auth/refresh")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        } as Response
      }
      // Répond 401 systématiquement
      return {
        ok: false,
        status: 401,
        headers: new Headers(),
        json: async () => ({ detail: "Accès refusé persistant" }),
      } as Response
    })

    await expect(apiClient("/library")).rejects.toThrow()
  })

  it("REFRESH-06 : N'essaie JAMAIS de rafraîchir sur les routes d'authentification directes (/auth/login)", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers(),
      json: async () => ({ detail: "Identifiants invalides" }),
    } as Response)
    globalThis.fetch = fetchSpy

    await expect(apiClient("/auth/login", { method: "POST" })).rejects.toThrow()
    // Ne doit pas avoir appelé /auth/refresh
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("/auth/refresh"),
      expect.anything(),
    )
  })
})

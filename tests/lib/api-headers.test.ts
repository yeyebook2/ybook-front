import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createApiHeaders, isNgrokTunnelUrl } from "@/lib/api-headers"

describe("LIB : En-têtes HTTP et Gestion Conditionnelle ngrok (HDR-01)", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("HDR-01 : Détecte fidèlement les domaines de tunnel ngrok", () => {
    expect(isNgrokTunnelUrl("https://abc.ngrok-free.dev")).toBe(true)
    expect(isNgrokTunnelUrl("https://test.ngrok.io/api/v1")).toBe(true)
    expect(isNgrokTunnelUrl("https://tunnel.ngrok-free.app")).toBe(true)

    // Domaines standards ou de production
    expect(isNgrokTunnelUrl("http://localhost:8001")).toBe(false)
    expect(isNgrokTunnelUrl("https://api.yeyebook.com")).toBe(false)
    expect(isNgrokTunnelUrl("https://yeyebook.com")).toBe(false)
    expect(isNgrokTunnelUrl(undefined)).toBe(false)
  })

  it("HDR-02 : En production ou localhost, n'envoie JAMAIS l'en-tête ngrok superflu (protection CORS)", () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL

    const headers = createApiHeaders(undefined, {
      targetUrl: "https://api.yeyebook.com",
    })

    expect(headers["Content-Type"]).toBe("application/json")
    expect(headers["ngrok-skip-browser-warning"]).toBeUndefined()
  })

  it("HDR-03 : N'injecte l'en-tête ngrok-skip-browser-warning QUE sur un tunnel ngrok avéré", () => {
    const headers = createApiHeaders(undefined, {
      targetUrl: "https://my-tunnel.ngrok-free.dev/api/v1",
    })

    expect(headers["Content-Type"]).toBe("application/json")
    expect(headers["ngrok-skip-browser-warning"]).toBe("true")
  })

  it("HDR-04 : Omet Content-Type en cas d'envoi multipart FormData", () => {
    const headers = createApiHeaders(undefined, {
      isFormData: true,
      targetUrl: "https://api.yeyebook.com",
    })

    expect(headers["Content-Type"]).toBeUndefined()
    expect(headers["ngrok-skip-browser-warning"]).toBeUndefined()
  })

  it("HDR-05 : Préserve et fusionne fidèlement les en-têtes personnalisés", () => {
    const custom = {
      Authorization: "Bearer test-token",
      "X-Custom-Trace": "trace-123",
    }

    const headers = createApiHeaders(custom, {
      targetUrl: "https://api.yeyebook.com",
    })

    expect(headers["Authorization"]).toBe("Bearer test-token")
    expect(headers["X-Custom-Trace"]).toBe("trace-123")
    expect(headers["Content-Type"]).toBe("application/json")
  })
})

describe("LIB : Appels Réseau apiClient & Liseuse — Validation Absence ngrok en Production (HDR-06 à HDR-10)", () => {
  const originalEnv = process.env
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it("HDR-06 : apiClient n'envoie JAMAIS l'en-tête ngrok sur un domaine de production ou localhost", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.yeyebook.com"
    const { apiClient } = await import("@/lib/api-client")
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    })
    global.fetch = mockFetch

    await apiClient("/books")

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [callUrl, callInit] = mockFetch.mock.calls[0]
    expect(callUrl).toBe("https://api.yeyebook.com/api/v1/books")
    expect(callInit.credentials).toBe("include")
    expect(callInit.headers["Content-Type"]).toBe("application/json")
    expect(callInit.headers["ngrok-skip-browser-warning"]).toBeUndefined()
  })

  it("HDR-07 : apiClient injecte l'en-tête ngrok UNIQUEMENT si NEXT_PUBLIC_API_BASE_URL est un tunnel ngrok", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://test-tunnel.ngrok-free.dev"
    const { apiClient } = await import("@/lib/api-client")
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
    global.fetch = mockFetch

    await apiClient("/auth/me")

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [callUrl, callInit] = mockFetch.mock.calls[0]
    expect(callUrl).toBe("https://test-tunnel.ngrok-free.dev/api/v1/auth/me")
    expect(callInit.headers["ngrok-skip-browser-warning"]).toBe("true")
  })

  it("HDR-08 : executeSessionRefresh respecte strictement le conditionnement ngrok", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.yeyebook.com"
    const { executeSessionRefresh } = await import("@/lib/api-client")
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
    global.fetch = mockFetch

    const refreshed = await executeSessionRefresh()
    expect(refreshed).toBe(true)

    const [callUrl, callInit] = mockFetch.mock.calls[0]
    expect(callUrl).toBe("https://api.yeyebook.com/api/v1/auth/refresh")
    expect(callInit.headers["ngrok-skip-browser-warning"]).toBeUndefined()
  })

  it("HDR-09 : La liseuse n'ajoute ni paramètre ni en-tête ngrok sur un serveur standard", () => {
    const prodFilesUrl = "https://api.yeyebook.com/api/v1/library/42/files/package.opf"
    const isProdNgrok = isNgrokTunnelUrl(prodFilesUrl)
    expect(isProdNgrok).toBe(false)

    // Vérifie que l'URL ne reçoit pas le paramètre d'interstitiel
    let targetUrl = prodFilesUrl
    if (isProdNgrok && !targetUrl.includes("ngrok-skip-browser-warning")) {
      targetUrl += "?ngrok-skip-browser-warning=true"
    }
    expect(targetUrl).toBe("https://api.yeyebook.com/api/v1/library/42/files/package.opf")
    expect(targetUrl.includes("ngrok")).toBe(false)

    // Vérifie les en-têtes générés pour la liseuse
    const headers = createApiHeaders(undefined, { targetUrl })
    expect(headers["ngrok-skip-browser-warning"]).toBeUndefined()
  })

  it("HDR-10 : La liseuse ajoute le paramètre et l'en-tête ngrok UNIQUEMENT sur un tunnel ngrok", () => {
    const ngrokFilesUrl = "https://demo.ngrok.io/api/v1/library/42/files/package.opf"
    const isNgrok = isNgrokTunnelUrl(ngrokFilesUrl)
    expect(isNgrok).toBe(true)

    let targetUrl = ngrokFilesUrl
    if (isNgrok && !targetUrl.includes("ngrok-skip-browser-warning")) {
      targetUrl += (targetUrl.includes("?") ? "&" : "?") + "ngrok-skip-browser-warning=true"
    }
    expect(targetUrl).toBe("https://demo.ngrok.io/api/v1/library/42/files/package.opf?ngrok-skip-browser-warning=true")

    const headers = createApiHeaders(undefined, { targetUrl })
    expect(headers["ngrok-skip-browser-warning"]).toBe("true")
  })
})


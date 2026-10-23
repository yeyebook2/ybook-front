import { describe, it, expect } from "vitest"

describe("SÉCURITÉ : Validation Réelle des En-têtes HTTP & CSP (next.config.mjs)", () => {
  it("CSP-01 : next.config.mjs définit des en-têtes de sécurité conformes aux normes bancaires", async () => {
    // Import dynamique du fichier de configuration Next.js
    // @ts-expect-error next.config.mjs lacks ambient type definitions
    const nextConfigModule = (await import("../../next.config.mjs")) as any
    const nextConfig = nextConfigModule.default || nextConfigModule

    expect(typeof nextConfig.headers).toBe("function")
    const headerConfigs = await nextConfig.headers()
    expect(headerConfigs.length).toBeGreaterThan(0)

    const allRoutesHeader = headerConfigs.find((h: any) => h.source === "/(.*)")
    expect(allRoutesHeader).toBeDefined()

    const headersMap = Object.fromEntries(
      allRoutesHeader.headers.map((h: any) => [h.key, h.value]),
    )

    // 1. Content-Security-Policy
    const csp = headersMap["Content-Security-Policy"]
    expect(csp).toBeDefined()
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain("frame-src 'self' blob:") // Requis pour les iframes sécurisées d'epubjs

    // 2. Strict-Transport-Security (HSTS)
    expect(headersMap["Strict-Transport-Security"]).toContain("max-age=63072000")
    expect(headersMap["Strict-Transport-Security"]).toContain("includeSubDomains")

    // 3. Encapsulation et protection contre le reniflage MIME
    expect(headersMap["X-Frame-Options"]).toBe("SAMEORIGIN")
    expect(headersMap["X-Content-Type-Options"]).toBe("nosniff")
    expect(headersMap["Referrer-Policy"]).toBe("strict-origin-when-cross-origin")

    // 4. Permissions-Policy
    expect(headersMap["Permissions-Policy"]).toContain("camera=()")
    expect(headersMap["Permissions-Policy"]).toContain("microphone=()")
    expect(headersMap["Permissions-Policy"]).toContain("geolocation=()")
  })

  it("CSP-02 : next.config.mjs désactive formellement les SVG arbitraires dans next/image", async () => {
    // @ts-expect-error next.config.mjs lacks ambient type definitions
    const nextConfigModule = (await import("../../next.config.mjs")) as any
    const nextConfig = nextConfigModule.default || nextConfigModule

    expect(nextConfig.images).toBeDefined()
    // Neutralise les injections de code XSS par SVG dans le composant d'optimisation Next.js
    expect(nextConfig.images.dangerouslyAllowSVG).toBe(false)
  })
})

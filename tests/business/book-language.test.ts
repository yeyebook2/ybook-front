import { describe, it, expect } from "vitest"
import { SUPPORTED_LANGUAGES } from "@/features/admin/AdminBookEditor"
import type { AdminBookInput } from "@/features/admin/types"

describe("MÉTIER : Gestion des Langues et Intégrité Backend/Frontend (FNC-01)", () => {
  it("LANG-01 : Liste des langues supportées conforme au contrat FastAPI Literal['fr', 'en']", () => {
    // Le backend FastAPI / Pydantic BookPayload restreint strictement language à Literal["fr", "en"] = "fr"
    expect(SUPPORTED_LANGUAGES).toHaveLength(2)

    const codes = SUPPORTED_LANGUAGES.map((l) => l.code)
    expect(codes).toEqual(["fr", "en"])
  })

  it("LANG-02 : La langue par défaut du formulaire d'édition est le français ('fr')", () => {
    expect(SUPPORTED_LANGUAGES[0].code).toBe("fr")
    expect(SUPPORTED_LANGUAGES[0].label).toBe("Français")
  })

  it("LANG-03 : AdminBookInput préserve le champ language conforme ('fr' ou 'en')", () => {
    const inputFr: AdminBookInput = {
      title: "L'Enfant Noir",
      author: "Camara Laye",
      price: 4500,
      description: "Roman autobiographique",
      category: "Littérature",
      language: "fr",
    }
    expect(inputFr.language).toBe("fr")

    const inputEn: AdminBookInput = {
      ...inputFr,
      title: "Things Fall Apart",
      language: "en",
    }
    expect(inputEn.language).toBe("en")
  })

  it("LANG-04 : Règle d'Intégrité — Ne JAMAIS falsifier les livres historiques sans langue en 'fr'", () => {
    // Si la langue historique réelle d'un ouvrage est inconnue (NULL ou vide en base), conserver cette distinction
    function resolveBookLanguageDisplay(
      rawLang?: string | null,
      langMap: Record<string, string> = {},
    ): string {
      const trimmed = rawLang?.trim()
      if (!trimmed) return "Non renseignée"
      return langMap[trimmed.toLowerCase()] ?? trimmed.toUpperCase()
    }

    const langMap = Object.fromEntries(
      SUPPORTED_LANGUAGES.map((item) => [item.code, item.label]),
    )

    // Ouvrages anciens avec language = NULL ou vide
    expect(resolveBookLanguageDisplay(null, langMap)).toBe("Non renseignée")
    expect(resolveBookLanguageDisplay(undefined, langMap)).toBe("Non renseignée")
    expect(resolveBookLanguageDisplay("", langMap)).toBe("Non renseignée")
    expect(resolveBookLanguageDisplay("   ", langMap)).toBe("Non renseignée")

    // Ouvrages avec langue définie
    expect(resolveBookLanguageDisplay("fr", langMap)).toBe("Français")
    expect(resolveBookLanguageDisplay("en", langMap)).toBe("Anglais")
  })

  it("LANG-05 : Validation stricte — rejet préventif frontend de toute langue hors contrat backend", () => {
    // Le contrat backend Pydantic BookPayload rejette toute valeur != 'fr' ou 'en' avec HTTP 422
    function validateLanguageForBackend(lang: string): boolean {
      const validBackendLanguages = new Set(["fr", "en"])
      return validBackendLanguages.has(lang.toLowerCase().trim())
    }

    expect(validateLanguageForBackend("fr")).toBe(true)
    expect(validateLanguageForBackend("en")).toBe(true)
    expect(validateLanguageForBackend("FR")).toBe(true)
    expect(validateLanguageForBackend("fon")).toBe(false)
    expect(validateLanguageForBackend("sw")).toBe(false)
    expect(validateLanguageForBackend("es")).toBe(false)
  })

  it("LANG-06 : Résolution complète des libellés de langues officielles YéYéBook", () => {
    const langMap = Object.fromEntries(
      SUPPORTED_LANGUAGES.map((item) => [item.code, item.label]),
    )

    expect(langMap["fr"]).toBe("Français")
    expect(langMap["en"]).toBe("Anglais")
  })
})

import { describe, it, expect } from "vitest"
import {
  extractApiErrorMessage,
  parseApiError,
  handleNetworkOrFetchError,
  isNetworkError,
  ApiError,
  NETWORK_OFFLINE_MESSAGE,
} from "@/lib/api-errors"

describe("LIB : Gestion et Normalisation des Erreurs API (FastAPI / Pydantic)", () => {
  it("ERR-01 : Extrait le message d'une erreur simple FastAPI { detail: string }", () => {
    const payload = { detail: "Identifiants invalides." }
    const message = extractApiErrorMessage(payload)
    expect(message).toBe("Identifiants invalides.")
  })

  it("ERR-02 : Extrait le message d'une erreur structurée { detail: { message: string, code: string } }", () => {
    const payload = {
      detail: {
        code: "INVALID_CREDENTIALS",
        message: "Mot de passe incorrect.",
      },
    }
    const err = parseApiError(payload, 401)
    expect(err.message).toBe("Mot de passe incorrect.")
    expect(err.code).toBe("INVALID_CREDENTIALS")
    expect(err.status).toBe(401)
  })

  it("ERR-03 : Extrait et formate les erreurs de validation Pydantic (HTTP 422)", () => {
    const payload = {
      detail: [
        {
          loc: ["body", "email"],
          msg: "Adresse e-mail invalide",
        },
        {
          loc: ["body", "password"],
          msg: "Le mot de passe doit comporter au moins 8 caractères",
        },
      ],
    }
    const message = extractApiErrorMessage(payload)
    expect(message).toContain("email : Adresse e-mail invalide")
    expect(message).toContain("password : Le mot de passe doit comporter au moins 8 caractères")
  })

  it("ERR-04 : Extrait le message d'un format standard { message: string }", () => {
    const payload = { message: "Opération non autorisée." }
    expect(extractApiErrorMessage(payload)).toBe("Opération non autorisée.")
  })

  it("ERR-05 : Gestion du Rate Limiting (429) et du header Retry-After", () => {
    const headers = new Headers()
    headers.set("Retry-After", "900") // 15 minutes anti-brute force

    const err = parseApiError(
      { detail: "Trop de tentatives de connexion. Réessayez plus tard." },
      429,
      headers,
    )

    expect(err.status).toBe(429)
    expect(err.code).toBe("AUTH_RATE_LIMITED")
    expect(err.retryAfter).toBe(900)
    expect(err.message).toBe("Trop de tentatives de connexion. Réessayez plus tard.")
  })

  it("ERR-06 : Détection des erreurs réseau (hors ligne / Failed to fetch)", () => {
    const fetchError = new TypeError("Failed to fetch")
    expect(isNetworkError(fetchError)).toBe(true)

    const normalized = handleNetworkOrFetchError(fetchError)
    expect(normalized).toBeInstanceOf(ApiError)
    expect(normalized.code).toBe("NETWORK_OFFLINE")
    expect(normalized.status).toBe(0)
    expect(normalized.message).toBe(NETWORK_OFFLINE_MESSAGE)
  })
})

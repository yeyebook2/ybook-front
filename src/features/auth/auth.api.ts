import {
  ApiError,
  handleNetworkOrFetchError,
  isNetworkError,
  parseApiError,
} from "@/lib/api-errors"
import { getPublicApiBaseUrl } from "@/lib/runtime-env"
import type {
  AuthApiResponse,
  AuthUser,
  LoginFormValues,
  RegisterFormValues,
} from "./types"

const API_BASE_URL = getPublicApiBaseUrl()
const API_PREFIX = "/api/v1"

type BackendAuthPayload = {
  user?: {
    id?: string | number
    name?: string
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    role?: "user" | "author" | "moderator" | "admin" | "super_admin"
  }
  message?: string
  access_token?: string
  refresh_token?: string
  success?: boolean
  code?: string
}

import { createApiHeaders } from "@/lib/api-headers"

function requireApiBaseUrl(): string {
  if (!API_BASE_URL) throw new Error("L’URL de l’API n’est pas configurée.")
  return API_BASE_URL
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const url = `${requireApiBaseUrl()}${API_PREFIX}${path}`
  console.log(`[YéYéBook Auth API] Requête HTTP ${init.method || "GET"} vers: ${url}`)
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      credentials: "include",
      headers: createApiHeaders(init.headers),
    })
  } catch (networkErr) {
    const error = handleNetworkOrFetchError(
      networkErr,
      "Impossible de joindre le serveur. Vérifiez votre connexion internet.",
    )
    console.error(`[YéYéBook Auth API] Erreur réseau sur ${path}:`, error)
    throw error
  }

  const payload = (await response.json().catch(() => null)) as T | {
    detail?: unknown
    message?: string
    code?: string
    success?: boolean
  } | null

  if (!response.ok) {
    const apiError = parseApiError(
      payload,
      response.status,
      response.headers,
      "Une erreur est survenue. Veuillez vérifier vos informations et réessayer.",
    )
    console.error(`[YéYéBook Auth API] Erreur HTTP ${response.status} sur ${path}:`, {
      status: response.status,
      code: apiError.code,
      retryAfter: apiError.retryAfter,
      payload,
      message: apiError.message,
    })
    throw apiError
  }

  console.log(`[YéYéBook Auth API] Réponse HTTP ${response.status} OK sur ${path}:`, payload)
  return payload as T
}

function normalizeUser(
  user?: BackendAuthPayload["user"],
): AuthUser | undefined {
  if (!user?.email || user.id === undefined) return undefined

  let fallbackPhone: string | undefined
  if (typeof window !== "undefined") {
    try {
      fallbackPhone = localStorage.getItem("ybook-user-phone") || undefined
    } catch {}
  }

  return {
    id: String(user.id),
    name:
      user.name ||
      [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      user.email,
    email: user.email,
    phone: user.phone || fallbackPhone,
    role: user.role,
  }
}

function adaptAuthResponse(
  payload: BackendAuthPayload,
  fallbackMessage: string,
): AuthApiResponse {
  const message =
    typeof payload.message === "string" && payload.message.trim().length > 0
      ? payload.message.trim()
      : fallbackMessage

  return {
    ok: payload.success !== false,
    mode: "api",
    message,
    user: normalizeUser(payload.user),
  }
}

export const AUTH_USER_STORAGE_KEY = "yeyebook-auth-user"

export function getCachedUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    return parsed && typeof parsed === "object" && parsed.email ? parsed : null
  } catch {
    return null
  }
}

export function saveCachedUser(user: AuthUser | null): void {
  if (typeof window === "undefined") return
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY)
    }
  } catch {}
}

export async function login(values: LoginFormValues): Promise<AuthApiResponse> {
  console.log("[YéYéBook Auth API] login() appelé avec email:", values.email.trim())
  const payload = await request<BackendAuthPayload>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: values.email.trim(),
      password: values.password,
    }),
  })
  console.log("[YéYéBook Auth API] login() payload reçu du backend:", payload)

  const res = adaptAuthResponse(payload, "Connexion réussie.")
  console.log("[YéYéBook Auth API] login() réponse adaptée:", res)
  if (res.user) {
    saveCachedUser(res.user)
  }
  return res
}

export async function register(
  values: RegisterFormValues,
): Promise<AuthApiResponse> {
  console.log("[YéYéBook Auth API] register() appelé avec email:", values.email.trim())
  const payload = await request<BackendAuthPayload>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: values.email.trim(),
      password: values.password,
      first_name: values.firstName.trim(),
      last_name: values.lastName.trim(),
      phone: values.phone.trim(),
      consents: {
        terms: values.acceptTerms,
        privacy: values.acceptPrivacy,
        marketing: values.acceptMarketing,
      },
    }),
  })
  console.log("[YéYéBook Auth API] register() payload reçu du backend:", payload)

  if (typeof window !== "undefined" && values.phone?.trim()) {
    try {
      localStorage.setItem("ybook-user-phone", values.phone.trim())
    } catch {}
  }

  const res = adaptAuthResponse(payload, "Compte créé avec succès.")
  console.log("[YéYéBook Auth API] register() réponse adaptée:", res)
  if (res.user) {
    saveCachedUser(res.user)
  }
  return res
}

export async function forgotPassword(email: string): Promise<string> {
  const payload = await request<{ message?: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim() }),
  })
  return payload.message ?? "Si ce compte existe, un e-mail a été envoyé."
}

export async function refreshSession(): Promise<boolean> {
  try {
    await request<{ success?: boolean }>("/auth/refresh", { method: "POST" })
    return true
  } catch (err) {
    if (err instanceof ApiError && (err.code === "SESSION_EXPIRED" || err.status === 401)) {
      saveCachedUser(null)
    }
    return false
  }
}

let inFlightCurrentUserPromise: Promise<AuthUser | null> | null = null

export async function getCurrentUser(force = false): Promise<AuthUser | null> {
  if (inFlightCurrentUserPromise && !force) {
    return inFlightCurrentUserPromise
  }
  inFlightCurrentUserPromise = (async () => {
    try {
      const payload = await request<BackendAuthPayload>("/auth/me", {
        method: "GET",
      })
      const user = normalizeUser(payload.user) ?? null
      saveCachedUser(user)
      return user
    } catch (err) {
      if (err instanceof ApiError && (err.code === "SESSION_EXPIRED" || err.status === 401)) {
        saveCachedUser(null)
      } else if (isNetworkError(err)) {
        return getCachedUser()
      } else {
        saveCachedUser(null)
      }
      return null
    } finally {
      setTimeout(() => {
        inFlightCurrentUserPromise = null
      }, 500)
    }
  })()
  return inFlightCurrentUserPromise
}

export async function logout(): Promise<void> {
  inFlightCurrentUserPromise = null
  saveCachedUser(null)
  try {
    await request<{ success?: boolean }>("/auth/logout", { method: "POST" })
  } catch {}
}

export type UpdateProfilePayload = {
  first_name?: string
  last_name?: string
  phone?: string
}

export async function updateProfile(
  data: UpdateProfilePayload,
): Promise<AuthUser> {
  const payload = await request<BackendAuthPayload>("/auth/me", {
    method: "PUT",
    body: JSON.stringify(data),
  })
  const user = normalizeUser(payload.user)
  if (!user) {
    throw new Error("Réponse inattendue lors de la mise à jour du profil.")
  }
  saveCachedUser(user)
  return user
}

export type ChangePasswordPayload = {
  current_password: string
  new_password: string
}

export async function changePassword(
  data: ChangePasswordPayload,
): Promise<{ success: boolean; message: string }> {
  try {
    const payload = await request<{ success?: boolean; message?: string }>(
      "/auth/change-password",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    )
    return {
      success: payload.success ?? true,
      message: payload.message ?? "Mot de passe modifié avec succès.",
    }
  } catch (err: unknown) {
    if (err instanceof ApiError || (err && typeof err === "object")) {
      const anyErr = err as { code?: string; status?: number; message?: string }
      const code = anyErr.code || ""
      const status = anyErr.status
      if (
        code === "INVALID_CURRENT_PASSWORD" ||
        (status === 400 && String(anyErr.message).toLowerCase().includes("actuel"))
      ) {
        throw new Error("Le mot de passe actuel est incorrect.")
      }
      if (
        code === "SAME_PASSWORD" ||
        (status === 400 && String(anyErr.message).toLowerCase().includes("différent"))
      ) {
        throw new Error("Choisissez un mot de passe différent de l'actuel.")
      }
      if (status === 422 || code === "VALIDATION_ERROR") {
        throw new Error("Le mot de passe doit faire au moins 8 caractères.")
      }
      if (status === 429 || code === "TOO_MANY_REQUESTS") {
        throw new Error("Trop d'essais, réessayez dans quelques minutes.")
      }
    }
    throw err
  }
}
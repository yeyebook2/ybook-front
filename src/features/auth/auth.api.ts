import { extractApiErrorMessage } from "@/lib/api-errors"
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
}

function requireApiBaseUrl(): string {
  if (!API_BASE_URL) throw new Error("L’URL de l’API n’est pas configurée.")
  return API_BASE_URL
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${requireApiBaseUrl()}${API_PREFIX}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  })

  const payload = (await response.json().catch(() => null)) as T | {
    detail?: unknown
    message?: string
  } | null

  if (!response.ok) {
    throw new Error(
      extractApiErrorMessage(
        payload,
        "Une erreur est survenue. Veuillez vérifier vos informations et réessayer.",
      ),
    )
  }

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
  return {
    ok: payload.success !== false,
    mode: "api",
    message: payload.message ?? fallbackMessage,
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
  const payload = await request<BackendAuthPayload>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: values.email.trim(),
      password: values.password,
    }),
  })

  const res = adaptAuthResponse(payload, "Connexion réussie.")
  if (res.user) {
    saveCachedUser(res.user)
  }
  return res
}

export async function register(
  values: RegisterFormValues,
): Promise<AuthApiResponse> {
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

  if (typeof window !== "undefined" && values.phone?.trim()) {
    try {
      localStorage.setItem("ybook-user-phone", values.phone.trim())
    } catch {}
  }

  const res = adaptAuthResponse(payload, "Compte créé avec succès.")
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

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const payload = await request<BackendAuthPayload>("/auth/me", {
      method: "GET",
    })
    const user = normalizeUser(payload.user) ?? null
    saveCachedUser(user)
    return user
  } catch {
    saveCachedUser(null)
    return null
  }
}

export async function logout(): Promise<void> {
  saveCachedUser(null)
  try {
    await request<{ success?: boolean }>("/auth/logout", { method: "POST" })
  } catch {}
}
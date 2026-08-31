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
    message?: string
  } | null

  if (!response.ok) {
    throw new Error(
      payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string" &&
        payload.message
        ? payload.message
        : "Une erreur est survenue. Réessayez.",
    )
  }

  return payload as T
}

function normalizeUser(
  user?: BackendAuthPayload["user"],
): AuthUser | undefined {
  if (!user?.email || user.id === undefined) return undefined

  return {
    id: String(user.id),
    name:
      user.name ||
      [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      user.email,
    email: user.email,
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

export async function login(values: LoginFormValues): Promise<AuthApiResponse> {
  const payload = await request<BackendAuthPayload>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: values.email.trim(),
      password: values.password,
    }),
  })

  return adaptAuthResponse(payload, "Connexion réussie.")
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

  return adaptAuthResponse(payload, "Compte créé avec succès.")
}

export async function forgotPassword(email: string): Promise<string> {
  const payload = await request<{ message?: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim() }),
  })
  return payload.message ?? "Si ce compte existe, un e-mail a été envoyé."
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const payload = await request<BackendAuthPayload>("/auth/me", {
    method: "GET",
  })
  return normalizeUser(payload.user) ?? null
}

export async function logout(): Promise<void> {
  await request<{ success?: boolean }>("/auth/logout", { method: "POST" })
}
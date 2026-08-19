import {
  clearPreviewSession,
  getPreviewSession,
  setPreviewSession,
} from "./auth.session"
import type {
  AuthApiResponse,
  AuthUser,
  LoginFormValues,
  RegisterFormValues,
} from "./types"

const API_BASE_URL = (import.meta.env
  .VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "")
const USE_PREVIEW_AUTH = !API_BASE_URL

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
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
      payload && "message" in payload && payload.message
        ? payload.message
        : "Une erreur est survenue. Réessayez.",
    )
  }

  return payload as T
}

function persistPreviewResponse(response: AuthApiResponse) {
  if (response.mode === "preview" && response.user) {
    setPreviewSession(response.user)
  }
  return response
}

export async function login(values: LoginFormValues): Promise<AuthApiResponse> {
  if (USE_PREVIEW_AUTH) {
    return persistPreviewResponse({
      ok: true,
      mode: "preview",
      message: "Connexion validée pour la prévisualisation.",
      user: {
        id: "preview-user",
        name: "Lecteur YéYéBook",
        email: values.email.trim(),
      },
    })
  }

  return persistPreviewResponse(
    await request<AuthApiResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: values.email.trim(),
        password: values.password,
      }),
    }),
  )
}

export async function register(
  values: RegisterFormValues,
): Promise<AuthApiResponse> {
  if (USE_PREVIEW_AUTH) {
    return persistPreviewResponse({
      ok: true,
      mode: "preview",
      message: "Compte prêt à être créé en prévisualisation.",
      user: {
        id: "preview-user",
        name: values.name.trim(),
        email: values.email.trim(),
      },
    })
  }

  return persistPreviewResponse(
    await request<AuthApiResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      }),
    }),
  )
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (USE_PREVIEW_AUTH) {
    return getPreviewSession()
  }

  const response = await request<AuthApiResponse>("/auth/me", {
    method: "GET",
  })
  return response.user ?? null
}

export async function logout(): Promise<void> {
  if (USE_PREVIEW_AUTH) {
    clearPreviewSession()
    return
  }

  await request<void>("/auth/logout", { method: "POST" })
}

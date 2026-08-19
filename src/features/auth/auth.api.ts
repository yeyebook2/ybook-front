import type {
  AuthApiResponse,
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

export async function login(values: LoginFormValues): Promise<AuthApiResponse> {
  if (USE_PREVIEW_AUTH) {
    return {
      ok: true,
      mode: "preview",
      message: "Connexion validée pour la prévisualisation.",
      user: {
        id: "preview-user",
        name: "Lecteur YéYéBook",
        email: values.email.trim(),
      },
    }
  }

  return request<AuthApiResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: values.email.trim(),
      password: values.password,
    }),
  })
}

export async function register(
  values: RegisterFormValues,
): Promise<AuthApiResponse> {
  if (USE_PREVIEW_AUTH) {
    return {
      ok: true,
      mode: "preview",
      message: "Compte prêt à être créé en prévisualisation.",
      user: {
        id: "preview-user",
        name: values.name.trim(),
        email: values.email.trim(),
      },
    }
  }

  return request<AuthApiResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
    }),
  })
}

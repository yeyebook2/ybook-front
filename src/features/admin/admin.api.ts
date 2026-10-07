import {
  handleNetworkOrFetchError,
  parseApiError,
} from "@/lib/api-errors"
import { getPublicApiBaseUrl } from "@/lib/runtime-env"
import type {
  AdminBook,
  AdminBookInput,
  AdminOrder,
  AdminStats,
} from "./types"

import { createApiHeaders } from "@/lib/api-headers"

const API_BASE_URL = getPublicApiBaseUrl()
const API_PREFIX = "/api/v1/admin"

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${API_PREFIX}${path}`
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      credentials: "include",
      headers: createApiHeaders({
        "Cache-Control": "no-cache",
        ...init.headers,
      }),
    })
  } catch (networkErr) {
    throw handleNetworkOrFetchError(
      networkErr,
      "Impossible de joindre le serveur d'administration. Vérifiez votre connexion internet.",
    )
  }

  const payload = (await response.json().catch(() => null)) as T | {
    detail?: unknown
    message?: string
    code?: string
    success?: boolean
  } | null

  if (!response.ok) {
    throw parseApiError(
      payload,
      response.status,
      response.headers,
      "Une erreur est survenue lors de l'opération d'administration.",
    )
  }

  if (!payload) {
    throw new Error("Réponse vide du serveur.")
  }

  return payload as T
}

export async function getAdminStatsApi(): Promise<AdminStats | null> {
  try {
    const res = await request<{ success: boolean } & AdminStats>("/stats", {
      method: "GET",
    })
    return res
  } catch (err) {
    console.warn("[YéYéBook Admin API] stats endpoint non disponible ou erreur:", err)
    return null
  }
}

export async function getAdminBooksApi(params?: {
  search?: string
  status?: string
  page?: number
  limit?: number
}): Promise<{ items: AdminBook[]; total: number } | null> {
  try {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set("search", params.search)
    if (params?.status) searchParams.set("status", params.status)
    if (params?.page) searchParams.set("page", String(params.page))
    if (params?.limit) searchParams.set("limit", String(params.limit))

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ""
    const res = await request<{ success: boolean; items: AdminBook[]; total: number }>(
      `/books${query}`,
      { method: "GET" },
    )
    return { items: res.items, total: res.total }
  } catch (err) {
    console.warn("[YéYéBook Admin API] get books endpoint non disponible:", err)
    return null
  }
}

export async function createAdminBookApi(
  data: AdminBookInput,
): Promise<{ success: boolean; book?: AdminBook }> {
  return request<{ success: boolean; message: string; book?: AdminBook }>("/books", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateAdminBookApi(
  id: string,
  data: Partial<AdminBookInput>,
): Promise<{ success: boolean; book?: AdminBook }> {
  return request<{ success: boolean; message: string; book?: AdminBook }>(`/books/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function toggleBookPublishApi(
  id: string,
  status: "published" | "draft",
): Promise<{ success: boolean; status: string }> {
  return request<{ success: boolean; status: string }>(`/books/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export async function deleteAdminBookApi(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean; message: string }>(`/books/${id}`, {
    method: "DELETE",
  })
}

export async function getAdminOrdersApi(params?: {
  status?: string
  search?: string
  page?: number
  limit?: number
}): Promise<{ items: AdminOrder[]; total: number } | null> {
  try {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set("status", params.status)
    if (params?.search) searchParams.set("search", params.search)
    if (params?.page) searchParams.set("page", String(params.page))
    if (params?.limit) searchParams.set("limit", String(params.limit))

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ""
    const res = await request<{ success: boolean; items: AdminOrder[]; total: number }>(
      `/orders${query}`,
      { method: "GET" },
    )
    return { items: res.items, total: res.total }
  } catch (err) {
    console.warn("[YéYéBook Admin API] get orders endpoint non disponible:", err)
    return null
  }
}

export async function updateOrderStatusApi(
  orderId: string,
  status: "paid" | "pending" | "cancelled" | "refunded",
): Promise<{ success: boolean }> {
  return request<{ success: boolean; message: string }>(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

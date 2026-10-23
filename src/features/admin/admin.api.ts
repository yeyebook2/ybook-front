import {
  handleNetworkOrFetchError,
  parseApiError,
} from "@/lib/api-errors"
import { getPublicApiBaseUrl } from "@/lib/runtime-env"
import type {
  AdminBook,
  AdminBookInput,
  AdminOrder,
  AdminReview,
  AdminStats,
  UploadCoverResponse,
  UploadEpubResponse,
} from "./types"

import { createApiHeaders } from "@/lib/api-headers"

const API_BASE_URL = getPublicApiBaseUrl()
import { apiClient } from "@/lib/api-client"

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData
  return apiClient<T>(`/admin${path}`, {
    ...init,
    isFormData,
    headers: {
      "Cache-Control": "no-cache",
      ...init.headers,
    },
    fallbackErrorMessage: "Une erreur est survenue lors de l'opération d'administration.",
  })
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

export async function deleteAdminBookApi(
  id: string,
): Promise<{ success: boolean; message?: string }> {
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
    if (params?.status && params.status !== "all") {
      searchParams.set("status", params.status)
    } else if (params?.status === "all") {
      searchParams.set("status", "all")
    }
    if (params?.search?.trim()) searchParams.set("search", params.search.trim())
    if (params?.page) searchParams.set("page", String(params.page))
    if (params?.limit) searchParams.set("limit", String(params.limit))

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ""
    const res = await request<any>(
      `/orders${query}`,
      { method: "GET" },
    )
    const items: AdminOrder[] = Array.isArray(res)
      ? res
      : res?.items || res?.orders || res?.data || []
    const total = typeof res?.total === "number" ? res.total : items.length
    return { items, total }
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

export async function uploadCoverApi(file: File): Promise<UploadCoverResponse> {
  const formData = new FormData()
  formData.append("file", file)
  return request<UploadCoverResponse>("/books/upload-cover", {
    method: "POST",
    body: formData,
  })
}

export async function uploadEpubApi(file: File): Promise<UploadEpubResponse> {
  const formData = new FormData()
  formData.append("file", file)
  return request<UploadEpubResponse>("/books/upload-epub", {
    method: "POST",
    body: formData,
  })
}

export async function getAdminReviewsApi(params?: {
  page?: number
  limit?: number
}): Promise<{ items: AdminReview[]; total: number } | null> {
  try {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set("page", String(params.page))
    if (params?.limit) searchParams.set("limit", String(params.limit))

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ""
    const res = await request<{
      success: boolean
      items: AdminReview[]
      total?: number
    }>(`/reviews${query}`, { method: "GET" })
    const items = res?.items || []
    const total = typeof res?.total === "number" ? res.total : items.length
    return { items, total }
  } catch (err) {
    console.warn(
      "[YéYéBook Admin API] get reviews endpoint non disponible:",
      err,
    )
    return null
  }
}

export async function deleteAdminReviewApi(
  id: string,
): Promise<{ success: boolean; message?: string }> {
  return request<{ success: boolean; message?: string }>(`/reviews/${id}`, {
    method: "DELETE",
  })
}



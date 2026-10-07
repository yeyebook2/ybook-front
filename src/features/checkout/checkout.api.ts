import {
  ApiError,
  handleNetworkOrFetchError,
  parseApiError,
} from "@/lib/api-errors"
import { getPublicApiBaseUrl } from "@/lib/runtime-env"

const API_BASE_URL = getPublicApiBaseUrl()
const API_PREFIX = "/api/v1"

export type CreateOrderResponse = {
  success: boolean
  order: {
    id: string
    user_id: string
    status: string
    total_amount?: number
    created_at?: string
  }
}

export type InitiatePaymentResponse = {
  success: boolean
  payment: {
    id: string
    order_id: string
    provider: string
    status: string
    payment_url: string
    provider_ref?: number
    amount?: number
  }
}

export type ConfirmPaymentResponse = {
  payment: {
    id: string
    order_id: string
    status: string
    provider_ref?: number
  }
  order_status: string
}

import { createApiHeaders } from "@/lib/api-headers"

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${API_PREFIX}${path}`
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
      "Impossible d'initier la commande ou le paiement. Vérifiez votre connexion internet.",
    )
    console.error(`[YéYéBook Checkout API] Erreur réseau sur ${path}:`, error)
    throw error
  }

  const payload = (await response.json().catch(() => null)) as T | {
    detail?: string | { message?: string }
    message?: string
    code?: string
    success?: boolean
  } | null

  if (!response.ok) {
    const apiError = parseApiError(
      payload,
      response.status,
      response.headers,
      "Une erreur est survenue lors de l'opération de commande ou de paiement.",
    )
    console.error(`[YéYéBook Checkout API] Erreur HTTP ${response.status} sur ${path}:`, {
      code: apiError.code,
      status: apiError.status,
      message: apiError.message,
    })
    throw apiError
  }

  if (!payload) {
    throw new ApiError("Réponse vide du serveur.")
  }

  return payload as T
}

export async function createOrderApi(bookIds: string[]): Promise<CreateOrderResponse> {
  return request<CreateOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify({ book_ids: bookIds }),
  })
}

export async function initiatePaymentApi(orderId: string, phoneNumber?: string): Promise<InitiatePaymentResponse> {
  return request<InitiatePaymentResponse>("/payments/initiate", {
    method: "POST",
    body: JSON.stringify({
      order_id: orderId,
      provider: "fedapay",
      phone_number: phoneNumber?.trim() || undefined,
    }),
  })
}

export async function confirmPaymentApi(transactionId: number | string): Promise<ConfirmPaymentResponse> {
  return request<ConfirmPaymentResponse>(`/payments/fedapay/confirm?id=${encodeURIComponent(transactionId)}`, {
    method: "GET",
  })
}

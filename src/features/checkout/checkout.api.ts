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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${API_PREFIX}${path}`
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  })

  const payload = (await response.json().catch(() => null)) as T | {
    detail?: string | { message?: string }
    message?: string
  } | null

  if (!response.ok) {
    let message = "Une erreur est survenue lors de l'opération."
    if (payload && typeof payload === "object") {
      if ("message" in payload && typeof payload.message === "string") {
        message = payload.message
      } else if ("detail" in payload) {
        if (typeof payload.detail === "string") {
          message = payload.detail
        } else if (payload.detail && typeof payload.detail === "object" && "message" in payload.detail) {
          message = String(payload.detail.message)
        }
      }
    }
    throw new Error(message)
  }

  if (!payload) {
    throw new Error("Réponse vide du serveur.")
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

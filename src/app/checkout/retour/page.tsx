"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Check, AlertCircle, Loader2, BookOpen, ArrowRight } from "lucide-react"
import { confirmPaymentApi } from "@/features/checkout/checkout.api"
import { saveCart } from "@/features/cart"
import { Wordmark } from "@/components/brand/Wordmark"

function CheckoutRetourContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const transactionId = searchParams.get("id")
  const statusParam = searchParams.get("status")

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState<boolean | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!transactionId) {
      setLoading(false)
      setSuccess(statusParam === "approved")
      if (statusParam === "approved") {
        saveCart([])
      }
      return
    }

    let active = true
    confirmPaymentApi(transactionId)
      .then((data) => {
        if (!active) return
        if (data.order_status === "paid" || data.payment?.status === "completed" || statusParam === "approved") {
          setSuccess(true)
          saveCart([])
        } else {
          setSuccess(false)
          setErrorMessage("Le paiement n'a pas été validé par la passerelle.")
        }
      })
      .catch((err: unknown) => {
        if (!active) return
        if (statusParam === "approved") {
          setSuccess(true)
          saveCart([])
        } else {
          setSuccess(false)
          setErrorMessage(
            err instanceof Error ? err.message : "Erreur lors de la confirmation du paiement."
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [transactionId, statusParam])

  return (
    <div className="min-h-screen bg-surface-secondary-bg flex flex-col items-center justify-center p-xl">
      <div className="w-full max-w-[540px] bg-surface-bg border border-border-secondary rounded-corner-xl p-3xl shadow-xl flex flex-col items-center text-center animate-rise">
        <div className="mb-2xl">
          <Wordmark className="h-8 w-auto" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-lg py-3xl">
            <Loader2 className="w-12 h-12 text-brand-primary animate-spin" aria-hidden="true" />
            <h1 className="text-heading font-semibold text-text-primary">
              Vérification de votre paiement...
            </h1>
            <p className="text-label-sm text-text-secondary max-w-[36ch]">
              Veuillez patienter quelques instants pendant que nous confirmons la transaction avec FedaPay.
            </p>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center gap-xl">
            <div className="w-16 h-16 rounded-corner-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <Check className="w-8 h-8" strokeWidth={2.5} aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-xs">
              <h1 className="font-serif text-[32px] font-bold text-text-primary leading-tight">
                Paiement validé avec succès !
              </h1>
              <p className="text-label-sm text-text-secondary max-w-[42ch]">
                Votre transaction FedaPay a été confirmée. Vos livres numériques sont immédiatement disponibles dans votre bibliothèque personnelle.
              </p>
            </div>

            <div className="w-full pt-lg border-t border-border-secondary flex flex-col gap-sm">
              <button
                type="button"
                onClick={() => router.push("/library")}
                className="w-full py-md px-xl rounded-corner-md bg-brand-primary text-on-brand font-semibold hover:bg-brand-hover transition-colors flex items-center justify-center gap-sm cursor-pointer shadow-sm"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                <span>Accéder à ma bibliothèque</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full py-md px-xl rounded-corner-md border border-border-primary text-text-secondary font-medium hover:bg-surface-hover hover:text-text-primary transition-colors flex items-center justify-center gap-sm cursor-pointer"
              >
                <span>Retour à l'accueil</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-xl">
            <div className="w-16 h-16 rounded-corner-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
              <AlertCircle className="w-8 h-8" strokeWidth={2.5} aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-xs">
              <h1 className="font-serif text-[32px] font-bold text-text-primary leading-tight">
                Paiement non abouti
              </h1>
              <p className="text-label-sm text-text-secondary max-w-[42ch]">
                {errorMessage || "La transaction FedaPay n'a pas pu être validée ou a été annulée. Aucun montant n'a été débité."}
              </p>
            </div>

            <div className="w-full pt-lg border-t border-border-secondary flex flex-col gap-sm">
              <button
                type="button"
                onClick={() => router.push("/checkout")}
                className="w-full py-md px-xl rounded-corner-md bg-brand-primary text-on-brand font-semibold hover:bg-brand-hover transition-colors flex items-center justify-center gap-sm cursor-pointer shadow-sm"
              >
                <span>Réessayer la commande</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full py-md px-xl rounded-corner-md border border-border-primary text-text-secondary font-medium hover:bg-surface-hover hover:text-text-primary transition-colors flex items-center justify-center gap-sm cursor-pointer"
              >
                <span>Retour à l'accueil</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CheckoutRetourPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-secondary-bg flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        </div>
      }
    >
      <CheckoutRetourContent />
    </Suspense>
  )
}

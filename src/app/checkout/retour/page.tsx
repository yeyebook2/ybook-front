"use client"

import { Suspense, useEffect, useState, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Check,
  AlertCircle,
  Loader2,
  BookOpen,
  ArrowRight,
  Clock,
  RotateCcw,
  AlertTriangle,
  XCircle,
} from "lucide-react"
import { confirmPaymentApi, type ConfirmPaymentResponse } from "@/features/checkout/checkout.api"
import { saveCart } from "@/features/cart"
import { Wordmark } from "@/components/brand/Wordmark"

type VerificationState =
  | "loading"
  | "success"
  | "pending"
  | "declined"
  | "error"
  | "missing_id"

function CheckoutRetourContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Extraction sécurisée de l'ID — Le paramètre ?status=... est INTENTIONNELLEMENT ignoré
  const rawId = searchParams.get("id")
  const transactionId = rawId ? rawId.trim() : null

  const [state, setState] = useState<VerificationState>("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isVerifyingRef = useRef(false)

  const verifyTransaction = useCallback(async (id: string, options?: { force?: boolean }) => {
    // 1. Anti-concurrence : Évite les doubles requêtes simultanées en vol (React 18 StrictMode)
    if (isVerifyingRef.current) return
    isVerifyingRef.current = true

    setState("loading")
    setErrorMessage(null)

    const sessionCacheKey = `ybook_tx_verified_${id}`

    // 2. Cache UX : Évite de re-fetcher si déjà confirmé comme 'paid' dans la session
    // Ne s'applique JAMAIS si l'utilisateur demande explicitement un réessai (options.force === true)
    if (!options?.force) {
      try {
        if (sessionStorage.getItem(sessionCacheKey) === "paid") {
          setState("success")
          isVerifyingRef.current = false
          return
        }
      } catch {}
    }

    try {
      // 3. Appel de confirmation idempotent côté serveur
      const data: ConfirmPaymentResponse = await confirmPaymentApi(id)

      // Le serveur backend est la SEULE source de vérité
      const isOrderPaid = data.order_status === "paid"
      const isPending =
        data.order_status === "pending" ||
        data.payment?.status === "pending" ||
        data.payment?.status === "processing"

      if (isOrderPaid) {
        // SUCCÈS OFFICIEL VALIDÉ PAR LE BACKEND
        setState("success")

        // RÈGLE ABSOLUE : Vidage du panier EXCLUSIVEMENT quand la commande est payée
        saveCart([])

        try {
          localStorage.setItem("ybook-library-refresh-needed", "true")
          sessionStorage.setItem(sessionCacheKey, "paid")
        } catch {}
      } else if (isPending) {
        // PAIEMENT EN ATTENTE (Mobile Money USSD / Opérateur)
        setState("pending")
        // Le panier N'EST PAS vidé, et aucun cache de session bloquant n'est écrit
      } else {
        // TRANSACTION REFUSÉE OU NON ABOUTIE
        setState("declined")
        setErrorMessage(
          "La transaction a été refusée ou annulée par votre opérateur. Aucun montant n'a été prélevé."
        )
      }
    } catch (err: unknown) {
      // ERREUR RÉSEAU, TIMEOUT OU SERVEUR (5xx)
      // Aucun cache n'est écrit. L'utilisateur peut réassocier un réessai sans restriction.
      setState("error")
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Impossible de vérifier la transaction avec le serveur. Veuillez vérifier votre connexion."
      )
    } finally {
      isVerifyingRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!transactionId) {
      setState("missing_id")
      return
    }

    void verifyTransaction(transactionId)
  }, [transactionId, verifyTransaction])

  return (
    <div className="min-h-screen bg-surface-secondary-bg flex flex-col items-center justify-center p-xl">
      <div className="w-full max-w-[540px] bg-surface-bg border border-border-secondary rounded-corner-xl p-3xl shadow-xl flex flex-col items-center text-center animate-rise">
        <div className="mb-2xl">
          <Wordmark className="h-8 w-auto" />
        </div>

        {/* 1. ÉTAT EN COURS DE VÉRIFICATION */}
        {state === "loading" && (
          <div className="flex flex-col items-center gap-lg py-3xl">
            <Loader2 className="w-12 h-12 text-brand-primary animate-spin" aria-hidden="true" />
            <h1 className="text-heading font-semibold text-text-primary">
              Vérification de votre paiement...
            </h1>
            <p className="text-label-sm text-text-secondary max-w-[36ch]">
              Veuillez patienter pendant que nous confirmons la transaction auprès de notre serveur sécurisé.
            </p>
          </div>
        )}

        {/* 2. ÉTAT SUCCÈS CONFIRMÉ PAR LE BACKEND */}
        {state === "success" && (
          <div className="flex flex-col items-center gap-xl">
            <div className="w-16 h-16 rounded-corner-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <Check className="w-8 h-8" strokeWidth={2.5} aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-xs">
              <h1 className="font-serif text-[32px] font-bold text-text-primary leading-tight">
                Paiement validé avec succès !
              </h1>
              <p className="text-label-sm text-text-secondary max-w-[42ch]">
                Votre transaction a été officiellement confirmée. Vos e-books sont immédiatement disponibles dans votre bibliothèque personnelle.
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
        )}

        {/* 3. ÉTAT TRANSACTION EN ATTENTE (Mobile Money) */}
        {state === "pending" && (
          <div className="flex flex-col items-center gap-xl">
            <div className="w-16 h-16 rounded-corner-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
              <Clock className="w-8 h-8" strokeWidth={2.5} aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-xs">
              <h1 className="font-serif text-[32px] font-bold text-text-primary leading-tight">
                Paiement en attente
              </h1>
              <p className="text-label-sm text-text-secondary max-w-[44ch]">
                Votre transaction Mobile Money est en attente de validation. Veuillez vérifier votre téléphone pour saisir votre code secret et autoriser le prélèvement.
              </p>
            </div>

            <div className="w-full pt-lg border-t border-border-secondary flex flex-col gap-sm">
              {transactionId && (
                <button
                  type="button"
                  onClick={() => verifyTransaction(transactionId, { force: true })}
                  className="w-full py-md px-xl rounded-corner-md bg-brand-primary text-on-brand font-semibold hover:bg-brand-hover transition-colors flex items-center justify-center gap-sm cursor-pointer shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  <span>Actualiser le statut</span>
                </button>
              )}
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

        {/* 4. ÉTAT TRANSACTION REFUSÉE / ANNULÉE */}
        {state === "declined" && (
          <div className="flex flex-col items-center gap-xl">
            <div className="w-16 h-16 rounded-corner-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
              <XCircle className="w-8 h-8" strokeWidth={2.5} aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-xs">
              <h1 className="font-serif text-[32px] font-bold text-text-primary leading-tight">
                Paiement non abouti
              </h1>
              <p className="text-label-sm text-text-secondary max-w-[42ch]">
                {errorMessage || "La transaction a été refusée ou n'a pas pu être finalisée. Aucun débit n'a été effectué."}
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

        {/* 5. ÉTAT ERREUR RÉSEAU OU SERVEUR */}
        {state === "error" && (
          <div className="flex flex-col items-center gap-xl">
            <div className="w-16 h-16 rounded-corner-full bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-8 h-8" strokeWidth={2.5} aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-xs">
              <h1 className="font-serif text-[32px] font-bold text-text-primary leading-tight">
                Vérification impossible
              </h1>
              <p className="text-label-sm text-text-secondary max-w-[42ch]">
                {errorMessage || "Une erreur de communication est survenue lors de la vérification de votre paiement."}
              </p>
            </div>

            <div className="w-full pt-lg border-t border-border-secondary flex flex-col gap-sm">
              {transactionId && (
                <button
                  type="button"
                  onClick={() => verifyTransaction(transactionId, { force: true })}
                  className="w-full py-md px-xl rounded-corner-md bg-brand-primary text-on-brand font-semibold hover:bg-brand-hover transition-colors flex items-center justify-center gap-sm cursor-pointer shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  <span>Réessayer la vérification</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => router.push("/checkout")}
                className="w-full py-md px-xl rounded-corner-md border border-border-primary text-text-secondary font-medium hover:bg-surface-hover hover:text-text-primary transition-colors flex items-center justify-center gap-sm cursor-pointer"
              >
                <span>Retourner au panier</span>
              </button>
            </div>
          </div>
        )}

        {/* 6. ÉTAT IDENTIFIANT DE TRANSACTION MANQUANT */}
        {state === "missing_id" && (
          <div className="flex flex-col items-center gap-xl">
            <div className="w-16 h-16 rounded-corner-full bg-stone-100 text-stone-600 flex items-center justify-center shadow-inner">
              <AlertCircle className="w-8 h-8" strokeWidth={2.5} aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-xs">
              <h1 className="font-serif text-[32px] font-bold text-text-primary leading-tight">
                Référence manquante
              </h1>
              <p className="text-label-sm text-text-secondary max-w-[42ch]">
                Aucun identifiant de transaction n'a été détecté dans votre requête de retour.
              </p>
            </div>

            <div className="w-full pt-lg border-t border-border-secondary flex flex-col gap-sm">
              <button
                type="button"
                onClick={() => router.push("/checkout")}
                className="w-full py-md px-xl rounded-corner-md bg-brand-primary text-on-brand font-semibold hover:bg-brand-hover transition-colors flex items-center justify-center gap-sm cursor-pointer shadow-sm"
              >
                <span>Retourner au panier</span>
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

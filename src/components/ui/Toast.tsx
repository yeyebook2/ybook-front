import { useEffect } from "react"
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react"

export type ToastVariant = "default" | "success" | "error" | "warning"

export type ToastProps = {
  message: string
  variant?: ToastVariant
  onDismiss: () => void
}

export function Toast({ message, variant = "default", onDismiss }: ToastProps) {
  useEffect(() => {
    if (message && typeof message === "string" && message.trim()) {
      console.log("[YéYéBook Toast] Composant Toast AFFICHÉ dans le DOM:", {
        message: message.trim(),
        variant,
        timestamp: new Date().toLocaleTimeString(),
      })
    }
    return () => {
      console.log("[YéYéBook Toast] Composant Toast MASQUÉ/DÉMONTÉ du DOM:", {
        message,
        variant,
      })
    }
  }, [message, variant])

  if (!message || typeof message !== "string" || !message.trim()) {
    console.warn(
      "[YéYéBook Toast] Toast NON affiché car message vide ou invalide:",
      message,
    )
    return null
  }
  const cleanMessage = message.trim()
  const variantStyles = {
    default: {
      bg: "bg-[#fffdf9] border-[#c1b5ac] text-[#100908]",
      icon: <Info className="w-5 h-5 text-[#e04070] shrink-0" aria-hidden="true" />,
    },
    success: {
      bg: "bg-[#edf7ee] border-[#2e8b57]/40 text-[#1b5e20]",
      icon: <CheckCircle2 className="w-5 h-5 text-[#2e8b57] shrink-0" aria-hidden="true" />,
    },
    error: {
      bg: "bg-[#fdf2f2] border-[#c13f4e]/40 text-[#9b1c1c]",
      icon: <AlertCircle className="w-5 h-5 text-[#c13f4e] shrink-0" aria-hidden="true" />,
    },
    warning: {
      bg: "bg-[#fffbeb] border-[#8a5a26]/40 text-[#78350f]",
      icon: <AlertTriangle className="w-5 h-5 text-[#8a5a26] shrink-0" aria-hidden="true" />,
    },
  }

  const current = variantStyles[variant] ?? variantStyles.default

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[9999] sm:w-auto sm:max-w-[440px] sm:min-w-[320px] animate-fade shadow-2xl transition-all"
    >
      <div
        className={`flex items-start gap-md px-xl py-lg rounded-corner-lg border ${current.bg} backdrop-blur-md`}
      >
        {current.icon}
        <p className="text-label-sm font-medium flex-1 pt-0.5 leading-snug">
          {cleanMessage}
        </p>
        <button
          type="button"
          onClick={() => {
            console.log("[YéYéBook Toast] Bouton fermer cliqué par l'utilisateur.")
            onDismiss()
          }}
          aria-label="Fermer la notification"
          className="text-current opacity-70 hover:opacity-100 transition-opacity p-0.5 rounded cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

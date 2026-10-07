import { useEffect, useState } from "react"

import { ApiError } from "@/lib/api-errors"
import { AuthSubmitButton } from "./AuthSubmitButton"
import { FormField } from "./FormField"
import { PasswordField } from "./PasswordField"
import { login } from "../auth.api"
import { hasFieldErrors, validateLogin } from "../auth.validation"
import type { AuthApiResponse, FieldErrors, LoginFormValues } from "../types"

type LoginFormProps = {
  onSuccess: (response: AuthApiResponse) => void
  onError: (message: string) => void
  onForgotPassword: (email: string) => void
}

const initialValues: LoginFormValues = {
  email: "",
  password: "",
}

export function LoginForm({
  onSuccess,
  onError,
  onForgotPassword,
}: LoginFormProps) {
  const [values, setValues] = useState<LoginFormValues>(initialValues)
  const [errors, setErrors] = useState<FieldErrors<LoginFormValues>>({})
  const [loading, setLoading] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0)

  // Gestion du compte à rebours en cas de limitation (429 AUTH_RATE_LIMITED)
  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 1 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownSeconds])

  const updateField = <K extends keyof LoginFormValues,>(
    field: K,
    value: LoginFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (cooldownSeconds > 0) return

    const nextErrors = validateLogin(values)
    setErrors(nextErrors)
    if (hasFieldErrors(nextErrors)) {
      console.warn("[YéYéBook LoginForm] Erreurs de validation formulaire:", nextErrors)
      return
    }

    console.log("[YéYéBook LoginForm] Début soumission formulaire connexion pour:", values.email.trim())
    setLoading(true)
    try {
      const response = await login(values)
      console.log("[YéYéBook LoginForm] Réponse reçue de login():", response)
      if (response.ok) {
        console.log("[YéYéBook LoginForm] Succès, appel de onSuccess avec:", response)
        onSuccess(response)
      } else {
        console.warn("[YéYéBook LoginForm] Échec auth (response.ok === false):", response.message)
        onError(response.message)
      }
    } catch (error) {
      console.error("[YéYéBook LoginForm] Exception interceptée lors du login:", error)
      if (error instanceof ApiError) {
        // Détection de la limitation de tentatives (429 AUTH_RATE_LIMITED)
        if (
          (error.code === "AUTH_RATE_LIMITED" || error.status === 429) &&
          error.retryAfter &&
          error.retryAfter > 0
        ) {
          setCooldownSeconds(error.retryAfter)
        }
        onError(error.message)
      } else {
        onError(
          error instanceof Error
            ? error.message
            : "Impossible de se connecter pour le moment.",
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const formatCooldown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `Réessayez dans ${mins}m ${secs < 10 ? "0" : ""}${secs}s`
    }
    return `Réessayez dans ${secs}s`
  }

  return (
    <form className="flex flex-col gap-xl" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-lg">
        <FormField
          id="auth-login-email"
          name="email"
          label="Adresse e-mail"
          type="email"
          placeholder="vous@exemple.com"
          value={values.email}
          onChange={(event) => updateField("email", event.target.value)}
          error={errors.email}
          autoComplete="email"
          inputMode="email"
        />
        <PasswordField
          id="auth-login-password"
          label="Mot de passe"
          value={values.password}
          onChange={(value) => updateField("password", value)}
          error={errors.password}
          autoComplete="current-password"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onForgotPassword(values.email)}
          className="cursor-pointer text-video-title font-semibold text-brand-primary underline decoration-brand-primary/30 underline-offset-4 transition-colors hover:text-brand-hover"
        >
          Mot de passe oublié ?
        </button>
      </div>

      <AuthSubmitButton loading={loading} disabled={cooldownSeconds > 0}>
        {cooldownSeconds > 0 ? formatCooldown(cooldownSeconds) : "Se connecter"}
      </AuthSubmitButton>
    </form>
  )
}

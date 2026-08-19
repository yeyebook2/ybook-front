import { useState } from "react"

import { AuthSubmitButton } from "./AuthSubmitButton"
import { FormField } from "./FormField"
import { PasswordField } from "./PasswordField"
import { login } from "../auth.api"
import { hasFieldErrors, validateLogin } from "../auth.validation"
import type { AuthApiResponse, FieldErrors, LoginFormValues } from "../types"

type LoginFormProps = {
  onSuccess: (response: AuthApiResponse) => void
  onError: (message: string) => void
  onForgotPassword: () => void
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

  const updateField = <K extends keyof LoginFormValues,>(
    field: K,
    value: LoginFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateLogin(values)
    setErrors(nextErrors)
    if (hasFieldErrors(nextErrors)) return

    setLoading(true)
    try {
      const response = await login(values)
      if (response.ok) {
        onSuccess(response)
      } else {
        onError(response.message)
      }
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "Impossible de se connecter pour le moment.",
      )
    } finally {
      setLoading(false)
    }
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
          onClick={onForgotPassword}
          className="cursor-pointer text-video-title font-semibold text-brand-primary underline decoration-brand-primary/30 underline-offset-4 transition-colors hover:text-brand-hover"
        >
          Mot de passe oublié ?
        </button>
      </div>

      <AuthSubmitButton loading={loading}>Se connecter</AuthSubmitButton>
    </form>
  )
}

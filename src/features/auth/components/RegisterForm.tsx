import { useState } from "react"

import { AuthSubmitButton } from "./AuthSubmitButton"
import { FormField } from "./FormField"
import { PasswordField } from "./PasswordField"
import { register } from "../auth.api"
import { hasFieldErrors, validateRegister } from "../auth.validation"
import type { AuthApiResponse, FieldErrors, RegisterFormValues } from "../types"

type RegisterFormProps = {
  onSuccess: (response: AuthApiResponse) => void
  onError: (message: string) => void
}

const initialValues: RegisterFormValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
}

export function RegisterForm({ onSuccess, onError }: RegisterFormProps) {
  const [values, setValues] = useState<RegisterFormValues>(initialValues)
  const [errors, setErrors] = useState<FieldErrors<RegisterFormValues>>({})
  const [loading, setLoading] = useState(false)

  const updateField = <K extends keyof RegisterFormValues,>(
    field: K,
    value: RegisterFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateRegister(values)
    setErrors(nextErrors)
    if (hasFieldErrors(nextErrors)) return

    setLoading(true)
    try {
      const response = await register(values)
      if (response.ok) {
        onSuccess(response)
      } else {
        onError(response.message)
      }
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "Impossible de créer votre compte pour le moment.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="flex flex-col gap-xl" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-lg">
        <FormField
          id="auth-register-name"
          name="name"
          label="Nom complet"
          type="text"
          placeholder="Aminata Diallo"
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
          error={errors.name}
          autoComplete="name"
        />
        <FormField
          id="auth-register-email"
          name="email"
          label="Adresse e-mail"
          type="email"
          placeholder="vous@exemple.com"
          value={values.email}
          onChange={(event) => updateField("email", event.target.value)}
          error={errors.email}
          hint="Elle sera utilisée pour retrouver votre compte."
          autoComplete="email"
          inputMode="email"
        />
        <PasswordField
          id="auth-register-password"
          label="Mot de passe"
          value={values.password}
          onChange={(value) => updateField("password", value)}
          error={errors.password}
          hint="Au moins 6 caractères pour commencer."
          autoComplete="new-password"
        />
        <PasswordField
          id="auth-register-confirm-password"
          label="Confirmer le mot de passe"
          value={values.confirmPassword}
          onChange={(value) => updateField("confirmPassword", value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
      </div>

      <AuthSubmitButton loading={loading}>Créer mon compte</AuthSubmitButton>
    </form>
  )
}

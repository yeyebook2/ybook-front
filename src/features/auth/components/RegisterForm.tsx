import { useState } from "react"

import { AuthSubmitButton } from "./AuthSubmitButton"
import { ConsentField } from "./ConsentField"
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
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
  acceptPrivacy: false,
  acceptMarketing: false,
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
      <div className="grid gap-lg sm:grid-cols-2">
        <FormField
          id="auth-register-first-name"
          name="firstName"
          label="Prénom"
          type="text"
          placeholder="Aminata"
          value={values.firstName}
          onChange={(event) => updateField("firstName", event.target.value)}
          error={errors.firstName}
          autoComplete="given-name"
        />
        <FormField
          id="auth-register-last-name"
          name="lastName"
          label="Nom"
          type="text"
          placeholder="Diallo"
          value={values.lastName}
          onChange={(event) => updateField("lastName", event.target.value)}
          error={errors.lastName}
          autoComplete="family-name"
        />
      </div>

      <div className="flex flex-col gap-lg">
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
        <FormField
          id="auth-register-phone"
          name="phone"
          label="Téléphone"
          type="tel"
          placeholder="+228 90 00 00 00"
          value={values.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          error={errors.phone}
          hint="Utilisé pour les services Mobile Money de la plateforme."
          autoComplete="tel"
          inputMode="tel"
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

      <div className="flex flex-col gap-md rounded-corner-md border border-border-secondary bg-surface-secondary-bg p-lg">
        <ConsentField
          id="auth-register-terms"
          checked={values.acceptTerms}
          onChange={(checked) => updateField("acceptTerms", checked)}
          error={errors.acceptTerms}
        >
          J’accepte les conditions d’utilisation de YéYéBook.
        </ConsentField>
        <ConsentField
          id="auth-register-privacy"
          checked={values.acceptPrivacy}
          onChange={(checked) => updateField("acceptPrivacy", checked)}
          error={errors.acceptPrivacy}
        >
          J’ai lu et j’accepte la politique de confidentialité.
        </ConsentField>
        <ConsentField
          id="auth-register-marketing"
          checked={values.acceptMarketing}
          onChange={(checked) => updateField("acceptMarketing", checked)}
        >
          Je souhaite recevoir les nouveautés et communications de YéYéBook.
        </ConsentField>
      </div>

      <AuthSubmitButton loading={loading}>Créer mon compte</AuthSubmitButton>
    </form>
  )
}

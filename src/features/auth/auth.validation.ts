import type { FieldErrors, LoginFormValues, RegisterFormValues } from "./types"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLogin(
  values: LoginFormValues,
): FieldErrors<LoginFormValues> {
  const errors: FieldErrors<LoginFormValues> = {}

  if (!values.email.trim()) {
    errors.email = "Votre adresse e-mail est requise."
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Saisissez une adresse e-mail valide."
  }

  if (!values.password) {
    errors.password = "Votre mot de passe est requis."
  } else if (values.password.length < 6) {
    errors.password = "Le mot de passe doit contenir au moins 6 caractères."
  }

  return errors
}

export function validateRegister(
  values: RegisterFormValues,
): FieldErrors<RegisterFormValues> {
  const errors: FieldErrors<RegisterFormValues> = {}

  if (!values.name.trim()) {
    errors.name = "Votre nom est requis."
  } else if (values.name.trim().length < 2) {
    errors.name = "Votre nom doit contenir au moins 2 caractères."
  }

  if (!values.email.trim()) {
    errors.email = "Votre adresse e-mail est requise."
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Saisissez une adresse e-mail valide."
  }

  if (!values.password) {
    errors.password = "Choisissez un mot de passe."
  } else if (values.password.length < 6) {
    errors.password = "Le mot de passe doit contenir au moins 6 caractères."
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirmez votre mot de passe."
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Les mots de passe ne correspondent pas."
  }

  return errors
}

export function hasFieldErrors<T>(errors: FieldErrors<T>) {
  return Object.keys(errors).length > 0
}

export type LoginFormValues = {
  email: string
  password: string
}

export type RegisterFormValues = {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
  acceptPrivacy: boolean
  acceptMarketing: boolean
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>

export type AuthUser = {
  id: string
  name: string
  email: string
  role?: "user" | "author" | "moderator" | "admin" | "super_admin"
}

export type AuthApiResponse = {
  ok: boolean
  mode: "preview" | "api"
  message: string
  user?: AuthUser
}

export type AuthAction = "login" | "register"

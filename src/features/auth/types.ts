export type LoginFormValues = {
  email: string
  password: string
}

export type RegisterFormValues = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>

export type AuthUser = {
  id: string
  name: string
  email: string
}

export type AuthApiResponse = {
  ok: boolean
  mode: "preview" | "api"
  message: string
  user?: AuthUser
}

export type AuthAction = "login" | "register"

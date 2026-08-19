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

export type AuthApiResponse = {
  ok: boolean
  mode: "preview" | "api"
  message: string
  user?: {
    id: string
    name: string
    email: string
  }
}

export type AuthAction = "login" | "register"

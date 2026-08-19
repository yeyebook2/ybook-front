import type { ButtonHTMLAttributes, ReactNode } from "react"

import { LoaderCircle } from "lucide-react"

type AuthSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  loading?: boolean
}

export function AuthSubmitButton({
  children,
  loading = false,
  disabled,
  ...props
}: AuthSubmitButtonProps) {
  return (
    <button
      {...props}
      type="submit"
      disabled={disabled || loading}
      className="inline-flex min-h-[50px] w-full cursor-pointer items-center justify-center gap-sm rounded-corner-md bg-brand-primary px-2xl py-lg text-label-sm font-semibold text-on-brand shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    >
      {loading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      {loading ? "Préparation…" : children}
    </button>
  )
}

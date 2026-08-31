import type { InputHTMLAttributes, ReactNode } from "react"

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
  suffix?: ReactNode
  children?: ReactNode
}

export function FormField({
  label,
  error,
  hint,
  suffix,
  id,
  children,
  className = "",
  ...inputProps
}: FormFieldProps) {
  const descriptionId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined

  return (
    <div className="flex flex-col gap-sm">
      <label
        htmlFor={id}
        className="text-label-sm font-semibold text-text-primary"
      >
        {label}
      </label>
      <div
        className={`relative flex min-h-[48px] items-center rounded-corner-md border bg-surface-bg transition-colors focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15 ${
          error ? "border-danger" : "border-border-primary"
        }`}
      >
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`min-w-0 flex-1 bg-transparent px-lg py-md text-label text-text-primary outline-none placeholder:text-text-tertiary ${
            suffix ? "pr-[56px]" : ""
          } ${className}`}
          {...inputProps}
        />
        {suffix ? (
          <div className="absolute right-lg top-[23px] -translate-y-1/2">
            {suffix}
          </div>
        ) : null}
        {children}
      </div>
      {hint ? (
        <p
          id={descriptionId}
          className="text-video-title leading-relaxed text-text-tertiary"
        >
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-xs text-video-title font-medium leading-relaxed text-danger"
        >
          <span aria-hidden="true">•</span>
          {error}
        </p>
      ) : null}
    </div>
  )
}
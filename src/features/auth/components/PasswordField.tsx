import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"

import { FormField } from "./FormField"

type PasswordFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  autoComplete?: string
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  autoComplete,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <FormField
      id={id}
      type={visible ? "text" : "password"}
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={error}
      hint={hint}
      autoComplete={autoComplete}
      suffix={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={
            visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-corner-full text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      }
    />
  )
}

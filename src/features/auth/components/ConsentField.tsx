type ConsentFieldProps = {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  children: React.ReactNode
  error?: string
}

export function ConsentField({
  id,
  checked,
  onChange,
  children,
  error,
}: ConsentFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-xs">
      <label className="flex cursor-pointer items-start gap-sm text-video-title leading-relaxed text-text-secondary">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand-primary"
        />
        <span>{children}</span>
      </label>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="pl-6 text-video-title text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

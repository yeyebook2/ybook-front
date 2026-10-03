import { Search, X } from "lucide-react"

export type SearchInputProps = {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onSearch?: () => void
  className?: string
  autoFocus?: boolean
}

export function SearchInput({
  placeholder = "Rechercher un titre, un auteur…",
  value,
  onChange,
  onSearch,
  className = "",
  autoFocus = false,
}: SearchInputProps) {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search
        className="absolute left-3.5 w-4 h-4 text-text-tertiary pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            onSearch?.()
          }
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="flex-1 min-w-0 w-full h-10 pl-10 pr-10 rounded-corner-full bg-surface-secondary-bg border border-border-secondary text-label-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => {
            onChange("")
            onSearch?.()
          }}
          aria-label="Effacer la recherche"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center p-1 text-text-tertiary hover:text-text-primary rounded-full cursor-pointer transition-colors"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

const ybookSymbol = "/brand/ybook-symbol-primary.png"

type WordmarkProps = {
  className?: string
  tone?: "dark" | "light"
}

export function Wordmark({
  className = "h-8 w-auto",
  tone = "dark",
}: WordmarkProps) {
  const bookColor = tone === "light" ? "text-white" : "text-brand-dark"

  return (
    <span className="inline-flex items-center gap-sm" aria-label="YéYéBook">
      <img src={ybookSymbol} alt="" aria-hidden="true" className={className} />
      <span className="font-serif text-heading font-bold tracking-tight leading-none">
        <span className="text-brand-primary">YeYe</span>
        <span className={bookColor}>Book</span>
      </span>
    </span>
  )
}

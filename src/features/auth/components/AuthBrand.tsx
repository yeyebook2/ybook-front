import ybookSymbol from "@/imports/ybook-symbol-primary-1024px.png"

type AuthBrandProps = {
  eyebrow: string
}

export function AuthBrand({ eyebrow }: AuthBrandProps) {
  return (
    <div className="flex flex-col items-center gap-lg text-center">
      <img
        src={ybookSymbol}
        alt=""
        aria-hidden="true"
        className="h-14 w-14 object-contain"
      />
      <div className="flex flex-col gap-xs">
        <span className="font-serif text-[27px] font-bold tracking-[-0.04em] leading-none">
          <span className="text-brand-primary">YeYe</span>
          <span className="text-brand-dark">Book</span>
        </span>
        <span className="text-video-title font-semibold uppercase tracking-[0.22em] text-brand-muted">
          {eyebrow}
        </span>
      </div>
    </div>
  )
}

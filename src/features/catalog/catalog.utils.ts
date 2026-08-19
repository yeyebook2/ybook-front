import type { SyntheticEvent } from "react"

import { FALLBACK_COVER } from "./catalog.constants"

export const formatPrice = (price: number) =>
  `${price.toLocaleString("fr-FR")} FCFA`

export function handleCoverError(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget
  if (img.src !== FALLBACK_COVER) img.src = FALLBACK_COVER
}

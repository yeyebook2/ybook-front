import type { SyntheticEvent } from "react"

export const formatPrice = (price: number) =>
  `${price.toLocaleString("fr-FR")} FCFA`

export function handleCoverError(e: SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.hidden = true
}
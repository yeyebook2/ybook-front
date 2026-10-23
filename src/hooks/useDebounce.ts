import { useEffect, useState } from "react"

/**
 * Hook personnalisé pour temporiser (debounce) une valeur changeant fréquemment (ex: saisie de recherche).
 * Empêche le flood de requêtes réseau et les conditions de concurrence (race conditions).
 *
 * @param value La valeur à temporiser
 * @param delayMs Délai en millisecondes (défaut: 350ms)
 */
export function useDebounce<T>(value: T, delayMs: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delayMs])

  return debouncedValue
}

/**
 * Fonction utilitaire debounce pure pour les gestionnaires d'événements hors cycle de vie React.
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delayMs: number = 350,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
    }, delayMs)
  }
}

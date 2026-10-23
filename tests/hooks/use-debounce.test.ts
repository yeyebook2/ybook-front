import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { debounce } from "@/hooks/useDebounce"

describe("HOOKS & UTILITAIRES : Debounce & Protection Anti-Saturation Réseau (FNC-02)", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("DEBOUNCE-01 : N'exécute pas la fonction immédiatement", () => {
    const callback = vi.fn()
    const debouncedFn = debounce(callback, 350)

    debouncedFn("test")
    expect(callback).not.toHaveBeenCalled()
  })

  it("DEBOUNCE-02 : Exécute la fonction après écoulement du délai", () => {
    const callback = vi.fn()
    const debouncedFn = debounce(callback, 350)

    debouncedFn("recherche")
    vi.advanceTimersByTime(349)
    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith("recherche")
  })

  it("DEBOUNCE-03 : Annule les appels précédents si un nouvel appel survient avant la fin du délai", () => {
    const callback = vi.fn()
    const debouncedFn = debounce(callback, 350)

    debouncedFn("a")
    vi.advanceTimersByTime(100)
    debouncedFn("ab")
    vi.advanceTimersByTime(100)
    debouncedFn("abc")
    vi.advanceTimersByTime(349)

    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith("abc")
  })

  it("DEBOUNCE-04 : Supporte plusieurs cycles successifs", () => {
    const callback = vi.fn()
    const debouncedFn = debounce(callback, 350)

    // Premier cycle
    debouncedFn("premier")
    vi.advanceTimersByTime(350)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith("premier")

    // Deuxième cycle
    debouncedFn("deuxième")
    vi.advanceTimersByTime(350)
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenCalledWith("deuxième")
  })
})

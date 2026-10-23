import { describe, it, expect } from "vitest"

describe("MÉTIER : Progression de Lecture et États de Bibliothèque", () => {
  function getLibraryCardState(book: {
    reading_status?: string | null
    progress_percent?: number | null
  }) {
    const readingStatus = book.reading_status
    const progressPct =
      book.progress_percent !== undefined && book.progress_percent !== null
        ? Number(book.progress_percent)
        : undefined

    const completed =
      readingStatus === "finished" ||
      (progressPct !== undefined && progressPct >= 100)

    const started =
      readingStatus === "reading" ||
      (!completed && progressPct !== undefined && progressPct > 0)

    const pct =
      progressPct !== undefined
        ? Math.min(100, Math.max(0, Math.round(progressPct)))
        : 0

    const buttonLabel = completed
      ? "Relire"
      : started
        ? "Continuer la lecture"
        : "Commencer la lecture"

    const badgeLabel = completed ? "Terminé" : started ? `Lu à ${pct} %` : null

    return { completed, started, pct, buttonLabel, badgeLabel }
  }

  it("READ-01 : Carte avec reading_status='reading' et 14% affiche 'Continuer la lecture' et 'Lu à 14 %'", () => {
    const state = getLibraryCardState({
      reading_status: "reading",
      progress_percent: 14,
    })

    expect(state.started).toBe(true)
    expect(state.completed).toBe(false)
    expect(state.pct).toBe(14)
    expect(state.buttonLabel).toBe("Continuer la lecture")
    expect(state.badgeLabel).toBe("Lu à 14 %")
  })

  it("READ-02 : Carte avec reading_status='finished' affiche 'Relire' et 'Terminé'", () => {
    const state = getLibraryCardState({
      reading_status: "finished",
      progress_percent: 100,
    })

    expect(state.completed).toBe(true)
    expect(state.buttonLabel).toBe("Relire")
    expect(state.badgeLabel).toBe("Terminé")
  })

  it("READ-03 : Carte sans lecture commencée affiche 'Commencer la lecture'", () => {
    const state = getLibraryCardState({
      reading_status: "not_started",
      progress_percent: 0,
    })

    expect(state.started).toBe(false)
    expect(state.completed).toBe(false)
    expect(state.buttonLabel).toBe("Commencer la lecture")
    expect(state.badgeLabel).toBeNull()
  })

  it("READ-04 : Protection Anti-Écrasement (The Ice-Maiden Bug) — ne jamais envoyer 0% tant que locations.generate n'est pas prêt", () => {
    // Simulation de la machine d'état du lecteur
    let locationsReady = false
    let isInitialRelocate = true
    let currentSavedPercent = 99
    let recordedSaves: number[] = []

    function handleRelocated(newPercentCalculated: number) {
      if (locationsReady) {
        if (isInitialRelocate) {
          isInitialRelocate = false
        } else {
          currentSavedPercent = newPercentCalculated
          recordedSaves.push(newPercentCalculated)
        }
      } else {
        // En attente de locations.generate() : ignorer ce relocate initial et préserver la valeur existante
        isInitialRelocate = false
      }
    }

    // 1. Premier relocate déclenché par le chargement initial avant que locations ne soit prêt
    handleRelocated(0)
    expect(recordedSaves).toHaveLength(0) // Aucun envoi vers le backend !
    expect(currentSavedPercent).toBe(99) // La progression reste intacte à 99%

    // 2. locations.generate() se termine
    locationsReady = true

    // 3. L'utilisateur tourne réellement la page
    handleRelocated(100)
    expect(recordedSaves).toEqual([100])
    expect(currentSavedPercent).toBe(100)
  })

  it("READ-05 : Clamping du pourcentage entre 0 et 100", () => {
    const clamp = (val: number) => Math.min(100, Math.max(0, Math.round(val)))
    expect(clamp(-5)).toBe(0)
    expect(clamp(0)).toBe(0)
    expect(clamp(45.7)).toBe(46)
    expect(clamp(100)).toBe(100)
    expect(clamp(105)).toBe(100)
  })
})

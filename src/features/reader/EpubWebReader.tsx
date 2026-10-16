"use client"

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react"
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  List,
  X,
  Loader2,
  AlertCircle,
  ShieldAlert,
  FileQuestion,
  Lock,
} from "lucide-react"
import { Button } from "@figma/astraui"
import { getPublicApiBaseUrl } from "@/lib/runtime-env"
import { createApiHeaders } from "@/lib/api-headers"
import type { Book } from "@/features/catalog/types"
import type { AuthUser } from "@/features/auth/types"
import {
  getBookReadingProgress,
  saveBookReadingProgress,
} from "@/features/dashboard/dashboard.api"

const API_BASE_URL = getPublicApiBaseUrl()

export type ReaderTheme = "light" | "sepia" | "dark"

interface TocItem {
  id: string
  label: string
  href: string
  subitems?: TocItem[]
}

interface EpubWebReaderProps {
  book: Book
  currentUser: AuthUser | null
  onClose: () => void
  onToast?: (message: string, variant?: "default" | "success" | "warning" | "error") => void
}

export function EpubWebReader({
  book,
  currentUser,
  onClose,
  onToast,
}: EpubWebReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const bookInstanceRef = useRef<any>(null)
  const renditionRef = useRef<any>(null)

  const [loading, setLoading] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState("Connexion au livre numérique...")
  const [errorType, setErrorType] = useState<"BOOK_NOT_OWNED" | "EPUB_NOT_AVAILABLE" | "GENERIC" | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Lecture & navigation
  const [toc, setToc] = useState<TocItem[]>([])
  const [currentChapterTitle, setCurrentChapterTitle] = useState("")
  const [progressPercent, setProgressPercent] = useState<number>(0)
  const [chapterListOpen, setChapterListOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Préférences lecteur
  const [theme, setTheme] = useState<ReaderTheme>("light")
  const [fontSize, setFontSize] = useState<number>(20)
  const [lineHeight, setLineHeight] = useState<number>(1.75)

  // Throttling de la sauvegarde de progression
  const lastSavedRef = useRef<{ cfi: string; time: number }>({ cfi: "", time: 0 })

  const themeColors = {
    light: {
      bg: "#fff6eb",
      text: "#100908",
      sub: "#6b615c",
      border: "#c1b5ac40",
      panel: "#fffdf9",
    },
    sepia: {
      bg: "#f6ecd6",
      text: "#432d16",
      sub: "#8a7048",
      border: "#432d1622",
      panel: "#efe2c6",
    },
    dark: {
      bg: "#171015",
      text: "#ece2e6",
      sub: "#9a8890",
      border: "#ffffff1a",
      panel: "#241820",
    },
  }[theme]

  // Envoi throttlé de la progression
  const throttledSaveProgress = useCallback(
    (cfi: string, percent: number) => {
      const now = Date.now()
      // Enregistrement au plus toutes les 3 secondes si le CFI change
      if (lastSavedRef.current.cfi !== cfi && now - lastSavedRef.current.time > 3000) {
        lastSavedRef.current = { cfi, time: now }
        void saveBookReadingProgress(book.id, { cfi, percent })
      }
    },
    [book.id],
  )

  const [retryTrigger, setRetryTrigger] = useState(0)

  useEffect(() => {
    let isMounted = true
    let renditionInstance: any = null
    let bookInstance: any = null

    function parseEpubError(err: any): {
      type: "BOOK_NOT_OWNED" | "EPUB_NOT_AVAILABLE" | "GENERIC"
      message: string
    } {
      const status =
        err?.status ||
        (err?.response && typeof err.response === "object" && err.response.status) ||
        (typeof err?.message === "string" && err.message.includes("403") ? 403 : undefined) ||
        (typeof err?.message === "string" && err.message.includes("404") ? 404 : undefined)

      const rawMsg = String(err?.message || err?.response || "")
      const is403 =
        status === 403 ||
        rawMsg.includes("403") ||
        rawMsg.includes("BOOK_NOT_OWNED") ||
        rawMsg.toLowerCase().includes("forbidden")

      const is404 =
        status === 404 ||
        rawMsg.includes("404") ||
        rawMsg.includes("EPUB_NOT_AVAILABLE") ||
        rawMsg.toLowerCase().includes("not found")

      const isTimeout =
        err?.isTimeout ||
        rawMsg.includes("STREAM_TIMEOUT") ||
        rawMsg.includes("TIMEOUT")

      if (is403) {
        return {
          type: "BOOK_NOT_OWNED",
          message: "Vous ne possédez pas ce livre dans votre bibliothèque.",
        }
      }

      if (is404) {
        return {
          type: "EPUB_NOT_AVAILABLE",
          message: "Le fichier ePub de ce titre est en cours de préparation ou non disponible.",
        }
      }

      if (isTimeout) {
        return {
          type: "GENERIC",
          message: "Délai d'attente dépassé lors de la connexion au livre numérique. Veuillez réessayer.",
        }
      }

      return {
        type: "GENERIC",
        message: err?.message || "Impossible de charger le fichier ePub. Veuillez vérifier votre connexion.",
      }
    }

    async function initEpub() {
      setLoading(true)
      setErrorType(null)
      setErrorMessage(null)

      try {
        setLoadingStatus("Initialisation du lecteur ePub...")
        const epubModule = await import("epubjs")
        const ePub = (epubModule as any).default || epubModule

        // 1. Récupérer la dernière progression sauvegardée
        let savedCfi: string | undefined
        try {
          const progressRes = await getBookReadingProgress(book.id)
          if (progressRes.cfi) {
            savedCfi = progressRes.cfi
          }
          if (progressRes.percent !== undefined) {
            setProgressPercent(progressRes.percent)
          }
        } catch {}

        // 2. Tenter la lecture chapitre par chapitre via /files/
        setLoadingStatus("Connexion aux chapitres du livre...")
        const filesUrl = `${API_BASE_URL}/api/v1/library/${book.id}/files/`
        let loadedViaStream = false

        // Obtenir le request par défaut d'epubjs pour envelopper tous les appels
        const dummyInstance = (ePub as any)()
        const defaultEpubRequest = dummyInstance.request
        try {
          dummyInstance.destroy()
        } catch {}

        const cssCache = new Map<string, string>()
        async function fetchAndCacheCss(cssUrl: string): Promise<string> {
          if (cssCache.has(cssUrl)) return cssCache.get(cssUrl)!
          try {
            let targetUrl = cssUrl
            if (targetUrl.includes("ngrok-free.dev") && !targetUrl.includes("ngrok-skip-browser-warning")) {
              targetUrl += (targetUrl.includes("?") ? "&" : "?") + "ngrok-skip-browser-warning=true"
            }
            const res = await fetch(targetUrl, {
              credentials: "include",
              headers: createApiHeaders(),
            })
            if (res.ok) {
              const text = await res.text()
              if (!text.trim().startsWith("<!DOCTYPE html>") && !text.trim().startsWith("<html")) {
                cssCache.set(cssUrl, text)
                return text
              }
            }
          } catch {}
          return ""
        }

        const customEpubRequest = (
          url: string,
          type?: any,
          _withCredentials?: boolean,
          headers?: Record<string, string>,
        ) => {
          // Intercepter com.apple.ibooks.display-options.xml pour éviter 404 & Erreur d'analyse XML dans la console
          if (url.includes("com.apple.ibooks.display-options.xml")) {
            const parser = new DOMParser()
            const emptyXml = parser.parseFromString(
              '<?xml version="1.0" encoding="UTF-8"?><display_options/>',
              "application/xml",
            )
            return Promise.resolve(emptyXml)
          }

          let targetUrl = url
          if (targetUrl.includes("ngrok-free.dev") && !targetUrl.includes("ngrok-skip-browser-warning")) {
            targetUrl += (targetUrl.includes("?") ? "&" : "?") + "ngrok-skip-browser-warning=true"
          }
          const mergedHeaders: Record<string, string> = {
            ...(headers || {}),
            "ngrok-skip-browser-warning": "true",
          }
          return defaultEpubRequest(targetUrl, type, true, mergedHeaders)
        }

        // Options requises pour epub.js : credentials + header ngrok pour contourner l'interstitiel
        const epubStreamOptions = {
          requestMethod: customEpubRequest,
          requestCredentials: true,
          requestHeaders: {
            "ngrok-skip-browser-warning": "true",
          },
        }

        try {
          bookInstance = ePub(filesUrl, epubStreamOptions)
          // Forcer également sur l'instance au cas où epubjs redéfinit bookInstance.request
          bookInstance.request = customEpubRequest

          // Attacher un catch direct sur ready pour éviter toute unhandled rejection
          bookInstance.ready.catch((e: any) => {
            console.warn("[EpubWebReader] bookInstance.ready streaming catch:", e)
          })

          let timeoutId: NodeJS.Timeout
          const streamTimeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
              const err: any = new Error("STREAM_TIMEOUT")
              err.isTimeout = true
              reject(err)
            }, 8000)
          })

          await Promise.race([bookInstance.ready, streamTimeoutPromise]).finally(() => {
            clearTimeout(timeoutId)
          })

          loadedViaStream = true
        } catch (streamErr: any) {
          console.warn("[EpubWebReader] Échec du streaming direct:", streamErr)
          const parsed = parseEpubError(streamErr)

          // Si c'est 403 ou 404, on s'arrête immédiatement sans fallback inutile
          if (parsed.type === "BOOK_NOT_OWNED" || parsed.type === "EPUB_NOT_AVAILABLE") {
            if (isMounted) {
              setErrorType(parsed.type)
              setErrorMessage(parsed.message)
              setLoading(false)
            }
            return
          }

          if (bookInstance) {
            try {
              bookInstance.destroy()
            } catch {}
            bookInstance = null
          }
          loadedViaStream = false
        }

        // 3. Fallback : téléchargement du conteneur ePub binaire complet
        if (!loadedViaStream) {
          setLoadingStatus("Téléchargement sécurisé de l'e-book...")
          const epubUrl = `${API_BASE_URL}/api/v1/library/${book.id}/epub`

          const controller = new AbortController()
          const fetchTimeout = setTimeout(() => controller.abort(), 12000)

          let response: Response
          try {
            response = await fetch(epubUrl, {
              credentials: "include",
              headers: createApiHeaders(),
              signal: controller.signal,
            })
          } catch (fetchErr: any) {
            clearTimeout(fetchTimeout)
            if (fetchErr?.name === "AbortError") {
              const err: any = new Error("TIMEOUT")
              err.isTimeout = true
              throw err
            }
            throw fetchErr
          }
          clearTimeout(fetchTimeout)

          if (!response.ok) {
            if (response.status === 403) {
              if (isMounted) {
                setErrorType("BOOK_NOT_OWNED")
                setErrorMessage("Vous ne possédez pas ce livre dans votre bibliothèque.")
                setLoading(false)
              }
              return
            }
            if (response.status === 404) {
              if (isMounted) {
                setErrorType("EPUB_NOT_AVAILABLE")
                setErrorMessage("Le fichier ePub de ce titre est en cours de préparation ou non disponible.")
                setLoading(false)
              }
              return
            }
            throw new Error(`Erreur serveur (${response.status})`)
          }

          const arrayBuffer = await response.arrayBuffer()
          bookInstance = ePub(arrayBuffer)
          bookInstance.ready.catch((e: any) => {
            console.warn("[EpubWebReader] fallback ready catch:", e)
          })

          let parseTimeoutId: NodeJS.Timeout
          const parseTimeoutPromise = new Promise((_, reject) => {
            parseTimeoutId = setTimeout(() => {
              const err: any = new Error("Délai de traitement du fichier ePub dépassé.")
              err.isTimeout = true
              reject(err)
            }, 10000)
          })

          await Promise.race([bookInstance.ready, parseTimeoutPromise]).finally(() => {
            clearTimeout(parseTimeoutId)
          })
        }

        if (!isMounted) return

        // Attendre que le conteneur DOM soit disponible
        if (!viewerRef.current) {
          await new Promise((r) => setTimeout(r, 60))
        }
        if (!viewerRef.current || !isMounted) return

        bookInstanceRef.current = bookInstance

        // 4. Extraction de la table des matières (TOC)
        try {
          const nav = await bookInstance.loaded.navigation
          if (nav && nav.toc) {
            setToc(nav.toc)
          }
        } catch (navErr) {
          console.warn("[EpubWebReader] Erreur extraction TOC:", navErr)
        }

        // 5. Rendu du livre dans le conteneur DOM
        // Pré-injection de la balise <base> et inlining des styles dans le HTML sérialisé
        // pour que le navigateur n'effectue aucun appel relatif vers l'origine Next.js (/reader/...)
        // et n'effectue aucun prefetch sauvage (rel="next|prev") bloqué par ORB
        if (bookInstance.spine && bookInstance.spine.hooks && bookInstance.spine.hooks.serialize) {
          bookInstance.spine.hooks.serialize.register(async (output: string, section: any) => {
            let modified = output || ""
            const sectionUrl = section?.url || ""
            const baseUrl = sectionUrl.substring(0, sectionUrl.lastIndexOf("/") + 1)

            // 1. Supprimer <link rel="next"> et <link rel="prev"> pour empêcher le prefetch ORB sauvage du navigateur
            modified = modified.replace(/<link[^>]+rel=["\x27](next|prev)["\x27][^>]*\/?>/gi, "")

            // 2. Extraire et inliner les feuilles de style CSS
            const linkMatches = Array.from(modified.matchAll(/<link[^>]+rel=["\x27]stylesheet["\x27][^>]*\/?>/gi))
            for (const match of linkMatches) {
              const fullTag = match[0]
              const hrefMatch = fullTag.match(/href=["\x27]([^"\x27]+)["\x27]/i)
              if (hrefMatch && hrefMatch[1]) {
                const href = hrefMatch[1]
                if (!href.startsWith("data:") && !href.startsWith("blob:")) {
                  const fullCssUrl = href.startsWith("http") ? href : `${baseUrl}${href}`
                  const cssContent = await fetchAndCacheCss(fullCssUrl)
                  if (cssContent) {
                    modified = modified.replace(fullTag, `<style data-inlined="${href}">${cssContent}</style>`)
                  } else {
                    // Supprimer le lien externe non résolu pour éviter l'erreur MIME text/html sur Vercel
                    modified = modified.replace(fullTag, "")
                  }
                }
              }
            }

            // 3. Réécrire les balises <img> relatives avec l'URL absolue + bypass ngrok
            modified = modified.replace(/<img([^>]+)src=["\x27]([^"\x27]+)["\x27]([^>]*)>/gi, (match, p1, src, p2) => {
              if (!src.startsWith("http") && !src.startsWith("data:") && !src.startsWith("blob:") && baseUrl) {
                const fullImgUrl = `${baseUrl}${src}${baseUrl.includes("ngrok-free.dev") ? (baseUrl.includes("?") ? "&" : "?") + "ngrok-skip-browser-warning=true" : ""}`
                return `<img${p1}src="${fullImgUrl}"${p2}>`
              }
              return match
            })

            // 4. Injecter <base href="..."> au tout début de <head> si absent
            if (baseUrl && !modified.includes("<base ")) {
              const baseTag = `<base href="${baseUrl}"/>`
              if (modified.includes("<head>")) {
                modified = modified.replace("<head>", `<head>${baseTag}`)
              } else if (modified.includes("<head ")) {
                modified = modified.replace(/<head[^>]*>/, `$&${baseTag}`)
              }
            }

            section.output = modified
            return modified
          })
        }

        viewerRef.current.innerHTML = ""
        renditionInstance = bookInstance.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          spread: "none",
          flow: "paginated",
        })
        renditionRef.current = renditionInstance

        // 6. Sécurité & Protections anti-copie à l'intérieur du conteneur
        renditionInstance.hooks.content.register(async (contents: any) => {
          const doc = contents?.document
          if (!doc) return

          // Bloquer le clic droit
          doc.addEventListener("contextmenu", (e: MouseEvent) => e.preventDefault())

          // Bloquer la sélection de texte
          if (doc.body) {
            doc.body.style.userSelect = "none"
            doc.body.style.webkitUserSelect = "none"
          }

          // Bloquer l'impression
          const printStyle = doc.createElement("style")
          printStyle.textContent = "@media print { body { display: none !important; } }"
          doc.head?.appendChild(printStyle)

          // Résoudre et injecter en inline les feuilles de style externes
          // pour éviter tout blocage par l'interstitiel ngrok ou CORS dans l'iframe
          const links = Array.from(doc.querySelectorAll("link[rel='stylesheet']")) as HTMLLinkElement[]
          for (const link of links) {
            const rawHref = link.getAttribute("href")
            if (!rawHref || rawHref.startsWith("data:") || rawHref.startsWith("blob:")) continue
            try {
              let cssUrl = link.href
              if (cssUrl.includes("ngrok-free.dev") && !cssUrl.includes("ngrok-skip-browser-warning")) {
                cssUrl += (cssUrl.includes("?") ? "&" : "?") + "ngrok-skip-browser-warning=true"
              }
              const res = await fetch(cssUrl, {
                credentials: "include",
                headers: createApiHeaders(),
              })
              if (res.ok) {
                const cssText = await res.text()
                const inlineStyle = doc.createElement("style")
                inlineStyle.textContent = cssText
                doc.head?.appendChild(inlineStyle)
                link.remove()
              }
            } catch (cssErr) {
              console.warn("[EpubWebReader] Erreur inline CSS:", cssErr)
            }
          }

          // Ajuster les URLs des images pour contourner l'interstitiel ngrok
          const images = Array.from(doc.querySelectorAll("img")) as HTMLImageElement[]
          for (const img of images) {
            const src = img.getAttribute("src")
            if (!src || src.startsWith("data:") || src.startsWith("blob:")) continue
            if (img.src.includes("ngrok-free.dev") && !img.src.includes("ngrok-skip-browser-warning")) {
              img.src += (img.src.includes("?") ? "&" : "?") + "ngrok-skip-browser-warning=true"
            }
          }
        })

        // 7. Thèmes & Typographie
        renditionInstance.themes.register("light", {
          body: {
            background: "#fff6eb !important",
            color: "#100908 !important",
            "font-family": "Georgia, Cambria, 'Times New Roman', Times, serif !important",
          },
        })
        renditionInstance.themes.register("sepia", {
          body: {
            background: "#f6ecd6 !important",
            color: "#432d16 !important",
            "font-family": "Georgia, Cambria, 'Times New Roman', Times, serif !important",
          },
        })
        renditionInstance.themes.register("dark", {
          body: {
            background: "#171015 !important",
            color: "#ece2e6 !important",
            "font-family": "Georgia, Cambria, 'Times New Roman', Times, serif !important",
          },
        })
        renditionInstance.themes.select(theme)
        renditionInstance.themes.fontSize(`${fontSize}px`)

        // 8. Écoute du changement d'emplacement (relocated)
        renditionInstance.on("relocated", (location: any) => {
          if (!isMounted) return
          if (location && location.start) {
            const cfi = location.start.cfi
            const pct = Math.round((location.start.percentage || 0) * 100)
            setProgressPercent(pct)
            throttledSaveProgress(cfi, pct)

            // Trouver le titre du chapitre actuel si présent dans la TOC
            if (location.start.href && toc.length > 0) {
              const item = toc.find((t) => location.start.href.includes(t.href))
              if (item) setCurrentChapterTitle(item.label)
            }
          }
        })

        // 9. Afficher le livre (au CFI sauvegardé ou au début)
        setLoadingStatus("Affichage des pages...")
        if (savedCfi) {
          try {
            await renditionInstance.display(savedCfi)
          } catch (cfiErr) {
            console.warn("[EpubWebReader] Reprise sur savedCfi échouée, ouverture au début:", cfiErr)
            await renditionInstance.display()
          }
        } else {
          await renditionInstance.display()
        }

        if (isMounted) {
          setLoading(false)
        }
      } catch (err: any) {
        console.error("[EpubWebReader] Erreur de chargement:", err)
        if (isMounted) {
          setLoading(false)
          const parsed = parseEpubError(err)
          setErrorType(parsed.type)
          setErrorMessage(parsed.message)
        }
      }
    }

    void initEpub()

    return () => {
      isMounted = false
      if (renditionInstance) {
        try {
          renditionInstance.destroy()
        } catch {}
      }
      if (bookInstance) {
        try {
          bookInstance.destroy()
        } catch {}
      }
    }
  }, [book.id, retryTrigger])

  // Mise à jour réactive du thème
  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.select(theme)
    }
  }, [theme])

  // Mise à jour de la taille de police
  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${fontSize}px`)
    }
  }, [fontSize])

  // Navigation page précédente / suivante
  const handlePrev = useCallback(() => {
    if (renditionRef.current) {
      renditionRef.current.prev()
    }
  }, [])

  const handleNext = useCallback(() => {
    if (renditionRef.current) {
      renditionRef.current.next()
    }
  }, [])

  // Navigation clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev()
      if (e.key === "ArrowRight") handleNext()
      if (e.key === "Escape") setSettingsOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handlePrev, handleNext])

  // Sauter à un chapitre de la TOC
  const handleGoToChapter = (href: string) => {
    if (renditionRef.current) {
      renditionRef.current.display(href)
      setChapterListOpen(false)
    }
  }

  // Écran d'erreur dédié
  if (errorType) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-xl bg-surface-secondary-bg text-center animate-fade">
        <div className="w-16 h-16 rounded-corner-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-lg">
          {errorType === "BOOK_NOT_OWNED" ? (
            <ShieldAlert className="w-8 h-8 text-brand-primary" />
          ) : errorType === "EPUB_NOT_AVAILABLE" ? (
            <FileQuestion className="w-8 h-8 text-brand-primary" />
          ) : (
            <AlertCircle className="w-8 h-8 text-danger" />
          )}
        </div>

        <h1 className="text-heading font-semibold text-text-primary mb-sm">
          {errorType === "BOOK_NOT_OWNED"
            ? "Accès restreint à l'e-book"
            : errorType === "EPUB_NOT_AVAILABLE"
              ? "Livre numérique en cours de préparation"
              : "Impossible d'ouvrir l'e-book"}
        </h1>

        <p className="text-label-sm text-text-secondary max-w-[480px] mb-xl leading-relaxed">
          {errorMessage}
        </p>

        <div className="flex flex-wrap gap-md justify-center">
          <Button variant="primary" onClick={onClose}>
            Retour à la bibliothèque
          </Button>
          {errorType === "GENERIC" && (
            <Button
              variant="neutral"
              onClick={() => {
                setErrorType(null)
                setErrorMessage(null)
                setRetryTrigger((v) => v + 1)
              }}
            >
              Réessayer
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col select-none relative"
      style={{ backgroundColor: themeColors.bg }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Styles de protection d'impression */}
      <style dangerouslySetInnerHTML={{ __html: "@media print { body { display: none !important; } }" }} />

      {/* Barre supérieure du lecteur */}
      <header className="sticky top-0 z-40 bg-[#1a0f0c] text-white select-none">
        <div className="max-w-[1280px] mx-auto px-lg md:px-2xl h-[60px] flex items-center gap-lg">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-sm text-label-sm font-medium text-white/85 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Bibliothèque
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="text-label-sm font-semibold text-white truncate">
              {book.title}
            </p>
            <p className="text-video-title text-white/55 truncate">
              {currentChapterTitle || book.author}
            </p>
          </div>

          <div className="flex items-center gap-xs">
            {/* Bouton table des matières */}
            {toc.length > 0 && (
              <button
                onClick={() => setChapterListOpen((v) => !v)}
                aria-pressed={chapterListOpen}
                aria-label="Table des matières"
                className="inline-flex items-center justify-center w-9 h-9 rounded-corner-full text-white/85 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <List className="w-[18px] h-[18px]" aria-hidden="true" />
              </button>
            )}

            {/* Réglages de lecture */}
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              aria-pressed={settingsOpen}
              aria-label="Réglages de lecture"
              className={`inline-flex items-center justify-center w-9 h-9 rounded-corner-full transition-colors cursor-pointer ${
                settingsOpen ? "bg-white/20 text-white" : "text-white/85 hover:bg-white/10"
              }`}
            >
              <Settings className="w-[18px] h-[18px]" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Panneau de réglages (Thème, Taille police) */}
        {settingsOpen && (
          <div className="absolute right-4 top-[64px] w-[300px] max-w-[calc(100vw-32px)] rounded-corner-lg border border-border-secondary bg-surface-bg text-text-primary shadow-2xl p-xl animate-fade z-50">
            <p className="text-label-sm font-semibold mb-md">Thème de lecture</p>
            <div className="grid grid-cols-3 gap-sm mb-xl">
              {(
                [
                  { key: "light", label: "Clair", swatch: "#ffffff" },
                  { key: "sepia", label: "Sépia", swatch: "#f6ecd6" },
                  { key: "dark", label: "Sombre", swatch: "#171015" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTheme(opt.key)}
                  aria-pressed={theme === opt.key}
                  className={`flex flex-col items-center gap-xs py-md rounded-corner-md border transition-colors cursor-pointer ${
                    theme === opt.key
                      ? "border-brand-primary bg-surface-hover"
                      : "border-border-secondary hover:bg-surface-hover"
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-corner-full border border-border-primary"
                    style={{ backgroundColor: opt.swatch }}
                  />
                  <span className="text-video-title font-medium">{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-sm">
              <label htmlFor="font-range" className="text-label-sm font-semibold">
                Taille du texte
              </label>
              <span className="text-video-title text-text-tertiary">{fontSize}px</span>
            </div>
            <input
              id="font-range"
              type="range"
              min={16}
              max={28}
              step={1}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-[#e04070] cursor-pointer"
            />
          </div>
        )}
      </header>

      {/* Contenu principal de lecture */}
      <main className="flex-1 w-full max-w-[1020px] mx-auto flex flex-col relative px-md md:px-xl py-lg">
        <div className="flex-1 w-full min-h-[70vh] flex flex-col relative">
          {/* Overlay de chargement */}
          {loading && (
            <div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center p-xl text-center backdrop-blur-xs transition-opacity duration-300"
              style={{ backgroundColor: themeColors.bg }}
            >
              <Loader2 className="w-10 h-10 text-brand-primary animate-spin mb-md" />
              <p className="text-label-sm font-semibold text-text-primary mb-xs">
                {loadingStatus}
              </p>
              <p className="text-video-title text-text-secondary">
                Mise en page conforme de votre e-book...
              </p>
            </div>
          )}

          {/* Zone de rendu epub.js (TOUJOURS DANS LE DOM) */}
          <div
            ref={viewerRef}
            className={`flex-1 w-full h-full min-h-[65vh] overflow-hidden transition-opacity duration-300 ${
              loading ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
            style={{ minHeight: "calc(100vh - 160px)" }}
          />

          {!loading && (
            <>
              {/* Boutons de navigation flottants latéraux */}
              <button
                onClick={handlePrev}
                aria-label="Page précédente"
                className="absolute left-0 top-1/2 -translate-y-1/2 p-md rounded-corner-full bg-[#1a0f0c]/60 text-white hover:bg-[#1a0f0c] transition-colors cursor-pointer shadow-md opacity-40 hover:opacity-100 hidden sm:flex items-center justify-center z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                aria-label="Page suivante"
                className="absolute right-0 top-1/2 -translate-y-1/2 p-md rounded-corner-full bg-[#1a0f0c]/60 text-white hover:bg-[#1a0f0c] transition-colors cursor-pointer shadow-md opacity-40 hover:opacity-100 hidden sm:flex items-center justify-center z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </main>

      {/* Barre inférieure de progression et filigrane acheteur */}
      <footer
        className="sticky bottom-0 z-40 backdrop-blur-xl border-t px-lg py-sm"
        style={{
          backgroundColor: `${themeColors.panel}e6`,
          borderColor: themeColors.border,
        }}
      >
        <div className="max-w-[1280px] mx-auto flex flex-col gap-xs">
          <div className="flex items-center justify-between gap-md text-video-title">
            <span className="font-semibold" style={{ color: themeColors.text }}>
              {progressPercent}%
            </span>
            <div
              className="flex-1 h-1.5 rounded-corner-full overflow-hidden bg-border-secondary"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-brand-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-sm">
              <Button
                variant="neutral"
                size="small"
                onClick={handlePrev}
                iconStart={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Précédent
              </Button>
              <Button
                variant="neutral"
                size="small"
                onClick={handleNext}
                iconEnd={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Suivant
              </Button>
            </div>
          </div>

          {/* Filigrane d'authenticité acheteur */}
          <div className="text-center text-[11px] text-text-tertiary select-none opacity-60">
            Exemplaire numérique sous licence YéYéBook — {currentUser?.email || "Utilisateur enregistré"}
          </div>
        </div>
      </footer>

      {/* Tiroir latéral de la table des matières */}
      {chapterListOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-[#100908]/40 animate-fade"
            onClick={() => setChapterListOpen(false)}
          />
          <aside
            className="relative w-[86%] max-w-[340px] h-full shadow-2xl flex flex-col animate-slide-in p-xl overflow-y-auto"
            style={{ backgroundColor: themeColors.bg }}
          >
            <div className="flex items-center justify-between mb-lg border-b pb-md" style={{ borderColor: themeColors.border }}>
              <h2 className="text-heading font-semibold" style={{ color: themeColors.text }}>
                Sommaire
              </h2>
              <button
                onClick={() => setChapterListOpen(false)}
                aria-label="Fermer le sommaire"
                className="inline-flex items-center justify-center w-8 h-8 rounded-corner-full hover:bg-surface-hover cursor-pointer"
                style={{ color: themeColors.sub }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-xs">
              {toc.map((item, idx) => (
                <button
                  key={item.id || idx}
                  onClick={() => handleGoToChapter(item.href)}
                  className="text-left py-sm px-md rounded-corner-md text-label-sm hover:bg-surface-hover transition-colors cursor-pointer"
                  style={{ color: themeColors.text }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

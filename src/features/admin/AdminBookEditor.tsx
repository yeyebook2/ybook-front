import React, { useState, useRef, useEffect, useMemo } from "react"
import {
  ArrowLeft,
  UploadCloud,
  BookOpen,
  BookText,
  Check,
  CheckCircle2,
  Trash2,
  X,
  Plus,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Info,
  Sparkles,
  Tag,
} from "lucide-react"
import { Button } from "@figma/astraui"
import type { Book } from "@/features/catalog/types"
import { CATALOG_CATEGORIES } from "@/features/catalog/catalog.constants"
import { uploadCoverApi, uploadEpubApi } from "./admin.api"

export const SUPPORTED_LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "Anglais" },
]

export interface AdminBookEditorProps {
  book: Book | null
  existingBooks: Book[]
  onClose: () => void
  onSave: (book: Book) => void
}

export function AdminBookEditor({
  book,
  existingBooks,
  onClose,
  onSave,
}: AdminBookEditorProps) {
  // Liste des catégories existantes enrichie dynamiquement
  const [availableCategories, setAvailableCategories] = useState<string[]>(() => {
    const base = CATALOG_CATEGORIES.map((c) => c.value)
    const fromBooks = existingBooks.map((b) => b.category?.trim()).filter(Boolean)
    if (book?.category?.trim()) fromBooks.push(book.category.trim())
    return Array.from(new Set([...base, ...fromBooks]))
  })

  // État du mini-formulaire d'ajout de nouvelle catégorie
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [categoryFeedback, setCategoryFeedback] = useState<string | null>(null)

  // Formulaire principal
  const [form, setForm] = useState({
    title: book?.title ?? "",
    subtitle: book?.subtitle ?? "",
    author: book?.author ?? "",
    category: book?.category ?? "Roman",
    price: book ? String(book.price) : "",
    pages: book ? String(book.pages) : "160",
    year: book ? String(book.year) : String(new Date().getFullYear()),
    language: book?.language ?? "fr",
    cover: book?.cover ?? "",
    description: book?.description ?? "",
    published: book?.published !== false,
  })

  const setField = (key: keyof typeof form, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  // Gestion de la couverture
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDraggingCover, setIsDraggingCover] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)
  const [useUrlMode, setUseUrlMode] = useState(false)

  const MAX_COVER_SIZE = 5 * 1024 * 1024 // 5 Mo
  const ALLOWED_COVER_TYPES = ["image/jpeg", "image/png", "image/webp"]

  const handleCoverFile = async (file: File) => {
    setCoverError(null)
    if (!ALLOWED_COVER_TYPES.includes(file.type)) {
      setCoverError("Format non supporté. Veuillez choisir une image JPG, PNG ou WEBP.")
      return
    }
    if (file.size > MAX_COVER_SIZE) {
      setCoverError("Le fichier est trop lourd (5 Mo maximum).")
      return
    }

    // Prévisualisation immédiate en local
    const reader = new FileReader()
    reader.onload = (e) => {
      const res = e.target?.result as string
      if (res) setField("cover", res)
    }
    reader.readAsDataURL(file)

    // Téléversement vers le serveur
    setCoverUploading(true)
    try {
      const res = await uploadCoverApi(file)
      if (res.url) {
        setField("cover", res.url)
      }
    } catch (err: any) {
      setCoverError(err?.message || "Échec du téléversement de la couverture.")
    } finally {
      setCoverUploading(false)
    }
  }

  // Gestion du fichier ePub
  const epubInputRef = useRef<HTMLInputElement>(null)
  const [isDraggingEpub, setIsDraggingEpub] = useState(false)
  const [epubUploading, setEpubUploading] = useState(false)
  const [epubProgress, setEpubProgress] = useState(0)
  const [epubStatusText, setEpubStatusText] = useState("")
  const [epubError, setEpubError] = useState<string | null>(null)
  const [epubFile, setEpubFile] = useState<{
    name: string
    size: string
    rawSize?: number
  } | null>(
    book?.file_url
      ? {
          name: book.epub_filename || "Livre numérique.epub",
          size:
            typeof book.file_size === "number" && book.file_size > 0
              ? `${(book.file_size / (1024 * 1024)).toFixed(1)} Mo`
              : "Format ePub 3",
          rawSize: typeof book.file_size === "number" ? book.file_size : undefined,
        }
      : null,
  )
  const [fileUrl, setFileUrl] = useState(book?.file_url || "")
  const [epubFilename, setEpubFilename] = useState(book?.epub_filename || "")
  const [epubSizeBytes, setEpubSizeBytes] = useState<number | undefined>(book?.file_size)

  const MAX_EPUB_SIZE = 50 * 1024 * 1024 // 50 Mo

  const handleEpubFile = async (file: File) => {
    setEpubError(null)
    if (!file.name.toLowerCase().endsWith(".epub")) {
      setEpubError("Le fichier doit être au format .epub standard.")
      return
    }
    if (file.size > MAX_EPUB_SIZE) {
      setEpubError("Le fichier ePub dépasse la taille maximale autorisée (50 Mo).")
      return
    }

    const humanSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} Mo`
        : `${Math.round(file.size / 1024)} Ko`

    setEpubFile({
      name: file.name,
      size: humanSize,
      rawSize: file.size,
    })
    setEpubFilename(file.name)
    setEpubSizeBytes(file.size)

    setEpubUploading(true)
    setEpubProgress(10)
    setEpubStatusText("Préparation du transfert de l'ePub...")

    const progressTimer = setInterval(() => {
      setEpubProgress((p) => {
        if (p < 85) return p + Math.floor(Math.random() * 15) + 5
        return p
      })
    }, 250)

    try {
      setEpubStatusText("Envoi du fichier vers le serveur de stockage...")
      const res = await uploadEpubApi(file)
      clearInterval(progressTimer)
      setEpubProgress(100)
      setEpubStatusText("ePub téléversé et validé avec succès !")
      if (res.file_url) setFileUrl(res.file_url)
      if (res.filename) setEpubFilename(res.filename)
      if (typeof res.size_bytes === "number") setEpubSizeBytes(res.size_bytes)
    } catch (err: any) {
      clearInterval(progressTimer)
      setEpubError(err?.message || "Échec du téléversement du fichier ePub.")
      setEpubFile(null)
      setFileUrl("")
    } finally {
      setTimeout(() => setEpubUploading(false), 500)
    }
  }

  // Ajout dynamique d'une nouvelle catégorie
  const handleAddNewCategory = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newCategoryName.trim()
    if (!trimmed) return

    const normalizedExists = availableCategories.some(
      (c) => c.toLowerCase() === trimmed.toLowerCase(),
    )

    if (!normalizedExists) {
      setAvailableCategories((prev) => [...prev, trimmed])
    }

    setField("category", trimmed)
    setNewCategoryName("")
    setIsAddingCategory(false)
    setCategoryFeedback(`Nouvelle catégorie « ${trimmed} » créée et sélectionnée !`)
    setTimeout(() => setCategoryFeedback(null), 4000)
  }

  // Liste des auteurs pour l'autocomplétion
  const existingAuthors = useMemo(() => {
    const set = new Set<string>()
    existingBooks.forEach((b) => {
      if (b.author?.trim()) set.add(b.author.trim())
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"))
  }, [existingBooks])

  // Validation
  const isValid =
    form.title.trim().length > 0 &&
    form.author.trim().length > 0 &&
    Number(form.price) > 0 &&
    form.category.trim().length > 0 &&
    form.cover.trim().length > 0 &&
    Boolean(fileUrl || epubFile || book?.has_file)

  const missingFields: string[] = []
  if (!form.title.trim()) missingFields.push("Titre")
  if (!form.author.trim()) missingFields.push("Auteur")
  if (!Number(form.price)) missingFields.push("Prix (> 0 FCFA)")
  if (!form.cover.trim()) missingFields.push("Couverture")
  if (!fileUrl && !epubFile && !book?.has_file) missingFields.push("Fichier ePub")

  // Raccourci clavier Ctrl+S ou Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        if (isValid && !epubUploading && !coverUploading) {
          handleSave()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isValid, form, fileUrl, epubFile, epubUploading, coverUploading])

  const handleSave = () => {
    if (!isValid || epubUploading || coverUploading) return

    const id = book?.id ?? `book-${Date.now()}`
    const description =
      form.description.trim() ||
      `${form.title} par ${form.author}. Une œuvre captivante publiée par les éditions YéYéBook.`

    const finalBook: Book = {
      id,
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      author: form.author.trim(),
      category: form.category,
      price: Number(form.price),
      pages: Number(form.pages) || 120,
      year: Number(form.year) || new Date().getFullYear(),
      rating: book?.rating ?? 0,
      reviews: book?.reviews ?? 0,
      cover: form.cover.trim(),
      file_url: fileUrl || book?.file_url || undefined,
      epub_filename: epubFilename || book?.epub_filename || epubFile?.name || undefined,
      has_file: Boolean(fileUrl || book?.has_file),
      file_size: epubSizeBytes ?? book?.file_size ?? undefined,
      language: form.language,
      description,
      chapters: book?.chapters ?? [],
      published: form.published,
    }

    onSave(finalBook)
  }

  return (
    <div className="flex flex-col flex-1 animate-fade min-w-0">
      {/* Barre supérieure d'actions sticky adaptée mobile & desktop */}
      <header className="sticky top-0 z-30 bg-surface-bg/95 backdrop-blur-md border-b border-border-secondary shadow-xs">
        <div className="max-w-[1500px] mx-auto px-md sm:px-lg md:px-2xl min-h-[58px] sm:min-h-[68px] py-xs sm:py-0 flex items-center justify-between gap-sm sm:gap-md">
          <div className="flex items-center gap-xs sm:gap-md min-w-0">
            <button
              onClick={onClose}
              type="button"
              className="inline-flex items-center gap-1.5 px-sm sm:px-md py-1.5 rounded-corner-md text-label-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors cursor-pointer shrink-0"
              title="Retourner au catalogue"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Catalogue</span>
            </button>
            <div className="h-4 w-[1px] bg-border-secondary hidden sm:block shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] sm:text-video-title font-semibold uppercase tracking-wider text-brand-primary">
                  {book ? "Édition de livre" : "Nouveau livre"}
                </span>
                {form.published ? (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-corner-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <Eye className="w-3 h-3" />
                    Public
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-corner-full bg-border-secondary text-text-secondary">
                    <EyeOff className="w-3 h-3" />
                    Brouillon
                  </span>
                )}
              </div>
              <h1 className="text-label sm:text-heading font-semibold text-text-primary truncate max-w-[200px] sm:max-w-[400px] md:max-w-[550px]">
                {form.title.trim() || (book ? "Modifier le livre" : "Ajouter un titre au catalogue")}
              </h1>
            </div>
          </div>

          {/* Boutons d'action dans l'en-tête (Desktop & Tablette) */}
          <div className="hidden sm:flex items-center gap-sm shrink-0">
            <Button variant="neutral" size="medium" onClick={onClose}>
              Annuler
            </Button>
            <Button
              variant="primary"
              size="medium"
              disabled={!isValid || epubUploading || coverUploading}
              onClick={handleSave}
              iconStart={
                epubUploading || coverUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )
              }
            >
              {epubUploading
                ? "Téléversement ePub…"
                : coverUploading
                  ? "Téléversement couverture…"
                  : book
                    ? "Enregistrer"
                    : "Créer le titre"}
            </Button>
          </div>

          {/* Bouton rapide d'enregistrement sur mobile */}
          <div className="flex sm:hidden items-center gap-xs shrink-0">
            <button
              type="button"
              disabled={!isValid || epubUploading || coverUploading}
              onClick={handleSave}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-corner-md text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                !isValid || epubUploading || coverUploading
                  ? "bg-brand-primary/40 text-on-brand/70 cursor-not-allowed"
                  : "bg-brand-primary text-on-brand hover:brightness-105 active:scale-95"
              }`}
            >
              {epubUploading || coverUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{book ? "Enregistrer" : "Créer"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal du formulaire */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto px-sm sm:px-md md:px-xl py-md sm:py-xl md:py-2xl pb-28 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-md sm:gap-xl lg:gap-2xl items-start">
          {/* Colonne Gauche : Données éditoriales et métadonnées */}
          <div className="flex flex-col gap-md sm:gap-xl lg:gap-2xl min-w-0">
            {/* Carte 1 : Informations principales */}
            <section className="rounded-corner-xl bg-surface-bg border border-border-secondary p-md sm:p-lg md:p-xl shadow-xs">
              <div className="flex items-center gap-sm mb-md sm:mb-lg">
                <span className="w-8 h-8 rounded-corner-md bg-brand-tertiary text-brand-primary flex items-center justify-center shrink-0">
                  <BookText className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-label sm:text-title font-semibold text-text-primary">
                    Informations de l'œuvre
                  </h2>
                  <p className="text-video-title text-text-tertiary truncate">
                    Titre, auteur et caractéristiques de l'édition.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-md sm:gap-lg">
                {/* Titre */}
                <div>
                  <label
                    htmlFor="book-title-input"
                    className="block text-label-sm font-semibold text-text-primary mb-xs"
                  >
                    Titre du livre <span className="text-brand-primary">*</span>
                  </label>
                  <input
                    id="book-title-input"
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    placeholder="ex: Une si longue lettre, Le pagne noir..."
                    className="w-full text-base sm:text-title font-medium rounded-corner-md border border-border-secondary bg-surface-bg px-md sm:px-xl py-sm sm:py-md text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all min-h-[44px]"
                  />
                </div>

                {/* Sous-titre optionnel */}
                <div>
                  <label
                    htmlFor="book-subtitle-input"
                    className="block text-label-sm font-medium text-text-secondary mb-xs"
                  >
                    Sous-titre <span className="text-text-tertiary text-video-title">(Optionnel)</span>
                  </label>
                  <input
                    id="book-subtitle-input"
                    type="text"
                    value={form.subtitle}
                    onChange={(e) => setField("subtitle", e.target.value)}
                    placeholder="ex: Roman épistolaire africain, Tome 1..."
                    className="w-full text-base sm:text-label-sm rounded-corner-md border border-border-secondary bg-surface-bg px-md sm:px-lg py-sm sm:py-md text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/20 transition-all min-h-[44px]"
                  />
                </div>

                {/* Auteur avec autocomplétion */}
                <div>
                  <label
                    htmlFor="book-author-input"
                    className="block text-label-sm font-semibold text-text-primary mb-xs"
                  >
                    Auteur ou autrice <span className="text-brand-primary">*</span>
                  </label>
                  <input
                    id="book-author-input"
                    type="text"
                    list="existing-authors-list"
                    required
                    value={form.author}
                    onChange={(e) => setField("author", e.target.value)}
                    placeholder="ex: Mariama Bâ, Chinua Achebe, Bernard Dadié..."
                    className="w-full text-base sm:text-label-sm font-medium rounded-corner-md border border-border-secondary bg-surface-bg px-md sm:px-lg py-sm sm:py-md text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all min-h-[44px]"
                  />
                  <datalist id="existing-authors-list">
                    {existingAuthors.map((authorName) => (
                      <option key={authorName} value={authorName} />
                    ))}
                  </datalist>
                  <p className="text-video-title text-text-tertiary mt-1">
                    Choisissez parmi les auteurs existants ou tapez librement le nom d'un nouvel auteur.
                  </p>
                </div>

                {/* Grille responsive : Prix, Pages, Année, Langue */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md sm:gap-lg pt-xs">
                  <div>
                    <label
                      htmlFor="book-price-input"
                      className="block text-label-sm font-semibold text-text-primary mb-xs"
                    >
                      Prix de vente <span className="text-brand-primary">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="book-price-input"
                        type="text"
                        required
                        inputMode="numeric"
                        value={form.price}
                        onChange={(e) => setField("price", e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="2500"
                        className="w-full text-base sm:text-label-sm font-semibold rounded-corner-md border border-border-secondary bg-surface-bg pl-md sm:pl-lg pr-14 py-sm sm:py-md text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all tabular-nums min-h-[44px]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-video-title font-bold text-text-tertiary pointer-events-none">
                        FCFA
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="book-pages-input"
                      className="block text-label-sm font-medium text-text-secondary mb-xs"
                    >
                      Nombre de pages
                    </label>
                    <input
                      id="book-pages-input"
                      type="text"
                      inputMode="numeric"
                      value={form.pages}
                      onChange={(e) => setField("pages", e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="165"
                      className="w-full text-base sm:text-label-sm rounded-corner-md border border-border-secondary bg-surface-bg px-md sm:px-lg py-sm sm:py-md text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/20 transition-all tabular-nums min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="book-year-input"
                      className="block text-label-sm font-medium text-text-secondary mb-xs"
                    >
                      Année d'édition
                    </label>
                    <input
                      id="book-year-input"
                      type="text"
                      inputMode="numeric"
                      value={form.year}
                      onChange={(e) => setField("year", e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="2026"
                      className="w-full text-base sm:text-label-sm rounded-corner-md border border-border-secondary bg-surface-bg px-md sm:px-lg py-sm sm:py-md text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/20 transition-all tabular-nums min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="book-language-select"
                      className="block text-label-sm font-medium text-text-secondary mb-xs"
                    >
                      Langue <span className="text-brand-primary">*</span>
                    </label>
                    <select
                      id="book-language-select"
                      value={form.language}
                      onChange={(e) => setField("language", e.target.value)}
                      className="w-full text-base sm:text-label-sm font-medium rounded-corner-md border border-border-secondary bg-surface-bg px-md sm:px-lg py-sm sm:py-md text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/20 transition-all min-h-[44px]"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label} ({lang.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Carte 2 : Catégorie & Classification avec Création Dynamique */}
            <section className="rounded-corner-xl bg-surface-bg border border-border-secondary p-md sm:p-lg md:p-xl shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm mb-md sm:mb-lg">
                <div className="flex items-center gap-sm">
                  <span className="w-8 h-8 rounded-corner-md bg-brand-tertiary text-brand-primary flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-label sm:text-title font-semibold text-text-primary">
                      Catégorie de l'ouvrage <span className="text-brand-primary">*</span>
                    </h2>
                    <p className="text-video-title text-text-tertiary">
                      Sélectionnez ou créez une catégorie pour ce livre.
                    </p>
                  </div>
                </div>

                {!isAddingCategory && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="inline-flex items-center justify-center gap-xs px-md py-2 rounded-corner-md bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white text-xs sm:text-label-sm font-semibold transition-all cursor-pointer min-h-[40px] w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Créer une catégorie</span>
                  </button>
                )}
              </div>

              {/* Message de confirmation de création d'une catégorie */}
              {categoryFeedback && (
                <div className="mb-md p-sm sm:p-md rounded-corner-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs sm:text-label-sm flex items-center gap-sm animate-fade">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{categoryFeedback}</span>
                </div>
              )}

              {/* Formulaire dynamique d'ajout d'une nouvelle catégorie */}
              {isAddingCategory && (
                <div className="mb-md sm:mb-lg p-md sm:p-lg rounded-corner-lg border-2 border-dashed border-brand-primary/40 bg-brand-tertiary/30 animate-fade">
                  <form onSubmit={handleAddNewCategory} className="flex flex-col gap-sm">
                    <p className="text-xs sm:text-label-sm font-semibold text-text-primary flex items-center gap-xs">
                      <Sparkles className="w-4 h-4 text-brand-primary" />
                      Créer une nouvelle catégorie pour ce livre
                    </p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-sm">
                      <input
                        type="text"
                        autoFocus
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="ex: Philosophie, Essai, Biographie, Jeunesse..."
                        className="w-full sm:flex-1 text-base sm:text-label-sm rounded-corner-md border border-border-secondary bg-surface-bg px-md sm:px-lg py-sm sm:py-md text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 min-h-[44px]"
                      />
                      <div className="flex items-center gap-sm">
                        <Button
                          type="submit"
                          variant="primary"
                          size="medium"
                          iconStart={<Check className="w-4 h-4" />}
                          disabled={!newCategoryName.trim()}
                        >
                          Créer
                        </Button>
                        <Button
                          type="button"
                          variant="neutral"
                          size="medium"
                          onClick={() => {
                            setIsAddingCategory(false)
                            setNewCategoryName("")
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                    <p className="text-video-title text-text-tertiary">
                      Cette catégorie sera immédiatement attribuée à ce livre et ajoutée aux filtres.
                    </p>
                  </form>
                </div>
              )}

              {/* Badges de catégories sélectionnables (tactiles et adaptés mobile) */}
              <div
                className="flex flex-wrap gap-xs sm:gap-sm"
                role="radiogroup"
                aria-label="Catégories disponibles"
              >
                {availableCategories.map((cat) => {
                  const isSelected = form.category.toLowerCase() === cat.toLowerCase()
                  return (
                    <button
                      key={cat}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setField("category", cat)}
                      className={`inline-flex items-center gap-xs px-md sm:px-lg py-1.5 sm:py-2 rounded-corner-full text-xs sm:text-label-sm font-medium border transition-all cursor-pointer min-h-[38px] ${
                        isSelected
                          ? "bg-brand-primary text-on-brand border-brand-primary shadow-xs font-semibold"
                          : "bg-surface-secondary-bg/60 text-text-secondary border-border-secondary hover:border-brand-primary hover:text-text-primary hover:bg-surface-secondary-bg"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />}
                      <span>{cat}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Carte 3 : Résumé & Description éditoriale */}
            <section className="rounded-corner-xl bg-surface-bg border border-border-secondary p-md sm:p-lg md:p-xl shadow-xs">
              <div className="flex items-center justify-between mb-sm sm:mb-md">
                <div>
                  <h2 className="text-label sm:text-title font-semibold text-text-primary">
                    Description & Synopsis
                  </h2>
                  <p className="text-video-title text-text-tertiary">
                    Présentez l'intrigue et l'intérêt de l'ouvrage.
                  </p>
                </div>
                <span className="text-video-title text-text-tertiary tabular-nums shrink-0">
                  {form.description.length} car.
                </span>
              </div>

              <textarea
                id="book-description-editor"
                rows={6}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Rédigez ici le résumé officiel ou la quatrième de couverture de l'ouvrage..."
                className="w-full rounded-corner-lg border border-border-secondary bg-surface-bg px-md sm:px-xl py-sm sm:py-lg text-base sm:text-label-sm text-text-primary placeholder:text-text-tertiary resize-y focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all leading-relaxed min-h-[130px]"
              />
            </section>

            {/* Carte 4 : Visibilité & Statut */}
            <section className="rounded-corner-xl bg-surface-bg border border-border-secondary p-md sm:p-lg md:p-xl shadow-xs">
              <h2 className="text-label sm:text-title font-semibold text-text-primary mb-xs">
                Statut de diffusion
              </h2>
              <p className="text-video-title text-text-tertiary mb-md">
                Définissez la visibilité publique de cet ouvrage.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm sm:gap-md">
                <button
                  type="button"
                  onClick={() => setField("published", true)}
                  aria-pressed={form.published}
                  className={`flex items-start gap-md p-md sm:p-lg rounded-corner-lg border text-left transition-all cursor-pointer ${
                    form.published
                      ? "border-emerald-600 bg-emerald-500/10 ring-1 ring-emerald-600/30"
                      : "border-border-secondary bg-surface-bg hover:bg-surface-secondary-bg"
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-corner-md flex items-center justify-center shrink-0 ${
                      form.published
                        ? "bg-emerald-600 text-white"
                        : "bg-surface-secondary-bg text-text-tertiary"
                    }`}
                  >
                    <Eye className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-label-sm font-semibold text-text-primary">
                      Publié immédiatement
                    </p>
                    <p className="text-video-title text-text-secondary mt-0.5 leading-snug">
                      Visible dans le catalogue et disponible à l'achat par les clients.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setField("published", false)}
                  aria-pressed={!form.published}
                  className={`flex items-start gap-md p-md sm:p-lg rounded-corner-lg border text-left transition-all cursor-pointer ${
                    !form.published
                      ? "border-brand-primary bg-brand-primary/10 ring-1 ring-brand-primary/30"
                      : "border-border-secondary bg-surface-bg hover:bg-surface-secondary-bg"
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-corner-md flex items-center justify-center shrink-0 ${
                      !form.published
                        ? "bg-brand-primary text-white"
                        : "bg-surface-secondary-bg text-text-tertiary"
                    }`}
                  >
                    <EyeOff className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-label-sm font-semibold text-text-primary">
                      Enregistrer en brouillon
                    </p>
                    <p className="text-video-title text-text-secondary mt-0.5 leading-snug">
                      Masqué du catalogue public, visible uniquement dans l'administration.
                    </p>
                  </div>
                </button>
              </div>
            </section>
          </div>

          {/* Colonne Droite : Couverture, Fichier ePub et Synthèse */}
          <div className="flex flex-col gap-md sm:gap-xl lg:gap-2xl lg:sticky lg:top-[88px] min-w-0">
            {/* Carte 5 : Couverture du livre */}
            <section className="rounded-corner-xl bg-surface-bg border border-border-secondary p-md sm:p-lg md:p-xl shadow-xs">
              <div className="flex items-center justify-between mb-sm sm:mb-md">
                <div>
                  <h3 className="text-label-sm sm:text-label font-semibold text-text-primary">
                    Couverture de l'e-book <span className="text-brand-primary">*</span>
                  </h3>
                  <p className="text-video-title text-text-tertiary">
                    Format portrait (ratio 2:3 recommandé)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUseUrlMode(!useUrlMode)
                    setCoverError(null)
                  }}
                  className="text-xs sm:text-video-title font-semibold text-brand-primary hover:underline cursor-pointer"
                >
                  {useUrlMode ? "Importer un fichier" : "Saisir une URL"}
                </button>
              </div>

              {useUrlMode ? (
                <div className="flex flex-col gap-sm">
                  <input
                    type="url"
                    value={form.cover}
                    onChange={(e) => {
                      setCoverError(null)
                      setField("cover", e.target.value)
                    }}
                    placeholder="https://images.example.com/cover.jpg"
                    className="w-full text-base sm:text-label-sm rounded-corner-md border border-border-secondary bg-surface-bg px-md sm:px-lg py-sm sm:py-md text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none min-h-[44px]"
                  />
                  {form.cover && (
                    <div className="w-32 h-48 rounded-corner-md overflow-hidden bg-brand-tertiary border border-border-secondary mx-auto mt-sm shadow-md">
                      <img
                        src={form.cover}
                        alt="Aperçu couverture"
                        className="w-full h-full object-cover"
                        onError={() => setCoverError("Impossible de charger l'image depuis cette URL.")}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        void handleCoverFile(e.target.files[0])
                      }
                    }}
                  />

                  {form.cover ? (
                    <div className="flex flex-col items-center gap-md p-md rounded-corner-lg border border-border-secondary bg-surface-secondary-bg/40">
                      <div className="w-32 sm:w-36 h-48 sm:h-52 rounded-corner-md overflow-hidden bg-brand-tertiary border border-border-secondary shadow-md relative group">
                        <img
                          src={form.cover}
                          alt="Couverture"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = ""
                            setCoverError("Impossible de charger l'image.")
                          }}
                        />
                        {coverUploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-md">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs sm:text-label-sm text-brand-primary font-semibold hover:underline cursor-pointer"
                        >
                          Remplacer la photo
                        </button>
                        <span className="text-border-secondary">·</span>
                        <button
                          type="button"
                          onClick={() => {
                            setField("cover", "")
                            if (fileInputRef.current) fileInputRef.current.value = ""
                          }}
                          className="text-xs sm:text-label-sm text-danger hover:underline cursor-pointer inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setIsDraggingCover(true)
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault()
                        setIsDraggingCover(false)
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        setIsDraggingCover(false)
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          void handleCoverFile(e.dataTransfer.files[0])
                        }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-corner-xl p-lg sm:p-2xl flex flex-col items-center justify-center gap-sm text-center cursor-pointer transition-all min-h-[160px] ${
                        isDraggingCover
                          ? "border-brand-primary bg-brand-primary/10 scale-[1.02]"
                          : "border-border-primary bg-surface-secondary-bg/40 hover:bg-surface-secondary-bg hover:border-brand-primary"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-corner-full bg-brand-tertiary text-brand-primary flex items-center justify-center">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-label-sm font-semibold text-text-primary">
                          Touchez pour importer votre photo
                        </p>
                        <p className="text-video-title text-text-secondary mt-0.5">
                          ou <span className="text-brand-primary underline font-medium">glissez-déposez un fichier</span>
                        </p>
                      </div>
                      <p className="text-[11px] text-text-tertiary">
                        JPG, PNG ou WEBP · 5 Mo maximum
                      </p>
                    </div>
                  )}
                </div>
              )}

              {coverError && (
                <p className="text-video-title text-danger flex items-center gap-xs mt-sm">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {coverError}
                </p>
              )}
            </section>

            {/* Carte 6 : Fichier ePub Numérique */}
            <section className="rounded-corner-xl bg-surface-bg border border-border-secondary p-md sm:p-lg md:p-xl shadow-xs">
              <div className="flex items-center justify-between mb-xs sm:mb-sm">
                <h3 className="text-label-sm sm:text-label font-semibold text-text-primary">
                  Fichier ePub numérique <span className="text-brand-primary">*</span>
                </h3>
                <span className="text-[10px] sm:text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                  Phase 1 · ePub 3
                </span>
              </div>
              <p className="text-video-title text-text-tertiary mb-sm sm:mb-md">
                Fichier .epub requis pour le lecteur web YéYéBook (50 Mo max).
              </p>

              <input
                type="file"
                ref={epubInputRef}
                accept=".epub,application/epub+zip"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    void handleEpubFile(e.target.files[0])
                  }
                }}
              />

              {epubUploading ? (
                /* Barre de progression animée */
                <div className="p-md sm:p-lg rounded-corner-lg border border-brand-primary/40 bg-surface-secondary-bg flex flex-col gap-sm animate-fade">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-xs">
                      <BookOpen className="w-4 h-4 text-brand-primary animate-pulse" />
                      <span className="text-xs sm:text-label-sm font-semibold text-text-primary">
                        Téléversement de l'ePub...
                      </span>
                    </div>
                    <span className="text-xs sm:text-label-sm font-bold text-brand-primary tabular-nums">
                      {epubProgress}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-corner-full bg-border-secondary overflow-hidden">
                    <div
                      className="h-full bg-brand-primary rounded-corner-full transition-all duration-200 ease-out"
                      style={{ width: `${epubProgress}%` }}
                    />
                  </div>

                  <p className="text-video-title text-text-secondary">{epubStatusText}</p>
                </div>
              ) : epubFile ? (
                /* Fichier ePub validé */
                <div className="flex items-center gap-sm sm:gap-md p-md rounded-corner-lg border border-emerald-500/30 bg-emerald-500/5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-corner-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-xs">
                      <p className="text-xs sm:text-label-sm font-semibold text-text-primary truncate">
                        {epubFile.name}
                      </p>
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                    </div>
                    <p className="text-video-title text-text-tertiary">
                      {epubFile.size} · Prêt pour la lecture
                    </p>
                  </div>
                  <div className="flex items-center gap-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => epubInputRef.current?.click()}
                      className="text-video-title text-brand-primary font-semibold hover:underline cursor-pointer px-sm py-xs"
                    >
                      Changer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEpubFile(null)
                        setFileUrl("")
                        if (epubInputRef.current) epubInputRef.current.value = ""
                      }}
                      aria-label="Supprimer l'ePub"
                      className="text-text-tertiary hover:text-danger p-xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Zone de dépôt ePub tactile */
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDraggingEpub(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    setIsDraggingEpub(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDraggingEpub(false)
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      void handleEpubFile(e.dataTransfer.files[0])
                    }
                  }}
                  onClick={() => epubInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-corner-xl p-lg sm:p-xl flex flex-col items-center justify-center gap-sm text-center cursor-pointer transition-all min-h-[140px] ${
                    isDraggingEpub
                      ? "border-brand-primary bg-brand-primary/10 scale-[1.02]"
                      : "border-border-primary bg-surface-secondary-bg/40 hover:bg-surface-secondary-bg hover:border-brand-primary"
                  }`}
                >
                  <div className="w-10 h-10 rounded-corner-full bg-brand-tertiary text-brand-primary flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-label-sm font-semibold text-text-primary">
                      Touchez pour importer le fichier .epub
                    </p>
                    <p className="text-video-title text-text-secondary mt-0.5">
                      ou <span className="text-brand-primary underline font-medium">glissez-déposez le fichier</span>
                    </p>
                  </div>
                  <p className="text-[11px] text-text-tertiary">
                    Format .epub uniquement · 50 Mo maximum
                  </p>
                </div>
              )}

              {epubError && (
                <p className="text-video-title text-danger flex items-center gap-xs mt-sm">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {epubError}
                </p>
              )}
            </section>

            {/* Carte 7 : Résumé des prérequis avant enregistrement */}
            <section className="rounded-corner-xl bg-surface-bg border border-border-secondary p-md sm:p-lg shadow-xs">
              <h4 className="text-xs sm:text-label-sm font-semibold text-text-primary mb-sm flex items-center gap-xs">
                <Info className="w-4 h-4 text-brand-primary" />
                Vérification des éléments requis
              </h4>

              <ul className="flex flex-col gap-1.5 text-video-title">
                <li className="flex items-center gap-sm">
                  {form.title.trim() ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-border-secondary shrink-0" />
                  )}
                  <span className={form.title.trim() ? "text-text-primary" : "text-text-tertiary"}>
                    Titre du livre
                  </span>
                </li>

                <li className="flex items-center gap-sm">
                  {form.author.trim() ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-border-secondary shrink-0" />
                  )}
                  <span className={form.author.trim() ? "text-text-primary" : "text-text-tertiary"}>
                    Auteur ou autrice
                  </span>
                </li>

                <li className="flex items-center gap-sm">
                  {Number(form.price) > 0 ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-border-secondary shrink-0" />
                  )}
                  <span className={Number(form.price) > 0 ? "text-text-primary" : "text-text-tertiary"}>
                    Prix de vente en FCFA
                  </span>
                </li>

                <li className="flex items-center gap-sm">
                  {form.category.trim() ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-border-secondary shrink-0" />
                  )}
                  <span className={form.category.trim() ? "text-text-primary" : "text-text-tertiary"}>
                    Catégorie ({form.category})
                  </span>
                </li>

                <li className="flex items-center gap-sm">
                  {form.cover.trim() ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-border-secondary shrink-0" />
                  )}
                  <span className={form.cover.trim() ? "text-text-primary" : "text-text-tertiary"}>
                    Couverture de l'e-book
                  </span>
                </li>

                <li className="flex items-center gap-sm">
                  {fileUrl || epubFile || book?.has_file ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-border-secondary shrink-0" />
                  )}
                  <span
                    className={
                      fileUrl || epubFile || book?.has_file
                        ? "text-text-primary"
                        : "text-text-tertiary"
                    }
                  >
                    Fichier numérique .epub
                  </span>
                </li>
              </ul>

              {missingFields.length > 0 && (
                <div className="mt-sm p-sm rounded-corner-md bg-brand-primary/5 border border-brand-primary/20 text-video-title text-brand-primary">
                  Manquant : {missingFields.join(", ")}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Barre d'action sticky en bas d'écran sur MOBILE (< sm) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-bg/95 backdrop-blur-md border-t border-border-secondary p-sm px-md flex items-center justify-between gap-sm shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="px-md py-2 rounded-corner-md text-xs font-semibold text-text-secondary hover:bg-surface-secondary-bg cursor-pointer"
        >
          Annuler
        </button>

        <div className="flex items-center gap-2">
          {missingFields.length > 0 && (
            <span className="text-[11px] font-semibold text-text-tertiary">
              {6 - missingFields.length}/6 requis
            </span>
          )}
          <Button
            variant="primary"
            size="medium"
            disabled={!isValid || epubUploading || coverUploading}
            onClick={handleSave}
            iconStart={
              epubUploading || coverUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )
            }
          >
            {epubUploading
              ? "Envoi ePub…"
              : coverUploading
                ? "Envoi image…"
                : book
                  ? "Enregistrer"
                  : "Créer le livre"}
          </Button>
        </div>
      </div>
    </div>
  )
}

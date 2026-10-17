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
      if (res && res.url) {
        setField("cover", res.url)
      }
    } catch (err: any) {
      console.error("[Cover upload error]", err)
      setCoverError(err?.message || "Erreur lors du téléversement de la couverture.")
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

  const [fileUrl, setFileUrl] = useState<string>(book?.file_url ?? "")
  const [epubFilename, setEpubFilename] = useState<string>(
    book?.epub_filename ?? (book ? `${book.slug || "livre"}.epub` : ""),
  )
  const [epubFileSize, setEpubFileSize] = useState<number>(book?.file_size ?? 0)
  const [epubFile, setEpubFile] = useState<{ name: string; size: string } | null>(
    book && (book.file_url || book.has_file)
      ? {
          name: book.epub_filename || `${book.slug || "livre"}.epub`,
          size: book.file_size
            ? `${(book.file_size / (1024 * 1024)).toFixed(1)} Mo`
            : "ePub 3",
        }
      : null,
  )

  const MAX_EPUB_SIZE = 50 * 1024 * 1024 // 50 Mo

  const handleEpubFile = async (file: File) => {
    setEpubError(null)
    const isEpub =
      file.name.toLowerCase().endsWith(".epub") || file.type === "application/epub+zip"
    if (!isEpub) {
      setEpubError(
        "Format non supporté. Seuls les fichiers au format .epub sont acceptés (Cahier des charges Phase 1).",
      )
      return
    }
    if (file.size > MAX_EPUB_SIZE) {
      setEpubError("Le fichier est trop lourd (50 Mo maximum).")
      return
    }

    setEpubUploading(true)
    setEpubProgress(20)
    setEpubStatusText("Lecture et transmission de l'ePub au serveur...")

    let progressVal = 20
    const progressInterval = setInterval(() => {
      if (progressVal < 55) {
        progressVal += 5
        setEpubProgress(progressVal)
        setEpubStatusText("Contrôle d'intégrité par le serveur...")
      }
    }, 180)

    try {
      const res = await uploadEpubApi(file)
      clearInterval(progressInterval)

      setEpubProgress(80)
      setEpubStatusText("Téléversement accéléré en cours...")
      await new Promise((r) => setTimeout(r, 200))
      setEpubProgress(100)
      setEpubStatusText("Fichier ePub validé par le serveur !")
      await new Promise((r) => setTimeout(r, 250))

      setFileUrl(res.file_url)
      setEpubFilename(res.filename || file.name)
      if (res.size_bytes) setEpubFileSize(res.size_bytes)
      const formattedSize =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} Mo`
          : `${Math.round(file.size / 1024)} Ko`
      setEpubFile({ name: res.filename || file.name, size: formattedSize })
    } catch (err: any) {
      clearInterval(progressInterval)
      console.error("[ePub upload error]", err)
      setEpubError(
        err?.message ||
          "Erreur lors du téléversement du fichier ePub. Veuillez vérifier le fichier.",
      )
      setEpubFile(null)
      setFileUrl("")
    } finally {
      setEpubUploading(false)
    }
  }

  // Liste des auteurs existants pour autocomplétion
  const existingAuthors = useMemo(() => {
    return Array.from(
      new Set(existingBooks.map((b) => b.author?.trim()).filter(Boolean)),
    ).sort()
  }, [existingBooks])

  // Ajout dynamique d'une nouvelle catégorie
  const handleAddNewCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newCategoryName.trim()
    if (!trimmed) return

    // Normaliser avec première lettre en majuscule
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1)

    if (!availableCategories.includes(formatted)) {
      setAvailableCategories((prev) => [...prev, formatted])
    }

    setField("category", formatted)
    setCategoryFeedback(`Catégorie « ${formatted} » ajoutée et sélectionnée !`)
    setNewCategoryName("")
    setIsAddingCategory(false)

    setTimeout(() => setCategoryFeedback(null), 4000)
  }

  // Validation
  const missingFields: string[] = []
  if (!form.title.trim()) missingFields.push("Titre")
  if (!form.author.trim()) missingFields.push("Auteur")
  if (!form.price || Number(form.price) <= 0) missingFields.push("Prix")
  if (!form.cover.trim()) missingFields.push("Couverture")
  if (!book && !fileUrl && !epubFile) missingFields.push("Fichier ePub")

  const isValid = missingFields.length === 0

  const handleSave = () => {
    if (!isValid || epubUploading || coverUploading) return

    const id =
      book?.id ??
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `book-${Date.now()}`)

    const description =
      form.description.trim() ||
      `Un titre de ${form.author.trim()} disponible en lecture en ligne sur YéYéBook.`

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
      file_size: epubFileSize || book?.file_size || undefined,
      description,
      chapters: book?.chapters ?? [],
      published: form.published,
    }

    onSave(finalBook)
  }

  return (
    <div className="min-h-screen bg-surface-secondary-bg flex flex-col animate-fade">
      {/* Barre supérieure d'actions sticky */}
      <header className="sticky top-0 z-40 bg-surface-bg/95 backdrop-blur-md border-b border-border-secondary shadow-xs">
        <div className="max-w-[1400px] mx-auto px-lg md:px-2xl h-[72px] flex items-center justify-between gap-lg">
          <div className="flex items-center gap-md min-w-0">
            <button
              onClick={onClose}
              type="button"
              className="inline-flex items-center gap-sm px-md py-sm rounded-corner-md text-label-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Retour au catalogue</span>
            </button>
            <div className="h-5 w-[1px] bg-border-secondary hidden sm:block" />
            <div className="min-w-0">
              <div className="flex items-center gap-sm">
                <span className="text-video-title font-semibold uppercase tracking-wider text-brand-primary">
                  {book ? "Édition de livre" : "Nouveau livre"}
                </span>
                {form.published ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-corner-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <Eye className="w-3 h-3" />
                    Public
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-corner-full bg-border-secondary text-text-secondary">
                    <EyeOff className="w-3 h-3" />
                    Brouillon
                  </span>
                )}
              </div>
              <h1 className="text-heading font-semibold text-text-primary truncate max-w-[400px] md:max-w-[600px]">
                {form.title.trim() || (book ? "Modifier le livre" : "Ajouter un titre au catalogue")}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-md shrink-0">
            <Button variant="neutral" onClick={onClose}>
              Annuler
            </Button>
            <Button
              variant="primary"
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
                    ? "Enregistrer les modifications"
                    : "Créer le titre"}
            </Button>
          </div>
        </div>
      </header>

      {/* Contenu principal de la page d'ajout/édition */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-lg md:px-2xl py-2xl">
        <div className="grid lg:grid-cols-[1.55fr_1fr] gap-2xl items-start">
          {/* Colonne Gauche : Données éditoriales et métadonnées */}
          <div className="flex flex-col gap-2xl">
            {/* Carte 1 : Informations principales */}
            <section className="rounded-corner-xl bg-surface-bg border border-border-secondary p-xl md:p-2xl shadow-xs">
              <div className="flex items-center gap-sm mb-xl">
                <span className="w-8 h-8 rounded-corner-md bg-brand-tertiary text-brand-primary flex items-center justify-center">
                  <BookText className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-title font-semibold text-text-primary">
                    Informations de l'œuvre
                  </h2>
                  <p className="text-video-title text-text-tertiary">
                    Titre, auteur et caractéristiques de l'édition.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-xl">
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
                    placeholder="ex: Une si longue lettre, Le fabuleux destin d'Amélie..."
                    className="w-full text-title font-medium rounded-corner-md border border-border-secondary bg-surface-bg px-xl py-md text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
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
                    className="w-full text-label-sm rounded-corner-md border border-border-secondary bg-surface-bg px-lg py-md text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/20 transition-all"
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
                    placeholder="ex: Mariama Bâ, Chinua Achebe, Ahmadou Kourouma..."
                    className="w-full text-label-sm font-medium rounded-corner-md border border-border-secondary bg-surface-bg px-lg py-md text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                  />
                  <datalist id="existing-authors-list">
                    {existingAuthors.map((authorName) => (
                      <option key={authorName} value={authorName} />
                    ))}
                  </datalist>
                  <p className="text-video-title text-text-tertiary mt-1">
                    Choisissez parmi les auteurs existants du catalogue ou tapez librement le nom d'un nouvel auteur.
                  </p>
                </div>

                {/* Grille 3 colonnes : Prix, Pages, Année */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg pt-sm">
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
                        value={form.price}
                        onChange={(e) => setField("price", e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="2500"
                        className="w-full text-label-sm font-semibold rounded-corner-md border border-border-secondary bg-surface-bg pl-lg pr-14 py-md text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all tabular-nums"
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
                      value={form.pages}
                      onChange={(e) => setField("pages", e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="165"
                      className="w-full text-label-sm rounded-corner-md border border-border-secondary bg-surface-bg px-lg py-md text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/20 transition-all tabular-nums"
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
                      value={form.year}
                      onChange={(e) => setField("year", e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="2026"
                      className="w-full text-label-sm rounded-corner-md border border-border-secondary bg-surface-bg px-lg py-md text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/20 transition-all tabular-nums"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Carte 2 : Catégorie & Classification avec Création Dynamique */}
            <section className="rounded-corner-xl bg-surface-bg border border-border-secondary p-xl md:p-2xl shadow-xs">
              <div className="flex items-center justify-between mb-lg">
                <div className="flex items-center gap-sm">
                  <span className="w-8 h-8 rounded-corner-md bg-brand-tertiary text-brand-primary flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-title font-semibold text-text-primary">
                      Catégorie de l'ouvrage <span className="text-brand-primary">*</span>
                    </h2>
                    <p className="text-video-title text-text-tertiary">
                      Sélectionnez une catégorie ou créez-en une nouvelle immédiatement pour ce livre.
                    </p>
                  </div>
                </div>

                {!isAddingCategory && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="inline-flex items-center gap-xs px-md py-sm rounded-corner-md bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white text-label-sm font-semibold transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Créer une catégorie</span>
                  </button>
                )}
              </div>

              {/* Message de confirmation de création d'une catégorie */}
              {categoryFeedback && (
                <div className="mb-lg p-md rounded-corner-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-label-sm flex items-center gap-sm animate-fade">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{categoryFeedback}</span>
                </div>
              )}

              {/* Formulaire dynamique d'ajout d'une nouvelle catégorie */}
              {isAddingCategory && (
                <div className="mb-xl p-lg rounded-corner-lg border-2 border-dashed border-brand-primary/40 bg-brand-tertiary/30 animate-fade">
                  <form onSubmit={handleAddNewCategory} className="flex flex-col gap-sm">
                    <p className="text-label-sm font-semibold text-text-primary flex items-center gap-xs">
                      <Sparkles className="w-4 h-4 text-brand-primary" />
                      Créer une nouvelle catégorie pour ce livre
                    </p>
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-sm">
                      <input
                        type="text"
                        autoFocus
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="ex: Philosophie, Essai, Biographie, Bande Dessinée, Art..."
                        className="flex-1 min-w-[220px] text-label-sm rounded-corner-md border border-border-secondary bg-surface-bg px-lg py-md text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        size="medium"
                        iconStart={<Check className="w-4 h-4" />}
                        disabled={!newCategoryName.trim()}
                      >
                        Créer & Sélectionner
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
                    <p className="text-video-title text-text-tertiary">
                      Cette catégorie sera immédiatement attribuée à ce livre et ajoutée à la liste des filtres.
                    </p>
                  </form>
                </div>
              )}

              {/* Badges de catégories sélectionnables */}
              <div
                className="flex flex-wrap gap-sm"
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
                      className={`inline-flex items-center gap-xs px-xl py-sm rounded-corner-full text-label-sm font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-brand-primary text-on-brand border-brand-primary shadow-xs scale-[1.02]"
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
            <section className="rounded-corner-xl bg-surface-bg border border-border-secondary p-xl md:p-2xl shadow-xs">
              <div className="flex items-center justify-between mb-md">
                <div>
                  <h2 className="text-title font-semibold text-text-primary">
                    Description & Synopsis de l'œuvre
                  </h2>
                  <p className="text-video-title text-text-tertiary">
                    Présentez l'intrigue et donnez envie aux lecteurs de commencer la lecture.
                  </p>
                </div>
                <span className="text-video-title text-text-tertiary tabular-nums">
                  {form.description.length} caractères
                </span>
              </div>

              <textarea
                id="book-description-editor"
                rows={7}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Rédigez ici le résumé officiel ou la quatrième de couverture de l'ouvrage..."
                className="w-full rounded-corner-lg border border-border-secondary bg-surface-bg px-xl py-lg text-label-sm text-text-primary placeholder:text-text-tertiary resize-y focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all leading-relaxed"
              />
            </section>

            {/* Carte 4 : Visibilité & Statut */}
            <section className="rounded-corner-xl bg-surface-bg border border-border-secondary p-xl md:p-2xl shadow-xs">
              <h2 className="text-title font-semibold text-text-primary mb-xs">
                Statut de diffusion
              </h2>
              <p className="text-video-title text-text-tertiary mb-lg">
                Définissez si ce livre doit être rendu immédiatement accessible au public.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
                <button
                  type="button"
                  onClick={() => setField("published", true)}
                  aria-pressed={form.published}
                  className={`flex items-start gap-md p-lg rounded-corner-lg border text-left transition-all cursor-pointer ${
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
                  <div>
                    <p className="text-label-sm font-semibold text-text-primary">
                      Publié immédiatement
                    </p>
                    <p className="text-video-title text-text-secondary mt-0.5">
                      Visible dans le catalogue public et disponible à l'achat par les clients.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setField("published", false)}
                  aria-pressed={!form.published}
                  className={`flex items-start gap-md p-lg rounded-corner-lg border text-left transition-all cursor-pointer ${
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
                  <div>
                    <p className="text-label-sm font-semibold text-text-primary">
                      Enregistrer comme brouillon
                    </p>
                    <p className="text-video-title text-text-secondary mt-0.5">
                      Masqué du catalogue public, visible uniquement dans votre console admin.
                    </p>
                  </div>
                </button>
              </div>
            </section>
          </div>

          {/* Colonne Droite : Couverture, Fichier ePub et Synthèse */}
          <div className="flex flex-col gap-2xl sticky top-[92px]">
            {/* Carte 5 : Couverture du livre */}
            <section className="rounded-corner-xl bg-surface-bg border border-border-secondary p-xl shadow-xs">
              <div className="flex items-center justify-between mb-md">
                <div>
                  <h3 className="text-label font-semibold text-text-primary">
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
                  className="text-video-title font-semibold text-brand-primary hover:underline cursor-pointer"
                >
                  {useUrlMode ? "Glisser-déposer un fichier" : "Saisir une URL"}
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
                    className="w-full text-label-sm rounded-corner-md border border-border-secondary bg-surface-bg px-lg py-md text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none"
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
                      <div className="w-36 h-52 rounded-corner-md overflow-hidden bg-brand-tertiary border border-border-secondary shadow-md relative group">
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
                          className="text-label-sm text-brand-primary font-semibold hover:underline cursor-pointer"
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
                          className="text-label-sm text-danger hover:underline cursor-pointer inline-flex items-center gap-1"
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
                      className={`border-2 border-dashed rounded-corner-xl p-2xl flex flex-col items-center justify-center gap-sm text-center cursor-pointer transition-all ${
                        isDraggingCover
                          ? "border-brand-primary bg-brand-primary/10 scale-[1.02]"
                          : "border-border-primary bg-surface-secondary-bg/40 hover:bg-surface-secondary-bg hover:border-brand-primary"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-corner-full bg-brand-tertiary text-brand-primary flex items-center justify-center">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-label-sm font-semibold text-text-primary">
                          Glissez-déposez l'image de couverture
                        </p>
                        <p className="text-video-title text-text-secondary mt-0.5">
                          ou <span className="text-brand-primary underline font-medium">parcourez vos fichiers</span>
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
            <section className="rounded-corner-xl bg-surface-bg border border-border-secondary p-xl shadow-xs">
              <div className="flex items-center justify-between mb-sm">
                <h3 className="text-label font-semibold text-text-primary">
                  Fichier ePub numérique <span className="text-brand-primary">*</span>
                </h3>
                <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                  Phase 1 · ePub 3
                </span>
              </div>
              <p className="text-video-title text-text-tertiary mb-md">
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
                <div className="p-xl rounded-corner-lg border border-brand-primary/40 bg-surface-secondary-bg flex flex-col gap-sm animate-fade">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-xs">
                      <BookOpen className="w-4 h-4 text-brand-primary animate-pulse" />
                      <span className="text-label-sm font-semibold text-text-primary">
                        Téléversement de l'ePub...
                      </span>
                    </div>
                    <span className="text-label-sm font-bold text-brand-primary tabular-nums">
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
                <div className="flex items-center gap-md p-lg rounded-corner-lg border border-emerald-500/30 bg-emerald-500/5">
                  <div className="w-10 h-10 rounded-corner-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-xs">
                      <p className="text-label-sm font-semibold text-text-primary truncate">
                        {epubFile.name}
                      </p>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
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
                      Remplacer
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
                /* Zone de dépôt ePub */
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
                  className={`border-2 border-dashed rounded-corner-xl p-xl flex flex-col items-center justify-center gap-sm text-center cursor-pointer transition-all ${
                    isDraggingEpub
                      ? "border-brand-primary bg-brand-primary/10 scale-[1.02]"
                      : "border-border-primary bg-surface-secondary-bg/40 hover:bg-surface-secondary-bg hover:border-brand-primary"
                  }`}
                >
                  <div className="w-10 h-10 rounded-corner-full bg-brand-tertiary text-brand-primary flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-label-sm font-semibold text-text-primary">
                      Glissez-déposez le fichier .epub ici
                    </p>
                    <p className="text-video-title text-text-secondary mt-0.5">
                      ou <span className="text-brand-primary underline font-medium">parcourez vos fichiers</span>
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
            <section className="rounded-corner-xl bg-surface-bg border border-border-secondary p-lg shadow-xs">
              <h4 className="text-label-sm font-semibold text-text-primary mb-sm flex items-center gap-xs">
                <Info className="w-4 h-4 text-brand-primary" />
                Vérification des éléments requis
              </h4>

              <ul className="flex flex-col gap-xs text-video-title">
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
                    Catégorie sélectionnée ({form.category})
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
                <div className="mt-md p-sm rounded-corner-md bg-brand-primary/5 border border-brand-primary/20 text-video-title text-brand-primary">
                  Éléments manquants : {missingFields.join(", ")}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

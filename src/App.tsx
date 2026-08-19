import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import {
  Avatar,
  SearchComponent,
  Button,
  Badge,
  Toast,
  InputField,
} from "@figma/astraui"
import ybookSymbol from "@/imports/ybook-symbol-primary-1024px.png"
import faviconPng from "@/imports/ybook-favicon-180x180.png"
import { Wordmark } from "@/components/brand/Wordmark"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { RegisterPage } from "@/features/auth/pages/RegisterPage"
import { AuthGuard } from "@/features/auth/components/AuthGuard"
import { RoleGuard } from "@/features/auth/components/RoleGuard"
import {
  forgotPassword,
  getCurrentUser,
  logout,
} from "@/features/auth/auth.api"
import { getPreviewSession } from "@/features/auth/auth.session"
import type { AuthApiResponse, AuthUser } from "@/features/auth/types"
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import type { DashboardBook } from "@/features/dashboard/types"
import { loadCart, MAX_CART_QUANTITY, saveCart } from "@/features/cart"
import type { CartItem } from "@/features/cart"
import { CatalogPage } from "@/features/catalog/pages/CatalogPage"
import {
  buildChapters,
  PREVIEW_BOOKS,
} from "@/features/catalog/catalog.preview"
import { CATALOG_CATEGORIES } from "@/features/catalog/catalog.constants"
import { formatPrice, handleCoverError } from "@/features/catalog/catalog.utils"
import { BookCard } from "@/features/catalog/components/BookCard"
import { RatingStars } from "@/features/catalog/components/RatingStars"
import type { Book } from "@/features/catalog/types"
import {
  ShoppingBag,
  ChevronLeft,
  Trash2,
  Plus,
  Minus,
  X,
  Star,
  BookOpen,
  Check,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  BookText,
  List,
  RotateCcw,
  ChevronRight,
  LayoutDashboard,
  LayoutGrid,
  Library as LibraryIcon,
  ClipboardList,
  Pencil,
  TrendingUp,
  Wallet,
  Eye,
  EyeOff,
  LogOut,
  Heart,
  Share2,
  Settings,
  Bookmark,
  Landmark,
  Feather,
  Sparkles,
} from "lucide-react"

type View = "home" | "catalog" | "details" | "checkout" | "confirmation" | "library" | "reader" | "admin" | "login" | "register" | "dashboard"
type ToastState = {
  message: string
  variant: "default" | "success" | "error" | "warning"
} | null
type Progress = Record<number, number>
type OrderStatus = "paid" | "pending" | "refunded"
type Order = {
  id: string
  customer: string
  email?: string
  phone: string
  provider: string
  items: CartItem[]
  total: number
  date: string
  status: OrderStatus
}
type CheckoutDetails = {
  name: string
  email: string
  phone: string
  provider: string
}

type NavLink = {
  label: string
  view: View
}
type ReaderTone = {
  ink: string
  sub: string
}
type OrderStatusMeta = {
  label: string
  className: string
}
type SalesBucket = {
  label: string
  value: number
}
type AdminNavItem = {
  id: AdminTab
  label: string
  icon: ReactNode
}

const PROVIDER_LABELS: Record<string, string> = {
  orange: "Orange Money",
  mtn: "MTN MoMo",
  wave: "Wave",
  moov: "Moov Money",
}

/** A short, realistic order history so the back-office is populated on first load. */
const SEED_ORDERS: Order[] = [
  {
    id: "YB-2418",
    customer: "Aminata Diallo",
    phone: "+225 07 21 44 08",
    provider: "orange",
    items: [
      { bookId: 4, quantity: 1 },
      { bookId: 2, quantity: 1 },
    ],
    total: 5500,
    date: "2026-08-14",
    status: "paid",
  },
  {
    id: "YB-2417",
    customer: "Kofi Mensah",
    phone: "+233 24 55 12 90",
    provider: "mtn",
    items: [{ bookId: 1, quantity: 1 }],
    total: 2500,
    date: "2026-08-14",
    status: "paid",
  },
  {
    id: "YB-2416",
    customer: "Fatou Ndiaye",
    phone: "+221 77 902 33 71",
    provider: "wave",
    items: [
      { bookId: 5, quantity: 1 },
      { bookId: 8, quantity: 1 },
    ],
    total: 5000,
    date: "2026-08-13",
    status: "pending",
  },
  {
    id: "YB-2415",
    customer: "Ibrahim Traoré",
    phone: "+226 70 18 62 05",
    provider: "moov",
    items: [{ bookId: 3, quantity: 1 }],
    total: 2000,
    date: "2026-08-12",
    status: "paid",
  },
  {
    id: "YB-2414",
    customer: "Chantal Nguema",
    phone: "+241 06 44 12 88",
    provider: "orange",
    items: [{ bookId: 7, quantity: 1 }],
    total: 2700,
    date: "2026-08-11",
    status: "refunded",
  },
  {
    id: "YB-2413",
    customer: "Yacouba Cissé",
    phone: "+225 05 66 90 41",
    provider: "orange",
    items: [
      { bookId: 6, quantity: 1 },
      { bookId: 4, quantity: 1 },
    ],
    total: 5300,
    date: "2026-08-10",
    status: "paid",
  },
]

const PROGRESS_KEY = "ybook-reading-progress"

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    return raw ? JSON.parse(raw) as Progress : {}
  } catch {
    return {}
  }
}

export default function App() {
  const [view, setView] = useState<View>("home")
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(() =>
    getPreviewSession(),
  )
  const [sessionChecked, setSessionChecked] = useState(false)
  const [books, setBooks] = useState<Book[]>(PREVIEW_BOOKS)
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS)
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadCart())
  const [library, setLibrary] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("Tous")
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)

  const [libGrid, setLibGrid] = useState(true)

  // Fiche produit — active tab + wishlist
  const [productTab, setProductTab] =
    useState<"description" | "reviews" | "author">("description")
  const [wishlist, setWishlist] = useState<number[]>([])

  // Lecteur — réglages de lecture (thème, taille, interligne)
  const [readerTheme, setReaderTheme] = useState<"light" | "sepia" | "dark">(
    "light",
  )
  const [readerFont, setReaderFont] = useState(21)
  const [readerLeading, setReaderLeading] = useState(1.75)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [bookmarks, setBookmarks] = useState<Record<number, number[]>>({})

  // Reader state
  const [readerBookId, setReaderBookId] = useState<number | null>(null)
  const [currentChapter, setCurrentChapter] = useState(0)
  const [chapterListOpen, setChapterListOpen] = useState(false)
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const [resumePrompt, setResumePrompt] = useState<{
    book: Book
    chapter: number
  } | null>(null)

  const selectedBook = useMemo(
    () => books.find((b) => b.id === selectedBookId),
    [books, selectedBookId],
  )
  const readerBook = useMemo(
    () => books.find((b) => b.id === readerBookId),
    [books, readerBookId],
  )

  const cartTotal = useMemo(
    () =>
      cartItems.reduce((total, item) => {
        const book = books.find((b) => b.id === item.bookId)
        return total + (book ? book.price * item.quantity : 0)
      }, 0),
    [books, cartItems],
  )
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0)

  useEffect(() => {
    let active = true
    void getCurrentUser()
      .then((user) => {
        if (!active) return
        setSessionUser(user)
      })
      .catch(() => {
        if (!active) return
        setSessionUser(null)
      })
      .finally(() => {
        if (active) setSessionChecked(true)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [view, selectedBookId])

  // Persist the guest/user cart locally until the cart API is connected.
  useEffect(() => {
    saveCart(cartItems)
  }, [cartItems])

  // Persist reading progress
  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
    } catch {
      /* storage unavailable — progress stays in-memory */
    }
  }, [progress])

  // Wire the YéYéBook favicon + document title (index.html keeps Figma placeholders)
  useEffect(() => {
    document.title = "YéYéBook — Le nouveau souffle de la littérature africaine"
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
    if (!link) {
      link = document.createElement("link")
      link.rel = "icon"
      document.head.appendChild(link)
    }
    link.type = "image/png"
    link.href = faviconPng
  }, [])

  const go = useCallback((next: View) => setView(next), [])

  const openBook = (id: number) => {
    setSelectedBookId(id)
    setView("details")
  }

  const openCatalog = (category?: string) => {
    setActiveCategory(category ?? "Tous")
    setView("catalog")
  }

  const addToCart = (bookId: number) => {
    const existing = cartItems.find((item) => item.bookId === bookId)
    const book = books.find((b) => b.id === bookId)

    if (existing && existing.quantity >= MAX_CART_QUANTITY) {
      setToast({
        message: "La quantité maximale de ce livre est de 5 exemplaires.",
        variant: "warning",
      })
      setCartOpen(true)
      return
    }

    setCartItems((prev) => {
      const current = prev.find((item) => item.bookId === bookId)
      if (current) {
        return prev.map((item) =>
          item.bookId === bookId
            ? {
                ...item,
                quantity: Math.min(MAX_CART_QUANTITY, item.quantity + 1),
              }
            : item,
        )
      }
      return [...prev, { bookId, quantity: 1 }]
    })
    setToast({
      message: `« ${book?.title ?? "Livre"} » ajouté au panier`,
      variant: "success",
    })
    setCartOpen(true)
  }

  const addDashboardBookToCart = (book: DashboardBook) => {
    const localBook = books.find((item) => item.id === book.id)
    if (!localBook) {
      setToast({
        message: "La fiche complète doit être chargée depuis le catalogue.",
        variant: "warning",
      })
      return
    }
    addToCart(localBook.id)
  }

  const updateQty = (bookId: number, delta: number) =>
    setCartItems((prev) =>
      prev
        .map((i) =>
          i.bookId === bookId
            ? {
                ...i,
                quantity: Math.min(
                  MAX_CART_QUANTITY,
                  Math.max(0, i.quantity + delta),
                ),
              }
            : i,
        )
        .filter((i) => i.quantity > 0),
    )

  const removeItem = (bookId: number) =>
    setCartItems((prev) => prev.filter((i) => i.bookId !== bookId))

  const placeOrder = (details: CheckoutDetails) => {
    const order: Order = {
      id: `YB-${2419 + orders.length}`,
      customer: details.name.trim() || "Client",
      email: details.email.trim(),
      phone: details.phone.trim(),
      provider: details.provider,
      items: cartItems,
      total: cartTotal,
      date: new Date().toISOString().slice(0, 10),
      status: "paid",
    }
    setOrders((prev) => [order, ...prev])
    setLibrary((prev) =>
      Array.from(new Set([...prev, ...cartItems.map((i) => i.bookId)])),
    )
    setCartItems([])
    setView("confirmation")
    setToast({
      message: "Paiement confirmé — bonne lecture !",
      variant: "success",
    })
  }

  // ---- Admin (Phase 1 back-office) --------------------------------------
  const saveBook = (book: Book) => {
    setBooks((prev) => {
      const exists = prev.some((b) => b.id === book.id)
      if (exists) return prev.map((b) => (b.id === book.id ? book : b))
      return [book, ...prev]
    })
    setToast({ message: `« ${book.title} » enregistré`, variant: "success" })
  }

  const deleteBook = (id: number) => {
    const book = books.find((b) => b.id === id)
    setBooks((prev) => prev.filter((b) => b.id !== id))
    setCartItems((prev) => prev.filter((item) => item.bookId !== id))
    setToast({
      message: `« ${book?.title ?? "Titre"} » supprimé du catalogue`,
      variant: "warning",
    })
  }

  const togglePublish = (id: number) => {
    setBooks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, published: b.published === false } : b,
      ),
    )
  }

  const setOrderStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
  }

  // ---- Reading ----------------------------------------------------------
  const startReading = (bookId: number) => {
    const book = books.find((b) => b.id === bookId)
    if (!book) return
    const saved = progress[bookId]
    if (saved !== undefined && saved > 0) {
      // Offer to resume where the reader left off.
      setResumePrompt({ book, chapter: saved })
      return
    }
    openReaderAt(bookId, saved ?? 0)
  }

  const openReaderAt = (bookId: number, chapter: number) => {
    setReaderBookId(bookId)
    setCurrentChapter(chapter)
    setChapterListOpen(false)
    setResumePrompt(null)
    setView("reader")
    setProgress((prev) => ({ ...prev, [bookId]: chapter }))
  }

  const goToChapter = (index: number) => {
    if (!readerBook) return
    const clamped = Math.max(0, Math.min(index, readerBook.chapters.length - 1))
    setCurrentChapter(clamped)
    setChapterListOpen(false)
    setProgress((prev) => ({ ...prev, [readerBook.id]: clamped }))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const visibleBooks = books.filter((b) => b.published !== false)
  const featured = visibleBooks[1] ?? visibleBooks[0]
  const heroCovers = visibleBooks.slice(0, 3)
  const newReleases = visibleBooks.slice(0, 8)
  const bestSellers = [...visibleBooks]
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, 10)
  const relatedBooks = selectedBook
    ? visibleBooks
        .filter(
          (b) =>
            b.category === selectedBook.category && b.id !== selectedBook.id,
        )
        .slice(0, 4)
    : []
  const libraryBooks = books.filter((b) => library.includes(b.id))
  const ownsSelected = selectedBook ? library.includes(selectedBook.id) : false

  const navLinks: NavLink[] = [
    { label: "Accueil", view: "home" },
    { label: "Catalogue", view: "catalog" },
    { label: "Ma bibliothèque", view: "library" },
  ]

  const showAuthError = (message: string) =>
    setToast({ message, variant: "error" })
  const showComingSoon = (label: string) =>
    setToast({
      message: `La page « ${label} » sera disponible dans une prochaine version.`,
      variant: "default",
    })
  const handleAuthenticated = (response: AuthApiResponse) => {
    if (!response.user) {
      showAuthError("La session n’a pas pu être initialisée.")
      return
    }
    setSessionUser(response.user)
    setToast({ message: response.message, variant: "success" })
    setView("dashboard")
  }
  const handleLogout = async () => {
    await logout()
    setSessionUser(null)
    setView("home")
    setToast({ message: "Vous êtes déconnecté·e.", variant: "default" })
  }
  const redirectToLogin = useCallback(() => go("login"), [go])
  const redirectUnauthorized = useCallback(() => {
    setToast({
      message: "Vous n’avez pas les permissions pour accéder à cet espace.",
      variant: "error",
    })
    go("home")
  }, [go])
  const protectedViews: View[] = ["library", "reader", "admin"]

  if (protectedViews.includes(view) && (!sessionChecked || !sessionUser)) {
    return (
      <AuthGuard
        user={sessionUser}
        checking={!sessionChecked}
        onUnauthenticated={redirectToLogin}
      >
        {null}
      </AuthGuard>
    )
  }

  // ---- Auth gets its own focused chrome ----------------------------------
  if (view === "login") {
    return (
      <>
        <LoginPage
          onBack={() => go("home")}
          onRegister={() => go("register")}
          onSuccess={handleAuthenticated}
          onError={showAuthError}
          onForgotPassword={(email) => {
            if (!email.trim()) {
              showAuthError("Saisissez votre e-mail avant de continuer.")
              return
            }
            void forgotPassword(email)
              .then((message) => setToast({ message, variant: "default" }))
              .catch((error) =>
                showAuthError(
                  error instanceof Error
                    ? error.message
                    : "Impossible de lancer la récupération.",
                ),
              )
          }}
        />
        {toast && (
          <Toast
            message={toast.message}
            variant={toast.variant}
            onDismiss={() => setToast(null)}
          />
        )}
      </>
    )
  }

  if (view === "register") {
    return (
      <>
        <RegisterPage
          onBack={() => go("home")}
          onLogin={() => go("login")}
          onSuccess={handleAuthenticated}
          onError={showAuthError}
        />
        {toast && (
          <Toast
            message={toast.message}
            variant={toast.variant}
            onDismiss={() => setToast(null)}
          />
        )}
      </>
    )
  }

  // ---- Admin gets its own full-screen chrome ----------------------------
  if (view === "dashboard") {
    return (
      <AuthGuard
        user={sessionUser}
        checking={!sessionChecked}
        onUnauthenticated={redirectToLogin}
      >
        {sessionUser ? (
          <DashboardPage
            user={sessionUser}
            onHome={() => go("home")}
            onCatalog={() => go("catalog")}
            onLibrary={() => go("library")}
            onLogout={() => void handleLogout()}
            onOpenBook={openBook}
            onAddToCart={addDashboardBookToCart}
            onToast={(message) => setToast({ message, variant: "success" })}
          />
        ) : null}
      </AuthGuard>
    )
  }

  if (view === "admin") {
    return (
      <RoleGuard
        user={sessionUser}
        checking={!sessionChecked}
        allowedRoles={["admin", "super_admin", "moderator"]}
        onUnauthorized={redirectUnauthorized}
      >
        <>
          <AdminView
            books={books}
            orders={orders}
            onSaveBook={saveBook}
            onDeleteBook={deleteBook}
            onTogglePublish={togglePublish}
            onSetOrderStatus={setOrderStatus}
            onExit={() => go("home")}
          />
          {toast && (
            <div
              className="fixed bottom-xl left-1/2 -translate-x-1/2 z-[80] animate-rise"
              role="status"
              aria-live="polite"
            >
              <Toast
                message={toast.message}
                variant={toast.variant}
                onDismiss={() => setToast(null)}
              />
            </div>
          )}
        </>
      </RoleGuard>
    )
  }

  // ---- Immersive reader gets its own full-screen chrome -----------------
  if (view === "reader" && readerBook) {
    const chapter = readerBook.chapters[currentChapter]
    const total = readerBook.chapters.length
    const pct = Math.round(((currentChapter + 1) / total) * 100)

    // Reading themes — parchment/sepia/ink palettes applied to the pane only.
    const themes = {
      light: {
        page: "#fff6eb",
        ink: "#100908",
        sub: "#6b615c",
        rule: "#c1b5ac66",
        panel: "#fffdf9",
      },
      sepia: {
        page: "#f6ecd6",
        ink: "#432d16",
        sub: "#8a7048",
        rule: "#432d1622",
        panel: "#efe2c6",
      },
      dark: {
        page: "#171015",
        ink: "#ece2e6",
        sub: "#9a8890",
        rule: "#ffffff1a",
        panel: "#241820",
      },
    } as const
    const t = themes[readerTheme]
    const bookmarked = (bookmarks[readerBook.id] ?? []).includes(currentChapter)
    const toggleBookmark = () =>
      setBookmarks((prev) => {
        const list = prev[readerBook.id] ?? []
        const next = list.includes(currentChapter)
          ? list.filter((c) => c !== currentChapter)
          : [...list, currentChapter]
        return { ...prev, [readerBook.id]: next }
      })

    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: t.page }}
      >
        {/* Reader toolbar — dark plum chrome, consistent across themes */}
        <header className="sticky top-0 z-40 bg-[#1a0f0c] text-white">
          <div className="max-w-[1280px] mx-auto px-lg md:px-2xl h-[60px] flex items-center gap-lg">
            <button
              onClick={() => go("library")}
              className="inline-flex items-center gap-sm text-label-sm font-medium text-white/85 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />{" "}
              Bibliothèque
            </button>
            <div className="min-w-0 flex-1 text-center">
              <p className="text-label-sm font-semibold text-white truncate">
                {readerBook.title}
              </p>
              <p className="text-video-title text-white/55 truncate">
                {readerBook.author}
              </p>
            </div>
            <div className="flex items-center gap-xs">
              <button
                onClick={toggleBookmark}
                aria-pressed={bookmarked}
                aria-label={
                  bookmarked ? "Retirer le signet" : "Ajouter un signet"
                }
                className="inline-flex items-center justify-center w-9 h-9 rounded-corner-full text-white/85 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Bookmark
                  className={`w-[18px] h-[18px] ${
                    bookmarked ? "fill-current text-brand-secondary" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>
              <button
                onClick={() => setSettingsOpen((v) => !v)}
                aria-pressed={settingsOpen}
                aria-label="Réglages de lecture"
                className={`inline-flex items-center justify-center w-9 h-9 rounded-corner-full transition-colors cursor-pointer ${
                  settingsOpen
                    ? "bg-white/15 text-white"
                    : "text-white/85 hover:bg-white/10"
                }`}
              >
                <Settings className="w-[18px] h-[18px]" aria-hidden="true" />
              </button>
              <button
                onClick={() => setChapterListOpen(true)}
                className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-corner-full text-white/85 hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Ouvrir la liste des chapitres"
              >
                <List className="w-[18px] h-[18px]" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Settings panel */}
          {settingsOpen && (
            <div className="absolute right-2 md:right-6 top-[64px] w-[300px] max-w-[calc(100vw-16px)] rounded-corner-lg border border-border-secondary bg-surface-bg text-text-primary shadow-2xl p-xl animate-rise z-50">
              <p className="text-label-sm font-semibold mb-md">Thème</p>
              <div className="grid grid-cols-3 gap-sm mb-xl">
                {([
                  { key: "light", label: "Clair", swatch: "#ffffff" },
                  { key: "sepia", label: "Sépia", swatch: "#f6ecd6" },
                  { key: "dark", label: "Sombre", swatch: "#171015" },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setReaderTheme(opt.key)}
                    aria-pressed={readerTheme === opt.key}
                    className={`flex flex-col items-center gap-xs py-md rounded-corner-md border transition-colors cursor-pointer ${
                      readerTheme === opt.key
                        ? "border-brand-primary bg-surface-hover"
                        : "border-border-secondary hover:bg-surface-hover"
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-corner-full border border-border-primary"
                      style={{ backgroundColor: opt.swatch }}
                    />
                    <span className="text-video-title font-medium">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mb-sm">
                <label
                  htmlFor="reader-font"
                  className="text-label-sm font-semibold"
                >
                  Taille du texte
                </label>
                <span className="text-video-title text-text-tertiary">
                  {readerFont}px
                </span>
              </div>
              <input
                id="reader-font"
                type="range"
                min={16}
                max={28}
                step={1}
                value={readerFont}
                onChange={(e) => setReaderFont(Number(e.target.value))}
                className="w-full accent-[#e04070] cursor-pointer mb-xl"
              />

              <p className="text-label-sm font-semibold mb-sm">Interligne</p>
              <div className="grid grid-cols-3 gap-sm">
                {([
                  { v: 1.5, label: "Serré" },
                  { v: 1.75, label: "Normal" },
                  { v: 2.1, label: "Aéré" },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setReaderLeading(opt.v)}
                    aria-pressed={readerLeading === opt.v}
                    className={`py-sm rounded-corner-md border text-video-title font-medium transition-colors cursor-pointer ${
                      readerLeading === opt.v
                        ? "border-brand-primary bg-surface-hover"
                        : "border-border-secondary hover:bg-surface-hover"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        <div className="flex-1 w-full max-w-[1280px] mx-auto grid lg:grid-cols-[280px_1fr]">
          {/* Chapter sidebar (desktop) */}
          <aside
            className="hidden lg:block py-2xl pr-lg sticky top-[61px] self-start max-h-[calc(100vh-61px)] overflow-y-auto"
            style={{ borderRight: `1px solid ${t.rule}` }}
          >
            <ChapterList
              book={readerBook}
              current={currentChapter}
              onSelect={goToChapter}
              bookmarks={bookmarks[readerBook.id] ?? []}
              tone={{ ink: t.ink, sub: t.sub }}
            />
          </aside>

          {/* Reading pane */}
          <main
            id="main"
            className="px-xl md:px-4xl py-3xl md:py-4xl pb-5xl animate-fade"
          >
            <article className="max-w-[68ch] mx-auto">
              <p className="text-video-title uppercase tracking-widest text-brand-primary font-semibold">
                Chapitre {currentChapter + 1} · {total}
              </p>
              <h1
                className="font-reading text-[34px] md:text-[44px] leading-[1.1] mt-sm mb-2xl"
                style={{ color: t.ink }}
              >
                {chapter.title}
              </h1>
              <div
                className="prose-reader font-reading"
                style={{
                  color: t.ink,
                  fontSize: `${readerFont}px`,
                  lineHeight: readerLeading,
                }}
              >
                {chapter.content.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {/* Chapter navigation */}
              <nav
                className="flex items-center justify-between gap-lg mt-4xl pt-2xl"
                style={{ borderTop: `1px solid ${t.rule}` }}
                aria-label="Navigation entre les chapitres"
              >
                <Button
                  variant="neutral"
                  iconStart={<ChevronLeft className="w-4 h-4" />}
                  disabled={currentChapter === 0}
                  onClick={() => goToChapter(currentChapter - 1)}
                >
                  Précédent
                </Button>
                <span
                  className="text-label-sm hidden sm:inline"
                  style={{ color: t.sub }}
                >
                  {currentChapter + 1} / {total}
                </span>
                {currentChapter < total - 1 ? (
                  <Button
                    variant="primary"
                    iconEnd={<ChevronRight className="w-4 h-4" />}
                    onClick={() => goToChapter(currentChapter + 1)}
                  >
                    Suivant
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    iconEnd={<Check className="w-4 h-4" />}
                    onClick={() => go("library")}
                  >
                    Terminer
                  </Button>
                )}
              </nav>
            </article>
          </main>
        </div>

        {/* Bottom reading progress bar with page count */}
        <div
          className="sticky bottom-0 z-40 backdrop-blur-xl"
          style={{
            backgroundColor: `${t.panel}e6`,
            borderTop: `1px solid ${t.rule}`,
          }}
        >
          <div className="max-w-[1280px] mx-auto px-lg md:px-2xl h-[52px] flex items-center gap-lg">
            <span
              className="text-video-title font-medium shrink-0"
              style={{ color: t.sub }}
            >
              {pct}%
            </span>
            <div
              className="flex-1 h-1.5 rounded-corner-full overflow-hidden"
              style={{ backgroundColor: t.rule }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progression de lecture"
            >
              <div
                className="h-full bg-brand-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span
              className="text-video-title font-medium shrink-0 tabular-nums"
              style={{ color: t.sub }}
            >
              Chapitre {currentChapter + 1} / {total}
            </span>
          </div>
        </div>

        {/* Chapter drawer (mobile) */}
        {chapterListOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="absolute inset-0 bg-[#100908]/40 animate-fade"
              onClick={() => setChapterListOpen(false)}
            />
            <aside
              className="relative w-[86%] max-w-[340px] h-full shadow-2xl flex flex-col animate-slide-in p-xl overflow-y-auto"
              style={{ backgroundColor: t.page }}
            >
              <div className="flex items-center justify-between mb-lg">
                <h2
                  className="text-heading font-semibold"
                  style={{ color: t.ink }}
                >
                  Chapitres
                </h2>
                <button
                  onClick={() => setChapterListOpen(false)}
                  aria-label="Fermer"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-corner-full hover:bg-surface-hover cursor-pointer"
                  style={{ color: t.sub }}
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <ChapterList
                book={readerBook}
                current={currentChapter}
                onSelect={goToChapter}
                bookmarks={bookmarks[readerBook.id] ?? []}
                tone={{ ink: t.ink, sub: t.sub }}
              />
            </aside>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-xl left-1/2 -translate-x-1/2 z-[60] animate-rise">
            <Toast
              message={toast.message}
              variant={toast.variant}
              onDismiss={() => setToast(null)}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-secondary-bg">
      <a
        href="#main"
        className="skip-link bg-brand-primary text-on-brand px-lg py-md rounded-corner-md text-label-sm font-semibold"
      >
        Aller au contenu principal
      </a>

      {/* Top navigation — horizontal navbar (no sidebar), sticky and premium */}
      <header className="sticky top-0 z-40 bg-surface-bg/85 backdrop-blur-xl border-b border-border-secondary">
        <div className="max-w-[1320px] mx-auto px-xl md:px-2xl h-[72px] flex items-center gap-2xl">
          <button
            onClick={() => go("home")}
            className="flex items-center gap-md cursor-pointer hover:opacity-80 transition-opacity shrink-0"
            aria-label="YéYéBook — accueil"
          >
            <Wordmark className="h-8 w-auto" />
          </button>

          <nav
            className="hidden lg:flex items-center gap-xs"
            aria-label="Navigation principale"
          >
            {navLinks.map((link) => {
              const active = view === link.view
              return (
                <button
                  key={link.label}
                  onClick={() =>
                    link.view === "catalog" ? openCatalog() : go(link.view)
                  }
                  aria-current={active ? "page" : undefined}
                  className={`px-lg py-sm rounded-corner-full text-label-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? "text-on-brand bg-brand-primary"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                  }`}
                >
                  {link.label}
                </button>
              )
            })}
          </nav>

          <div className="flex-1 max-w-[420px] hidden md:block">
            <SearchComponent
              placeholder="Rechercher un titre, un auteur…"
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              onSearch={() => openCatalog()}
            />
          </div>

          <div className="flex items-center gap-lg ml-auto md:ml-0">
            <button
              onClick={() => setCartOpen(true)}
              aria-label={`Ouvrir le panier${
                cartCount > 0
                  ? ` (${cartCount} article${cartCount > 1 ? "s" : ""})`
                  : ""
              }`}
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-corner-full text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <ShoppingBag
                className="w-5 h-5"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-corner-full bg-brand-primary text-on-brand text-[11px] font-bold leading-none">
                  {cartCount}
                </span>
              )}
            </button>
            <div className="hidden items-center gap-sm lg:flex">
              {sessionUser ? (
                <button
                  type="button"
                  onClick={() => go("dashboard")}
                  className="cursor-pointer rounded-corner-full bg-brand-primary px-lg py-sm text-label-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover"
                >
                  Mon espace
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => go("login")}
                    className="cursor-pointer rounded-corner-full px-lg py-sm text-label-sm font-semibold text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                  >
                    Se connecter
                  </button>
                  <button
                    type="button"
                    onClick={() => go("register")}
                    className="cursor-pointer rounded-corner-full bg-brand-primary px-lg py-sm text-label-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover"
                  >
                    Créer un compte
                  </button>
                </>
              )}
            </div>
            <div className="w-px h-6 bg-border-secondary hidden sm:block" />
            <button
              type="button"
              onClick={() => go(sessionUser ? "dashboard" : "login")}
              aria-label={
                sessionUser ? "Ouvrir mon espace" : "Ouvrir l’espace lecteur"
              }
              className="cursor-pointer rounded-corner-full"
            >
              <Avatar
                type="image"
                src="https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=100&h=100&fit=crop&auto=format"
                size="medium"
                shape="circle"
              />
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="flex-1 w-full">
        {/* ---------------------------------------------------------------- HOME */}
        {view === "home" && (
          <div className="max-w-[1320px] mx-auto px-xl md:px-2xl py-3xl flex flex-col gap-5xl animate-fade">
            {/* Hero — solid deep-wine ground, editorial and calm (no gradient) */}
            <section className="relative rounded-corner-xl overflow-hidden bg-[#471423] text-white border border-white/10">
              <div
                className="absolute inset-y-0 left-0 w-1 bg-brand-primary"
                aria-hidden="true"
              />
              <div className="relative grid lg:grid-cols-[1.05fr_0.95fr] gap-3xl items-center px-3xl md:px-4xl py-4xl">
                <div className="flex flex-col items-start gap-xl">
                  <span className="inline-flex items-center gap-sm px-lg py-xs border border-white/25 text-white/90 text-video-title font-semibold rounded-corner-full uppercase tracking-widest">
                    <span
                      className="w-1.5 h-1.5 rounded-corner-full bg-brand-primary"
                      aria-hidden="true"
                    />{" "}
                    Le nouveau souffle littéraire
                  </span>
                  <h1 className="font-serif text-[44px] md:text-[60px] leading-[1.02] tracking-tight">
                    Les racines de l'Afrique
                    <br />
                    <span className="text-brand-secondary">
                      dans votre poche
                    </span>
                  </h1>
                  <p className="text-label text-white/80 max-w-[46ch]">
                    Découvrez notre collection exclusive d'e-books par des
                    auteurs africains francophones. Achat sécurisé par Mobile
                    Money, lecture en ligne partout, tout le temps.
                  </p>
                  <div className="flex flex-wrap items-center gap-md mt-md">
                    <button
                      onClick={() => openCatalog("Tous")}
                      className="inline-flex items-center gap-sm px-xl py-md rounded-corner-md bg-white text-brand-dark font-semibold hover:bg-brand-tertiary transition-colors cursor-pointer"
                    >
                      Explorer le catalogue{" "}
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => openBook(featured.id)}
                      className="inline-flex items-center gap-sm px-xl py-md rounded-corner-md bg-white/10 border border-white/45 text-white font-semibold hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" aria-hidden="true" /> Livre
                      à la une
                    </button>
                  </div>
                  <div className="flex items-center gap-2xl mt-lg pt-lg border-t border-white/15 w-full">
                    {[
                      { k: "120+", v: "titres" },
                      { k: "4.8/5", v: "satisfaction" },
                      { k: "6 pays", v: "desservis" },
                    ].map((s) => (
                      <div key={s.v} className="flex flex-col">
                        <span className="text-heading font-semibold text-white">
                          {s.k}
                        </span>
                        <span className="text-video-title text-white/60 uppercase tracking-wide">
                          {s.v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center lg:justify-end gap-lg -rotate-6 hover:rotate-0 transition-transform duration-500">
                  {heroCovers.map((book, i) => (
                    <button
                      key={book.id}
                      onClick={() => openBook(book.id)}
                      aria-label={`Découvrir « ${book.title} »`}
                      className={`w-28 md:w-40 aspect-[2/3] rounded-corner-md overflow-hidden shadow-2xl border-4 border-white/20 bg-brand-tertiary cursor-pointer ${
                        i === 1 ? "mt-2xl" : ""
                      }`}
                    >
                      <img
                        src={book.cover}
                        alt=""
                        onError={handleCoverError}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Nouveautés */}
            <section
              className="flex flex-col gap-xl"
              aria-labelledby="new-title"
            >
              <div className="flex items-end justify-between">
                <h2
                  id="new-title"
                  className="font-serif text-title font-semibold text-text-primary"
                >
                  Nouveautés
                </h2>
                <button
                  onClick={() => openCatalog("Tous")}
                  className="inline-flex items-center gap-xs text-label-sm font-medium text-brand-primary hover:underline cursor-pointer"
                >
                  Voir tout{" "}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2xl">
                {newReleases.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onOpen={() => openBook(book.id)}
                    onAdd={() => addToCart(book.id)}
                  />
                ))}
              </div>
            </section>

            {/* Best-sellers du mois — ranked list */}
            <section
              className="flex flex-col gap-xl"
              aria-labelledby="best-title"
            >
              <h2
                id="best-title"
                className="font-serif text-title font-semibold text-text-primary"
              >
                Best-sellers du mois
              </h2>
              <div className="rounded-corner-lg bg-surface-bg border border-border-secondary p-lg md:p-xl">
                <ol className="flex flex-col">
                  {bestSellers.map((book, i) => (
                    <li key={book.id}>
                      <button
                        onClick={() => openBook(book.id)}
                        className="w-full flex items-center gap-lg p-md rounded-corner-md hover:bg-surface-hover transition-colors cursor-pointer text-left"
                      >
                        <span
                          className="text-title font-bold text-accent w-8 shrink-0"
                          aria-hidden="true"
                        >
                          {i + 1}
                        </span>
                        <div className="w-12 h-16 rounded-corner-sm overflow-hidden bg-brand-tertiary shrink-0">
                          <img
                            src={book.cover}
                            alt=""
                            onError={handleCoverError}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-label font-semibold text-text-primary truncate">
                            {book.title}
                          </p>
                          <p className="text-label-sm text-text-secondary truncate">
                            {book.author} • {book.category}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-label font-semibold text-text-primary">
                            {formatPrice(book.price)}
                          </div>
                          <div className="text-video-title text-brand-primary font-medium">
                            +{book.reviews} ventes
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {/* Catégories populaires — gradient tiles */}
            <section
              className="flex flex-col gap-xl"
              aria-labelledby="cats-title"
            >
              <h2
                id="cats-title"
                className="font-serif text-title font-semibold text-text-primary"
              >
                Catégories populaires
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
                {CATALOG_CATEGORIES.map(({ value: cat }) => {
                  const count = visibleBooks.filter(
                    (b) => b.category === cat,
                  ).length
                  // Calm ivory cards with a muted charter-tinted icon chip — no fills, no gradients.
                  const tiles: Record<string, {
                    chip: string
                    icon: ReactNode
                  }> = {
                    Roman: {
                      chip: "bg-brand-tertiary text-brand-primary",
                      icon: <BookOpen className="w-6 h-6" aria-hidden="true" />,
                    },
                    Histoire: {
                      chip: "bg-accent-tertiary text-accent",
                      icon: <Landmark className="w-6 h-6" aria-hidden="true" />,
                    },
                    Poésie: {
                      chip: "bg-brand-tertiary text-brand-primary",
                      icon: <Feather className="w-6 h-6" aria-hidden="true" />,
                    },
                    Contes: {
                      chip: "bg-accent-tertiary text-accent",
                      icon: <Sparkles className="w-6 h-6" aria-hidden="true" />,
                    },
                  }
                  const tile = tiles[cat] ?? {
                    chip: "bg-brand-tertiary text-brand-primary",
                    icon: <BookText className="w-6 h-6" aria-hidden="true" />,
                  }
                  return (
                    <button
                      key={cat}
                      onClick={() => openCatalog(cat)}
                      className="group bg-surface-bg border border-border-secondary rounded-corner-lg p-xl text-left hover:border-brand-primary hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      <div
                        className={`inline-flex items-center justify-center w-11 h-11 rounded-corner-md mb-lg ${tile.chip}`}
                      >
                        {tile.icon}
                      </div>
                      <div className="font-semibold text-text-primary">
                        {cat}
                      </div>
                      <div className="text-label-sm text-text-secondary">
                        {count} titres
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Trust band */}
            <section
              className="grid md:grid-cols-3 gap-lg"
              aria-label="Nos garanties"
            >
              {[
                {
                  icon: <Smartphone className="w-5 h-5" aria-hidden="true" />,
                  t: "Paiement Mobile Money",
                  d: "Orange Money, MTN, Wave & Moov acceptés.",
                  tone: "bg-brand-tertiary text-brand-primary",
                },
                {
                  icon: <BookText className="w-5 h-5" aria-hidden="true" />,
                  t: "Lecture en ligne",
                  d: "Lisez vos e-books directement sur la plateforme.",
                  tone: "bg-accent-tertiary text-accent",
                },
                {
                  icon: <ShieldCheck className="w-5 h-5" aria-hidden="true" />,
                  t: "Transactions sécurisées",
                  d: "Vos paiements sont chiffrés de bout en bout.",
                  tone: "bg-brand-tertiary text-brand-primary",
                },
              ].map((f) => (
                <div
                  key={f.t}
                  className="flex items-start gap-lg p-xl rounded-corner-lg bg-surface-bg border border-border-secondary"
                >
                  <span
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-corner-md shrink-0 ${f.tone}`}
                  >
                    {f.icon}
                  </span>
                  <div>
                    <h3 className="text-label font-semibold text-text-primary">
                      {f.t}
                    </h3>
                    <p className="text-label-sm text-text-secondary mt-xs">
                      {f.d}
                    </p>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* ---------------------------------------------------------------- CATALOG */}
        {view === "catalog" && (
          <CatalogPage
            books={books}
            initialCategory={
              activeCategory === "Tous" ? undefined : activeCategory
            }
            initialSearch={searchQuery}
            onHome={() => go("home")}
            onSearchChange={setSearchQuery}
            onOpenBook={(book) => openBook(book.id)}
            onAddToCart={(book) => addToCart(book.id)}
          />
        )}

        {/* ---------------------------------------------------------------- DETAILS */}
        {view === "details" && selectedBook && (
          <div className="max-w-[1200px] mx-auto px-xl md:px-2xl py-3xl animate-fade">
            {/* Breadcrumbs */}
            <nav
              className="flex items-center gap-sm text-label-sm text-text-tertiary mb-2xl"
              aria-label="Fil d'ariane"
            >
              <button
                onClick={() => go("home")}
                className="hover:text-text-primary cursor-pointer"
              >
                Accueil
              </button>
              <span aria-hidden="true">/</span>
              <button
                onClick={() => openCatalog(selectedBook.category)}
                className="hover:text-text-primary cursor-pointer"
              >
                {selectedBook.category}
              </button>
              <span aria-hidden="true">/</span>
              <span className="text-text-primary font-medium truncate max-w-[40ch]">
                {selectedBook.title}
              </span>
            </nav>

            <div className="grid md:grid-cols-2 gap-4xl mb-3xl">
              {/* Cover + thumbnails */}
              <div className="flex flex-col gap-lg">
                <div className="aspect-[2/3] w-full rounded-corner-xl overflow-hidden shadow-2xl border border-border-secondary bg-brand-tertiary">
                  <img
                    src={selectedBook.cover}
                    alt={`Couverture de « ${selectedBook.title} »`}
                    onError={handleCoverError}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex justify-center gap-sm" aria-hidden="true">
                  <div className="w-16 h-20 rounded-corner-sm overflow-hidden border-2 border-brand-primary bg-brand-tertiary">
                    <img
                      src={selectedBook.cover}
                      alt=""
                      onError={handleCoverError}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-16 h-20 rounded-corner-sm border border-border-secondary bg-brand-tertiary opacity-50" />
                  <div className="w-16 h-20 rounded-corner-sm border border-border-secondary bg-brand-tertiary opacity-50" />
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-col gap-xl">
                <div className="flex flex-col gap-md">
                  <div className="flex items-center gap-sm">
                    <span className="px-md py-xs rounded-corner-sm bg-[#2e8b57]/14 text-[#1f6642] text-video-title font-bold">
                      Disponible
                    </span>
                    {selectedBook.reviews > 300 && (
                      <span className="px-md py-xs rounded-corner-sm bg-brand-tertiary text-brand-primary text-video-title font-bold">
                        Best-seller
                      </span>
                    )}
                  </div>
                  <h1 className="font-serif text-text-primary text-[36px] md:text-[44px] leading-[1.05]">
                    {selectedBook.title}
                  </h1>
                  {selectedBook.subtitle && (
                    <p className="text-label text-text-secondary">
                      {selectedBook.subtitle}
                    </p>
                  )}
                  <p className="text-heading text-text-secondary">
                    par{" "}
                    <span className="text-brand-primary font-medium">
                      {selectedBook.author}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-lg text-label-sm text-text-secondary">
                  <RatingStars rating={selectedBook.rating} />
                  <span className="text-border-primary" aria-hidden="true">
                    |
                  </span>
                  <span>{selectedBook.reviews} avis</span>
                  <span className="text-border-primary" aria-hidden="true">
                    |
                  </span>
                  <span>
                    {selectedBook.pages} pages · {selectedBook.year}
                  </span>
                </div>

                {/* Price box */}
                <div className="rounded-corner-lg bg-surface-secondary-bg border border-border-secondary p-xl flex flex-col gap-lg">
                  <div className="flex items-baseline gap-md flex-wrap">
                    <span className="text-display font-bold text-text-primary">
                      {formatPrice(selectedBook.price)}
                    </span>
                    <span className="text-label-sm text-text-tertiary">
                      TTC
                    </span>
                  </div>
                  <div className="flex gap-md">
                    {ownsSelected ? (
                      <Button
                        variant="primary"
                        iconStart={<BookText className="w-4 h-4" />}
                        onClick={() => startReading(selectedBook.id)}
                      >
                        {progress[selectedBook.id]
                          ? "Reprendre la lecture"
                          : "Lire maintenant"}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        iconStart={<ShoppingBag className="w-4 h-4" />}
                        onClick={() => addToCart(selectedBook.id)}
                      >
                        Acheter maintenant
                      </Button>
                    )}
                    <button
                      onClick={() =>
                        setWishlist((w) =>
                          w.includes(selectedBook.id)
                            ? w.filter((x) => x !== selectedBook.id)
                            : [...w, selectedBook.id],
                        )
                      }
                      aria-pressed={wishlist.includes(selectedBook.id)}
                      aria-label="Ajouter à la liste de souhaits"
                      className={`inline-flex items-center justify-center px-lg rounded-corner-md border transition-colors cursor-pointer ${
                        wishlist.includes(selectedBook.id)
                          ? "bg-brand-tertiary border-brand-primary text-brand-primary"
                          : "border-border-primary text-text-secondary hover:bg-surface-hover"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          wishlist.includes(selectedBook.id)
                            ? "fill-current"
                            : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  <p className="text-video-title text-text-tertiary text-center inline-flex items-center justify-center gap-xs">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />{" "}
                    Paiement sécurisé par Mobile Money · lecture en ligne
                    immédiate
                  </p>
                </div>

                {/* Meta grid */}
                <dl className="grid grid-cols-2 gap-x-2xl gap-y-xs text-label-sm">
                  {[
                    { k: "Format", v: selectedBook.format ?? "ePub" },
                    { k: "Pages", v: `${selectedBook.pages}` },
                    {
                      k: "Langue",
                      v: selectedBook.language ?? "Français",
                    },
                    {
                      k: "ISBN",
                      v: selectedBook.isbn ?? "Non renseigné",
                    },
                    { k: "Publié", v: `${selectedBook.year}` },
                    { k: "Catégorie", v: selectedBook.category },
                  ].map((m) => (
                    <div
                      key={m.k}
                      className="flex justify-between py-sm border-b border-border-secondary"
                    >
                      <dt className="text-text-tertiary">{m.k}</dt>
                      <dd className="font-medium text-text-primary">{m.v}</dd>
                    </div>
                  ))}
                </dl>

                {/* Share */}
                <div className="flex items-center gap-md">
                  <span className="text-label-sm font-medium text-text-secondary inline-flex items-center gap-xs">
                    <Share2 className="w-4 h-4" aria-hidden="true" /> Partager :
                  </span>
                  {["WhatsApp", "Facebook", "X", "Copier le lien"].map(
                    (net) => (
                      <button
                        key={net}
                        onClick={() =>
                          setToast({
                            message: `Lien partagé (${net})`,
                            variant: "success",
                          })
                        }
                        aria-label={`Partager sur ${net}`}
                        className="w-9 h-9 rounded-corner-full bg-surface-secondary-bg border border-border-secondary text-text-secondary hover:bg-brand-tertiary hover:text-brand-primary transition-colors cursor-pointer inline-flex items-center justify-center text-video-title font-semibold"
                      >
                        {net === "Copier le lien" ? "🔗" : net[0]}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border-secondary mb-xl">
              <div
                className="flex gap-2xl"
                role="tablist"
                aria-label="Détails du livre"
              >
                {([
                  { id: "description", label: "Description" },
                  { id: "reviews", label: `Avis (${selectedBook.reviews})` },
                  { id: "author", label: "Du même auteur" },
                ] as const).map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={productTab === t.id}
                    onClick={() => setProductTab(t.id)}
                    className={`pb-md border-b-2 text-label-sm font-medium transition-colors cursor-pointer ${
                      productTab === t.id
                        ? "border-brand-primary text-text-primary"
                        : "border-transparent text-text-tertiary hover:text-text-primary"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {productTab === "description" && (
              <div className="grid md:grid-cols-3 gap-2xl">
                <div className="md:col-span-2 flex flex-col gap-lg text-label text-text-secondary leading-relaxed">
                  <p>{selectedBook.description}</p>
                  <h3 className="text-label font-semibold text-text-primary mt-md">
                    Au sommaire
                  </h3>
                  <ul className="flex flex-col gap-xs">
                    {selectedBook.chapters.map((c, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-md text-label-sm text-text-secondary"
                      >
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-corner-full bg-brand-tertiary text-brand-primary text-video-title font-semibold shrink-0">
                          {i + 1}
                        </span>
                        {c.title}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-corner-lg bg-surface-secondary-bg border border-border-secondary p-xl h-fit">
                  <h3 className="text-label font-semibold text-text-primary mb-md">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-sm">
                    {(
                      selectedBook.tags ?? [
                        selectedBook.category.toLowerCase(),
                        "afrique",
                        "francophone",
                        "littérature",
                        selectedBook.author.split(" ").pop()?.toLowerCase() ??
                          "auteur",
                      ]
                    ).map((tag) => (
                      <span
                        key={tag}
                        className="px-md py-xs rounded-corner-full bg-surface-bg border border-border-secondary text-video-title text-text-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {productTab === "reviews" && (
              <div className="flex flex-col gap-lg max-w-[68ch]">
                {[
                  {
                    n: "Aminata D.",
                    r: 5,
                    t: "Un texte bouleversant, porté par une langue superbe. Je l'ai lu d'une traite.",
                  },
                  {
                    n: "Kofi M.",
                    r: 4,
                    t: "Une lecture exigeante mais profondément marquante. À recommander.",
                  },
                  {
                    n: "Fatou N.",
                    r: 5,
                    t: "Chaque page respire la mémoire du continent. Magnifique.",
                  },
                ].map((rev) => (
                  <div
                    key={rev.n}
                    className="rounded-corner-lg bg-surface-bg border border-border-secondary p-lg flex flex-col gap-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-label font-semibold text-text-primary">
                        {rev.n}
                      </span>
                      <span
                        className="inline-flex items-center gap-0.5"
                        aria-label={`${rev.r} sur 5`}
                      >
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 fill-current ${
                              s < rev.r ? "text-brand-primary" : "text-black/12"
                            }`}
                            strokeWidth={0}
                            aria-hidden="true"
                          />
                        ))}
                      </span>
                    </div>
                    <p className="text-label-sm text-text-secondary">{rev.t}</p>
                  </div>
                ))}
              </div>
            )}

            {productTab === "author" &&
              (relatedBooks.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2xl">
                  {relatedBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onOpen={() => openBook(book.id)}
                      onAdd={() => addToCart(book.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-label-sm text-text-secondary">
                  Aucun autre titre dans cette catégorie pour le moment.
                </p>
              ))}
          </div>
        )}

        {/* ---------------------------------------------------------------- CHECKOUT */}
        {view === "checkout" && (
          <CheckoutView
            books={books}
            cartItems={cartItems}
            total={cartTotal}
            onBack={() => {
              setView("catalog")
              setCartOpen(true)
            }}
            onPlaceOrder={placeOrder}
          />
        )}

        {/* ---------------------------------------------------------------- CONFIRMATION */}
        {view === "confirmation" && (
          <div className="max-w-[640px] mx-auto px-xl py-5xl flex flex-col items-center text-center gap-xl animate-rise">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-corner-full bg-brand-tertiary text-brand-primary">
              <Check className="w-8 h-8" aria-hidden="true" />
            </span>
            <h1 className="font-serif text-text-primary text-[40px] leading-tight">
              Merci pour votre achat !
            </h1>
            <p className="text-label text-text-secondary max-w-[46ch]">
              Votre commande est confirmée. Vos e-books sont désormais dans
              votre bibliothèque, prêts à être lus directement en ligne, quand
              vous le souhaitez.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-md mt-md">
              <Button
                variant="primary"
                iconStart={<BookOpen className="w-4 h-4" />}
                onClick={() => go("library")}
              >
                Ouvrir ma bibliothèque
              </Button>
              <Button variant="subtle" onClick={() => go("home")}>
                Retour à l'accueil
              </Button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- LIBRARY */}
        {view === "library" && (
          <div className="max-w-[1320px] mx-auto px-xl md:px-2xl py-3xl flex flex-col gap-2xl animate-fade">
            <div className="flex items-end justify-between gap-lg flex-wrap">
              <div className="flex flex-col gap-sm">
                <h1 className="text-title font-semibold text-text-primary">
                  Ma bibliothèque
                </h1>
                <p className="text-label-sm text-text-secondary">
                  Vos e-books achetés, à lire directement en ligne.
                </p>
              </div>
              {libraryBooks.length > 0 && (
                <div
                  className="flex border border-border-secondary rounded-corner-md overflow-hidden"
                  role="group"
                  aria-label="Affichage"
                >
                  <button
                    onClick={() => setLibGrid(true)}
                    aria-pressed={libGrid}
                    className={`p-sm cursor-pointer ${
                      libGrid
                        ? "bg-brand-primary text-on-brand"
                        : "bg-surface-bg text-text-tertiary hover:bg-surface-hover"
                    }`}
                    aria-label="Vue grille"
                  >
                    <LayoutGrid className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setLibGrid(false)}
                    aria-pressed={!libGrid}
                    className={`p-sm cursor-pointer ${
                      !libGrid
                        ? "bg-brand-primary text-on-brand"
                        : "bg-surface-bg text-text-tertiary hover:bg-surface-hover"
                    }`}
                    aria-label="Vue liste"
                  >
                    <List className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            {libraryBooks.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
                {[
                  { label: "Livres achetés", value: `${libraryBooks.length}` },
                  {
                    label: "En cours de lecture",
                    value: `${
                      libraryBooks.filter((b) => {
                        const s = progress[b.id]
                        return (
                          s !== undefined && s > 0 && s < b.chapters.length - 1
                        )
                      }).length
                    }`,
                  },
                  {
                    label: "Terminés",
                    value: `${
                      libraryBooks.filter((b) => {
                        const s = progress[b.id]
                        return s !== undefined && s >= b.chapters.length - 1
                      }).length
                    }`,
                  },
                  { label: "Commandes", value: `${orders.length}` },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-corner-lg bg-surface-bg border border-border-secondary p-lg"
                  >
                    <div className="text-title font-bold text-text-primary">
                      {s.value}
                    </div>
                    <div className="text-label-sm text-text-tertiary mt-xs">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {libraryBooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-lg py-5xl text-center rounded-corner-lg border border-dashed border-border-primary bg-surface-bg">
                <BookOpen
                  className="w-10 h-10 text-text-tertiary"
                  aria-hidden="true"
                />
                <h2 className="text-heading text-text-primary">
                  Votre bibliothèque est vide
                </h2>
                <p className="text-label-sm text-text-secondary">
                  Parcourez le catalogue pour commencer votre collection.
                </p>
                <Button variant="primary" onClick={() => openCatalog("Tous")}>
                  Découvrir le catalogue
                </Button>
              </div>
            ) : (
              <div
                className={
                  libGrid
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2xl"
                    : "grid grid-cols-1 sm:grid-cols-2 gap-2xl"
                }
              >
                {libraryBooks.map((book) => {
                  const saved = progress[book.id]
                  const started = saved !== undefined && saved > 0
                  const pct = started
                    ? Math.round(((saved + 1) / book.chapters.length) * 100)
                    : 0
                  return (
                    <div key={book.id} className="flex flex-col gap-lg">
                      <button
                        onClick={() => startReading(book.id)}
                        aria-label={`Lire « ${book.title} »`}
                        className="relative aspect-[2/3] rounded-corner-lg overflow-hidden border border-border-secondary shadow-sm bg-brand-tertiary group cursor-pointer"
                      >
                        <img
                          src={book.cover}
                          alt=""
                          onError={handleCoverError}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                        <div className="absolute inset-0 bg-[#100908]/0 group-hover:bg-[#100908]/35 transition-colors flex items-center justify-center">
                          <span className="inline-flex items-center gap-xs text-video-title font-semibold text-white bg-[#100908]/70 backdrop-blur-sm rounded-corner-full px-md py-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            <BookText
                              className="w-3.5 h-3.5"
                              aria-hidden="true"
                            />{" "}
                            Lire
                          </span>
                        </div>
                        {started && (
                          <span className="absolute top-md left-md text-[11px] font-semibold text-on-brand bg-brand-primary rounded-corner-full px-sm py-0.5">
                            {pct}%
                          </span>
                        )}
                      </button>
                      <div className="flex flex-col gap-xs">
                        <span className="text-label font-semibold text-text-primary line-clamp-1">
                          {book.title}
                        </span>
                        <span className="text-label-sm text-text-secondary">
                          {book.author}
                        </span>
                      </div>
                      {started && (
                        <div
                          className="h-1.5 rounded-corner-full bg-brand-tertiary overflow-hidden"
                          aria-hidden="true"
                        >
                          <div
                            className="h-full bg-brand-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                      <Button
                        variant={started ? "neutral" : "primary"}
                        iconStart={
                          started ? (
                            <RotateCcw className="w-4 h-4" />
                          ) : (
                            <BookText className="w-4 h-4" />
                          )
                        }
                        onClick={() => startReading(book.id)}
                      >
                        {started ? "Reprendre" : "Commencer la lecture"}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Historique des commandes */}
            {orders.length > 0 && (
              <section
                className="flex flex-col gap-lg mt-2xl"
                aria-labelledby="orders-history"
              >
                <h2
                  id="orders-history"
                  className="text-heading font-semibold text-text-primary"
                >
                  Historique des commandes
                </h2>
                <div className="rounded-corner-lg bg-surface-bg border border-border-secondary overflow-x-auto">
                  <table className="w-full text-label-sm">
                    <thead className="bg-surface-secondary-bg text-text-tertiary text-left">
                      <tr>
                        <th className="px-lg py-md font-medium">N°</th>
                        <th className="px-lg py-md font-medium">Date</th>
                        <th className="px-lg py-md font-medium">Articles</th>
                        <th className="px-lg py-md font-medium">Montant</th>
                        <th className="px-lg py-md font-medium text-right">
                          Facture
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-secondary">
                      {orders.slice(0, 5).map((o) => (
                        <tr key={o.id} className="hover:bg-surface-hover">
                          <td className="px-lg py-md font-mono text-text-secondary">
                            {o.id}
                          </td>
                          <td className="px-lg py-md text-text-secondary">
                            {o.date}
                          </td>
                          <td className="px-lg py-md text-text-secondary">
                            {o.items.reduce((n, it) => n + it.quantity, 0)}
                          </td>
                          <td className="px-lg py-md font-medium text-text-primary">
                            {formatPrice(o.total)}
                          </td>
                          <td className="px-lg py-md text-right">
                            <button
                              onClick={() =>
                                setToast({
                                  message: `Facture ${o.id} générée`,
                                  variant: "success",
                                })
                              }
                              className="text-brand-primary hover:underline cursor-pointer"
                            >
                              Facture PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Footer — 4-column with newsletter (maquette skeleton) */}
      <footer className="bg-[#1a0f0c] text-white/70 mt-auto rounded-t-corner-xl">
        <div className="max-w-[1320px] mx-auto px-xl md:px-2xl py-4xl grid md:grid-cols-4 gap-2xl">
          <div className="flex flex-col gap-md">
            <Wordmark className="h-8 w-8 object-contain" tone="light" />
            <p className="text-label font-serif text-white/90 max-w-[30ch] leading-snug">
              Le nouveau souffle de la littérature africaine.
            </p>
            <p className="text-label-sm text-white/55 max-w-[32ch]">
              La plateforme de référence pour les e-books d'auteurs africains
              francophones.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-md">Navigation</h3>
            <ul className="flex flex-col gap-sm text-label-sm">
              <li>
                <button
                  onClick={() => openCatalog("Tous")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Catalogue
                </button>
              </li>
              <li>
                <button
                  onClick={() => go("home")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Best-sellers
                </button>
              </li>
              <li>
                <button
                  onClick={() => go("home")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Nouveautés
                </button>
              </li>
              <li>
                <button
                  onClick={() => openCatalog("Tous")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Auteurs
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-md">Aide</h3>
            <ul className="flex flex-col gap-sm text-label-sm">
              {[
                "Comment ça marche",
                "FAQ",
                "Contact",
                "Conditions générales",
                "Confidentialité",
              ].map((label) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => showComingSoon(label)}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => go("admin")}
                  className="inline-flex items-center gap-xs hover:text-white transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />{" "}
                  Espace admin
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-md">Newsletter</h3>
            <form
              className="flex gap-sm"
              onSubmit={(e) => {
                e.preventDefault()
                setToast({
                  message: "Merci ! Vous êtes inscrit·e à la newsletter.",
                  variant: "success",
                })
              }}
            >
              <input
                type="email"
                required
                placeholder="Votre email"
                aria-label="Votre email"
                className="flex-1 min-w-0 px-lg py-sm rounded-corner-md bg-white/10 text-white placeholder:text-white/40 text-label-sm border border-white/15 focus:outline-none focus:ring-2 focus:ring-brand-secondary"
              />
              <button
                type="submit"
                className="px-lg py-sm rounded-corner-md bg-brand-primary text-on-brand font-semibold text-label-sm hover:bg-brand-hover transition-colors cursor-pointer"
              >
                OK
              </button>
            </form>
            <p className="text-video-title text-white/40 mt-lg">
              © 2026 YéYéBook · Littérature africaine francophone
            </p>
          </div>
        </div>
      </footer>

      {/* ---------------------------------------------------------------- CART DRAWER */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Panier"
        >
          <div
            className="absolute inset-0 bg-[#100908]/40 animate-fade"
            onClick={() => setCartOpen(false)}
          />
          <aside className="relative w-full max-w-[420px] h-full bg-surface-bg shadow-2xl flex flex-col animate-slide-in">
            <div className="flex items-center justify-between px-xl py-lg border-b border-border-secondary">
              <h2 className="text-heading font-semibold text-text-primary">
                Panier{" "}
                {cartCount > 0 && (
                  <span className="text-text-tertiary font-normal">
                    ({cartCount})
                  </span>
                )}
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                aria-label="Fermer le panier"
                className="inline-flex items-center justify-center w-9 h-9 rounded-corner-full text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-lg px-xl text-center">
                <ShoppingBag
                  className="w-10 h-10 text-text-tertiary"
                  aria-hidden="true"
                />
                <h3 className="text-label font-semibold text-text-primary">
                  Votre panier est vide
                </h3>
                <p className="text-label-sm text-text-secondary">
                  Ajoutez des e-books pour commencer.
                </p>
                <Button
                  variant="primary"
                  onClick={() => {
                    setCartOpen(false)
                    openCatalog("Tous")
                  }}
                >
                  Parcourir le catalogue
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-xl py-lg flex flex-col gap-lg">
                  {cartItems.map((item) => {
                    const book = books.find((b) => b.id === item.bookId)
                    if (!book) return null
                    return (
                      <div key={item.bookId} className="flex gap-lg">
                        <button
                          onClick={() => {
                            setCartOpen(false)
                            openBook(book.id)
                          }}
                          className="w-[64px] shrink-0 aspect-[2/3] rounded-corner-sm overflow-hidden bg-brand-tertiary border border-border-secondary cursor-pointer"
                          aria-label={`Voir « ${book.title} »`}
                        >
                          <img
                            src={book.cover}
                            alt=""
                            onError={handleCoverError}
                            className="w-full h-full object-cover"
                          />
                        </button>
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <h3 className="text-label-sm font-semibold text-text-primary line-clamp-1">
                              {book.title}
                            </h3>
                            <p className="text-video-title text-text-secondary">
                              {book.author}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="inline-flex items-center gap-sm bg-surface-secondary-bg border border-border-secondary rounded-corner-full p-xs">
                              <button
                                onClick={() => updateQty(book.id, -1)}
                                className="w-6 h-6 inline-flex items-center justify-center rounded-corner-full text-text-secondary hover:bg-surface-hover cursor-pointer"
                                aria-label={`Diminuer la quantité de « ${book.title} »`}
                              >
                                <Minus
                                  className="w-3.5 h-3.5"
                                  aria-hidden="true"
                                />
                              </button>
                              <span
                                className="text-label-sm font-semibold w-4 text-center"
                                aria-live="polite"
                              >
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQty(book.id, 1)}
                                className="w-6 h-6 inline-flex items-center justify-center rounded-corner-full text-text-secondary hover:bg-surface-hover cursor-pointer"
                                aria-label={`Augmenter la quantité de « ${book.title} »`}
                              >
                                <Plus
                                  className="w-3.5 h-3.5"
                                  aria-hidden="true"
                                />
                              </button>
                            </div>
                            <span className="text-label-sm font-semibold text-text-primary">
                              {formatPrice(book.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(book.id)}
                          aria-label={`Retirer « ${book.title} » du panier`}
                          className="self-start text-text-tertiary hover:text-danger transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t border-border-secondary px-xl py-xl flex flex-col gap-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-label-sm text-text-secondary">
                      Sous-total
                    </span>
                    <span className="text-label-sm text-text-primary font-medium">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-label font-semibold text-text-primary">
                      Total
                    </span>
                    <span className="text-heading font-semibold text-brand-primary">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    iconEnd={<ArrowRight className="w-4 h-4" />}
                    onClick={() => {
                      setCartOpen(false)
                      setView("checkout")
                    }}
                  >
                    Passer commande
                  </Button>
                  <button
                    onClick={() => {
                      setCartOpen(false)
                      openCatalog("Tous")
                    }}
                    className="text-label-sm text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    Continuer mes achats
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {/* ---------------------------------------------------------------- RESUME PROMPT */}
      {resumePrompt && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resume-title"
        >
          <div
            className="absolute inset-0 bg-[#100908]/45 animate-fade"
            onClick={() => setResumePrompt(null)}
          />
          <div className="relative w-full max-w-[440px] bg-surface-bg rounded-corner-xl border border-border-secondary shadow-2xl p-2xl flex flex-col gap-lg animate-rise">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-corner-full bg-brand-tertiary text-brand-primary">
              <RotateCcw className="w-6 h-6" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-xs">
              <h2
                id="resume-title"
                className="text-heading font-semibold text-text-primary"
              >
                Reprendre la lecture ?
              </h2>
              <p className="text-label-sm text-text-secondary">
                Vous vous étiez arrêté au{" "}
                <span className="text-text-primary font-medium">
                  chapitre {resumePrompt.chapter + 1} —{" "}
                  {resumePrompt.book.chapters[resumePrompt.chapter].title}
                </span>{" "}
                de « {resumePrompt.book.title} ».
              </p>
            </div>
            <div className="flex flex-col gap-sm mt-sm">
              <Button
                variant="primary"
                iconStart={<BookText className="w-4 h-4" />}
                onClick={() =>
                  openReaderAt(resumePrompt.book.id, resumePrompt.chapter)
                }
              >
                Reprendre au chapitre {resumePrompt.chapter + 1}
              </Button>
              <Button
                variant="neutral"
                onClick={() => openReaderAt(resumePrompt.book.id, 0)}
              >
                Recommencer depuis le début
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- TOAST */}
      {toast && (
        <div
          className="fixed bottom-xl left-1/2 -translate-x-1/2 z-[60] animate-rise"
          role="status"
          aria-live="polite"
        >
          <Toast
            message={toast.message}
            variant={toast.variant}
            onDismiss={() => setToast(null)}
          />
        </div>
      )}
    </div>
  )
}

function ChapterList({
  book,
  current,
  onSelect,
  bookmarks = [],
  tone,
}: {
  book: Book
  current: number
  onSelect: (i: number) => void
  bookmarks?: number[]
  tone?: ReaderTone
}) {
  return (
    <nav aria-label="Chapitres" className="flex flex-col gap-xs">
      <p
        className="text-video-title uppercase tracking-widest font-semibold px-md mb-sm"
        style={tone ? { color: tone.sub } : undefined}
      >
        Sommaire
      </p>
      {book.chapters.map((c, i) => {
        const active = i === current
        const marked = bookmarks.includes(i)
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            aria-current={active ? "true" : undefined}
            className={`flex items-start gap-md text-left px-md py-md rounded-corner-md transition-colors cursor-pointer ${
              active ? "bg-brand-tertiary" : "hover:bg-surface-hover"
            }`}
          >
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded-corner-full text-video-title font-semibold shrink-0 ${
                active
                  ? "bg-brand-primary text-on-brand"
                  : "bg-surface-hover text-text-secondary"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`flex-1 text-label-sm leading-snug ${
                active ? "font-semibold" : ""
              }`}
              style={tone ? { color: active ? tone.ink : tone.sub } : undefined}
            >
              {c.title}
            </span>
            {marked && (
              <Bookmark
                className="w-3.5 h-3.5 mt-0.5 fill-current text-brand-primary shrink-0"
                aria-label="Signet"
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}

function CheckoutView({
  books,
  cartItems,
  total,
  onBack,
  onPlaceOrder,
}: {
  books: Book[]
  cartItems: CartItem[]
  total: number
  onBack: () => void
  onPlaceOrder: (details: CheckoutDetails) => void
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" })
  const [provider, setProvider] = useState("orange")
  // Wizard step within checkout: 1 = Informations, 2 = Paiement.
  const [step, setStep] = useState<1 | 2>(1)
  const providers = [
    { id: "orange", label: "Orange Money" },
    { id: "mtn", label: "MTN MoMo" },
    { id: "wave", label: "Wave" },
    { id: "moov", label: "Moov Money" },
  ]
  const infoValid =
    form.name.trim() &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.phone.trim().length >= 8
  const valid = infoValid
  const steps = [
    { n: 1, label: "Panier", done: true },
    { n: 2, label: "Informations", done: step > 1 },
    { n: 3, label: "Paiement", done: false },
    { n: 4, label: "Confirmation", done: false },
  ]
  // Map wizard step (1/2) onto the visible stepper positions (2 = Informations, 3 = Paiement).
  const activeStepPos = step === 1 ? 2 : 3

  if (cartItems.length === 0) {
    return (
      <div className="max-w-[640px] mx-auto px-xl py-5xl flex flex-col items-center text-center gap-lg animate-fade">
        <ShoppingBag
          className="w-10 h-10 text-text-tertiary"
          aria-hidden="true"
        />
        <h1 className="text-heading text-text-primary">
          Votre panier est vide
        </h1>
        <Button variant="primary" onClick={onBack}>
          Retour au catalogue
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-[1100px] mx-auto px-xl md:px-2xl py-3xl animate-fade">
      <Button
        variant="subtle"
        iconStart={<ChevronLeft className="w-4 h-4" />}
        onClick={onBack}
      >
        Retour
      </Button>
      <h1 className="text-title font-semibold text-text-primary mt-2xl mb-2xl">
        Finaliser la commande
      </h1>

      {/* Wizard stepper */}
      <ol
        className="flex items-center gap-xs md:gap-md mb-2xl"
        aria-label="Étapes de la commande"
      >
        {steps.map((s, i) => {
          const isActive = s.n === activeStepPos
          const isDone = s.done || s.n < activeStepPos
          return (
            <li
              key={s.n}
              className="flex items-center gap-xs md:gap-md flex-1 last:flex-none"
            >
              <div
                className="flex items-center gap-sm"
                aria-current={isActive ? "step" : undefined}
              >
                <span
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-corner-full text-video-title font-semibold shrink-0 transition-colors ${
                    isActive
                      ? "bg-brand-primary text-on-brand"
                      : isDone
                        ? "bg-brand-tertiary text-brand-primary"
                        : "bg-surface-hover text-text-tertiary"
                  }`}
                >
                  {isDone && !isActive ? (
                    <Check className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    s.n
                  )}
                </span>
                <span
                  className={`text-label-sm font-medium whitespace-nowrap hidden sm:inline ${
                    isActive ? "text-text-primary" : "text-text-tertiary"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span
                  className={`h-px flex-1 min-w-[12px] ${
                    isDone ? "bg-brand-primary/40" : "bg-border-secondary"
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>

      <div className="grid lg:grid-cols-[1fr_380px] gap-4xl items-start">
        <div className="flex flex-col gap-2xl">
          {step === 1 && (
            <section className="rounded-corner-lg bg-surface-bg border border-border-secondary p-xl flex flex-col gap-xl">
              <h2 className="text-label font-semibold text-text-primary">
                Vos coordonnées
              </h2>
              <InputField
                label="Nom complet"
                placeholder="Aminata Diallo"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              />
              <InputField
                label="Adresse e-mail"
                placeholder="aminata@exemple.com"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              />
              <InputField
                label="Numéro de téléphone"
                placeholder="+225 07 00 00 00 00"
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              />
              <div className="flex justify-end pt-sm">
                <Button
                  variant="primary"
                  iconEnd={<ChevronRight className="w-4 h-4" />}
                  disabled={!infoValid}
                  onClick={() => setStep(2)}
                >
                  Continuer vers le paiement
                </Button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="rounded-corner-lg bg-surface-bg border border-border-secondary p-xl flex flex-col gap-lg">
              <h2 className="text-label font-semibold text-text-primary">
                Moyen de paiement
              </h2>
              <div
                className="grid grid-cols-2 gap-md"
                role="radiogroup"
                aria-label="Moyen de paiement"
              >
                {providers.map((p) => {
                  const active = provider === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => setProvider(p.id)}
                      role="radio"
                      aria-checked={active}
                      className={`flex items-center gap-md px-lg py-md rounded-corner-md border text-label-sm font-medium transition-all cursor-pointer ${
                        active
                          ? "border-brand-primary bg-brand-tertiary text-text-primary"
                          : "border-border-secondary text-text-secondary hover:border-brand-primary"
                      }`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-corner-sm ${
                          active
                            ? "bg-brand-primary text-on-brand"
                            : "bg-surface-hover text-text-tertiary"
                        }`}
                      >
                        <Smartphone className="w-4 h-4" aria-hidden="true" />
                      </span>
                      {p.label}
                    </button>
                  )
                })}
              </div>
              <p className="text-video-title text-text-tertiary inline-flex items-center gap-xs">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Vous
                recevrez une demande de validation sur votre téléphone.
              </p>
              <div className="flex justify-start pt-sm">
                <Button
                  variant="subtle"
                  iconStart={<ChevronLeft className="w-4 h-4" />}
                  onClick={() => setStep(1)}
                >
                  Retour aux informations
                </Button>
              </div>
            </section>
          )}
        </div>

        <aside className="rounded-corner-lg bg-surface-bg border border-border-secondary p-xl flex flex-col gap-lg lg:sticky lg:top-[96px]">
          <h2 className="text-label font-semibold text-text-primary">
            Récapitulatif
          </h2>
          <div className="flex flex-col gap-md">
            {cartItems.map((item) => {
              const book = books.find((b) => b.id === item.bookId)
              if (!book) return null
              return (
                <div
                  key={item.bookId}
                  className="flex items-center justify-between gap-md"
                >
                  <span className="text-label-sm text-text-secondary line-clamp-1">
                    {book.title}{" "}
                    <span className="text-text-tertiary">
                      × {item.quantity}
                    </span>
                  </span>
                  <span className="text-label-sm text-text-primary font-medium whitespace-nowrap">
                    {formatPrice(book.price * item.quantity)}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="h-px bg-border-secondary" />
          <div className="flex items-center justify-between">
            <span className="text-label-sm text-text-secondary">TVA</span>
            <span className="text-label-sm text-text-primary font-medium">
              Incluse
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-label font-semibold text-text-primary">
              Total
            </span>
            <span className="text-title font-semibold text-brand-primary">
              {formatPrice(total)}
            </span>
          </div>
          {step === 1 ? (
            <Button
              variant="primary"
              iconEnd={<ChevronRight className="w-4 h-4" />}
              disabled={!infoValid}
              onClick={() => setStep(2)}
            >
              Continuer
            </Button>
          ) : (
            <Button
              variant="primary"
              iconStart={<ShieldCheck className="w-4 h-4" />}
              disabled={!valid}
              onClick={() =>
                onPlaceOrder({
                  name: form.name,
                  email: form.email,
                  phone: form.phone,
                  provider,
                })
              }
            >
              Payer {formatPrice(total)}
            </Button>
          )}
          {!valid && (
            <p className="text-video-title text-text-tertiary text-center">
              Renseignez vos coordonnées pour continuer.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}

/* ==================================================================== *
 * Back-office admin (Phase 1) — catalogue management, orders & stats.
 * Runs in its own full-screen shell, separate from the storefront chrome.
 * ==================================================================== */

type AdminTab = "dashboard" | "catalog" | "orders"

const ORDER_STATUS: Record<OrderStatus, OrderStatusMeta> = {
  paid: { label: "Payée", className: "bg-brand-tertiary text-brand-primary" },
  pending: { label: "En attente", className: "bg-[#c8956a]/16 text-[#7a5626]" },
  refunded: {
    label: "Remboursée",
    className: "bg-[#c13f4e]/10 text-[#9c2d3a]",
  },
}

function StatusPill({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status]
  return (
    <span
      className={`inline-flex items-center gap-xs rounded-corner-full px-md py-xs text-video-title font-semibold ${s.className}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-corner-full bg-current"
        aria-hidden="true"
      />
      {s.label}
    </span>
  )
}

function AdminView({
  books,
  orders,
  onSaveBook,
  onDeleteBook,
  onTogglePublish,
  onSetOrderStatus,
  onExit,
}: {
  books: Book[]
  orders: Order[]
  onSaveBook: (book: Book) => void
  onDeleteBook: (id: number) => void
  onTogglePublish: (id: number) => void
  onSetOrderStatus: (id: string, status: OrderStatus) => void
  onExit: () => void
}) {
  const [tab, setTab] = useState<AdminTab>("dashboard")
  const [editing, setEditing] = useState<Book | null>(null)
  const [creating, setCreating] = useState(false)
  const [catalogQuery, setCatalogQuery] = useState("")
  const [orderFilter, setOrderFilter] = useState<"all" | OrderStatus>("all")

  const catalogBooks = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase()
    if (!q) return books
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q),
    )
  }, [books, catalogQuery])

  const visibleOrders = useMemo(
    () =>
      orderFilter === "all"
        ? orders
        : orders.filter((o) => o.status === orderFilter),
    [orders, orderFilter],
  )

  const revenue = useMemo(
    () =>
      orders
        .filter((o) => o.status === "paid")
        .reduce((sum, o) => sum + o.total, 0),
    [orders],
  )
  const publishedCount = books.filter((b) => b.published !== false).length
  const avgRating = books.length
    ? books.reduce((s, b) => s + b.rating, 0) / books.length
    : 0
  const unitsByBook = useMemo(() => {
    const map = new Map<number, number>()
    orders
      .filter((o) => o.status !== "refunded")
      .forEach((o) =>
        o.items.forEach((it) =>
          map.set(it.bookId, (map.get(it.bookId) ?? 0) + it.quantity),
        ),
      )
    return map
  }, [orders])
  const topBooks = useMemo(
    () =>
      [...books]
        .map((b) => ({ book: b, units: unitsByBook.get(b.id) ?? 0 }))
        .sort((a, b) => b.units - a.units)
        .slice(0, 5),
    [books, unitsByBook],
  )

  // Monthly revenue for the bar chart — last 6 months, from paid/pending orders.
  const monthlySales = useMemo(() => {
    const now = new Date()
    const buckets: SalesBucket[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push({
        label: d
          .toLocaleDateString("fr-FR", { month: "short" })
          .replace(".", ""),
        value: 0,
      })
    }
    orders
      .filter((o) => o.status !== "refunded")
      .forEach((o) => {
        const d = new Date(o.date)
        const idx =
          (now.getFullYear() - d.getFullYear()) * 12 +
          (now.getMonth() - d.getMonth())
        if (idx >= 0 && idx <= 5) buckets[5 - idx].value += o.total
      })
    return buckets
  }, [orders])
  const maxMonthly = Math.max(1, ...monthlySales.map((m) => m.value))

  // Revenue share per category, for the breakdown bars.
  const categorySales = useMemo(() => {
    const priceById = new Map(books.map((b) => [b.id, b.price]))
    const catById = new Map(books.map((b) => [b.id, b.category]))
    const map = new Map<string, number>()
    orders
      .filter((o) => o.status !== "refunded")
      .forEach((o) =>
        o.items.forEach((it) => {
          const cat = catById.get(it.bookId) ?? "Autre"
          map.set(
            cat,
            (map.get(cat) ?? 0) + (priceById.get(it.bookId) ?? 0) * it.quantity,
          )
        }),
      )
    const arr = [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
    const total = arr.reduce((s, c) => s + c.value, 0) || 1
    return arr
      .slice(0, 5)
      .map((c) => ({ ...c, pct: Math.round((c.value / total) * 100) }))
  }, [books, orders])

  const navItems: AdminNavItem[] = [
    {
      id: "dashboard",
      label: "Tableau de bord",
      icon: <LayoutDashboard className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: "catalog",
      label: "Catalogue",
      icon: <LibraryIcon className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: "orders",
      label: "Commandes",
      icon: <ClipboardList className="w-4 h-4" aria-hidden="true" />,
    },
  ]

  const stats = [
    {
      label: "Revenu total",
      value: formatPrice(revenue),
      icon: <Wallet className="w-5 h-5" aria-hidden="true" />,
      hint: `${orders.filter((o) => o.status === "paid").length} commandes payées`,
    },
    {
      label: "Commandes",
      value: `${orders.length}`,
      icon: <ClipboardList className="w-5 h-5" aria-hidden="true" />,
      hint: `${orders.filter((o) => o.status === "pending").length} en attente`,
    },
    {
      label: "Titres publiés",
      value: `${publishedCount}`,
      icon: <BookText className="w-5 h-5" aria-hidden="true" />,
      hint: `${books.length - publishedCount} en brouillon`,
    },
    {
      label: "Note moyenne",
      value: `${avgRating.toFixed(1)}/5`,
      icon: <TrendingUp className="w-5 h-5" aria-hidden="true" />,
      hint: "sur l'ensemble du catalogue",
    },
  ]

  return (
    <div className="min-h-screen bg-surface-secondary-bg lg:grid lg:grid-cols-[264px_1fr]">
      {/* Sidebar */}
      <aside className="lg:sticky lg:top-0 lg:h-screen bg-surface-bg border-b lg:border-b-0 lg:border-r border-border-secondary flex lg:flex-col">
        <div className="flex lg:flex-col lg:h-full w-full">
          <div className="hidden lg:flex items-center gap-md px-xl h-[72px] border-b border-border-secondary">
            <img
              src={ybookSymbol}
              alt=""
              className="h-7 w-7 object-contain"
              aria-hidden="true"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-label font-semibold text-text-primary tracking-tight font-serif">
                YéYéBook
              </span>
              <span className="text-video-title text-text-tertiary uppercase tracking-widest">
                Console admin
              </span>
            </div>
          </div>
          <nav
            className="flex lg:flex-col gap-xs p-lg flex-1 overflow-x-auto"
            aria-label="Sections d'administration"
          >
            {navItems.map((item) => {
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center gap-md px-lg py-md rounded-corner-md text-label-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? "bg-brand-primary text-on-brand"
                      : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              )
            })}
          </nav>
          <div className="hidden lg:block p-lg border-t border-border-secondary">
            <button
              onClick={onExit}
              className="inline-flex items-center gap-md px-lg py-md rounded-corner-md text-label-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors cursor-pointer w-full"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" /> Retour à la
              boutique
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-surface-bg/85 backdrop-blur-xl border-b border-border-secondary">
          <div className="px-xl md:px-2xl h-[72px] flex items-center justify-between gap-lg">
            <div>
              <p className="text-video-title uppercase tracking-widest text-brand-primary font-semibold">
                Administration
              </p>
              <h1 className="text-heading font-semibold text-text-primary">
                {navItems.find((n) => n.id === tab)?.label}
              </h1>
            </div>
            <div className="flex items-center gap-md">
              {tab === "catalog" && (
                <Button
                  variant="primary"
                  iconStart={<Plus className="w-4 h-4" />}
                  onClick={() => setCreating(true)}
                >
                  Nouveau titre
                </Button>
              )}
              <button
                onClick={onExit}
                className="lg:hidden inline-flex items-center gap-xs text-label-sm text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" /> Boutique
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-xl md:px-2xl py-2xl animate-fade">
          {/* ------------------------------------------------ DASHBOARD */}
          {tab === "dashboard" && (
            <div className="flex flex-col gap-2xl max-w-[1100px]">
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-lg">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-corner-lg bg-surface-bg border border-border-secondary p-xl flex flex-col gap-md"
                  >
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-corner-md bg-brand-tertiary text-brand-primary">
                      {s.icon}
                    </span>
                    <div>
                      <p className="text-title font-semibold text-text-primary leading-none">
                        {s.value}
                      </p>
                      <p className="text-label-sm text-text-secondary mt-sm">
                        {s.label}
                      </p>
                    </div>
                    <p className="text-video-title text-text-tertiary mt-auto">
                      {s.hint}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-[1.4fr_1fr] gap-2xl">
                {/* Sales bar chart */}
                <section className="rounded-corner-lg bg-surface-bg border border-border-secondary p-xl">
                  <div className="flex items-center justify-between mb-xl">
                    <h2 className="text-label font-semibold text-text-primary">
                      Ventes des 6 derniers mois
                    </h2>
                    <span className="text-video-title text-text-tertiary">
                      Revenu mensuel
                    </span>
                  </div>
                  <div
                    className="flex items-end justify-between gap-md h-[180px]"
                    role="img"
                    aria-label="Graphique des ventes mensuelles"
                  >
                    {monthlySales.map((m) => (
                      <div
                        key={m.label}
                        className="flex-1 flex flex-col items-center gap-sm h-full justify-end"
                      >
                        <span className="text-video-title text-text-tertiary tabular-nums">
                          {m.value > 0 ? formatPrice(m.value) : ""}
                        </span>
                        <div
                          className="w-full max-w-[44px] rounded-t-corner-sm bg-brand-primary transition-all"
                          style={{
                            height: `${Math.max(4, (m.value / maxMonthly) * 100)}%`,
                          }}
                        />
                        <span className="text-video-title text-text-secondary capitalize">
                          {m.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Category breakdown */}
                <section className="rounded-corner-lg bg-surface-bg border border-border-secondary p-xl">
                  <h2 className="text-label font-semibold text-text-primary mb-xl">
                    Répartition par catégorie
                  </h2>
                  {categorySales.length === 0 ? (
                    <p className="text-label-sm text-text-tertiary">
                      Aucune vente pour le moment.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-lg">
                      {categorySales.map((c) => (
                        <li key={c.label}>
                          <div className="flex items-center justify-between mb-xs">
                            <span className="text-label-sm font-medium text-text-primary truncate">
                              {c.label}
                            </span>
                            <span className="text-video-title text-text-tertiary tabular-nums shrink-0 ml-md">
                              {c.pct}%
                            </span>
                          </div>
                          <div className="h-2 rounded-corner-full bg-brand-tertiary overflow-hidden">
                            <div
                              className="h-full rounded-corner-full bg-brand-primary transition-all"
                              style={{ width: `${c.pct}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              <div className="grid lg:grid-cols-[1.4fr_1fr] gap-2xl">
                {/* Recent orders */}
                <section className="rounded-corner-lg bg-surface-bg border border-border-secondary overflow-hidden">
                  <div className="flex items-center justify-between px-xl py-lg border-b border-border-secondary">
                    <h2 className="text-label font-semibold text-text-primary">
                      Commandes récentes
                    </h2>
                    <button
                      onClick={() => setTab("orders")}
                      className="text-video-title font-semibold text-brand-primary hover:underline cursor-pointer"
                    >
                      Tout voir
                    </button>
                  </div>
                  <ul className="divide-y divide-border-secondary">
                    {orders.slice(0, 5).map((o) => (
                      <li
                        key={o.id}
                        className="flex items-center justify-between gap-lg px-xl py-md"
                      >
                        <div className="min-w-0">
                          <p className="text-label-sm font-semibold text-text-primary truncate">
                            {o.customer}
                          </p>
                          <p className="text-video-title text-text-tertiary">
                            {o.id} · {PROVIDER_LABELS[o.provider] ?? o.provider}
                          </p>
                        </div>
                        <div className="flex items-center gap-lg shrink-0">
                          <span className="text-label-sm font-semibold text-text-primary hidden sm:inline">
                            {formatPrice(o.total)}
                          </span>
                          <StatusPill status={o.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Top titles */}
                <section className="rounded-corner-lg bg-surface-bg border border-border-secondary overflow-hidden">
                  <div className="px-xl py-lg border-b border-border-secondary">
                    <h2 className="text-label font-semibold text-text-primary">
                      Meilleures ventes
                    </h2>
                  </div>
                  <ul className="flex flex-col">
                    {topBooks.map(({ book, units }, i) => (
                      <li
                        key={book.id}
                        className="flex items-center gap-lg px-xl py-md border-b border-border-secondary last:border-b-0"
                      >
                        <span className="text-label-sm font-semibold text-text-tertiary w-4">
                          {i + 1}
                        </span>
                        <div className="w-8 h-12 rounded-corner-sm overflow-hidden bg-brand-tertiary border border-border-secondary shrink-0">
                          <img
                            src={book.cover}
                            alt=""
                            onError={handleCoverError}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-label-sm font-semibold text-text-primary truncate">
                            {book.title}
                          </p>
                          <p className="text-video-title text-text-tertiary truncate">
                            {book.author}
                          </p>
                        </div>
                        <span className="text-label-sm font-semibold text-brand-primary whitespace-nowrap">
                          {units} vendu{units > 1 ? "s" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          )}

          {/* ------------------------------------------------ CATALOG */}
          {tab === "catalog" && (
            <div className="flex flex-col gap-lg max-w-[1100px]">
              <div className="flex items-center justify-between gap-lg">
                <div className="w-full max-w-[360px]">
                  <SearchComponent
                    placeholder="Rechercher un titre, un auteur…"
                    value={catalogQuery}
                    onChange={setCatalogQuery}
                  />
                </div>
                <span className="text-label-sm text-text-tertiary whitespace-nowrap hidden sm:inline">
                  {catalogBooks.length}{" "}
                  {catalogBooks.length > 1 ? "titres" : "titre"}
                </span>
              </div>

              {catalogBooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-md py-4xl text-center rounded-corner-lg border border-dashed border-border-primary bg-surface-bg">
                  <LibraryIcon
                    className="w-8 h-8 text-text-tertiary"
                    aria-hidden="true"
                  />
                  <p className="text-label-sm text-text-secondary">
                    Aucun titre ne correspond à « {catalogQuery} ».
                  </p>
                </div>
              ) : (
                <div className="rounded-corner-lg bg-surface-bg border border-border-secondary overflow-hidden">
                  <table className="w-full border-collapse">
                    <caption className="sr-only">
                      Liste des titres du catalogue
                    </caption>
                    <thead>
                      <tr className="text-left text-video-title uppercase tracking-wide text-text-tertiary border-b border-border-secondary">
                        <th scope="col" className="font-semibold px-xl py-md">
                          Titre
                        </th>
                        <th
                          scope="col"
                          className="font-semibold px-lg py-md hidden md:table-cell"
                        >
                          Catégorie
                        </th>
                        <th
                          scope="col"
                          className="font-semibold px-lg py-md hidden sm:table-cell"
                        >
                          Prix
                        </th>
                        <th scope="col" className="font-semibold px-lg py-md">
                          Statut
                        </th>
                        <th
                          scope="col"
                          className="font-semibold px-xl py-md text-right"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {catalogBooks.map((book) => {
                        const published = book.published !== false
                        return (
                          <tr
                            key={book.id}
                            className="border-b border-border-secondary last:border-b-0 hover:bg-surface-secondary-bg transition-colors"
                          >
                            <td className="px-xl py-md">
                              <div className="flex items-center gap-md">
                                <div className="w-9 h-[52px] rounded-corner-sm overflow-hidden bg-brand-tertiary border border-border-secondary shrink-0">
                                  <img
                                    src={book.cover}
                                    alt=""
                                    onError={handleCoverError}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-label-sm font-semibold text-text-primary line-clamp-1">
                                    {book.title}
                                  </p>
                                  <p className="text-video-title text-text-tertiary">
                                    {book.author}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-lg py-md hidden md:table-cell">
                              <Badge
                                variant="secondary"
                                label={book.category}
                              />
                            </td>
                            <td className="px-lg py-md hidden sm:table-cell text-label-sm font-medium text-text-primary whitespace-nowrap">
                              {formatPrice(book.price)}
                            </td>
                            <td className="px-lg py-md">
                              <button
                                onClick={() => onTogglePublish(book.id)}
                                aria-pressed={published}
                                className="inline-flex items-center gap-xs text-video-title font-semibold cursor-pointer group"
                                aria-label={
                                  published
                                    ? `Dépublier « ${book.title} »`
                                    : `Publier « ${book.title} »`
                                }
                              >
                                {published ? (
                                  <span className="inline-flex items-center gap-xs text-brand-primary">
                                    <Eye
                                      className="w-3.5 h-3.5"
                                      aria-hidden="true"
                                    />{" "}
                                    Publié
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-xs text-text-tertiary group-hover:text-text-secondary">
                                    <EyeOff
                                      className="w-3.5 h-3.5"
                                      aria-hidden="true"
                                    />{" "}
                                    Brouillon
                                  </span>
                                )}
                              </button>
                            </td>
                            <td className="px-xl py-md">
                              <div className="flex items-center justify-end gap-xs">
                                <button
                                  onClick={() => setEditing(book)}
                                  aria-label={`Modifier « ${book.title} »`}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-corner-md text-text-secondary hover:bg-surface-hover hover:text-brand-primary transition-colors cursor-pointer"
                                >
                                  <Pencil
                                    className="w-4 h-4"
                                    aria-hidden="true"
                                  />
                                </button>
                                <button
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Supprimer « ${book.title} » du catalogue ?`,
                                      )
                                    )
                                      onDeleteBook(book.id)
                                  }}
                                  aria-label={`Supprimer « ${book.title} »`}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-corner-md text-text-secondary hover:bg-[#c13f4e]/10 hover:text-danger transition-colors cursor-pointer"
                                >
                                  <Trash2
                                    className="w-4 h-4"
                                    aria-hidden="true"
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------ ORDERS */}
          {tab === "orders" && (
            <div className="flex flex-col gap-lg max-w-[1100px]">
              <div
                className="flex flex-wrap gap-sm"
                role="group"
                aria-label="Filtrer les commandes par statut"
              >
                {([
                  { id: "all", label: "Toutes" },
                  { id: "paid", label: "Payées" },
                  { id: "pending", label: "En attente" },
                  { id: "refunded", label: "Remboursées" },
                ] as const).map((f) => {
                  const active = orderFilter === f.id
                  const count =
                    f.id === "all"
                      ? orders.length
                      : orders.filter((o) => o.status === f.id).length
                  return (
                    <button
                      key={f.id}
                      onClick={() => setOrderFilter(f.id)}
                      aria-pressed={active}
                      className={`inline-flex items-center gap-xs px-lg py-sm rounded-corner-full text-label-sm font-medium border transition-all cursor-pointer ${
                        active
                          ? "bg-brand-primary text-on-brand border-brand-primary"
                          : "bg-surface-bg text-text-secondary border-border-secondary hover:border-brand-primary hover:text-text-primary"
                      }`}
                    >
                      {f.label}
                      <span
                        className={`text-video-title ${
                          active ? "text-on-brand/80" : "text-text-tertiary"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {visibleOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-md py-4xl text-center rounded-corner-lg border border-dashed border-border-primary bg-surface-bg">
                  <ClipboardList
                    className="w-8 h-8 text-text-tertiary"
                    aria-hidden="true"
                  />
                  <p className="text-label-sm text-text-secondary">
                    Aucune commande dans cette catégorie.
                  </p>
                </div>
              ) : (
                <div className="rounded-corner-lg bg-surface-bg border border-border-secondary overflow-hidden">
                  <table className="w-full border-collapse">
                    <caption className="sr-only">Liste des commandes</caption>
                    <thead>
                      <tr className="text-left text-video-title uppercase tracking-wide text-text-tertiary border-b border-border-secondary">
                        <th scope="col" className="font-semibold px-xl py-md">
                          Commande
                        </th>
                        <th
                          scope="col"
                          className="font-semibold px-lg py-md hidden md:table-cell"
                        >
                          Paiement
                        </th>
                        <th
                          scope="col"
                          className="font-semibold px-lg py-md hidden sm:table-cell"
                        >
                          Articles
                        </th>
                        <th scope="col" className="font-semibold px-lg py-md">
                          Total
                        </th>
                        <th
                          scope="col"
                          className="font-semibold px-xl py-md text-right"
                        >
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleOrders.map((o) => {
                        const units = o.items.reduce(
                          (n, it) => n + it.quantity,
                          0,
                        )
                        return (
                          <tr
                            key={o.id}
                            className="border-b border-border-secondary last:border-b-0 hover:bg-surface-secondary-bg transition-colors"
                          >
                            <td className="px-xl py-md">
                              <p className="text-label-sm font-semibold text-text-primary">
                                {o.customer}
                              </p>
                              <p className="text-video-title text-text-tertiary">
                                {o.id} · {o.date}
                              </p>
                            </td>
                            <td className="px-lg py-md hidden md:table-cell">
                              <p className="text-label-sm text-text-primary">
                                {PROVIDER_LABELS[o.provider] ?? o.provider}
                              </p>
                              <p className="text-video-title text-text-tertiary">
                                {o.phone}
                              </p>
                            </td>
                            <td className="px-lg py-md hidden sm:table-cell text-label-sm text-text-secondary">
                              {units}
                            </td>
                            <td className="px-lg py-md text-label-sm font-semibold text-text-primary whitespace-nowrap">
                              {formatPrice(o.total)}
                            </td>
                            <td className="px-xl py-md">
                              <div className="flex items-center justify-end gap-md">
                                <StatusPill status={o.status} />
                                <select
                                  value={o.status}
                                  onChange={(e) =>
                                    onSetOrderStatus(
                                      o.id,
                                      e.target.value as OrderStatus,
                                    )
                                  }
                                  aria-label={`Changer le statut de la commande ${o.id}`}
                                  className="text-video-title font-medium text-text-secondary bg-surface-secondary-bg border border-border-secondary rounded-corner-md px-sm py-xs cursor-pointer hover:border-brand-primary transition-colors"
                                >
                                  <option value="paid">Payée</option>
                                  <option value="pending">En attente</option>
                                  <option value="refunded">Remboursée</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {(editing || creating) && (
        <BookForm
          book={editing}
          existingIds={books.map((b) => b.id)}
          onClose={() => {
            setEditing(null)
            setCreating(false)
          }}
          onSave={(b) => {
            onSaveBook(b)
            setEditing(null)
            setCreating(false)
          }}
        />
      )}
    </div>
  )
}

function BookForm({
  book,
  existingIds,
  onClose,
  onSave,
}: {
  book: Book | null
  existingIds: number[]
  onClose: () => void
  onSave: (book: Book) => void
}) {
  const [form, setForm] = useState({
    title: book?.title ?? "",
    author: book?.author ?? "",
    category: book?.category ?? "Roman",
    price: book ? String(book.price) : "",
    pages: book ? String(book.pages) : "",
    year: book ? String(book.year) : String(new Date().getFullYear()),
    cover: book?.cover ?? "",
    description: book?.description ?? "",
  })
  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }))
  const categories = CATALOG_CATEGORIES.map(({ value }) => value)
  const valid =
    form.title.trim() && form.author.trim() && Number(form.price) > 0

  const submit = () => {
    if (!valid) return
    const id =
      book?.id ?? (existingIds.length ? Math.max(...existingIds) + 1 : 1)
    const description =
      form.description.trim() ||
      `Un titre de ${form.author.trim()} disponible en lecture en ligne sur YéYéBook.`
    const chapters =
      book?.chapters ??
      buildChapters(form.title.trim(), form.author.trim(), description, [
        "la mémoire du continent",
        "la voix des anciens",
        "le poids du choix",
        "l'espoir qui perce",
      ])
    onSave({
      id,
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category,
      price: Number(form.price),
      pages: Number(form.pages) || 120,
      year: Number(form.year) || new Date().getFullYear(),
      rating: book?.rating ?? 4.5,
      reviews: book?.reviews ?? 0,
      cover:
        form.cover.trim() ||
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=1200&fit=crop&auto=format",
      description,
      chapters,
      published: book?.published ?? true,
    })
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-form-title"
    >
      <div
        className="absolute inset-0 bg-[#100908]/40 animate-fade"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-[480px] h-full bg-surface-bg shadow-2xl flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-xl py-lg border-b border-border-secondary">
          <h2
            id="book-form-title"
            className="text-heading font-semibold text-text-primary"
          >
            {book ? "Modifier le titre" : "Nouveau titre"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="inline-flex items-center justify-center w-9 h-9 rounded-corner-full text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-xl py-lg flex flex-col gap-lg">
          <InputField
            label="Titre"
            placeholder="Une si longue lettre"
            value={form.title}
            onChange={(v) => set("title", v)}
          />
          <InputField
            label="Auteur"
            placeholder="Mariama Bâ"
            value={form.author}
            onChange={(v) => set("author", v)}
          />

          <div className="flex flex-col gap-sm">
            <span className="text-label-sm font-medium text-text-primary">
              Catégorie
            </span>
            <div
              className="flex flex-wrap gap-sm"
              role="group"
              aria-label="Catégorie"
            >
              {categories.map((c) => {
                const active = form.category === c
                return (
                  <button
                    key={c}
                    onClick={() => set("category", c)}
                    aria-pressed={active}
                    className={`px-lg py-sm rounded-corner-full text-label-sm font-medium border transition-all cursor-pointer ${
                      active
                        ? "bg-brand-primary text-on-brand border-brand-primary"
                        : "bg-surface-bg text-text-secondary border-border-secondary hover:border-brand-primary"
                    }`}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-md">
            <InputField
              label="Prix (FCFA)"
              placeholder="2500"
              value={form.price}
              onChange={(v) => set("price", v.replace(/[^0-9]/g, ""))}
            />
            <InputField
              label="Pages"
              placeholder="165"
              value={form.pages}
              onChange={(v) => set("pages", v.replace(/[^0-9]/g, ""))}
            />
            <InputField
              label="Année"
              placeholder="1979"
              value={form.year}
              onChange={(v) => set("year", v.replace(/[^0-9]/g, ""))}
            />
          </div>

          <InputField
            label="Image de couverture (URL)"
            placeholder="https://…"
            value={form.cover}
            onChange={(v) => set("cover", v)}
          />

          <div className="flex flex-col gap-sm">
            <label
              htmlFor="book-desc"
              className="text-label-sm font-medium text-text-primary"
            >
              Description
            </label>
            <textarea
              id="book-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={5}
              placeholder="Un résumé de l'œuvre…"
              className="w-full rounded-corner-md border border-border-secondary bg-surface-bg px-lg py-md text-label-sm text-text-primary placeholder:text-text-tertiary resize-none focus:border-brand-primary transition-colors"
            />
          </div>
        </div>

        <div className="border-t border-border-secondary px-xl py-lg flex items-center gap-md">
          <Button variant="neutral" onClick={onClose}>
            Annuler
          </Button>
          <div className="flex-1" />
          <Button
            variant="primary"
            iconStart={<Check className="w-4 h-4" />}
            disabled={!valid}
            onClick={submit}
          >
            {book ? "Enregistrer" : "Créer le titre"}
          </Button>
        </div>
      </aside>
    </div>
  )
}

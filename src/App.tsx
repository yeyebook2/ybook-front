"use client"

/** A short, realistic order history so the back-office is populated on first load. */

// Lecteur — réglages de lecture (thème, taille, interligne)

// Reader state

// Persist the guest/user cart locally until the cart API is connected.

// Persist reading progress
/* storage unavailable — progress stays in-memory */

// Wire the YéYéBook favicon + document title (index.html keeps Figma placeholders)

// ---- Admin (Phase 1 back-office) --------------------------------------

// ---- Reading ----------------------------------------------------------
// Offer to resume where the reader left off.

// ---- Auth gets its own focused chrome ----------------------------------

// ---- Admin gets its own full-screen chrome ----------------------------

// ---- Immersive reader gets its own full-screen chrome -----------------

// Reading themes — parchment/sepia/ink palettes applied to the pane only.
/* Reader toolbar — dark plum chrome, consistent across themes */ /* Settings panel */ /* Chapter sidebar (desktop) */ /* Reading pane */ /* Chapter navigation */ /* Bottom reading progress bar with page count */ /* Chapter drawer (mobile) */ /* Top navigation — horizontal navbar (no sidebar), sticky and premium */ /* ---------------------------------------------------------------- HOME */ /* Hero — solid deep-wine ground, editorial and calm (no gradient) */ /* Nouveautés */ /* Best-sellers du mois — ranked list */ /* Catégories populaires — gradient tiles */
// Calm ivory cards with a muted charter-tinted icon chip — no fills, no gradients.
/* Trust band */ /* ---------------------------------------------------------------- CATALOG */ /* ---------------------------------------------------------------- DETAILS */ /* ---------------------------------------------------------------- CHECKOUT */ /* ---------------------------------------------------------------- CONFIRMATION */ /* ---------------------------------------------------------------- LIBRARY */ /* Stats */ /* Historique des commandes */ /* Footer — 4-column with newsletter (maquette skeleton) */ /* ---------------------------------------------------------------- CART DRAWER */ /* ---------------------------------------------------------------- RESUME PROMPT */ /* ---------------------------------------------------------------- TOAST */
// Wizard step within checkout: 1 = Informations, 2 = Paiement.
// Map wizard step (1/2) onto the visible stepper positions (2 = Informations, 3 = Paiement).
/* Wizard stepper */

/* ==================================================================== *
 * Back-office admin (Phase 1) — catalogue management, orders & stats.
 * Runs in its own full-screen shell, separate from the storefront chrome.
 * ==================================================================== */

// Monthly revenue for the bar chart — last 6 months, from paid/pending orders.

// Revenue share per category, for the breakdown bars.
/* Sidebar */ /* Main */ /* ------------------------------------------------ DASHBOARD */ /* Sales bar chart */ /* Category breakdown */ /* Recent orders */ /* Top titles */ /* ------------------------------------------------ CATALOG */ /* ------------------------------------------------ ORDERS */

import { useRouter } from "next/navigation"
import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react"
import {
  Avatar,
  Button,
  Badge,
  InputField,
} from "@figma/astraui"
import { SearchInput } from "@/components/ui/SearchInput"
import { Toast, type ToastVariant } from "@/components/ui/Toast"
import { ApiError } from "@/lib/api-errors"
import { createOrderApi, initiatePaymentApi } from "@/features/checkout/checkout.api"
import {
  AdminBookEditor,
  createAdminBookApi,
  deleteAdminBookApi,
  deleteAdminReviewApi,
  getAdminBooksApi,
  getAdminOrdersApi,
  getAdminReviewsApi,
  getAdminStatsApi,
  toggleBookPublishApi,
  updateAdminBookApi,
  updateOrderStatusApi,
  uploadCoverApi,
  uploadEpubApi,
} from "@/features/admin"
import type { AdminBook, AdminReview, AdminStats } from "@/features/admin/types"
import { LegalModal, type LegalModalType } from "@/components/ui/LegalModal"
const ybookSymbol = "/brand/ybook-symbol-primary.png"
const faviconPng = "/brand/ybook-favicon-180.png"
import { Wordmark } from "@/components/brand/Wordmark"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { RegisterPage } from "@/features/auth/pages/RegisterPage"
import { AuthGuard } from "@/features/auth/components/AuthGuard"
import { RoleGuard } from "@/features/auth/components/RoleGuard"
import {
  forgotPassword,
  getCachedUser,
  getCurrentUser,
  logout,
} from "@/features/auth/auth.api"
import type { AuthApiResponse, AuthUser } from "@/features/auth/types"
import {
  consumePendingToast,
  setPendingToast,
} from "@/lib/pending-toast"
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import {
  getLibraryBookIds,
  getLibraryItems,
  getMyOrders,
} from "@/features/dashboard/dashboard.api"
import type { DashboardBook } from "@/features/dashboard/types"
import { loadCart, MAX_CART_QUANTITY, saveCart } from "@/features/cart"
import type { CartItem } from "@/features/cart"
import { CatalogPage } from "@/features/catalog/pages/CatalogPage"
import { getCatalog } from "@/features/catalog/catalog.api"
import {
  CATALOG_CATEGORIES,
  DEFAULT_CATALOG_FILTERS,
} from "@/features/catalog/catalog.constants"
import { BookDetailPage } from "@/features/book-details"
import { getBookDetail } from "@/features/book-details/book-details.api"
import { EpubWebReader } from "@/features/reader"
import { formatPrice, handleCoverError } from "@/features/catalog/catalog.utils"
import { BookCard } from "@/features/catalog/components/BookCard"
import { RatingStars } from "@/features/catalog/components/RatingStars"
import type { Book, CatalogBook, Chapter } from "@/features/catalog/types"
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
  BookPlus,
  ClipboardList,
  MessageSquare,
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
  Menu,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  UploadCloud,
  Image as ImageIcon,
  Info,
  Search,
} from "lucide-react"

export type View = "home" | "catalog" | "details" | "checkout" | "confirmation" | "library" | "reader" | "admin" | "login" | "register" | "dashboard"
type ToastState = {
  message: string
  variant?: ToastVariant
} | null
type Progress = Record<string, number>
type OrderStatus = "paid" | "pending" | "refunded" | "cancelled"
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
  orders_count?: number
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
function getProgressKey(userId?: string | null): string {
  return userId ? `yeyebook-reading-progress-${userId}` : "yeyebook-reading-progress-guest"
}

function loadProgress(userId?: string | null): Progress {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(getProgressKey(userId))
    return raw ? (JSON.parse(raw) as Progress) : {}
  } catch {
    return {}
  }
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`

export default function App({
  initialView = "home",
  initialBookSlug,
  initialReaderSlug,
}: {
  initialView?: View
  initialBookSlug?: string
  initialReaderSlug?: string
}) {
  const router = useRouter()
  const [view, setView] = useState<View>(initialView)
  const [currentBookSlug, setCurrentBookSlug] = useState<string | null>(
    initialBookSlug ?? null,
  )
  const [currentReaderSlug, setCurrentReaderSlug] = useState<string | null>(
    initialReaderSlug ?? null,
  )
  const [readerBookData, setReaderBookData] = useState<Book | null>(null)
  const [readerLoading, setReaderLoading] = useState(false)
  const [readerError, setReaderError] = useState<string | null>(null)
  const [purchasedBooks, setPurchasedBooks] = useState<Book[]>([])

  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [books, setBooks] = useState<Book[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartHydrated, setCartHydrated] = useState(false)
  const [library, setLibrary] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("Tous")
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [legalModal, setLegalModal] = useState<LegalModalType | null>(null)

  const [libGrid, setLibGrid] = useState<boolean>(true)

  const setLibraryViewMode = useCallback((isGrid: boolean) => {
    setLibGrid(isGrid)
    try {
      localStorage.setItem("yeyebook-library-view-mode", isGrid ? "grid" : "list")
    } catch {}
  }, [])
  const [readerTheme, setReaderTheme] = useState<"light" | "sepia" | "dark">(
    "light",
  )
  const [readerFont, setReaderFont] = useState(21)
  const [readerLeading, setReaderLeading] = useState(1.75)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [bookmarks, setBookmarks] = useState<Record<string, number[]>>({})
  const [readerBookId, setReaderBookId] = useState<string | null>(null)
  const [currentChapter, setCurrentChapter] = useState(0)
  const [chapterListOpen, setChapterListOpen] = useState(false)
  const [progress, setProgress] = useState<Progress>({})
  const [progressHydrated, setProgressHydrated] = useState(false)
  const [resumePrompt, setResumePrompt] = useState<{
    book: Book
    chapter: number
  } | null>(null)

  const showToast = useCallback(
    (message?: string | null, variant: ToastVariant = "default") => {
      console.log("[YéYéBook Toast] showToast appelé avec:", { message, variant })
      if (!message || typeof message !== "string" || !message.trim()) {
        console.warn(
          "[YéYéBook Toast] showToast ignoré car message vide ou non textuel:",
          message,
        )
        return
      }
      const clean = message.trim()
      setPendingToast({ message: clean, variant })
      setToast({ message: clean, variant })
      try {
        window.dispatchEvent(
          new CustomEvent("yeyebook:toast", {
            detail: { message: clean, variant },
          }),
        )
      } catch {}
    },
    [],
  )

  const isRefreshingLibraryRef = useRef(false)
  const refreshLibrary = useCallback(async () => {
    if (isRefreshingLibraryRef.current) return
    isRefreshingLibraryRef.current = true
    try {
      const [items, userOrders] = await Promise.all([
        getLibraryItems(),
        getMyOrders().catch(() => []),
      ])
      if (items && items.length > 0) {
        const ids = items.map((i) => i.id)
        setLibrary((prev) => Array.from(new Set([...prev, ...ids])))
        setPurchasedBooks(
          items.map((i) => ({
            id: i.id,
            title: i.title,
            author: i.author,
            category: i.category,
            price: i.price ?? 0,
            cover: i.cover,
            slug: i.slug,
            rating: 5,
            reviews: 1,
            pages: 150,
            year: 2026,
            description: "",
            chapters: [],
          })),
        )
      }
      if (userOrders && userOrders.length > 0) {
        setOrders(
          userOrders.map((uo) => ({
            id: uo.id.slice(0, 8).toUpperCase(),
            customer: sessionUser?.name || "Client",
            email: sessionUser?.email || "",
            phone: sessionUser?.phone || "",
            provider: "fedapay",
            items: (uo.items || []).map((it) => ({
              bookId: it.slug || it.title,
              title: it.title,
              quantity: it.quantity || 1,
              price: it.unit_price,
            })),
            total: uo.total_amount,
            date: uo.created_at
              ? new Date(uo.created_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "",
            status: uo.status as OrderStatus,
          })),
        )
      }
    } catch (err) {
      console.warn("[YéYéBook] Erreur chargement bibliothèque:", err)
    } finally {
      isRefreshingLibraryRef.current = false
    }
  }, [sessionUser])

  const ownedBookIds = useMemo(() => new Set(library), [library])

  const selectedBook = useMemo(
    () =>
      books.find(
        (b) =>
          b.id === selectedBookId ||
          (currentBookSlug && b.slug === currentBookSlug),
      ),
    [books, selectedBookId, currentBookSlug],
  )
  const readerBook = useMemo(
    () =>
      books.find(
        (b) =>
          b.id === readerBookId ||
          (currentReaderSlug && b.slug === currentReaderSlug),
      ) ||
      purchasedBooks.find(
        (b) =>
          b.id === readerBookId ||
          (currentReaderSlug && b.slug === currentReaderSlug),
      ) ||
      readerBookData,
    [books, purchasedBooks, readerBookId, currentReaderSlug, readerBookData],
  )

  const cartTotal = useMemo(
    () =>
      cartItems.reduce((total, item) => {
        const book =
          books.find((b) => b.id === item.bookId) ||
          purchasedBooks.find((b) => b.id === item.bookId)
        const price = book?.price ?? item.price ?? 0
        return total + price
      }, 0),
    [books, purchasedBooks, cartItems],
  )
  const cartCount = cartItems.length

  useEffect(() => {
    let active = true
    void getCatalog({
      ...DEFAULT_CATALOG_FILTERS,
      limit: 20,
      sortBy: "published_at",
      sortOrder: "desc",
    })
      .then((response) => {
        if (!active) return
        setBooks(
          response.items.map((book) => {
            const rawBook = book as unknown as { chapters?: Chapter[] }
            return {
              ...book,
              chapters:
                rawBook.chapters && rawBook.chapters.length > 0
                  ? rawBook.chapters
                  : [
                      {
                        title: `Présentation & Extrait — ${book.title}`,
                        content:
                        (book.description || "")
                          .split("\n\n")
                          .map((p) => p.trim())
                          .filter(Boolean).length > 0
                          ? (book.description || "")
                              .split("\n\n")
                              .map((p) => p.trim())
                              .filter(Boolean)
                          : [
                              `Bienvenue dans la lecture de « ${book.title} » par ${book.author}.`,
                              "Cet e-book est disponible dans votre bibliothèque personnelle.",
                              "Profitez de votre espace de lecture en ligne sur YéYéBook.",
                            ],
                    },
                  ],
            }
          }),
        )
      })
      .catch((reason: unknown) => {
        if (!active) return
        setBooks([])
        showToast(
          reason instanceof Error
            ? reason.message
            : "Impossible de charger les livres de l’accueil.",
          "error",
        )
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const cached = getCachedUser()
    if (cached) {
      setSessionUser(cached)
      setSessionChecked(true)
    }
    try {
      const saved = localStorage.getItem("yeyebook-library-view-mode")
      if (saved === "list") setLibGrid(false)
      if (saved === "grid") setLibGrid(true)
    } catch {}
  }, [])

  useEffect(() => {
    let active = true
    void getCurrentUser()
      .then((user) => {
        if (!active) return
        setSessionUser(user)
        if (user) {
          void refreshLibrary()
        }
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
  }, [refreshLibrary])

  useEffect(() => {
    try {
      if (localStorage.getItem("ybook-library-refresh-needed") === "true") {
        localStorage.removeItem("ybook-library-refresh-needed")
        void refreshLibrary()
      }
    } catch {}
  }, [refreshLibrary, view])

  useEffect(() => {
    if (initialBookSlug) {
      setCurrentBookSlug(initialBookSlug)
      setView("details")
    }
  }, [initialBookSlug])

  useEffect(() => {
    if (initialReaderSlug) {
      setCurrentReaderSlug(initialReaderSlug)
      setView("reader")
    }
  }, [initialReaderSlug])

  useEffect(() => {
    if (view !== "reader") return
    const slugToLoad = currentReaderSlug || initialReaderSlug
    if (!slugToLoad) return

    if (
      (readerBookData?.slug === slugToLoad &&
        readerBookData.chapters &&
        readerBookData.chapters.length > 0) ||
      (readerBook?.slug === slugToLoad &&
        readerBook.chapters &&
        readerBook.chapters.length > 0)
    ) {
      return
    }

    let active = true
    setReaderLoading(true)
    setReaderError(null)

    void getBookDetail(slugToLoad)
      .then((detail) => {
        if (!active) return
        const b = detail.book
        const chapters =
          b.chapters && b.chapters.length > 0
            ? b.chapters
            : [
                {
                  title: `Présentation & Extrait — ${b.title}`,
                  content:
                    (b.description || "")
                      .split("\n\n")
                      .map((p) => p.trim())
                      .filter(Boolean).length > 0
                      ? (b.description || "")
                          .split("\n\n")
                          .map((p) => p.trim())
                          .filter(Boolean)
                      : [
                          `Bienvenue dans la lecture de « ${b.title} » par ${b.author}.`,
                          "Cet e-book est disponible dans votre bibliothèque personnelle.",
                          "Profitez de votre espace de lecture en ligne sur YéYéBook.",
                        ],
                },
              ]
        const fullBook: Book = {
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          author: b.author,
          authorSlug: b.authorSlug,
          price: b.price,
          category: b.category,
          rating: b.rating,
          reviews: b.reviews,
          pages: b.pages,
          year: b.year,
          isbn: b.isbn,
          cover: b.cover,
          description: b.description,
          tags: b.tags,
          chapters,
          slug: b.slug,
          language: b.language,
        }
        setReaderBookData(fullBook)
        setReaderBookId(fullBook.id)
      })
      .catch((err) => {
        if (!active) return
        setReaderError(
          err instanceof Error
            ? err.message
            : "Impossible de charger cet e-book pour le moment.",
        )
      })
      .finally(() => {
        if (active) setReaderLoading(false)
      })

    return () => {
      active = false
    }
  }, [view, currentReaderSlug, initialReaderSlug, readerBook, readerBookData])

  useEffect(() => {
    if (!toast) return
    const duration =
      toast.variant === "error" || toast.variant === "warning" ? 6500 : 4500
    const t = setTimeout(() => {
      console.log(
        "[YéYéBook Toast] Auto-masquage du toast après délai:",
        toast.message,
      )
      setToast(null)
    }, duration)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!userMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest("#user-menu-container")) {
        setUserMenuOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [userMenuOpen])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [view, selectedBookId])

  useEffect(() => {
    setCartItems(loadCart())
    setCartHydrated(true)
    setProgress(loadProgress(sessionUser?.id))
    setProgressHydrated(true)
  }, [sessionUser?.id])

  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const ce = e as CustomEvent<{ message: string; variant?: ToastVariant }>
      if (ce.detail?.message) {
        console.log("[YéYéBook Toast] Événement global 'yeyebook:toast' intercepté:", ce.detail)
        setToast({
          message: ce.detail.message,
          variant: ce.detail.variant || "default",
        })
      }
    }
    window.addEventListener("yeyebook:toast", handleGlobalToast)
    return () => {
      window.removeEventListener("yeyebook:toast", handleGlobalToast)
    }
  }, [])

  useEffect(() => {
    const pending = consumePendingToast()
    if (pending) {
      console.log("[YéYéBook Toast] Pending toast consommé (vue ou montage):", pending)
      setToast(pending)
    }
  }, [view])
  useEffect(() => {
    if (!cartHydrated) return
    saveCart(cartItems)
  }, [cartHydrated, cartItems])
  useEffect(() => {
    if (!progressHydrated) return
    try {
      localStorage.setItem(
        getProgressKey(sessionUser?.id),
        JSON.stringify(progress),
      )
    } catch {}
  }, [progressHydrated, progress, sessionUser?.id])
  useEffect(() => {
    setProgress(loadProgress(sessionUser?.id))
  }, [sessionUser?.id])
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

  const go = useCallback(
    (next: View) => {
      setView(next)
      const routes: Partial<Record<View, string>> = {
        home: "/",
        catalog: "/catalog",
        checkout: "/checkout",
        dashboard: "/dashboard",
        library: "/library",
        login: "/login",
        register: "/register",
        admin: "/yeye-admin-admin",
      }
      const route = routes[next]
      if (route) router.push(route)
    },
    [router],
  )

  const openBook = (idOrBook: string | { id: string; slug?: string }) => {
    const id = typeof idOrBook === "string" ? idOrBook : idOrBook.id
    const book =
      books.find((candidate) => candidate.id === id) ||
      purchasedBooks.find((candidate) => candidate.id === id) ||
      (typeof idOrBook === "object" ? idOrBook : undefined)
    const slug = book?.slug
    setSelectedBookId(id)
    if (slug) {
      setCurrentBookSlug(slug)
      router.push(`/books/${slug}`)
    }
    setView("details")
  }
  const openCatalog = (category?: string) => {
    setActiveCategory(category ?? "Tous")
    setView("catalog")
    const query =
      category && category !== "Tous"
        ? `?category=${encodeURIComponent(category)}`
        : ""
    router.push(`/catalog${query}`)
  }

  const addToCart = (
    bookOrId:
      | string
      | Book
      | CatalogBook
      | {
          id: string
          title?: string
          author?: string
          price?: number
          cover?: string
          slug?: string
        },
    options: { openCart?: boolean } = {},
  ) => {
    const shouldOpenCart = options.openCart ?? true
    const bookId = typeof bookOrId === "string" ? bookOrId : bookOrId.id
    const incomingBook = typeof bookOrId === "object" ? bookOrId : undefined

    if (
      incomingBook &&
      "title" in incomingBook &&
      typeof incomingBook.title === "string" &&
      "category" in incomingBook &&
      typeof incomingBook.category === "string"
    ) {
      const full = incomingBook as Partial<Book> & Partial<CatalogBook>
      setBooks((prev) => {
        if (prev.some((b) => b.id === incomingBook.id)) return prev
        const normalized: Book = {
          id: incomingBook.id,
          title: full.title || "Titre",
          subtitle: full.subtitle,
          author: full.author || "Auteur",
          authorSlug: full.authorSlug,
          price: full.price ?? 0,
          category: full.category || "Roman",
          rating: full.rating ?? 5,
          reviews: full.reviews ?? 1,
          pages: full.pages ?? 150,
          year: full.year ?? 2026,
          isbn: full.isbn,
          cover: full.cover || "",
          description: full.description ?? "",
          tags: full.tags ?? [],
          chapters: Array.isArray(full.chapters) ? full.chapters : [],
          slug: full.slug,
          language: full.language,
        }
        return [...prev, normalized]
      })
    }

    const existing = cartItems.find((item) => item.bookId === bookId)
    const book =
      incomingBook ||
      books.find((b) => b.id === bookId) ||
      purchasedBooks.find((b) => b.id === bookId)

    if (existing) {
      showToast(
        `« ${book?.title ?? "Cet e-book"} » est déjà dans votre panier.`,
        "warning",
      )
      if (shouldOpenCart) setCartOpen(true)
      return
    }

    setCartItems((prev) => {
      if (prev.some((item) => item.bookId === bookId)) return prev
      return [
        ...prev,
        {
          bookId,
          quantity: 1,
          title: book?.title,
          author: book?.author,
          price: book?.price,
          cover: book?.cover,
          slug: book?.slug,
        },
      ]
    })

    showToast(`« ${book?.title ?? "Livre"} » ajouté au panier`, "success")
    if (shouldOpenCart) setCartOpen(true)
  }

  const addDashboardBookToCart = (book: DashboardBook) => {
    addToCart({
      id: book.id,
      title: book.title,
      author: book.author,
      price: book.price ?? 2000,
      cover: book.cover,
      slug: book.slug,
    })
  }

  const removeItem = (bookId: string) =>
    setCartItems((prev) => prev.filter((i) => i.bookId !== bookId))

  const placeOrder = async (details: CheckoutDetails) => {
    if (cartItems.length === 0) {
      showToast("Votre panier est vide.", "warning")
      return
    }

    if (!sessionUser) {
      showToast(
        "Veuillez vous connecter pour procéder au paiement et retrouver vos livres dans votre bibliothèque.",
        "warning",
      )
      go("login")
      return
    }

    setCheckoutLoading(true)
    try {
      const bookIds = cartItems.map((item) => item.bookId)
      let orderRes = await createOrderApi(bookIds)
      let paymentRes: Awaited<ReturnType<typeof initiatePaymentApi>>
      try {
        paymentRes = await initiatePaymentApi(
          orderRes.order.id,
          details.phone,
        )
      } catch (paymentErr) {
        if (
          paymentErr instanceof ApiError &&
          (paymentErr.code === "ORDER_EXPIRED" || paymentErr.status === 410)
        ) {
          console.warn(
            "[YéYéBook] Commande expirée (ORDER_EXPIRED). Recréation automatique et relance du paiement...",
          )
          orderRes = await createOrderApi(bookIds)
          paymentRes = await initiatePaymentApi(
            orderRes.order.id,
            details.phone,
          )
        } else {
          throw paymentErr
        }
      }

      if (paymentRes.payment?.payment_url) {
        showToast("Redirection vers la passerelle sécurisée FedaPay...", "success")
        window.location.href = paymentRes.payment.payment_url
        return
      }

      setLibrary((prev) =>
        Array.from(new Set([...prev, ...cartItems.map((i) => i.bookId)])),
      )
      setCartItems([])
      void refreshLibrary()
      setView("confirmation")
      showToast("Paiement confirmé — bonne lecture !", "success")
    } catch (err) {
      console.error("[YéYéBook Checkout] Erreur lors de la commande ou du paiement:", err)
      showToast(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'initialisation du paiement FedaPay.",
        "error",
      )
    } finally {
      setCheckoutLoading(false)
    }
  }

  const saveBook = async (book: Book) => {
    const exists = books.some((b) => b.id === book.id)
    setBooks((prev) => {
      const ex = prev.some((b) => b.id === book.id)
      if (ex) return prev.map((b) => (b.id === book.id ? book : b))
      return [book, ...prev]
    })
    showToast(`« ${book.title} » enregistré`, "success")

    try {
      if (exists) {
        await updateAdminBookApi(book.id, {
          title: book.title,
          author: book.author,
          category: book.category,
          price: book.price,
          pages: book.pages,
          year: book.year,
          cover: book.cover,
          file_url: book.file_url,
          epub_filename: book.epub_filename,
          description: book.description,
          status: book.published ? "published" : "draft",
        })
      } else {
        const res = await createAdminBookApi({
          title: book.title,
          author: book.author,
          category: book.category,
          price: book.price,
          pages: book.pages,
          year: book.year,
          cover: book.cover,
          file_url: book.file_url,
          epub_filename: book.epub_filename,
          description: book.description,
          status: book.published ? "published" : "draft",
        })
        if (res?.book?.id) {
          setBooks((prev) =>
            prev.map((b) => (b.id === book.id ? { ...b, id: res.book!.id } : b)),
          )
        }
      }
    } catch (err) {
      console.warn("[Admin API] Synchronisation sauvegarde livre:", err)
    }
  }

  const deleteBook = async (id: string) => {
    const book = books.find((b) => b.id === id)
    setBooks((prev) => prev.filter((b) => b.id !== id))
    setCartItems((prev) => prev.filter((item) => item.bookId !== id))

    try {
      const res = await deleteAdminBookApi(id)
      showToast(
        res.message || `« ${book?.title ?? "Titre"} » retiré du catalogue`,
        "success",
      )
    } catch (err) {
      console.warn("[Admin API] Synchronisation suppression livre:", err)
      showToast(`« ${book?.title ?? "Titre"} » retiré du catalogue`, "warning")
    }
  }

  const togglePublish = async (id: string) => {
    const book = books.find((b) => b.id === id)
    const nextPublished = !(book?.published !== false)
    setBooks((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              published: nextPublished,
            }
          : b,
      ),
    )
    showToast(
      `« ${book?.title ?? "Titre"} » ${nextPublished ? "publié" : "passé en brouillon"}`,
      "default",
    )

    try {
      await toggleBookPublishApi(id, nextPublished ? "published" : "draft")
    } catch (err) {
      console.warn("[Admin API] Synchronisation statut publication:", err)
    }
  }

  const setOrderStatus = async (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
    showToast(
      `Commande ${id} passée à « ${ORDER_STATUS[status]?.label ?? status} »`,
      "default",
    )

    try {
      await updateOrderStatusApi(id, status)
    } catch (err) {
      console.warn("[Admin API] Synchronisation statut commande:", err)
    }
  }
  const startReading = (bookId: string, slug?: string) => {
    const book =
      books.find((b) => b.id === bookId || (slug && b.slug === slug)) ||
      purchasedBooks.find((b) => b.id === bookId || (slug && b.slug === slug))
    const targetSlug = slug || book?.slug

    if (book) {
      setReaderBookId(book.id)
      setReaderBookData(book)
    } else if (targetSlug) {
      setCurrentReaderSlug(targetSlug)
    }

    const saved = progress[bookId]
    if (saved !== undefined && saved > 0 && book) {
      setResumePrompt({ book, chapter: saved })
      return
    }
    openReaderAt(bookId, saved ?? 0, targetSlug)
  }

  const openReaderAt = (bookId: string, chapter: number, slug?: string) => {
    setReaderBookId(bookId)
    setCurrentChapter(chapter)
    setChapterListOpen(false)
    setResumePrompt(null)
    setView("reader")
    setProgress((prev) => ({ ...prev, [bookId]: chapter }))
    const targetSlug =
      slug ||
      books.find((book) => book.id === bookId)?.slug ||
      purchasedBooks.find((book) => book.id === bookId)?.slug
    if (targetSlug) {
      setCurrentReaderSlug(targetSlug)
      router.push(`/reader/${targetSlug}`)
    }
  }

  const goToChapter = (index: number) => {
    if (!readerBook) return
    const chaptersCount = readerBook.chapters?.length || 1
    const clamped = Math.max(0, Math.min(index, chaptersCount - 1))
    setCurrentChapter(clamped)
    setChapterListOpen(false)
    setProgress((prev) => ({ ...prev, [readerBook.id]: clamped }))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const visibleBooks = books.filter((b) => b.published !== false)
  const featured = visibleBooks[0]
  const heroCovers = visibleBooks.slice(0, 3)
  const newReleases = visibleBooks.slice(0, 4)
  const bestSellers = [...visibleBooks]
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, 10)
  const libraryBooks = useMemo(() => {
    const map = new Map<string, Book>()
    for (const b of purchasedBooks) {
      map.set(b.id, b)
    }
    for (const b of books) {
      if (library.includes(b.id)) {
        map.set(b.id, b)
      }
    }
    return Array.from(map.values())
  }, [purchasedBooks, books, library])
  const ownsSelected = selectedBook
    ? library.includes(selectedBook.id)
    : currentBookSlug
      ? library.some((id) => {
          const b =
            books.find((cand) => cand.id === id) ||
            purchasedBooks.find((cand) => cand.id === id)
          return b?.slug === currentBookSlug
        })
      : false

  const navLinks: NavLink[] = [
    { label: "Accueil", view: "home" },
    { label: "Catalogue", view: "catalog" },
    { label: "Ma bibliothèque", view: "library" },
  ]

  const showAuthError = (message: string) => {
    const clean =
      typeof message === "string" && message.trim().length > 0
        ? message.trim()
        : "Une erreur est survenue lors de l’authentification."
    showToast(clean, "error")
  }
  const showComingSoon = (label: string) =>
    showToast(
      `La page « ${label} » sera disponible dans une prochaine version.`,
      "default",
    )
  const handleAuthenticated = (response: AuthApiResponse) => {
    console.log("[YéYéBook Auth] Authentification réussie (handleAuthenticated):", response)
    if (!response.user) {
      console.error("[YéYéBook Auth] Erreur: response.user manquant:", response)
      showAuthError("La session n’a pas pu être initialisée.")
      return
    }
    setSessionUser(response.user)
    setProgress(loadProgress(response.user.id))
    const msg =
      typeof response.message === "string" && response.message.trim().length > 0
        ? response.message.trim()
        : "Connexion réussie."
    console.log("[YéYéBook Auth] Déclenchement du toast de succès:", msg)
    showToast(msg, "success")
    const isAdmin = Boolean(
      response.user.is_admin ||
        (response.user.role &&
          ["admin", "super_admin", "moderator"].includes(response.user.role)),
    )
    if (isAdmin) {
      setView("admin")
      router.push("/yeye-admin-admin")
    } else {
      setView("home")
      router.push("/")
    }
  }
  const handleLogout = async () => {
    console.log("[YéYéBook Auth] Déconnexion (handleLogout)")
    await logout()
    setSessionUser(null)
    setProgress({})
    showToast("Vous êtes déconnecté·e.", "default")
    setView("home")
    router.push("/")
  }
  const redirectToLogin = useCallback(() => go("login"), [go])
  const redirectUnauthorized = useCallback(() => {
    showToast(
      "Vous n’avez pas les permissions pour accéder à cet espace.",
      "error",
    )
    go("home")
  }, [go, showToast])
  const protectedViews: View[] = ["library", "reader"]

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
              .then((message) =>
                showToast(
                  message?.trim() || "Si ce compte existe, un e-mail a été envoyé.",
                  "default",
                ),
              )
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
  if (view === "dashboard") {
    return (
      <AuthGuard
        user={sessionUser}
        checking={!sessionChecked}
        onUnauthenticated={redirectToLogin}
      >
        {sessionUser ? (
          <>
            <DashboardPage
              user={sessionUser}
              onUserUpdated={(updatedUser) => {
                setSessionUser(updatedUser)
              }}
              onHome={() => go("home")}
              onCatalog={() => go("catalog")}
              onLibrary={() => go("library")}
              onLogout={() => void handleLogout()}
              onOpenBook={openBook}
              onAddToCart={addDashboardBookToCart}
              onToast={(message, variant = "default") => showToast(message, variant)}
            />
            {toast && (
              <Toast
                message={toast.message}
                variant={toast.variant}
                onDismiss={() => setToast(null)}
              />
            )}
          </>
        ) : null}
      </AuthGuard>
    )
  }

  if (view === "admin") {
    const isAdmin = Boolean(
      sessionUser &&
        (sessionUser.is_admin ||
          (sessionUser.role &&
            ["admin", "super_admin", "moderator"].includes(sessionUser.role))),
    )

    if (!sessionChecked) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-surface-secondary-bg px-xl text-text-secondary">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" aria-label="Chargement..." />
        </main>
      )
    }

    if (!isAdmin) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-surface-bg px-xl py-4xl text-center">
          <div className="max-w-[480px] flex flex-col items-center gap-lg animate-fade">
            <span className="text-[72px] sm:text-[96px] font-serif font-bold text-brand-primary leading-none select-none">
              404
            </span>
            <div className="flex flex-col gap-sm">
              <h1 className="text-display-sm sm:text-display font-serif font-bold text-text-primary">
                Page introuvable
              </h1>
              <p className="text-body text-text-secondary leading-relaxed">
                La page que vous recherchez n'existe pas ou a été déplacée.
              </p>
            </div>
            <div className="pt-md">
              <Button variant="primary" onClick={() => go("home")}>
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </main>
      )
    }

    return (
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
          <Toast
            message={toast.message}
            variant={toast.variant}
            onDismiss={() => setToast(null)}
          />
        )}
      </>
    )
  }
  if (view === "reader") {
    if (!readerBook) {
      if (readerLoading) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center p-xl bg-surface-secondary-bg text-center animate-fade">
            <Loader2 className="w-12 h-12 text-brand-primary animate-spin mb-md" aria-hidden="true" />
            <h1 className="text-heading font-semibold text-text-primary mb-sm">
              Chargement de votre e-book...
            </h1>
            <p className="text-label-sm text-text-secondary max-w-[480px]">
              Préparation du texte numérique et de votre confort de lecture.
            </p>
          </div>
        )
      }
      if (readerError) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center p-xl bg-surface-secondary-bg text-center animate-fade">
            <AlertCircle className="w-12 h-12 text-[#c13f4e] mb-md" aria-hidden="true" />
            <h1 className="text-heading font-semibold text-text-primary mb-sm">
              Impossible d'ouvrir ce livre
            </h1>
            <p className="text-label-sm text-text-secondary max-w-[480px] mb-xl">
              {readerError}
            </p>
            <div className="flex flex-wrap gap-md justify-center">
              <Button variant="primary" onClick={() => go("library")}>
                Ma bibliothèque
              </Button>
              <Button variant="neutral" onClick={() => go("catalog")}>
                Catalogue
              </Button>
            </div>
            {toast && (
              <Toast
                message={toast.message}
                variant={toast.variant}
                onDismiss={() => setToast(null)}
              />
            )}
          </div>
        )
      }
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-xl bg-surface-secondary-bg text-center animate-fade">
          <BookText className="w-12 h-12 text-brand-primary mb-md" aria-hidden="true" />
          <h1 className="text-heading font-semibold text-text-primary mb-sm">
            Chargement de votre lecture...
          </h1>
          <p className="text-label-sm text-text-secondary max-w-[480px] mb-xl">
            Veuillez patienter pendant l'accès au texte numérique de votre e-book.
          </p>
          <div className="flex flex-wrap gap-md justify-center">
            <Button variant="primary" onClick={() => go("library")}>
              Ma bibliothèque
            </Button>
            <Button variant="neutral" onClick={() => go("catalog")}>
              Catalogue
            </Button>
          </div>
          {toast && (
            <Toast
              message={toast.message}
              variant={toast.variant}
              onDismiss={() => setToast(null)}
            />
          )}
        </div>
      )
    }

    return (
      <EpubWebReader
        book={readerBook}
        currentUser={sessionUser}
        onClose={() => go("library")}
        onToast={showToast}
      />
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

      {}
      <header className="sticky top-0 z-40 bg-surface-bg/95 backdrop-blur-xl border-b border-border-secondary">
        <div className="max-w-[1320px] mx-auto px-xl md:px-2xl h-[72px] flex items-center justify-between gap-md lg:gap-2xl">
          <div className="flex items-center gap-xl">
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                go("home")
              }}
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
          </div>

          <div className="flex-1 max-w-[420px] hidden md:block">
            <SearchInput
              placeholder="Rechercher un titre, un auteur…"
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={() => openCatalog()}
            />
          </div>

          <div className="flex items-center gap-sm sm:gap-md">
            <button
              onClick={() => setCartOpen(true)}
              aria-label={`Ouvrir le panier${
                cartHydrated && cartCount > 0
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
              {cartHydrated && cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-corner-full bg-brand-primary text-on-brand text-[11px] font-bold leading-none">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="hidden items-center gap-sm lg:flex min-w-[100px] justify-end">
              {!sessionChecked && !sessionUser ? (
                <div className="h-9 w-24 rounded-corner-full bg-surface-secondary-bg animate-pulse" />
              ) : sessionUser ? (
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

            {/* Avatar / Mon Espace button with interactive user menu dropdown */}
            <div className="relative" id="user-menu-container">
              <button
                type="button"
                onClick={() => {
                  if (sessionUser) {
                    setUserMenuOpen((v) => !v)
                  } else {
                    go("login")
                  }
                }}
                title={sessionUser ? `Mon compte (${sessionUser.name || sessionUser.email})` : "Se connecter"}
                aria-label={sessionUser ? "Menu utilisateur" : "Se connecter"}
                aria-expanded={sessionUser ? userMenuOpen : undefined}
                aria-haspopup={sessionUser ? "menu" : undefined}
                className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center cursor-pointer rounded-corner-full border border-brand-primary/30 bg-surface-hover hover:border-brand-primary hover:shadow-sm transition-all overflow-hidden"
              >
                {!sessionChecked && !sessionUser ? (
                  <div className="w-4 h-4 rounded-full bg-border-secondary animate-pulse" />
                ) : sessionUser ? (
                  <span className="text-label-sm font-bold text-brand-primary uppercase">
                    {sessionUser.name?.[0] || sessionUser.email[0] || "U"}
                  </span>
                ) : (
                  <User className="w-4 h-4 text-text-secondary" aria-hidden="true" />
                )}
                {sessionUser && (
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface-bg"
                    aria-hidden="true"
                  />
                )}
              </button>

              {/* Desktop User Dropdown Menu */}
              {sessionUser && userMenuOpen && (
                <div
                  role="menu"
                  aria-orientation="vertical"
                  aria-label="Options du compte utilisateur"
                  className="absolute right-0 top-full mt-2 w-64 rounded-corner-lg bg-surface-bg border border-border-secondary shadow-2xl p-sm flex flex-col gap-xs z-50 animate-rise"
                >
                  <div className="px-md py-sm border-b border-border-secondary">
                    <p className="text-label-sm font-semibold text-text-primary truncate">
                      {sessionUser.name || "Lecteur"}
                    </p>
                    <p className="text-video-title text-text-tertiary truncate">
                      {sessionUser.email}
                    </p>
                    {sessionUser.role && (
                      <span className="inline-block mt-xs text-[10px] uppercase font-bold tracking-wider px-xs py-0.5 rounded bg-brand-tertiary text-brand-primary">
                        {sessionUser.role}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false)
                      go("dashboard")
                    }}
                    className="w-full flex items-center gap-sm px-md py-sm rounded-corner-md text-label-sm text-text-primary hover:bg-surface-hover transition-colors text-left cursor-pointer"
                  >
                    <User className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" />
                    <span>Mon espace lecteur</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false)
                      void refreshLibrary()
                      go("library")
                    }}
                    className="w-full flex items-center gap-sm px-md py-sm rounded-corner-md text-label-sm text-text-primary hover:bg-surface-hover transition-colors text-left cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" />
                    <span>Ma bibliothèque</span>
                  </button>

                  {(sessionUser?.is_admin || (sessionUser?.role && ["admin", "super_admin", "moderator"].includes(sessionUser.role))) && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false)
                        go("admin")
                      }}
                      className="w-full flex items-center gap-sm px-md py-sm rounded-corner-md text-label-sm text-text-primary hover:bg-surface-hover transition-colors text-left cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" />
                      <span>Espace administration</span>
                    </button>
                  )}

                  <div className="h-px bg-border-secondary my-xs" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false)
                      void handleLogout()
                    }}
                    className="w-full flex items-center gap-sm px-md py-sm rounded-corner-md text-label-sm text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer font-medium"
                  >
                    <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu toggle button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu de navigation"}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-corner-full text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border-secondary bg-surface-bg px-xl py-lg flex flex-col gap-lg shadow-xl animate-fade">
            <SearchInput
              placeholder="Rechercher un titre, un auteur…"
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={() => {
                setMobileMenuOpen(false)
                openCatalog()
              }}
            />

            <nav className="flex flex-col gap-xs pt-xs" aria-label="Navigation mobile">
              {navLinks.map((link) => {
                const active = view === link.view
                return (
                  <button
                    key={link.label}
                    onClick={() => {
                      setMobileMenuOpen(false)
                      link.view === "catalog" ? openCatalog() : go(link.view)
                    }}
                    aria-current={active ? "page" : undefined}
                    className={`w-full text-left px-xl py-md rounded-corner-md text-label font-medium transition-colors cursor-pointer ${
                      active
                        ? "text-on-brand bg-brand-primary font-semibold"
                        : "text-text-primary hover:bg-surface-hover"
                    }`}
                  >
                    {link.label}
                  </button>
                )
              })}
            </nav>

            <div className="h-px bg-border-secondary my-xs" />

            {sessionUser ? (
              <div className="flex flex-col gap-md">
                <div className="flex items-center gap-md px-md py-sm rounded-corner-md bg-surface-secondary-bg">
                  <div className="w-10 h-10 rounded-corner-full bg-brand-tertiary text-brand-primary font-bold flex items-center justify-center uppercase shrink-0">
                    {sessionUser.name?.[0] || sessionUser.email[0] || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-label-sm font-semibold text-text-primary truncate">
                      {sessionUser.name || "Lecteur"}
                    </p>
                    <p className="text-video-title text-text-tertiary truncate">
                      {sessionUser.email}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      go("dashboard")
                    }}
                    className="py-md px-lg rounded-corner-md bg-brand-primary text-on-brand text-label-sm font-semibold hover:bg-brand-hover text-center"
                  >
                    Mon espace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      void handleLogout()
                    }}
                    className="py-md px-lg rounded-corner-md border border-border-primary text-text-secondary text-label-sm font-medium hover:bg-surface-hover text-center"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            ) : !sessionChecked ? (
              <div className="h-10 w-full rounded-corner-md bg-surface-secondary-bg animate-pulse" />
            ) : (
              <div className="grid grid-cols-2 gap-md pt-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    go("login")
                  }}
                  className="py-md px-lg rounded-corner-md border border-border-primary text-text-primary text-label-sm font-semibold hover:bg-surface-hover text-center cursor-pointer"
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    go("register")
                  }}
                  className="py-md px-lg rounded-corner-md bg-brand-primary text-on-brand text-label-sm font-semibold hover:bg-brand-hover text-center cursor-pointer"
                >
                  Créer un compte
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <main id="main" className="flex-1 w-full">
        {}
        {view === "home" && (
          <div className="max-w-[1320px] mx-auto px-xl md:px-2xl py-3xl flex flex-col gap-5xl animate-fade">
            {}
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
                      onClick={() => {
                        if (featured) openBook(featured.id)
                        else
                          showToast(
                            "Aucun livre à la une n’est disponible.",
                            "error",
                          )
                      }}
                      className="inline-flex items-center gap-sm px-xl py-md rounded-corner-md bg-white/10 border border-white/45 text-white font-semibold hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" aria-hidden="true" /> Livre
                      à la une
                    </button>
                  </div>
                  <div className="flex items-center gap-2xl mt-lg pt-lg border-t border-white/15 w-full">
                    <div className="flex flex-col">
                      <span className="text-heading font-semibold text-white">
                        {books.length > 0 ? `${books.length}` : "12"}
                      </span>
                      <span className="text-video-title text-white/60 uppercase tracking-wide">
                        titres au catalogue
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center lg:justify-end gap-lg -rotate-6 hover:rotate-0 transition-transform duration-500">
                  {heroCovers.map((book, i) => (
                    <button
                      key={book.id}
                      onClick={() => openBook(book.id)}
                      aria-label={`Découvrir « ${book.title} »`}
                      className={`relative w-28 md:w-40 aspect-[2/3] rounded-corner-md overflow-hidden shadow-2xl border-4 border-white/20 bg-gradient-to-br from-[#471423] to-[#1e080f] cursor-pointer group transition-all duration-300 hover:scale-105 ${
                        i === 1 ? "mt-2xl" : ""
                      }`}
                    >
                      <img
                        src={book.cover}
                        alt={book.title}
                        onError={handleCoverError}
                        className="w-full h-full object-cover transition-opacity duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-sm text-left">
                        <span className="text-white text-[11px] font-semibold line-clamp-1">{book.title}</span>
                        <span className="text-white/70 text-[9px] line-clamp-1">{book.author}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {}
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
                    owned={ownedBookIds.has(book.id)}
                    onOpen={() => openBook(book.id)}
                    onAdd={() => addToCart(book.id)}
                    onRead={() => startReading(book.id, book.slug)}
                  />
                ))}
              </div>
            </section>

            {}
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
                            +{pluriel(book.reviews, "vente")}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {}
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
                        {pluriel(count, "titre")}
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {}
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

        {}
        {view === "catalog" && (
          <CatalogPage
            initialCategory={
              activeCategory === "Tous" ? undefined : activeCategory
            }
            initialSearch={searchQuery}
            ownedBookIds={ownedBookIds}
            onRead={(book) => startReading(book.id, book.slug)}
            onHome={() => go("home")}
            onSearchChange={setSearchQuery}
            onOpenBook={(book) => openBook(book)}
            onAddToCart={(book) => addToCart(book)}
            onError={(message) => showToast(message, "error")}
          />
        )}

        {/* Details View */}
        {view === "details" && (
          <BookDetailPage
            bookSlug={
              currentBookSlug ||
              selectedBook?.slug ||
              initialBookSlug ||
              undefined
            }
            fallbackBook={selectedBook}
            isAuthenticated={Boolean(sessionUser)}
            owned={ownsSelected}
            ownedBookIds={ownedBookIds}
            progress={selectedBook ? progress[selectedBook.id] : undefined}
            onBack={() => openCatalog(selectedBook?.category)}
            onOpenBook={(book) => openBook(book)}
            onOpenAuthor={() => showComingSoon("Auteur")}
            onAddToCart={(book) => addToCart(book)}
            onBuyNow={(book) => {
              addToCart(book, { openCart: false })
              setCartOpen(false)
              go("checkout")
            }}
            onStartReading={(book) => startReading(book.id, book.slug)}
            onToast={(message, variant = "success") =>
              showToast(message, variant)
            }
          />
        )}

        {}
        {view === "checkout" && (
          <CheckoutView
            books={books}
            cartItems={cartItems}
            total={cartTotal}
            user={sessionUser}
            loading={checkoutLoading}
            onBack={() => {
              setView("catalog")
              setCartOpen(true)
            }}
            onLogin={() => go("login")}
            onRegister={() => go("register")}
            onPlaceOrder={placeOrder}
          />
        )}

        {}
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

        {}
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
                    onClick={() => setLibraryViewMode(true)}
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
                    onClick={() => setLibraryViewMode(false)}
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

            {}
            {libraryBooks.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
                {[
                  { label: "Livres achetés", value: `${libraryBooks.length}` },
                  {
                    label: "En cours",
                    value: `${
                      libraryBooks.filter((b) => {
                        const s = progress[b.id]
                        return s !== undefined && s > 0 && s < 100
                      }).length
                    }`,
                  },
                  {
                    label: "Terminés",
                    value: `${
                      libraryBooks.filter((b) => {
                        const s = progress[b.id]
                        return s !== undefined && s >= 100
                      }).length
                    }`,
                  },
                  {
                    label: "Commandes",
                    value: `${
                      orders.filter((o) =>
                        ["paid", "completed"].includes(o.status),
                      ).length
                    }`,
                  },
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
            ) : libGrid ? (
              /* Vue Grille (Cartes verticales) */
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2xl">
                {libraryBooks.map((book) => {
                  const saved = progress[book.id]
                  const totalChapters = Math.max(1, book.chapters?.length || 1)
                  const started = saved !== undefined && saved > 0
                  const completed =
                    totalChapters <= 1
                      ? started
                      : saved !== undefined && saved >= totalChapters - 1
                  const pct = started
                    ? Math.min(
                        100,
                        Math.round(((saved + 1) / totalChapters) * 100),
                      )
                    : 0
                  return (
                    <div key={book.id} className="flex flex-col gap-lg">
                      <button
                        onClick={() => startReading(book.id, book.slug)}
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
                        {started && !completed && (
                          <span className="absolute top-md left-md text-[11px] font-semibold text-on-brand bg-brand-primary rounded-corner-full px-sm py-0.5">
                            {pct}%
                          </span>
                        )}
                        {completed && (
                          <span className="absolute top-md left-md text-[11px] font-semibold text-white bg-[#2e8b57] rounded-corner-full px-sm py-0.5">
                            Terminé
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
                            className={`h-full ${completed ? "bg-[#2e8b57]" : "bg-brand-primary"}`}
                            style={{ width: `${completed ? 100 : pct}%` }}
                          />
                        </div>
                      )}
                      <Button
                        variant={completed ? "neutral" : started ? "neutral" : "primary"}
                        iconStart={
                          completed ? (
                            <RotateCcw className="w-4 h-4" />
                          ) : started ? (
                            <RotateCcw className="w-4 h-4" />
                          ) : (
                            <BookText className="w-4 h-4" />
                          )
                        }
                        onClick={() => startReading(book.id, book.slug)}
                      >
                        {completed
                          ? "Relire"
                          : started
                            ? "Reprendre"
                            : "Commencer la lecture"}
                      </Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Vue Liste (Lignes horizontales complètes) */
              <div className="flex flex-col gap-md">
                {libraryBooks.map((book) => {
                  const saved = progress[book.id]
                  const totalChapters = Math.max(1, book.chapters?.length || 1)
                  const started = saved !== undefined && saved > 0
                  const completed =
                    totalChapters <= 1
                      ? started
                      : saved !== undefined && saved >= totalChapters - 1
                  const pct = started
                    ? Math.min(
                        100,
                        Math.round(((saved + 1) / totalChapters) * 100),
                      )
                    : 0
                  return (
                    <div
                      key={book.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-lg p-lg rounded-corner-lg border border-border-secondary bg-surface-bg hover:border-brand-primary/40 transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-lg min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => startReading(book.id, book.slug)}
                          aria-label={`Lire « ${book.title} »`}
                          className="relative w-16 sm:w-20 aspect-[2/3] shrink-0 rounded-corner-md overflow-hidden border border-border-secondary bg-brand-tertiary shadow-xs group cursor-pointer"
                        >
                          <img
                            src={book.cover}
                            alt=""
                            onError={handleCoverError}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-[#100908]/0 group-hover:bg-[#100908]/30 transition-colors flex items-center justify-center">
                            <BookText
                              className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-hidden="true"
                            />
                          </div>
                          {started && !completed && (
                            <span className="absolute bottom-1 right-1 text-[10px] font-bold text-on-brand bg-brand-primary rounded-corner-full px-1.5 py-0.5 leading-none shadow-xs">
                              {pct}%
                            </span>
                          )}
                          {completed && (
                            <span className="absolute bottom-1 right-1 text-[10px] font-bold text-white bg-[#2e8b57] rounded-corner-full px-1.5 py-0.5 leading-none shadow-xs">
                              ✓
                            </span>
                          )}
                        </button>

                        <div className="flex flex-col gap-xs min-w-0 flex-1">
                          <div className="flex items-center gap-sm flex-wrap">
                            {book.category && (
                              <span className="text-[11px] font-semibold px-sm py-0.5 rounded-corner-full bg-[#100908]/5 text-brand-dark border border-border-secondary">
                                {book.category}
                              </span>
                            )}
                            {completed ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1b5e20] bg-[#edf7ee] px-sm py-0.5 rounded-corner-full">
                                <CheckCircle2 className="w-3 h-3 text-[#2e8b57]" aria-hidden="true" />
                                Terminé
                              </span>
                            ) : started ? (
                              <span className="text-[11px] font-medium text-brand-primary bg-brand-tertiary px-sm py-0.5 rounded-corner-full">
                                En cours ({pct}%)
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-text-tertiary bg-surface-secondary-bg px-sm py-0.5 rounded-corner-full">
                                Non commencé
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => openBook(book)}
                            className="text-left font-semibold text-text-primary hover:text-brand-primary transition-colors text-label sm:text-heading truncate cursor-pointer"
                          >
                            {book.title}
                          </button>

                          <p className="text-label-sm text-text-secondary truncate">
                            {book.author}
                            {book.chapters?.length ? ` · ${book.chapters.length} chapitres` : ""}
                          </p>

                          {started && (
                            <div className="mt-xs max-w-xs flex items-center gap-sm">
                              <div
                                className="h-1.5 flex-1 rounded-corner-full bg-brand-tertiary overflow-hidden"
                                aria-hidden="true"
                              >
                                <div
                                  className={`h-full ${completed ? "bg-[#2e8b57]" : "bg-brand-primary"}`}
                                  style={{ width: `${completed ? 100 : pct}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-text-tertiary shrink-0">
                                {completed ? "100%" : `${pct}%`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-sm shrink-0 self-stretch sm:self-center justify-end border-t sm:border-t-0 pt-sm sm:pt-0 border-border-secondary/60">
                        <Button
                          variant={completed ? "neutral" : started ? "neutral" : "primary"}
                          iconStart={
                            completed ? (
                              <RotateCcw className="w-4 h-4" />
                            ) : started ? (
                              <RotateCcw className="w-4 h-4" />
                            ) : (
                              <BookText className="w-4 h-4" />
                            )
                          }
                          onClick={() => startReading(book.id, book.slug)}
                        >
                          {completed
                            ? "Relire"
                            : started
                              ? "Reprendre"
                              : "Commencer la lecture"}
                        </Button>
                        <Button
                          variant="subtle"
                          onClick={() => openBook(book)}
                          aria-label={`Détails de « ${book.title} »`}
                        >
                          Détails
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {}
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
                                showToast(`Facture ${o.id} générée`, "success")
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

      {}
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
            <h3 className="text-white font-semibold mb-md">Aide & Légal</h3>
            <ul className="flex flex-col gap-sm text-label-sm">
              {[
                { label: "Comment ça marche", type: "how-it-works" as const },
                { label: "FAQ", type: "faq" as const },
                { label: "Contact", type: "contact" as const },
                { label: "Conditions générales", type: "terms" as const },
                { label: "Confidentialité", type: "privacy" as const },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => setLegalModal(item.type)}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
              {(sessionUser?.is_admin || (sessionUser?.role && ["admin", "super_admin", "moderator"].includes(sessionUser.role))) && (
                <li>
                  <button
                    onClick={() => go("admin")}
                    className="inline-flex items-center gap-xs hover:text-white transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />{" "}
                    Espace admin
                  </button>
                </li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-md">YéYéBook</h3>
            <p className="text-label-sm text-white/70 leading-relaxed mb-md">
              La plateforme de lecture numérique dédiée aux littératures africaines francophones.
            </p>
            <p className="text-video-title text-white/40">
              © 2026 YéYéBook · Tous droits réservés
            </p>
          </div>
        </div>
      </footer>

      {}
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
                {cartHydrated && cartCount > 0 && (
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
                    const book =
                      books.find((b) => b.id === item.bookId) ||
                      purchasedBooks.find((b) => b.id === item.bookId) || {
                        id: item.bookId,
                        title: item.title || "E-book",
                        author: item.author || "Auteur",
                        price: item.price ?? 0,
                        cover: item.cover || "",
                        slug: item.slug || "",
                      }
                    return (
                      <div key={item.bookId} className="flex gap-lg">
                        <button
                          onClick={() => {
                            setCartOpen(false)
                            openBook(book)
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
                            <span className="text-[12px] font-medium text-text-tertiary bg-surface-secondary-bg px-sm py-0.5 rounded-corner-full border border-border-secondary">
                              Format numérique · 1 licence
                            </span>
                            <span className="text-label-sm font-semibold text-text-primary">
                              {formatPrice(book.price)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.bookId)}
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
                      go("checkout")
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

      {}
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
                  {resumePrompt.book.chapters?.[resumePrompt.chapter]?.title || "Chapitre 1"}
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

      {}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}

      {legalModal && (
        <LegalModal
          type={legalModal}
          onClose={() => setLegalModal(null)}
        />
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
  user,
  loading = false,
  onBack,
  onLogin,
  onRegister,
  onPlaceOrder,
}: {
  books: Book[]
  cartItems: CartItem[]
  total: number
  user: AuthUser | null
  loading?: boolean
  onBack: () => void
  onLogin: () => void
  onRegister: () => void
  onPlaceOrder: (details: CheckoutDetails) => void
}) {
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  })

  useEffect(() => {
    let savedPhone = user?.phone || ""
    if (!savedPhone && typeof window !== "undefined") {
      try {
        savedPhone = localStorage.getItem("ybook-user-phone") || ""
      } catch {}
    }
    setForm((prev) => ({
      name: prev.name || user?.name || "",
      email: prev.email || user?.email || "",
      phone: prev.phone || savedPhone,
    }))
  }, [user])

  const infoValid =
    form.name.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.phone.trim().length >= 8

  const steps = [
    { n: 1, label: "Panier", done: true },
    { n: 2, label: "Coordonnées & Paiement", done: false, active: true },
    { n: 3, label: "Confirmation", done: false },
  ]

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
        Retour au panier
      </Button>

      <h1 className="text-title font-semibold text-text-primary mt-xl mb-2xl">
        Finaliser la commande
      </h1>

      {/* Stepper */}
      <ol
        className="flex items-center gap-xs md:gap-md mb-2xl"
        aria-label="Étapes de la commande"
      >
        {steps.map((s, i) => {
          const isActive = s.active
          const isDone = s.done
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
                  {isDone ? (
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
          {/* User authentication status card */}
          {!user && (
            <div className="rounded-corner-lg bg-surface-bg border border-brand-primary/30 p-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-lg">
              <div className="flex items-start gap-md">
                <div className="w-10 h-10 rounded-corner-full bg-brand-tertiary text-brand-primary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-label font-semibold text-text-primary">
                    Vous n'êtes pas connecté·e
                  </h2>
                  <p className="text-label-sm text-text-secondary mt-0.5 max-w-[42ch]">
                    Connectez-vous pour associer vos livres à votre compte et les lire sur tous vos appareils.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-sm shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onLogin}
                  className="flex-1 sm:flex-none px-lg py-sm rounded-corner-md border border-border-primary text-label-sm font-semibold hover:bg-surface-hover text-center cursor-pointer transition-colors"
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  onClick={onRegister}
                  className="flex-1 sm:flex-none px-lg py-sm rounded-corner-md bg-brand-primary text-on-brand text-label-sm font-semibold hover:bg-brand-hover text-center cursor-pointer transition-colors"
                >
                  Créer un compte
                </button>
              </div>
            </div>
          )}

          {/* Customer info form */}
          <section className="rounded-corner-lg bg-surface-bg border border-border-secondary p-xl flex flex-col gap-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-label font-semibold text-text-primary">
                Vos coordonnées
              </h2>
              {user && (
                <span className="text-video-title text-emerald-600 font-medium bg-emerald-50 px-sm py-xs rounded-corner-full">
                  Compte vérifié ({user.email})
                </span>
              )}
            </div>

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
              label="Numéro de téléphone (pour le Mobile Money)"
              placeholder="+225 07 00 00 00 00"
              value={form.phone}
              onChange={(v) => {
                setForm((f) => ({ ...f, phone: v }))
                if (typeof window !== "undefined" && v.trim()) {
                  try {
                    localStorage.setItem("ybook-user-phone", v.trim())
                  } catch {}
                }
              }}
            />
          </section>

          {/* FedaPay gateway info */}
          <section className="rounded-corner-lg bg-surface-bg border border-border-secondary p-xl flex flex-col gap-lg">
            <div className="flex items-center gap-sm">
              <div className="w-8 h-8 rounded-corner-full bg-brand-tertiary text-brand-primary flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-label font-semibold text-text-primary">
                  Paiement sécurisé FedaPay
                </h2>
                <p className="text-video-title text-text-tertiary">
                  Passerelle de paiement certifiée et chiffrée
                </p>
              </div>
            </div>

            <p className="text-label-sm text-text-secondary leading-relaxed">
              En cliquant sur le bouton ci-dessous, vous serez redirigé·e vers la passerelle sécurisée FedaPay pour finaliser votre règlement. Vous pourrez choisir votre opérateur préféré :
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-sm pt-xs">
              {[
                { name: "Wave", badge: "Mobile Money" },
                { name: "Orange Money", badge: "Mobile Money" },
                { name: "MTN MoMo", badge: "Mobile Money" },
                { name: "Moov / Carte", badge: "Moov, Visa, MC" },
              ].map((m) => (
                <div
                  key={m.name}
                  className="flex flex-col items-center justify-center p-md rounded-corner-md border border-border-secondary bg-surface-secondary-bg text-center"
                >
                  <Smartphone className="w-4 h-4 text-brand-primary mb-1" aria-hidden="true" />
                  <span className="text-label-sm font-semibold text-text-primary">
                    {m.name}
                  </span>
                  <span className="text-[11px] text-text-tertiary">
                    {m.badge}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-md flex flex-col gap-sm">
              <button
                type="button"
                disabled={!infoValid || loading}
                onClick={() =>
                  onPlaceOrder({
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    provider: "fedapay",
                  })
                }
                className="w-full py-lg px-2xl rounded-corner-md bg-brand-primary text-on-brand text-label font-semibold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-sm shadow-md cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                    <span>Initialisation du paiement FedaPay...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                    <span>Payer {formatPrice(total)} avec FedaPay</span>
                  </>
                )}
              </button>
              {!infoValid && (
                <p className="text-video-title text-text-tertiary text-center">
                  Veuillez renseigner votre nom, email et téléphone valide pour procéder au paiement.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Summary */}
        <aside className="rounded-corner-lg bg-surface-bg border border-border-secondary p-xl flex flex-col gap-lg lg:sticky lg:top-[96px]">
          <h2 className="text-label font-semibold text-text-primary">
            Récapitulatif de la commande
          </h2>
          <div className="flex flex-col gap-md">
            {cartItems.map((item) => {
              const book =
                books.find((b) => b.id === item.bookId) || {
                  id: item.bookId,
                  title: item.title || "E-book numérique",
                  price: item.price ?? 0,
                }
              return (
                <div
                  key={item.bookId}
                  className="flex items-center justify-between gap-md"
                >
                  <span className="text-label-sm text-text-secondary line-clamp-1">
                    {book.title}
                  </span>
                  <span className="text-label-sm text-text-primary font-medium whitespace-nowrap">
                    {formatPrice(book.price)}
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
              Total à payer
            </span>
            <span className="text-title font-semibold text-brand-primary">
              {formatPrice(total)}
            </span>
          </div>

          <div className="pt-sm border-t border-border-secondary flex flex-col gap-xs text-video-title text-text-tertiary">
            <p className="inline-flex items-center gap-xs">
              <Check className="w-3.5 h-3.5 text-brand-primary" aria-hidden="true" />
              Accès immédiat à la lecture après validation
            </p>
            <p className="inline-flex items-center gap-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" aria-hidden="true" />
              Transactions chiffrées de bout en bout
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

type AdminTab = "dashboard" | "catalog" | "create-book" | "orders" | "reviews"

const ORDER_STATUS: Record<OrderStatus, OrderStatusMeta> = {
  paid: { label: "Payée", className: "bg-brand-tertiary text-brand-primary" },
  pending: { label: "En attente", className: "bg-[#c8956a]/16 text-[#7a5626]" },
  refunded: {
    label: "Remboursée",
    className: "bg-[#c13f4e]/10 text-[#9c2d3a]",
  },
  cancelled: {
    label: "Expirée / Annulée",
    className: "bg-surface-secondary-bg text-text-tertiary border border-border-secondary",
  },
}

const LANGUES_MAP: Record<string, string> = {
  fr: "Français",
  en: "Anglais",
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
  onDeleteBook: (id: string) => void
  onTogglePublish: (id: string) => void
  onSetOrderStatus: (id: string, status: OrderStatus) => void | Promise<void>
  onExit: () => void
}) {
  const [tab, setTab] = useState<AdminTab>("dashboard")
  const [editing, setEditing] = useState<Book | null>(null)
  const [creating, setCreating] = useState(false)
  const [catalogQuery, setCatalogQuery] = useState("")
  const [orderFilter, setOrderFilter] = useState<"all" | OrderStatus>("all")
  const [orderSearch, setOrderSearch] = useState("")
  const [orderPage, setOrderPage] = useState(1)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersTotal, setOrdersTotal] = useState(0)

  // Tri et filtrage par auteur pour les graphiques du tableau de bord
  const [selectedAuthor, setSelectedAuthor] = useState<string>("all")
  const [authorSortBy, setAuthorSortBy] = useState<"revenue" | "units" | "books" | "name">("revenue")
  const [authorSortOrder, setAuthorSortOrder] = useState<"asc" | "desc">("desc")

  // Données synchronisées en temps réel depuis l'API Backend
  const [apiStats, setApiStats] = useState<AdminStats | null>(null)
  const [apiOrders, setApiOrders] = useState<Order[]>([])
  const [loadingStats, setLoadingStats] = useState(false)

  // Gestion des livres de l'admin (Point 15)
  const [catalogStatusFilter, setCatalogStatusFilter] = useState<"all" | "published" | "draft" | "archived">("all")
  const [adminBooks, setAdminBooks] = useState<AdminBook[]>([])
  const [adminBooksLoading, setAdminBooksLoading] = useState(false)

  // Gestion des avis pour modération (Point 16)
  const [reviewsList, setReviewsList] = useState<AdminReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsTotal, setReviewsTotal] = useState(0)
  const [reviewsPage, setReviewsPage] = useState(1)

  const mapOrder = (o: any): Order => {
    const orderItems: CartItem[] = (o.items || []).map((it: any) => ({
      bookId: it.book_id || it.slug || it.title,
      title: it.title,
      quantity: it.quantity || 1,
      price: it.price || it.unit_price,
      selected: true,
    }))
    return {
      id: o.id,
      customer: o.customer_name || o.customer_email || "Client",
      email: o.customer_email,
      phone: o.customer_phone || "",
      provider: o.provider || "fedapay",
      items: orderItems,
      total: o.total_amount ?? o.total ?? 0,
      date: o.created_at
        ? new Date(o.created_at).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      status: o.status as OrderStatus,
    }
  }

  const refreshStatsAndOrders = useCallback(async () => {
    setLoadingStats(true)
    try {
      const [statsData, ordersData] = await Promise.all([
        getAdminStatsApi(),
        getAdminOrdersApi({ limit: 10 }),
      ])
      if (statsData) {
        setApiStats(statsData)
      }
      if (ordersData && ordersData.items) {
        setApiOrders(ordersData.items.map(mapOrder))
        setOrdersTotal(ordersData.total)
      }
    } catch (err) {
      console.warn("[YéYéBook Admin] Erreur lors du chargement des statistiques/commandes:", err)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  const fetchOrders = useCallback(async (filter: string, search: string, page: number) => {
    setOrdersLoading(true)
    try {
      const ordersData = await getAdminOrdersApi({
        status: filter,
        search: search.trim() || undefined,
        page,
        limit: 50,
      })
      if (ordersData && ordersData.items) {
        setApiOrders(ordersData.items.map(mapOrder))
        setOrdersTotal(ordersData.total)
      }
    } catch (err) {
      console.warn("[YéYéBook Admin] Erreur chargement commandes:", err)
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  const fetchAdminBooks = useCallback(async (status: string, search: string) => {
    setAdminBooksLoading(true)
    try {
      const data = await getAdminBooksApi({
        status: status === "all" ? undefined : status,
        search: search.trim() || undefined,
        limit: 100,
      })
      if (data && data.items) {
        setAdminBooks(data.items)
      }
    } catch (err) {
      console.warn("[YéYéBook Admin] Erreur chargement livres admin:", err)
    } finally {
      setAdminBooksLoading(false)
    }
  }, [])

  const fetchReviews = useCallback(async (page: number) => {
    setReviewsLoading(true)
    try {
      const data = await getAdminReviewsApi({ page, limit: 50 })
      if (data) {
        setReviewsList(data.items || [])
        setReviewsTotal(data.total)
      }
    } catch (err) {
      console.warn("[YéYéBook Admin] Erreur chargement avis:", err)
    } finally {
      setReviewsLoading(false)
    }
  }, [])

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm("Supprimer cet avis ? Cette action est irréversible et recalculera la note du livre.")) {
      return
    }
    try {
      await deleteAdminReviewApi(id)
      setReviewsList((prev) => prev.filter((r) => r.id !== id))
      setReviewsTotal((prev) => Math.max(0, prev - 1))
      await refreshStatsAndOrders()
    } catch (err) {
      console.error("[YéYéBook Admin] Erreur suppression avis:", err)
    }
  }

  useEffect(() => {
    void refreshStatsAndOrders()
  }, [refreshStatsAndOrders])

  useEffect(() => {
    if (tab === "orders") {
      void fetchOrders(orderFilter, orderSearch, orderPage)
    }
  }, [tab, orderFilter, orderSearch, orderPage, fetchOrders])

  useEffect(() => {
    if (tab === "catalog") {
      void fetchAdminBooks(catalogStatusFilter, catalogQuery)
    }
  }, [tab, catalogStatusFilter, catalogQuery, fetchAdminBooks])

  useEffect(() => {
    if (tab === "reviews") {
      void fetchReviews(reviewsPage)
    }
  }, [tab, reviewsPage, fetchReviews])

  const handleStatusChange = async (
    id: string,
    newStatus: OrderStatus,
    currentStatus: OrderStatus,
  ) => {
    if (newStatus === currentStatus) return
    let confirmMsg = ""
    if (newStatus === "refunded" || newStatus === "cancelled") {
      confirmMsg = "Le client perdra l'accès à ses livres. Confirmer ?"
    } else if (newStatus === "paid") {
      confirmMsg = "Les livres seront ajoutés à la bibliothèque du client. Confirmer ?"
    }
    if (confirmMsg && !window.confirm(confirmMsg)) {
      return
    }

    // Mettre à jour immédiatement l'état local
    setApiOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)))
    try {
      await onSetOrderStatus(id, newStatus)
    } finally {
      // Rappeler /admin/stats et fetchOrders après le changement de statut comme requis par le backend
      await Promise.all([
        refreshStatsAndOrders(),
        fetchOrders(orderFilter, orderSearch, orderPage),
      ])
    }
  }

  const currentOrders = apiOrders.length > 0 ? apiOrders : orders

  const catalogBooks = useMemo(() => {
    const source: Array<AdminBook | Book> = adminBooks.length > 0 ? adminBooks : books
    const q = catalogQuery.trim().toLowerCase()
    return source.filter((b) => {
      const isPub = (b as any).status === "published" || b.published !== false
      const isDraft = (b as any).status === "draft" || b.published === false
      const isArchived = (b as any).status === "archived"
      if (catalogStatusFilter === "published" && !isPub) return false
      if (catalogStatusFilter === "draft" && !isDraft) return false
      if (catalogStatusFilter === "archived" && !isArchived) return false
      if (!q) return true
      return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    })
  }, [adminBooks, books, catalogStatusFilter, catalogQuery])

  const visibleOrders = useMemo(() => {
    if (apiOrders.length > 0) return apiOrders
    return orders
      .filter((o) => (orderFilter === "all" ? true : o.status === orderFilter))
      .filter((o) => {
        if (!orderSearch.trim()) return true
        const q = orderSearch.toLowerCase()
        return (
          o.customer.toLowerCase().includes(q) ||
          (o.email && o.email.toLowerCase().includes(q)) ||
          o.phone.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
        )
      })
  }, [apiOrders, orders, orderFilter, orderSearch])

  const revenue = apiStats
    ? apiStats.revenue_total
    : currentOrders
        .filter((o) => o.status === "paid")
        .reduce((sum, o) => sum + o.total, 0)

  const publishedCount = apiStats
    ? apiStats.books_published_count
    : books.filter((b) => b.published !== false).length

  const draftCount = apiStats
    ? apiStats.books_draft_count
    : books.length - publishedCount

  const avgRating =
    apiStats?.average_rating !== undefined
      ? apiStats.average_rating
      : books.length
      ? books.reduce((s, b) => s + b.rating, 0) / books.length
      : 0

  const paidOrdersCount = apiStats
    ? apiStats.orders_paid_count
    : currentOrders.filter((o) => o.status === "paid").length

  const pendingOrdersCount = apiStats
    ? apiStats.orders_pending_count
    : currentOrders.filter((o) => o.status === "pending").length

  const totalOrdersCount = apiStats
    ? apiStats.orders_count
    : currentOrders.length

  const cancelledOrdersCount = apiStats
    ? apiStats.orders_cancelled_count
    : currentOrders.filter((o) => o.status === "cancelled").length

  const topBooksList = useMemo(() => {
    if (apiStats?.top_books && apiStats.top_books.length > 0) {
      return apiStats.top_books.map((tb) => ({
        id: tb.id,
        title: tb.title,
        author: tb.author,
        cover: tb.cover || "/src/imports/ybook-symbol-primary-1024px.png",
        units: tb.units_sold,
        revenue: tb.revenue,
      }))
    }
    const map = new Map<string, number>()
    currentOrders
      .filter((o) => o.status === "paid")
      .forEach((o) =>
        o.items.forEach((it) =>
          map.set(it.bookId, (map.get(it.bookId) ?? 0) + it.quantity),
        ),
      )
    return [...books]
      .map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        cover: b.cover,
        units: map.get(b.id) ?? 0,
        revenue: (b.price || 0) * (map.get(b.id) ?? 0),
      }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5)
  }, [apiStats, books, currentOrders])

  const monthlySales = useMemo(() => {
    if (apiStats?.monthly_sales && apiStats.monthly_sales.length > 0) {
      return apiStats.monthly_sales.map((m) => ({
        label: m.month,
        value: m.revenue,
        orders_count: m.orders_count,
      }))
    }
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
    currentOrders
      .filter((o) => o.status === "paid")
      .forEach((o) => {
        const d = new Date(o.date)
        const idx =
          (now.getFullYear() - d.getFullYear()) * 12 +
          (now.getMonth() - d.getMonth())
        if (idx >= 0 && idx <= 5) buckets[5 - idx].value += o.total
      })
    return buckets
  }, [apiStats, currentOrders])

  const maxMonthly = Math.max(1, ...monthlySales.map((m) => m.value))

  const categorySales = useMemo(() => {
    if (apiStats?.category_sales && apiStats.category_sales.length > 0) {
      return apiStats.category_sales.map((c) => ({
        label: c.category,
        value: c.revenue,
        pct: c.percentage,
      }))
    }
    const priceById = new Map(books.map((b) => [b.id, b.price]))
    const catById = new Map(books.map((b) => [b.id, b.category]))
    const map = new Map<string, number>()
    currentOrders
      .filter((o) => o.status === "paid")
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
  }, [apiStats, books, currentOrders])

  // Statistiques détaillées agrégées par auteur
  const authorStats = useMemo(() => {
    const bookById = new Map(books.map((b) => [b.id, b]))
    const map = new Map<
      string,
      { author: string; revenue: number; units: number; booksCount: number; topBookTitle?: string }
    >()

    // Initialiser avec tous les auteurs présents dans le catalogue
    books.forEach((b) => {
      const a = b.author?.trim() || "Auteur non spécifié"
      if (!map.has(a)) {
        map.set(a, { author: a, revenue: 0, units: 0, booksCount: 0 })
      }
      map.get(a)!.booksCount += 1
    })

    // Si apiStats.top_books est fourni par le backend, incorporer ces ventes officielles
    if (apiStats?.top_books && apiStats.top_books.length > 0) {
      apiStats.top_books.forEach((tb) => {
        const a = tb.author?.trim() || bookById.get(tb.id)?.author?.trim() || "Auteur non spécifié"
        if (!map.has(a)) {
          map.set(a, { author: a, revenue: 0, units: 0, booksCount: 1 })
        }
        const item = map.get(a)!
        item.revenue += tb.revenue || 0
        item.units += tb.units_sold || 0
        if (!item.topBookTitle) item.topBookTitle = tb.title
      })
    } else {
      // Calculer à partir des commandes payées réelles
      currentOrders
        .filter((o) => o.status === "paid")
        .forEach((o) => {
          o.items.forEach((it) => {
            const b = bookById.get(it.bookId)
            const a = b?.author?.trim() || "Auteur non spécifié"
            if (!map.has(a)) {
              map.set(a, { author: a, revenue: 0, units: 0, booksCount: 1 })
            }
            const item = map.get(a)!
            const price = b?.price || 0
            item.revenue += price * it.quantity
            item.units += it.quantity
            if (!item.topBookTitle && b?.title) item.topBookTitle = b.title
          })
        })
    }

    return Array.from(map.values())
  }, [books, apiStats, currentOrders])

  // Auteurs triés selon le critère interactif
  const sortedAuthorStats = useMemo(() => {
    return [...authorStats].sort((a, b) => {
      let cmp = 0
      if (authorSortBy === "revenue") cmp = b.revenue - a.revenue
      else if (authorSortBy === "units") cmp = b.units - a.units
      else if (authorSortBy === "books") cmp = b.booksCount - a.booksCount
      else if (authorSortBy === "name") cmp = a.author.localeCompare(b.author, "fr")
      return authorSortOrder === "asc" ? -cmp : cmp
    })
  }, [authorStats, authorSortBy, authorSortOrder])

  // Ventes mensuelles affichées (globales ou filtrées pour l'auteur sélectionné)
  const displayedMonthlySales = useMemo(() => {
    if (selectedAuthor === "all") return monthlySales

    const bookById = new Map(books.map((b) => [b.id, b]))
    const now = new Date()
    const buckets: { label: string; value: number; orders_count?: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push({
        label: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
        value: 0,
        orders_count: 0,
      })
    }

    currentOrders
      .filter((o) => o.status === "paid")
      .forEach((o) => {
        const d = new Date(o.date)
        const idx = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
        if (idx >= 0 && idx <= 5) {
          let authorTotal = 0
          let hasAuthorItem = false
          o.items.forEach((it) => {
            const b = bookById.get(it.bookId)
            if (b && b.author?.trim().toLowerCase() === selectedAuthor.trim().toLowerCase()) {
              authorTotal += (b.price || 0) * it.quantity
              hasAuthorItem = true
            }
          })
          if (hasAuthorItem) {
            buckets[5 - idx].value += authorTotal
            buckets[5 - idx].orders_count = (buckets[5 - idx].orders_count || 0) + 1
          }
        }
      })

    return buckets
  }, [selectedAuthor, monthlySales, books, currentOrders])

  const maxDisplayedMonthly = Math.max(1, ...displayedMonthlySales.map((m) => m.value))

  // Répartition par catégorie (globale ou filtrée pour l'auteur sélectionné)
  const displayedCategorySales = useMemo(() => {
    if (selectedAuthor === "all") return categorySales

    const authorBooks = books.filter(
      (b) => b.author?.trim().toLowerCase() === selectedAuthor.trim().toLowerCase(),
    )
    const bookById = new Map(books.map((b) => [b.id, b]))
    const catMap = new Map<string, number>()

    currentOrders
      .filter((o) => o.status === "paid")
      .forEach((o) => {
        o.items.forEach((it) => {
          const b = bookById.get(it.bookId)
          if (b && b.author?.trim().toLowerCase() === selectedAuthor.trim().toLowerCase()) {
            const cat = b.category || "Autre"
            catMap.set(cat, (catMap.get(cat) || 0) + (b.price || 0) * it.quantity)
          }
        })
      })

    if (catMap.size === 0) {
      authorBooks.forEach((b) => {
        catMap.set(b.category, (catMap.get(b.category) || 0) + 1)
      })
    }

    const arr = [...catMap.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
    const total = arr.reduce((s, c) => s + c.value, 0) || 1
    return arr.map((c) => ({ ...c, pct: Math.round((c.value / total) * 100) }))
  }, [selectedAuthor, categorySales, books, currentOrders])

  const displayedRevenue = useMemo(() => {
    if (selectedAuthor === "all") return revenue
    const stat = authorStats.find((a) => a.author.toLowerCase() === selectedAuthor.toLowerCase())
    return stat ? stat.revenue : 0
  }, [selectedAuthor, revenue, authorStats])

  const displayedUnits = useMemo(() => {
    if (selectedAuthor === "all") return paidOrdersCount
    const stat = authorStats.find((a) => a.author.toLowerCase() === selectedAuthor.toLowerCase())
    return stat ? stat.units : 0
  }, [selectedAuthor, paidOrdersCount, authorStats])

  const displayedBooksCount = useMemo(() => {
    if (selectedAuthor === "all") return publishedCount
    return books.filter((b) => b.author?.trim().toLowerCase() === selectedAuthor.trim().toLowerCase()).length
  }, [selectedAuthor, publishedCount, books])

  const displayedTopBooks = useMemo(() => {
    if (selectedAuthor === "all") return topBooksList
    return topBooksList.filter(
      (b) => b.author?.trim().toLowerCase() === selectedAuthor.trim().toLowerCase(),
    )
  }, [selectedAuthor, topBooksList])

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
      id: "create-book",
      label: editing ? "Modifier un titre" : "Ajouter un livre",
      icon: <BookPlus className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: "orders",
      label: "Commandes",
      icon: <ClipboardList className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: "reviews",
      label: "Avis",
      icon: <MessageSquare className="w-4 h-4" aria-hidden="true" />,
    },
  ]

  const stats = [
    {
      label: selectedAuthor === "all" ? "Revenu total" : `Revenu (${selectedAuthor})`,
      value: formatPrice(displayedRevenue),
      icon: <Wallet className="w-5 h-5" aria-hidden="true" />,
      hint:
        selectedAuthor === "all"
          ? `${paidOrdersCount} commande${paidOrdersCount > 1 ? "s" : ""} payée${paidOrdersCount > 1 ? "s" : ""}`
          : `${displayedUnits} exemplaire${displayedUnits > 1 ? "s" : ""} vendu${displayedUnits > 1 ? "s" : ""}`,
    },
    {
      label: selectedAuthor === "all" ? "Commandes" : "Ventes de l'auteur",
      value: `${selectedAuthor === "all" ? totalOrdersCount : displayedUnits}`,
      icon: <ClipboardList className="w-5 h-5" aria-hidden="true" />,
      hint:
        selectedAuthor === "all"
          ? `${pendingOrdersCount} en attente${cancelledOrdersCount > 0 ? ` · ${cancelledOrdersCount} annulée${cancelledOrdersCount > 1 ? "s" : ""}` : ""}`
          : `sur les titres de ${selectedAuthor}`,
    },
    {
      label: selectedAuthor === "all" ? "Titres publiés" : "Titres de l'auteur",
      value:
        selectedAuthor === "all"
          ? apiStats
            ? `${apiStats.books_published_count} / ${apiStats.books_total}`
            : `${displayedBooksCount}`
          : `${displayedBooksCount}`,
      icon: <BookText className="w-5 h-5" aria-hidden="true" />,
      hint:
        selectedAuthor === "all"
          ? `${draftCount} en brouillon`
          : `au catalogue YéYéBook`,
    },
    {
      label: "Note moyenne",
      value: avgRating > 0 ? `${avgRating.toFixed(1)}/5` : "—",
      icon: <TrendingUp className="w-5 h-5" aria-hidden="true" />,
      hint: `sur ${apiStats ? apiStats.books_total : books.length} titres du catalogue`,
    },
  ]

  return (
    <div className="min-h-screen bg-surface-secondary-bg lg:grid lg:grid-cols-[264px_1fr]">
      {/* Sidebar */}
      <aside className="lg:sticky lg:top-0 lg:h-screen bg-surface-bg border-b lg:border-b-0 lg:border-r border-border-secondary flex lg:flex-col">
        <div className="flex lg:flex-col lg:h-full w-full">
          {/* Header de marque pour mobile (< lg) */}
          <div className="flex lg:hidden items-center justify-between px-md py-sm border-b border-border-secondary w-full bg-surface-bg">
            <div className="flex items-center gap-sm">
              <img
                src={ybookSymbol}
                alt=""
                className="h-6 w-6 object-contain"
                aria-hidden="true"
              />
              <div className="flex flex-col leading-none">
                <span className="text-label-sm font-semibold text-text-primary font-serif">
                  YéYéBook
                </span>
                <span className="text-[10px] text-brand-primary font-semibold uppercase tracking-wider">
                  Admin
                </span>
              </div>
            </div>
            <button
              onClick={onExit}
              className="inline-flex items-center gap-1 px-sm py-1 rounded-corner-md text-video-title font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary-bg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Boutique</span>
            </button>
          </div>

          {/* Header de marque pour desktop (lg+) */}
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
            className="flex lg:flex-col gap-xs p-sm sm:p-md lg:p-lg flex-1 overflow-x-auto no-scrollbar scroll-smooth"
            aria-label="Sections d'administration"
          >
            {navItems.map((item) => {
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === "create-book") {
                      if (!editing) setCreating(true)
                    } else {
                      setEditing(null)
                      setCreating(false)
                    }
                    setTab(item.id)
                  }}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center gap-sm sm:gap-md px-md sm:px-lg py-sm sm:py-md rounded-corner-md text-xs sm:text-label-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? "bg-brand-primary text-on-brand shadow-xs"
                      : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
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

      {/* Colonne de droite */}
      <div className="flex flex-col min-h-screen min-w-0">
        {tab === "create-book" ? (
          <AdminBookEditor
            book={editing}
            existingBooks={books}
            onClose={() => {
              setEditing(null)
              setCreating(false)
              setTab("catalog")
            }}
            onSave={(b) => {
              onSaveBook(b)
              setEditing(null)
              setCreating(false)
              setTab("catalog")
            }}
          />
        ) : (
          <>
            <header className="sticky top-0 z-30 bg-surface-bg/85 backdrop-blur-xl border-b border-border-secondary">
              <div className="px-md sm:px-xl md:px-2xl h-[60px] sm:h-[72px] flex items-center justify-between gap-md sm:gap-lg">
                <div>
                  <p className="text-[11px] sm:text-video-title uppercase tracking-widest text-brand-primary font-semibold">
                    Administration
                  </p>
                  <h1 className="text-label sm:text-heading font-semibold text-text-primary">
                    {navItems.find((n) => n.id === tab)?.label}
                  </h1>
                </div>
                <div className="flex items-center gap-sm sm:gap-md">
                  {tab === "catalog" && (
                    <Button
                      variant="primary"
                      size="medium"
                      iconStart={<Plus className="w-4 h-4" />}
                      onClick={() => {
                        setEditing(null)
                        setCreating(true)
                        setTab("create-book")
                      }}
                    >
                      <span className="hidden sm:inline">Nouveau titre</span>
                      <span className="sm:hidden">Nouveau</span>
                    </Button>
                  )}
                  <button
                    onClick={onExit}
                    className="lg:hidden inline-flex items-center gap-xs text-xs sm:text-label-sm text-text-secondary hover:text-text-primary cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" /> Boutique
                  </button>
                </div>
              </div>
            </header>

            <main className="flex-1 px-sm sm:px-md md:px-xl lg:px-2xl py-md sm:py-xl md:py-2xl animate-fade">
          {}
          {tab === "dashboard" && (
            <div className="flex flex-col gap-2xl w-full max-w-[1600px] mx-auto">
              {/* Cartes KPI réactives */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-lg">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-corner-xl bg-surface-bg border border-border-secondary p-xl flex flex-col gap-md shadow-xs"
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

              {/* Bandeau de Filtrage Interactif par Auteur */}
              <div className="rounded-corner-xl bg-surface-bg border border-border-secondary p-xl flex flex-col md:flex-row md:items-center justify-between gap-lg shadow-xs">
                <div className="flex items-center gap-md">
                  <span className="w-10 h-10 rounded-corner-md bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-label-sm font-semibold text-text-primary">
                      Filtrer les graphiques par auteur
                    </h2>
                    <p className="text-video-title text-text-tertiary">
                      Isolez les données de ventes et de revenus d'un auteur ou visualisez les métriques globales.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-md flex-wrap">
                  <div className="relative min-w-[240px]">
                    <select
                      value={selectedAuthor}
                      onChange={(e) => setSelectedAuthor(e.target.value)}
                      aria-label="Sélectionner un auteur pour filtrer les graphiques"
                      className="w-full text-label-sm font-medium bg-surface-secondary-bg border border-border-secondary rounded-corner-md px-lg py-md text-text-primary focus:border-brand-primary focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tous les auteurs (Global)</option>
                      {authorStats.map((a) => (
                        <option key={a.author} value={a.author}>
                          {a.author} ({a.booksCount} {a.booksCount > 1 ? "titres" : "titre"}{a.revenue > 0 ? ` · ${formatPrice(a.revenue)}` : ""})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedAuthor !== "all" && (
                    <button
                      onClick={() => setSelectedAuthor("all")}
                      className="text-video-title font-semibold text-brand-primary hover:underline cursor-pointer inline-flex items-center gap-xs px-md py-sm rounded-corner-md bg-brand-primary/10 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Réinitialiser ({selectedAuthor})
                    </button>
                  )}
                </div>
              </div>

              {/* Première grille : Graphique des Ventes mensuelles & Répartition par catégorie */}
              <div className="grid lg:grid-cols-[1.6fr_1fr] gap-2xl">
                {/* Ventes mensuelles (hauteur 260px, aéré et panoramique) */}
                <section className="rounded-corner-xl bg-surface-bg border border-border-secondary p-xl md:p-2xl shadow-xs flex flex-col justify-between">
                  <div className="flex flex-wrap items-center justify-between gap-sm mb-xl">
                    <div>
                      <h2 className="text-title font-semibold text-text-primary flex items-center gap-xs">
                        <TrendingUp className="w-4 h-4 text-brand-primary" />
                        {selectedAuthor === "all"
                          ? "Évolution des ventes (6 derniers mois)"
                          : `Ventes mensuelles — ${selectedAuthor}`}
                      </h2>
                      <p className="text-video-title text-text-tertiary">
                        {selectedAuthor === "all"
                          ? "Chiffre d'affaires global généré par l'ensemble des titres"
                          : `Revenus générés par les commandes des livres de ${selectedAuthor}`}
                      </p>
                    </div>
                    <span className="text-video-title font-semibold px-md py-xs rounded-corner-full bg-brand-tertiary text-brand-primary">
                      Revenu mensuel en FCFA
                    </span>
                  </div>

                  <div className="relative pt-lg pb-sm">
                    {/* Repères horizontaux en pointillés */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30 pb-8">
                      <div className="border-b border-dashed border-border-secondary w-full" />
                      <div className="border-b border-dashed border-border-secondary w-full" />
                      <div className="border-b border-dashed border-border-secondary w-full" />
                      <div className="border-b border-dashed border-border-secondary w-full" />
                    </div>

                    <div
                      className="relative flex items-end justify-between gap-md sm:gap-xl h-[260px] z-10"
                      role="img"
                      aria-label="Graphique des ventes mensuelles"
                    >
                      {displayedMonthlySales.map((m) => {
                        const heightPct = Math.max(6, (m.value / maxDisplayedMonthly) * 100)
                        return (
                          <div
                            key={m.label}
                            className="flex-1 flex flex-col items-center gap-sm h-full justify-end group cursor-pointer"
                          >
                            <span className="text-video-title font-bold text-brand-primary tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                              {m.value > 0 ? formatPrice(m.value) : "0 FCFA"}
                            </span>

                            <div
                              className="w-full max-w-[56px] rounded-t-corner-md bg-gradient-to-t from-brand-secondary to-brand-primary transition-all duration-300 group-hover:brightness-110 shadow-xs relative"
                              style={{ height: `${heightPct}%` }}
                            >
                              {m.value > 0 && (
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden md:block text-[11px] font-bold text-text-primary whitespace-nowrap bg-surface-bg/90 px-1 rounded shadow-xs border border-border-secondary">
                                  {formatPrice(m.value)}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-center text-center mt-xs">
                              <span className="text-label-sm font-semibold text-text-primary capitalize">
                                {m.label}
                              </span>
                              {m.orders_count !== undefined && m.orders_count > 0 && (
                                <span className="text-[10px] text-text-tertiary">
                                  {m.orders_count} vte{m.orders_count > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </section>

                {/* Répartition par catégorie */}
                <section className="rounded-corner-xl bg-surface-bg border border-border-secondary p-xl md:p-2xl shadow-xs flex flex-col">
                  <div className="mb-xl">
                    <h2 className="text-title font-semibold text-text-primary">
                      {selectedAuthor === "all" ? "Répartition par catégorie" : `Catégories de ${selectedAuthor}`}
                    </h2>
                    <p className="text-video-title text-text-tertiary">
                      Part des revenus et répartition selon les genres.
                    </p>
                  </div>

                  {displayedCategorySales.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-xl text-center text-text-tertiary">
                      <BookOpen className="w-8 h-8 mb-sm opacity-40" />
                      <p className="text-label-sm">Aucune donnée disponible pour cette sélection.</p>
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-lg flex-1 justify-center">
                      {displayedCategorySales.map((c) => (
                        <li key={c.label}>
                          <div className="flex items-center justify-between mb-xs">
                            <span className="text-label-sm font-medium text-text-primary truncate">
                              {c.label}
                            </span>
                            <div className="flex items-center gap-sm">
                              {c.value > 0 && (
                                <span className="text-video-title text-text-secondary font-medium tabular-nums">
                                  {formatPrice(c.value)}
                                </span>
                              )}
                              <span className="text-video-title font-bold text-brand-primary tabular-nums">
                                {c.pct}%
                              </span>
                            </div>
                          </div>
                          <div className="h-2.5 rounded-corner-full bg-brand-tertiary/60 overflow-hidden">
                            <div
                              className="h-full rounded-corner-full bg-gradient-to-r from-brand-secondary to-brand-primary transition-all duration-300"
                              style={{ width: `${c.pct}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              {/* Deuxième section : Performances et Ventes par Auteur (Triable !) */}
              <section className="rounded-corner-xl bg-surface-bg border border-border-secondary p-xl md:p-2xl shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-xl">
                  <div>
                    <h2 className="text-title font-semibold text-text-primary flex items-center gap-xs">
                      <User className="w-5 h-5 text-brand-primary" />
                      Performances et classement des ventes par auteur
                    </h2>
                    <p className="text-video-title text-text-tertiary">
                      Comparez les chiffres d'affaires, les exemplaires vendus et le nombre d'ouvrages publiés par auteur.
                    </p>
                  </div>

                  {/* Boutons de tri interactifs */}
                  <div className="flex items-center gap-xs flex-wrap" role="group" aria-label="Trier les auteurs">
                    <span className="text-video-title font-semibold text-text-tertiary mr-xs">Trier par :</span>
                    {(
                      [
                        { id: "revenue", label: "Chiffre d'affaires" },
                        { id: "units", label: "Exemplaires vendus" },
                        { id: "books", label: "Nombre de titres" },
                        { id: "name", label: "Nom d'auteur" },
                      ] as const
                    ).map((opt) => {
                      const active = authorSortBy === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            if (authorSortBy === opt.id) {
                              setAuthorSortOrder((o) => (o === "asc" ? "desc" : "asc"))
                            } else {
                              setAuthorSortBy(opt.id)
                              setAuthorSortOrder(opt.id === "name" ? "asc" : "desc")
                            }
                          }}
                          className={`px-md py-xs rounded-corner-md text-video-title font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                            active
                              ? "bg-brand-primary text-white shadow-xs"
                              : "bg-surface-secondary-bg text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {active && (
                            <span className="text-[10px]">{authorSortOrder === "asc" ? "▲" : "▼"}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Tableau comparatif des auteurs avec barres proportionnelles */}
                {sortedAuthorStats.length === 0 ? (
                  <p className="text-label-sm text-text-tertiary text-center py-xl">
                    Aucun auteur répertorié pour le moment.
                  </p>
                ) : (
                  <div className="flex flex-col gap-md">
                    {sortedAuthorStats.map((item, index) => {
                      const maxRevenueAmongAuthors = Math.max(1, ...authorStats.map((a) => a.revenue))
                      const barPercent = Math.max(4, Math.round((item.revenue / maxRevenueAmongAuthors) * 100))
                      const isSelected = selectedAuthor.toLowerCase() === item.author.toLowerCase()

                      return (
                        <div
                          key={item.author}
                          className={`p-md md:p-lg rounded-corner-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-md ${
                            isSelected
                              ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/30"
                              : "border-border-secondary bg-surface-secondary-bg/30 hover:bg-surface-secondary-bg hover:border-brand-primary/40"
                          }`}
                        >
                          <div className="flex items-center gap-md min-w-[240px] sm:w-[280px]">
                            <span className="w-6 text-center text-video-title font-bold text-text-tertiary">
                              #{index + 1}
                            </span>
                            <div className="w-10 h-10 rounded-corner-full bg-brand-primary/10 text-brand-primary font-bold text-label-sm flex items-center justify-center shrink-0">
                              {item.author.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-label-sm font-semibold text-text-primary truncate">
                                {item.author}
                              </p>
                              <p className="text-video-title text-text-tertiary truncate">
                                {item.booksCount} {item.booksCount > 1 ? "titres publiés" : "titre publié"}
                                {item.topBookTitle ? ` · ex: ${item.topBookTitle}` : ""}
                              </p>
                            </div>
                          </div>

                          {/* Barre horizontale proportionnelle */}
                          <div className="flex-1 min-w-[160px] hidden md:flex flex-col gap-xs px-lg">
                            <div className="h-2.5 rounded-corner-full bg-border-secondary overflow-hidden">
                              <div
                                className="h-full rounded-corner-full bg-gradient-to-r from-brand-secondary to-brand-primary transition-all duration-300"
                                style={{ width: `${barPercent}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-text-tertiary">
                              <span>{item.units} exemplaire{item.units > 1 ? "s" : ""} vendu{item.units > 1 ? "s" : ""}</span>
                              <span>{item.revenue > 0 ? `${Math.round((item.revenue / (revenue || 1)) * 100)}% des ventes` : "0%"}</span>
                            </div>
                          </div>

                          {/* Chiffre d'affaires et bouton d'action rapide */}
                          <div className="flex items-center justify-between sm:justify-end gap-lg shrink-0">
                            <div className="text-right">
                              <span className="text-label-sm font-bold text-text-primary tabular-nums block">
                                {formatPrice(item.revenue)}
                              </span>
                              <span className="text-video-title text-brand-primary font-medium block">
                                {item.units} vente{item.units > 1 ? "s" : ""}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedAuthor(isSelected ? "all" : item.author)}
                              className={`px-md py-xs rounded-corner-md text-video-title font-semibold border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-brand-primary text-white border-brand-primary"
                                  : "border-border-secondary bg-surface-bg text-text-secondary hover:border-brand-primary hover:text-brand-primary"
                              }`}
                            >
                              {isSelected ? "Sélectionné ✓" : "Filtrer"}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Troisième grille : Commandes récentes & Meilleures ventes (pleine largeur sur 2 colonnes équilibrées) */}
              <div className="grid lg:grid-cols-2 gap-2xl">
                {/* Commandes récentes */}
                <section className="rounded-corner-xl bg-surface-bg border border-border-secondary overflow-hidden shadow-xs">
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
                    {currentOrders.slice(0, 6).map((o) => (
                      <li
                        key={o.id}
                        className="flex items-center justify-between gap-lg px-xl py-md hover:bg-surface-secondary-bg/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-label-sm font-semibold text-text-primary truncate">
                            {o.customer}
                          </p>
                          <p className="text-video-title text-text-tertiary">
                            <span className="font-mono font-semibold text-text-primary">{o.id.slice(0, 8).toUpperCase()}</span> · {PROVIDER_LABELS[o.provider] ?? o.provider}
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

                {/* Meilleures ventes */}
                <section className="rounded-corner-xl bg-surface-bg border border-border-secondary overflow-hidden shadow-xs">
                  <div className="px-xl py-lg border-b border-border-secondary">
                    <h2 className="text-label font-semibold text-text-primary">
                      {selectedAuthor === "all" ? "Meilleures ventes" : `Titres vendus de ${selectedAuthor}`}
                    </h2>
                  </div>
                  <ul className="flex flex-col divide-y divide-border-secondary">
                    {displayedTopBooks.slice(0, 6).map((item, i) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-lg px-xl py-md hover:bg-surface-secondary-bg/40 transition-colors"
                      >
                        <span className="text-label-sm font-bold text-text-tertiary w-4">
                          {i + 1}
                        </span>
                        <div className="w-8 h-12 rounded-corner-sm overflow-hidden bg-brand-tertiary border border-border-secondary shrink-0">
                          <img
                            src={item.cover}
                            alt=""
                            onError={handleCoverError}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-label-sm font-semibold text-text-primary truncate">
                            {item.title}
                          </p>
                          <p className="text-video-title text-text-tertiary truncate">
                            {item.author}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-label-sm font-bold text-brand-primary whitespace-nowrap block">
                            {item.units} vendu{item.units > 1 ? "s" : ""}
                          </span>
                          {item.revenue > 0 && (
                            <span className="text-video-title text-text-tertiary whitespace-nowrap block">
                              {formatPrice(item.revenue)}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          )}

          {}
          {tab === "catalog" && (
            <div className="flex flex-col gap-lg w-full max-w-[1600px] mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-md">
                <div
                  className="flex flex-wrap gap-sm"
                  role="group"
                  aria-label="Filtrer les titres par statut"
                >
                  {([
                    { id: "all", label: "Tous" },
                    { id: "published", label: "Publiés" },
                    { id: "draft", label: "Brouillons" },
                    { id: "archived", label: "Archivés" },
                  ] as const).map((f) => {
                    const active = catalogStatusFilter === f.id
                    return (
                      <button
                        key={f.id}
                        onClick={() => setCatalogStatusFilter(f.id)}
                        aria-pressed={active}
                        className={`inline-flex items-center gap-xs px-lg py-sm rounded-corner-full text-label-sm font-medium border transition-all cursor-pointer ${
                          active
                            ? "bg-brand-primary text-on-brand border-brand-primary"
                            : "bg-surface-bg text-text-secondary border-border-secondary hover:border-brand-primary hover:text-text-primary"
                        }`}
                      >
                        {f.label}
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center gap-md">
                  <div className="w-full sm:w-[320px]">
                    <SearchInput
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
              </div>

              {adminBooksLoading ? (
                <div className="flex flex-col items-center justify-center gap-md py-4xl text-center rounded-corner-lg border border-border-secondary bg-surface-bg">
                  <Loader2 className="w-7 h-7 text-brand-primary animate-spin" aria-hidden="true" />
                  <p className="text-label-sm text-text-secondary">
                    Chargement du catalogue...
                  </p>
                </div>
              ) : catalogBooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-md py-4xl text-center rounded-corner-lg border border-dashed border-border-primary bg-surface-bg">
                  <LibraryIcon
                    className="w-8 h-8 text-text-tertiary"
                    aria-hidden="true"
                  />
                  <p className="text-label-sm text-text-secondary">
                    {catalogQuery.trim()
                      ? `Aucun titre ne correspond à « ${catalogQuery} ».`
                      : "Aucun titre dans cette catégorie."}
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
                          className="font-semibold px-lg py-md hidden lg:table-cell"
                        >
                          Langue
                        </th>
                        <th
                          scope="col"
                          className="font-semibold px-lg py-md hidden sm:table-cell"
                        >
                          Prix
                        </th>
                        <th scope="col" className="font-semibold px-lg py-md">
                          Fichier ePub
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
                        const isArchived = (book as any).status === "archived"
                        const hasEpub = Boolean((book as any).has_file || (book as any).epub_filename || (book as any).file_url)
                        const langCode = (book as any).language || "fr"
                        const langLabel = LANGUES_MAP[langCode] ?? langCode.toUpperCase()

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
                            <td className="px-lg py-md hidden lg:table-cell text-label-sm text-text-secondary whitespace-nowrap">
                              {langLabel}
                            </td>
                            <td className="px-lg py-md hidden sm:table-cell text-label-sm font-medium text-text-primary whitespace-nowrap">
                              {formatPrice(book.price)}
                            </td>
                            <td className="px-lg py-md">
                              {hasEpub ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1b5e20] bg-[#edf7ee] px-2 py-0.5 rounded-corner-full">
                                  <Check className="w-3 h-3 text-[#2e8b57]" aria-hidden="true" />
                                  ePub prêt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#c13f4e] bg-[#c13f4e]/10 px-2 py-0.5 rounded-corner-full">
                                  <AlertCircle className="w-3 h-3 text-[#c13f4e]" aria-hidden="true" />
                                  Manquant
                                </span>
                              )}
                            </td>
                            <td className="px-lg py-md">
                              {isArchived ? (
                                <span className="inline-flex items-center gap-xs text-video-title font-semibold text-text-tertiary bg-surface-secondary-bg px-2 py-0.5 rounded-corner-full border border-border-secondary">
                                  Archivé
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    const willPublish = !published
                                    if (willPublish && !hasEpub) {
                                      if (!window.confirm("Attention : ce livre n'a pas encore de fichier ePub lisible. Les clients pourront l'acheter mais ne pourront pas le lire tant qu'un fichier n'est pas envoyé. Voulez-vous quand même le publier ?")) {
                                        return
                                      }
                                    }
                                    void onTogglePublish(book.id)
                                    void fetchAdminBooks(catalogStatusFilter, catalogQuery)
                                  }}
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
                              )}
                            </td>
                            <td className="px-xl py-md">
                              <div className="flex items-center justify-end gap-xs">
                                <button
                                  onClick={() => {
                                    const fullBook: Book =
                                      books.find((b) => b.id === book.id) ?? {
                                        id: book.id,
                                        title: book.title,
                                        author: book.author,
                                        category: book.category,
                                        price: book.price,
                                        pages: book.pages ?? 0,
                                        year: book.year ?? 2026,
                                        rating: book.rating ?? 0,
                                        reviews: book.reviews ?? 0,
                                        cover: book.cover,
                                        description: book.description ?? "",
                                        published: book.published !== false,
                                        chapters: [],
                                      }
                                    setEditing(fullBook)
                                    setCreating(false)
                                    setTab("create-book")
                                  }}
                                  aria-label={`Modifier « ${book.title} »`}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-corner-md text-text-secondary hover:bg-surface-hover hover:text-brand-primary transition-colors cursor-pointer"
                                >
                                  <Pencil
                                    className="w-4 h-4"
                                    aria-hidden="true"
                                  />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (
                                      window.confirm(
                                        `Supprimer « ${book.title} » du catalogue ?`,
                                      )
                                    ) {
                                      await onDeleteBook(book.id)
                                      void fetchAdminBooks(catalogStatusFilter, catalogQuery)
                                    }
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

          {}
          {tab === "orders" && (
            <div className="flex flex-col gap-lg w-full max-w-[1600px] mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-md">
                <div
                  className="flex flex-wrap gap-sm"
                  role="group"
                  aria-label="Filtrer les commandes par statut"
                >
                  {([
                    { id: "all", label: "Toutes" },
                    { id: "paid", label: "Payées" },
                    { id: "pending", label: "En attente" },
                    { id: "cancelled", label: "Expirées / Annulées" },
                    { id: "refunded", label: "Remboursées" },
                  ] as const).map((f) => {
                    const active = orderFilter === f.id
                    const count =
                      f.id === "all"
                        ? (apiStats ? apiStats.orders_count : currentOrders.length)
                        : f.id === "paid"
                          ? (apiStats ? apiStats.orders_paid_count : currentOrders.filter((o) => o.status === "paid").length)
                          : f.id === "pending"
                            ? (apiStats ? apiStats.orders_pending_count : currentOrders.filter((o) => o.status === "pending").length)
                            : f.id === "cancelled"
                              ? (apiStats ? apiStats.orders_cancelled_count : currentOrders.filter((o) => o.status === "cancelled").length)
                              : currentOrders.filter((o) => o.status === f.id).length
                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          setOrderFilter(f.id)
                          setOrderPage(1)
                        }}
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

                <div className="relative min-w-[240px] sm:w-[300px]">
                  <Search
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={orderSearch}
                    onChange={(e) => {
                      setOrderSearch(e.target.value)
                      setOrderPage(1)
                    }}
                    placeholder="Rechercher (client, e-mail, tél, ID)..."
                    aria-label="Rechercher dans les commandes"
                    className="w-full pl-9 pr-3 py-1.5 text-label-sm rounded-corner-md bg-surface-bg border border-border-secondary text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {ordersLoading ? (
                <div className="flex flex-col items-center justify-center gap-md py-4xl text-center rounded-corner-lg border border-border-secondary bg-surface-bg">
                  <Loader2 className="w-7 h-7 text-brand-primary animate-spin" aria-hidden="true" />
                  <p className="text-label-sm text-text-secondary">
                    Chargement des commandes en direct depuis le serveur...
                  </p>
                </div>
              ) : visibleOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-md py-4xl text-center rounded-corner-lg border border-dashed border-border-primary bg-surface-bg">
                  <ClipboardList
                    className="w-8 h-8 text-text-tertiary"
                    aria-hidden="true"
                  />
                  <p className="text-label-sm text-text-secondary">
                    {orderSearch.trim()
                      ? `Aucune commande ne correspond à « ${orderSearch} »`
                      : "Aucune commande dans cette catégorie."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-md">
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
                                  <span className="font-mono font-semibold text-text-primary">{o.id.slice(0, 8).toUpperCase()}</span> {o.date ? `· ${o.date}` : ""}
                                </p>
                                {o.email && (
                                  <p className="text-video-title text-text-tertiary truncate max-w-[260px]">
                                    {o.email}
                                  </p>
                                )}
                              </td>
                              <td className="px-lg py-md hidden md:table-cell">
                                <p className="text-label-sm text-text-primary">
                                  {PROVIDER_LABELS[o.provider] ?? o.provider}
                                </p>
                                <p className="text-video-title text-text-tertiary">
                                  {o.phone || "—"}
                                </p>
                              </td>
                              <td className="px-lg py-md hidden sm:table-cell text-label-sm text-text-secondary">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-medium text-text-primary">
                                    {units} {units > 1 ? "titres" : "titre"}
                                  </span>
                                  {o.items && o.items.length > 0 && (
                                    <span
                                      className="text-video-title text-text-tertiary line-clamp-2"
                                      title={o.items.map((it) => it.title).filter(Boolean).join(", ")}
                                    >
                                      {o.items.map((it) => it.title || "Titre").join(", ")}
                                    </span>
                                  )}
                                </div>
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
                                      void handleStatusChange(
                                        o.id,
                                        e.target.value as OrderStatus,
                                        o.status,
                                      )
                                    }
                                    aria-label={`Changer le statut de la commande ${o.id}`}
                                    className="text-video-title font-medium text-text-secondary bg-surface-secondary-bg border border-border-secondary rounded-corner-md px-sm py-xs cursor-pointer hover:border-brand-primary transition-colors"
                                  >
                                    <option value="paid">Payée</option>
                                    <option value="pending">En attente</option>
                                    <option value="cancelled">Expirée / Annulée</option>
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

                  {ordersTotal > 50 && (
                    <div className="flex items-center justify-between px-sm py-xs text-video-title text-text-tertiary">
                      <span>Total : {ordersTotal} commandes</span>
                      <div className="flex items-center gap-sm">
                        <button
                          disabled={orderPage <= 1 || ordersLoading}
                          onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                          className="px-md py-xs rounded-corner-md border border-border-secondary text-label-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-secondary-bg transition-colors"
                        >
                          Précédent
                        </button>
                        <span>Page {orderPage}</span>
                        <button
                          disabled={visibleOrders.length < 50 || ordersLoading}
                          onClick={() => setOrderPage((p) => p + 1)}
                          className="px-md py-xs rounded-corner-md border border-border-secondary text-label-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-secondary-bg transition-colors"
                        >
                          Suivant
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === "reviews" && (
            <div className="flex flex-col gap-lg w-full max-w-[1600px] mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-title font-semibold text-text-primary">
                    Modération des avis clients
                  </h2>
                  <p className="text-label-sm text-text-secondary mt-xs">
                    Consultez et modérez les avis laissés par les lecteurs sur les ouvrages du catalogue.
                  </p>
                </div>
                <span className="text-label-sm text-text-tertiary">
                  {reviewsTotal} {reviewsTotal > 1 ? "avis" : "avis"}
                </span>
              </div>

              {reviewsLoading ? (
                <div className="flex flex-col items-center justify-center gap-md py-4xl text-center rounded-corner-lg border border-border-secondary bg-surface-bg">
                  <Loader2 className="w-7 h-7 text-brand-primary animate-spin" aria-hidden="true" />
                  <p className="text-label-sm text-text-secondary">
                    Chargement des avis...
                  </p>
                </div>
              ) : reviewsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-md py-4xl text-center rounded-corner-lg border border-dashed border-border-primary bg-surface-bg">
                  <MessageSquare className="w-8 h-8 text-text-tertiary" aria-hidden="true" />
                  <p className="text-label-sm text-text-secondary">
                    Aucun avis client pour le moment.
                  </p>
                </div>
              ) : (
                <div className="rounded-corner-lg bg-surface-bg border border-border-secondary overflow-hidden">
                  <table className="w-full border-collapse">
                    <caption className="sr-only">Liste des avis clients</caption>
                    <thead>
                      <tr className="text-left text-video-title uppercase tracking-wide text-text-tertiary border-b border-border-secondary">
                        <th scope="col" className="font-semibold px-xl py-md">
                          Livre & Auteur
                        </th>
                        <th scope="col" className="font-semibold px-lg py-md">
                          Lecteur
                        </th>
                        <th scope="col" className="font-semibold px-lg py-md">
                          Note
                        </th>
                        <th scope="col" className="font-semibold px-xl py-md">
                          Commentaire
                        </th>
                        <th scope="col" className="font-semibold px-lg py-md hidden sm:table-cell">
                          Date
                        </th>
                        <th scope="col" className="font-semibold px-xl py-md text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewsList.map((rev) => (
                        <tr
                          key={rev.id}
                          className="border-b border-border-secondary last:border-b-0 hover:bg-surface-secondary-bg transition-colors"
                        >
                          <td className="px-xl py-md">
                            <p className="text-label-sm font-semibold text-text-primary">
                              {rev.book_title}
                            </p>
                            <p className="text-video-title text-text-tertiary">
                              {rev.author_name}
                            </p>
                          </td>
                          <td className="px-lg py-md text-label-sm text-text-secondary">
                            {rev.user_email || "Lecteur anonyme"}
                          </td>
                          <td className="px-lg py-md">
                            <span className="inline-flex items-center gap-1 text-label-sm font-semibold text-[#e5a00d]">
                              <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                              {rev.rating}/5
                            </span>
                          </td>
                          <td className="px-xl py-md text-label-sm text-text-primary max-w-[360px]">
                            <p className="line-clamp-3 italic">
                              « {rev.comment} »
                            </p>
                          </td>
                          <td className="px-lg py-md hidden sm:table-cell text-video-title text-text-tertiary whitespace-nowrap">
                            {rev.created_at
                              ? new Date(rev.created_at).toLocaleDateString("fr-FR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </td>
                          <td className="px-xl py-md text-right">
                            <button
                              onClick={() => void handleDeleteReview(rev.id)}
                              aria-label={`Supprimer l'avis de ${rev.user_email}`}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-corner-md text-text-secondary hover:bg-[#c13f4e]/10 hover:text-danger transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </>
    )}
  </div>
</div>
  )
}

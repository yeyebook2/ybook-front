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
import { createOrderApi, initiatePaymentApi } from "@/features/checkout/checkout.api"
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
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { getLibraryBookIds, getLibraryItems } from "@/features/dashboard/dashboard.api"
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
  Menu,
  User,
  Loader2,
  AlertCircle,
  ChevronDown,
} from "lucide-react"

export type View = "home" | "catalog" | "details" | "checkout" | "confirmation" | "library" | "reader" | "admin" | "login" | "register" | "dashboard"
type ToastState = {
  message: string
  variant?: ToastVariant
} | null
type Progress = Record<string, number>
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
const PROGRESS_KEY = "ybook-reading-progress"

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    return raw ? JSON.parse(raw) as Progress : {}
  } catch {
    return {}
  }
}

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

  const [sessionUser, setSessionUser] = useState<AuthUser | null>(() =>
    getCachedUser(),
  )
  const [sessionChecked, setSessionChecked] = useState(
    () => typeof window !== "undefined" && Boolean(getCachedUser()),
  )
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

  const [libGrid, setLibGrid] = useState(true)
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
      if (!message || typeof message !== "string" || !message.trim()) return
      setToast({ message: message.trim(), variant })
    },
    [],
  )

  const refreshLibrary = useCallback(async () => {
    try {
      const items = await getLibraryItems()
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
      } else {
        const ids = await getLibraryBookIds()
        if (ids && ids.length > 0) {
          setLibrary((prev) => Array.from(new Set([...prev, ...ids])))
        }
      }
    } catch {}
  }, [])

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
        setToast({
          message:
            reason instanceof Error
              ? reason.message
              : "Impossible de charger les livres de l’accueil.",
          variant: "error",
        })
      })

    return () => {
      active = false
    }
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
      toast.variant === "error" || toast.variant === "warning" ? 6500 : 3200
    const t = setTimeout(() => setToast(null), duration)
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
    setProgress(loadProgress())
    setProgressHydrated(true)
  }, [])
  useEffect(() => {
    if (!cartHydrated) return
    saveCart(cartItems)
  }, [cartHydrated, cartItems])
  useEffect(() => {
    if (!progressHydrated) return
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
    } catch {}
  }, [progressHydrated, progress])
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
        admin: "/admin",
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
      setToast({
        message: "Votre panier est vide.",
        variant: "warning",
      })
      return
    }

    if (!sessionUser) {
      setToast({
        message: "Veuillez vous connecter pour procéder au paiement et retrouver vos livres dans votre bibliothèque.",
        variant: "warning",
      })
      go("login")
      return
    }

    setCheckoutLoading(true)
    try {
      const bookIds = cartItems.map((item) => item.bookId)
      const orderRes = await createOrderApi(bookIds)
      const paymentRes = await initiatePaymentApi(
        orderRes.order.id,
        details.phone,
      )

      if (paymentRes.payment?.payment_url) {
        setToast({
          message: "Redirection vers la passerelle sécurisée FedaPay...",
          variant: "success",
        })
        window.location.href = paymentRes.payment.payment_url
        return
      }

      setLibrary((prev) =>
        Array.from(new Set([...prev, ...cartItems.map((i) => i.bookId)])),
      )
      setCartItems([])
      setView("confirmation")
      setToast({
        message: "Paiement confirmé — bonne lecture !",
        variant: "success",
      })
    } catch (err) {
      setToast({
        message:
          err instanceof Error
            ? err.message
            : "Erreur lors de l'initialisation du paiement FedaPay.",
        variant: "error",
      })
    } finally {
      setCheckoutLoading(false)
    }
  }

  const saveBook = (book: Book) => {
    setBooks((prev) => {
      const exists = prev.some((b) => b.id === book.id)
      if (exists) return prev.map((b) => (b.id === book.id ? book : b))
      return [book, ...prev]
    })
    setToast({ message: `« ${book.title} » enregistré`, variant: "success" })
  }

  const deleteBook = (id: string) => {
    const book = books.find((b) => b.id === id)
    setBooks((prev) => prev.filter((b) => b.id !== id))
    setCartItems((prev) => prev.filter((item) => item.bookId !== id))
    setToast({
      message: `« ${book?.title ?? "Titre"} » supprimé du catalogue`,
      variant: "warning",
    })
  }

  const togglePublish = (id: string) => {
    setBooks((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              published: b.published === false,
            }
          : b,
      ),
    )
  }

  const setOrderStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
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
    setView("home")
    router.push("/")
  }
  const handleLogout = async () => {
    await logout()
    setSessionUser(null)
    setView("home")
    router.push("/")
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
              onHome={() => go("home")}
              onCatalog={() => go("catalog")}
              onLibrary={() => go("library")}
              onLogout={() => void handleLogout()}
              onOpenBook={openBook}
              onAddToCart={addDashboardBookToCart}
              onToast={(message, variant = "default") => setToast({ message, variant })}
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
            <Toast
              message={toast.message}
              variant={toast.variant}
              onDismiss={() => setToast(null)}
            />
          )}
        </>
      </RoleGuard>
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
            <p className="text-label-sm text-text-secondary max-w-md">
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
            <p className="text-label-sm text-text-secondary max-w-md mb-xl">
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
          <p className="text-label-sm text-text-secondary max-w-md mb-xl">
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

    const safeChapters =
      readerBook.chapters && readerBook.chapters.length > 0
        ? readerBook.chapters
        : [
            {
              title: `Présentation & Extrait — ${readerBook.title}`,
              content:
                (readerBook.description || "")
                  .split("\n\n")
                  .map((p) => p.trim())
                  .filter(Boolean).length > 0
                  ? (readerBook.description || "")
                      .split("\n\n")
                      .map((p) => p.trim())
                      .filter(Boolean)
                  : [
                      `Bienvenue dans votre lecture numérique de « ${readerBook.title} » par ${readerBook.author}.`,
                      "Cet e-book est enregistré dans votre bibliothèque personnelle.",
                      "Profitez de votre espace de lecture en ligne sur YéYéBook.",
                    ],
            },
          ]
    const total = Math.max(1, safeChapters.length)
    const safeChapterIndex = Math.max(0, Math.min(currentChapter, total - 1))
    const chapter = safeChapters[safeChapterIndex] || safeChapters[0]
    const pct = Math.round(((safeChapterIndex + 1) / total) * 100)
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
    const bookmarked = (bookmarks[readerBook.id] ?? []).includes(safeChapterIndex)
    const toggleBookmark = () =>
      setBookmarks((prev) => {
        const list = prev[readerBook.id] ?? []
        const next = list.includes(safeChapterIndex)
          ? list.filter((c) => c !== safeChapterIndex)
          : [...list, safeChapterIndex]
        return { ...prev, [readerBook.id]: next }
      })

    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: t.page }}
      >
        {}
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

          {}
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
          {}
          <aside
            className="hidden lg:block py-2xl pr-lg sticky top-[61px] self-start max-h-[calc(100vh-61px)] overflow-y-auto"
            style={{ borderRight: `1px solid ${t.rule}` }}
          >
            <ChapterList
              book={{ ...readerBook, chapters: safeChapters }}
              current={safeChapterIndex}
              onSelect={goToChapter}
              bookmarks={bookmarks[readerBook.id] ?? []}
              tone={{ ink: t.ink, sub: t.sub }}
            />
          </aside>

          {}
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

              {}
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

        {}
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

        {}
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
                book={{ ...readerBook, chapters: safeChapters }}
                current={safeChapterIndex}
                onSelect={goToChapter}
                bookmarks={bookmarks[readerBook.id] ?? []}
                tone={{ ink: t.ink, sub: t.sub }}
              />
            </aside>
          </div>
        )}

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

                  {sessionUser?.role && ["admin", "super_admin", "moderator"].includes(sessionUser.role) && (
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
                          setToast({
                            message: "Aucun livre à la une n’est disponible.",
                            variant: "error",
                          })
                      }}
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
                    onOpen={() => openBook(book.id)}
                    onAdd={() => addToCart(book.id)}
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
                            +{book.reviews} ventes
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
                        {count} titres
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
            onHome={() => go("home")}
            onSearchChange={setSearchQuery}
            onOpenBook={(book) => openBook(book)}
            onAddToCart={(book) => addToCart(book)}
            onError={(message) => setToast({ message, variant: "error" })}
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

            {}
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
                    ? Math.round(
                        ((saved + 1) /
                          Math.max(1, book.chapters?.length || 1)) *
                          100,
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
                        onClick={() => startReading(book.id, book.slug)}
                      >
                        {started ? "Reprendre" : "Commencer la lecture"}
                      </Button>
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
              {sessionUser?.role && ["admin", "super_admin", "moderator"].includes(sessionUser.role) && (
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
  const [form, setForm] = useState(() => {
    let savedPhone = user?.phone || ""
    if (!savedPhone && typeof window !== "undefined") {
      try {
        savedPhone = localStorage.getItem("ybook-user-phone") || ""
      } catch {}
    }
    return {
      name: user?.name || "",
      email: user?.email || "",
      phone: savedPhone,
    }
  })

  useEffect(() => {
    if (user) {
      let savedPhone = user.phone || ""
      if (!savedPhone && typeof window !== "undefined") {
        try {
          savedPhone = localStorage.getItem("ybook-user-phone") || ""
        } catch {}
      }
      setForm((prev) => ({
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || savedPhone,
      }))
    }
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
  onDeleteBook: (id: string) => void
  onTogglePublish: (id: string) => void
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
    const map = new Map<string, number>()
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
        .map((b) => ({
          book: b,
          units: unitsByBook.get(b.id) ?? 0,
        }))
        .sort((a, b) => b.units - a.units)
        .slice(0, 5),
    [books, unitsByBook],
  )
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
      {}
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

      {}
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
          {}
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
                {}
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

                {}
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
                {}
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

                {}
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

          {}
          {tab === "catalog" && (
            <div className="flex flex-col gap-lg max-w-[1100px]">
              <div className="flex items-center justify-between gap-lg">
                <div className="w-full max-w-[360px]">
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

          {}
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
  existingIds: string[]
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
      book?.id ??
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `book-${Date.now()}`)
    const description =
      form.description.trim() ||
      `Un titre de ${form.author.trim()} disponible en lecture en ligne sur YéYéBook.`
    const chapters = book?.chapters ?? []
    onSave({
      id,
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category,
      price: Number(form.price),
      pages: Number(form.pages) || 120,
      year: Number(form.year) || new Date().getFullYear(),
      rating: book?.rating ?? 0,
      reviews: book?.reviews ?? 0,
      cover: form.cover.trim(),
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

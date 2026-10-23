# YéYéBook — Cartographie Complète des Appels API Frontend

> **Référence :** Code source de `src/features/`, `src/lib/api-client.ts`, `src/features/reader/EpubWebReader.tsx`, `src/App.tsx`.  
> **Date de qualification :** 22 octobre 2026  
> **Statut :** 100% aligné avec l'API FastAPI (`http://localhost:8001/api/v1`).

---

## 1. Principes et Client HTTP Centralisé (`src/lib/api-client.ts`)

Tous les appels API du frontend transitent obligatoirement par le client HTTP unifié `apiClient<T>()`.
Ce client garantit :
1. **L'inclusion systématique des cookies de session :** `credentials: "include"`.
2. **L'en-tête de contournement ngrok :** `ngrok-skip-browser-warning: true` (permet le test transparent via tunnel ou localhost).
3. **Le Content-Type standard :** `Content-Type: application/json` (automatiquement omis lors de l'envoi de `FormData` pour multipart).
4. **La désérialisation d'erreurs normalisée :** Transformation des formats FastAPI/Pydantic via `parseApiError`.
5. **Le Silent Refresh avec Verrouillage Anti-Tempête (Mutex) :** En cas d'erreur HTTP 401 sur une route métier protégée, une seule requête `POST /api/v1/auth/refresh` est émise pendant que les requêtes concurrentes attendent sa résolution. En cas de succès, toutes les requêtes sont rejouées de manière transparente.

---

## 2. Table de Correspondance Complète des Services Frontend

### A. Authentification (`src/features/auth/auth.api.ts`)

| Fonction Frontend | Méthode HTTP | Route Backend Cible | Paramètres & Headers | Modèle TypeScript Frontend | Modèle FastAPI Backend |
|---|---|---|---|---|---|
| `loginApi(credentials)` | `POST` | `/api/v1/auth/login` | `credentials: "include"`, Body JSON: `{ email, password }` | `UserSessionResponse` | `UserSessionResponse` + Set-Cookie |
| `registerApi(payload)` | `POST` | `/api/v1/auth/register` | `credentials: "include"`, Body JSON: `{ email, password, full_name, phone? }` | `UserSessionResponse` | `UserSessionResponse` + Set-Cookie |
| `logoutApi()` | `POST` | `/api/v1/auth/logout` | `credentials: "include"` | `{ success: boolean, message: string }` | `{ success: true }` + Clear-Cookie |
| `getCurrentUserApi()` | `GET` | `/api/v1/auth/me` | `credentials: "include"` | `AuthUser` | `AuthUser` |
| `refreshSessionApi()` | `POST` | `/api/v1/auth/refresh` | `credentials: "include"` | `UserSessionResponse` | `UserSessionResponse` (rotation session) |
| `updateProfileApi(data)` | `PUT` | `/api/v1/auth/me` | `credentials: "include"`, Body JSON: `{ full_name?, phone?, avatar_url? }` | `AuthUser` | `AuthUser` |
| `changePasswordApi(data)` | `POST` | `/api/v1/auth/change-password` | `credentials: "include"`, Body JSON: `{ old_password, new_password }` | `{ success: boolean }` | `{ success: true }` |
| `forgotPasswordApi(email)` | `POST` | `/api/v1/auth/forgot-password` | Body JSON: `{ email }` | `{ success: boolean, message: string }` | `{ success: true }` |

---

### B. Catalogue et Ouvrages (`src/features/catalog/catalog.api.ts`)

| Fonction Frontend | Méthode HTTP | Route Backend Cible | Paramètres & Query Strings | Données Consommées & Mappées |
|---|---|---|---|---|
| `getCatalog(filters)` | `GET` | `/api/v1/books` | `page`, `limit`, `category`, `language`, `min_price`, `max_price`, `search`, `sort_by`, `sort_order` | `items`, `total`, `sales_count`, `has_file`, `language`, `rating`, `reviews` |
| `getFeaturedBooks(limit)` | `GET` | `/api/v1/books/featured` | `limit` (défaut: 6) | Liste des livres mis en vedette |
| `getBooksByCategory(cat, p, l)` | `GET` | `/api/v1/books/category/{category_id}` | Path `category_id`, query `page`, `limit` | Liste paginée de la catégorie |
| `getBooksByAuthor(auth, p, l)` | `GET` | `/api/v1/books/author/{author_id}` | Path `author_id`, query `page`, `limit` | Liste paginée de l'auteur |

---

### C. Fiche Ouvrage, Avis et Titres Associés (`src/features/book-details/book-details.api.ts`)

| Fonction Frontend | Méthode HTTP | Route Backend Cible | Paramètres & Corps | Gestion Spécifique & Gardes |
|---|---|---|---|---|
| `getBookDetail(slug)` | `GET` | `/api/v1/books/{slug}` | Path `slug` | Récupère `book` avec `chapters: list[Chapter]` réels (sommaire ePub) et `is_owned` |
| `getBookReviews(slug, page, limit)` | `GET` | `/api/v1/books/{slug}/reviews` | Path `slug`, query `page`, `limit` | Notes moyennes et liste des commentaires clients vérifiés |
| `createBookReview(slug, payload)` | `POST` | `/api/v1/books/{slug}/reviews` | Path `slug`, Body: `{ rating, comment }` | **Garde UI :** Bouton masqué si non possédé ; le backend renvoie `403 REVIEW_REQUIRES_PURCHASE` |
| `getRelatedBooks(slug, limit)` | `GET` | `/api/v1/books/{slug}/related` | Path `slug`, query `limit` | Recommandations contextuelles basées sur le genre/auteur |

---

### D. Commandes et Tunnel de Paiement FedaPay (`src/features/checkout/checkout.api.ts`)

| Fonction Frontend | Méthode HTTP | Route Backend Cible | Paramètres & Corps | Sécurité Financière |
|---|---|---|---|---|
| `createOrderApi(bookIds)` | `POST` | `/api/v1/orders` | Body JSON: `{ book_ids: string[] }` | Crée la commande d'achat. Échoue avec `409 ALREADY_OWNED` si un livre est déjà possédé |
| `initiatePaymentApi(payload)` | `POST` | `/api/v1/payments/initiate` | Body JSON: `{ order_id, callback_url }` | Obtient l'URL de redirection FedaPay sécurisée |
| `confirmPaymentApi(id)` | `GET` | `/api/v1/payments/fedapay/confirm` | Query `id={transaction_id}` | **Vérification serveur stricte**. Confirme la transaction et ne vide le panier que si `order_status === "paid"` |
| `getOrderStatusApi(paymentId)` | `GET` | `/api/v1/payments/{payment_id}/status` | Path `payment_id` | Contrôle d'état asynchrone |

---

### E. Espace Lecteur, Bibliothèque et Liseuse (`src/features/dashboard/dashboard.api.ts` & `EpubWebReader.tsx`)

| Composant / Fonction | Méthode HTTP | Route Backend Cible | Paramètres & Corps | Respect des Règles Métier |
|---|---|---|---|---|
| `getLibrary(page, limit)` | `GET` | `/api/v1/library` | Query `page`, `limit` | Retourne `stats` (`reading`, `finished`, `books`, `orders`) et `items` avec `reading_status` et `progress_percent` |
| `getUserOrders(page, limit)` | `GET` | `/api/v1/orders` | Query `page`, `limit` | Historique des commandes avec statuts (`paid`, `pending`, `cancelled`). Facture réservée à `paid` |
| `getReadingProgress(bookId)` | `GET` | `/api/v1/library/{book_id}/progress` | Path `book_id` | Position `cfi` et `percent` sauvegardés en base |
| `saveReadingProgress(bookId, data)` | `PUT` | `/api/v1/library/{book_id}/progress` | Path `book_id`, Body: `{ cfi, percent }` | Enregistrement de la progression lue (débouncé 2,5s, ignoré lors du chargement initial) |
| Liseuse `EpubWebReader.tsx` | `GET` | `/api/v1/library/{book_id}/files/{inner_path}` | Path `book_id` + chemin interne | Streaming direct des assets EPUB sous contrôle d'accès acquéreur |

---

### F. Espace d'Administration (`src/features/admin/admin.api.ts`)

| Fonction Frontend | Méthode HTTP | Route Backend Cible | Paramètres & Corps | Contraintes Validées |
|---|---|---|---|---|
| `getAdminStats()` | `GET` | `/api/v1/admin/stats` | `credentials: "include"` | Chiffres d'affaires, statistiques globales, top livres |
| `getAdminBooks(params)` | `GET` | `/api/v1/admin/books` | Query `page`, `limit`, `status`, `search` | Inventaire complet avec statuts ePub et ventes |
| `createAdminBook(payload)` | `POST` | `/api/v1/admin/books` | Body: `AdminBookInput` | **`language: "fr" \| "en"`**, `price > 0`, non vide |
| `updateAdminBook(id, payload)` | `PUT` | `/api/v1/admin/books/{book_id}` | Path `book_id`, Body: `AdminBookInput` | Mise à jour données livre |
| `deleteAdminBook(id)` | `DELETE` | `/api/v1/admin/books/{book_id}` | Path `book_id` | Suppression ouvrage |
| `setAdminBookStatus(id, status)` | `PATCH` | `/api/v1/admin/books/{book_id}/status` | Path `book_id`, Body: `{ status }` | Statut `draft`, `published`, `archived` |
| `uploadCoverApi(formData)` | `POST` | `/api/v1/admin/books/upload-cover` | Form-Data: `file` | Téléversement image couverture (JPEG/PNG/WebP) |
| `uploadEpubApi(formData)` | `POST` | `/api/v1/admin/books/upload-epub` | Form-Data: `file` | Téléversement fichier ePub (extraction automatique sommaire) |
| `getAdminOrders(params)` | `GET` | `/api/v1/admin/orders` | Query `page`, `limit`, `status` | Gestion des commandes globales |
| `setAdminOrderStatus(id, status)` | `PATCH` | `/api/v1/admin/orders/{order_id}/status` | Path `order_id`, Body: `{ status }` | Changement de statut de commande |
| `getAdminReviews(params)` | `GET` | `/api/v1/admin/reviews` | Query `page`, `limit` | Avis pour modération |
| `deleteAdminReview(id)` | `DELETE` | `/api/v1/admin/reviews/{review_id}` | Path `review_id` | Suppression avis frauduleux |

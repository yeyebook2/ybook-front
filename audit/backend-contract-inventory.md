# YéYéBook — Inventaire Exhaustif des Contrats d'API Backend (FastAPI)

> **Référence :** Spécification OpenAPI 3.1.0 (`audit/openapi-backend.json`), source Python FastAPI (`/home/rd/Musique/YEYE BOOK/backend/app`), serveur local `http://localhost:8001`.  
> **Date de qualification :** 22 octobre 2026  
> **Statut :** Validé et certifié conforme.

---

## 1. Vue d'Ensemble de l'API

L'API YéYéBook est développée sous **FastAPI** avec persistance asynchrone **SQLAlchemy** et validation stricte **Pydantic v2**.  
Elle expose **51 opérations** réparties en 8 domaines fonctionnels et 2 sondes de santé système.

- **Préfixe global des routes métier :** `/api/v1`
- **Authentification :** Session HTTP par cookie sécurisé `HttpOnly` (`yeye_session`).
- **Gestion des CORS et requêtes de transition :** Exige `credentials: "include"` et supporte l'en-tête de contournement ngrok `ngrok-skip-browser-warning: true`.
- **Format uniforme des erreurs métier :**
  ```json
  {
    "success": false,
    "code": "STRING_ERROR_CODE",
    "message": "Message explicatif lisible par l'utilisateur",
    "field_errors": {},
    "request_id": "req-uuid"
  }
  ```

---

## 2. Matrice Complète des 51 Endpoints Backend

### A. Santé et Disponibilité Système (Sonde Infra)

| # | Méthode | Route | Accès | Entrée / Paramètres | Modèle de Réponse | Codes HTTP |
|---|---|---|---|---|---|---|
| 01 | `GET` | `/health` | Public | Aucun | `{"status": "ok", "app": "YéYéBook"}` | `200` |
| 02 | `GET` | `/health/ready` | Public | Aucun | `{"status": "ready", "database": "up"}` | `200`, `503` |

---

### B. Authentification et Gestion de Compte (`/api/v1/auth`)

| # | Méthode | Route | Accès | Entrée / Modèle Body | Réponse Pydantic | Codes Erreur |
|---|---|---|---|---|---|---|
| 03 | `POST` | `/api/v1/auth/register` | Public | `UserRegisterPayload` (`email`, `password` Argon2id min 8, `full_name`, `phone?`) | `UserSessionResponse` + Set-Cookie `yeye_session` | `400 EMAIL_ALREADY_EXISTS`, `422` |
| 04 | `POST` | `/api/v1/auth/login` | Public | `UserLoginPayload` (`email`, `password`) | `UserSessionResponse` + Set-Cookie `yeye_session` | `401 INVALID_CREDENTIALS`, `429 AUTH_RATE_LIMITED` |
| 05 | `POST` | `/api/v1/auth/refresh` | Session | Cookie `yeye_session` (automatique) | `UserSessionResponse` (rotation transparente) | `401 SESSION_EXPIRED` |
| 06 | `POST` | `/api/v1/auth/logout` | Session | Aucun | `{"success": true, "message": "Déconnexion réussie"}` + Cookie Clear | `200` |
| 07 | `GET` | `/api/v1/auth/me` | Session | Aucun | `AuthUser` (`id`, `email`, `full_name`, `role`, `phone`, `avatar_url`) | `401 SESSION_EXPIRED` |
| 08 | `PUT` | `/api/v1/auth/me` | Session | `UserProfileUpdatePayload` (`full_name?`, `phone?`, `avatar_url?`) | `AuthUser` mis à jour | `401`, `422` |
| 09 | `POST` | `/api/v1/auth/change-password` | Session | `ChangePasswordPayload` (`old_password`, `new_password`) | `{"success": true}` | `400 INVALID_PASSWORD`, `401`, `422` |
| 10 | `POST` | `/api/v1/auth/forgot-password` | Public | `ForgotPasswordPayload` (`email`) | `{"success": true, "message": "..."}` | `200` (silencieux anti-énumération) |

---

### C. Catalogue Public et Fiches Ouvrages (`/api/v1/books`)

| # | Méthode | Route | Accès | Paramètres Query / Body | Modèle de Réponse | Spécificités & Filtres |
|---|---|---|---|---|---|---|
| 11 | `GET` | `/api/v1/books` | Public | `page=1`, `page_size=20`, `search`, `category`, `language` (`fr`\|`en`), `min_price`, `max_price`, `sort_by` (`popularity`\|`price`\|`rating`\|`created_at`), `sort_order` (`asc`\|`desc`) | `PaginatedResponse[Book]` (`items`, `total`, `page`, `page_size`, `total_pages`, `has_next`, `has_previous`) | Livre inclut : `has_file: bool`, `sales_count: int`, `language: Literal["fr", "en"]`, `rating: float`, `reviews: int` |
| 12 | `GET` | `/api/v1/books/{slug}` | Public | Path `slug: str` | `BookDetailResponse` (`book`, `reviews`, `recommended`) | Inclut `chapters: list[Chapter]` extrait de l'ePub (vide si pas d'ePub) |
| 13 | `GET` | `/api/v1/books/id/{book_id}` | Public | Path `book_id: UUID` | `BookDetailResponse` | Recherche par identifiant technique |
| 14 | `GET` | `/api/v1/books/featured` | Public | `limit=6` | `list[Book]` | Titres mis en avant sur l'accueil |
| 15 | `GET` | `/api/v1/books/category/{category_id}` | Public | Path `category_id: str`, pagination | `PaginatedResponse[Book]` | Filtrage direct par catégorie |
| 16 | `GET` | `/api/v1/books/author/{author_id}` | Public | Path `author_id: str`, pagination | `PaginatedResponse[Book]` | Filtrage par auteur |
| 17 | `GET` | `/api/v1/books/{slug}/related` | Public | Path `slug: str`, `limit=4` | `list[Book]` | Livres similaires |
| 18 | `GET` | `/api/v1/books/{slug}/reviews` | Public | Path `slug: str`, pagination | `PaginatedResponse[Review]` | Notes et avis vérifiés |
| 19 | `POST` | `/api/v1/books/{slug}/reviews` | Client connecté | Path `slug: str`, Body: `ReviewPayload` (`rating: 1..5`, `comment: str`) | `ReviewResponse` | Exige un achat effectif (`403 REVIEW_REQUIRES_PURCHASE`) |

---

### D. Panier Serveur (`/api/v1/cart`)

| # | Méthode | Route | Accès | Entrée / Paramètres | Modèle de Réponse | Comportement |
|---|---|---|---|---|---|
| 20 | `GET` | `/api/v1/cart` | Client | Aucun | `CartResponse` (`items`, `subtotal`, `discount_amount`, `total_amount`) | Récupère le panier serveur persistant |
| 21 | `POST` | `/api/v1/cart/items` | Client | `AddCartItemPayload` (`book_id: UUID`) | `CartResponse` | Ajoute un titre (quantité unitaire e-book) |
| 22 | `PUT` | `/api/v1/cart/items/{book_id}` | Client | Path `book_id`, `UpdateCartItemPayload` | `CartResponse` | Mise à jour quantité |
| 23 | `DELETE` | `/api/v1/cart/items/{book_id}` | Client | Path `book_id` | `CartResponse` | Suppression d'un titre |
| 24 | `DELETE` | `/api/v1/cart` | Client | Aucun | `{"success": true, "items": []}` | Vidage intégral du panier |
| 25 | `POST` | `/api/v1/cart/coupon` | Client | `CouponPayload` (`code: str`) | `CartResponse` | Application code promotionnel |
| 26 | `POST` | `/api/v1/cart/merge` | Client | `MergeCartPayload` (`book_ids: list[UUID]`) | `CartResponse` | Fusionne le panier anonyme local lors du login |

---

### E. Commandes et Facturation (`/api/v1/orders`)

| # | Méthode | Route | Accès | Entrée / Paramètres | Modèle de Réponse | Règle Métier |
|---|---|---|---|---|---|
| 27 | `POST` | `/api/v1/orders` | Client | `CreateOrderPayload` (`book_ids: list[UUID]`) | `OrderResponse` (`id`, `reference`, `status: "pending"`, `total_amount`, `currency: "XOF"`, `items`) | Vérifie l'absence de doublons (`409 ALREADY_OWNED`) |
| 28 | `GET` | `/api/v1/orders` | Client | `page=1`, `page_size=20` | `PaginatedResponse[Order]` | Historique utilisateur incluant statuts `paid`, `pending`, `cancelled`, `refunded` |
| 29 | `GET` | `/api/v1/orders/{order_id}` | Client (propriétaire) | Path `order_id: UUID` | `OrderDetailResponse` | Détail complet d'une commande |

---

### F. Paiements FedaPay (`/api/v1/payments`)

| # | Méthode | Route | Accès | Entrée / Paramètres | Modèle de Réponse | Sécurité Critique |
|---|---|---|---|---|---|
| 30 | `POST` | `/api/v1/payments/initiate` | Client | `InitiatePaymentPayload` (`order_id: UUID`, `callback_url: str`) | `InitiatePaymentResponse` (`payment_url: str`, `transaction_id: int/str`, `status: "pending"`) | Génère le jeton et la session FedaPay |
| 31 | `GET` | `/api/v1/payments/fedapay/confirm` | Client | Query `id: str` (ID transaction FedaPay) | `ConfirmPaymentResponse` (`payment`, `order_status: "paid"|"pending"|"cancelled"|"refunded"`) | **Vérification cryptographique serveur auprès de FedaPay**. Le statut `order_status === "paid"` fait seul autorité. |
| 32 | `GET` | `/api/v1/payments/{payment_id}/status` | Client | Path `payment_id: UUID` | `PaymentStatusResponse` | Consultation d'état transactionnel |
| 33 | `POST` | `/api/v1/payments/webhook/fedapay` | Passerelle FedaPay | Headers FedaPay Signature + Payload transaction | `{"success": true}` | Webhook asynchrone sécurisé par secret d'API |

---

### G. Bibliothèque Utilisateur et Liseuse EPUB (`/api/v1/library`)

| # | Méthode | Route | Accès | Entrée / Paramètres | Modèle de Réponse | Comportement Anti-Piratage |
|---|---|---|---|---|---|
| 34 | `GET` | `/api/v1/library` | Client | Pagination | `LibraryResponse` (`stats: {books, reading, finished, not_started, orders}`, `items: list[LibraryItem]`) | Livres possédés avec `reading_status` et `progress_percent` |
| 35 | `GET` | `/api/v1/library/{book_id}/files/{inner_path:path}` | Client (acquéreur) | Path `book_id: UUID`, `inner_path: str` | Stream binaire (HTML/CSS/image/font) | Streaming direct des composants EPUB pour epubjs sans fuite de l'archive |
| 36 | `GET` | `/api/v1/library/{book_id}/epub` | Client (acquéreur) | Path `book_id: UUID` | `application/epub+zip` | Téléchargement binaire sécurisé |
| 37 | `GET` | `/api/v1/library/{book_id}/progress` | Client (acquéreur) | Path `book_id: UUID` | `ReadingProgressResponse` (`book_id`, `cfi`, `percent`, `last_read_at`) | Récupération dernière position de lecture |
| 38 | `PUT` | `/api/v1/library/{book_id}/progress` | Client (acquéreur) | Path `book_id: UUID`, Body: `ProgressPayload` (`cfi: str?`, `percent: float 0..100`) | `ReadingProgressResponse` | Sauvegarde position liseuse |

---

### H. Espace Administration (`/api/v1/admin`)

Toutes les routes exigent le rôle `admin` ou `super_admin` (`403 ADMIN_REQUIRED`).

| # | Méthode | Route | Entrée / Paramètres | Modèle Réponse | Contraintes Strictes |
|---|---|---|---|---|---|
| 39 | `GET` | `/api/v1/admin/stats` | Aucun | `AdminStatsResponse` | Chiffres d'affaires réel, commandes, volumes, ventes par catégorie |
| 40 | `GET` | `/api/v1/admin/books` | Pagination, filtre `status`, `search` | `PaginatedResponse[AdminBook]` | Liste de tous les ouvrages avec indicateurs `has_file`, ventes, stock numérique |
| 41 | `POST` | `/api/v1/admin/books` | Body: `BookPayload` | `AdminBook` | **`language: Literal["fr", "en"] = "fr"`**, `price: int > 0`, champs non vides |
| 42 | `GET` | `/api/v1/admin/books/{book_id}` | Path `book_id: UUID` | `AdminBook` | Fiche détaillée d'administration |
| 43 | `PUT` | `/api/v1/admin/books/{book_id}` | Path `book_id`, Body: `BookPayload` | `AdminBook` | Mise à jour intégrale ouvrage |
| 44 | `DELETE` | `/api/v1/admin/books/{book_id}` | Path `book_id: UUID` | `{"success": true}` | Suppression ouvrage |
| 45 | `PATCH` | `/api/v1/admin/books/{book_id}/status` | Body: `BookStatusPayload` (`status` ou `published`) | `AdminBook` | Bascule brouillon / publié / archivé |
| 46 | `POST` | `/api/v1/admin/books/upload-cover` | Form-Data: `file: UploadFile` (JPEG/PNG/WebP max 5 Mo) | `UploadCoverResponse` (`url`, `width`, `height`) | Stockage sous `/backend/media/covers/` |
| 47 | `POST` | `/api/v1/admin/books/upload-epub` | Form-Data: `file: UploadFile` (EPUB valide max 50 Mo) | `UploadEpubResponse` (`file_url`, `filename`, `size_bytes`) | Décompression, validation structure OPF/MIMETYPE, extraction table des matières |
| 48 | `GET` | `/api/v1/admin/orders` | Pagination, filtre statut | `PaginatedResponse[AdminOrder]` | Commandes globales plateforme |
| 49 | `PATCH` | `/api/v1/admin/orders/{order_id}/status` | Body: `OrderStatusPayload` (`status`) | `AdminOrder` | Changement manuel d'état commande |
| 50 | `GET` | `/api/v1/admin/reviews` | Pagination | `PaginatedResponse[AdminReview]` | Modération des avis utilisateurs |
| 51 | `DELETE` | `/api/v1/admin/reviews/{review_id}` | Path `review_id: UUID` | `{"success": true}` | Retrait d'un avis frauduleux |

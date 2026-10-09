# Contrat API Administration — YéYéBook

> Document de contrat officiel pour l’équipe backend FastAPI.
> Base URL configurée : `NEXT_PUBLIC_API_BASE_URL` (ex. `http://localhost:8000` ou URL ngrok/tunnel)
> Préfixe API : `/api/v1`
> Route frontend d’administration : **`/yeye-admin-admin`** (l'ancienne route `/admin` a été révoquée et renvoie 404).
> Toutes les routes d’administration nécessitent une authentification active (session cookie HttpOnly)
> avec un rôle utilisateur `"admin"` ou `"super_admin"`, ou le champ `is_admin: true`. En cas de rôle insuffisant : 403 Forbidden.

---

## 1. Conventions communes & Sécurité d'accès

- **Format** : JSON UTF-8 (`Content-Type: application/json`).
- **Naming** : `snake_case` pour l’ensemble des champs d’entrée et de sortie.
- **Dates** : ISO 8601 UTC (`YYYY-MM-DDTHH:mm:ssZ`).
- **Identifiants** : Chaînes UUID ou entiers stables.
- **Sécurité et protection de la route frontend** :
  - La route d’administration est hébergée sur `/yeye-admin-admin`.
  - **Mode furtif (Stealth 404)** : Tout utilisateur non connecté ou client standard qui visite `/yeye-admin-admin` reçoit une page **404 « Page introuvable »** avec bouton retour à l'accueil, afin de ne divulguer aucun indice sur l'existence de l'espace.
  - **Redirection automatique** : Lors de la connexion (`POST /api/v1/auth/login`), si le compte est administrateur (`role: "admin"` ou `is_admin: true`), le frontend le redirige automatiquement vers `/yeye-admin-admin`.
- **En-têtes requis pour les appels API** :
  - `Credentials: "include"` (pour transmettre les cookies de session).
  - `"ngrok-skip-browser-warning": "true"` (pour contourner l'interstitiel ngrok en environnement de développement).
- **Format standard d'erreur** :
```json
{
  "success": false,
  "code": "CODE_MACHINE_ERREUR",
  "message": "Message explicite en français destiné à l’utilisateur."
}
```
- **Codes d’erreur reconnus par le frontend** :
  - `401` : `SESSION_EXPIRED` (Session expirée, redirection /login)
  - `403` : `FORBIDDEN` / `ADMIN_REQUIRED` (Rôle admin requis)
  - `404` : `NOT_FOUND` / `BOOK_NOT_FOUND` / `ORDER_NOT_FOUND`
  - `410` : `ORDER_EXPIRED` (Commande de plus de 60 min non payée)
  - `413` : `PAYLOAD_TOO_LARGE` / `FILE_TOO_LARGE` (Fichier supérieur à 50 Mo pour ePub ou 5 Mo pour image)
  - `415` : `UNSUPPORTED_MEDIA_TYPE` (Format invalide, ex: fichier non ePub)
  - `422` : Validation Pydantic
  - `429` : `AUTH_RATE_LIMITED` (avec header `Retry-After: <secondes>`)
  - `503` : `SERVICE_UNAVAILABLE` (Base de données momentanément indisponible, avec header `Retry-After: <secondes>`)

---

## 2. Authentification Admin — `POST /api/v1/auth/login` & `GET /api/v1/auth/me`

Lors de la connexion ou de la vérification de session, l'objet utilisateur retourné par le backend doit identifier les droits d'administration de l'une des manières suivantes :

```json
{
  "success": true,
  "message": "Connexion réussie.",
  "user": {
    "id": "4f4b8b6f-2e76-4e94-9a7b-3f9215f7d7a1",
    "name": "Administrateur YéYéBook",
    "email": "admin@yeyebook.com",
    "role": "admin",
    "is_admin": true
  }
}
```
*Le frontend valide soit `role === "admin"` / `"super_admin"` / `"moderator"`, soit `is_admin === true`.*

---

## 3. Tableau de bord — `GET /api/v1/admin/stats`

### 3.1 Endpoint
```http
GET /api/v1/admin/stats
```

### 3.2 Réponse de succès (200 OK)
```json
{
  "success": true,
  "revenue_total": 450000,
  "orders_count": 128,
  "orders_paid_count": 112,
  "orders_pending_count": 10,
  "orders_cancelled_count": 6,
  "books_total": 24,
  "books_published_count": 21,
  "books_draft_count": 3,
  "average_rating": 4.6,
  "monthly_sales": [
    { "month": "Mai", "year": 2026, "revenue": 65000, "orders_count": 18 },
    { "month": "Juin", "year": 2026, "revenue": 82000, "orders_count": 22 },
    { "month": "Juil", "year": 2026, "revenue": 74000, "orders_count": 19 },
    { "month": "Août", "year": 2026, "revenue": 91000, "orders_count": 26 },
    { "month": "Sept", "year": 2026, "revenue": 105000, "orders_count": 31 },
    { "month": "Oct", "year": 2026, "revenue": 33000, "orders_count": 12 }
  ],
  "category_sales": [
    { "category": "Roman", "revenue": 210000, "percentage": 47 },
    { "category": "Histoire", "revenue": 125000, "percentage": 28 },
    { "category": "Poésie", "revenue": 65000, "percentage": 14 },
    { "category": "Contes", "revenue": 50000, "percentage": 11 }
  ],
  "top_books": [
    {
      "id": "26ebc884-fc07-40f6-9ce5-3a44deae23c5",
      "title": "Allah n'est pas obligé",
      "author": "Ahmadou Kourouma",
      "cover": "https://images.unsplash.com/photo-...",
      "units_sold": 45,
      "revenue": 157500
    }
  ]
}
```

---

## 4. Gestion du Catalogue — Livres

### 4.1 Liste des livres pour l'administration : `GET /api/v1/admin/books`
Permet de récupérer tous les livres, y compris les brouillons (`draft`).

```http
GET /api/v1/admin/books?page=1&limit=20&search=amadou&status=all
```

#### Paramètres query :
- `page` (int, défaut: 1)
- `limit` (int, défaut: 20)
- `search` (string, optionnel) : recherche sur titre, auteur, ISBN
- `status` (string, optionnel) : `all`, `published`, `draft`, `archived`

#### Réponse de succès (200 OK) :
```json
{
  "success": true,
  "items": [
    {
      "id": "26ebc884-fc07-40f6-9ce5-3a44deae23c5",
      "slug": "allah-n-est-pas-oblige",
      "title": "Allah n'est pas obligé",
      "author": "Ahmadou Kourouma",
      "category": "Roman",
      "price": 3500,
      "pages": 240,
      "year": 2000,
      "rating": 4.8,
      "reviews": 32,
      "cover": "https://...",
      "description": "L'histoire de Birahima...",
      "status": "published",
      "published": true,
      "created_at": "2026-09-01T10:00:00Z"
    }
  ],
  "total": 24,
  "page": 1,
  "limit": 20
}
```

---

### 4.2 Création d'un livre : `POST /api/v1/admin/books`

> **Note sur le champ `cover` et le fichier ePub** :
> 1. **Couverture (`cover`)** : Le formulaire admin propose un système de **glisser-déposer (Drag & Drop)** de fichiers image (JPG, PNG, WEBP, max 5 Mo) ou saisie d'URL. Le champ `cover` accepte une URL HTTP(S) ou une chaîne Base64 (`data:image/jpeg;base64,...`).
> 2. **Fichier ePub (`file_url` / `epub_filename`)** : Le formulaire intègre également une zone d'upload dédiée aux fichiers `.epub` (max 50 Mo). Après téléversement (ou encodage), `file_url` référence l'ePub sécurisé et `epub_filename` conserve le nom d'origine.

```http
POST /api/v1/admin/books
Content-Type: application/json
```

```json
{
  "title": "Une si longue lettre",
  "author": "Mariama Bâ",
  "category": "Roman",
  "price": 3000,
  "pages": 165,
  "year": 1979,
  "cover": "https://storage.yeyebook.com/covers/une-si-longue-lettre.jpg",
  "file_url": "https://storage.yeyebook.com/books/c7a8b321/une-si-longue-lettre.epub",
  "epub_filename": "une-si-longue-lettre.epub",
  "description": "Roman épistolaire majeur de la littérature sénégalaise.",
  "status": "published"
}
```

#### Réponse de succès (201 Created) :
```json
{
  "success": true,
  "message": "Livre créé avec succès.",
  "book": {
    "id": "c7a8b321-4f1e-4c8d-93e1-7e89ab0123cd",
    "slug": "une-si-longue-lettre",
    "title": "Une si longue lettre",
    "author": "Mariama Bâ",
    "category": "Roman",
    "price": 3000,
    "pages": 165,
    "year": 1979,
    "cover": "https://...",
    "description": "Roman épistolaire majeur...",
    "status": "published",
    "published": true
  }
}
```

---

### 4.3 Modification d'un livre : `PUT /api/v1/admin/books/{id}`

```http
PUT /api/v1/admin/books/c7a8b321-4f1e-4c8d-93e1-7e89ab0123cd
Content-Type: application/json
```

```json
{
  "title": "Une si longue lettre (Édition révisée)",
  "author": "Mariama Bâ",
  "category": "Roman",
  "price": 3500,
  "pages": 168,
  "year": 1979,
  "cover": "https://storage.yeyebook.com/covers/une-si-longue-lettre.jpg",
  "file_url": "https://storage.yeyebook.com/books/c7a8b321/une-si-longue-lettre.epub",
  "description": "Nouvelle édition annotée.",
  "status": "published"
}
```

#### Réponse de succès (200 OK) :
```json
{
  "success": true,
  "message": "Livre mis à jour avec succès.",
  "book": {
    "id": "c7a8b321-4f1e-4c8d-93e1-7e89ab0123cd",
    "slug": "une-si-longue-lettre",
    "title": "Une si longue lettre (Édition révisée)",
    "author": "Mariama Bâ",
    "category": "Roman",
    "price": 3500,
    "pages": 168,
    "year": 1979,
    "cover": "https://...",
    "description": "Nouvelle édition annotée.",
    "status": "published",
    "published": true
  }
}
```

---

### 4.4 Bascule publication/brouillon : `PATCH /api/v1/admin/books/{id}/status`

```http
PATCH /api/v1/admin/books/c7a8b321-4f1e-4c8d-93e1-7e89ab0123cd/status
Content-Type: application/json
```

```json
{
  "status": "draft"
}
```
*(ou `{ "published": false }` accepté par tolérance)*

#### Réponse de succès (200 OK) :
```json
{
  "success": true,
  "id": "c7a8b321-4f1e-4c8d-93e1-7e89ab0123cd",
  "status": "draft",
  "published": false,
  "message": "Statut de publication mis à jour."
}
```

---

### 4.5 Suppression d'un livre : `DELETE /api/v1/admin/books/{id}`

```http
DELETE /api/v1/admin/books/c7a8b321-4f1e-4c8d-93e1-7e89ab0123cd
```

#### Réponse de succès (200 OK) :
```json
{
  "success": true,
  "message": "Livre supprimé du catalogue avec succès."
}
```

---

### 4.6 (Optionnel) Téléversement direct de couverture : `POST /api/v1/admin/books/upload-cover`

Endpoint d'upload binaire direct pour hébergement sur Cloudflare R2 / AWS S3 selon les recommandations du cahier des charges (Section 4.2.3 & 4.7.1) :

```http
POST /api/v1/admin/books/upload-cover
Content-Type: multipart/form-data
```

**Champs formulaire** :
- `file` : Fichier binaire image (JPG, PNG, WEBP, max 5 Mo).

#### Réponse de succès (200 OK) :
```json
{
  "success": true,
  "url": "https://cdn.yeyebook.com/covers/c7a8b321-4f1e-cover.jpg",
  "width": 800,
  "height": 1200
}
```

---

### 4.7 Téléversement de fichier ePub : `POST /api/v1/admin/books/upload-epub`

Conformément aux sections **4.2.3, 4.7.1 et 4.7.4 du Cahier des charges** (« Upload fichier ePub, validation format, max 50Mo »), cet endpoint permet de réceptionner le fichier binaire `.epub` du livre et de le stocker de façon sécurisée (ex. sur bucket Cloudflare R2 / AWS S3 sous `/books/{book_id}/book.epub` avec ACL privée).

```http
POST /api/v1/admin/books/upload-epub
Content-Type: multipart/form-data
```

**Champs formulaire** :
- `file` : Fichier binaire ePub strictement au format `.epub` (`application/epub+zip`), taille maximale **50 Mo**.

**Contraintes de validation backend requises** :
1. **Format MIME strict** : Doit être `application/epub+zip` (ou extension `.epub`). Tout autre format (PDF, DOCX, etc.) doit être rejeté avec une erreur **`415 Unsupported Media Type`** ou **`422 Unprocessable Entity`**.
2. **Taille maximale** : Maximum 50 Mo. Si le fichier dépasse cette limite, le serveur doit renvoyer une erreur **`413 Payload Too Large`**.
3. **Contrôle d'intégrité (recommandé)** : Validation de la structure ePub via `epubcheck` avant finalisation du stockage.

#### Réponse de succès (200 OK ou 201 Created) :
```json
{
  "success": true,
  "message": "Fichier ePub téléversé avec succès.",
  "file_url": "https://storage.yeyebook.com/books/c7a8b321-4f1e/book.epub",
  "filename": "une-si-longue-lettre.epub",
  "size_bytes": 14258900
}
```

#### Réponses d'erreur spécifiques :
- **Fichier trop volumineux (413 Payload Too Large)** :
```json
{
  "success": false,
  "code": "PAYLOAD_TOO_LARGE",
  "message": "Le fichier ePub dépasse la taille maximale autorisée de 50 Mo."
}
```
- **Format non supporté (415 Unsupported Media Type)** :
```json
{
  "success": false,
  "code": "UNSUPPORTED_MEDIA_TYPE",
  "message": "Seuls les fichiers au format ePub (.epub) sont acceptés."
}
```

> **Note sur l'expérience utilisateur et la vitesse perçue (Perceived Speed Loader)** :
> Côté frontend, l'upload est équipé d'une barre de progression optimiste à paliers dynamiques (saut immédiat à 25%, progression vers 50%, surge rapide à 75%, finalisation fluide à 100% avec icône de validation verte et détails du fichier).
> Ce comportement est géré **100% côté client** afin de maintenir l'attention de l'administrateur : le backend FastAPI n'a besoin d'aucun protocole particulier (WebSocket/SSE), il traite la requête `multipart/form-data` de manière standard.

---

## 5. Gestion des Commandes — `GET` & `PATCH /api/v1/admin/orders`

### 5.1 Liste des commandes : `GET /api/v1/admin/orders`

```http
GET /api/v1/admin/orders?page=1&limit=20&status=all&search=diallo
```

#### Paramètres query :
- `page` (int, défaut: 1)
- `limit` (int, défaut: 20)
- `status` (string, optionnel) : `all`, `paid`, `pending`, `cancelled`, `refunded`
- `search` (string, optionnel) : nom client, e-mail, téléphone, id commande

#### Réponse de succès (200 OK) :
```json
{
  "success": true,
  "items": [
    {
      "id": "ord-7842-9912",
      "user_id": "4f4b8b6f-2e76-4e94-9a7b-3f9215f7d7a1",
      "customer_name": "Aminata Diallo",
      "customer_email": "aminata.diallo@example.com",
      "customer_phone": "+229 97 00 11 22",
      "provider": "fedapay",
      "status": "paid",
      "total_amount": 7000,
      "currency": "XOF",
      "created_at": "2026-10-07T14:30:00Z",
      "items": [
        {
          "book_id": "26ebc884-fc07-40f6-9ce5-3a44deae23c5",
          "title": "Allah n'est pas obligé",
          "price": 3500,
          "quantity": 2
        }
      ]
    }
  ],
  "total": 128,
  "page": 1,
  "limit": 20
}
```

---

### 5.2 Changement de statut d'une commande : `PATCH /api/v1/admin/orders/{id}/status`

```http
PATCH /api/v1/admin/orders/ord-7842-9912/status
Content-Type: application/json
```

```json
{
  "status": "refunded"
}
```
*Valeurs acceptées : `paid`, `pending`, `cancelled`, `refunded`.*

#### Réponse de succès (200 OK) :
```json
{
  "success": true,
  "order_id": "ord-7842-9912",
  "status": "refunded",
  "message": "Statut de la commande mis à jour."
}
```

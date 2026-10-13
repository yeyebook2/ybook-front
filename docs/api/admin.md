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
  - `413` : `FILE_TOO_LARGE` (Fichier supérieur à 50 Mo pour ePub ou 5 Mo pour image)
  - `415` : `UNSUPPORTED_MEDIA_TYPE` (Format invalide, ex: fichier non ePub ou ePub corrompu)
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
      "has_file": true,
      "epub_filename": "allah-n-est-pas-oblige.epub",
      "file_size": 14258900,
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
> 1. **Couverture (`cover`)** : Le formulaire admin téléverse l'image via `POST /api/v1/admin/books/upload-cover` (max 5 Mo) qui renvoie une URL CDN/stockage, ou transmet directement l'image en Base64 (`data:image/jpeg;base64,...`).
> 2. **Fichier ePub (`file_url` / `epub_filename`)** : Le fichier `.epub` est préalablement envoyé via `POST /api/v1/admin/books/upload-epub` (max 50 Mo), qui retourne une référence interne `file_url` sous la forme `private://books/...`.
>    - **Important** : `file_url` n'est pas une URL publique de téléchargement, mais un identifiant de stockage privé sécurisé. Il doit être renvoyé tel quel dans le corps du `POST` ou `PUT /admin/books`. Le livre dispose ainsi des drapeaux `has_file: true`, `epub_filename` et `file_size`.

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
  "file_url": "private://books/c7a8b321-4f1e/book.epub",
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
    "has_file": true,
    "epub_filename": "une-si-longue-lettre.epub",
    "file_size": 14258900,
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

### 4.6 Téléversement direct de couverture : `POST /api/v1/admin/books/upload-cover`

Endpoint d'upload binaire direct pour hébergement d'image selon les recommandations du cahier des charges (Section 4.2.3 & 4.7.1) :

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
  "url": "https://cdn.yeyebook.com/covers/c7a8b321-4f1e-cover.jpg"
}
```

*Note : Les couvertures peuvent également être envoyées directement encodées en base64 (`data:image/jpeg;base64,...`) dans le champ `cover` de l'objet livre.*

---

### 4.7 Téléversement de fichier ePub : `POST /api/v1/admin/books/upload-epub`

Conformément aux sections **4.2.3, 4.7.1 et 4.7.4 du Cahier des charges** (« Upload fichier ePub, validation format, max 50Mo »), cet endpoint permet de réceptionner le fichier binaire `.epub` du livre et de le stocker dans un dossier sécurisé privé (non accessible par adresse web directe).

```http
POST /api/v1/admin/books/upload-epub
Content-Type: multipart/form-data
```

**Champs formulaire** :
- `file` : Fichier binaire ePub strictement au format `.epub` (`application/epub+zip`), taille maximale **50 Mo**.

**Contraintes de validation backend requises** :
1. **Contrôle d'intégrité et format strict** : Le backend inspecte et ouvre réellement l'archive du fichier pour s'assurer qu'il s'agit d'un ePub valide (`META-INF/container.xml`). Un fichier non ePub ou un PDF simplement renommé en `.epub` est immédiatement rejeté avec une erreur **`415 UNSUPPORTED_MEDIA_TYPE`**.
2. **Taille maximale** : Maximum 50 Mo. Si le fichier dépasse cette limite, le serveur renvoie une erreur **`413 FILE_TOO_LARGE`**.
3. **Référence interne sécurisée** : La réponse renvoie `file_url` sous le schéma privé `private://books/...`. Ce n'est pas un lien direct téléchargeable par un navigateur, mais un identifiant interne que le frontend réinjecte dans `file_url` lors du `POST` ou `PUT /admin/books`.

#### Réponse de succès (200 OK) :
```json
{
  "success": true,
  "message": "Fichier ePub téléversé et validé avec succès.",
  "file_url": "private://books/c7a8b321-4f1e/book.epub",
  "filename": "une-si-longue-lettre.epub",
  "size_bytes": 14258900
}
```

#### Réponses d'erreur spécifiques :
- **Fichier trop volumineux (413 FILE_TOO_LARGE)** :
```json
{
  "success": false,
  "code": "FILE_TOO_LARGE",
  "message": "Le fichier dépasse la taille maximale autorisée de 50 Mo."
}
```
- **Format non supporté (415 UNSUPPORTED_MEDIA_TYPE)** :
```json
{
  "success": false,
  "code": "UNSUPPORTED_MEDIA_TYPE",
  "message": "Le fichier fourni n'est pas un fichier ePub valide."
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

---

## 6. Intégration Web Reader & Bibliothèque Acheteur (`/api/v1/library`)

Le lecteur web ePub du frontend (`epub.js`) consomme directement les fichiers ePub téléversés via l'espace admin. Les anciennes routes `/sessions` sont obsolètes (réponse `410 Gone`).

### 6.1 Accès aux fichiers du livre (Sécurisé par session acheteur)

L'accès est réservé exclusivement aux acheteurs ayant réglé leur commande (`status: "paid"`).
- **Streaming chapitre par chapitre (mode prioritaire)** :
  ```http
  GET /api/v1/library/{book_id}/files/
  ```
  Appelé par `epub.js` avec `{ requestCredentials: true }`. Permet au navigateur de récupérer `META-INF/container.xml` puis chaque chapitre HTML individuellement pour un affichage instantané sans attendre le téléchargement complet du fichier.
- **Téléchargement conteneur complet (fallback binaire)** :
  ```http
  GET /api/v1/library/{book_id}/epub
  ```
  Appelé avec `credentials: "include"`, renvoie le flux binaire de l'archive ePub complète (traité en `ArrayBuffer` par le client).

#### Codes d'erreur spécifiques :
- `403 Forbidden` (`BOOK_NOT_OWNED`) : L'utilisateur connecté n'a pas acheté ce titre.
- `404 Not Found` (`EPUB_NOT_AVAILABLE`) : Le livre n'a pas encore de fichier ePub téléversé par l'administration.

### 6.2 Sécurité et protection des contenus dans le Web Reader
- **Filigrane acheteur dynamique** : Chaque chapitre servi intègre en bas de page un filigrane contenant l'email de l'acheteur (laissé visible).
- **Protection anti-copie côté client** :
  - Clic droit désactivé (`contextmenu.preventDefault()`).
  - Sélection de texte bloquée (`user-select: none`).
  - Impression désactivée (`@media print { body { display: none !important; } }`).

### 6.3 Synchronisation de la progression de lecture

- **Récupération du dernier point de lecture** :
  ```http
  GET /api/v1/library/{book_id}/progress
  ```
  Réponse (200 OK) :
  ```json
  {
    "cfi": "epubcfi(/6/14[chap03]!/4/2/10/1:0)",
    "percent": 42
  }
  ```
  À l'ouverture du lecteur, `rendition.display(cfi)` repositionne immédiatement le lecteur sur la page exacte.
- **Sauvegarde de l'avancement** :
  ```http
  PUT /api/v1/library/{book_id}/progress
  Content-Type: application/json
  ```
  Payload :
  ```json
  {
    "cfi": "epubcfi(/6/14[chap03]!/4/2/14/1:0)",
    "percent": 45
  }
  ```
  Déclenché de manière throttlée (au plus toutes les 3 secondes) sur l'événement `rendition.on("relocated")`.
- **Affichage dans la bibliothèque** : L'endpoint `GET /api/v1/library` renvoie également `progress_percent` pour afficher le pourcentage d'avancement directement sur les fiches de livres de l'acheteur.


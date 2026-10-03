# API Catalogue & Fiche Livre — YéYéBook

> Document de contrat pour l’équipe backend. Toutes les routes sont préfixées par `/api/v1` via la configuration `NEXT_PUBLIC_API_BASE_URL`. Sans cette variable, le frontend affiche un message d’erreur explicite et **ne crée aucune donnée de substitution**.

---

## 1. Catalogue — `GET /books`

### 1.1 Endpoint

```http
GET /api/v1/books
```

### 1.2 Paramètres de requête (query string)

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | `integer` | `1` | Numéro de page (1-indexé) |
| `limit` | `integer` | `8` | Nombre d’éléments par page |
| `search` | `string` | `""` | Recherche full-text (titre, auteur, ISBN, tags) |
| `category` | `string` | `""` | Une ou plusieurs catégories séparées par des virgules (`Roman,Histoire`) |
| `min_price` | `string` | `""` | Prix minimum en FCFA (entier) |
| `max_price` | `string` | `""` | Prix maximum en FCFA (entier) |
| `rating` | `string` | `""` | Note minimale (entier 1–5). **Paramètre nommé `rating` côté API**, `minRating` côté frontend. |
| `language` | `string` | `""` | Code ISO 639-1 (`fr`, `en`). Vide = toutes. |
| `sort_by` | `string` | `relevance` | Critère de tri : `relevance`, `popularity`, `rating`, `published_at`, `price` |
| `sort_order` | `string` | `desc` | Ordre : `asc` ou `desc` |

> **Note importante** : le frontend envoie aussi `publishedDate` (`all`, `last-30-days`, `last-6-months`, `last-year`) dans l’état local, mais **ce paramètre n’est pas encore transmis à l’API** (en attente de confirmation côté backend). Si vous l’implémentez, le nom suggéré est `published_date`.

### 1.3 Exemple de requête complète

```http
GET /api/v1/books?page=1&limit=8&search=afrique&category=Roman,Po%C3%A9sie&min_price=1000&max_price=10000&rating=4&language=fr&sort_by=published_at&sort_order=desc
```

### 1.4 Réponse attendue — Succès (200)

```json
{
  "items": [
    {
      "id": 42,
      "slug": "racines-afrique",
      "title": "Les Racines de l'Afrique",
      "subtitle": "Anthologie contemporaine",
      "author": "Amadou Kourouma",
      "author_slug": "amadou-kourouma",
      "price": 3500,
      "category": "Roman",
      "rating": 4.7,
      "reviews": 128,
      "pages": 312,
      "year": 2023,
      "isbn": "978-2-1234-5678-9",
      "format": "EPUB",
      "cover": "https://images.unsplash.com/photo-xyz",
      "description": "Une plongée au cœur des littératures africaines francophones...",
      "tags": ["identité", "diaspora", "histoire"],
      "language": "fr",
      "published_at": "2023-10-15T00:00:00Z",
      "published": true
    }
  ],
  "total": 124,
  "page": 1,
  "limit": 8,
  "total_pages": 16,
  "facets": {
    "categories": [
      { "value": "Roman", "label": "Roman", "count": 67 },
      { "value": "Histoire", "label": "Histoire", "count": 23 },
      { "value": "Poésie", "label": "Poésie", "count": 18 },
      { "value": "Contes", "label": "Contes", "count": 16 }
    ],
    "languages": [
      { "value": "fr", "label": "Français", "count": 110 },
      { "value": "en", "label": "Anglais", "count": 14 }
    ]
  }
}
```

### 1.5 Champs acceptés côté backend (tolérance)

Le mappeur `mapBackendBook` normalise les variations suivantes :

| Champ frontend | Champs backend acceptés (ordre de priorité) |
|----------------|---------------------------------------------|
| `id` | `id` (number ou string) |
| `slug` | `slug` |
| `title` | `title` |
| `subtitle` | `subtitle` |
| `author` | `author` (string) \| `author.name` \| `author_name` |
| `authorSlug` | `author.slug` \| `author_slug` |
| `price` | `price` \| `price_fcfa` |
| `category` | `category` \| `category_name` \| `categories[0]` \| `categories[0].name` |
| `rating` | `rating` \| `average_rating` |
| `reviews` | `reviews` \| `reviews_count` |
| `pages` | `pages` \| `page_count` |
| `year` | `year` \| `publication_year` |
| `cover` | `cover_url` \| `cover` |
| `description` | `description` |
| `tags` | `tags` |
| `language` | `language` |
| `publishedAt` | `published_at` |
| `published` | `published` (booléen, défaut `true`) |

Le backend peut renvoyer **soit** `items` **soit** `books` (tableau), **soit** `total_pages` **soit** `total_pages`. Le frontend gère les deux.

### 1.6 Réponse — Erreur (4xx/5xx)

```json
{
  "message": "Erreur de validation : le paramètre 'rating' doit être un entier entre 1 et 5."
}
```

Le frontend affiche ce message dans un toast global et vide les résultats. **Aucun livre factice n’est généré.**

### 1.7 Codes d’erreur métier suggérés

- `INVALID_PAGE` — page < 1 ou > total_pages
- `INVALID_LIMIT` — limit hors bornes (ex. > 50)
- `INVALID_SORT_BY` — valeur non supportée
- `INVALID_CATEGORY` — catégorie inconnue
- `VALIDATION_ERROR` — paramètres mal formés
- `UNAUTHENTICATED` — si catalogue privé (pas le cas actuel)

---

## 2. Fiche livre — `GET /books/{slug}`

### 2.1 Endpoint principal

```http
GET /api/v1/books/{slug}
```

Le `slug` est encodé (ex. `les-races-de-l%27afrique`).

### 2.2 Réponse attendue — Succès (200)

Le frontend accepte **deux formats** :

#### Format A — Réponse enrichie (recommandé, un seul appel)

```json
{
  "book": {
    "id": 42,
    "slug": "racines-afrique",
    "title": "Les Racines de l'Afrique",
    "subtitle": "Anthologie contemporaine",
    "author": "Amadou Kourouma",
    "author_slug": "amadou-kourouma",
    "price": 3500,
    "category": "Roman",
    "rating": 4.7,
    "reviews": 128,
    "pages": 312,
    "year": 2023,
    "isbn": "978-2-1234-5678-9",
    "format": "EPUB",
    "cover": "https://images.unsplash.com/photo-xyz",
    "description": "Une plongée au cœur des littératures africaines francophones...",
    "tags": ["identité", "diaspora", "histoire"],
    "language": "fr",
    "published_at": "2023-10-15T00:00:00Z",
    "published": true,
    "authorBio": "Amadou Kourouma (1927–2003) est une figure majeure...",
    "chapters": [
      { "title": "Prologue", "content": ["Premier paragraphe...", "Deuxième paragraphe..."] },
      { "title": "Chapitre 1", "content": ["...", "..."] }
    ]
  },
  "reviews": {
    "items": [
      {
        "id": "rev_001",
        "authorName": "Fatou Diallo",
        "rating": 5,
        "comment": "Un chef-d'œuvre incontournable.",
        "createdAt": "2024-01-15T10:30:00Z",
        "verifiedPurchase": true
      }
    ],
    "total": 128,
    "averageRating": 4.7,
    "page": 1,
    "limit": 5,
    "totalPages": 26
  },
  "related": {
    "items": [
      { "id": 43, "slug": "soleil-des-independances", "title": "Le Soleil des Indépendances", ... }
    ]
  }
}
```

#### Format B — Réponse minimale (plusieurs appels)

```json
{
  "book": { ... },           // même structure que ci-dessus
  "items": [ { ... } ]       // alternative à "book" (tableau à 1 élément)
}
```

Si `reviews` et `related` sont absents, le frontend fait **deux appels supplémentaires** (voir §2.3 et §2.4).

### 2.3 Champs supplémentaires pour le détail

| Champ frontend | Champs backend acceptés |
|----------------|------------------------|
| `authorBio` | `author.bio` \| `author_bio` |
| `chapters[]` | `chapters[]` (tableau d’objets `{ title, content[] }`) |

### 2.4 Avis — `GET /books/{slug}/reviews`

Appelé si `reviews` absent de la réponse principale.

```http
GET /api/v1/books/racines-afrique/reviews?page=1&limit=5&sort_by=recent
```

#### Paramètres

| Paramètre | Type | Défaut |
|-----------|------|--------|
| `page` | `integer` | `1` |
| `limit` | `integer` | `5` |
| `sort_by` | `string` | `recent` (valeurs possibles : `recent`, `helpful`, `rating`) |

#### Réponse attendue

```json
{
  "items": [
    {
      "id": "rev_001",
      "author_name": "Fatou Diallo",
      "author": { "name": "Fatou Diallo" },
      "rating": 5,
      "comment": "Un chef-d'œuvre incontournable.",
      "created_at": "2024-01-15T10:30:00Z",
      "verified_purchase": true
    }
  ],
  "total": 128,
  "page": 1,
  "limit": 5,
  "avg_rating": 4.7
}
```

**Champs acceptés** : `author_name` ou `author.name`, `rating`, `comment`, `created_at`, `verified_purchase`. Le frontend fournit des valeurs par défaut si absent.

### 2.5 Livres liés — `GET /books/{slug}/related`

Appelé si `related` absent de la réponse principale.

```http
GET /api/v1/books/racines-afrique/related?limit=4
```

#### Paramètres

| Paramètre | Type | Défaut |
|-----------|------|--------|
| `limit` | `integer` | `4` |

#### Réponse attendue

Même structure que la liste catalogue (`items` ou `books` + pagination optionnelle).

```json
{
  "items": [
    { "id": 43, "slug": "soleil-des-independances", "title": "Le Soleil des Indépendances", ... }
  ]
}
```

### 2.6 Créer un avis — `POST /books/{slug}/reviews`

Nécessite une session authentifiée (`credentials: "include"`).

```http
POST /api/v1/books/racines-afrique/reviews
Content-Type: application/json
```

#### Corps de la requête

```json
{
  "rating": 5,
  "comment": "Un chef-d'œuvre incontournable. La plume de Kourouma est magistrale."
}
```

| Champ | Type | Contraintes |
|-------|------|-------------|
| `rating` | `integer` | 1–5 (obligatoire) |
| `comment` | `string` | 1–2000 caractères (obligatoire) |

#### Réponse attendue — Succès (201)

```json
{
  "review": {
    "id": "rev_002",
    "author_name": "Kofi Mensah",
    "rating": 5,
    "comment": "Un chef-d'œuvre incontournable...",
    "created_at": "2024-02-10T14:22:00Z",
    "verified_purchase": false
  }
}
```

#### Erreurs possibles

| Code HTTP | Code métier | Message exemple |
|-----------|-------------|-----------------|
| 401 | `UNAUTHENTICATED` | "Connectez-vous pour laisser un avis." |
| 403 | `NOT_PURCHASED` | "Vous devez avoir acheté ce livre pour l’évaluer." |
| 409 | `ALREADY_REVIEWED` | "Vous avez déjà évalué ce livre." |
| 422 | `VALIDATION_ERROR` | "La note doit être entre 1 et 5." |

---

## 3. Gestion des erreurs — Règles communes

### 3.1 Format d’erreur standard

Toutes les erreurs HTTP (4xx, 5xx) doivent renvoyer un JSON avec un champ `message` exploitable :

```json
{ "message": "Description claire de l'erreur pour l'utilisateur final." }
```

Le frontend utilise ce message tel quel dans le toast global.

### 3.2 En-têtes requis

- `Content-Type: application/json`
- `credentials: "include"` sur **tous** les appels (cookies HttpOnly)
- CORS configuré pour autoriser l’origine frontend (`https://yeyebook.com` en prod)

### 3.3 Comportement frontend en cas d’échec

| Situation | Comportement |
|-----------|--------------|
| `NEXT_PUBLIC_API_BASE_URL` absente | Toast : « L’URL de l’API n’est pas configurée. » — état vide |
| Erreur réseau / timeout | Toast : « Impossible de charger le catalogue / la fiche. » — état vide |
| HTTP 401 sur route authentifiée | Redirection vers `/login` (via `AuthGuard`) |
| HTTP 403 sur admin | Toast : « Vous n’avez pas les permissions... » — retour accueil |
| Réponse 200 mais structure invalide | Toast : « Données reçues invalides. » — état vide |

**Jamais** de fallback local (mock, données codées en dur, session démo).

---

## 4. Catégories & langues — Valeurs de référence

Le frontend utilise ces valeurs fixes pour l’UI (checkboxes, selects). Le backend doit les renvoyer dans les facettes avec les mêmes `value`.

### 4.1 Catégories

| `value` | `label` |
|---------|---------|
| `Roman` | Roman |
| `Histoire` | Histoire |
| `Poésie` | Poésie |
| `Contes` | Contes |

### 4.2 Langues

| `value` | `label` |
|---------|---------|
| `""` (vide) | Toutes les langues |
| `fr` | Français |
| `en` | Anglais |

### 4.3 Tris disponibles

| `sort_by` | `sort_order` | Label UI |
|-----------|--------------|----------|
| `relevance` | `desc` | Pertinence |
| `popularity` | `desc` | Popularité |
| `rating` | `desc` | Mieux notés |
| `published_at` | `desc` | Plus récents |
| `price` | `asc` | Prix croissant |
| `price` | `desc` | Prix décroissant |

---

## 5. Exemples de payloads complets pour tests

### 5.1 Catalogue — Première page, tri par défaut

**Requête**
```http
GET /api/v1/books?page=1&limit=8&sort_by=relevance&sort_order=desc
```

**Réponse**
```json
{
  "items": [
    {
      "id": 1,
      "slug": "soleil-des-independances",
      "title": "Le Soleil des Indépendances",
      "author": "Ahmadou Kourouma",
      "price": 2800,
      "category": "Roman",
      "rating": 4.8,
      "reviews": 215,
      "pages": 256,
      "year": 2022,
      "cover": "https://images.unsplash.com/photo-abc",
      "description": "Roman fondateur de la littérature africaine francophone...",
      "published_at": "2022-03-10T00:00:00Z",
      "published": true
    },
    {
      "id": 2,
      "slug": "aube-africaine",
      "title": "L'Aube Africaine",
      "author": "Ken Bugul",
      "price": 3200,
      "category": "Roman",
      "rating": 4.6,
      "reviews": 89,
      "pages": 198,
      "year": 2023,
      "cover": "https://images.unsplash.com/photo-def",
      "description": "Récit autobiographique puissant...",
      "published_at": "2023-06-22T00:00:00Z",
      "published": true
    }
  ],
  "total": 124,
  "page": 1,
  "limit": 8,
  "total_pages": 16,
  "facets": {
    "categories": [
      { "value": "Roman", "label": "Roman", "count": 67 },
      { "value": "Histoire", "label": "Histoire", "count": 23 },
      { "value": "Poésie", "label": "Poésie", "count": 18 },
      { "value": "Contes", "label": "Contes", "count": 16 }
    ],
    "languages": [
      { "value": "fr", "label": "Français", "count": 110 },
      { "value": "en", "label": "Anglais", "count": 14 }
    ]
  }
}
```

### 5.2 Catalogue — Filtres combinés

**Requête**
```http
GET /api/v1/books?page=1&limit=8&search=poesie&category=Po%C3%A9sie&min_price=500&max_price=5000&rating=4&language=fr&sort_by=rating&sort_order=desc
```

**Réponse** (structure identique, `items` filtrés, `total` mis à jour, facettes reflétant le sous-ensemble)

### 5.3 Fiche livre — Réponse enrichie complète

**Requête**
```http
GET /api/v1/books/soleil-des-independances
```

**Réponse**
```json
{
  "book": {
    "id": 1,
    "slug": "soleil-des-independances",
    "title": "Le Soleil des Indépendances",
    "subtitle": "Roman",
    "author": "Ahmadou Kourouma",
    "author_slug": "ahmadou-kourouma",
    "authorBio": "Ahmadou Kourouma (1927–2003), écrivain ivoirien, figure majeure...",
    "price": 2800,
    "category": "Roman",
    "rating": 4.8,
    "reviews": 215,
    "pages": 256,
    "year": 2022,
    "isbn": "978-2-0704-1234-5",
    "format": "EPUB",
    "cover": "https://images.unsplash.com/photo-abc",
    "description": "Roman fondateur de la littérature africaine francophone, Le Soleil des Indépendances raconte l'histoire de Fama, dernier roi d'une lignée malinké...",
    "tags": ["postcolonial", "malinké", "tradition", "pouvoir"],
    "language": "fr",
    "published_at": "2022-03-10T00:00:00Z",
    "published": true,
    "chapters": [
      { "title": "Chapitre 1", "content": ["Il faisait nuit sur la plaine...", "Le vent chaud soufflait..."] },
      { "title": "Chapitre 2", "content": ["Fama se réveilla avant l'aube...", "Le coq avait chanté trois fois."] }
    ]
  },
  "reviews": {
    "items": [
      {
        "id": "rev_001",
        "authorName": "Aïcha Traoré",
        "rating": 5,
        "comment": "Un classique absolu. La langue de Kourouma est une musique.",
        "createdAt": "2024-01-20T08:15:00Z",
        "verifiedPurchase": true
      },
      {
        "id": "rev_002",
        "authorName": "Moussa Konaté",
        "rating": 4,
        "comment": "Puissant, mais exige une connaissance du contexte historique.",
        "createdAt": "2024-01-18T14:30:00Z",
        "verifiedPurchase": true
      }
    ],
    "total": 215,
    "averageRating": 4.8,
    "page": 1,
    "limit": 5,
    "totalPages": 43
  },
  "related": {
    "items": [
      { "id": 3, "slug": "en-attendant-le-vote", "title": "En attendant le vote des bêtes sauvages", "author": "Ahmadou Kourouma", "price": 3100, "category": "Roman", "rating": 4.7, "reviews": 156, "cover": "https://images.unsplash.com/photo-ghi" },
      { "id": 4, "slug": "allah-n-est-pas-obligé", "title": "Allah n'est pas obligé", "author": "Ahmadou Kourouma", "price": 2900, "category": "Roman", "rating": 4.9, "reviews": 342, "cover": "https://images.unsplash.com/photo-jkl" }
    ]
  }
}
```

### 5.4 Avis — Page 2

**Requête**
```http
GET /api/v1/books/soleil-des-independances/reviews?page=2&limit=5&sort_by=recent
```

**Réponse**
```json
{
  "items": [
    {
      "id": "rev_007",
      "author_name": "Kadiatou Barry",
      "rating": 5,
      "comment": "Relu trois fois, chaque fois une nouvelle découverte.",
      "created_at": "2024-01-10T11:00:00Z",
      "verified_purchase": true
    }
  ],
  "total": 215,
  "page": 2,
  "limit": 5,
  "avg_rating": 4.8
}
```

### 5.5 Créer un avis — Requête & réponse

**Requête**
```http
POST /api/v1/books/soleil-des-independances/reviews
Content-Type: application/json
Cookie: session_id=abc123; HttpOnly; Secure; SameSite=Lax

{
  "rating": 5,
  "comment": "Un monument de la littérature. Kourouma réinvente le français."
}
```

**Réponse (201)**
```json
{
  "review": {
    "id": "rev_216",
    "author_name": "Utilisateur Connecté",
    "rating": 5,
    "comment": "Un monument de la littérature. Kourouma réinvente le français.",
    "created_at": "2024-02-15T09:45:00Z",
    "verified_purchase": false
  }
}
```

---

## 6. Checklist de validation backend

| Fonctionnalité | Endpoint | Statut attendu |
|----------------|----------|----------------|
| Liste paginée avec filtres | `GET /books` | ✅ |
| Facettes catégories + langues | `GET /books` (dans réponse) | ✅ |
| Recherche full-text | `GET /books?search=` | ✅ |
| Filtre multi-catégories | `GET /books?category=Roman,Poésie` | ✅ |
| Filtre prix min/max | `GET /books?min_price=1000&max_price=5000` | ✅ |
| Filtre note minimale | `GET /books?rating=4` | ✅ |
| Filtre langue | `GET /books?language=fr` | ✅ |
| Tri (5 critères × 2 ordres) | `GET /books?sort_by=xxx&sort_order=xxx` | ✅ |
| Fiche livre complète | `GET /books/{slug}` | ✅ |
| Chapitres inclus | `GET /books/{slug}` → `book.chapters` | ✅ |
| Avis paginés | `GET /books/{slug}/reviews` | ✅ |
| Note moyenne + total avis | `GET /books/{slug}/reviews` → `avg_rating`, `total` | ✅ |
| Livres liés | `GET /books/{slug}/related` | ✅ |
| Créer avis (auth) | `POST /books/{slug}/reviews` | ✅ |
| Erreurs structurées + `message` | Tous | ✅ |
| Cookies HttpOnly + `credentials: include` | Tous | ✅ |

---

## 7. Évolutions futures (non bloquantes)

- **Filtre date de publication** : paramètre `published_date` (`last-30-days`, `last-6-months`, `last-year`) — UI déjà prête
- **Recherche par auteur** : `author_slug` ou `author_id` en paramètre
- **Facettes étendues** : tags, fourchettes de prix, années
- **Curseur de prix** : `min_price`/`max_price` déjà supportés, frontend utilise des inputs numériques
- **Recommandations personnalisées** : endpoint dédié `/books/recommended` (remplacerait l’appel catalogue générique dans le dashboard)

---

*Document généré à partir de l’analyse du code frontend (Next.js 14, App Router, TypeScript). Dernière mise à jour : 2026-10-01.*
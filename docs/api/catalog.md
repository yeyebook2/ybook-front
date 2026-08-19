# API Catalogue

## Périmètre

Le frontend consomme le catalogue public avec `GET /api/v1/books`. Le contrat source définit les paramètres `page`, `limit`, `category`, `min_price`, `max_price`, `rating`, `sort_by`, `sort_order`, `search` et `language`, ainsi qu’une réponse paginée `{ items, total, page, limit, total_pages }`.

Les filtres de date et les facettes sont supportés par le modèle frontend. La date de publication peut être utilisée immédiatement en mode preview ; son nom de paramètre serveur doit être confirmé avant d’être envoyé en production, car il n’est pas explicitement défini dans le contrat source.

## Endpoint principal

```http
GET /api/v1/books
```

Exemple construit par `catalog.api.ts` :

```http
GET /api/v1/books?page=1&limit=8&category=Roman%2CHistoire&min_price=1500&max_price=3500&rating=4&sort_by=price&sort_order=asc&search=lettre&language=fr
```

| Filtre frontend | Paramètre API | Règle |
|---|---|---|
| Recherche | `search` | Chaîne saisie, supprimée si vide. |
| Catégories | `category` | Valeurs jointes par virgule pour plusieurs sélections ; encodage à confirmer côté backend. |
| Prix minimum | `min_price` | Valeur numérique FCFA. |
| Prix maximum | `max_price` | Valeur numérique FCFA. |
| Note minimale | `rating` | Valeur `3`, `4` ou `5` lorsque le filtre est actif. |
| Langue | `language` | Code de langue, par exemple `fr`. |
| Tri | `sort_by`, `sort_order` | Pertinence, popularité, note, date ou prix selon le mapping frontend. |
| Pagination | `page`, `limit` | Pagination numérotée, `limit` fixé à 8 dans l’interface actuelle. |

## Réponse attendue

```json
{
  "items": [
    {
      "id": 42,
      "slug": "une-si-longue-lettre",
      "title": "Une si longue lettre",
      "author": "Mariama Bâ",
      "price": 2500,
      "category": "Roman",
      "rating": 4.9,
      "reviews": 623,
      "pages": 165,
      "year": 1979,
      "cover_url": "https://cdn.example.com/books/une-si-longue-lettre.webp",
      "description": "…",
      "language": "fr",
      "published_at": "2026-06-08T00:00:00Z",
      "published": true
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 8,
  "total_pages": 1,
  "facets": {
    "categories": [{ "value": "Roman", "label": "Roman", "count": 1 }],
    "languages": [{ "value": "fr", "label": "Français", "count": 1 }]
  }
}
```

Le frontend tolère les variantes `items` ou `books`, `cover` ou `cover_url`, `price` ou `price_fcfa`, `rating` ou `average_rating`, `reviews` ou `reviews_count`, ainsi que les formes d’auteur et de catégorie sous forme de chaîne ou d’objet. `mapBackendBook` convertit ensuite la réponse vers le type interne `CatalogBook`.

## Endpoints associés

Les endpoints suivants sont prévus par le cahier des charges et pourront être branchés par les prochaines features :

```http
GET /api/v1/books/{slug}
GET /api/v1/books/{slug}/related?limit=4
GET /api/v1/books/search?q=...
GET /api/v1/categories
GET /api/v1/categories/{slug}
GET /api/v1/categories/{slug}/books?page=1&limit=8&sort_by=popularity
```

La page Catalogue actuelle utilise uniquement `GET /api/v1/books`. La fiche livre et les catégories possèdent donc leurs propres services à créer lorsqu’elles seront connectées au backend, afin de ne pas transformer le service catalogue en module monolithique.

## Mode preview et erreurs

En l’absence de `VITE_API_BASE_URL`, aucun appel réseau n’est réalisé. Le service applique les mêmes filtres et tris sur `PREVIEW_BOOKS`, calcule les compteurs de facettes et renvoie une réponse paginée équivalente.

En production, les requêtes utilisent `credentials: "include"`. Une réponse HTTP non réussie est convertie en erreur lisible pour `CatalogErrorState`. Le backend devra idéalement renvoyer un champ `message` pour les erreurs fonctionnelles ; à défaut, le frontend affiche un message générique.

## Points à confirmer avec le backend

| Point | Décision nécessaire |
|---|---|
| Catégories multiples | Confirmer si `category=Roman,Histoire` est accepté ou s’il faut répéter le paramètre. |
| Date de publication | Confirmer le nom du paramètre et les valeurs attendues côté API. |
| Facettes | Confirmer si elles sont renvoyées par `/books` et si elles sont calculées après chaque filtre. |
| Pagination | Confirmer si la pagination numérotée est retenue ou si l’API doit évoluer vers un curseur. |

## Contrat frontend

```ts
export type CatalogResponse = {
  items: CatalogBook[]
  total: number
  page: number
  limit: number
  totalPages: number
  facets?: CatalogFacets
}
```

Le contrat interne utilise `totalPages` en camelCase, tandis que l’adaptateur accepte `total_pages` côté backend. Cette séparation évite de propager les conventions de sérialisation API dans les composants React.

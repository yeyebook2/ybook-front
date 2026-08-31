# API Catalogue

## Endpoint

```http
GET /api/v1/books
```

La configuration `NEXT_PUBLIC_API_BASE_URL` est obligatoire. Le catalogue ne possède plus de source locale de données.

## Paramètres

```text
page
limit
search
category
min_price
max_price
rating
language
sort_by
sort_order
```

Les tris utilisés sont `relevance`, `popularity`, `rating`, `published_at` et `price`. Le filtre de date existe dans l’interface, mais son paramètre serveur doit encore être confirmé.

## Réponse attendue

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 8,
  "total_pages": 1,
  "facets": {
    "categories": [],
    "languages": []
  }
}
```

L’adaptateur accepte également `books`, `cover` ou `cover_url`, `price` ou `price_fcfa`, `rating` ou `average_rating`, et `reviews` ou `reviews_count`.

## Erreurs

En cas d’échec, `useCatalog` vide les résultats, affiche l’état d’erreur avec `Réessayer` et transmet le message au toast global. Aucune liste de livres n’est fabriquée localement.
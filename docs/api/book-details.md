# API Fiche livre

## Endpoints

```http
GET  /api/v1/books/{slug}
GET  /api/v1/books/{slug}/related?limit=4
GET  /api/v1/books/{slug}/reviews?page=1&limit=5&sort_by=recent
POST /api/v1/books/{slug}/reviews
```

`NEXT_PUBLIC_API_BASE_URL` est obligatoire. Aucune fiche, aucun avis et aucun titre associé ne sont générés localement.

## Détail

La réponse peut fournir `{ book }` ou `{ items: [book] }`. Le livre est normalisé par `mapBackendBook`. Les métadonnées supplémentaires acceptées sont `subtitle`, `isbn`, `format`, `tags`, `author_slug` et `chapters`.

La réponse détail peut embarquer `reviews` et `related`. Lorsqu’ils sont absents, le frontend appelle leurs routes dédiées.

## Avis

La liste attend :

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 5,
  "avg_rating": 0
}
```

La création envoie :

```json
{
  "rating": 5,
  "comment": "Excellent livre."
}
```

## Erreurs

Un statut HTTP invalide, une configuration API absente ou une réponse sans livre déclenche l’état d’erreur de la fiche. Le frontend ne remplace jamais l’échec par une fiche ou un avis fictif.
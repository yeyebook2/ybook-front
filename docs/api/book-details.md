# API Fiche livre

## Endpoints cible

```http
GET  /api/v1/books/{slug}
GET  /api/v1/books/{slug}/related?limit=4
GET  /api/v1/books/{slug}/reviews?page=1&limit=5&sort_by=recent
POST /api/v1/books/{slug}/reviews
```

La réponse détaillée doit fournir au minimum le livre normalisé ou une enveloppe `{ book }`. Le frontend tolère également une liste `items` dont le premier élément représente le livre. Les champs livre sont adaptés par `mapBackendBook` puis complétés par les métadonnées de détail : `subtitle`, `isbn`, `format`, `tags`, `author_slug` et les chapitres lorsque le backend les fournit.

La réponse avis attendue est de la forme `{ items, total, page, limit, avg_rating }`. Chaque avis peut utiliser `author_name`, `author.name`, `rating`, `comment`, `created_at` et `verified_purchase`. Le formulaire de création envoie `{ rating, comment }` et nécessite une session authentifiée en production.

La réponse titres associés peut utiliser `{ items }` ou `{ books }` dans l’enveloppe catalogue. Si l’enveloppe de `GET /api/v1/books/{slug}` ne contient pas déjà `related`, le service appelle explicitement `GET /api/v1/books/{slug}/related?limit=4`. Les livres associés sont normalisés vers `CatalogBook` et réutilisent le composant `BookCard` du catalogue.

## Service frontend

`src/features/book-details/book-details.api.ts` sépare explicitement les deux modes. Sans `NEXT_PUBLIC_API_BASE_URL`, `PREVIEW_BOOKS` fournit le livre, les chapitres, les avis de démonstration et les titres de même catégorie. Avec la variable d’environnement, les requêtes utilisent `/api/v1`, `credentials: "include"` et une erreur lisible en cas de réponse HTTP non valide.

Le hook `useBookDetail` gère le chargement, l’erreur, le rechargement et l’ajout optimiste local d’un avis après le retour du service. La page ne possède pas de logique réseau directe. La page expose en outre un JSON-LD `Book` pour les métadonnées SEO, sans persister de données inventées.

## Points à confirmer côté backend

L’enveloppe exacte de la réponse détail, la forme des chapitres, le nom du champ de moyenne des avis, la pagination des avis, les règles de publication et l’autorisation de publier un avis doivent être confirmés avant l’activation production. Les endpoints wishlist, achat immédiat et commande restent délégués à leurs futures features dédiées ; la fiche ne fabrique aucun contrat de paiement.

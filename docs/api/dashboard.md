# API du dashboard YéYéBook

## Principe de composition

Le cahier des charges ne définit pas de route unique `GET /dashboard`. Le frontend compose donc la page principale à partir des endpoints officiels suivants :

```http
GET /api/v1/library?page=1&limit=12&sort_by=recent
GET /api/v1/library/{book_id}/progress
GET /api/v1/books?page=1&limit=6&sort_order=desc&sort_by=created_at
```

Toutes ces requêtes sont privées lorsqu’elles concernent la bibliothèque ou la progression. Le frontend envoie les cookies de session avec `credentials: include`.

## Contrat de rendu interne

Le service `src/features/dashboard/dashboard.api.ts` adapte les réponses backend au contrat utilisé par les composants :

```ts
type DashboardResponse = {
  user: {
    id: string
    name: string
    email: string
    role?: "user" | "author" | "moderator" | "admin" | "super_admin"
  }
  summary: {
    booksInLibrary: number
    readingNow: number
    completedBooks: number
  }
  continueReading: DashboardBook[]
  recommendations: DashboardBook[]
}
```

La liste `continueReading` est calculée à partir des livres de la bibliothèque et de leurs pourcentages de progression. Les recommandations sont actuellement constituées à partir du catalogue public, car le cahier des charges ne définit pas encore de route de recommandation dédiée.

## Réponses backend utilisées

La bibliothèque attend `{ items: [LibraryItem], total }`. La progression accepte la forme `{ progress }` ou `{ progress_percent }` côté adaptateur afin de rester tolérante pendant la stabilisation du backend. Le catalogue attend `{ items: [Book], total, page, limit, total_pages }`.

## Erreurs attendues

| Statut | Signification | Comportement frontend |
|---|---|---|
| `401` | Session absente ou expirée | La garde redirige vers la connexion. |
| `403` | Accès à la ressource refusé | Afficher l’état d’erreur sans exposer de données. |
| `404` | Livre ou progression introuvable | Conserver la carte sans progression ou retirer la ressource selon le contexte. |
| `429` | Trop de requêtes | Afficher une invitation à réessayer plus tard. |
| `5xx` | Erreur temporaire du service | Afficher l’état d’erreur et proposer Réessayer. |

## Mode preview

Si `VITE_API_BASE_URL` n’est pas défini, le service renvoie un jeu de données preview pour permettre la vérification du rendu. Ce jeu n’est jamais utilisé comme source de vérité en production.

## Points à confirmer avec le backend

Le backend devra confirmer le nom du champ de progression, le tri `recent` de la bibliothèque, le champ de couverture, la forme exacte de `LibraryItem` et l’existence future d’un endpoint de recommandations. Les URLs de lecture et de téléchargement ne doivent pas être déduites du dashboard : elles devront venir des endpoints sécurisés de bibliothèque prévus par le cahier des charges.

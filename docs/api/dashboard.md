# API du dashboard YéYéBook

## Endpoint

```http
GET /dashboard
```

La requête doit être authentifiée par la session utilisateur. Le frontend envoie les cookies de session avec `credentials: include`.

## Réponse attendue

```ts
type DashboardResponse = {
  user: {
    id: string
    name: string
    email: string
  }
  summary: {
    booksInLibrary: number
    readingNow: number
    completedBooks: number
  }
  continueReading: Array<{
    id: number
    title: string
    author: string
    category: string
    cover: string
    progress?: number
    isNew?: boolean
  }>
  recommendations: Array<{
    id: number
    title: string
    author: string
    category: string
    cover: string
    progress?: number
    isNew?: boolean
  }>
}
```

## Erreurs attendues

| Statut | Signification | Comportement frontend |
|---|---|---|
| `401` | Session absente ou expirée | Rediriger vers `/login` ou la vue connexion. |
| `403` | Compte non autorisé | Afficher un message d’accès refusé. |
| `429` | Trop de requêtes | Afficher une invitation à réessayer plus tard. |
| `5xx` | Erreur temporaire du service | Afficher l’état d’erreur et proposer Réessayer. |

## Implémentation frontend

Le service est situé dans `src/features/dashboard/dashboard.api.ts`. Si `VITE_API_BASE_URL` n’est pas défini, le service renvoie un jeu de données preview afin de permettre la vérification du rendu sans backend. Dès que cette variable est définie, le frontend appelle réellement `${VITE_API_BASE_URL}/dashboard`.

Le jeu preview est strictement limité à l’environnement de démonstration. Il ne doit pas être utilisé comme source de vérité en production.

## Règles backend à confirmer

Le backend devra définir si les recommandations sont calculées à partir des achats, de la progression de lecture, des catégories suivies ou d’un moteur de recommandation. Il devra également préciser si `cover` est une URL CDN publique ou une URL signée temporaire et fournir des valeurs de progression bornées entre `0` et `100`.

# API du dashboard YéYéBook

## Endpoints utilisés

```http
GET /api/v1/library?page=1&limit=12&sort_by=recent
GET /api/v1/library/{book_id}/progress
GET /api/v1/books?page=1&limit=6&sort_order=desc&sort_by=created_at
```

Le dashboard est réservé à une session authentifiée et utilise `credentials: "include"`.

## Réponse interne composée

```ts
type DashboardResponse = {
  user: AuthUser
  summary: {
    booksInLibrary: number
    readingNow: number
    completedBooks: number
  }
  continueReading: DashboardBook[]
  recommendations: DashboardBook[]
}
```

Le résumé est calculé à partir de la bibliothèque et des progressions. Les recommandations utilisent le catalogue tant qu’une route personnalisée n’est pas définie.

## Absence de fallback

Le dashboard ne contient plus de livres, statistiques ou recommandations de démonstration. Si l’API est absente ou inaccessible, la page affiche son état d’erreur et un toast avec le message reçu.
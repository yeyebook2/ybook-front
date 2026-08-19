# Page principale authentifiée — Dashboard YéYéBook

## Rôle de la page

Le dashboard est l’espace principal d’un lecteur connecté. Il ne remplace pas l’accueil public : il propose une vue personnalisée de la bibliothèque, des lectures en cours et des recommandations fournies par l’API.

La page est accessible dans le routeur local avec la vue `dashboard`. Elle est protégée par `AuthGuard`. Si aucune session n’est confirmée, l’utilisateur est redirigé vers la page de connexion.

## Composition modulaire

```text
src/features/dashboard/
├── dashboard.api.ts
├── types.ts
├── components/
│   ├── ContinueReadingCard.tsx
│   ├── DashboardHeader.tsx
│   ├── RecommendationCard.tsx
│   └── SummaryCard.tsx
└── pages/
    └── DashboardPage.tsx
```

`DashboardPage.tsx` assemble les composants et orchestre le chargement du dashboard. `DashboardHeader.tsx` contient la navigation privée et l’action de déconnexion. Les cartes sont isolées afin de pouvoir être réutilisées dans la bibliothèque ou une future page d’accueil personnalisée.

## États d’interface

| État | Comportement |
|---|---|
| Vérification de session | `AuthGuard` affiche un état d’attente avant de rendre le contenu privé. |
| Chargement API | Les cartes statistiques affichent des placeholders animés. |
| Erreur API | Un bloc d’erreur accessible propose une action Réessayer. |
| Données disponibles | Le dashboard affiche l’accueil personnalisé, les statistiques et les livres. |
| Bibliothèque vide | Un état vide indique où apparaîtra la prochaine lecture. |

## Données consommées

La page reçoit un utilisateur authentifié depuis le parent et charge le reste de ses données via `getDashboard(user)`. Les actions de navigation vers le catalogue, la bibliothèque, une fiche livre et le panier restent injectées par le parent afin de ne pas coupler la feature dashboard au routeur global du prototype.

## Accès et sécurité

La garde frontend améliore l’expérience utilisateur, mais elle ne remplace pas l’autorisation backend. L’API devra vérifier la session sur chaque requête privée. En production, l’identité devra provenir de la session sécurisée définie par le backend et non d’une donnée contrôlée uniquement par le navigateur.

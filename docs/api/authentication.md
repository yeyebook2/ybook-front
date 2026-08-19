# API d’authentification YéYéBook

## Endpoints officiels

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/verify-email
GET  /api/v1/auth/me
PUT  /api/v1/auth/me
```

Le frontend implémente actuellement `register`, `login`, `forgotPassword`, `getCurrentUser` et `logout`. Les fonctions refresh, reset-password, verify-email et mise à jour du profil restent documentées comme extensions à brancher dans les prochaines pages.

Les requêtes utilisent `credentials: include`. Le cahier des charges mentionne également des access et refresh tokens en cookies HttpOnly, Secure et SameSite. Le backend devra confirmer le choix final entre cookies de session et en-tête Bearer, car le document mentionne les deux conventions selon les sections.

## Contrats de requête

```ts
type LoginRequest = {
  email: string
  password: string
}

type RegisterRequest = {
  email: string
  password: string
  first_name: string
  last_name: string
  phone: string
  consents: {
    terms: boolean
    privacy: boolean
    marketing: boolean
  }
}
```

Le formulaire frontend collecte les deux consentements obligatoires et le consentement marketing facultatif. Les champs `first_name`, `last_name`, `phone` respectent le contrat décrit dans le cahier des charges.

## Contrat de réponse adapté

Le backend du cahier des charges renvoie `{ user, access_token, refresh_token }`. Le frontend normalise uniquement l’identité dans la forme suivante et ne stocke aucun token côté JavaScript :

```ts
type AuthUser = {
  id: string
  name: string
  email: string
  role?: "user" | "author" | "moderator" | "admin" | "super_admin"
}
```

En preview, la réponse contient `mode: "preview"` et un utilisateur de démonstration. En production, les tokens doivent rester gérés par le mécanisme sécurisé décidé côté backend.

## Erreurs attendues

| Statut | Code métier possible | Utilisation |
|---|---|---|
| `401` | `INVALID_CREDENTIALS` | Identifiants invalides sur la connexion. |
| `409` | `EMAIL_ALREADY_USED` | Adresse déjà associée à un compte. |
| `422` | `VALIDATION_ERROR` | Données ou consentements invalides. |
| `429` | `AUTH_RATE_LIMITED` | Trop de tentatives d’authentification. |

Les réponses d’erreur devront idéalement suivre une structure normalisée avec `code`, `message`, `fieldErrors` et `requestId` afin que les formulaires puissent afficher les erreurs serveur au bon endroit.

## Implémentation frontend

Le service est situé dans `src/features/auth/auth.api.ts`. Lorsque `VITE_API_BASE_URL` est absente, les opérations login et register utilisent le mode preview et enregistrent uniquement un utilisateur de démonstration dans `sessionStorage`. Aucun mot de passe ni token n’y est stocké.

Lorsque `VITE_API_BASE_URL` est présente, le service appelle les routes officielles sous `/api/v1`, transmet le payload conforme et appelle `GET /api/v1/auth/me` au démarrage pour restaurer l’accès au dashboard. `logout()` appelle `POST /api/v1/auth/logout`.

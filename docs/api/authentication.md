# API d’authentification YéYéBook

## Endpoints

```http
POST /auth/login
POST /auth/register
GET  /auth/me
POST /auth/logout
```

Toutes les requêtes utilisent `credentials: include`. Le backend devra créer et invalider une session sécurisée, idéalement via un cookie `HttpOnly`, `Secure` et `SameSite` adapté à l’architecture de déploiement.

## Contrats de requête

```ts
type LoginRequest = {
  email: string
  password: string
}

type RegisterRequest = {
  name: string
  email: string
  password: string
}
```

## Contrat de réponse

```ts
type AuthApiResponse = {
  ok: boolean
  mode: "preview" | "api"
  message: string
  user?: {
    id: string
    name: string
    email: string
  }
}
```

En production, le champ `mode` pourra être supprimé ou fixé par le backend. Le frontend utilise `user` pour ouvrir le dashboard après une authentification réussie.

## Erreurs attendues

| Statut | Code métier possible | Utilisation |
|---|---|---|
| `401` | `INVALID_CREDENTIALS` | Identifiants invalides sur la connexion. |
| `409` | `EMAIL_ALREADY_USED` | Adresse déjà associée à un compte. |
| `422` | `VALIDATION_ERROR` | Données invalides ou mot de passe non conforme. |
| `429` | `AUTH_RATE_LIMITED` | Trop de tentatives d’authentification. |

Les réponses d’erreur devront idéalement suivre une structure normalisée avec `code`, `message`, `fieldErrors` et `requestId` afin que les formulaires puissent afficher les erreurs serveur au bon endroit.

## Implémentation frontend

Le service est situé dans `src/features/auth/auth.api.ts`. Lorsque `VITE_API_BASE_URL` est absente, les opérations login et register utilisent le mode preview et enregistrent uniquement un utilisateur de démonstration dans `sessionStorage`. Aucun mot de passe ni token n’y est stocké.

Lorsque `VITE_API_BASE_URL` est présente, le service appelle les endpoints réels. `getCurrentUser()` appelle `/auth/me` au démarrage de l’application pour restaurer l’accès au dashboard. `logout()` appelle `/auth/logout` puis efface la session preview si nécessaire.

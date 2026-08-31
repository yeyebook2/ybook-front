# API d’authentification YéYéBook

## Configuration obligatoire

Le service utilise `NEXT_PUBLIC_API_BASE_URL` et ajoute le préfixe `/api/v1`. Sans cette variable, les opérations échouent avec un message explicite. Aucun utilisateur ou jeton de démonstration n’est créé.

## Endpoints consommés

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
GET  /api/v1/auth/me
```

Les requêtes utilisent `credentials: "include"`. La session doit être gérée par le backend, de préférence avec des cookies `HttpOnly`, `Secure` et une politique `SameSite` adaptée au déploiement.

## Connexion

```json
{
  "email": "aminata@example.com",
  "password": "mot-de-passe"
}
```

## Inscription

```json
{
  "email": "aminata@example.com",
  "password": "mot-de-passe",
  "first_name": "Aminata",
  "last_name": "Diallo",
  "phone": "+22890000000",
  "consents": {
    "terms": true,
    "privacy": true,
    "marketing": false
  }
}
```

`confirmPassword` est validé par le frontend, mais n’est pas envoyé.

## Réponse attendue

```json
{
  "success": true,
  "message": "Connexion réussie.",
  "user": {
    "id": "usr_123",
    "first_name": "Aminata",
    "last_name": "Diallo",
    "name": "Aminata Diallo",
    "email": "aminata@example.com",
    "role": "user"
  }
}
```

Rôles reconnus : `user`, `author`, `moderator`, `admin`, `super_admin`.

## Erreurs

L’API doit renvoyer un message exploitable. Codes métier recommandés : `INVALID_CREDENTIALS`, `EMAIL_ALREADY_USED`, `PHONE_ALREADY_USED`, `VALIDATION_ERROR`, `AUTH_RATE_LIMITED` et `UNAUTHENTICATED`.

Le frontend affiche les erreurs par toast et ne crée aucune session locale de remplacement.
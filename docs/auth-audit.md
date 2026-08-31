# Authentification YéYéBook

## État actuel

L’authentification fonctionne exclusivement avec l’API. Il n’existe plus de session preview, d’utilisateur de démonstration ni de stockage d’identité dans `sessionStorage`.

Les composants sont séparés entre pages, formulaires, champs, validation, services et gardes d’accès. Après une connexion ou une inscription réussie, l’utilisateur est redirigé vers la page d’accueil `/` et le header passe à l’état connecté.

## Routes consommées

```http
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/forgot-password
GET  /api/v1/auth/me
POST /api/v1/auth/logout
```

Toutes les requêtes utilisent `credentials: "include"`. La session doit donc être créée et restaurée par le backend au moyen de cookies sécurisés.

## Comportement en cas d’échec

- Une erreur de connexion ou d’inscription est affichée par toast.
- Une réponse sans utilisateur n’est pas considérée comme une authentification réussie.
- Une erreur pendant la restauration de session laisse l’utilisateur déconnecté et affiche un toast.
- L’absence de `NEXT_PUBLIC_API_BASE_URL` produit une erreur explicite ; aucun utilisateur local n’est créé.
- La garde frontend ne remplace jamais les contrôles d’autorisation du backend.

## Validation locale

Le frontend vérifie les champs obligatoires, le format de l’e-mail et du téléphone, la longueur et la confirmation du mot de passe ainsi que les consentements obligatoires. Ces contrôles améliorent l’UX mais le backend doit répéter toutes les validations.

## Vérifications

```bash
pnpm typecheck
pnpm build
```
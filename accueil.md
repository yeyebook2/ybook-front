# Charte API — page d’accueil YéYéBook

## 1. Objet du document

Ce document définit uniquement les routes HTTP nécessaires au fonctionnement de la page d’accueil publique de YéYéBook, affichée sur `/` avant et après authentification.

Après une connexion ou une inscription réussie, le frontend redirige l’utilisateur vers `/`. La page conserve le même contenu éditorial public, mais adapte les actions du header lorsque la session est active : le bouton `Mon espace` remplace les boutons de connexion et d’inscription.

Ce document est destiné au développeur API. Les routes du dashboard, du panier, du checkout, de la bibliothèque, du lecteur et du back-office ne font pas partie de ce périmètre.

---

## 2. Conventions générales

### URL de base

```text
{API_BASE_URL}/api/v1
```

Le frontend reçoit `API_BASE_URL` dans la variable publique suivante :

```text
NEXT_PUBLIC_API_BASE_URL
```

Exemple :

```text
NEXT_PUBLIC_API_BASE_URL=https://api.yeyebook.com
```

### Format

- Requêtes et réponses : `application/json`, sauf les requêtes GET sans corps.
- Noms des champs JSON de l’API : `snake_case`.
- Encodage : UTF-8.
- Prix : nombres entiers en FCFA, sans symbole dans le JSON.
- Dates : ISO 8601.
- Authentification : cookies sécurisés envoyés avec `credentials: include`.
- Le frontend ne doit pas conserver l’access token ou le refresh token dans `localStorage`.

### Enveloppe d’erreur recommandée

Toutes les routes doivent utiliser une erreur homogène :

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Les données envoyées sont invalides.",
  "field_errors": {
    "email": "Cette adresse e-mail est invalide."
  },
  "request_id": "req_01JABCDEF123456"
}
```

`field_errors` est facultatif. `request_id` doit permettre de retrouver l’erreur dans les journaux serveur.

---

## 3. Routes strictement nécessaires

| Méthode | Route | Authentification | Rôle sur l’accueil |
|---|---|---:|---|
| `GET` | `/api/v1/auth/me` | Cookie facultatif | Restaurer la session et adapter le header |
| `POST` | `/api/v1/auth/login` | Non | Connecter l’utilisateur avant le retour à `/` |
| `POST` | `/api/v1/auth/register` | Non | Créer le compte avant le retour à `/` |
| `POST` | `/api/v1/auth/logout` | Cookie requis | Fermer la session depuis les zones authentifiées |
| `GET` | `/api/v1/books` | Non | Alimenter les nouveautés, meilleures ventes, livre à la une, recherche et catégories |

### Route optionnelle liée au formulaire existant

| Méthode | Route | Authentification | Rôle |
|---|---|---:|---|
| `POST` | `/api/v1/auth/forgot-password` | Non | Traiter « Mot de passe oublié ? » sur la page de connexion |

Aucune route distincte n’est exigée pour les nouveautés, les meilleures ventes ou les catégories si `GET /books` accepte les tris et renvoie les facettes définies ci-dessous.

---

# 4. Authentification

## 4.1 Restaurer la session

```http
GET /api/v1/auth/me
```

Cette requête est effectuée au démarrage de l’application. Elle ne contient aucun payload.

### Réponse attendue — session active

```json
{
  "success": true,
  "user": {
    "id": "usr_01JABCDEF123456",
    "first_name": "Aminata",
    "last_name": "Diallo",
    "name": "Aminata Diallo",
    "email": "aminata@example.com",
    "role": "user"
  }
}
```

### Réponse attendue — aucune session

Statut HTTP : `401 Unauthorized`

```json
{
  "success": false,
  "code": "UNAUTHENTICATED",
  "message": "Aucune session active.",
  "request_id": "req_01JABCDEF123456"
}
```

Le frontend considère un `401` comme une absence normale de session sur la page d’accueil et affiche les boutons `Se connecter` et `Créer un compte`.

### Valeurs autorisées pour `role`

```text
user | author | moderator | admin | super_admin
```

---

## 4.2 Connexion

```http
POST /api/v1/auth/login
```

### Payload envoyé par le frontend

```json
{
  "email": "aminata@example.com",
  "password": "mot-de-passe"
}
```

### Réponse attendue

Statut HTTP : `200 OK`

```json
{
  "success": true,
  "message": "Connexion réussie.",
  "user": {
    "id": "usr_01JABCDEF123456",
    "first_name": "Aminata",
    "last_name": "Diallo",
    "name": "Aminata Diallo",
    "email": "aminata@example.com",
    "role": "user"
  }
}
```

Le backend doit créer la session sécurisée avant d’envoyer la réponse. Après succès, le frontend redirige vers `/`.

### Erreurs attendues

- `401 INVALID_CREDENTIALS` : e-mail ou mot de passe incorrect.
- `403 ACCOUNT_DISABLED` : compte désactivé.
- `422 VALIDATION_ERROR` : payload invalide.
- `429 AUTH_RATE_LIMITED` : trop de tentatives.

---

## 4.3 Inscription

```http
POST /api/v1/auth/register
```

### Payload envoyé par le frontend

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

Le frontend valide également la confirmation du mot de passe, mais n’envoie pas `confirm_password` à l’API.

### Réponse attendue avec connexion immédiate

Statut HTTP : `201 Created`

```json
{
  "success": true,
  "message": "Compte créé avec succès.",
  "user": {
    "id": "usr_01JABCDEF123456",
    "first_name": "Aminata",
    "last_name": "Diallo",
    "name": "Aminata Diallo",
    "email": "aminata@example.com",
    "role": "user"
  }
}
```

Le contrat actuel suppose que l’inscription crée également une session. Après succès, le frontend redirige vers `/`.

Si une vérification d’e-mail ou un OTP doit être obligatoire avant la création de session, le contrat devra être modifié avec le frontend avant l’implémentation.

### Erreurs attendues

- `409 EMAIL_ALREADY_USED` : adresse déjà inscrite.
- `409 PHONE_ALREADY_USED` : téléphone déjà inscrit.
- `422 VALIDATION_ERROR` : données ou consentements invalides.
- `429 AUTH_RATE_LIMITED` : trop de tentatives.

---

## 4.4 Déconnexion

```http
POST /api/v1/auth/logout
```

Aucun payload n’est envoyé.

### Réponse attendue

Statut HTTP : `200 OK` ou `204 No Content`.

Avec un corps JSON :

```json
{
  "success": true,
  "message": "Déconnexion réussie."
}
```

Le backend doit invalider la session et supprimer les cookies concernés.

---

## 4.5 Mot de passe oublié — optionnel pour l’accueil

```http
POST /api/v1/auth/forgot-password
```

### Payload

```json
{
  "email": "aminata@example.com"
}
```

### Réponse attendue

```json
{
  "success": true,
  "message": "Si ce compte existe, un e-mail de récupération a été envoyé."
}
```

La réponse ne doit pas révéler si l’adresse existe.

---

# 5. Catalogue nécessaire à la page d’accueil

## 5.1 Route canonique

```http
GET /api/v1/books
```

La même route doit permettre d’alimenter toutes les sections de l’accueil.

### Paramètres acceptés

| Paramètre | Type | Exemple | Utilisation |
|---|---|---|---|
| `page` | entier >= 1 | `1` | Pagination |
| `limit` | entier | `8` | Nombre de livres |
| `search` | chaîne | `lettre` | Recherche par titre ou auteur |
| `category` | chaîne | `Roman` | Sélection d’une catégorie |
| `sort_by` | enum | `created_at` | Critère de tri |
| `sort_order` | `asc` ou `desc` | `desc` | Sens du tri |
| `published` | booléen | `true` | Ne renvoyer que les livres publiés |

Valeurs minimales attendues pour `sort_by` :

```text
created_at | popularity | rating | price | relevance
```

### Chargements effectués pour l’accueil

#### Nouveautés

```http
GET /api/v1/books?page=1&limit=4&published=true&sort_by=created_at&sort_order=desc
```

#### Meilleures ventes

```http
GET /api/v1/books?page=1&limit=10&published=true&sort_by=popularity&sort_order=desc
```

#### Recherche depuis le header

```http
GET /api/v1/books?page=1&limit=8&published=true&search=lettre&sort_by=relevance&sort_order=desc
```

La recherche peut afficher ses résultats dans le catalogue après navigation. Elle reste néanmoins alimentée par la même route.

### Réponse attendue

```json
{
  "items": [
    {
      "id": 42,
      "slug": "une-si-longue-lettre",
      "title": "Une si longue lettre",
      "author": {
        "id": "aut_123",
        "name": "Mariama Bâ",
        "slug": "mariama-ba"
      },
      "category": {
        "id": "cat_roman",
        "name": "Roman",
        "slug": "roman"
      },
      "price_fcfa": 2500,
      "cover_url": "https://cdn.yeyebook.com/books/une-si-longue-lettre.webp",
      "average_rating": 4.9,
      "reviews_count": 623,
      "sales_count": 1250,
      "pages": 165,
      "language": "fr",
      "published_at": "2026-08-15T09:00:00Z",
      "published": true
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 4,
  "total_pages": 30,
  "facets": {
    "categories": [
      {
        "value": "Roman",
        "slug": "roman",
        "label": "Roman",
        "count": 48
      },
      {
        "value": "Histoire",
        "slug": "histoire",
        "label": "Histoire",
        "count": 21
      }
    ]
  }
}
```

### Champs obligatoires pour une carte d’accueil

```text
id
slug
title
author.name
category.name
price_fcfa
cover_url
average_rating
reviews_count
published
```

`sales_count` est recommandé pour afficher un classement réellement basé sur les ventes. À défaut, l’ordre renvoyé par `sort_by=popularity` sera considéré comme la source de vérité.

### Livre à la une

Pour éviter une route supplémentaire, l’API peut inclure un booléen facultatif :

```json
{
  "featured": true
}
```

Le frontend pourra utiliser le premier livre marqué `featured`. Si aucun livre n’est marqué, il utilisera le premier livre publié renvoyé par la requête des nouveautés.

---

# 6. Catégories populaires

La réponse `facets.categories` de `GET /books` doit suffire pour rendre la section des catégories populaires.

Chaque entrée doit contenir :

```json
{
  "value": "Roman",
  "slug": "roman",
  "label": "Roman",
  "count": 48
}
```

Le compteur doit représenter le nombre de livres actuellement publiés dans la catégorie.

Si le backend ne peut pas fournir les facettes avec `/books`, une route séparée pourra être utilisée :

```http
GET /api/v1/categories?published_books_only=true&sort_by=popularity&limit=8
```

Réponse éventuelle :

```json
{
  "items": [
    {
      "id": "cat_roman",
      "name": "Roman",
      "slug": "roman",
      "published_books_count": 48
    }
  ]
}
```

Cette route est facultative ; la solution privilégiée reste `facets.categories` dans `/books`.

---

# 7. Comportement attendu du frontend

## Visiteur non connecté

1. Le frontend appelle `GET /auth/me`.
2. Un `401` laisse l’utilisateur sur `/` en mode visiteur.
3. Le frontend charge les nouveautés et meilleures ventes avec `GET /books`.
4. Le header affiche `Se connecter` et `Créer un compte`.

## Utilisateur connecté

1. `GET /auth/me` renvoie l’utilisateur.
2. Le frontend reste sur `/`.
3. Le header affiche `Mon espace`.
4. Les données éditoriales de l’accueil restent publiques et sont chargées par `GET /books`.

## Après connexion ou inscription

1. Le frontend reçoit une réponse contenant `user`.
2. Il met à jour la session locale d’interface.
3. Il navigue vers `/`.
4. Il affiche le message de succès.

---

# 8. Codes HTTP attendus

| Code | Signification |
|---:|---|
| `200` | Requête réussie |
| `201` | Compte créé |
| `204` | Déconnexion réussie sans contenu |
| `400` | Requête mal formée |
| `401` | Session absente ou identifiants invalides |
| `403` | Compte désactivé ou accès interdit |
| `404` | Ressource introuvable |
| `409` | E-mail ou téléphone déjà utilisé |
| `422` | Validation métier échouée |
| `429` | Limite de requêtes atteinte |
| `500` | Erreur interne |
| `503` | Service temporairement indisponible |

---

# 9. Contraintes backend

- Ne jamais renvoyer les mots de passe.
- Placer les cookies de session en `HttpOnly`, `Secure` et avec une politique `SameSite` adaptée à l’architecture retenue.
- Configurer CORS pour autoriser le domaine frontend et les credentials.
- Ne renvoyer dans `/books` que les livres publiés lorsqu’on demande `published=true`.
- Garantir l’unicité et la stabilité de `slug`.
- Les URLs de couvertures doivent être absolues, publiques et utilisables dans une balise `<img>`.
- Les tris `created_at` et `popularity` doivent être déterministes.
- Les prix doivent être des entiers positifs en FCFA.
- Le backend doit fournir des messages génériques pour la récupération de mot de passe afin d’éviter l’énumération des comptes.
- Les erreurs doivent inclure un code métier stable et, si possible, un `request_id`.

---

# 10. Hors périmètre

Les routes suivantes ne sont pas nécessaires pour livrer uniquement la page d’accueil et ne sont donc pas détaillées ici :

- détail d’un livre et avis complets ;
- panier ;
- création de commande ;
- paiement Mobile Money ;
- confirmation de paiement et webhook ;
- dashboard personnalisé ;
- bibliothèque ;
- progression et lecteur EPUB ;
- administration ;
- wishlist ;
- newsletter ;
- pages FAQ, contact et légales.

Elles devront disposer de contrats séparés au moment de leur implémentation.

---

# 11. Critères d’acceptation API

L’intégration de l’accueil sera considérée prête lorsque :

- la connexion et l’inscription créent une session puis renvoient un utilisateur exploitable ;
- `GET /auth/me` permet de restaurer cette session après actualisation ;
- un visiteur sans session reçoit clairement un `401` ;
- `/books` prend en charge nouveautés, popularité, recherche et catégories ;
- les livres non publiés ne sont jamais exposés sur l’accueil public ;
- les réponses correspondent aux champs obligatoires documentés ;
- les erreurs utilisent une structure homogène ;
- les cookies fonctionnent avec `credentials: include` ;
- l’API est testée avec les origines frontend de développement et de production.

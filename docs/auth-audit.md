# Audit global de l’authentification et du dashboard YéYéBook

**Périmètre audité :** architecture frontend, pages de connexion et d’inscription, validation locale, session preview, frontière API, garde des vues privées, contrôle des rôles administrateurs et consommation des données du dashboard.

**Référence du commit :** `8d36584` — `fix(audit): align auth contract, role guards, and dashboard API with spec`.

**Statut :** conforme pour le périmètre frontend preview et prêt à être branché sur les contrats API documentés. Les comportements qui dépendent d’un backend réel restent explicitement identifiés comme des intégrations à finaliser.

## Synthèse des contrôles

| Contrôle | Résultat | Observation |
|---|---|---|
| Build de production | Conforme | `pnpm run build` réussit avec Vite 8 après les corrections. |
| Formatage | Conforme | `pnpm exec oxfmt --check` passe sur les fichiers d’authentification, de dashboard, `src/App.tsx` et `vite.config.ts`. |
| Whitespace Git | Conforme | `git diff --check` ne signale aucune erreur avant le commit. |
| Modularité | Conforme | Shell, champs, champ mot de passe, bouton de soumission, consentements, formulaires, pages, types, API et gardes sont séparés. |
| Formulaire d’inscription | Conforme | Prénom, nom, e-mail, téléphone, mot de passe, confirmation et trois consentements sont distincts. Les consentements CGU et confidentialité sont obligatoires ; le marketing est facultatif. |
| Validation locale | Conforme | Les champs requis, l’e-mail, le téléphone au format international, la longueur du mot de passe, sa confirmation et les consentements obligatoires sont contrôlés. |
| Toast preview | Conforme | Une soumission valide affiche un succès et crée uniquement une session minimale de démonstration ; aucun mot de passe ni jeton n’est stocké. |
| Contrat d’authentification | Conforme | Les routes de production utilisent `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/forgot-password`, `/api/v1/auth/me` et `/api/v1/auth/logout`. |
| Adaptation des réponses API | Conforme | `normalizeUser` et `adaptAuthResponse` normalisent les identités et tolèrent les enveloppes de réponse documentées. |
| Session preview | Conforme preview | `sessionStorage` conserve uniquement l’utilisateur de démonstration nécessaire à la garde ; il ne représente pas une session backend réelle. |
| Garde globale | Conforme | `library`, `reader`, `checkout`, `confirmation` et `admin` sont protégées lorsqu’aucun utilisateur authentifié n’est disponible. |
| Garde de rôle | Conforme | Le back-office accepte uniquement `admin`, `super_admin` et `moderator`. Les autres rôles sont redirigés vers une vue non autorisée. |
| Dashboard API | Conforme | Les données sont composées depuis `/api/v1/library`, `/api/v1/library/{id}/progress` et `/api/v1/books`, conformément à la documentation du dashboard. |
| Compatibilité dashboard/catalogue | Conforme | L’action d’ajout au panier accepte un `DashboardBook` complet et vérifie que la fiche catalogue locale existe avant d’ajouter un article. |
| Charte graphique | Conforme | Les tokens YéYéBook, les surfaces ivoire, le bordeaux, le rose magenta, le wordmark et les états de focus sont conservés. |
| Accessibilité de base | Conforme | Labels associés, identifiants de champs, `aria-invalid`, `aria-describedby`, `role="alert"`, boutons de visibilité et focus visible sont présents sur les parcours audités. |

## Corrections appliquées

### Contrat d’inscription

Le modèle `RegisterFormValues` correspond désormais au formulaire métier attendu : `firstName`, `lastName`, `email`, `phone`, `password`, `confirmPassword`, `acceptTerms`, `acceptPrivacy` et `acceptMarketing`. Le téléphone est validé localement avec un format international compatible avec le lancement au Togo, sans empêcher l’adaptation ultérieure du contrat backend.

Le composant `ConsentField` centralise l’affichage accessible des consentements et différencie les deux obligations réglementaires du consentement marketing facultatif. La page d’inscription reste assemblée à partir de composants dédiés ; aucune logique de champ n’a été déplacée dans la page principale.

### Contrat d’authentification

Les appels de production sont alignés sur le préfixe officiel `/api/v1/auth`. L’adaptateur d’utilisateur normalise les variantes de nom, d’e-mail, de téléphone et de rôle susceptibles d’être renvoyées par l’API. Le type `AuthUser` reconnaît les rôles `user`, `author`, `moderator`, `admin` et `super_admin`.

Le flux `forgotPassword` appelle désormais `POST /api/v1/auth/forgot-password`. En mode preview, les soumissions valides se limitent à un toast et à la création d’une session de démonstration minimale, conformément à la règle projet.

### Protection des vues

`AuthGuard` est utilisé pour les vues nécessitant une session. La vérification initiale de session est distinguée de l’absence de session pour éviter une redirection prématurée pendant le chargement. `RoleGuard` protège le back-office et empêche un utilisateur standard d’atteindre l’espace administrateur.

La protection est appliquée au niveau de l’application afin d’éviter qu’une navigation interne contourne la garde. La déconnexion supprime la session preview et restaure les vues publiques.

### Dashboard

Le service du dashboard ne suppose plus l’existence d’un endpoint agrégé non confirmé. Il compose le résumé à partir de la bibliothèque, de la progression de lecture et du catalogue officiel. Les données backend sont adaptées vers le contrat interne `DashboardBook` avant d’être transmises aux composants d’affichage.

L’action d’ajout au panier conserve le contrat historique du panier principal et reçoit désormais l’objet `DashboardBook` au niveau du dashboard. Elle refuse proprement l’ajout si la fiche complète correspondante n’est pas encore disponible dans le catalogue local ; ce comportement évite d’insérer dans le panier un article incomplet ou sans prix.

## Vérification visuelle effectuée

Le parcours suivant a été vérifié sur la prévisualisation du dépôt :

| Parcours | Résultat observé |
|---|---|
| Accueil public après rechargement | Rendu conforme et navigation publique disponible. |
| Session preview existante | Le dashboard s’ouvre et affiche les lectures, recommandations et actions principales. |
| Déconnexion | Retour à l’accueil public, disparition des actions privées et toast de confirmation. |
| Accès à Ma bibliothèque sans session | Redirection vers la page de connexion. |
| Ouverture de l’inscription | Présence des champs prénom, nom, e-mail, téléphone, mots de passe et trois consentements. |
| Soumission vide | Erreurs locales affichées sur les champs requis et les consentements obligatoires. |
| Inscription valide en preview | Toast de succès, utilisateur de démonstration créé en session minimale et ouverture du dashboard. |

## Limites et intégrations restantes

Le dépôt ne contient pas encore de backend réel configuré. Lorsque `VITE_API_BASE_URL` sera fournie, les réponses du serveur devront respecter les enveloppes documentées dans [`docs/api/authentication.md`](api/authentication.md) et [`docs/api/dashboard.md`](api/dashboard.md), ou être ajoutées explicitement à l’adaptateur avant intégration.

La gestion de session réelle devra être finalisée côté backend avec des cookies sécurisés ou le mécanisme retenu par l’architecture globale. Il faudra également confirmer la forme des erreurs `401`, `409`, `422` et `5xx`, la vérification d’adresse e-mail, la rotation ou l’expiration des sessions et la politique exacte de déconnexion multi-appareils.

Le panier du dashboard reste volontairement dépendant du catalogue déjà chargé dans l’application. Une prochaine intégration catalogue devra fournir une source serveur partagée afin d’éviter toute divergence entre les données du dashboard et celles du catalogue principal.

## Commandes de vérification

```bash
pnpm install --ignore-scripts
pnpm run build
pnpm exec oxfmt --check src/features/auth src/features/dashboard src/App.tsx vite.config.ts
git diff --check
```

## Documents associés

- [`docs/api/authentication.md`](api/authentication.md) — routes, payloads et réponses d’authentification.
- [`docs/api/dashboard.md`](api/dashboard.md) — composition des endpoints et contrat interne du dashboard.
- [`docs/pages/login.md`](pages/login.md) — comportement et états de la page de connexion.
- [`docs/pages/register.md`](pages/register.md) — champs, consentements et validation de l’inscription.

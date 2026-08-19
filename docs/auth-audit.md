# Audit de l’authentification YéYéBook

**Périmètre audité :** pages de connexion et d’inscription, composants partagés, validation locale, toast preview et frontière API.

**Statut :** conforme pour le périmètre frontend preview. La connexion à un backend réel reste volontairement désactivée jusqu’à la disponibilité des endpoints.

## Contrôles réalisés

| Contrôle | Résultat | Observation |
|---|---|---|
| Build de production | Conforme | `pnpm run build` réussit avec Vite 8. |
| Formatage | Conforme | `oxfmt --check` ne signale aucun fichier non formaté dans le périmètre audité. |
| Modularité | Conforme | Shell, champs, password field, bouton, formulaires, pages, types et API sont séparés. |
| Validation locale | Conforme | Les champs requis, l’e-mail, la longueur du mot de passe et sa confirmation sont contrôlés. |
| Toast preview | Conforme | Les soumissions valides affichent un toast et créent uniquement une session de démonstration. |
| Préparation API | Conforme | `VITE_API_BASE_URL` active les appels vers `/auth/login` et `/auth/register`. |
| Stockage de session | Conforme preview | Seul un utilisateur de démonstration est conservé en `sessionStorage`; aucun token ni mot de passe n’y est stocké. |
| Charte graphique | Conforme | Tokens YéYéBook, surfaces ivoire, bordeaux, rose magenta, wordmark et focus conservés. |
| Accessibilité de base | Conforme | Labels associés, `aria-invalid`, `aria-describedby`, `role=alert`, boutons de visibilité et focus visible. |

## Limites connues et prochaines intégrations

Le mode preview ne vérifie pas de vrais identifiants et ne crée pas de compte réel. Il conserve uniquement un utilisateur de démonstration en `sessionStorage` pour permettre de vérifier le dashboard protégé. Lorsque le backend sera prêt, `VITE_API_BASE_URL` devra être configurée et les réponses d’erreur serveur devront respecter le contrat attendu par `auth.api.ts`.

La gestion de session réelle devra être finalisée côté backend avec des cookies sécurisés ou le mécanisme retenu par l’architecture globale. Les pages devront ensuite recevoir les états `401`, `409`, `422` et `5xx` sous une forme normalisée, ainsi qu’un éventuel flux de récupération de mot de passe et de vérification d’adresse e-mail.

## Commandes de vérification

```bash
pnpm install --ignore-scripts
pnpm run build
pnpm exec oxfmt --check src/features/auth src/components/brand/Wordmark.tsx src/App.tsx
``` 

# YéYéBook — Frontend Next.js

## Stack et développement

Ce dépôt est le frontend e-commerce YéYéBook sous **Next.js 14.2.35 avec App Router**, React 18.3, TypeScript et Tailwind CSS 4 via `@tailwindcss/postcss`.

```bash
pnpm dev --port 5175
pnpm typecheck
pnpm build
```

## Structure principale

- `src/app/` — routes App Router, layout racine et métadonnées.
- `src/App.tsx` — shell client de transition pour l’accueil, le panier, le checkout, la bibliothèque, le lecteur et l’administration.
- `src/features/auth/` — connexion, inscription, session API et gardes.
- `src/features/catalog/` — catalogue, filtres et accès API.
- `src/features/book-details/` — fiche livre, avis et titres associés.
- `src/features/dashboard/` — espace lecteur connecté.
- `src/features/cart/` — panier local temporaire, dans l’attente de son API.
- `public/brand/` — ressources graphiques de la marque.
- `docs/pages/` — documentation fonctionnelle des pages.
- `docs/api/` — contrats attendus de l’API.

## Données et configuration

Le frontend ne contient plus de données mock ou de mode preview. Tous les contenus métier doivent provenir de l’API configurée avec :

```text
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

Les services ajoutent ensuite le préfixe `/api/v1`. Si la variable est absente, si l’API est inaccessible ou si une réponse HTTP échoue, le frontend conserve un état vide et affiche un message d’erreur. Il ne doit jamais fabriquer d’utilisateur, de livre, d’avis, de recommandation, de commande ou de progression pour remplacer une réponse manquante.

Ne pas réintroduire `VITE_API_BASE_URL`, `import.meta.env`, les anciens fichiers `*.preview.ts`, les sessions de démonstration ou des tableaux de données métier codés en dur.

## Principes de contribution

Respecter les tokens YéYéBook : rose magenta `#E04070`, bordeaux `#B84870`, ivoire chaud `#FFF6EB`, encre chaude `#100908`, Inter pour l’interface, Poppins pour les titres et Fraunces pour le lecteur.

Préserver l’accessibilité, les états de chargement, d’erreur et vides, les focus visibles, la responsivité et la modularité. Toute nouvelle page consommant une API doit disposer d’une documentation dans `docs/pages/` et d’un contrat dans `docs/api/`.

Les décisions backend non confirmées, notamment le prestataire Mobile Money, les webhooks, la session, le stockage des fichiers et leur protection, ne doivent pas être inventées dans le frontend.
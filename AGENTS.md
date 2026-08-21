# YéYéBook — Frontend Next.js

## Stack et développement

Ce dépôt est le frontend e-commerce YéYéBook, migré vers **Next.js 14.2.35 avec App Router**, React 18.3, TypeScript 5.7 et Tailwind CSS 4 via `@tailwindcss/postcss`. Le serveur de développement se lance avec `pnpm dev` et le build de production avec `pnpm build`.

Le serveur local de vérification utilisé pendant la migration écoute sur le port 5175 : `pnpm dev --port 5175`. Les contrôles de type et de compilation sont `pnpm typecheck` et `pnpm build`.

## Structure principale

- `src/app/` — routes App Router, layout racine, métadonnées et adaptateur de transition.
- `src/app/layout.tsx` — layout racine Server Component, langue française, métadonnées et favicon.
- `src/app/globals.css` — tokens globaux de la charte YéYéBook et import Tailwind.
- `src/app/route-entry.tsx` — Client Component qui transmet les paramètres de route à `src/App.tsx`.
- `src/App.tsx` — shell client de transition conservant les interactions panier, checkout, auth, lecteur, dashboard et admin.
- `src/features/` — domaines métier modulaires : auth, dashboard, catalogue, panier et fiche livre.
- `src/components/` — composants réellement transverses, notamment les primitives de marque.
- `public/brand/` — logos, symboles et favicons servis par chemins absolus Next.js.
- `docs/pages/` — documentation dédiée à chaque page livrée.
- `docs/api/` — contrats API et comportement preview/production.

## Données et configuration

Le mode preview est actif lorsque `NEXT_PUBLIC_API_BASE_URL` est absente. En production, les services API utilisent cette variable pour appeler le backend sous `/api/v1`. Ne pas réintroduire `VITE_API_BASE_URL`, `import.meta.env`, `vite.config.ts` ou un routeur client concurrent.

Les données preview restent utiles pour vérifier l’interface et ne constituent pas une source de vérité de production. Les décisions backend non confirmées, notamment l’agrégateur Mobile Money, les webhooks, la session réelle et la protection des fichiers, ne doivent pas être inventées dans le frontend.

## Principes de contribution

Respecter strictement la maquette Figma validée et les tokens YéYéBook : rose magenta `#E04070`, bordeaux `#B84870`, ivoire chaud `#FFF6EB`, encre chaude `#100908`, Inter pour l’interface, Poppins pour les titres et Fraunces pour le lecteur. Préserver l’accessibilité, les états de chargement/erreur/vides, les focus visibles, la responsivité et la modularité des features.

Toute nouvelle page doit disposer d’une documentation dans `docs/pages/` et d’un contrat API dans `docs/api/` lorsqu’elle consomme ou prépare une API. Toute modification doit être vérifiée par `pnpm typecheck`, `pnpm build` et, lorsque l’interface change, une comparaison visuelle avec `/home/ubuntu/work_figma_export/`.

Les changements doivent rester limités au dépôt `Roronoa-Donald/yeyebook-pre`. Ne pas modifier le dépôt MaBoutique.

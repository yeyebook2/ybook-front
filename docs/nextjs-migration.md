# Migration YéYéBook vers Next.js 14 App Router

## Objectif

YéYéBook a été migré de l’export React/Vite vers **Next.js 14.2.35 avec App Router**, sans modifier arbitrairement la maquette Figma validée. L’export situé dans `/home/ubuntu/work_figma_export` reste la référence visuelle et comportementale : palette, typographies, espacements, composants, surfaces, états et parcours doivent rester reconnaissables après migration.

## État livré

La migration introduit `src/app/layout.tsx` comme layout racine Server Component, `src/app/globals.css` comme feuille de tokens globale, ainsi que des pages App Router dédiées pour les parcours principaux. Durant cette étape de transition, chaque page délègue encore l’orchestration interactive à `src/app/route-entry.tsx`, qui instancie le Client Component `src/App.tsx` avec les paramètres de route nécessaires. Cette stratégie conserve les comportements validés tout en permettant l’extraction progressive des pages vers des composants Next natifs.

| Couche | Responsabilité | État |
|---|---|---|
| `src/app/layout.tsx` | HTML racine, langue française, métadonnées globales, favicon et CSS global | Livré, Server Component |
| `src/app/globals.css` | Tokens YéYéBook, palette, typographies, espacements, animations et accessibilité | Livré |
| `src/app/route-entry.tsx` | Adaptateur de transition entre les pages App Router et `App.tsx` | Livré, Client Component |
| `src/app/*/page.tsx` | Routes explicites et métadonnées de page | Livré |
| `src/features/*` | Types, services API, hooks et composants indépendants par domaine | Conservé et compatible |
| `src/components/*` | Primitives transverses et marque | Conservé et compatible |
| `src/App.tsx` | Shell interactif de transition : panier, checkout, lecteur, auth et admin | Conservé temporairement, Client Component |

## Routes livrées

Les routes suivantes sont explicites et partageables : `/`, `/catalog`, `/books/[slug]`, `/checkout`, `/confirmation/[id]`, `/login`, `/register`, `/dashboard`, `/library`, `/reader/[slug]` et `/admin`. Les fiches livre et lecteur transmettent leur slug à l’adaptateur ; les navigations principales utilisent désormais les URLs App Router, notamment pour l’accueil, le catalogue, le checkout, l’authentification, le dashboard, les fiches livre et le lecteur.

La suppression complète de l’état `View` et de toutes les transitions locales `setView()` est une étape ultérieure d’extraction. Elle doit être réalisée route par route, avec conservation des états panier, session, lecture, toasts et modales validés par la maquette.

## Fidélité à la maquette Figma

La migration conserve les tokens de la charte YéYéBook : **rose magenta `#E04070`** pour l’action et la sélection, **bordeaux `#B84870`** pour les surfaces premium et la navigation, **ivoire chaud `#FFF6EB`** pour le fond principal et **encre chaude `#100908`** pour le texte. Les typographies Inter, Poppins et Fraunces, les rayons, les ombres, les espacements et les variantes de marque sont conservés.

Les assets de marque sont servis depuis `public/brand/` avec des chemins absolus Next.js (`/brand/...`). Les références Unsplash utilisées par le mode preview sont autorisées dans `next.config.mjs`. Une couverture cassée de preview a été corrigée dans `src/features/catalog/catalog.preview.ts` après vérification visuelle.

## Données et API

Le mode preview est sélectionné lorsque `NEXT_PUBLIC_API_BASE_URL` est absente. Les services de `features/auth`, `features/catalog`, `features/book-details` et `features/dashboard` utilisent désormais cette variable publique pour construire les appels API ; aucune référence `import.meta.env` ou `VITE_API_BASE_URL` ne doit être réintroduite.

Le mode production attend une base d’API fournie au build ou au runtime selon le déploiement :

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.exemple.tld pnpm build
```

Aucun agrégateur Mobile Money, webhook, token client ou lecteur ePub réel n’est inventé par cette migration. Les cookies HttpOnly, le contrat d’authentification, le paiement et le déchiffrement éventuel des fichiers restent des décisions backend/client documentées séparément.

## Nettoyage Vite

La configuration Vite a été supprimée du dépôt : `vite.config.ts`, `index.html`, `vite`, `@vitejs/plugin-react` et `@tailwindcss/vite`. Les scripts actifs sont désormais `dev`, `build`, `start` et `typecheck` pour Next.js. `postcss.config.mjs` utilise `@tailwindcss/postcss` et `tsconfig.json` suit les conventions Next.js 14.

## Validation effectuée

Le contrôle TypeScript passe avec `pnpm typecheck`. Le build de production passe avec `pnpm build` et génère les onze routes App Router attendues. Le serveur de développement a été vérifié sur `http://localhost:5175`.

| Parcours | Résultat observé |
|---|---|
| Accueil `/` | Hero, navigation, nouveautés, best-sellers, catégories, bénéfices et footer conformes à la maquette |
| Catalogue `/catalog` | 8 titres preview, facettes, recherche, tri, grille/liste et couvertures visibles |
| Fiche `/books/une-si-longue-lettre` | URL dynamique stabilisée, couverture, achat, onglets, sommaire et métadonnées rendus |
| Auth `/login` et `/register` | Compositions éditoriales, champs, consentements et CTA rendus sans erreur |
| Panier et `/checkout` | Ajout local, drawer, quantité, total TTC en FCFA et formulaire de commande vérifiés |

Le journal détaillé de la comparaison navigateur est conservé dans `yeyebook_next_visual.md` à la racine de l’espace de travail et peut être repris dans la documentation de recette si nécessaire.

## Suite recommandée

La prochaine étape est d’extraire le shell partagé dans `src/app/(store)/layout.tsx`, puis de sortir successivement le catalogue, la fiche livre, le checkout et le lecteur du composant de transition `App.tsx`. Chaque extraction doit conserver un fallback preview, les contrats API existants, les pages Markdown de `docs/pages/` et les contrats de `docs/api/`, puis être validée par `pnpm typecheck`, `pnpm build` et une comparaison visuelle avec l’export Figma.

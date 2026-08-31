# Migration Next.js de YéYéBook

## Architecture

Le frontend utilise Next.js 14 App Router. Les routes livrées sont :

```text
/
/login
/register
/dashboard
/catalog
/books/[slug]
/checkout
/confirmation/[id]
/library
/reader/[slug]
/admin
```

`src/app/route-entry.tsx` transmet encore la route à `src/App.tsx`. Cette couche est transitoire : les pages devront progressivement devenir autonomes afin de réduire le JavaScript partagé et le couplage de l’état global.

## Configuration API

```text
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

Les services appellent le backend sous `/api/v1` avec `credentials: "include"`. L’absence de configuration est une erreur visible ; aucun mode preview et aucun fallback de données ne sont autorisés.

## Ressources

Les ressources de marque sont servies depuis `public/brand/`. Les couvertures et autres médias métier doivent être fournis par l’API. Une image distante invalide est masquée plutôt que remplacée par une fausse couverture.

## Validation de la migration

```bash
pnpm typecheck
pnpm build
```

Le build doit générer les onze routes sans dépendre d’une donnée mock. La vérification fonctionnelle complète nécessite une API accessible et conforme aux contrats de `docs/api/`.
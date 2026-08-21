# Page Catalogue

## Responsabilité

La page Catalogue présente les e-books publiés de YéYéBook et permet à l’utilisateur de rechercher, filtrer, trier et parcourir les résultats en grille ou en liste. Elle est publique et ne nécessite pas de session authentifiée. Les prix sont affichés en FCFA, conformément au périmètre de lancement au Togo.

La page ne porte pas directement la logique réseau ni la logique métier du panier. Elle orchestre le hook `useCatalog`, transmet les actions d’ouverture de fiche et d’ajout au panier reçues de l’application racine, et rend les états `loading`, `error`, `empty` et `success` du chargement des résultats.

## Arborescence

```text
src/features/catalog/
├── catalog.api.ts
├── catalog.constants.ts
├── catalog.preview.ts
├── catalog.utils.ts
├── index.ts
├── types.ts
├── components/
│   ├── BookCard.tsx
│   ├── CatalogFilters.tsx
│   ├── CatalogGrid.tsx
│   ├── CatalogList.tsx
│   ├── CatalogPagination.tsx
│   ├── CatalogStates.tsx
│   ├── CatalogToolbar.tsx
│   └── RatingStars.tsx
├── hooks/
│   └── useCatalog.ts
└── pages/
    └── CatalogPage.tsx
```

| Module | Responsabilité |
|---|---|
| `CatalogPage` | Assemblage de la page, navigation, état d’affichage et coordination des actions. |
| `useCatalog` | État des filtres, appel de chargement, debounce court, retry et gestion des états réseau. |
| `catalog.api` | Mapping des réponses backend, construction des query params et moteur de données preview. |
| `CatalogFilters` / `CatalogToolbar` | Filtres, recherche, compteur, tri et bascule grille/liste. |
| `CatalogGrid` / `CatalogList` / `BookCard` | Présentation des résultats et actions par livre. |

## Filtres disponibles

Le contrat d’interface couvre les filtres confirmés dans le cahier des charges : catégorie, prix minimum et maximum, note minimale, langue et date de publication. Les catégories et langues affichent des facettes dynamiques dont le compteur est recalculé selon les résultats filtrés en mode preview ou fourni par le backend lorsqu’il renvoie `facets`.

Le tri propose la pertinence, la popularité, la note, la date de publication, le prix croissant et le prix décroissant. La pagination est numérotée dans cette première implémentation ; le contrat reste compatible avec une évolution vers un curseur ou un chargement infini si ce choix est confirmé côté backend.

## États UX

La page affiche une grille skeleton pendant le chargement. En cas d’échec, un message contextualisé et une action « Réessayer » relancent l’appel sans recharger l’application. Une combinaison de filtres sans résultat affiche un état vide avec une action de réinitialisation. Le compteur est annoncé avec `aria-live="polite"` afin de signaler les changements de résultat.

Sur mobile, le panneau de filtres devient un tiroir modal. Sur desktop, il reste visible dans une colonne latérale sticky. Les boutons, contrôles de formulaire, vues et pages sont accessibles au clavier et exposent les états `aria-pressed`, `aria-current` ou `aria-label` nécessaires.

## Mode preview

Lorsque `NEXT_PUBLIC_API_BASE_URL` est absente, `useCatalog` utilise `PREVIEW_BOOKS` et applique localement la recherche, les filtres, le tri, les facettes et la pagination. Ce mode ne simule aucun paiement ni compte utilisateur ; il sert uniquement à vérifier l’interface et le flux d’ajout au panier.

Lorsque `NEXT_PUBLIC_API_BASE_URL` est présente, les données sont chargées par `GET /api/v1/books`. Le service utilise `credentials: "include"` pour rester compatible avec la stratégie de session retenue par le backend, même si le catalogue public reste accessible sans connexion.

## Actions reçues de l’application

```ts
type CatalogPageProps = {
  books: Book[]
  initialCategory?: string
  initialSearch?: string
  onHome: () => void
  onSearchChange?: (search: string) => void
  onOpenBook: (book: CatalogBook) => void
  onAddToCart: (book: CatalogBook) => void
}
```

`onOpenBook` et `onAddToCart` reçoivent un livre normalisé. L’application racine reste responsable de la navigation vers la fiche détaillée et de la gestion d’état du panier.

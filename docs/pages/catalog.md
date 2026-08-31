# Page Catalogue

La page Catalogue charge exclusivement les livres publiés depuis `GET /api/v1/books`. Elle permet la recherche, les filtres, le tri, la pagination et les vues grille/liste.

## Arborescence

```text
src/features/catalog/
├── catalog.api.ts
├── catalog.constants.ts
├── catalog.utils.ts
├── types.ts
├── components/
├── hooks/useCatalog.ts
└── pages/CatalogPage.tsx
```

L’ancien fichier `catalog.preview.ts` a été supprimé.

## États UX

- chargement : skeletons ;
- erreur : état explicite, bouton `Réessayer` et toast global ;
- zéro résultat : message vide sans création de livres artificiels ;
- succès : affichage des données normalisées reçues de l’API.

Si `NEXT_PUBLIC_API_BASE_URL` est absente, la page affiche une erreur de configuration. Les facettes doivent venir de la réponse backend.
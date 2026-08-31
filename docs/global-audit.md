# État global du frontend YéYéBook

**Mise à jour : 31 août 2026**

## Principe de données

Le frontend ne contient plus de données mock. Les anciens jeux de livres, avis, recommandations, commandes et utilisateurs de démonstration ont été supprimés. Une indisponibilité de l’API produit un état vide ou un écran d’erreur ainsi qu’un toast lorsqu’un gestionnaire global est disponible.

## État par domaine

| Domaine | État |
|---|---|
| Authentification | UI, validation, services et gardes présents ; API obligatoire. |
| Accueil | Structure visuelle présente ; livres chargés par `GET /api/v1/books`. |
| Catalogue | Filtres, tri, pagination et états UX présents ; aucune source locale de substitution. |
| Fiche livre | Détail, avis et titres associés chargés exclusivement depuis l’API. |
| Dashboard | Bibliothèque, progression et recommandations chargées exclusivement depuis l’API. |
| Panier | Persistance locale encore présente ; API panier non branchée. |
| Checkout | Interface présente, mais création de commande et paiement réel restent à implémenter. |
| Bibliothèque/lecteur | Interfaces présentes ; données serveur et véritable lecteur EPUB restent à brancher. |
| Administration | Interface locale présente ; endpoints et mutations admin restent à brancher. |

## Erreurs réseau

Les services ne remplacent jamais une réponse absente par une donnée fictive. Ils lèvent une erreur lorsque :

- `NEXT_PUBLIC_API_BASE_URL` est absente ;
- le réseau est inaccessible ;
- le backend renvoie un statut non valide ;
- une ressource obligatoire est absente de la réponse.

## Dette technique

`src/App.tsx` reste un shell de transition volumineux. Les prochaines extractions recommandées sont `checkout`, `orders`, `library`, `reader` et `admin`. Les flux encore locaux ne doivent pas être présentés comme intégrés au backend.

## Validation

```bash
pnpm typecheck
pnpm build
git diff --check
```
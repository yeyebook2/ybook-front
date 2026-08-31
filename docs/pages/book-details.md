# Fiche livre

La fiche est assemblée par `src/features/book-details/pages/BookDetailPage.tsx` et charge exclusivement ses données depuis l’API.

Elle présente la couverture, les métadonnées, le prix, le JSON-LD `Book`, les actions d’achat, le partage, les avis et les titres associés. La wishlist demeure un état d’interface local tant que son contrat serveur n’est pas livré ; elle ne précharge aucune donnée.

Les appels utilisés sont détaillés dans `docs/api/book-details.md`. Une erreur de chargement produit un écran explicite avec une action `Réessayer`. Aucun livre, avis ou contenu de chapitre fictif n’est utilisé comme remplacement.
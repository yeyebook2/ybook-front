# Panier

Le panier est actuellement rendu comme un drawer global dans `src/App.tsx`, mais ses types et sa persistance sont isolés dans `src/features/cart/`. Il est accessible aux visiteurs non authentifiés, conformément à la décision client autorisant l’achat invité.

Le panier affiche la couverture, le titre, l’auteur, la quantité, le prix de ligne, le sous-total et le total TTC. La quantité est bornée entre 1 et 5 exemplaires par livre. Une suppression ramène l’article hors du panier et le badge de navigation reflète le nombre total d’exemplaires.

En mode preview, les articles sont sauvegardés dans `localStorage` sous la clé `yeyebook-cart`. La lecture est défensive : les entrées invalides sont ignorées et le panier reste utilisable en mémoire si le stockage est indisponible. Cette persistance locale sera remplacée ou synchronisée avec l’API lorsque le service panier sera branché.

Le drawer expose les actions de navigation vers la fiche livre, de modification de quantité, de suppression, de passage au checkout et de poursuite des achats. Les états de panier vide et panier rempli sont accessibles avec des boutons libellés.

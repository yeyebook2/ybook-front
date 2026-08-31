# Panier

Le panier est rendu comme un drawer global dans `src/App.tsx`. Il ne contient aucun article initial ou fictif.

Les articles réellement ajoutés par l’utilisateur sont temporairement persistés dans `localStorage` sous la clé `yeyebook-cart`. Les quantités sont limitées de 1 à 5. Le panier affiche la couverture reçue de l’API, le titre, l’auteur, les quantités, le sous-total et le total.

L’API panier n’est pas encore branchée. La persistance locale devra être remplacée ou synchronisée lorsque le contrat serveur sera disponible.
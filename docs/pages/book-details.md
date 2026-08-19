# Fiche livre

La fiche livre est assemblée par `src/features/book-details/pages/BookDetailPage.tsx`. Elle reçoit un slug ou un livre de secours depuis l’application racine et délègue les responsabilités à des composants spécialisés : galerie de couverture, panneau d’achat, métadonnées, partage, onglets, avis, titres associés et états de chargement.

La page affiche le fil d’Ariane, la couverture avec zoom accessible, le titre, le sous-titre éventuel, l’auteur, la note, le nombre d’avis, le nombre de pages, l’année, le prix TTC en FCFA et les métadonnées éditoriales. Les valeurs absentes de l’API sont indiquées explicitement ; aucune remise, ISBN ou information commerciale n’est inventé.

Le panneau d’achat distingue trois situations. Un visiteur peut acheter immédiatement ou ajouter le livre au panier. Un livre déjà possédé expose l’action de lecture. La wishlist est gérée localement dans l’état de la page en preview et les actions d’achat sont déléguées à l’application pour réutiliser la gestion panier canonique de `src/features/cart/`.

Les onglets comprennent la description et le sommaire, les avis et les titres associés. En mode preview, les avis de démonstration sont chargés sans réseau et un utilisateur authentifié peut ajouter un avis local temporaire. Avec l’API, la page utilise les services documentés dans `docs/api/book-details.md`.

La page gère les états loading, erreur, livre introuvable, zoom, wishlist, partage, avis vide et avis en cours d’envoi. Tous les boutons importants disposent d’un libellé accessible et les actions de navigation conservent une sortie vers le catalogue.

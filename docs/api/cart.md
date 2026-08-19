# API Panier

## Contrat cible

Le cahier des charges prévoit un panier accessible avec ou sans authentification et les endpoints suivants :

```http
GET    /api/v1/cart
POST   /api/v1/cart/items
PUT    /api/v1/cart/items/{id}
DELETE /api/v1/cart/items/{id}
POST   /api/v1/cart/apply-coupon
DELETE /api/v1/cart/clear
```

Les opérations d’ajout et de modification portent respectivement `{ book_id, quantity }` et `{ quantity }`. La réponse attendue contient le panier, son total et le nombre d’articles. Le serveur doit appliquer la limite métier de quantité et valider les codes promotionnels.

## État frontend actuel

La feature `src/features/cart/` ne réalise pas encore d’appel réseau. Elle fournit le type `CartItem`, la clé localStorage, le quota maximal de cinq et une lecture/écriture défensive pour le mode preview. L’intégration API devra remplacer ou synchroniser cette persistance sans modifier les composants de rendu.

Le checkout consommera ensuite le panier serveur pour créer une commande avec `POST /api/v1/orders`, puis initier le paiement via le flux choisi. Aucun agrégateur ni statut de paiement n’est codé avant confirmation du contrat backend et du prestataire.

## Points à confirmer

La stratégie de fusion entre panier invité local et panier authentifié doit être définie au moment de la connexion. Le backend doit également confirmer si le panier invité repose sur un cookie de session, un identifiant client ou une autre enveloppe. Ces décisions sont nécessaires avant de remplacer localStorage en production.

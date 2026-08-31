# API Panier

## Contrat cible

```http
GET    /api/v1/cart
POST   /api/v1/cart/items
PUT    /api/v1/cart/items/{id}
DELETE /api/v1/cart/items/{id}
POST   /api/v1/cart/apply-coupon
DELETE /api/v1/cart/clear
```

## État actuel

L’API panier n’est pas encore branchée. Le panier existant conserve temporairement les sélections réelles de l’utilisateur dans `localStorage`; il ne précharge aucun article fictif. Cette persistance locale n’est pas un jeu de données mock, mais elle devra être remplacée ou synchronisée avec le serveur.

La stratégie de fusion entre panier invité et panier authentifié doit être définie avec le backend. Aucun code promotionnel, frais ou paiement ne doit être simulé en production.
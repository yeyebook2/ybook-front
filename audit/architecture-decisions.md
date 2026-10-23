# Décisions d'Architecture Logicielle (ADR) — YéYéBook Frontend
**Responsable :** Principal Software Architect  
**Date :** 22 Octobre 2026  
**Statut Global :** VALIDÉ ET ENREGISTRÉ

---

## ADR-01 : Refactorisation Chirurgicale Progressive vs Réécriture Destructrice

### Contexte
Le frontend YéYéBook intègre un shell client éprouvé (`src/App.tsx`) contenant la logique d'interaction complète, les transitions d'écran, le panier local, le lecteur ePub et l'interface d'administration. Une réécriture intégrale vers des Server Components (RSC) App Router purs présentait un risque majeur de rupture de contrat avec l'interface validée par le client, ainsi qu'une instabilité des composants tiers (`epubjs`, `astraui`).

### Décision
Adopter la stratégie du "Strangler Pattern" chirurgical :
1. Conserver l'intégrité visuelle et fonctionnelle de `src/App.tsx`.
2. Extraire les responsabilités transverses critiques dans des modules spécialisés et testables :
   - Client HTTP et gestion des sessions : `src/lib/api-client.ts`
   - Normalisation des erreurs : `src/lib/api-errors.ts`
   - Gestion de l'anti-rebond (debounce) : `src/hooks/useDebounce.ts`
   - Typage strict des formulaires d'administration : `src/features/admin/types.ts`
3. Éliminer les casts dangereux (`as any`) sur les flux d'entrées/sorties sensibles (langue de livre, progression, statuts de lecture).

### Conséquences
- Zéro régression visuelle ou ergonomique.
- Maintenabilité et testabilité immédiates (39 tests unitaires et d'intégration opérationnels).
- Base saine pour de futures extractions granulaires par route sans risque de régression.

---

## ADR-02 : Client HTTP Centralisé & Mutex Anti-Tempête de Renouvellement de Session

### Contexte
Le backend YéYéBook utilise des jetons JWT à durée de vie courte (15 minutes) protégés par des cookies `HttpOnly`, et expose un endpoint de renouvellement `/api/v1/auth/refresh`. Auparavant, la fonction `refreshSession()` était orpheline dans le code frontend, provoquant des déconnexions brutales et des pertes d'état lors de la lecture ou de la navigation. De plus, plusieurs requêtes simultanées (ex: lecture de progression, statistiques, catalogue) généraient une tempête de requêtes concurrentes vers l'endpoint de refresh.

### Décision
Centraliser les appels réseau dans `src/lib/api-client.ts` :
1. Interception automatique du code HTTP 401 sur toute requête authentifiée (sauf routes d'auth directes).
2. Utilisation d'un singleton de promesse `inFlightRefreshPromise` servant de Mutex : toute requête concurrente arrivant pendant un refresh en cours attend la même réponse réseau au lieu de déclencher un nouvel appel.
3. Rejeu unique de la requête initiale (`isRetry: true`) empêchant toute boucle infinie.
4. En cas d'échec définitif du refresh (session révoquée), purge des données de session en mémoire et notification de déconnexion.

### Conséquences
- Continuité parfaite du parcours utilisateur et de la lecture.
- Réduction drastique de la charge sur le serveur d'authentification backend.

---

## ADR-03 : Machine à États Finis et Invalidation des Entrées URL pour le Paiement (FedaPay)

### Contexte
Le flux de retour du prestataire de paiement (`/checkout/retour`) se basait sur la présence du paramètre de requête `?status=approved` pour afficher la confirmation et vider le panier local de l'utilisateur, permettant à un utilisateur malveillant de fabriquer une fausse URL de confirmation ou à un utilisateur légitime de vider son panier sur une transaction en échec.

### Décision
1. Bannir toute confiance accordée aux paramètres d'URL. Le paramètre `status` dans l'URL n'est plus utilisé comme preuve de paiement.
2. Définir une machine à états finis explicite : `loading` -> (`success` | `pending` | `declined` | `error` | `missing_id`).
3. Interroger obligatoirement l'endpoint backend `confirmPaymentApi(id)` qui contacte le prestataire et vérifie l'état réel de la transaction en base de données.
4. Conditionner strictement le vidage du panier (`saveCart([])`) à la confirmation formelle par le serveur (`order_status === "paid"` ou `payment.status === "completed"`).
5. Poser un verrou en mémoire cache (`sessionStorage`) pour éviter la double soumission lors d'un rechargement de page.

### Conséquences
- Sécurité financière de niveau bancaire.
- Préservation du panier d'achat de l'utilisateur en cas d'échec ou d'attente de confirmation opérateur Mobile Money.

---

## ADR-04 : Synchronisation Complète et Bidirectionnelle du Champ Langue des Livres

### Contexte
Le backend disposait d'un champ `language` dans le modèle de livre, mais le frontend ne transmettait pas cette information lors de la création ou de l'édition d'un livre dans l'espace administrateur, laissant la valeur à `NULL` en base de données.

### Décision
1. Définir la liste officielle des langues supportées `SUPPORTED_LANGUAGES` comprenant les codes ISO standard internationaux (`fr`, `en`, `es`, `ar`, `pt`) et les langues africaines prioritaires (`fon`, `yo`, `sw`, `wo`, `bm`).
2. Étendre le contrat `AdminBookInput` avec `language?: string`.
3. Intégrer un sélecteur accessible dans `AdminBookEditor.tsx` avec sélection par défaut sur le français (`fr`).
4. Supprimer le fallback forcé `(book as any).language || "fr"` pour afficher dynamiquement le libellé de la langue retournée par l'API.

### Conséquences
- Alignement strict entre le frontend et le modèle de données backend.
- Prise en charge native du multilinguisme et valorisation du patrimoine linguistique africain.

# Audit global de compatibilité, conformité et modularité

**Projet :** YéYéBook — `Roronoa-Donald/yeyebook-pre`
**Date de l’audit :** 19 août 2026
**Périmètre :** frontend React/Vite, parcours publics et privés, contrats API, charte graphique, accessibilité, documentation et architecture modulaire.
**Référence fonctionnelle :** `/home/ubuntu/upload/cahier_des_charges.txt`.
**État du dépôt au démarrage :** `3a707aa` — `feat(book-details): extract modular book page with cart actions`.

## Conclusion exécutive

L’application est **cohérente et vérifiable en mode preview**. Les fonctionnalités d’authentification, de dashboard, de catalogue et de fiche livre disposent maintenant de features séparées, de services API documentés et d’états UX explicites. Le panier invité est persistant et le checkout est accessible sans compte, conformément à la décision client.

Le frontend n’est cependant **pas encore conforme à une mise en production connectée complète**. Le paiement réel, les commandes, la synchronisation serveur du panier, la bibliothèque connectée, le téléchargement signé, le vrai lecteur ePub, les pages statiques et le back-office API restent à brancher. Ces éléments ne sont pas déclarés conformes artificiellement, car leurs contrats ou décisions d’intégration ne sont pas encore finalisés dans le frontend.

> **Décision de prudence :** les corrections appliquées concernent uniquement les écarts confirmés et indépendants d’un choix backend non tranché. Aucun agrégateur Mobile Money, statut de paiement, quota définitif de téléchargement ou mécanisme de protection contre les captures d’écran n’a été inventé.

## Référentiel de conformité

Le cahier des charges exige notamment un accueil éditorial, un catalogue filtrable, une fiche e-book complète, un panier persistant, un checkout Mobile Money, une bibliothèque avec téléchargement signé, un lecteur ePub synchronisé, des pages statiques et un back-office connecté. Les exigences fonctionnelles se trouvent aux lignes 301–428 et les contrats API aux lignes 1572–1759 du document source [1].

### Parcours publics

| Domaine | Statut | Constat vérifié |
|---|---|---|
| Authentification | Conforme preview / prêt API | Login/register modulaires, validation locale, consentements, gardes et routes `/api/v1/auth/*` documentées. |
| Accueil | Partiel | Hero, recherche, catégories, nouveautés et best-sellers existent ; le carrousel promotionnel, les recommandations connectées et les pages statiques restent à créer. |
| Catalogue | Conforme preview / prêt API | Filtres, facettes dynamiques, tri, grille/liste, pagination, états loading/error/empty et `GET /api/v1/books` sont séparés et documentés. |
| Fiche livre | Conforme preview / prêt API | Feature dédiée avec zoom, métadonnées, Schema.org Book, achat immédiat, panier, wishlist locale, partage, avis, titres associés, auteur actionnable et états UX. |

La fiche utilise désormais explicitement `GET /api/v1/books/{slug}/related?limit=4` lorsque l’enveloppe détail ne contient pas déjà les recommandations. Le clic auteur affiche une disponibilité future explicite tant qu’aucune page auteur n’est livrée, au lieu de présenter un texte non actionnable comme un faux lien.

### Achat et compte client

| Domaine | Statut | Constat vérifié |
|---|---|---|
| Panier | Partiel amélioré | Articles, quantités, suppression, sous-total, total, persistance `localStorage` et plafond de 1 à 5 existent. API panier, code promo et frais éventuels restent absents. |
| Checkout | Partiel preview | Informations, récapitulatif, choix de fournisseur Mobile Money et étape de paiement sont présents ; l’ordre et le paiement sont encore simulés localement. |
| Confirmation | Partiel preview | Confirmation locale et récapitulatif existent ; webhook, email, téléchargement et statut serveur restent à brancher. |
| Bibliothèque | Partiel preview | Statistiques, livres locaux, lecture et progression locale existent ; bibliothèque API, téléchargement signé, compteur, factures, paramètres et préférences ne sont pas branchés. |
| Lecteur | Partiel preview | Chapitres, progression locale, thèmes, taille, interligne et bookmarks locaux existent ; EPUB.js/Readium, plein écran, annotations persistantes, API et mode hors-ligne restent à intégrer. |

L’accès invité au checkout et à la confirmation est conforme à la décision client selon laquelle le compte ne doit pas être obligatoire pour acheter. La bibliothèque, le lecteur, le dashboard authentifié et le back-office restent protégés par session ou rôle selon leur nature.

### Back-office et pages statiques

| Domaine | Statut | Constat vérifié |
|---|---|---|
| Back-office | Partiel preview | `RoleGuard` et les écrans locaux de catalogue, commandes et statistiques sont présents ; les mutations ne passent pas encore par `/api/v1/admin/*`. |
| Pages statiques | Non implémenté | À propos, guide d’achat, FAQ, CGV, confidentialité, contact et blog n’ont pas de vues dédiées. Le footer affiche un toast explicite pour les fonctionnalités futures. |
| Paiement réel | Non implémenté | L’agrégateur et le flux définitif restent à choisir ; aucun paiement réel n’est déclaré conforme. |
| Production | Non validé | Aucun backend réel n’est configuré dans le dépôt ; les adaptateurs disponibles couvrent auth, dashboard, catalogue et détail livre. |

## Audit des contrats API

| Contrat | État frontend |
|---|---|
| Auth `/api/v1/auth/*` | Service présent pour register, login, forgot-password, me et logout ; refresh, reset-password, verify-email et mise à jour de profil restent documentés comme extensions. |
| Dashboard `/api/v1/library`, progress et `/api/v1/books` | Service composé et documenté ; la garde frontend ne remplace pas l’autorisation backend. |
| Catalogue `/api/v1/books` | Service, types, recherche, facettes, pagination, tri et adaptateur présents. |
| Fiche `/api/v1/books/{slug}` | Service détail, normalisation des métadonnées, chapitres, avis, related et JSON-LD présents. |
| Avis | GET et POST branchés dans la feature fiche ; PUT/DELETE et règles serveur d’un avis par utilisateur restent à intégrer. |
| Panier serveur | Contrat identifié, mais seule la persistence preview `localStorage` est livrée ; aucun service `/api/v1/cart/*` n’est encore utilisé. |
| Orders, payments, library read/download/bookmarks et admin | Contrats présents dans le cahier des charges et documentés comme cible ; services frontend dédiés non encore livrés. |

Le frontend ne doit pas considérer les données seed de `App.tsx` comme une source de vérité production. Elles restent légitimes pour le mode preview, mais devront être remplacées par des services dédiés lorsque les contrats backend seront activés.

## Audit de modularité

Les features auth, catalog, dashboard, cart et book-details suivent la séparation page/hook/service/types/components. La fiche livre ne contient plus la logique réseau dans la page et délègue l’achat au panier canonique. Les documentations dédiées existent pour login, register, dashboard, catalogue, panier et fiche livre, avec les contrats API correspondants.

La modularité globale reste **partielle**. `src/App.tsx` conserve environ 3 500 lignes et porte encore le routeur local, le checkout, la confirmation, le drawer panier, la bibliothèque, le lecteur et l’intégralité du back-office. Ce couplage ne crée pas de régression bloquante identifiée, mais il augmente le risque de régression lors des futurs branchements orders, payments, library et admin.

| Niveau | Évaluation |
|---|---|
| Features auth/catalog/dashboard/cart/book-details | Conforme et réutilisable en preview. |
| Services API | Partiel : quatre domaines principaux couverts ; cart serveur, orders, payments, library, reader et admin restent à brancher. |
| État client | Partiel : panier et progression locaux, pas de store global ni de synchronisation serveur. |
| Pages et documentation | Partiel amélioré : toutes les pages livrées dans les features ont une documentation ; checkout, confirmation, library, reader et admin restent regroupés dans `App.tsx`. |
| Charte et accessibilité | Conforme sur les parcours vérifiés : tokens YéYéBook, labels accessibles, états d’erreur, dialogue de zoom et navigation de sortie présents. |

La prochaine refactorisation recommandée est d’extraire successivement `features/checkout`, `features/library`, `features/reader` et `features/admin`, sans changer le routeur local tant que les contrats métier ne sont pas stabilisés.

## Corrections appliquées pendant cet audit

| Correction | Fichiers principaux | Effet |
|---|---|---|
| Related explicite | `src/features/book-details/book-details.api.ts`, `index.ts` | Appel de `/books/{slug}/related` lorsque la réponse détail ne contient pas de recommandations. |
| Auteur actionnable | `BookDetailPage.tsx`, `types.ts`, `App.tsx` | Callback explicite et toast « fonctionnalité à venir » tant que la page auteur n’existe pas. |
| SEO fiche livre | `BookDetailPage.tsx` | JSON-LD Schema.org `Book` avec champs optionnels omis lorsqu’ils sont absents. |
| Documentation fiche | `docs/pages/book-details.md`, `docs/api/book-details.md` | Contrat et responsabilités alignés sur le code réel. |
| Rapport global | `docs/global-audit.md` | État actuel après extraction de la fiche livre, limites et prochaines étapes actualisés. |

Les corrections précédentes conservées dans le dépôt comprennent la persistance panier invité, le plafond de quantité, l’achat invité, la suppression de métadonnées fabriquées, les métadonnées backend de la fiche et l’extraction de la feature book-details.

## Éléments volontairement non modifiés

L’agrégateur Mobile Money, la procédure de paiement, le délai de vérification, le quota définitif de téléchargement, le mode hors-ligne, la protection contre les captures et les rôles éditoriaux restent des décisions client ou des sujets backend. Ils ne sont donc pas codés arbitrairement dans cette correction.

La construction complète des pages statiques, du lecteur ePub réel, du CRUD admin connecté, des services orders/payments/download et de la synchronisation serveur du panier nécessitera des features dédiées. Les déclarer « conformes » maintenant serait incorrect ; les déclarer « cassés » serait également excessif puisque ces fonctionnalités n’ont pas encore été livrées dans le périmètre frontend.

## Vérifications effectuées

Les contrôles TypeScript, formatage, build de production et whitespace passent après les corrections. Les parcours précédemment vérifiés couvrent l’accueil, le catalogue, l’ouverture fiche, le zoom, les onglets avis et titres associés, l’ajout panier, la persistance après rechargement, l’achat immédiat et l’accès invité au checkout. La présence du JSON-LD `Book` a également été confirmée dans le DOM de la fiche.

```bash
pnpm exec tsc --noEmit
pnpm run build
pnpm exec oxfmt --check src/App.tsx src/features src/components
git diff --check
```

## Références

[1]: /home/ubuntu/upload/cahier_des_charges.txt "Cahier des charges YéYéBook — exigences fonctionnelles et contrats API"
[2]: ./auth-audit.md "Audit auth et dashboard YéYéBook"
[3]: ./api/catalog.md "Contrat API Catalogue"
[4]: ./pages/catalog.md "Documentation de la page Catalogue"
[5]: ./api/book-details.md "Contrat API Fiche livre"
[6]: ./pages/book-details.md "Documentation Page Fiche livre"

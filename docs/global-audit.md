# Audit global de compatibilité, conformité et modularité

**Projet :** YéYéBook — `Roronoa-Donald/yeyebook-pre`  
**Périmètre :** frontend React/Vite, parcours publics et privés, contrats API, charte, documentation et architecture modulaire.  
**Référence fonctionnelle :** `/home/ubuntu/upload/cahier_des_charges.txt`.  
**Référence du dépôt au démarrage :** `69e9c6d` — `feat(catalog): add modular public catalogue with filters and API contract`.

## Conclusion exécutive

L’application est **cohérente et vérifiable en mode preview**, mais elle n’est pas encore entièrement conforme à une mise en production connectée. Les parcours d’authentification, de dashboard et de catalogue disposent d’une architecture modulaire et de contrats API documentés. Les parcours fiche livre, panier, checkout, bibliothèque, lecteur et back-office restent partiellement implémentés dans `src/App.tsx` et utilisent encore des données locales ou des comportements de démonstration.

Les corrections appliquées dans cet audit sont limitées aux écarts confirmés qui pouvaient être corrigés sans inventer un contrat backend : persistance du panier invité, quantité maximale de 5, accès invité au checkout et à la confirmation, suppression de métadonnées commerciales fabriquées, propagation des métadonnées livre backend, correction des volumes affichés sur l’accueil et remplacement des liens footer silencieux par des actions explicites de fonctionnalité à venir.

> **Décision de prudence :** aucun endpoint de paiement, commande, téléchargement, avis, administration ou lecteur n’a été inventé. Ces branchements dépendent de contrats backend déjà décrits dans le cahier des charges, mais non encore implémentés dans le frontend.

## Référentiel de conformité

Le cahier des charges exige notamment un catalogue filtrable, une fiche livre complète, un panier persistant, un checkout Mobile Money, une bibliothèque avec téléchargement signé, un lecteur ePub synchronisé, des pages statiques et un back-office connecté. Les exigences fonctionnelles sont relevées aux lignes 301–428 du document source et les contrats API détaillés aux lignes 1572–1759.[1]

### Parcours publics

| Domaine | Statut | Constat vérifié |
|---|---|---|
| Authentification | Conforme preview / prêt API | Pages login/register modulaires, validation locale, consentements, gardes et routes `/api/v1/auth/*` documentées. |
| Accueil | Partiel | Hero, nouveautés, best-sellers, catégories et recherche existent ; le carrousel, les recommandations connectées et les pages légales restent à créer. |
| Catalogue | Conforme preview / prêt API | Filtres, facettes dynamiques, tri, grille/liste, pagination, états UX et `GET /api/v1/books` sont séparés et documentés. |
| Fiche livre | Conforme preview / prêt API | Feature `book-details` extraite, zoom, achat, panier, wishlist, partage, métadonnées, avis, titres associés et états UX documentés ; endpoints détail/avis/recommandations restent à confirmer côté backend. |

L’accueil affiche désormais jusqu’à huit nouveautés et dix best-sellers lorsque le catalogue chargé le permet. Le carrousel promotionnel et les recommandations personnalisées n’ont pas été simulés, car ils nécessitent soit un contrat de données, soit une décision UX supplémentaire.

### Achat et compte client

| Domaine | Statut | Constat vérifié |
|---|---|---|
| Panier | Partiel amélioré | Articles, quantités, suppression, sous-total et total existent ; localStorage et plafond 1–5 sont maintenant corrigés. API panier, code promo et frais restent absents. |
| Checkout | Partiel amélioré | Informations, récapitulatif, choix Mobile Money et confirmation preview existent ; l’achat invité est maintenant autorisé. Orders/payments/webhook et instructions opérateur restent absents. |
| Bibliothèque | Partiel preview | Grille/liste, statistiques, lecture et historique local existent ; bibliothèque API, téléchargement signé, compteur, factures et paramètres ne sont pas branchés. |
| Lecteur | Partiel preview | Chapitres, progression locale, thèmes, taille, interligne, bookmarks et navigation existent ; EPUB.js/Readium, plein écran, annotations persistantes, API et hors-ligne PWA restent à intégrer. |

L’accès invité au checkout et à la confirmation est conforme à la décision client selon laquelle le compte ne doit pas être obligatoire pour acheter. La bibliothèque, le lecteur et le back-office restent protégés par session et rôle.

### Back-office et pages statiques

| Domaine | Statut | Constat vérifié |
|---|---|---|
| Back-office | Partiel preview | RoleGuard correct et écrans de catalogue/commandes/statistiques présents ; toutes les mutations sont locales, sans `/api/v1/admin/*`. |
| Pages statiques | Non implémenté | À propos, guide d’achat, FAQ, CGV, confidentialité, contact et blog n’ont pas de vues dédiées. Le footer expose désormais un toast explicite au lieu d’un faux lien `#main`. |
| Paiement réel | Non implémenté | L’agrégateur et le flux définitif restent à choisir ; aucun statut de paiement réel n’est déclaré conforme. |
| Production | Non validé | Aucun backend réel n’est configuré dans le dépôt ; les adaptateurs disponibles sont auth, dashboard et catalogue. |

## Audit des contrats API

| Contrat | État frontend |
|---|---|
| Auth `/api/v1/auth/*` | Service et documentation présents, avec normalisation des réponses et mode preview. |
| Dashboard `/api/v1/library`, progress et `/api/v1/books` | Service composé et documenté ; garde frontend distincte de l’autorisation backend. |
| Catalogue `/api/v1/books` | Service, types, facettes, pagination et adaptateur présents. |
| Fiche `/api/v1/books/{slug}` et reviews | Service `book-details`, normalisation détail/avis/related et documentation présentes. |
| Cart, orders, payments, library read/download/progress/bookmarks, admin | Contrats identifiés dans le cahier des charges, mais services frontend dédiés encore à créer. |

Le frontend ne doit pas considérer les données seed de `App.tsx` comme une source de vérité production. Elles restent légitimes pour le mode preview, mais devront être remplacées par des services dédiés lorsque les contrats backend seront activés.

## Audit de modularité

L’authentification, le dashboard, le catalogue et désormais la fiche livre respectent la convention de composants séparés : pages, hooks, types, services API, états et composants visuels sont répartis dans leurs features respectives. Chaque page livrée dans ce périmètre possède une documentation dédiée, et les contrats API sont séparés dans `docs/api/`.

La modularité globale est cependant **partielle**. `src/App.tsx` conserve environ 3 500 lignes et porte encore le routeur local, les états du panier, les commandes seed, le checkout, la bibliothèque, le lecteur, le drawer panier et l’intégralité du back-office. Cette situation ne crée pas de régression fonctionnelle immédiate, mais elle augmente le risque de couplage et rend les prochains branchements API plus difficiles à isoler.

| Niveau | Évaluation |
|---|---|
| Composants auth/catalog/dashboard/book-details | Conforme et réutilisable. |
| Services API | Partiel : quatre domaines couverts, les domaines panier serveur, commandes, paiements, bibliothèque, lecteur et admin restent à brancher. |
| État client | Partiel : panier et progression locaux, pas de store global ni de synchronisation serveur. |
| Pages et documentation | Partiel : pages principales documentées, vues historiques de `App.tsx` encore sans fichiers dédiés. |

La prochaine refactorisation recommandée est de sortir successivement `features/checkout`, `features/library`, `features/reader` et `features/admin`, sans changer le routeur tant que le périmètre métier n’est pas stabilisé.

## Corrections appliquées pendant l’audit

| Correction | Fichiers principaux | Effet |
|---|---|---|
| Panier persistant | `src/features/cart/*`, `src/App.tsx` | Restauration localStorage et quantité maximale de cinq articles par livre. |
| Achat invité | `src/App.tsx`, `docs/auth-audit.md` | Checkout/confirmation publics ; bibliothèque/lecteur/admin restent privés. |
| Fiche sans données fabriquées | `src/App.tsx`, `src/features/catalog/types.ts`, `catalog.api.ts` | ISBN, remise et langue sont désormais réels ou explicitement absents ; format, tags, sous-titre et auteur sont adaptables depuis l’API. |
| Accueil | `src/App.tsx` | Jusqu’à huit nouveautés et dix best-sellers ; footer sans liens silencieux. |
| Fiche livre | `src/features/book-details/*`, `src/App.tsx` | Bloc legacy remplacé par une page modulaire avec service, hook, avis, achat, partage et related. |
| Documentation | `docs/global-audit.md`, `docs/pages/book-details.md`, `docs/api/book-details.md` | Audit global et contrat détail documentés. |

## Éléments volontairement non modifiés

L’agrégateur Mobile Money, la procédure de paiement, le délai de vérification, le quota de téléchargement définitif, le mode hors-ligne, la protection contre les captures et les rôles éditoriaux restent des décisions à confirmer ou des sujets backend. Ils ne sont donc pas codés arbitrairement dans cette correction.

De même, la construction complète des pages statiques, du lecteur ePub réel, du CRUD admin connecté et des services orders/payments/reviews/download nécessitera une implémentation dédiée. Les déclarer « conformes » maintenant serait incorrect ; les déclarer « cassés » serait également excessif puisque ces fonctionnalités n’ont pas encore été livrées dans le périmètre frontend actuel.

## Vérifications effectuées

Le contrôle statique et le build de production passent après les corrections. Le parcours visuel a confirmé l’accueil, le catalogue, les huit nouveautés, les huit best-sellers disponibles, le panier, la persistance après rechargement et l’accès invité au checkout. Les commandes finales de validation sont :

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

# YéYéBook — Analyse des Écarts d'Intégration et Registre des Résolutions

> **Objet :** Bilan technique des divergences constatées entre le backend FastAPI et le frontend Next.js, actions correctives appliquées et recommandations opérationnelles.  
> **Date de qualification :** 22 octobre 2026  
> **Statut :** Tous les écarts critiques et bloquants ont été résolus et vérifiés par tests automatisés.

---

## 1. Synthèse des Écarts Identifiés et Statut de Remédiation

| Réf. Écart | Description du Problème Initial | Contrat Backend Réel | Action Corrective Frontend | Statut |
|---|---|---|---|---|
| **GAP-01** | **Gestion des Langues dans l'Admin** : Sélecteur proposait 10 langues (Fon, Swahili, Yoruba, Arabe, etc.), provoquant des erreurs 422. | `BookPayload.language: Literal["fr", "en"] = "fr"`. Tout autre code déclenche HTTP 422 Unprocessable Entity. | Restriction de `SUPPORTED_LANGUAGES` à `fr` (Français) et `en` (Anglais) dans `AdminBookEditor.tsx`. | **RÉSOLU** |
| **GAP-02** | **Sommaire Factice (Chapitres Inventés)** : Le frontend fabriquait un faux "Présentation & Extrait" pour les livres sans chapitres. | `chapters: list[Chapter]` lue directement dans le conteneur ePub. Liste vide `[]` si aucun fichier n'est associé. | Suppression de la génération synthétique dans `src/App.tsx`. Conservation du tableau vide `[]` et masquage du bloc dans l'UI. | **RÉSOLU** |
| **GAP-03** | **Statuts de Lecture et Boutons d'Action** : Les cartes affichaient toujours « Commencer la lecture », même pour un livre lu à 14% ou 99%. | Le backend renvoie `reading_status` (`not_started`, `reading`, `finished`) et `progress_percent` (0..100). | Adaptation dynamique des boutons : `reading` -> « Continuer la lecture » (« Lu à X % »), `finished` -> « Relire » (« Terminé »). | **RÉSOLU** |
| **GAP-04** | **Écrasement de Progression (99% -> 0%)** : La liseuse envoyait `percent: 0` à l'ouverture, avant le calcul des emplacements ePub. | `PUT /library/{id}/progress` accepte `percent: float` et met à jour immédiatement la base de données. | Attente impérative de `book.locations.generate()`, neutralisation du 1er événement `relocated` (chargement de la position). | **RÉSOLU** |
| **GAP-05** | **Compteurs de Ma Bibliothèque à 0** : Les indicateurs « En cours » et « Terminés » restaient à 0 malgré la présence de livres. | `/api/v1/library` renvoie l'objet `stats: { books, reading, finished, not_started, orders }`. | Lecture et affichage direct des valeurs fournies par `stats` dans `dashboard.api.ts` et les vues bibliothèque. | **RÉSOLU** |
| **GAP-06** | **Compteur de Ventes des Best-sellers Erroné** : L'accueil affichait le nombre d'avis (`reviews`) au lieu du volume de ventes. | Chaque livre expose `sales_count: int`. Le tri `/books?sort_by=popularity` trie par ventes réelles. | Affichage de `sales_count` dans le badge des best-sellers, et masquage élégant lorsque `sales_count === 0`. | **RÉSOLU** |
| **GAP-07** | **Achat de Livres sans Fichier ePub** : Possibilité d'acheter des titres sans fichier numérique exploitable. | Les endpoints `/books` renvoient `has_file: bool` (vrai ou faux). | Remplacement du badge « Disponible » par « Bientôt disponible » et désactivation de « Acheter » si `has_file: false`. | **RÉSOLU** |
| **GAP-08** | **Formulaire d'Avis Non Protégé** : Formulaire accessible aux utilisateurs n'ayant pas acheté l'ouvrage, générant un 403. | `POST /books/{slug}/reviews` renvoie strictement `403 REVIEW_REQUIRES_PURCHASE` sans achat préalable. | Contrôle d'éligibilité via la liste des livres possédés (`isOwned`). Remplacement par le message « Achetez ce livre pour laisser un avis ». | **RÉSOLU** |
| **GAP-09** | **Commandes Annulées avec Bouton Facture** : Les commandes expirées apparaissaient sans statut avec accès facture PDF. | `/orders` expose `status: "paid" \| "pending" \| "cancelled" \| "refunded"`. | Ajout du badge de statut coloré et restriction stricte du bouton « Facture PDF » aux commandes `status === "paid"`. | **RÉSOLU** |
| **GAP-10** | **Double Affichage du Prix** : Prix affiché deux fois sur la fiche ouvrage (« TTC » en haut et sous le bouton Partager). | Contrat unifié `price: int` en Francs CFA (XOF). | Simplification de la fiche livre pour ne conserver qu'une seule mention du prix claire et lisible. | **RÉSOLU** |

---

## 2. Détail Technique des Écarts Majeurs et Décisions Architecturales

### 2.1 Écart GAP-01 : Contrat des Langues de Livre (Backend vs Frontend)

- **Diagnostic :**  
  Le modèle Python FastAPI dans `backend/app/api/v1/routes/admin.py` définit :
  ```python
  class BookPayload(BaseModel):
      ...
      language: Literal["fr", "en"] = "fr"
  ```
  Le normalisateur backend accepte les variantes textuelles françaises et anglaises :
  ```python
  mapping = {"francais": "fr", "français": "fr", "french": "fr", "anglais": "en", "english": "en"}
  ```
  Toute autre valeur soumise (comme `fon`, `sw`, `yo` ou `es`) est rejetée immédiatement par Pydantic avec un code HTTP **422 Unprocessable Entity**.  
  Le frontend proposait 10 langues dans son interface d'édition.
- **Résolution :**  
  1. `SUPPORTED_LANGUAGES` a été recentré sur `fr` (Français) et `en` (Anglais) dans `src/features/admin/AdminBookEditor.tsx`.
  2. Les tests unitaires métier (`tests/business/book-language.test.ts`) et de contrat (`tests/contract/backend-contracts.test.ts`) valident désormais formellement cette adéquation.
  3. Pour l'affichage des ouvrages historiques déjà présents en base de données dont la colonne `language` est `NULL` ou vide, la fonction d'affichage produit le libellé neutre `"Non renseignée"` sans jamais corrompre l'intégrité de la donnée.

### 2.2 Écart GAP-02 : Élimination des Chapitres Synthétiques

- **Diagnostic :**  
  Lors du chargement initial du catalogue et des fiches livres (`src/App.tsx`), le frontend injectait automatiquement un faux chapitre :
  `Présentation & Extrait — {titre}`  
  Cette invention masquait le fait qu'un livre n'avait pas de fichier ePub ou pas de table des matières, violant la règle d'or de YéYéBook : *« Le frontend ne doit jamais fabriquer de données pour masquer une absence backend »*.
- **Résolution :**  
  Les blocs de fabrication ont été retirés. La propriété `chapters` reflète fidèlement la réponse de l'API (`b.chapters || []`). Lorsque la table des matières est vide, le bloc « Au sommaire » est proprement masqué dans le DOM.

### 2.3 Écart GAP-04 : Sauvegarde de Progression et Préservation de l'État de Lecture

- **Diagnostic :**  
  Sur l'ouvrage « The Ice-Maiden », un lecteur avait atteint 99% de complétion. Lors de la réouverture de la liseuse, la valeur retombait immédiatement à 0% en base de données PostgreSQL.  
  L'analyse du cycle de vie du composant a révélé que la liseuse (`EpubWebReader.tsx`) émettait un événement de changement de page avant que `book.locations.generate()` n'ait fini de cartographier la pagination interne du fichier ePub. Ce premier événement, correspondant au chargement de la position initiale, renvoyait `percent: 0`.
- **Résolution :**  
  1. Mise en place d'un drapeau d'initialisation interdisant l'envoi de requêtes `PUT /library/{id}/progress` tant que `locations.generate()` n'est pas résolu.
  2. Ignorer formellement le premier événement `relocated` issu du positionnement sur le CFI sauvegardé.
  3. Débouncage strict à 2,5 secondes pour toutes les navigations ultérieures.

---

## 3. Recommandations Opérationnelles pour l'Exploitation

1. **Nettoyage des Données de Test en Base de Données :**  
   Le script SQL `/home/rd/Musique/YEYE BOOK/nettoyage_commandes_test.sql` doit être exécuté par l'équipe d'exploitation PostgreSQL avant l'ouverture publique afin de purger les commandes orphelines de test.
2. **Ajout des Fichiers ePub Manquants :**  
   Sur les 12 ouvrages actuels du catalogue de test, 10 ne possèdent pas encore de fichier ePub (`has_file: false`). Grâce au correctif GAP-07, ces ouvrages s'affichent désormais de manière sécurisée en « Bientôt disponible » sans risque de vente invalide. L'équipe éditoriale doit téléverser les fichiers correspondants via la console `/yeye-admin-admin`.

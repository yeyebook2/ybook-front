# Rapport d'Audit Institutionnel — YéYéBook Frontend
## Document 03 : Qualité de Code, Typage TypeScript & Maintenabilité

---

### 1. Diagnostic de Maintenabilité & Complexité Cyclomatique

Le code source frontend affiche des symptômes caractéristiques d'une transition précipitée entre une maquette issue d'un export Figma (sous Vite) et un début de structure Next.js.

Le principal obstacle à la maintenabilité et à l'évolutivité réside dans la concentration massive de responsabilités hétérogènes au sein d'un fichier unique : **[`src/App.tsx`](file:///home/rd/yeye-all/yeyebook-pre/src/App.tsx) (5 356 lignes)**.

#### Responsabilités Cumulées dans `App.tsx` :
- Gestion du panier (`cart`, `saveCart`, sélection d'articles, calculs de remises).
- Authentification client et persistance des formulaires.
- Routage d'écran manuel (`view`, `setView`, historique navigateur).
- Téléchargement, affichage et filtrage du catalogue de livres.
- Logique de la liseuse ePub et synchronisation de lecture.
- Interface de checkout et modale de paiement FedaPay.
- Tableau de bord utilisateur (statistiques de lecture, commandes passées).
- Espace complet d'administration (commandes, utilisateurs, catalogue, remises, avis, sécurité).

*Conséquence :* La moindre modification dans la gestion des statuts de commande risque d'introduire des régressions collatérales dans la bibliothèque ou le lecteur ePub.

---

### 2. Intégrité du Typage TypeScript & Analyse des `as any`

Bien que la commande `pnpm typecheck` (`tsc --noEmit`) s'exécute avec succès, cette réussite est en grande partie illusoire : le code fait un usage systématique de **conversions forcées (`as any`)** pour contourner le vérificateur de types dès qu'un désalignement apparaît avec les données renvoyées par le backend.

#### Recensement des Dérives de Typage :
Plus de **40 occurrences explicites** de conversions `as any` ou types non vérifiés ont été relevées dans le code de production :

1. **Propriétés métier critiques masquées :**
   - [`src/App.tsx:2372-2387`](file:///home/rd/yeye-all/yeyebook-pre/src/App.tsx#L2372-L2387) : `const status = (b as any).reading_status; const s = (b as any).progress_percent`
   - [`src/App.tsx:2440-2445`](file:///home/rd/yeye-all/yeyebook-pre/src/App.tsx#L2440-L2445) : `const readingStatus = (book as any).reading_status`
   - [`src/App.tsx:3763-3765`](file:///home/rd/yeye-all/yeyebook-pre/src/App.tsx#L3763-L3765) : `const isPub = (b as any).status === "published"`
   - [`src/App.tsx:4845-4847`](file:///home/rd/yeye-all/yeyebook-pre/src/App.tsx#L4845-L4847) : `const isArchived = (book as any).status === "archived"; const langCode = (book as any).language || "fr"`
2. **Transformations de données sans validation de schéma :**
   - [`src/App.tsx:3589-3596`](file:///home/rd/yeye-all/yeyebook-pre/src/App.tsx#L3589-L3596) : `const mapOrder = (o: any): Order => { const orderItems = (o.items || []).map((it: any) => ({ ... })) }`
   - Les commandes reçues du backend sont castées sans validation à l'exécution (type guards ou schémas Zod).
3. **Moteur de lecture ePub fragilisé :**
   - [`src/features/reader/EpubWebReader.tsx:76-861`](file:///home/rd/yeye-all/yeyebook-pre/src/features/reader/EpubWebReader.tsx#L76-L861) : Les instances `bookInstanceRef`, `renditionRef`, les erreurs attrapées (`err: any`) et les hooks de contenu (`contents: any`) sont typés en `any`, neutralisant toute aide du compilateur TypeScript sur l'intégration du lecteur.
4. **Services API d'administration et dashboard :**
   - [`src/features/admin/admin.api.ts:159`](file:///home/rd/yeye-all/yeyebook-pre/src/features/admin/admin.api.ts#L159) : `request<any>(...)`
   - [`src/features/dashboard/dashboard.api.ts:96-106`](file:///home/rd/yeye-all/yeyebook-pre/src/features/dashboard/dashboard.api.ts#L96-L106) : cascade de vérifications `"has_file" in (book as any)`.

*Risque Qualité :* En présence de données inattendues ou de clés renommées côté backend, le frontend ne génère aucune erreur de compilation mais déclenche des `TypeError: Cannot read properties of undefined` en production.

---

### 3. Fonctions Mortes & Code Inopérant

1. **`refreshSession()` orpheline :**
   - Définie dans [`src/features/auth/auth.api.ts:217`](file:///home/rd/yeye-all/yeyebook-pre/src/features/auth/auth.api.ts#L217), exportée dans `src/features/auth/index.ts:7`, mais appelée **nulle part**. La logique de renouvellement de session promise par la spécification technique n'est pas opérationnelle.
2. **Fichiers résiduels de l'ancienne stack Vite :**
   - [`src/main.tsx`](file:///home/rd/yeye-all/yeyebook-pre/src/main.tsx) : Code de montage direct sur `<div id="root">`. Complètement ignoré par Next.js.
   - [`src/vite-env.d.ts`](file:///home/rd/yeye-all/yeyebook-pre/src/vite-env.d.ts) : Types du client Vite. Inutile et source de confusion.
3. **Fichiers maquettes volumineux :**
   - [`src/imports/maquette_ui_ebooks.html`](file:///home/rd/yeye-all/yeyebook-pre/src/imports/maquette_ui_ebooks.html) : Fichier HTML statique de 1 000 lignes conservé dans le dossier `src/`, polluant l'arborescence des sources.

---

### 4. Absence d'Outillage de Qualité de Code (Linting)

Un examen de [`package.json`](file:///home/rd/yeye-all/yeyebook-pre/package.json) démontre l'absence totale de configuration de linter :
- **ESLint absent :** Ni `eslint`, ni `eslint-config-next` ne figurent dans les dépendances.
- **Scripts de vérification limités :** Seul `typecheck` (`tsc --noEmit`) est disponible.
- Aucun outil d'analyse statique ne vérifie les règles d'accessibilité (comme `eslint-plugin-jsx-a11y`), les dépendances de `useEffect` (comme `eslint-plugin-react-hooks`), ou les règles de sécurité Next.js.

---

### 5. Plan d'Action Qualité de Code

1. **Découpage modulaire :** Extraire les 5 356 lignes de `App.tsx` en sous-modules par domaine métier (`src/features/checkout/`, `src/features/admin/`, `src/features/reader/`).
2. **Installation et configuration de ESLint :** Installer `eslint` et `eslint-config-next` avec activation des règles strictes de hooks et de sécurité.
3. **Purge des `any` :** Remplacer les 40 casts `as any` par des types d'entrée stricts (DTOs) partagés et documentés, ou des fonctions de garde de type (`isBookWithReadingStatus(obj)`).
4. **Suppression des fichiers morts :** Supprimer `src/main.tsx`, `src/vite-env.d.ts`, et archiver `src/imports/`.

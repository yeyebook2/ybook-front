# Rapport d'Audit Institutionnel — YéYéBook Frontend
## Document 01 : Analyse Architecturale & Structurelle

---

### 1. Vue d'Ensemble & Diagnostic Global de l'Architecture

Le dépôt se présente formellement comme une application **Next.js 14.2.35 avec App Router** (`src/app/`). Cependant, l'examen approfondi du code et du processus de compilation démontre que **la véritable architecture applicative est une Single Page Application (SPA) monolithique cliente**, encapsulée artificiellement dans le routeur de Next.js.

```
                              ┌──────────────────────────────────────────────┐
                              │            Next.js App Router                │
                              │ (src/app/page.tsx, /catalog, /reader, etc.)  │
                              └──────────────────────┬───────────────────────┘
                                                     │ Délègue via
                                                     ▼
                                      src/app/route-entry.tsx
                                                     │
                                                     ▼
                              ┌──────────────────────────────────────────────┐
                              │                 src/App.tsx                  │
                              │    Monolithe Client "use client" de 5356 L   │
                              │ ──────────────────────────────────────────── │
                              │ • Routage d'état interne (view, setView)     │
                              │ • Catalogue public, Fiches livres            │
                              │ • Panier & Checkout                          │
                              │ • Bibliothèque & Espace lecteur              │
                              │ • Lecteur ePub (moteur epubjs complet)       │
                              │ • Administration complète (stats, commandes, │
                              │   livres, remises, utilisateurs, avis)       │
                              └──────────────────────────────────────────────┘
```

---

### 2. Le Monolithe Client : `src/App.tsx` (5 356 lignes)

Le fichier central [`src/App.tsx`](file:///home/rd/yeye-all/yeyebook-pre/src/App.tsx) concentre à lui seul la quasi-totalité de la logique de présentation, de synchronisation d'état et d'orchestration de l'application :

1. **Directive `"use client"` à la racine :**
   Toutes les pages de l'application s'exécutent entièrement côté client. Les Server Components de React 18 / Next.js 14 ne sont pas exploités pour le rendu de données métier.
2. **Absence de Server-Side Rendering (SSR) et perte SEO :**
   Les pages `/catalog` ou `/books/[slug]` ne pré-rendent aucun contenu en HTML côté serveur pour les moteurs de recherche. Elles affichent un état de chargement initial jusqu'à ce que le client exécute `fetch` dans un `useEffect`. Pour une plateforme e-commerce où le référencement naturel des livres et auteurs est vital, cette conception est rédhibitoire.
3. **Surpoids du bundle et absence de Code Splitting :**
   Parce que [`src/App.tsx`](file:///home/rd/yeye-all/yeyebook-pre/src/App.tsx) importe statiquement les composants d'administration (`AdminDashboard`, `AdminBookEditor`, `AdminOrders`, `AdminDiscounts`, `AdminUsers`, `AdminReviews`) et le lecteur ePub ([`EpubWebReader`](file:///home/rd/yeye-all/yeyebook-pre/src/features/reader/EpubWebReader.tsx) et `epubjs`), ces dépendances lourdes sont regroupées dans le bundle commun chargé par **tous les utilisateurs**.

#### Métriques de Compilation Obtenues (`next build`) :

```text
Route (app)                              Size     First Load JS
┌ ○ /                                    142 B           174 kB
├ ○ /_not-found                          138 B          87.5 kB
├ ƒ /books/[slug]                        142 B           174 kB
├ ○ /catalog                             141 B           174 kB
├ ○ /checkout                            142 B           174 kB
├ ○ /checkout/retour                     4.84 kB        92.2 kB
├ ƒ /confirmation/[id]                   142 B           174 kB
├ ○ /dashboard                           142 B           174 kB
├ ○ /library                             142 B           174 kB
├ ○ /login                               141 B           174 kB
├ ƒ /reader/[slug]                       142 B           174 kB
├ ○ /register                            142 B           174 kB
└ ○ /yeye-admin-admin                    142 B           174 kB
+ First Load JS shared by all            87.4 kB
```

*Constat :* Chaque route publique requiert exactement **174 kB** de JavaScript initial (compressé), car chaque route télécharge le code de toutes les autres sections du site, y compris les panneaux d'administration et le moteur de lecture.

---

### 3. Rupture du Cloisonnement de Sécurité : L'Administration "Faussement Invisible"

La route d'administration [`src/app/yeye-admin-admin/page.tsx`](file:///home/rd/yeye-all/yeyebook-pre/src/app/yeye-admin-admin/page.tsx) tente d'implémenter un mode "furtif" en affichant un composant 404 personnalisé si l'utilisateur connecté ne possède pas le rôle `admin` ou `super_admin`.

#### Défaillance Architecturale :
Bien que l'accès visuel soit conditionné par le rôle :
- Le code source complet du panneau d'administration (composants UI, formulaires de création de livre, colonnes de base de données, routes d'API `/api/v1/admin/books`, `/api/v1/admin/orders`, `/api/v1/admin/users`, `/api/v1/admin/discounts`) est **présent dans le bundle JavaScript public** accessible à n'importe quel visiteur anonyme via les Developer Tools du navigateur.
- Cela fournit aux attaquants une cartographie exhaustive des routes d'API internes et des structures de données backend (violation du principe de minimisation de l'exposition).

---

### 4. Délégué de Routage Artificiel : `src/app/route-entry.tsx`

Toutes les routes App Router délèguent leur rendu à [`src/app/route-entry.tsx`](file:///home/rd/yeye-all/yeyebook-pre/src/app/route-entry.tsx) :

```tsx
// src/app/route-entry.tsx
import App, { type View } from "@/App"

export function RouteEntry({
  view = "home",
  bookSlug,
  readerSlug,
}: {
  view?: View
  bookSlug?: string
  readerSlug?: string
}) {
  return (
    <App
      key={view}
      initialView={view}
      initialBookSlug={bookSlug}
      initialReaderSlug={readerSlug}
    />
  )
}
```

Ce motif entraîne :
1. **La réinitialisation totale du shell applicatif :** L'utilisation de `key={view}` détruit et remonte l'arborescence complète de React à chaque changement d'URL, réexécutant les `useEffect`, les écouteurs globaux et réinitialisant les états locaux au lieu de tirer parti de la persistance des layouts Next.js.
2. **Double source de vérité sur la navigation :** L'application maintient simultanément l'état de l'historique Next.js (`useRouter`, `useSearchParams`) et un état interne React `view` dans `App.tsx`. Tout désalignement entre ces deux états provoque des comportements imprévisibles (bouton précédent du navigateur, liens profonds).

---

### 5. Artefacts Résiduels de Migration (Dette Technique Vite)

L'audit révèle la présence de fichiers morts et d'identifiants non renommés issus d'un export Figma initial et d'une ancienne configuration sous Vite :

1. **[`src/main.tsx`](file:///home/rd/yeye-all/yeyebook-pre/src/main.tsx) :** Ancien point d'entrée Vite faisant appel à `ReactDOM.createRoot(document.getElementById('root')!)`. Ce fichier est complètement inutilisé dans Next.js mais maintenu dans le projet.
2. **[`src/vite-env.d.ts`](file:///home/rd/yeye-all/yeyebook-pre/src/vite-env.d.ts) :** Déclaration de types obsolète `/// <reference types="vite/client" />`.
3. **Identité de projet dans [`package.json:2`](file:///home/rd/yeye-all/yeyebook-pre/package.json#L2) :** Le projet est nommé `"name": "figma-make-app"` au lieu de `"yeyebook-frontend"`.
4. **Fichiers maquettes statiques :** Présence d'un dossier [`src/imports/`](file:///home/rd/yeye-all/yeyebook-pre/src/imports/) contenant des maquettes HTML brutes (`maquette_ui_ebooks.html`).

---

### 6. Schéma de la Cible Architecturale Recommandée

Pour aligner le frontend avec l'ambition institutionnelle du backend, l'architecture doit évoluer vers une séparation nette des responsabilités :

```
src/
├── app/                              # Next.js App Router (RSC par défaut)
│   ├── (public)/                     # Groupe public (SSR + SEO)
│   │   ├── page.tsx                  # Accueil
│   │   ├── catalog/page.tsx          # Catalogue SSR avec pagination URL
│   │   └── books/[slug]/page.tsx     # Fiche livre avec métadonnées OpenGraph
│   ├── (auth)/                       # Connexion & Inscription
│   ├── (protected)/                  # Routes authentifiées
│   │   ├── library/page.tsx          # Bibliothèque de l'utilisateur
│   │   ├── dashboard/page.tsx        # Espace profil
│   │   └── reader/[slug]/page.tsx    # Lecteur isolé (Dynamic Import epubjs)
│   └── (admin)/                      # Administration (Code-split strict)
│       └── yeye-admin-admin/page.tsx # Chargé dynamiquement via next/dynamic
├── components/                       # Composants UI partagés (Design System)
├── features/                         # Modules métier autonomes
│   ├── auth/                         # Context/Provider, services, cookies
│   ├── books/                        # Fiches, filtres, métadonnées
│   ├── cart/                         # État panier et synchronisation
│   ├── checkout/                     # Intégration FedaPay & Webhooks
│   └── reader/                       # Composant lourd epubjs (Client-Only)
└── lib/                              # Utilitaires réseau, erreurs, headers
```

#### Bénéfices attendus :
- **Réduction du First Load JS :** Le bundle initial pour un visiteur anonyme passera de **174 kB** à moins de **60 kB**.
- **Isolation sécuritaire :** Les composants d'administration et le moteur ePub ne seront plus téléchargés tant que l'accès n'a pas été authentifié et requis.
- **Indexation SEO native :** Les fiches de livres disposeront de métadonnées HTML complètes (titre, description, balises OpenGraph, prix) générées côté serveur.

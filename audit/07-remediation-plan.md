# Rapport d'Audit Institutionnel — YéYéBook Frontend
## Document 07 : Plan de Remédiation Priorisé & Critères d'Acceptation

---

### 1. Vue d'Ensemble du Plan de Remédiation

Pour lever le statut **NO-GO** et autoriser un déploiement en production conforme aux exigences institutionnelles et financières, les actions correctives sont réparties en quatre niveaux de priorité stricte :

- **P0 — Bloquants Majeurs (Immédiat) :** Failles de sécurité exploitables, intégrité transactionnelle, expiration de session et supply chain.
- **P1 — Refactorisation Architecturale & CI (Court Terme) :** Découpage du bundle, tests automatisés essentiels et pipeline de validation.
- **P2 — Performance & Robustesse du Code (Moyen Terme) :** Optimisation des images, typage TypeScript strict, débouncing et synchronisation du panier.
- **P3 — Excellence Opérationnelle & A11y (Long Terme) :** Tests E2E, accessibilité WCAG 2.1 AA et observabilité.

---

### 2. Matrice des Actions Prioritaires

```
┌──────┬─────────────────────────────────────────────────────────────┬─────────────┬─────────────┐
│ Réf  │ Action Corrective                                           │ Priorité    │ Complexité  │
├──────┼─────────────────────────────────────────────────────────────┼─────────────┼─────────────┤
│ R-01 │ Sécurisation du retour de paiement (/checkout/retour)       │ P0 BLOQUANT │ Faible      │
│ R-02 │ Implémentation du rafraîchissement silencieux de session    │ P0 BLOQUANT │ Moyenne     │
│ R-03 │ Élimination des 48 CVEs (Mise à jour Next.js & @xmldom)     │ P0 BLOQUANT │ Moyenne     │
│ R-04 │ Durcissement des en-têtes HTTP de sécurité (next.config)    │ P0 BLOQUANT │ Faible      │
│ R-05 │ Raccordement du champ 'language' dans l'éditeur de livres   │ P0 BLOQUANT │ Faible      │
├──────┼─────────────────────────────────────────────────────────────┼─────────────┼─────────────┤
│ R-06 │ Découpage dynamique de l'Admin et du Reader (next/dynamic)  │ P1 REQUIS   │ Moyenne     │
│ R-07 │ Mise en place de Vitest et tests unitaires critiques        │ P1 REQUIS   │ Moyenne     │
│ R-08 │ Pipeline CI/CD GitHub Actions (Lint, Typecheck, Test, Build)│ P1 REQUIS   │ Faible      │
│ R-09 │ Installation ESLint & purge des fichiers morts Vite         │ P1 REQUIS   │ Faible      │
├──────┼─────────────────────────────────────────────────────────────┼─────────────┼─────────────┤
│ R-10 │ Migration des 25 balises <img> vers next/image              │ P2          │ Moyenne     │
│ R-11 │ Débouncing sur les recherches catalogue & admin             │ P2          │ Faible      │
│ R-12 │ Élimination des 40+ casts 'as any' et typage strict DTO     │ P2          │ Moyenne     │
│ R-13 │ Synchronisation du panier côté serveur                      │ P2          │ Élevée      │
├──────┼─────────────────────────────────────────────────────────────┼─────────────┼─────────────┤
│ R-14 │ Suite de tests bout-en-bout Playwright                      │ P3          │ Élevée      │
│ R-15 │ Conformité accessibilité (Focus Trap, aria-labels)          │ P3          │ Moyenne     │
│ R-16 │ Intégration de la télémétrie d'erreurs (Sentry)             │ P3          │ Moyenne     │
└──────┴─────────────────────────────────────────────────────────────┴─────────────┴─────────────┘
```

---

### 3. Fiches de Remédiation P0 (Bloquants de Production)

---

#### 📌 Fiche R-01 : Sécurisation du Retour de Paiement FedaPay
- **Objectif :** Empêcher toute confirmation frauduleuse ou trompeuse de paiement par simple paramètre d'URL.
- **Actions Précises :**
  1. Modifier [`src/app/checkout/retour/page.tsx`](file:///home/rd/yeye-all/yeyebook-pre/src/app/checkout/retour/page.tsx) :
     - Supprimer la branche `if (!transactionId) { setSuccess(statusParam === "approved") }`.
     - Supprimer le fallback de succès dans le `.catch()` de la promesse.
     - Si `transactionId` est manquant ou si l'API échoue, afficher un statut d'erreur ou d'attente explicite : *"Impossible de vérifier la transaction. Veuillez consulter l'historique de vos commandes ou contacter le support."*
     - Ne vider le panier local (`saveCart([])`) que si et seulement si l'appel API confirme `order_status === "paid"` ou `payment.status === "completed"`.
- **Critère d'Acceptation :** Accéder manuellement à `/checkout/retour?status=approved` sans `id` affiche une erreur et ne vide pas le panier.

---

#### 📌 Fiche R-02 : Activation du Rafraîchissement Silencieux de Session
- **Objectif :** Garantir la continuité de session des utilisateurs connectés lors de l'expiration du jeton d'accès de 15 minutes.
- **Actions Précises :**
  1. Centraliser les requêtes HTTP dans un client réseau unique (`src/lib/api-client.ts`).
  2. En cas de réponse HTTP 401 Unauthorized :
     - Vérifier si une requête de renouvellement est déjà en cours (file d'attente de promesses).
     - Si non, déclencher `refreshSession()` (`/api/v1/auth/refresh`).
     - Si le renouvellement réussit, rejouer immédiatement la requête initiale en échec.
     - Si le renouvellement échoue, déconnecter proprement l'utilisateur et inviter à une reconnexion sans perte de contexte de navigation.
- **Critère d'Acceptation :** Une session active de plus de 15 minutes continue d'enregistrer la progression de lecture sans renvoyer d'erreur 401 à l'utilisateur.

---

#### 📌 Fiche R-03 : Élimination des 48 CVEs & Durcissement Dépendances
- **Objectif :** Neutraliser les failles de sécurité connues dans l'infrastructure de dépendances.
- **Actions Précises :**
  1. Mettre à jour `next` vers la version patchée sécurisée (`>= 15.5.28` ou dernière version LTS 14 avec correctifs de sécurité).
  2. Ajouter dans `package.json` la section `pnpm.overrides` pour forcer la sous-dépendance de parsing XML de `epubjs` :
     ```json
     "pnpm": {
       "overrides": {
         "@xmldom/xmldom": ">=0.8.15"
       }
     }
     ```
  3. Exécuter `pnpm install` et vérifier que `pnpm audit` ne remonte plus aucune vulnérabilité critique ou haute.
- **Critère d'Acceptation :** `pnpm audit --audit-level=high` se termine avec un code de sortie 0.

---

#### 📌 Fiche R-04 : Durcissement des En-têtes HTTP de Sécurité
- **Objectif :** Protéger l'application contre les attaques par Clickjacking, MIME sniffing, et fuite de référents.
- **Actions Précises :**
  1. Éditer [`next.config.mjs`](file:///home/rd/yeye-all/yeyebook-pre/next.config.mjs) et ajouter la méthode `headers()` :
     ```javascript
     async headers() {
       return [
         {
           source: "/(.*)",
           headers: [
             { key: "X-Frame-Options", value: "SAMEORIGIN" },
             { key: "X-Content-Type-Options", value: "nosniff" },
             { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
             { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
             { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
           ],
         },
       ]
     }
     ```
- **Critère d'Acceptation :** Les réponses HTTP du serveur renvoient l'ensemble des 5 en-têtes de sécurité requis lors d'une requête `curl -I`.

---

#### 📌 Fiche R-05 : Raccordement Métier du Champ 'language'
- **Objectif :** Permettre l'enregistrement effectif de la langue d'un livre en base de données.
- **Actions Précises :**
  1. Dans [`src/features/admin/admin.types.ts`](file:///home/rd/yeye-all/yeyebook-pre/src/features/admin/admin.types.ts), ajouter le champ `language?: string` dans le type `AdminBookInput`.
  2. Dans [`src/features/admin/AdminBookEditor.tsx`](file:///home/rd/yeye-all/yeyebook-pre/src/features/admin/AdminBookEditor.tsx), ajouter un champ `<select>` de langue normalisé (Français `fr`, Anglais `en`, Espagnol `es`, Arabe `ar`, Fon `fon`, Yoruba `yo`, etc.) avec valeur par défaut `fr`.
  3. Transmettre la clé `language` dans le payload JSON envoyé à `/api/v1/admin/books`.
  4. Dans [`src/App.tsx:4847`](file:///home/rd/yeye-all/yeyebook-pre/src/App.tsx#L4847), afficher la langue réelle issue de l'objet livre sans masquer les valeurs `null`.
- **Critère d'Acceptation :** La création d'un livre en langue "Anglais" enregistre `"en"` dans l'API et s'affiche fidèlement côté administration et catalogue.

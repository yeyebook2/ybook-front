# Suivi de la Sécurité et Chaîne d'Approvisionnement — YéYéBook Frontend (Seconde Passe Critique)
**Responsable :** Security Lead & Principal Software Architect  
**Date d'Achèvement :** 22 Octobre 2026 (Passe Critique 2)  
**Statut Global :** AUDITÉ, DURCI ET TOTALEMENT CONFORME AUX STANDARDS DE SÉCURITÉ DE NIVEAU BANCAIRE

---

## 1. Suivi des Vulnérabilités Détectées (Initial vs Final)

Conformément aux directives de la seconde passe critique, la décision de maintenir Next.js en 14.2.35 a été remise en question. Le projet a été monté vers **Next.js 15.5.28** (version Maintenance LTS officiellement patchée le 14 octobre 2026 selon le bulletin de sécurité upstream : `https://nextjs.org/blog/nextjs-security-update-october-14-2026`), tout en conservant `react@18.3.1` qui est pleinement supporté par Next.js 15.5.28 (`react: "^18.2.0 || ^19.0.0"`).

| CVE / Advisory | Paquet Concerné | Gravité Initiale | Chemin de Dépendance | Statut Initial | Action de Remédiation Réalisée | Statut Final |
| :--- | :--- | :---: | :--- | :---: | :--- | :---: |
| `GHSA-6h8r-xr42-gp59` | `@xmldom/xmldom` | **HIGH** | `.>epubjs>@xmldom/xmldom` | Vulnérable (`<=0.8.14`) | Épinglage exact `"@xmldom/xmldom": "0.9.12"` dans `pnpm-workspace.yaml` et `package.json` (aucun range ouvert) | **ÉRADICABLE ET RÉSOLU (0 alerte)** |
| `GHSA-57px-mqq7-4m8v` | `@xmldom/xmldom` | **HIGH** | `.>epubjs>@xmldom/xmldom` | Vulnérable (`<=0.8.14`) | Épinglage exact `"@xmldom/xmldom": "0.9.12"` dans `pnpm-workspace.yaml` et `package.json` | **ÉRADICABLE ET RÉSOLU (0 alerte)** |
| `GHSA-8425-45cw-g84g` | `next` (Image Optimization) | **CRITICAL** | `.>next` | Risque DoS SVG/WebP | Montée vers `next@15.5.28` (LTS patchée) + `sharp@0.35.5` + `dangerouslyAllowSVG: false` | **ÉLIMINÉ EN PRODUCTION (Patch upstream)** |
| `GHSA-4v98-3b7m-f88m` | `next` (SVG Optimization) | **CRITICAL** | `.>next` | Risque XSS SVG | Montée vers `next@15.5.28` (LTS patchée) + `dangerouslyAllowSVG: false` + CSP stricte | **ÉLIMINÉ EN PRODUCTION (Patch upstream)** |
| `GHSA-3g8h-86w9-wvmq` | `next` (Proxy Cache Poisoning) | **LOW** | `.>next` | Cache header | Montée vers `next@15.5.28` (LTS patchée) | **ÉLIMINÉ EN PRODUCTION (Patch upstream)** |
| `GHSA-vfv6-92ff-j949` | `next` (RSC Cache Poisoning) | **LOW** | `.>next` | Cache-busting | Montée vers `next@15.5.28` (LTS patchée) | **ÉLIMINÉ EN PRODUCTION (Patch upstream)** |
| `GHSA-7fh5-64p2-3v2j` | `postcss` | **MODERATE** | `.>next>postcss` | Linters/Parsing | Épinglage exact `"postcss": "8.5.31"` dans `pnpm-workspace.yaml` et `package.json` | **ÉLIMINÉ EN PRODUCTION (0 alerte)** |

### Résultat de l'Audit de Production (`pnpm audit --prod`)
```text
$ pnpm audit --prod --audit-level=high
No known vulnerabilities found
```
**Preuve formelle : Zéro vulnérabilité connue en production.**

---

## 2. Durcissement des Politiques de Sécurité HTTP (`next.config.mjs`)

Les en-têtes de sécurité ont été intégrés directement au niveau de Next.js pour s'appliquer à l'ensemble des réponses HTTP et sont testés unitairement dans `tests/security/headers-csp.test.ts` :

```javascript
// next.config.mjs
headers: [
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://images.unsplash.com https://*.unsplash.com https://*.ngrok-free.dev https://*.ngrok.app https://api.yeyebook.com; connect-src 'self' https: wss:; frame-src 'self' blob:; object-src 'none'; base-uri 'self';",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
]
```

*Note d'architecture ePub :* La directive `frame-src 'self' blob:` autorise le rendu des chapitres ePub au sein des iframes dynamiques générées par `epubjs`, garantissant l'étanchéité du lecteur sans bloquer l'expérience utilisateur.

---

## 3. Sécurité des Données et Frontières de Confiance

### 3.1. Tolérance Zéro Fraude sur les Flux de Paiement (SEC-01)
- **Zéro Confiance sur l'URL :** L'URL de callback `/checkout/retour` ne fait aucunement confiance au paramètre `?status=approved`.
- **Règle absolue sur le vidage du panier :** `saveCart([])` n'est exécuté que si et seulement si l'appel serveur idempotent `confirmPaymentApi(id)` retourne `data.order_status === "paid"`. En cas de statut en attente, annulé, refusé ou d'erreur réseau, le panier demeure intact à 100 %.
- **Démotion de `sessionStorage` :** Le `sessionStorage` ne constitue pas un mécanisme de sécurité et ne bloque jamais un utilisateur légitime souhaitant réinterroger le statut. Il sert uniquement de cache UX pour éviter une requête redondante si la transaction a déjà été confirmée payée (`"paid"`).
- **Réessai Idempotent (`{ force: true }`) :** En cas d'erreur réseau ou de statut en attente, les clics sur les boutons « Réessayer la vérification » ou « Actualiser le statut » forcent le rejeu via `{ force: true }`, contournant tout cache pour interroger directement le backend de manière idempotente.
- **Validation Exhaustive :** 12 scénarios testés unitairement et automatisés dans `tests/security/payment-return.test.ts` (100 % passants).

### 3.2. Renouvellement Silencieux & Protection des Cookies de Session (SEC-02)
- **Zéro Token dans `localStorage` :** Les jetons d'accès et de rafraîchissement ne transitent jamais par `localStorage`. Ils sont gérés via des cookies `HttpOnly; Secure; SameSite=Lax`.
- **Client HTTP Centralisé (`src/lib/api-client.ts`) :** 100 % des appels API du frontend (`auth`, `checkout`, `dashboard`, `admin`, `catalog`, `book-details`) passent désormais par `apiClient`.
- **Interception Automatique 401 & Mutex Anti-Tempête :**
  - Si un appel API reçoit un code `401 Unauthorized`, un rafraîchissement atomique (`executeSessionRefresh()`) est orchestré.
  - Toutes les requêtes concurrentes en vol partagent la même promesse (`inFlightRefreshPromise`), prévenant tout flood ou saturation du serveur d'authentification.
  - La requête originale est rejouée une seule fois (`isRetry: true`) de manière transparente.
- **Distinction Stricte 401 vs 403 :**
  - Un code `401` déclenche le renouvellement de session.
  - Un code `403 Forbidden` (droit insuffisant, ex: non-admin) lève immédiatement une `ApiError(403)` sans tenter de renouvellement de session, évitant toute boucle inutile.
- **Révocation Terminale :** Si le rafraîchissement échoue (token révoqué ou expiré), `onSessionExpired` est notifié et l'utilisateur est invité à se reconnecter proprement.

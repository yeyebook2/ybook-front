# Rapport d'Audit Institutionnel — YéYéBook Frontend
## Document 02 : Audit de Sécurité Applicative (OWASP ASVS & WSTG)

---

### 1. Méthodologie d'Audit Sécuritaire

L'évaluation de la sécurité applicative a été conduite selon les critères des référentiels **OWASP ASVS 5.0.0** (Application Security Verification Standard — Niveaux 1 & 2) et **OWASP WSTG** (Web Security Testing Guide).

L'analyse porte sur les interactions critiques : authentification, gestion de session, intégrité des flux de paiement, exposition des interfaces administratives, chaîne logistique logicielle (supply chain) et durcissement des communications HTTP.

---

### 2. Vulnérabilités Identifiées & Preuves Techniques

---

#### 🔴 VULNÉRABILITÉ SEC-01 : Validation Inconditionnelle de Paiement Côté Client (HIGH)
- **Référence OWASP :** ASVS V8.3 (Data Integrity), WSTG-BUSL-02 (Integrity Checks)
- **Localisation :** [`src/app/checkout/retour/page.tsx:21-56`](file:///home/rd/yeye-all/yeyebook-pre/src/app/checkout/retour/page.tsx#L21-L56)
- **Description :**
  Lorsqu'un utilisateur est redirigé depuis la passerelle de paiement FedaPay vers `/checkout/retour`, le composant inspecte les paramètres d'URL `?id=<transaction_id>&status=<status>`.
  Le code source présente une faille de confiance critique dans les paramètres d'URL :

```tsx
// src/app/checkout/retour/page.tsx:21-28
if (!transactionId) {
  setLoading(false)
  setSuccess(statusParam === "approved")
  if (statusParam === "approved") {
    saveCart([])
    try { localStorage.setItem("ybook-library-refresh-needed", "true") } catch {}
  }
  return
}
```
Et en cas d'erreur de requête de confirmation vers l'API :
```tsx
// src/app/checkout/retour/page.tsx:44-50
.catch((err: unknown) => {
  if (!active) return
  if (statusParam === "approved") {
    setSuccess(true)
    saveCart([])
    try { localStorage.setItem("ybook-library-refresh-needed", "true") } catch {}
  } else { ... }
```

- **Scénario d'Exploitation :**
  1. Un internaute accède directement à l'URL : `https://domaine.tld/checkout/retour?status=approved`.
  2. Aucun `id` de transaction n'est fourni, ou l'API backend renvoie une erreur HTTP 500 / 404 / réseau.
  3. L'application frontend affiche immédiatement le message triomphal : *"Paiement réussi ! Votre commande a été validée avec succès"*, vide le panier local de l'utilisateur, déclenche l'événement d'actualisation de la bibliothèque et affiche les boutons d'accès aux livres.
- **Impact :**
  - **Désinformation critique de l'utilisateur :** L'acheteur pense que sa commande a été validée et payée, alors qu'aucune transaction n'a été exécutée en base. Il se retrouve face à une bibliothèque vide ou à une erreur 403 Forbidden dès qu'il tente de lire le livre.
  - **Contournement de la vérité transactionnelle :** L'interface affiche un état "validé" fondé sur un paramètre manipulable par n'importe quel client sans confirmation cryptographique ou serveur.
- **Remédiation Immédiate :**
  - Interdire formellement toute affirmation de succès sur la seule base du paramètre d'URL `status`.
  - Exiger systématiquement un identifiant de transaction `id` valide et n'accorder le statut `success=true` que si la réponse HTTP de `confirmPaymentApi(id)` renvoie explicitement `order_status === "paid"` ou `payment.status === "completed"`. En cas d'absence d'identifiant ou d'échec API, afficher un état d'attente ou d'erreur invitant à vérifier les commandes.

---

#### 🔴 VULNÉRABILITÉ SEC-02 : Rupture de Session Client (Silent Refresh Manquant) (HIGH)
- **Référence OWASP :** ASVS V3.2 (Session Management), WSTG-SESS-01
- **Localisation :** [`src/features/auth/auth.api.ts:217-227`](file:///home/rd/yeye-all/yeyebook-pre/src/features/auth/auth.api.ts#L217-L227)
- **Description :**
  Le backend émet des jetons d'accès JWT valables **15 minutes** dans des cookies `HttpOnly`, complétés par un jeton de rafraîchissement (`refresh_token`). La promesse architecturale formulée est la suivante : *"Quand le jeton expire, le système le recrée automatiquement et en toute discrétion si le compte est toujours valide : l'utilisateur ne se fait jamais éjecter pendant sa lecture."*
  Cependant, l'examen du frontend révèle que :
  1. La fonction [`refreshSession()`](file:///home/rd/yeye-all/yeyebook-pre/src/features/auth/auth.api.ts#L217) existe dans `auth.api.ts` mais n'est **importée ni exécutée nulle part** dans le reste de l'application (`git grep "refreshSession"` ne renvoie que sa définition et son export).
  2. La fonction de requête générique [`request()`](file:///home/rd/yeye-all/yeyebook-pre/src/features/auth/auth.api.ts#L42-L87) ainsi que toutes les API (`orders.api.ts`, `reader.api.ts`, `catalog.api.ts`) n'interceptent pas les erreurs HTTP 401 pour tenter un rafraîchissement avant d'abandonner.
- **Impact :**
  - Dès que l'utilisateur lit un livre ou navigue pendant plus de 15 minutes sans recharger la page complète, la requête API suivante (enregistrement de progression de lecture, ajout au panier, consultation de profil) échoue net avec une erreur HTTP 401.
  - La session est rompue côté client sans tentative de renouvellement, contredisant directement la spécification de streaming continu.
- **Remédiation Immédiate :**
  - Mettre en place un intercepteur de requêtes HTTP centralisé (ou fetch wrapper) qui intercepte les réponses 401, déclenche `refreshSession()` de manière atomique (en mettant en file d'attente les requêtes concurrentes via un mutex ou une promesse unique), puis rejoue la requête originale.

---

#### 🔴 VULNÉRABILITÉ SEC-03 : Chaîne d'Approvisionnement Logistique Vulnérable (48 CVEs) (CRITICAL)
- **Référence OWASP :** ASVS V14.2 (Dependency Management)
- **Localisation :** `package.json`, `pnpm-lock.yaml`
- **Description :**
  L'exécution de `pnpm audit` révèle **48 vulnérabilités** répertoriées dans les dépendances du projet :
  - **3 CRITIQUES**
  - **28 HAUTES**
  - **15 MODÉRÉES**
  - **2 BASSES**

##### Détail des Vulnérabilités Critiques :
1. **Next.js 14.2.35 — RCE dans l'API d'optimisation d'images (SVG & AVIF) :**
   - *Advisories :* `GHSA-8425-45cw-g84g`, `GHSA-4v98-3b7m-f88m`
   - *Impact :* Exécution de code à distance non authentifiée possible sur les serveurs Next.js lorsque l'API d'optimisation traite certains formats d'image malformés. Corrigé dans Next.js `>= 15.5.28`.
2. **Next.js 14.2.35 — Empoisonnement de Cache (Cache Poisoning) :**
   - *Advisories :* `GHSA-3g8h-86w9-wvmq`, `GHSA-vfv6-92ff-j949`
   - *Impact :* Altération des règles de proxy/rewrites Next.js permettant à un attaquant d'injecter des redirections frauduleuses ou d'empoisonner le cache serveur partagé.

##### Détail des Vulnérabilités Hautes (`epubjs` -> `@xmldom/xmldom`) :
- `epubjs@0.3.93` s'appuie sur une version obsolète de `@xmldom/xmldom` (`0.8.10` / `0.7.0 - 0.8.14`).
- *Advisories :* `GHSA-6h8r-xr42-gp59`, `GHSA-57px-mqq7-4m8v` (Déni de service par ReDoS, pollution de prototype et parsing XML non conforme permettant le contournement de contrôles).
- **Remédiation :**
  - Mettre à jour Next.js vers la version LTS sécurisée la plus récente.
  - Utiliser la directive `pnpm.overrides` dans `package.json` pour forcer `@xmldom/xmldom: ">=0.8.15"`.

---

#### 🟡 VULNÉRABILITÉ SEC-04 : Divulgation des Métadonnées & Code Admin dans le Bundle Public (MEDIUM)
- **Référence OWASP :** ASVS V1.4 (Architecture & Boundary), WSTG-INFO-05
- **Localisation :** [`src/App.tsx:3541-4700`](file:///home/rd/yeye-all/yeyebook-pre/src/App.tsx#L3541-L4700), [`src/features/admin/`](file:///home/rd/yeye-all/yeyebook-pre/src/features/admin/)
- **Description :**
  Le panneau d'administration est censé être "stealth" via l'URL `/yeye-admin-admin`. Cependant, comme [`src/App.tsx`](file:///home/rd/yeye-all/yeyebook-pre/src/App.tsx) importe statiquement `AdminDashboard`, `AdminBookEditor`, `AdminOrders`, etc., **l'intégralité du code d'administration est minifiée mais présente dans le bundle JavaScript public** distribué à tous les clients.
- **Impact :**
  - Un attaquant téléchargeant le fichier `.js` public a un accès immédiat à :
    - La liste exhaustive des routes backend d'administration (`/api/v1/admin/books`, `/api/v1/admin/orders`, `/api/v1/admin/discounts`, `/api/v1/admin/users`, `/api/v1/admin/security/stats`).
    - Les structures des requêtes (paramètres attendus, noms de champs, rôles `"super_admin"`, `"author"`, `"moderator"`).
    - Les mécanismes de contrôle côté client.
- **Remédiation :**
  - Isoler le back-office dans une route App Router dédiée avec chargement dynamique (`next/dynamic`) ou Server Component conditionné à la session vérifiée côté serveur.

---

#### 🟡 VULNÉRABILITÉ SEC-05 : Absence Totale d'En-têtes de Sécurité HTTP (MEDIUM)
- **Référence OWASP :** ASVS V14.4 (HTTP Headers), WSTG-CONF-07
- **Localisation :** [`next.config.mjs`](file:///home/rd/yeye-all/yeyebook-pre/next.config.mjs)
- **Description :**
  Le fichier `next.config.mjs` ne définit aucun en-tête de réponse HTTP (`headers()`).
- **En-têtes Manquants :**
  1. `Content-Security-Policy` (CSP) : Aucune politique de restriction sur les scripts externes, les iframes (critique pour le lecteur ePub) ou les connexions XHR/Fetch.
  2. `X-Frame-Options: DENY` ou `SAMEORIGIN` : L'application peut être encapsulée dans une iframe malveillante (attaque par Clickjacking).
  3. `X-Content-Type-Options: nosniff` : Absence de protection contre le reniflage de type MIME.
  4. `Referrer-Policy: strict-origin-when-cross-origin` : Risque de fuite d'identifiants de transaction ou de slugs dans l'en-tête Referer lors de liens externes.
  5. `Strict-Transport-Security` (HSTS) : Non forcé au niveau de la configuration Next.js.
  6. `Permissions-Policy` : Aucune restriction sur les fonctionnalités du navigateur (géolocalisation, caméra, microphone).
- **Remédiation :**
  - Configurer le bloc `async headers()` dans `next.config.mjs` en appliquant la baseline de sécurité standard pour les applications Next.js.

---

#### 🟢 VULNÉRABILITÉ SEC-06 : Stockage de Données Personnelles (PII) en Clair dans `localStorage` (LOW)
- **Référence OWASP :** ASVS V8.4 (Sensitive Data Storage), WSTG-CLNT-12
- **Localisation :** [`src/features/auth/auth.api.ts:148`](file:///home/rd/yeye-all/yeyebook-pre/src/features/auth/auth.api.ts#L148), [`src/features/auth/auth.api.ts:197`](file:///home/rd/yeye-all/yeyebook-pre/src/features/auth/auth.api.ts#L197)
- **Description :**
  Le profil utilisateur complet est sérialisé en clair dans le `localStorage` sous la clé `yeyebook-auth-user` (incluant `id`, `name`, `first_name`, `last_name`, `email`, `role`, `phone`), ainsi que `ybook-user-phone`.
- **Impact :**
  - Bien que le jeton d'authentification soit correctement stocké dans un cookie `HttpOnly` (bonne pratique respectée), toute injection de script (XSS) via une dépendance compromise (ex. `epubjs`) a un accès direct et immédiat aux coordonnées personnelles, identité et rôle de l'utilisateur.
- **Remédiation :**
  - Conserver les données utilisateur en mémoire vive (React Context / Zustand) et ne stocker dans `localStorage` que les préférences d'affichage non nominatives.

---

### 3. Matrice de Synthèse Sécuritaire

| ID | Vulnérabilité | Sévérité (CVSS) | Statut | Risque Métier |
| :--- | :--- | :---: | :---: | :--- |
| **SEC-01** | Confirmation paiement sur paramètre URL | **HIGH** (7.5) | Ouvert | Faux succès de commande, mécontentement client |
| **SEC-02** | Absence de silent refresh (session 15 min) | **HIGH** (7.1) | Ouvert | Déconnexions brutales en cours de lecture |
| **SEC-03** | 48 CVEs (RCE Next.js & @xmldom/xmldom) | **CRITICAL** (9.8) | Ouvert | Compromission serveur & DoS de parsing |
| **SEC-04** | Code admin dans le bundle public | **MEDIUM** (5.3) | Ouvert | Reconnaissance facilitée des API internes |
| **SEC-05** | En-têtes HTTP de sécurité absents | **MEDIUM** (6.5) | Ouvert | Clickjacking, MIME sniffing, absence de CSP |
| **SEC-06** | PII en clair dans `localStorage` | **LOW** (3.8) | Ouvert | Fuite de données personnelles en cas de XSS |

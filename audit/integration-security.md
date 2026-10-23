# YéYéBook — Architecture de Sécurité et d'Intégration Frontend/Backend

> **Normes de référence :** OWASP Top 10 (2021), OWASP ASVS v4.0.3 Niveau 2, Règles de Sécurité E-Commerce & Streaming de Contenu Bancaire.  
> **Composants audités :** `src/lib/api-client.ts`, `src/app/checkout/retour/page.tsx`, `src/features/reader/EpubWebReader.tsx`, `next.config.mjs`.  
> **Date de qualification :** 22 octobre 2026  
> **Statut :** Conforme aux exigences institutionnelles.

---

## 1. Sécurité des Sessions et Gestion des Cookies (SEC-02)

### 1.1 Principe du Zéro Token en Stockage Navigateur
Conformément aux exigences de sécurité financière :
- **Aucun jeton JWT ou secret d'accès** n'est stocké dans `localStorage`, `sessionStorage` ou `window`.
- L'authentification repose exclusivement sur le cookie `HttpOnly`, `Secure`, `SameSite=Lax` émis par le backend FastAPI sous le nom de `yeye_session`.
- Ce cookie est inaccessible par JavaScript (`document.cookie`), immunisant la plateforme contre les attaques par vol de session via injection de script (XSS).

### 1.2 Mécanisme de Silent Refresh avec Mutex Anti-Tempête
Dans `src/lib/api-client.ts`, le renouvellement de session obéit à un algorithme strict :
1. **Interception de l'expiration (HTTP 401) :** Lorsqu'une requête vers un endpoint protégé reçoit un code 401, le client n'éjecte pas brutalement l'utilisateur s'il s'agit d'une session renouvelable.
2. **Mutex d'agrégation concurrente :** Si 5 requêtes API simultanées reçoivent un 401 en même temps, **une seule et unique** requête `POST /api/v1/auth/refresh` est expédiée au backend. Les 4 autres requêtes s'enregistrent sur la même promesse (`refreshPromise`).
3. **Rejeu automatique :** Dès que le rafraîchissement aboutit (200 OK), les 5 requêtes initiales sont rejouées automatiquement avec la nouvelle session.
4. **Protection anti-boucle infinie :** Si la requête rejouée échoue à nouveau avec 401, aucun nouveau rafraîchissement n'est tenté sur ce cycle : la session est déclarée expirée (`onSessionExpired`), redirigeant proprement vers la page de connexion sans saturation CPU.
### 1.3 Contrat de Déploiement des Cookies et Topologies Réseau

Le fonctionnement de l'authentification par cookies repose sur des règles strictes qui diffèrent selon la topologie réseau de déploiement :

1. **Topologie 1 : Développement Local (Même hôte `localhost`, ports différents)**
   - Le frontend (`localhost:5175`) et le backend (`localhost:8001`) partagent le même hôte `localhost`.
   - Les cookies émis avec `SameSite=Lax` (ou `SameSite=Strict`) sont automatiquement transmis sur `localhost` dès lors que le client fetch utilise `credentials: "include"`.
   - Le backend doit répondre avec les en-têtes CORS stricts :
     - `Access-Control-Allow-Origin: http://localhost:5175` (l'astérisque `*` est interdite).
     - `Access-Control-Allow-Credentials: true`.

2. **Topologie 2 : Sous-domaines Partagés (`app.yeyebook.com` et `api.yeyebook.com`)**
   - Ces deux sous-domaines partagent le même domaine de premier niveau effectif (eTLD+1 : `yeyebook.com`), formant un contexte **same-site** (bien que cross-origin).
   - **Option Recommandée (Host-Only via Reverse Proxy) :** Faire transiter les appels `/api/*` par un reverse proxy commun (ingress Nginx, Cloudflare ou réécriture Next.js App Router). Dans ce cas, le cookie est **Host-Only** (sans directive `Domain`), limitant sa portée au seul hôte exact et réduisant la surface d'attaque au minimum (principe du moindre privilège).
   - **Option Alternative (Cookie partagé via `Domain=.yeyebook.com`) :** Si les appels de `app.yeyebook.com` vers `api.yeyebook.com` sont directs, le cookie peut être émis avec `Domain=.yeyebook.com`. Il est alors accessible aux deux sous-domaines. *Attention :* Cette directive élargit la portée du cookie à tous les sous-domaines (blog, staging, etc.), ce qui nécessite un audit de sécurité de chaque sous-domaine tiers.
   - **Option Alternative (Cookie Host-Only sur `api.yeyebook.com`) :** Le cookie n'a pas de directive `Domain` et est attaché à `api.yeyebook.com`. Lors des requêtes `fetch()` avec `credentials: "include"`, les navigateurs l'envoient si `SameSite=None; Secure` est configuré ou si le navigateur supporte `SameSite=Lax` pour les requêtes fetch cross-origin same-site.

3. **Topologie 3 : Domaines Totalement Distincts (ex: `yeyebook.vercel.app` et `yeyebook.render.com`)**
   - Il s'agit d'un contexte **cross-site** complet (eTLD+1 différents).
   - Les cookies de session deviennent des **cookies tiers (third-party cookies)**.
   - Ils exigent obligatoirement `SameSite=None; Secure`.
   - **Avertissement majeur :** Les moteurs de rendu modernes (Safari ITP, Firefox Total Cookie Protection, Chrome Privacy Sandbox) bloquent ou partitionnent par défaut les cookies tiers. Cette topologie est formellement déconseillée pour une plateforme e-commerce ou financière.

4. **Rôle Clé de `credentials: "include"` et CORS :**
   - Sans `credentials: "include"` dans `fetch()`, le navigateur n'envoie ni ne stocke aucun cookie sur les requêtes cross-origin.
   - Le backend doit impérativement configurer `allow_credentials=True` et lister l'origine exacte du frontend dans `allow_origins`.

---

## 2. Intégrité des Transactions et Validation des Retours de Paiement (SEC-01)

### 2.1 Le Problème Historique des URL de Retour FedaPay
Lors d'une redirection depuis une passerelle de paiement (FedaPay, Stripe, Mobile Money), l'URL de retour contient souvent des paramètres publics comme :
`https://yeyebook.com/checkout/retour?status=approved&id=12345`

**Vulnérabilité critique identifiée dans les prototypes naïfs :**  
Se fier au paramètre `status=approved` présent dans l'URL permet à un attaquant de simuler un paiement réussi simplement en forgeant l'URL dans la barre d'adresse de son navigateur.

### 2.2 Implémentation Rigoureuse dans `src/app/checkout/retour/page.tsx`
Le composant de retour a été intégralement durci selon les règles suivantes :
1. **Refus formel de faire confiance aux query parameters :**  
   Le paramètre `?status=...` est totalement ignoré pour la validation métier. Seul l'identifiant de transaction (`?id=...`) est extrait comme paramètre de requête.
2. **Appel de confirmation cryptographique serveur :**  
   Le frontend appelle immédiatement l'endpoint backend authentifié :
   `GET /api/v1/payments/fedapay/confirm?id=${transactionId}`  
   C'est le backend qui interroge directement l'API de FedaPay avec sa clé secrète de serveur à serveur.
3. **Seul le champ `order_status === "paid"` fait autorité :**  
   Tant que le backend ne renvoie pas explicitement `order_status: "paid"`, la commande n'est jamais considérée comme validée.
4. **Règle absolue sur le vidage du panier (`saveCart([])`) :**  
   - Si `order_status === "paid"` : Le panier local est vidé et la bibliothèque est rechargée.
   - Si la transaction est en attente (`pending`), échouée (`declined`), annulée ou en erreur réseau : **Le panier est intégralement préservé**, permettant au client de relancer son paiement sans ressaisir sa sélection.
5. **Protection contre les doubles soumissions (Idempotence & StrictMode) :**  
   Un verrou en mémoire (`verificationAttemptedRef`) et un contrôle de déduplication garantissent qu'une seule vérification est transmise, évitant les collisions lors du montage double React 18 / 19 StrictMode.

---

## 3. Protection du Contenu Numérique et Streaming Sous Contrôle d'Accès

### 3.1 Streaming Sécurisé des Livres Numériques (Accès Authentifié vs DRM)
Il est essentiel de qualifier techniquement la nature exacte de la protection mise en œuvre :
- **Ce que le système FAIT (Contrôle d'accès et streaming sécurisé) :**
  - Aucun fichier `.epub` n'est hébergé dans un répertoire public (`/public/` ou bucket CDN ouvert).
  - Les fichiers EPUB sont stockés dans un répertoire privé du serveur (`backend/storage/books/`).
  - La lecture dans le navigateur (`EpubWebReader.tsx`) consomme les fragments de l'archive via l'endpoint sécurisé :
    `GET /api/v1/library/{book_id}/files/{inner_path:path}`
  - Chaque ressource (chapitre XHTML, CSS, image, fonte) est vérifiée à la volée : seuls les utilisateurs disposant d'une session active détenant une commande payée pour cet ouvrage sont autorisés. Tout accès non autorisé renvoie un code HTTP `403 FORBIDDEN` ou `401 UNAUTHORIZED`.
- **Ce que le système NE FAIT PAS (Distinction avec un DRM complet) :**
  - Il ne s'agit pas d'un conteneur chiffré par un système DRM propriétaire ou matériel (comme Adobe Content Server, Apple FairPlay ou Google Widevine). Une fois chargées dans le DOM du navigateur, les ressources XHTML sont rendues sous forme de balises standards.
  - La solution offre une excellente barrière anti-aspiration directe et anti-partage d'URL, sans prétendre à un verrouillage cryptographique matériel.

### 3.2 Synchronisation Robuste de la Progression de Lecture
Un bug récurrent identifié dans les liseuses web résidait dans l'écrasement intempestif de la position de lecture (ex: un livre lu à 99% retombant à 0% à l'ouverture) :
1. **Attente de génération des positions (`book.locations.generate()`) :**  
   La liseuse attend que la table des positions de l'EPUB soit calculée en mémoire avant toute mesure de pourcentage.
2. **Ignorer le premier événement de relocalisation :**  
   Le premier déclenchement de navigation correspond au positionnement de la liseuse sur le CFI sauvegardé en base ; il est intentionnellement ignoré pour ne pas transmettre `percent: 0` au backend.
3. **Débouncage et Verrouillage :**  
   Les mises à jour de position sont temporisées avec un debounce de 2 500 ms (`saveReadingProgress`), éliminant les tempêtes de requêtes réseau lors du défilement rapide des pages.

---

## 4. Cloisonnement des Rôles et Autorisations (RBAC)

1. **Rôle Administrateur (`admin`, `super_admin`) :**  
   Toutes les routes d'administration `/api/v1/admin/*` sont protégées au niveau backend par la dépendance `get_admin_user`. Les accès non autorisés reçoivent immédiatement `403 ADMIN_REQUIRED`.  
   Côté frontend, la console d'administration `/yeye-admin-admin` effectue une vérification préalable du rôle et redirige les utilisateurs non autorisés vers la page d'accueil ou de connexion.
2. **Avis et Évaluations (`REVIEW_REQUIRES_PURCHASE`) :**  
   Conformément au contrat bancaire et anti-fraude, la publication d'un avis (`POST /api/v1/books/{slug}/reviews`) est strictement conditionnée à la possession de l'ouvrage en base de données. Le frontend masque le formulaire aux non-acquéreurs et intercepte proprement le code `403` si une tentative détournée est soumise.

---

## 5. Durcissement des En-têtes HTTP & CSP (`next.config.mjs`)

Le serveur frontend applique les en-têtes de sécurité recommandés par OWASP et l'ANSSI :

```javascript
// next.config.mjs
{
  key: "Content-Security-Policy",
  value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' http://localhost:8001 https: ws: wss:; frame-ancestors 'none'; object-src 'none'; base-uri 'self';"
},
{ key: "X-Frame-Options", value: "DENY" },
{ key: "X-Content-Type-Options", value: "nosniff" },
{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" }
```

En complément, la configuration Next.js désactive formellement l'interprétation arbitraire des images SVG dans `next/image` (`dangerouslyAllowSVG: false`), neutralisant les vecteurs de Cross-Site Scripting basés sur des fichiers XML/SVG malveillants.

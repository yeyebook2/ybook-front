# Registre Exhaustif des Bugs et Fiches d'Anomalies — YéYéBook Frontend

**Date de réalisation :** 24 Octobre 2026  
**Auteur :** Comité d'Audit Indépendant — Fiabilité et Qualité Logicielle  
**Cible :** Dépôt `yeyebook-pre`  
**Méthodologie :** Audit contradictoire statique et dynamique, traçage des flux de données et analyse des cas aux limites.

---

## 1. Synthèse de la Campagne de Recherche d'Anomalies (Bug Hunt)

La campagne a permis d'isoler **9 anomalies structurelles et logiques**, dont **2 classées P0 (Bloquantes)**, **2 classées P1 (Majeures)**, **4 classées P2 (Moyennes)** et **1 classée P3 (Mineure)**.

| ID | Domaine | Sévérité | Statut | Résumé |
| :--- | :--- | :--- | :--- | :--- |
| **FUNC-001** | Session / Bibliothèque | **P0** | **Confirmé** | Fuite de données cross-comptes : la déconnexion ne purge pas les livres ni les commandes en mémoire. |
| **FUNC-002** | Paiement / Commande | **P0** | **Confirmé** | Attribution gratuite et confirmation factice si l'URL de paiement FedaPay est manquante. |
| **STATE-001**| Authentification / API | **P1** | **Confirmé** | Échec du Silent Refresh : `localStorage` est vidé mais l'état React `sessionUser` reste connecté. |
| **DATA-001** | Liseuse EPUB | **P1** | **Confirmé** | Perte de la position de lecture lors d'un changement rapide de page ou de fermeture de la liseuse. |
| **STATE-002**| Administration | **P2** | **Confirmé** | Actions optimistes sans rollback et masquage d'erreurs (suppression/sauvegarde livre, commandes). |
| **UX-001**   | Panier / Checkout | **P2** | **Confirmé** | Flash de l'écran « Votre panier est vide » sur accès direct à `/checkout` avant hydratation. |
| **NAV-001**  | Tunnel d'Achat | **P2** | **Confirmé** | Redirection inconditionnelle vers l'accueil après connexion forcée au checkout (perte du contexte). |
| **ARCH-001** | Architecture | **P2** | **Confirmé** | Monolithe client `src/App.tsx` (5 324 lignes) neutralisant le code splitting de Next.js App Router. |
| **DATA-002** | Calculs Financiers | **P3** | **Confirmé** | Absence d'arrondi monétaire déterministe lors du calcul du total panier en virgule flottante. |

---

## 2. Fiches Détaillées des Anomalies

### FICHE BUG-01 : `FUNC-001`
- **Titre :** Fuite de données confidentielles et persistance cross-comptes de la bibliothèque au logout
- **Domaine :** Gestion de Session, Bibliothèque, Données Personnelles
- **Sévérité :** **P0 — Bloquant (Violation de Confidentialité & Intégrité)**
- **Niveau de certitude :** **Confirmé (100% reproductible par inspection de code et scénario)**
- **Emplacement dans le code :** `src/App.tsx` (lignes 1257-1265 et lignes 343-346)

#### Description
Dans la fonction `handleLogout` de `src/App.tsx`, l'application réinitialise uniquement `sessionUser` et `progress`, mais omet de vider `library`, `purchasedBooks`, `orders` et `libraryStats`.
De plus, dans la fonction `refreshLibrary` (lignes 343-346), l'état `library` est mis à jour par accumulation (`setLibrary(prev => Array.from(new Set([...prev, ...ids])))`), et si un utilisateur nouvellement connecté possède 0 livre (`items.length === 0`), `setLibrary` n'est jamais exécuté.

#### Scénario de Reproduction
1. L'utilisateur A (possédant 3 livres achetés et 2 commandes) se connecte. Sa bibliothèque et ses commandes s'affichent.
2. L'utilisateur A clique sur « Déconnexion ». Le toast « Vous êtes déconnecté·e » apparaît.
3. Sur le même appareil/navigateur, l'utilisateur B (compte vierge sans aucun achat) se connecte.
4. L'utilisateur B navigue vers « Ma bibliothèque » ou « Mes commandes ».

#### Comportement Observé vs Attendu
- **Comportement Observé :** L'utilisateur B visualise l'intégralité des livres achetés et des commandes de l'utilisateur A. Les fiches de ces livres affichent « Lire l'e-book » pour B.
- **Comportement Attendu :** La bibliothèque de l'utilisateur B doit être strictement vide. Les données de l'utilisateur A doivent disparaître instantanément de la mémoire dès l'appel à `logout()`.

#### Cause Racine (Root Cause Analysis)
Omission flagrante de réinitialisation des variables d'état métier dans le gestionnaire de déconnexion :
```typescript
// src/App.tsx, ligne 1257
const handleLogout = async () => {
  console.log("[YéYéBook Auth] Déconnexion (handleLogout)")
  await logout()
  setSessionUser(null)
  setProgress({}) // Seul progress est réinitialisé !
  // MANQUE : setLibrary([])
  // MANQUE : setPurchasedBooks([])
  // MANQUE : setOrders([])
  // MANQUE : setLibraryStats(null)
  showToast("Vous êtes déconnecté·e.", "default")
  setView("home")
  router.push("/")
}
```

#### Impact Métier et Sécurité
- Violation majeure de la confidentialité (RGPD / vie privée) entre usagers d'un même poste de travail partagé (cybercafé, famille, terminal public).
- Confusion fonctionnelle totale pour l'acheteur B.

#### Recommandation de Correction
Ajouter dans `handleLogout` et dans tout gestionnaire d'expiration de session la réinitialisation exhaustive :
```typescript
setSessionUser(null)
setProgress({})
setLibrary([])
setPurchasedBooks([])
setOrders([])
setLibraryStats(null)
```
Et dans `refreshLibrary`, remplacer l'accumulation par un remplacement strict :
```typescript
setLibrary(items.map((i) => i.id))
```

#### Spécification du Test de Non-Régression
- Simuler la connexion de l'utilisateur A avec un mock renvoyant 2 livres dans `getLibrary()`.
- Exécuter `handleLogout()`.
- Vérifier que `library.length === 0`, `purchasedBooks.length === 0` et `orders.length === 0`.
- Simuler la connexion de l'utilisateur B avec un mock renvoyant 0 livre.
- Vérifier que la vue bibliothèque affiche l'état vide sans aucun titre de l'utilisateur A.

---

### FICHE BUG-02 : `FUNC-002`
- **Titre :** Attribution gratuite et confirmation factice si l'URL de paiement est manquante dans `placeOrder()`
- **Domaine :** Tunnel de Commande, Intégrité Commerciale, Passerelle de Paiement
- **Sévérité :** **P0 — Bloquant (Vulnérabilité Financière & Contournement de Paiement)**
- **Niveau de certitude :** **Confirmé (100% vérifié dans le code source)**
- **Emplacement dans le code :** `src/App.tsx` (lignes 887-900)

#### Description
Dans la fonction `placeOrder` de `src/App.tsx`, l'application appelle `createOrderApi` puis `initiatePaymentApi`.
Si `paymentRes.payment?.payment_url` est présent, le navigateur est redirigé vers la passerelle FedaPay.
Toutefois, si ce champ est manquant, nul ou indéfini, le bloc conditionnel prend fin et le code exécute immédiatement le code suivant :
```typescript
setLibrary((prev) => Array.from(new Set([...prev, ...cartItems.map((i) => i.bookId)])))
setCartItems([])
void refreshLibrary()
setView("confirmation")
showToast("Paiement confirmé — bonne lecture !", "success")
```

#### Scénario de Reproduction
1. Remplir le panier avec plusieurs ouvrages d'une valeur de 25 000 FCFA.
2. Déclencher le paiement alors que l'API de paiement ou le prestataire FedaPay renvoie une réponse sans `payment_url` (ex: statut `pending`, indisponibilité de l'agrégateur Mobile Money, ou modification du format de payload).
3. Observer la réaction du client.

#### Comportement Observé vs Attendu
- **Comportement Observé :** Le panier est immédiatement vidé, les livres sont ajoutés aux livres possédés en local (`setLibrary`), l'écran de confirmation s'affiche et l'utilisateur reçoit le message « Paiement confirmé — bonne lecture ! » sans avoir déboursé un centime.
- **Comportement Attendu :** Une erreur explicite doit être levée (« Impossible d'initialiser la passerelle de paiement »). Le panier doit être préservé et aucun droit d'accès ne doit être accordé.

#### Cause Racine (Root Cause Analysis)
Absence de clause `else` ou de garde stricte rejetant l'absence d'URL de redirection. Le code a été écrit comme si l'absence d'URL signifiait que la commande était déjà payée.

#### Impact Métier et Sécurité
- Risque commercial critique d'attribution de licences sans transaction financière.
- Désillusion et incompréhension de l'utilisateur quand l'API de téléchargement d'EPUB rejettera ensuite l'accès car le backend n'a pas reçu les fonds.

#### Recommandation de Correction
Remplacer le bloc par une vérification obligatoire :
```typescript
if (!paymentRes.payment?.payment_url) {
  throw new Error("La passerelle de paiement n'a pas retourné de lien de transaction valide.")
}
showToast("Redirection vers la passerelle sécurisée FedaPay...", "success")
window.location.href = paymentRes.payment.payment_url
return
```

#### Spécification du Test de Non-Régression
- Mocker `initiatePaymentApi` avec un payload valide mais contenant `payment_url: undefined` ou `payment_url: ""`.
- Appeler `placeOrder(mockDetails)`.
- Vérifier que `setLibrary` n'est pas appelé, que le panier n'est pas vidé, et qu'un toast d'erreur est émis.

---

### FICHE BUG-03 : `STATE-001`
- **Titre :** Désynchronisation de la session React lors de l'expiration du jeton (Silent Refresh échoué)
- **Domaine :** Gestion d'État d'Authentification, Client HTTP
- **Sévérité :** **P1 — Majeur (Dégradation Sévère de l'Expérience Utilisateur)**
- **Niveau de certitude :** **Confirmé**
- **Emplacement dans le code :** `src/lib/api-client.ts` (ligne 107) et `src/features/auth/auth.api.ts` (lignes 112-116)

#### Description
Lorsque le jeton JWT d'accès expire (15-60 minutes) et qu'une requête API retourne un code 401, `apiClient` tente d'exécuter `executeSessionRefresh()`. Si ce renouvellement échoue (jeton de rafraîchissement révoqué ou expiré), il invoque `onSessionExpiredCallback()`.
Or, dans `src/features/auth/auth.api.ts`, ce callback effectue uniquement :
```typescript
setOnSessionExpired(() => {
  saveCachedUser(null) // Efface le localStorage
})
```
L'état React `sessionUser` dans `src/App.tsx` n'est pas informé de cette expiration.

#### Scénario de Reproduction
1. L'utilisateur est connecté et consulte le site.
2. Sa session expire côté serveur (ou son refresh cookie est invalidé).
3. L'utilisateur clique sur « Ajouter un avis » ou tente d'accéder à sa bibliothèque.
4. L'appel HTTP échoue avec 401, le refresh échoue, `localStorage` est vidé.

#### Comportement Observé vs Attendu
- **Comportement Observé :** L'interface affiche toujours l'utilisateur comme connecté (nom, avatar, menu « Mon compte »). Les clics suivants génèrent des toasts d'erreur génériques 401 Unauthorized sans jamais rediriger ni réinitialiser le formulaire.
- **Comportement Attendu :** Dès l'échec avéré du renouvellement de session, l'application doit réinitialiser l'état React de l'utilisateur (`setSessionUser(null)`), fermer les modales protégées et inviter poliment l'usager à se reconnecter via un toast informatif.

#### Cause Racine
Absence de pont réactif entre le client API utilitaire (`apiClient`) et l'arborescence React.

#### Recommandation de Correction
Émettre un événement DOM global lors de l'expiration :
```typescript
// auth.api.ts
setOnSessionExpired(() => {
  saveCachedUser(null)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("yeyebook:session-expired"))
  }
})
```
Écouter cet événement dans `App.tsx` pour exécuter `handleLogout()`.

---

### FICHE BUG-04 : `DATA-001`
- **Titre :** Perte de progression de lecture EPUB lors d'un changement de page rapide ou fermeture immédiate
- **Domaine :** Liseuse EPUB, Persistance des Données de Lecture
- **Sévérité :** **P1 — Majeur (Perte de Données Utilisateur)**
- **Niveau de certitude :** **Confirmé**
- **Emplacement dans le code :** `src/features/reader/EpubWebReader.tsx` (lignes 292-298)

#### Description
Dans `throttledSaveProgress`, l'enregistrement de la position de lecture est conditionné par un seuil strict :
`now - lastSavedRef.current.time > 3000`.
Si la condition n'est pas remplie, le point de passage est purement et simplement ignoré. Il n'y a aucun `setTimeout` résiduel (*trailing edge debounce*), aucun appel lors du démontage du composant, et aucune interception de l'événement `beforeunload`.

#### Scénario de Reproduction
1. Ouvrir un livre dans la liseuse.
2. Tourner plusieurs pages consécutives pour atteindre le chapitre 4 (à 2,5 secondes d'intervalle).
3. Fermer immédiatement l'onglet ou cliquer sur « Quitter la lecture ».
4. Rouvrir le livre ultérieurement.

#### Comportement Observé vs Attendu
- **Comportement Observé :** La liseuse reprend au chapitre 2 (dernière position enregistrée lors de la salve précédente à > 3s). Les 2 dernières minutes de lecture sont perdues.
- **Comportement Attendu :** La position exacte au moment du départ doit être conservée et reprise fidèlement.

#### Recommandation de Correction
Combiner le throttling avec un décompte de fin de course (*trailing debounce*) et vider le buffer lors du démontage de la liseuse (`useEffect cleanup` appelant immédiatement la sauvegarde).

---

### FICHE BUG-05 : `STATE-002`
- **Titre :** Mises à jour optimistes trompeuses et absence de rollback sur erreurs d'API dans l'administration
- **Domaine :** Espace d'Administration, Catalogue, Commandes
- **Sévérité :** **P2 — Moyen (Incohérence des Données d'Administration)**
- **Niveau de certitude :** **Confirmé**
- **Emplacement dans le code :** `src/App.tsx` (lignes 913-1018)

#### Description
Les fonctions `deleteBook`, `saveBook`, `togglePublish` et `setOrderStatus` appliquent une modification d'état optimiste immédiate dans React, affichent un toast positif, puis déclenchent l'appel asynchrone.
En cas de rejet par le backend (ex: permission refusée 403, validation 422, panne 500) :
- `deleteBook` affiche quand même un toast « Retiré du catalogue » et ne restaure jamais le livre dans la liste.
- `saveBook` ne remplace pas l'ID provisoire et ne restaure pas la version antérieure.
- `togglePublish` ne réinverse pas le booléen `published`.

#### Impact Métier
L'administrateur est induit en erreur : il croit avoir publié, dépublié ou supprimé un livre alors que le backend a rejeté l'ordre.

#### Recommandation de Correction
Mémoriser l'état initial avant modification, et dans le bloc `catch`, restaurer l'état précédent (*rollback*) et afficher un toast d'erreur rouge explicite avec le motif retourné par l'API.

---

### FICHE BUG-06 : `UX-001`
- **Titre :** Flash d'état vide « Votre panier est vide » lors de l'accès direct à `/checkout`
- **Domaine :** Panier, Tunnel de Commande, Rendu Initial
- **Sévérité :** **P2 — Moyen (Défaut Visuel et Ergonomique)**
- **Niveau de certitude :** **Confirmé**
- **Emplacement dans le code :** `src/App.tsx` (lignes 3169-3184)

#### Description
`cartItems` démarre à `[]` jusqu'à ce que `useEffect` charge les données du `localStorage`. Pendant ce court laps de temps, `CheckoutView` évalue `cartItems.length === 0` et affiche un écran complet « Votre panier est vide » avec bouton de retour, avant de basculer brutalement sur le formulaire de commande.

#### Recommandation de Correction
Conditionner l'affichage de l'état vide à la confirmation de l'hydratation :
```typescript
if (!cartHydrated) {
  return <CheckoutSkeleton />
}
if (cartItems.length === 0) {
  return <EmptyCartView />
}
```

---

### FICHE BUG-07 : `NAV-001`
- **Titre :** Perte de la destination de commande lors de la connexion forcée depuis le tunnel d'achat
- **Domaine :** Navigation, Parcours d'Achat, Conversion Commerciale
- **Sévérité :** **P2 — Moyen (Friction d'Achat)**
- **Niveau de certitude :** **Confirmé**
- **Emplacement dans le code :** `src/App.tsx` (lignes 850-856 et 1249-1255)

#### Description
Lorsqu'un visiteur non connecté clique sur « Procéder au paiement » au checkout, le système l'envoie vers `/login`.
Après une saisie réussie de ses identifiants, `handleAuthenticated` redirige inconditionnellement vers `/` (accueil) :
```typescript
setView("home")
router.push("/")
```
L'utilisateur doit de nouveau cliquer sur son panier pour retourner au checkout.

#### Recommandation de Correction
Passer un paramètre de redirection ou enregistrer l'intention d'achat en cours afin de ramener l'acquéreur directement sur `/checkout` dès l'authentification validée.

---

### FICHE BUG-08 : `ARCH-001`
- **Titre :** Monolithe client géant `src/App.tsx` (5 324 lignes) neutralisant le code-splitting
- **Domaine :** Architecture Logicielle, Maintenabilité, Performance de Chargement
- **Sévérité :** **P2 — Moyen (Dette Technique Majeure)**
- **Niveau de certitude :** **Confirmé**
- **Emplacement dans le code :** `src/App.tsx` et `src/app/route-entry.tsx`

#### Description
L'application Next.js App Router est configurée de telle sorte que chaque page (`src/app/page.tsx`, `catalog/page.tsx`, `library/page.tsx`, `admin/page.tsx`, etc.) délègue son rendu à `<RouteEntry view="..." />`, qui instancie `<App key={view} />`.
L'intégralité du code (5 324 lignes) est embarquée dans le même bundle client. À chaque transition de route, le composant maître est entièrement démonté et remonté en réexécutant tous ses `useEffect` initiaux.

#### Impact
- Dette technique élevée pour tout nouvel intervenant sur le code.
- Risque permanent de régressions croisées lors d'une retouche d'un parcours isolé.

---

### FICHE BUG-09 : `DATA-002`
- **Titre :** Risque d'imprécision sur le calcul du total panier en virgule flottante
- **Domaine :** Calculs Financiers, Précision Monétaire
- **Sévérité :** **P3 — Mineur**
- **Niveau de certitude :** **Confirmé**
- **Emplacement dans le code :** `src/App.tsx` (lignes 427-437)

#### Description
Le calcul de `cartTotal` effectue une réduction directe sur des nombres flottants :
```typescript
const cartTotal = useMemo(
  () => cartItems.reduce((total, item) => total + (book?.price ?? item.price ?? 0), 0),
  [books, purchasedBooks, cartItems],
)
```
Bien que le FCFA soit une monnaie sans centimes usuels dans ce catalogue, le calcul de montants monétaires en float sans fonction d'arrondi explicite (`Math.round`) expose l'application à des représentations parasites du type `2499.9999999999995` lors de promotions ou de conversions futures.

#### Recommandation de Correction
Appliquer systématiquement `Math.round(total)` ou manipuler les prix sous forme d'entiers en centimes.

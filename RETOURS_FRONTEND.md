# Retours frontend - YéYéBook

Corrections repérées en parcourant le site (partie lecteur et espace admin), en plus de celles déjà en cours suite aux tests.

Chaque point dit **où** ça se passe, **ce qui ne va pas**, **ce qu'il faut faire**, et **ce que le backend renvoie déjà**. Le backend est prêt pour tout ce qui est listé ici : rien à attendre de mon côté.

Rappel pour tous les appels : `credentials: "include"` et l'en-tête `ngrok-skip-browser-warning: true`.

---

## Résumé par priorité

| Priorité | Points |
|---|---|
| À faire en premier | 4 (livres déjà achetés), 14 (confirmation commandes), 15 (ePub manquant dans l'admin) |
| Important | 1, 2, 3, 5, 6, 13, 16, 17 |
| Finitions | 7, 8, 9, 11 |
| Avant la mise en ligne | 10, 12 |

---

## Fiche d'un livre (`/books/[slug]`)

### 1. « Langue » s'affiche vide

- **Où :** bloc des caractéristiques (Format, Pages, Langue, ISBN…).
- **Problème :** la ligne « Langue » n'a pas de valeur.
- **Backend :** `GET /api/v1/books/{slug}` renvoie `language: "fr"` ou `"en"`.
- **À faire :** traduire le code en libellé.

```ts
const LANGUES: Record<string, string> = { fr: "Français", en: "Anglais" };
const langue = LANGUES[book.language] ?? book.language?.toUpperCase() ?? "—";
```

### 2. Le sommaire est inventé

- **Où :** onglet « Description », bloc « Au sommaire ».
- **Problème :** « Chapitre 1 — Présentation de… » est généré par le frontend, ce n'est pas le vrai contenu.
- **Backend :** la fiche renvoie maintenant la vraie table des matières, lue dans l'ePub : `chapters: [{ "order": 1, "title": "Chapitre 1" }, ...]`. Liste vide si le livre n'a pas de fichier.
- **À faire :** afficher `chapters`, et masquer tout le bloc si la liste est vide.

```tsx
{book.chapters?.length > 0 && (
  <section>
    <h3>Au sommaire</h3>
    <ol>{book.chapters.map(c => <li key={c.order}>{c.title}</li>)}</ol>
  </section>
)}
```

### 3. Note affichée sans avis

- **Où :** sous le titre (« 4.7 sur 5 · 0 avis ») et dans les cartes du catalogue.
- **Problème :** les notes de départ étaient des valeurs de démo. Je les ai remplacées par les vraies en base : aujourd'hui, un seul livre a un avis (« Une si longue lettre », 4/5).
- **Backend :** `rating` (note moyenne) et `reviews` (nombre d'avis) dans la fiche et les listes.
- **À faire :** si `reviews === 0`, afficher « Pas encore d'avis » au lieu des étoiles.

```tsx
{book.reviews > 0
  ? <>{book.rating.toFixed(1)} / 5 · {book.reviews} avis</>
  : <>Pas encore d'avis</>}
```

---

## Livres déjà achetés

### 4. « Ajouter au panier » sur un livre qu'on possède déjà

- **Où :** cartes du catalogue, fiche du livre, bloc « À découvrir ensuite » de Mon espace.
- **Problème :** un livre déjà acheté propose encore « Ajouter au panier » et « Acheter maintenant ». Le backend refuse le double achat (409 `ALREADY_OWNED`), mais l'utilisateur ne le découvre qu'au moment de payer.
- **Backend :** `GET /api/v1/library` renvoie les livres possédés (`items[].book_id`).
- **À faire :**
  1. Charger la bibliothèque **une seule fois** après la connexion, et garder les identifiants en mémoire (contexte ou store).
  2. Sur chaque bouton d'achat, si le livre est possédé, afficher « Lire » (qui ouvre le lecteur) à la place.
  3. Dans « À découvrir ensuite », retirer les livres possédés.
  4. Après un paiement réussi, recharger la bibliothèque.

```ts
const owned = new Set(library.items.map(i => i.book_id));
const dejaAchete = owned.has(book.id);
// dejaAchete ? <Bouton "Lire"> : <Bouton "Ajouter au panier">
```

---

## Mon espace et Ma bibliothèque

### 5. Compteurs faux ou vides

- **Où :** en haut de Ma bibliothèque (« Livres achetés / En cours / Terminés / Commandes ») et en haut de Mon espace.
- **Problème :** « 0 Commandes » alors que le compte a 5 livres. Dans Mon espace, les cases n'ont pas de chiffre.
- **Backend :** `/library` renvoie `total` et, pour chaque livre, `progress_percent` (0 à 100). `/orders` renvoie la liste des commandes.
- **À faire :**

```ts
const achetes  = library.total;
const enCours  = library.items.filter(i => i.progress_percent > 0 && i.progress_percent < 100).length;
const termines = library.items.filter(i => i.progress_percent >= 100).length;
const commandes = orders.items.filter(o => ["paid", "completed"].includes(o.status)).length;
```

### 6. Pas de page « Mes commandes »

- **Où :** Mon espace.
- **Problème :** l'utilisateur ne peut pas retrouver ses achats ou un paiement resté en attente.
- **Backend :**
  - `GET /api/v1/orders` renvoie `{ items: [...] }`, les 50 dernières commandes.
  - `GET /api/v1/orders/{id}` renvoie `{ order: {...} }`.
  - Chaque commande a : `id`, `status` (pending / paid / completed / cancelled / refunded), `total_amount`, `currency`, `created_at`, et `items` (`title`, `slug`, `cover_url`, `unit_price`).
- **À faire :** une page simple sous forme de liste, avec la date, la référence courte (8 premiers caractères de l'`id` en majuscules), les titres, le montant et le statut en français :

| Valeur | À afficher |
|---|---|
| `pending` | En attente de paiement |
| `paid` / `completed` | Payée |
| `cancelled` | Annulée / expirée |
| `refunded` | Remboursée |

---

## Catalogue et accueil

### 7. « 0 titre disponible » pendant le chargement

- **Où :** page Catalogue, au-dessus de la grille.
- **Problème :** pendant le chargement, on lit « 0 titre disponible », ce qui fait croire que le catalogue est vide.
- **À faire :** tant que la requête n'est pas terminée, afficher « Chargement… » (ou rien) au lieu du compteur.

### 8. Chiffres inventés sur l'accueil

- **Où :** bandeau d'accueil (« 120+ titres · 4.8/5 satisfaction · 6 pays desservis »).
- **Problème :** le catalogue compte 12 livres. Ces chiffres sont écrits en dur.
- **À faire :** au choix :
  - les retirer pour l'instant ;
  - afficher le vrai nombre de titres avec le `total` de `GET /api/v1/books?limit=1`, et retirer « satisfaction » et « pays » tant qu'on n'a pas de vraies données.

### 9. Accords au singulier

- **Où :** « +1 ventes » (best-sellers) et « 1 titres » (catégories populaires).
- **À faire :** une petite fonction réutilisable.

```ts
const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;
// pluriel(1, "vente") -> "1 vente" ; pluriel(3, "titre") -> "3 titres"
```

---

## Avant la mise en ligne

### 10. Pages légales et aide

- **Où :** pied de page : « Comment ça marche », « FAQ », « Contact », « Conditions générales », « Confidentialité ».
- **Problème :** les liens ne mènent nulle part.
- **À faire :** créer ces pages, même courtes. Les **conditions générales de vente** et la **politique de confidentialité** sont obligatoires pour un site qui vend et qui garde des emails. Je peux fournir le contenu sur ce que le site enregistre (compte, commandes, filigrane) si tu as besoin.

### 11. Page 404

- **Où :** toute adresse qui n'existe pas (exemple : `/cart`).
- **Problème :** c'est la page par défaut de Next.js, noire et en anglais.
- **À faire :** créer `app/not-found.tsx` aux couleurs du site : « Cette page n'existe pas », avec un bouton « Retour à l'accueil » et un bouton « Voir le catalogue ».

### 12. Newsletter

- **Où :** pied de page, champ « Votre email » + OK.
- **Problème :** le formulaire n'est relié à rien.
- **À faire :** le masquer pour l'instant. Si on veut le garder, dis-le-moi et j'ajoute une route `POST /api/v1/newsletter`.

---

## Espace admin (`/yeye-admin-admin`)

Le tableau de bord et la page Commandes affichent maintenant les vrais chiffres, bravo. Voici ce qui reste à améliorer.

### 13. Tableau de bord

- **« Titres publiés » sans chiffre :** afficher `books_published_count` de `/admin/stats`, et `books_total` pour le total.
- **Identifiants trop longs :** les commandes s'affichent avec l'`id` complet (`e508370f-522f-47ab-…`). Afficher une référence courte, `id.slice(0, 8).toUpperCase()`, donc `E508370F`. C'est aussi la référence inscrite dans le filigrane des livres : pratique pour retrouver qui a partagé un livre.
- **« Note moyenne » :** elle vient maintenant des vrais avis (`average_rating`). Si elle vaut 0, afficher « — » plutôt que « 0/5 ».

### 14. Commandes : confirmation avant de changer un statut

- **Où :** liste des commandes, menu déroulant de statut sur chaque ligne.
- **Problème :** passer une commande en « Remboursée » ou « Expirée / Annulée » **retire immédiatement les livres** de la bibliothèque du client, et un clic suffit. Le risque d'erreur est réel.
- **À faire :**
  - Avant d'envoyer le `PATCH`, demander une confirmation :
    - vers `refunded` ou `cancelled` : « Le client perdra l'accès à ses livres. Confirmer ? » ;
    - vers `paid` : « Les livres seront ajoutés à la bibliothèque du client. Confirmer ? ».
  - Si l'admin annule, remettre le menu sur l'ancienne valeur.
  - Après le changement, recharger `/admin/stats` pour mettre à jour les chiffres.
- **Afficher les livres :** la colonne « Articles » affiche « 1 titre ». La réponse de `/admin/orders` contient déjà `items` (`title`, `price`, `quantity`) : afficher les titres, au survol ou dans une ligne dépliable.

### 15. Catalogue admin

- **Fichier ePub (le plus important) :** rien n'indique quels livres ont un fichier lisible. Un livre publié sans ePub peut être acheté mais pas lu. Le backend renvoie `has_file` (vrai ou faux) et `epub_filename` pour chaque livre. À faire :
  - une colonne « ePub » avec une coche, ou un badge rouge « manquant » ;
  - si possible, un avertissement au moment de publier un livre sans fichier.
- **Langue :** une colonne « Langue » (`language` : fr ou en).
- **Filtre par statut :** `GET /api/v1/admin/books?status=all|published|draft|archived`. Des onglets « Tous / Publiés / Brouillons / Archivés » permettraient de retrouver les livres archivés.
- **Supprimer :** un livre déjà vendu n'est pas effacé mais archivé, pour que les acheteurs le gardent. La réponse contient un `message` qui le précise : l'afficher tel quel, et confirmer avant de supprimer.

### 16. Section « Avis »

- **Problème :** il n'y a pas encore de section pour modérer les avis.
- **Backend :**
  - `GET /api/v1/admin/reviews?page=1&limit=20` renvoie `items` avec `id`, `book_title`, `author_name`, `user_email`, `rating`, `comment`, `created_at` ;
  - `DELETE /api/v1/admin/reviews/{id}` supprime un avis, et la note du livre est recalculée automatiquement.
- **À faire :** une page « Avis » dans le menu de l'admin, avec la liste et un bouton « Supprimer » (avec confirmation).

---

## Mon espace : profil et mot de passe

### 17. Page « Mon profil »

- **Problème :** l'utilisateur ne peut modifier ni son nom ni son mot de passe.
- **Backend :**
  - `PUT /api/v1/auth/me` avec `{ first_name, last_name, phone }` (tous facultatifs). Renvoie `{ success, user }`, comme `/auth/me`.
  - `POST /api/v1/auth/change-password` avec `{ current_password, new_password }`. Le nouveau doit faire 8 caractères minimum.
- **Erreurs à afficher :**

| Code | Message à afficher |
|---|---|
| 400 `INVALID_CURRENT_PASSWORD` | Le mot de passe actuel est incorrect. |
| 400 `SAME_PASSWORD` | Choisissez un mot de passe différent de l'actuel. |
| 422 | Le mot de passe doit faire au moins 8 caractères. |
| 429 | Trop d'essais, réessayez dans quelques minutes. |

- **À faire :** une page « Mon profil » dans Mon espace, avec deux blocs :
  1. **Mes informations** (prénom, nom, téléphone ; l'email est affiché mais pas modifiable) ;
  2. **Mot de passe** (actuel, nouveau, confirmation, en vérifiant côté frontend que les deux nouveaux sont identiques).

  Après la modification du nom, mettre à jour le nom affiché dans le menu en haut. La session reste ouverte après un changement de mot de passe.

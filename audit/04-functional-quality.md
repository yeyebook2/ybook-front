# Rapport d'Audit Institutionnel — YéYéBook Frontend
## Document 04 : Qualité Fonctionnelle & Audit des Parcours Métier

---

### 1. Analyse des Parcours Utilisateurs Principaux

L'audit a passé au crible les 4 parcours fondamentaux de l'expérience YéYéBook :
1. **Découverte & Consultation du Catalogue**
2. **Panier, Achat & Validation Monétaire**
3. **Bibliothèque & Expérience de Lecture (ePub Reader)**
4. **Administration & Gestion Éditoriale (Catalogue, Avis, Commandes)**

---

### 2. Parcours 1 : Découverte & Catalogue — La Déconnexion des Langues

#### Diagnostic de la Gestion des Langues :
Un audit approfondi a été mené suite au constat du développeur backend indiquant que *"le backend ne voit toujours pas les langues des livres"*.

L'analyse de la chaîne technique révèle une déconnexion complète entre le formulaire d'administration et le modèle de données :

```
┌─────────────────────────────────┐      Omet totalement       ┌────────────────────────┐
│ AdminBookEditor.tsx             │ ─────────────────────────► │ admin.api.ts           │
│ Formulaire d'édition de livre   │      le champ 'language'   │ saveAdminBookApi()     │
└─────────────────────────────────┘                            └───────────┬────────────┘
                                                                           │ Envoie un payload
                                                                           │ sans clé 'language'
                                                                           ▼
                                                               ┌────────────────────────┐
                                                               │ Backend API            │
                                                               │ Colonne 'language'     │
                                                               │ reste NULL en base SQL │
                                                               └───────────┬────────────┘
                                                                           │
                                                                           ▼
┌─────────────────────────────────┐      Affiche 'fr' par      ┌────────────────────────┐
│ App.tsx:4847                    │ ◄───────────────────────── │ Réponse API            │
│ const langCode =                │      défaut artificiel     │ { id: 1, language:     │
│   (book as any).language || "fr"│                            │   null, title: ... }   │
└─────────────────────────────────┘                            └────────────────────────┘
```

#### Preuves dans le Code :
1. **Formulaire d'édition ([`src/features/admin/AdminBookEditor.tsx`](file:///home/rd/yeye-all/yeyebook-pre/src/features/admin/AdminBookEditor.tsx)) :**
   Le formulaire gère les champs `title`, `author_id`, `author_name`, `price`, `status`, `cover_image`, `description`, etc., mais **ne contient aucun champ d'entrée ni sélecteur pour la langue (`language`)**.
2. **Types d'entrée ([`src/features/admin/admin.types.ts`](file:///home/rd/yeye-all/yeyebook-pre/src/features/admin/admin.types.ts)) :**
   Le type `AdminBookInput` omettait le champ `language`.
3. **Affichage trompeur ([`src/App.tsx:4847`](file:///home/rd/yeye-all/yeyebook-pre/src/App.tsx#L4847)) :**
   Dans le tableau récapitulatif de l'administration, l'application exécute :
   ```tsx
   const langCode = (book as any).language || "fr"
   ```
   L'administrateur voit donc toujours affiché `"Français"` ou `"fr"`, ce qui masquait le fait que la valeur en base de données était en réalité `NULL`.

---

### 3. Parcours 2 : Panier & Flux d'Achat

#### Points Critiques Relevés :
1. **Panier uniquement stocké dans le navigateur (`localStorage`) :**
   - Le panier est géré dans [`src/features/cart/cart.storage.ts`](file:///home/rd/yeye-all/yeyebook-pre/src/features/cart/cart.storage.ts) via `yeyebook-cart`.
   - **Aucune synchronisation serveur :** Si un utilisateur prépare son panier sur mobile puis se connecte sur son ordinateur, son panier est vide.
   - En cas de déconnexion/reconnexion, aucune fusion de panier invité/connecté n'est réalisée.
2. **Coordination inter-onglets fragile (`localStorage` flags) :**
   - Pour déclencher le rafraîchissement de la bibliothèque après un achat réussi, le code utilise :
     ```tsx
     localStorage.setItem("ybook-library-refresh-needed", "true")
     ```
     Cette méthode est vulnérable aux pertes d'événements et ne remplace pas une gestion d'état centralisée ou l'utilisation d'une `BroadcastChannel` standard.

---

### 4. Parcours 3 : Bibliothèque & Liseuse Numérique (ePub Reader)

#### Statuts de Lecture & Continuité :
- **Régression antérieure corrigée :** Les statuts de lecture (`reading` -> "Continuer la lecture", `finished` -> "Relire", `unread` -> "Commencer la lecture") sont désormais correctement exploités depuis la réponse API de la bibliothèque.
- **Préservation de la progression :** Le bug où une progression à 99 % retombait à 0 % à l'ouverture a été neutralisé en bloquant l'envoi de la progression tant que `book.locations.generate()` n'est pas terminé et en ignorant le premier événement `relocated`.

#### Vulnérabilité de Résilience Réseau :
- Si la connexion est instable pendant la lecture, le streaming de l'ePub (découpage en chapitres chiffrés / privés) peut échouer. Le composant [`EpubWebReader.tsx`](file:///home/rd/yeye-all/yeyebook-pre/src/features/reader/EpubWebReader.tsx) dispose de timeouts, mais en cas d'expiration de la session JWT de 15 minutes (voir Document 02), les requêtes de chapitres renvoient une erreur 401 que le lecteur traite comme un fichier corrompu au lieu de déclencher un renouvellement de session.

---

### 5. Parcours 4 : Administration & Back-Office

#### Absence de Débouncing sur les Recherches :
- Dans [`src/App.tsx:3716-3720`](file:///home/rd/yeye-all/yeyebook-pre/src/App.tsx#L3716-L3720) :
  ```tsx
  useEffect(() => {
    if (tab === "catalog") {
      void fetchAdminBooks(catalogStatusFilter, catalogQuery)
    }
  }, [tab, catalogStatusFilter, catalogQuery, fetchAdminBooks])
  ```
  Le champ `catalogQuery` déclenche un appel API `/api/v1/admin/books?search=...` à **chaque frappe de touche**.
- **Impacts :**
  - Risque d'inversion des résultats (Race Condition) : la réponse à la frappe "ba" peut arriver après la réponse à "balzac", écrasant les résultats récents par d'anciens.
  - Surcharge inutile du serveur et risque de déclenchement du limiteur de débit HTTP 429.

---

### 6. Synthèse des Correctifs Métier Requis

1. **Intégration du sélecteur de langue :** Ajouter le champ `language` (liste normalisée ISO 639-1 : `fr`, `en`, `es`, etc.) dans [`AdminBookEditor.tsx`](file:///home/rd/yeye-all/yeyebook-pre/src/features/admin/AdminBookEditor.tsx) et l'inclure dans le payload envoyé à l'API.
2. **Ajout d'un hook `useDebounce` :** Temporiser toutes les recherches administratives et catalogue (300 ms à 500 ms) pour garantir l'ordre et la sobriété des requêtes réseau.
3. **Synchronisation du panier utilisateur :** Prévoir une route API de synchronisation ou fusion de panier dès que le backend le supportera.

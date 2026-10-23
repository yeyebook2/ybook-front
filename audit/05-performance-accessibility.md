# Rapport d'Audit Institutionnel — YéYéBook Frontend
## Document 05 : Performance Web (Core Web Vitals) & Accessibilité (WCAG)

---

### 1. Analyse des Performances & Core Web Vitals (CWV)

Dans le secteur du commerce électronique et des applications financières, la rapidité d'affichage et la fluidité des interactions influent directement sur le taux de conversion, la rétention utilisateur et l'indice de confiance.

#### 1.1. Surpoids du Bundle Initial (First Load JS)
Comme documenté lors du build de production (`next build`), chaque page de l'application impose le téléchargement d'un bundle initial de **174 kB** de JavaScript compressé (soit ~580 kB décompressé sur le thread principal).

*Causes techniques :*
- Importation statique des dépendances lourdes (`epubjs`, bibliothèques graphiques de back-office, tableaux de bord) dans [`src/App.tsx`](file:///home/rd/yeye-all/yeyebook-pre/src/App.tsx).
- Absence de découpage dynamique (`next/dynamic` ou `React.lazy`).

*Impact CWV :*
- Dégradation du **Total Blocking Time (TBT)** et du **Interaction to Next Paint (INP)** sur les appareils mobiles et connexions 3G/4G courantes en Afrique de l'Ouest.

---

#### 1.2. Absence Totale d'Optimisation des Images (`next/image`)
Un inventaire exhaustif du code montre que le composant haute performance de Next.js (`next/image`) **n'est utilisé nulle part dans le projet** (`git grep "next/image"` renvoie 0 résultat).

À la place, le projet utilise **25 balises HTML `<img>` brutes** réparties dans `App.tsx` et les sous-composants :
- [`src/App.tsx:949`](file:///home/rd/yeye-all/yeyebook-pre/src/App.tsx#L949), [`src/App.tsx:1270`](file:///home/rd/yeye-all/yeyebook-pre/src/App.tsx#L1270), [`src/App.tsx:2348`](file:///home/rd/yeye-all/yeyebook-pre/src/App.tsx#L2348), etc.

*Conséquences Directes :*
1. **Pénalité sévère sur le Largest Contentful Paint (LCP) :** Les couvertures de livres hébergées sur le CDN ou Unsplash sont téléchargées dans leur résolution d'origine non compressée (pouvant atteindre 2 à 5 Mo par image).
2. **Aucune conversion de format moderne :** Absence de négociation automatique vers les formats légers WebP ou AVIF.
3. **Risque de Cumulative Layout Shift (CLS) :** Les balises `<img>` sans dimensions intrinsèques réservées (`width` et `height` fixes ou conteneurs avec ratio d'aspect strict) provoquent des sauts de mise en page pendant le chargement.

---

#### 1.3. Débouncing Réseau & Gestion des Re-rendus
- **Absence de temporisation (Debounce) :**
  Les champs de recherche du catalogue d'administration ([`src/App.tsx:3716`](file:///home/rd/yeye-all/yeyebook-pre/src/App.tsx#L3716)) et des commandes déclenchent une requête réseau par caractère saisi. Outre le risque de surcharge serveur, cela sature le thread réseau du navigateur.
- **Cascade de re-rendus dans `App.tsx` :**
  En regroupant plus de 40 états React (`useState`) au niveau racine du composant `App`, toute modification d'un champ de filtre ou d'un timer réévalue des milliers de lignes de JSX, provoquant des micro-blocages de l'interface (jank).

---

### 2. Audit d'Accessibilité Numérique (WCAG 2.1 AA)

Une application commerciale d'envergure doit être utilisable par tous les profils d'utilisateurs, y compris ceux naviguant au clavier ou utilisant des lecteurs d'écran.

#### 2.1. Éléments Interactifs sans Étiquette Accessible
- Les boutons d'action rapide (icônes seules de recherche, fermeture de modal, boutons de pagination dans le lecteur ePub) manquent fréquemment d'attributs `aria-label`.
- Les champs de saisie de recherche n'ont pas d'élément `<label>` associé, se contentant d'un simple `placeholder`. Or, les placeholders ne sont pas reconnus comme des étiquettes fiables par les technologies d'assistance et disparaissent dès la saisie.

#### 2.2. Pièges au Clavier dans les Modales (Keyboard Focus Traps)
- Lorsque la modale de connexion/inscription ou le tiroir de détails d'une commande s'ouvre, le focus clavier (Touche `Tab`) n'est pas confiné à l'intérieur de la modale.
- Un utilisateur naviguant au clavier peut continuer à tabuler sur les éléments masqués en arrière-plan sous l'overlay, ce qui constitue une non-conformité majeure aux critères **WCAG 2.1 - 2.4.3 (Focus Order)**.

#### 2.3. Contraste des Couleurs & Retours d'Action
- Certaines mentions secondaires (bordeaux clair sur ivoire chaud `#FFF6EB` ou textes gris atténués) présentent des ratios de contraste inférieurs au minimum requis de **4.5:1** pour le texte standard.
- L'ajout d'un livre au panier ne dispose pas d'une zone d'annonce dynamique `aria-live="polite"` pour avertir vocalement l'utilisateur non-voyant de l'opération réalisée.

---

### 3. Recommandations & Optimisations Prévues

1. **Migration vers `next/image` :**
   Remplacer l'ensemble des balises `<img>` par `<Image />`, configurer les domaines distants dans `next.config.mjs`, et appliquer des attributs `sizes` adaptés à la grille responsive.
2. **Implémentation d'un Focus Trap :**
   Intégrer une primitive accessible (Radix UI Dialog ou gestion de focus native) pour toutes les modales et tiroirs afin d'empêcher les fuites de focus.
3. **Composant de recherche temporisée :**
   Systématiser l'emploi d'un hook `useDebounce(query, 350)` pour toutes les saisies textuelles connectées aux API.

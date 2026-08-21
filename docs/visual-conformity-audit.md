# Audit de conformité visuelle et fonctionnelle — YéYéBook

## Périmètre et références

Cet audit compare le rendu actuel Next.js 14 sur `http://localhost:5175` à l’export Figma validé servi sur `http://localhost:5173`. La comparaison porte sur la structure, les espacements, la palette, la typographie, les assets de marque, les sélections de livres, les états d’authentification, le panier et les routes partageables.

La charte contrôlée repose sur le rose magenta `#E04070`, le bordeaux `#B84870`, l’ivoire chaud `#FFF6EB`, l’encre chaude `#100908`, ainsi que les familles Inter, Poppins et Fraunces déjà présentes dans les tokens du projet.

## Écarts confirmés et corrections

| Écart observé | Preuve | Correction appliquée | Statut |
|---|---|---|---|
| Erreur d’hydratation sur l’accueil lorsque le panier localStorage contenait un article | La console signalait un `span` absent dans un bouton serveur, puis un remplacement du HTML par le client | Le panier, la session preview et la progression commencent avec des états SSR-safe puis sont restaurés dans un effet client ; la persistance est protégée jusqu’à l’hydratation | Corrigé |
| Section « Nouveautés » différente de la maquette | Figma rend `visibleBooks.slice(2, 6)` : Soundjata, Une si longue lettre, Les Bouts de bois de Dieu et Cahier d’un retour au pays natal ; Next rendait huit titres | `newReleases` utilise désormais `visibleBooks.slice(2, 6)` | Corrigé |
| Avatar du header comprimé à 0 px dans Next | La mesure DOM Figma donnait 32 px entre x=1214 et x=1246 ; Next donnait une largeur effective de 0 px | Le bouton avatar est maintenant `h-8 w-8 shrink-0`, centré et masqué par overflow contrôlé | Corrigé |
| Couverture preview cassée de « Une si longue lettre » | Une image manquante a été observée pendant la recette précédente | URL de couverture remplacée par un asset Unsplash déjà rendu valide dans le parcours preview | Corrigé antérieurement |

## Matrice de recette

| Route ou parcours | Vérification | Résultat |
|---|---|---|
| `/` | Header, hero bordeaux, CTA, indicateurs, trois couvertures inclinées, quatre nouveautés, footer et console | Conforme après corrections ; aucune erreur d’hydratation |
| `/catalog` | Facettes, filtres prix/notes/langues/dates, tri, grille, 8 titres, couvertures et footer | Conforme ; aucune erreur runtime |
| `/books/une-si-longue-lettre` | URL dynamique, couverture, auteur, prix 2 500 FCFA TTC, achat, onglets, sommaire, tags | Conforme ; aucune erreur runtime |
| `/login` | Panneau éditorial, wordmark, e-mail, mot de passe, lien d’oubli, CTA | Conforme ; aucune erreur runtime |
| `/register` | Champs d’identité, téléphone, mots de passe, trois consentements, CTA | Conforme ; aucune erreur runtime |
| `/checkout` | Panier preview restauré, étapes, total TTC, TVA incluse et formulaire invité | Conforme ; aucune erreur runtime |
| `/reader/une-si-longue-lettre` sans session | Garde privée et redirection vers login | Conforme ; aucune erreur runtime |

## Validation technique

Les contrôles suivants passent après les corrections :

```bash
pnpm typecheck
pnpm build
pnpm exec oxfmt --check src/App.tsx src/app src/features
git diff --check
```

Le build Next.js génère les onze routes App Router prévues. Les données preview restent distinctes du mode production et sont restaurées côté client uniquement lorsqu’elles dépendent du stockage navigateur.

## Conclusion

Le rendu actuel est **conforme à la maquette Figma sur les parcours contrôlés**, après correction des trois écarts confirmés de fidélité et d’hydratation. Une erreur de module manquant `./987.js` observée lors d’une reconstruction concurrente du serveur de développement a été résolue par suppression du cache `.next` et redémarrage propre ; elle ne se reproduit plus et la console de l’accueil est saine. La conformité porte sur l’interface et les comportements preview ; les intégrations backend, l’agrégateur de paiement, la session réelle et le lecteur e-book de production restent hors du périmètre de cet audit visuel.

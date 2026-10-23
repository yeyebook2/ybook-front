# Rapport d'Audit Institutionnel — YéYéBook Frontend
## Document 06 : Stratégie de Test, Assurance Qualité & Automatisation CI/CD

---

### 1. Le "Désert de Tests" : Bilan Chiffré

Dans une infrastructure logicielle traitant des transactions monétaires et la protection de droits d'auteurs numériques, **l'absence de tests automatisés constitue la vulnérabilité opérationnelle la plus critique**.

L'inspection complète du dépôt révèle un état de couverture nul :

```text
┌───────────────────────────────────────┬────────────┬────────────────────────┐
│ Catégorie de Test                     │ Fichiers   │ Couverture Constatée   │
├───────────────────────────────────────┼────────────┼────────────────────────┤
│ Tests Unitaires (*.test.ts)           │     0      │ 0,00 %                 │
│ Tests de Composants (*.test.tsx)      │     0      │ 0,00 %                 │
│ Tests d'Intégration API / Services    │     0      │ 0,00 %                 │
│ Tests Bout-en-Bout (Playwright/Cypress)│    0      │ 0,00 %                 │
│ Frameworks de Test Installés          │     -      │ Aucun (ni Vitest, ni   │
│                                       │            │ Jest, ni Playwright)   │
└───────────────────────────────────────┴────────────┴────────────────────────┘
```

#### Conséquence Métier Immédiate :
- Chaque mise en production ou modification de code repose exclusivement sur une vérification manuelle subjective.
- Les fonctionnalités critiques telles que le calcul du panier, l'application des codes de réduction, le calcul de la progression ePub, le parsing des erreurs HTTP ou la normalisation des profils utilisateurs peuvent régresser silencieusement sans qu'aucune alerte ne soit déclenchée.

---

### 2. Absence Totale de Chaîne CI/CD (Intégration Continue)

L'audit des répertoires de configuration système montre l'absence complète d'automatisation des contrôles qualité :
- Aucun dossier `.github/workflows/`.
- Aucun fichier `.gitlab-ci.yml`, `.circleci/` ou équivalent.
- Aucun hook pre-commit (ni Husky, ni lint-staged).
- Aucun fichier de conteneurisation (`Dockerfile`, `docker-compose.yml`) pour standardiser les environnements d'exécution et de déploiement.

#### Risques de Déploiement :
1. **Pousser du code cassé sur `main` :** Un développeur peut fusionner un code comportant des erreurs de types TypeScript ou des échecs de build sans qu'un garde-fou centralisé ne bloque le merge.
2. **Dérive environnementale :** Le comportement du frontend peut différer entre la machine de développement locale et le serveur de production sans conteneur de référence.

---

### 3. Matrice Minimale des Tests Requis pour le Niveau Institutionnel

Pour prétendre au standard de fiabilité bancaire, le frontend doit impérativement disposer d'une couverture de tests automatisés sur les blocs fonctionnels suivants :

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Tests Unitaires (Vitest)                                                 │
│    • Calculs de panier (totaux, quantités, sélections partielles)           │
│    • Application des coupons de réduction (pourcentage, montant fixe)       │
│    • Normalisation des utilisateurs et validation des profils               │
│    • Parseur d'erreurs API (codes HTTP, formats FastAPI, fallbacks)         │
│    • Algorithme de calcul du pourcentage de lecture ePub                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. Tests d'Intégration (Vitest + React Testing Library + MSW)               │
│    • Soumission du formulaire de connexion avec simulation 200 et 401       │
│    • Mécanisme de rafraîchissement silencieux de session sur 401            │
│    • Page de retour de paiement /checkout/retour (cas 200, échec, URL fausse)│
│    • Formulaire d'édition de livre admin avec champ 'language'              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. Tests Bout-en-Bout (Playwright)                                          │
│    • Parcours complet : Inscription -> Connexion -> Ajout Panier ->         │
│      Validation Achat -> Bibliothèque -> Ouverture Liseuse                  │
│    • Contrôle de non-régression sur le retour de paiement FedaPay           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 4. Spécification du Pipeline CI/CD Recommandé

La mise en place d'un workflow GitHub Actions minimal sur toute Pull Request et tout push vers `main` est un prérequis incontournable :

```yaml
# .github/workflows/ci.yml (Spécification recommandée)
name: YéYéBook Frontend Quality Gate

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Installer les dépendances
        run: pnpm install --frozen-lockfile

      - name: Audit de Sécurité (Dépendances)
        run: pnpm audit --audit-level=high

      - name: Vérification des Types TypeScript
        run: pnpm typecheck

      - name: Analyse Statique (Lint)
        run: pnpm lint

      - name: Exécution des Tests Automatisés
        run: pnpm test:ci

      - name: Compilation de Production
        run: pnpm build
```

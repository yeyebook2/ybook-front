# Audit visuel Next.js

**Mise à jour : 31 août 2026**

L’interface Next.js reprend la charte YéYéBook : rose magenta `#E04070`, bordeaux `#B84870`, ivoire `#FFF6EB`, encre chaude `#100908`, Inter, Poppins et Fraunces.

## Parcours contrôlés

- `/login` et `/register` : structure éditoriale, validations et boutons de visibilité du mot de passe.
- `/` : navigation, hero, sections éditoriales et états vides lorsque l’API ne répond pas.
- `/catalog` : chargement, erreur, résultats vides, filtres et pagination.
- `/books/[slug]` : chargement et erreur API.
- `/dashboard` : garde de session, chargement et erreur API.

## Correction du champ mot de passe

Le suffixe contenant `Eye` ou `EyeOff` est positionné indépendamment du flux de l’input et centré dans la hauteur du champ. L’input réserve l’espace droit nécessaire afin que son texte ne passe pas sous le bouton.

## Données

La conformité visuelle ne repose plus sur des données preview intégrées au bundle. Les contenus métier visibles doivent venir de l’API. En cas d’échec, l’interface utilise ses états de chargement, d’erreur ou vides et affiche un toast lorsqu’il est disponible.

## Limites

Le paiement réel, les webhooks, le panier serveur, la bibliothèque synchronisée, le lecteur EPUB et les mutations administratives restent à intégrer. Leur rendu ne doit pas être confondu avec une validation fonctionnelle backend.
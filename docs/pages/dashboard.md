# Dashboard lecteur

Le dashboard est protégé par `AuthGuard`. Il charge exclusivement ses données depuis les endpoints de bibliothèque, de progression et de catalogue documentés dans `docs/api/dashboard.md`.

Il affiche le résumé de la bibliothèque, les lectures en cours et les recommandations uniquement lorsque l’API les fournit. En cas d’échec, il affiche un état d’erreur, propose `Réessayer` et déclenche un toast. Aucune statistique ou recommandation de démonstration n’est utilisée.

La garde frontend améliore l’expérience, mais chaque endpoint privé doit contrôler la session et les autorisations côté serveur.
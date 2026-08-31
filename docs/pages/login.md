# Page de connexion

La page est composée de `LoginPage`, `LoginForm`, `AuthShell`, `FormField`, `PasswordField` et `AuthSubmitButton`.

Le frontend valide l’e-mail et le mot de passe, puis appelle `POST /api/v1/auth/login`. Une réponse réussie doit contenir l’utilisateur et créer la session backend. L’utilisateur est ensuite redirigé vers `/`.

En cas d’échec réseau, de configuration absente ou de réponse non valide, un toast d’erreur est affiché. Aucun utilisateur de démonstration et aucune session locale ne sont créés.

Le lien Mot de passe oublié appelle `POST /api/v1/auth/forgot-password` et affiche le message retourné.
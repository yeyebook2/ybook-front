# Page de connexion — YéYéBook

## Rôle de la page

La page de connexion permet à un lecteur existant d’ouvrir sa session YéYéBook. Elle est assemblée par `LoginPage.tsx`, qui combine le shell éditorial partagé et `LoginForm.tsx`.

## Composition

```text
src/features/auth/pages/LoginPage.tsx
src/features/auth/components/AuthShell.tsx
src/features/auth/components/AuthBrand.tsx
src/features/auth/components/LoginForm.tsx
src/features/auth/components/FormField.tsx
src/features/auth/components/PasswordField.tsx
src/features/auth/components/AuthSubmitButton.tsx
```

## Validation locale

L’adresse e-mail est obligatoire et doit respecter un format valide. Le mot de passe est obligatoire et doit contenir au moins six caractères. Les erreurs sont rendues près du champ concerné avec `aria-invalid`, `aria-describedby` et `role="alert"`.

## États fonctionnels

La soumission affiche un état de chargement puis transmet la réponse à l’application racine. En mode preview, une réponse valide crée une session temporaire de démonstration et ouvre le dashboard avec un toast de succès. En mode API, la session est créée par le backend et la réponse doit contenir l’utilisateur authentifié.

Le lien Mot de passe oublié transmet l’e-mail saisi à `forgotPassword`. Le service appelle `POST /api/v1/auth/forgot-password` lorsque l’API est configurée et conserve un message preview tant que le backend n’est pas disponible.

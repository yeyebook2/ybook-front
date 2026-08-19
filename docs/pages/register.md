# Page d’inscription — YéYéBook

## Rôle de la page

La page d’inscription permet de créer un compte lecteur. Elle est assemblée par `RegisterPage.tsx`, qui combine `AuthShell` et `RegisterForm` sans contenir la logique détaillée des champs.

## Données du formulaire

```ts
type RegisterFormValues = {
  name: string
  email: string
  password: string
  confirmPassword: string
}
```

Le nom, l’adresse e-mail, le mot de passe et la confirmation sont obligatoires. Le mot de passe doit contenir au moins six caractères et être identique à sa confirmation.

## États fonctionnels

Le formulaire expose les erreurs par champ et un état de soumission. En mode preview, une inscription valide crée une session temporaire et ouvre le dashboard protégé avec un toast. Avec un backend configuré, les données sont transmises à `POST /auth/register` et la session doit être créée par le backend.

## Évolutions prévues

Le backend devra préciser la vérification d’adresse e-mail, les conditions de mot de passe, les éventuels consentements, la gestion d’un e-mail déjà utilisé et la procédure de récupération de compte.

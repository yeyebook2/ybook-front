# Page d’inscription — YéYéBook

## Rôle de la page

La page d’inscription permet de créer un compte lecteur. Elle est assemblée par `RegisterPage.tsx`, qui combine `AuthShell` et `RegisterForm` sans contenir la logique détaillée des champs.

## Données du formulaire

```ts
type RegisterFormValues = {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
  acceptPrivacy: boolean
  acceptMarketing: boolean
}
```

Le prénom, le nom, l’adresse e-mail, le téléphone, le mot de passe et sa confirmation sont obligatoires. Le mot de passe doit contenir au moins six caractères et être identique à sa confirmation. Les consentements CGU et politique de confidentialité sont obligatoires et le consentement marketing est facultatif.

## États fonctionnels

Le formulaire expose les erreurs par champ et un état de soumission. En mode preview, une inscription valide crée une session temporaire de lecteur et ouvre le dashboard protégé avec un toast. Avec un backend configuré, les données sont transmises à `POST /api/v1/auth/register` avec les noms de champs définis dans le cahier des charges.

## Évolutions prévues

Le backend devra préciser la vérification d’adresse e-mail et de téléphone, les conditions de mot de passe, la gestion d’un e-mail déjà utilisé et la procédure de récupération de compte. La vérification OTP, le KYC et les informations auteur appartiennent au portail auteur de la Phase 2 et ne doivent pas être ajoutés au formulaire lecteur actuel sans décision produit.

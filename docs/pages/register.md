# Page d’inscription

La page collecte : prénom, nom, e-mail, téléphone, mot de passe, confirmation, consentement aux conditions, consentement à la confidentialité et consentement marketing facultatif.

Après validation locale, le frontend appelle `POST /api/v1/auth/register`. La confirmation du mot de passe n’est pas envoyée. Une réponse réussie doit contenir l’utilisateur et établir la session backend, puis le frontend redirige vers `/`.

En cas d’échec, un toast affiche le message de l’API. Aucun compte ou utilisateur local de démonstration n’est créé.
import { AuthShell } from "../components/AuthShell"
import { LoginForm } from "../components/LoginForm"

type LoginPageProps = {
  onBack: () => void
  onRegister: () => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
  onForgotPassword: () => void
}

export function LoginPage({
  onBack,
  onRegister,
  onSuccess,
  onError,
  onForgotPassword,
}: LoginPageProps) {
  return (
    <AuthShell
      eyebrow="Espace lecteur"
      title="Retrouvez vos lectures."
      description="Connectez-vous pour accéder à votre bibliothèque et reprendre vos livres là où vous les avez laissés."
      footerPrompt="Pas encore de compte ?"
      footerAction="Créer un compte"
      onFooterAction={onRegister}
      onBack={onBack}
    >
      <LoginForm
        onSuccess={onSuccess}
        onError={onError}
        onForgotPassword={onForgotPassword}
      />
    </AuthShell>
  )
}

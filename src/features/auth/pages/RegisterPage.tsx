import { AuthShell } from "../components/AuthShell"
import type { AuthApiResponse } from "../types"
import { RegisterForm } from "../components/RegisterForm"

type RegisterPageProps = {
  onBack: () => void
  onLogin: () => void
  onSuccess: (response: AuthApiResponse) => void
  onError: (message: string) => void
}

export function RegisterPage({
  onBack,
  onLogin,
  onSuccess,
  onError,
}: RegisterPageProps) {
  return (
    <AuthShell
      eyebrow="Rejoindre YéYéBook"
      title="Votre prochaine histoire commence ici."
      description="Créez votre compte en quelques instants et construisez votre bibliothèque de littérature africaine francophone."
      footerPrompt="Vous avez déjà un compte ?"
      footerAction="Se connecter"
      onFooterAction={onLogin}
      onBack={onBack}
    >
      <RegisterForm onSuccess={onSuccess} onError={onError} />
    </AuthShell>
  )
}

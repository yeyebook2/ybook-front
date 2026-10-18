import { useState } from "react"
import { Check, KeyRound, Loader2, User } from "lucide-react"
import type { AuthUser } from "@/features/auth/types"
import { changePassword, updateProfile } from "@/features/auth/auth.api"
import type { ToastVariant } from "@/components/ui/Toast"

type UserProfileViewProps = {
  user: AuthUser
  onUserUpdated: (user: AuthUser) => void
  onToast: (message: string, variant?: ToastVariant) => void
}

export function UserProfileView({
  user,
  onUserUpdated,
  onToast,
}: UserProfileViewProps) {
  // Parsing existing name into first/last name
  const nameParts = user.name ? user.name.trim().split(" ") : []
  const initialFirstName = nameParts[0] || ""
  const initialLastName = nameParts.slice(1).join(" ") || ""

  // Info state
  const [firstName, setFirstName] = useState(initialFirstName)
  const [lastName, setLastName] = useState(initialLastName)
  const [phone, setPhone] = useState(user.phone || "")
  const [infoLoading, setInfoLoading] = useState(false)
  const [infoSuccess, setInfoSuccess] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setInfoLoading(true)
    setInfoSuccess(false)
    try {
      const updatedUser = await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
      })
      onUserUpdated(updatedUser)
      setInfoSuccess(true)
      onToast("Informations enregistrées avec succès.", "success")
      setTimeout(() => setInfoSuccess(false), 3000)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de mettre à jour vos informations."
      onToast(message, "error")
    } finally {
      setInfoLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword.length < 8) {
      setPasswordError("Le mot de passe doit faire au moins 8 caractères.")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.")
      return
    }

    setPasswordLoading(true)
    try {
      const res = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      setPasswordSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      onToast(res.message || "Mot de passe modifié avec succès.", "success")
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de modifier votre mot de passe."
      setPasswordError(message)
      onToast(message, "error")
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <section className="flex flex-col gap-2xl max-w-[800px]" aria-labelledby="profile-title">
      <div>
        <span className="text-video-title font-semibold uppercase tracking-[0.16em] text-brand-muted">
          Compte lecteur
        </span>
        <h2
          id="profile-title"
          className="font-serif text-[28px] font-bold tracking-[-0.035em] text-text-primary"
        >
          Mon profil
        </h2>
      </div>

      {/* Bloc 1 : Mes informations */}
      <div className="rounded-corner-xl border border-border-secondary bg-surface-bg p-2xl shadow-sm">
        <div className="mb-xl flex items-center gap-md border-b border-border-secondary pb-lg">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-corner-full bg-brand-tertiary text-brand-primary">
            <User className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-serif text-heading font-bold text-text-primary">
              Mes informations
            </h3>
            <p className="text-label-sm text-text-secondary">
              Mettez à jour votre nom et votre numéro de téléphone.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateInfo} className="space-y-lg">
          <div className="grid gap-lg sm:grid-cols-2">
            <div>
              <label
                htmlFor="profile-first-name"
                className="mb-xs block text-label-sm font-medium text-text-secondary"
              >
                Prénom
              </label>
              <input
                id="profile-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Votre prénom"
                className="w-full rounded-corner-md border border-border-secondary bg-surface-secondary-bg px-lg py-md text-label-sm text-text-primary focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="profile-last-name"
                className="mb-xs block text-label-sm font-medium text-text-secondary"
              >
                Nom
              </label>
              <input
                id="profile-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Votre nom"
                className="w-full rounded-corner-md border border-border-secondary bg-surface-secondary-bg px-lg py-md text-label-sm text-text-primary focus:border-brand-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-lg sm:grid-cols-2">
            <div>
              <label
                htmlFor="profile-email"
                className="mb-xs block text-label-sm font-medium text-text-secondary"
              >
                Adresse e-mail
              </label>
              <input
                id="profile-email"
                type="email"
                value={user.email}
                disabled
                className="w-full cursor-not-allowed rounded-corner-md border border-border-secondary bg-surface-secondary-bg/50 px-lg py-md text-label-sm text-text-tertiary"
              />
              <span className="mt-xs block text-video-title text-text-tertiary">
                L'adresse e-mail est non modifiable.
              </span>
            </div>
            <div>
              <label
                htmlFor="profile-phone"
                className="mb-xs block text-label-sm font-medium text-text-secondary"
              >
                Numéro de téléphone
              </label>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+225 07..."
                className="w-full rounded-corner-md border border-border-secondary bg-surface-secondary-bg px-lg py-md text-label-sm text-text-primary focus:border-brand-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-md pt-sm">
            <button
              type="submit"
              disabled={infoLoading}
              className="inline-flex cursor-pointer items-center justify-center gap-sm rounded-corner-md bg-brand-primary px-xl py-md text-label-sm font-semibold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {infoLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {infoSuccess && <Check className="h-4 w-4" />}
              {infoSuccess ? "Enregistré" : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      </div>

      {/* Bloc 2 : Mot de passe */}
      <div className="rounded-corner-xl border border-border-secondary bg-surface-bg p-2xl shadow-sm">
        <div className="mb-xl flex items-center gap-md border-b border-border-secondary pb-lg">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-corner-full bg-brand-tertiary text-brand-primary">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-serif text-heading font-bold text-text-primary">
              Sécurité & Mot de passe
            </h3>
            <p className="text-label-sm text-text-secondary">
              Choisissez un mot de passe sécurisé d'au moins 8 caractères.
            </p>
          </div>
        </div>

        {passwordError && (
          <div
            className="mb-lg rounded-corner-md border border-danger/25 bg-state-error-bg p-md text-label-sm text-danger"
            role="alert"
          >
            {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-lg">
          <div>
            <label
              htmlFor="current-password"
              className="mb-xs block text-label-sm font-medium text-text-secondary"
            >
              Mot de passe actuel
            </label>
            <input
              id="current-password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-corner-md border border-border-secondary bg-surface-secondary-bg px-lg py-md text-label-sm text-text-primary focus:border-brand-primary focus:outline-none sm:max-w-[400px]"
            />
          </div>

          <div className="grid gap-lg sm:grid-cols-2">
            <div>
              <label
                htmlFor="new-password"
                className="mb-xs block text-label-sm font-medium text-text-secondary"
              >
                Nouveau mot de passe
              </label>
              <input
                id="new-password"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Au moins 8 caractères"
                className="w-full rounded-corner-md border border-border-secondary bg-surface-secondary-bg px-lg py-md text-label-sm text-text-primary focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="confirm-password"
                className="mb-xs block text-label-sm font-medium text-text-secondary"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Répétez le nouveau mot de passe"
                className="w-full rounded-corner-md border border-border-secondary bg-surface-secondary-bg px-lg py-md text-label-sm text-text-primary focus:border-brand-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-md pt-sm">
            <button
              type="submit"
              disabled={passwordLoading}
              className="inline-flex cursor-pointer items-center justify-center gap-sm rounded-corner-md bg-brand-primary px-xl py-md text-label-sm font-semibold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {passwordLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {passwordSuccess && <Check className="h-4 w-4" />}
              {passwordSuccess
                ? "Mot de passe changé"
                : "Changer le mot de passe"}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

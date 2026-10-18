import { X } from "lucide-react"

export type LegalModalType =
  | "how-it-works"
  | "faq"
  | "contact"
  | "terms"
  | "privacy"

type LegalModalProps = {
  type: LegalModalType | null
  onClose: () => void
}

const CONTENT: Record<
  LegalModalType,
  { title: string; subtitle: string; content: React.ReactNode }
> = {
  "how-it-works": {
    title: "Comment ça marche",
    subtitle: "Votre expérience de lecture numérique sur YéYéBook",
    content: (
      <div className="space-y-lg text-label-sm leading-relaxed text-text-secondary">
        <div>
          <h4 className="font-semibold text-text-primary mb-xs">
            1. Choisissez vos lectures
          </h4>
          <p>
            Parcourez notre catalogue exclusif d'e-books dédiés aux littératures
            africaines francophones : romans, poésie, contes, essais et nouvelles.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-text-primary mb-xs">
            2. Paiement simple & sécurisé
          </h4>
          <p>
            Réglez instantanément avec vos moyens de paiement locaux préférés :
            Mobile Money (Orange Money, MTN, Wave, Moov) ou carte bancaire via
            notre passerelle agréée FedaPay.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-text-primary mb-xs">
            3. Lisez immédiatement
          </h4>
          <p>
            Dès validation de votre achat, votre e-book est automatiquement
            déposé dans « Ma bibliothèque ». Lisez-le directement sur votre
            smartphone, tablette ou ordinateur dans notre lecteur sécurisé.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-text-primary mb-xs">
            4. Protection par filigrane
          </h4>
          <p>
            Chaque exemplaire comporte un filigrane personnalisé discret avec
            votre identifiant pour protéger le travail des auteurs et lutter
            contre le piratage.
          </p>
        </div>
      </div>
    ),
  },
  faq: {
    title: "Foire Aux Questions (FAQ)",
    subtitle: "Toutes les réponses à vos questions courantes",
    content: (
      <div className="space-y-xl text-label-sm leading-relaxed text-text-secondary">
        <div>
          <h4 className="font-semibold text-text-primary mb-xs">
            Comment accéder à mes livres achetés ?
          </h4>
          <p>
            Connectez-vous à votre compte YéYéBook et rendez-vous dans l'onglet
            « Ma bibliothèque ». Tous vos livres achetés y sont conservés à vie
            et accessibles à tout instant.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-text-primary mb-xs">
            Quels moyens de paiement puis-je utiliser ?
          </h4>
          <p>
            Nous acceptons les paiements Mobile Money (Orange Money, MTN Mobile
            Money, Wave, Moov Money) ainsi que les cartes Visa et Mastercard.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-text-primary mb-xs">
            Dois-je installer une application spécifique ?
          </h4>
          <p>
            Non. YéYéBook intègre un lecteur ePub moderne et optimisé qui
            fonctionne directement dans votre navigateur web habituel (Chrome,
            Safari, Firefox, etc.).
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-text-primary mb-xs">
            Que se passe-t-il si mon paiement est interrompu ?
          </h4>
          <p>
            Une commande en attente reste active pendant 60 minutes. Passé ce
            délai sans validation, elle expire automatiquement. Aucun débit n'est
            effectué sans votre validation sur votre téléphone.
          </p>
        </div>
      </div>
    ),
  },
  contact: {
    title: "Contactez-nous",
    subtitle: "Une question ou besoin d'assistance ? Notre équipe est à votre écoute.",
    content: (
      <div className="space-y-lg text-label-sm leading-relaxed text-text-secondary">
        <p>
          Pour toute question concernant une commande, un accès à un e-book, ou
          pour les auteurs souhaitant publier sur YéYéBook, contactez notre
          service d'assistance :
        </p>
        <div className="rounded-corner-lg border border-border-secondary bg-surface-secondary-bg p-lg space-y-sm">
          <p>
            <strong className="text-text-primary">E-mail support :</strong>{" "}
            <a
              href="mailto:contact@yeyebook.com"
              className="text-brand-primary font-medium hover:underline"
            >
              contact@yeyebook.com
            </a>
          </p>
          <p>
            <strong className="text-text-primary">Disponibilité :</strong> Du
            lundi au samedi, de 8h à 19h (GMT).
          </p>
          <p>
            <strong className="text-text-primary">Localisation :</strong>{" "}
            Abidjan, Côte d'Ivoire &amp; Dakar, Sénégal.
          </p>
        </div>
      </div>
    ),
  },
  terms: {
    title: "Conditions Générales de Vente",
    subtitle: "Modalités d'achat d'e-books numériques sur YéYéBook",
    content: (
      <div className="space-y-lg text-label-sm leading-relaxed text-text-secondary">
        <div>
          <h4 className="font-semibold text-text-primary mb-xs">
            1. Objet et champ d'application
          </h4>
          <p>
            Les présentes Conditions Générales de Vente (CGV) s'appliquent à tout
            achat d'ouvrages numériques (e-books) effectué sur la plateforme
            YéYéBook.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-text-primary mb-xs">
            2. Prix et paiement
          </h4>
          <p>
            Les prix de nos ouvrages sont affichés en Francs CFA (FCFA) toutes
            taxes comprises. Le règlement s'effectue en ligne au comptant via
            Mobile Money ou carte bancaire à travers la passerelle sécurisée
            FedaPay.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-text-primary mb-xs">
            3. Livraison numérique &amp; Rétractation
          </h4>
          <p>
            La livraison des e-books s'effectue de manière instantanée dès la
            confirmation du paiement. Conformément aux usages du commerce
            électronique des contenus numériques dématérialisés, le droit de
            rétractation ne peut être exercé une fois la mise à disposition du
            livre effectuée.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-text-primary mb-xs">
            4. Propriété intellectuelle et filigrane
          </h4>
          <p>
            Tous les livres proposés sur YéYéBook sont protégés par le droit
            d'auteur. L'acheteur acquiert un droit d'usage personnel et non
            transférable. Tout partage, reproduction ou diffusion publique est
            strictement interdit. Un filigrane électronique discret comprenant
            l'e-mail de l'acheteur et la référence de commande est apposé sur
            chaque chapitre.
          </p>
        </div>
      </div>
    ),
  },
  privacy: {
    title: "Politique de Confidentialité",
    subtitle: "Protection de vos données personnelles sur YéYéBook",
    content: (
      <div className="space-y-lg text-label-sm leading-relaxed text-text-secondary">
        <div>
          <h4 className="font-semibold text-text-primary mb-xs">
            1. Données collectées
          </h4>
          <p>
            Nous collectons uniquement les informations nécessaires au bon
            fonctionnement du service : votre adresse e-mail, vos nom et prénom,
            votre numéro de téléphone (pour initier les paiements Mobile Money)
            et votre progression de lecture dans vos ouvrages.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-text-primary mb-xs">
            2. Utilisation et sécurité
          </h4>
          <p>
            Vos données servent à la gestion de votre compte, à l'accès sécurisé
            à votre bibliothèque et à la personnalisation du filigrane de vos
            ouvrages. Vos données bancaires ou codes secrets Mobile Money ne sont
            jamais stockés sur nos serveurs : ils sont traités exclusivement par
            FedaPay sous protocole sécurisé HTTPS / TLS.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-text-primary mb-xs">
            3. Non-partage à des tiers
          </h4>
          <p>
            YéYéBook s'engage à ne jamais vendre, louer ou commercialiser vos
            données personnelles à des tiers.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-text-primary mb-xs">
            4. Vos droits
          </h4>
          <p>
            Vous pouvez à tout moment modifier vos informations dans votre espace
            « Mon profil » ou demander la suppression définitive de vos données
            en écrivant à contact@yeyebook.com.
          </p>
        </div>
      </div>
    ),
  },
}

export function LegalModal({ type, onClose }: LegalModalProps) {
  if (!type) return null
  const current = CONTENT[type]
  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-md sm:p-xl bg-[#100908]/60 backdrop-blur-sm animate-fade"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="relative flex max-h-[88vh] w-full max-w-[680px] flex-col rounded-corner-xl border border-border-secondary bg-surface-bg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border-secondary p-xl bg-surface-secondary-bg/60">
          <div>
            <h3
              id="legal-modal-title"
              className="font-serif text-[22px] font-bold text-text-primary"
            >
              {current.title}
            </h3>
            <p className="mt-xs text-label-sm text-text-secondary">
              {current.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-corner-full text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-xl sm:p-2xl">{current.content}</div>

        {/* Footer */}
        <div className="border-t border-border-secondary p-lg bg-surface-secondary-bg/30 text-right">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex cursor-pointer rounded-corner-md bg-brand-primary px-xl py-sm text-label-sm font-semibold text-on-brand hover:bg-brand-hover transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://yeyebook.com"),
  title: {
    default: "YéYéBook — Le nouveau souffle de la littérature africaine",
    template: "%s — YéYéBook",
  },
  description:
    "La plateforme de référence pour les e-books d’auteurs africains francophones.",
  applicationName: "YéYéBook",
  keywords: ["ebooks africains", "littérature africaine", "FCFA", "Togo"],
  icons: {
    icon: [
      { url: "/brand/ybook-favicon-16.png", sizes: "16x16" },
      { url: "/brand/ybook-favicon-180.png", sizes: "180x180" },
    ],
    apple: "/brand/ybook-favicon-180.png",
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}

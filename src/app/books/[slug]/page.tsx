import type { Metadata } from "next"
import { RouteEntry } from "../../route-entry"

export function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Metadata {
  return {
    title: "Fiche livre",
    description: "Découvrez un e-book africain francophone sur YéYéBook.",
    alternates: { canonical: `/books/${params.slug}` },
  }
}

export default function BookDetailRoute({
  params,
}: {
  params: { slug: string }
}) {
  return <RouteEntry view="details" bookSlug={params.slug} />
}

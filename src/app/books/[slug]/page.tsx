import type { Metadata } from "next"
import { RouteEntry } from "../../route-entry"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return {
    title: "Fiche livre",
    description: "Découvrez un e-book africain francophone sur YéYéBook.",
    alternates: { canonical: `/books/${slug}` },
  }
}

export default async function BookDetailRoute({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <RouteEntry view="details" bookSlug={slug} />
}

import { RouteEntry } from "../../route-entry"

export const metadata = { title: "Lecteur" }

export default async function ReaderRoute({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <RouteEntry view="reader" readerSlug={slug} />
}

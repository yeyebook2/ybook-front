import { RouteEntry } from "../../route-entry"

export const metadata = { title: "Lecteur" }

export default function ReaderRoute({ params }: { params: { slug: string } }) {
  return <RouteEntry view="reader" readerSlug={params.slug} />
}

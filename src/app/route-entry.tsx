import App, { type View } from "@/App"

export function RouteEntry({
  view = "home",
  bookSlug,
  readerSlug,
}: {
  view?: View
  bookSlug?: string
  readerSlug?: string
}) {
  return (
    <App
      initialView={view}
      initialBookSlug={bookSlug}
      initialReaderSlug={readerSlug}
    />
  )
}

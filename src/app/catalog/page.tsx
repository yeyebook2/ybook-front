import { RouteEntry } from "../route-entry"

export const metadata = {
  title: "Catalogue",
  description:
    "Explorez les e-books africains francophones disponibles sur YéYéBook.",
}

export default function CatalogRoute() {
  return <RouteEntry view="catalog" />
}

import { useEffect, useState } from "react"
import { AlertCircle, Clock, Package, RefreshCw, ShoppingBag } from "lucide-react"
import { formatPrice } from "@/features/catalog/catalog.utils"
import { getMyOrders } from "../dashboard.api"
import type { UserOrder } from "../types"

const STATUS_LABELS: Record<string, { label: string; badgeClass: string }> = {
  pending: {
    label: "En attente de paiement",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
  },
  paid: {
    label: "Payée",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  completed: {
    label: "Payée",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  cancelled: {
    label: "Annulée / expirée",
    badgeClass: "bg-stone-100 text-stone-700 border-stone-300",
  },
  refunded: {
    label: "Remboursée",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
  },
}

type UserOrdersViewProps = {
  onCatalog: () => void
}

export function UserOrdersView({ onCatalog }: UserOrdersViewProps) {
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyOrders()
      setOrders(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger vos commandes.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [])

  if (loading) {
    return (
      <section className="flex flex-col gap-lg" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded bg-border-secondary" />
        <div className="space-y-md">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-corner-lg border border-border-secondary bg-surface-bg"
            />
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="flex flex-col items-start gap-md rounded-corner-lg border border-danger/25 bg-state-error-bg p-xl">
        <div className="flex items-center gap-md text-danger">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          <p className="font-semibold">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => void loadOrders()}
          className="inline-flex cursor-pointer items-center gap-sm rounded-corner-md bg-brand-primary px-lg py-sm text-label-sm font-semibold text-on-brand hover:bg-brand-hover"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Réessayer
        </button>
      </section>
    )
  }

  if (orders.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center gap-lg rounded-corner-xl border border-dashed border-border-primary bg-surface-bg px-xl py-5xl text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-corner-full bg-brand-tertiary text-brand-primary">
          <ShoppingBag className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-xs max-w-[420px]">
          <h2 className="font-serif text-heading font-bold text-text-primary">
            Aucune commande pour le moment
          </h2>
          <p className="text-label-sm text-text-secondary">
            Vos achats et commandes passées sur YéYéBook s'afficheront ici.
          </p>
        </div>
        <button
          type="button"
          onClick={onCatalog}
          className="inline-flex cursor-pointer items-center gap-sm rounded-corner-md bg-brand-primary px-xl py-md text-label-sm font-semibold text-on-brand hover:bg-brand-hover"
        >
          Découvrir le catalogue
        </button>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-xl" aria-labelledby="user-orders-title">
      <div className="flex items-center justify-between gap-md">
        <div>
          <span className="text-video-title font-semibold uppercase tracking-[0.16em] text-brand-muted">
            Achats & Transactions
          </span>
          <h2
            id="user-orders-title"
            className="font-serif text-[28px] font-bold tracking-[-0.035em] text-text-primary"
          >
            Mes commandes
          </h2>
        </div>
        <span className="text-label-sm text-text-tertiary">
          {orders.length} {orders.length > 1 ? "commandes" : "commande"}
        </span>
      </div>

      <div className="overflow-hidden rounded-corner-xl border border-border-secondary bg-surface-bg shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-label-sm">
            <thead className="border-b border-border-secondary bg-surface-secondary-bg text-text-tertiary">
              <tr>
                <th scope="col" className="px-xl py-lg font-semibold">
                  Réf.
                </th>
                <th scope="col" className="px-xl py-lg font-semibold">
                  Date
                </th>
                <th scope="col" className="px-xl py-lg font-semibold">
                  Titres
                </th>
                <th scope="col" className="px-xl py-lg font-semibold">
                  Montant
                </th>
                <th scope="col" className="px-xl py-lg font-semibold">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-secondary">
              {orders.map((order) => {
                const statusMeta = STATUS_LABELS[order.status] ?? {
                  label: order.status,
                  badgeClass: "bg-surface-secondary-bg text-text-secondary border-border-secondary",
                }
                const formattedDate = order.created_at
                  ? new Date(order.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"
                const shortId = order.id.slice(0, 8).toUpperCase()
                const itemsList =
                  order.items && order.items.length > 0
                    ? order.items.map((it) => it.title).join(", ")
                    : "Livre YéYéBook"

                return (
                  <tr key={order.id} className="hover:bg-surface-hover/60 transition-colors">
                    <td className="px-xl py-lg font-mono font-bold text-text-primary">
                      {shortId}
                    </td>
                    <td className="px-xl py-lg whitespace-nowrap text-text-secondary">
                      {formattedDate}
                    </td>
                    <td className="px-xl py-lg max-w-[320px]">
                      <div className="truncate font-medium text-text-primary" title={itemsList}>
                        {itemsList}
                      </div>
                      {order.items && order.items.length > 1 && (
                        <span className="text-video-title text-text-tertiary">
                          {order.items.length} titres inclus
                        </span>
                      )}
                    </td>
                    <td className="px-xl py-lg whitespace-nowrap font-semibold text-text-primary">
                      {formatPrice(order.total_amount)}
                    </td>
                    <td className="px-xl py-lg whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-xs rounded-corner-full border px-md py-xs text-video-title font-semibold ${statusMeta.badgeClass}`}
                      >
                        {order.status === "pending" && (
                          <Clock className="h-3 w-3" aria-hidden="true" />
                        )}
                        {statusMeta.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { adminApi } from '../../api.js'
import { formatPrice } from '../../utils/format.js'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUSES } from '../../constants.js'
import { useShop } from '../../context/ShopContext.jsx'
import { t } from '../../i18n.js'

export default function ManageOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const { shop, lang } = useShop()
  const currency = shop?.currency || 'сум'

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    adminApi
      .getOrders()
      .then(setOrders)
      .finally(() => setLoading(false))
  }

  async function handleStatusChange(id, status) {
    setUpdatingId(id)
    try {
      const updated = await adminApi.updateOrderStatus(id, status)
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: updated.status } : o)))
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return <div className="py-10 text-center text-sm text-muted">{t('loading', lang)}</div>

  if (orders.length === 0) {
    return <div className="py-10 text-center text-sm text-muted">{t('noOrdersYet', lang)}</div>
  }

  return (
    <div className="flex flex-col gap-3 pb-4">
      <h2 className="text-base font-bold">{t('manageOrders', lang)} ({orders.length})</h2>

      {orders.map((order) => (
        <div key={order.id} className="rounded-2xl bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-sm font-semibold">{t('orderNum', lang)} #{order.shop_order_number || order.id}</span>
              <p className="text-xs text-muted">
                {new Date(order.created_at).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <select
              value={order.status}
              disabled={updatingId === order.id}
              onChange={(e) => handleStatusChange(order.id, e.target.value)}
              className={`rounded-full border-none px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-accent ${
                ORDER_STATUS_COLORS[order.status] || 'bg-surface2 text-white'
              }`}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-surface text-white">
                  {ORDER_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 grid gap-1 text-sm text-white/90 sm:grid-cols-2">
            <p>
              <span className="text-muted">{t('client', lang)}: </span>
              {order.customer_name}
            </p>
            <p>
              <span className="text-muted">{t('phone', lang)}: </span>
              {order.phone}
            </p>
            <p className="sm:col-span-2">
              <span className="text-muted">{t('address', lang)}: </span>
              {order.address}
            </p>
            {order.comment && (
              <p className="sm:col-span-2">
                <span className="text-muted">{t('comment', lang)}: </span>
                {order.comment}
              </p>
            )}
            {order.telegram_username && (
              <p className="sm:col-span-2">
                <span className="text-muted">Telegram: </span>@{order.telegram_username}
              </p>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-white/5 pt-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-surface2">
                  <img
                    src={item.image_url}
                    alt={item.product_name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{item.product_name}</p>
                  <p className="text-xs text-muted">
                    {[item.size && `${t('size', lang)} ${item.size}`, item.color, `× ${item.quantity}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <span className="flex-shrink-0 text-sm font-medium">
                  {formatPrice(item.price * item.quantity, currency)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
            <span className="text-sm text-muted">{t('total', lang)}</span>
            <span className="text-base font-bold text-accent">{formatPrice(order.total, currency)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { formatPrice } from '../utils/format.js'
import { useShop } from '../context/ShopContext.jsx'
import { getTelegramUser } from '../telegram.js'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../constants.js'
import { UserIcon, BoxIcon } from '../components/Icons.jsx'

export default function Profile() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const tgUser = getTelegramUser()
  const { shop } = useShop()
  const currency = shop?.currency || 'сум'

  useEffect(() => {
    if (!tgUser?.id) {
      setLoading(false)
      return
    }
    api
      .getOrderHistory(tgUser.id)
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [tgUser?.id])

  return (
    <div>
      <header className="flex items-center gap-3 px-4 pb-3 pt-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface">
          <UserIcon className="h-6 w-6 text-muted" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold leading-tight">
            {tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : 'Гость'}
          </h1>
          {tgUser?.username && <p className="text-xs text-muted">@{tgUser.username}</p>}
        </div>
      </header>

      <div className="px-4">
        <h2 className="mb-3 text-sm font-semibold">История заказов</h2>

        {!tgUser?.id ? (
          <div className="py-10 text-center text-sm text-muted">
            Откройте магазин в Telegram, чтобы видеть историю своих заказов
          </div>
        ) : loading ? (
          <div className="py-10 text-center text-sm text-muted">Загрузка...</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface">
              <BoxIcon className="h-6 w-6 text-muted" />
            </div>
            <p className="text-sm text-muted">У вас пока нет заказов</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Заказ #{order.id}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      ORDER_STATUS_COLORS[order.status] || 'bg-surface2 text-muted'
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {new Date(order.created_at).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>

                <div className="mt-3 flex flex-col gap-2">
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
                          {[
                            item.size && `Размер ${item.size}`,
                            item.color,
                            `× ${item.quantity}`,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-xs text-muted">Итого</span>
                  <span className="text-sm font-bold text-accent">
                    {formatPrice(order.total, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { adminApi } from '../../api.js'
import { formatPrice } from '../../utils/format.js'
import { useShop } from '../../context/ShopContext.jsx'
import { t } from '../../i18n.js'

function isOverdue(dueDateStr) {
  if (!dueDateStr) return false
  return new Date(dueDateStr) < new Date(new Date().toDateString())
}

function formatDate(dateStr, lang) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function ManageCredits() {
  const [credits, setCredits] = useState([])
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState(null)
  const { shop, lang } = useShop()
  const currency = shop?.currency || 'сум'

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    adminApi
      .getCredits()
      .then((data) => {
        const sorted = [...data].sort((a, b) => {
          const aOver = isOverdue(a.payment_due_date)
          const bOver = isOverdue(b.payment_due_date)
          if (aOver && !bOver) return -1
          if (!aOver && bOver) return 1
          return new Date(a.payment_due_date || 0) - new Date(b.payment_due_date || 0)
        })
        setCredits(sorted)
      })
      .finally(() => setLoading(false))
  }

  async function handleMarkPaid(id) {
    setMarkingId(id)
    try {
      await adminApi.markCreditPaid(id)
      setCredits((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      alert(err.message)
    } finally {
      setMarkingId(null)
    }
  }

  if (loading) return <div className="py-10 text-center text-sm text-muted">{t('loading', lang)}</div>

  if (credits.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="mb-3 text-4xl">✅</div>
        <p className="text-sm font-medium text-white">{t('noDebtors', lang)}</p>
        <p className="mt-1 text-xs text-muted">Все клиенты оплатили свои заказы</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 pb-4">
      <h2 className="text-base font-bold">{t('debtors', lang)} ({credits.length})</h2>

      {credits.map((order) => {
        const overdue = isOverdue(order.payment_due_date)
        const orderNum = order.shop_order_number || order.id
        return (
          <div
            key={order.id}
            className={`rounded-2xl p-4 ${overdue ? 'border border-red-500/30 bg-red-500/10' : 'bg-surface'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{order.customer_name}</p>
                <p className="text-xs text-muted">{t('orderNum', lang)} #{orderNum}</p>
              </div>
              <span className="text-base font-bold text-accent">
                {formatPrice(order.total, currency)}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className={`text-xs font-medium ${overdue ? 'text-red-400' : 'text-muted'}`}>
                {overdue ? t('overdue', lang) : `📅 ${t('paymentDate', lang)}`}:
              </span>
              <span className={`text-xs font-semibold ${overdue ? 'text-red-400' : 'text-white'}`}>
                {formatDate(order.payment_due_date, lang)}
              </span>
            </div>

            {order.items?.length > 0 && (
              <div className="mt-3 flex flex-col gap-1.5 border-t border-white/5 pt-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs text-muted">
                    <span className="truncate">
                      {item.product_name}
                      {item.size ? ` · ${item.size}` : ''}
                      {item.color ? ` · ${item.color}` : ''}
                      {' '}×{item.quantity}
                    </span>
                    <span className="ml-2 flex-shrink-0">
                      {formatPrice(item.price * item.quantity, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <a
                href={`tel:${order.phone}`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-surface2 py-2.5 text-xs font-medium text-white"
              >
                {t('callClient', lang)} {order.phone}
              </a>
              <button
                onClick={() => handleMarkPaid(order.id)}
                disabled={markingId === order.id}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent py-2.5 text-xs font-bold text-bg disabled:opacity-60"
              >
                {t('markPaid', lang)}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

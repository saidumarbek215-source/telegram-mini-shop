import { useEffect, useState } from 'react'
import { getCredits, markCreditPaid } from '../api.js'

function isOverdue(dueDateStr) {
  if (!dueDateStr) return false
  return new Date(dueDateStr) < new Date(new Date().toDateString())
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function fmt(n) {
  return Number(n).toLocaleString('ru-RU')
}

export default function Credits() {
  const [credits, setCredits] = useState([])
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState(null)

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    getCredits()
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
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  async function handleMarkPaid(id) {
    setMarkingId(id)
    try {
      await markCreditPaid(id)
      setCredits((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      alert(err.message)
    } finally {
      setMarkingId(null)
    }
  }

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="card p-5 h-28 animate-pulse bg-gray-100" />)}
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-gray-900">Должники</h1>
        <p className="text-sm text-gray-500">{credits.length} заказов с отложенной оплатой</p>
      </div>

      {credits.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-semibold text-gray-900">Все клиенты оплатили свои заказы</p>
          <p className="text-sm text-gray-400 mt-1">Нет активных задолженностей</p>
        </div>
      ) : (
        <div className="space-y-3">
          {credits.map((order) => {
            const overdue = isOverdue(order.payment_due_date)
            const orderNum = order.shop_order_number || order.id
            return (
              <div key={order.id} className={`card p-5 ${overdue ? 'border-2 border-red-300 bg-red-50' : ''}`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{order.customer_name}</p>
                    <p className="text-sm text-gray-500">Заказ #{orderNum}</p>
                  </div>
                  <span className="text-lg font-black text-gray-900 whitespace-nowrap">
                    {fmt(order.total)} сум
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
                    {overdue ? '⚠️ Просрочено' : '📅 Дата оплаты'}:
                  </span>
                  <span className={`text-sm font-semibold ${overdue ? 'text-red-700' : 'text-gray-700'}`}>
                    {formatDate(order.payment_due_date)}
                  </span>
                </div>

                {order.items?.length > 0 && (
                  <div className="border-t border-gray-100 pt-3 mb-3 space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs text-gray-500">
                        <span className="truncate">
                          {item.product_name}
                          {item.size ? ` · ${item.size}` : ''}
                          {item.color ? ` · ${item.color}` : ''}
                          {' '}×{item.quantity}
                        </span>
                        <span className="ml-2 flex-shrink-0">{fmt(item.price * item.quantity)} сум</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <a
                    href={`tel:${order.phone}`}
                    className="flex-1 text-center text-sm font-medium py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                  >
                    📞 {order.phone}
                  </a>
                  <button
                    onClick={() => handleMarkPaid(order.id)}
                    disabled={markingId === order.id}
                    className="flex-1 btn-primary disabled:opacity-50"
                  >
                    {markingId === order.id ? 'Сохранение...' : 'Оплачено ✓'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

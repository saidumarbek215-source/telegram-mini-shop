import { useEffect, useState, useCallback } from 'react'
import { getOrders, updateOrderStatus } from '../api.js'

const PAYMENT_LABELS = {
  cash:  '💵 Naqd',
  card:  '💳 Karta',
  click: '💳 Click',
  payme: '💳 Payme',
  uzum:  '💳 Uzum',
}
const PAYMENT_COLORS = {
  cash:  'bg-green-100 text-green-800 border-green-200',
  card:  'bg-blue-100 text-blue-800 border-blue-200',
  click: 'bg-sky-100 text-sky-800 border-sky-200',
  payme: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  uzum:  'bg-orange-100 text-orange-800 border-orange-200',
}

function PaymentBadge({ method }) {
  if (!method) return null
  return (
    <span className={`badge border text-xs ${PAYMENT_COLORS[method] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {PAYMENT_LABELS[method] || method}
    </span>
  )
}

const STATUSES = ['new', 'accepted', 'shipped', 'delivered', 'expired', 'cancelled']
const STATUS_LABELS = {
  new:       'Yangi',
  accepted:  'Qabul qilindi',
  shipped:   'Yetkazilmoqda',
  delivered: 'Yetkazildi',
  expired:   "Muddati o'tgan",
  cancelled: 'Bekor qilindi',
}
const STATUS_COLORS = {
  new:       'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted:  'bg-blue-100 text-blue-800 border-blue-200',
  shipped:   'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  expired:   'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}

function fmt(n) { return Number(n).toLocaleString('ru-RU') + " so'm" }
function fmtDate(d) { return new Date(d).toLocaleDateString('ru-RU') }

function CustomerHistory({ orders, customerKey, onClose }) {
  const customerOrders = orders.filter(o => {
    const key = o.phone || o.customer_name || `user_${o.user_id}`
    return key === customerKey
  })
  const totalSpent = customerOrders
    .filter(o => o.status === 'shipped')
    .reduce((s, o) => s + Number(o.total || 0), 0)
  const first = customerOrders[customerOrders.length - 1]
  const last  = customerOrders[0]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Mijoz tarixi</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center bg-yellow-50 rounded-xl p-3 border border-yellow-200">
            <div>
              <p className="text-xl font-black text-gray-900">{customerOrders.length}</p>
              <p className="text-xs text-gray-500">Buyurtmalar</p>
            </div>
            <div>
              <p className="text-xl font-black text-green-600">{customerOrders.filter(o => o.status === 'shipped').length}</p>
              <p className="text-xs text-gray-500">Yetkazildi</p>
            </div>
            <div>
              <p className="text-base font-black text-yellow-600">{fmt(totalSpent)}</p>
              <p className="text-xs text-gray-500">Jami xarid</p>
            </div>
          </div>
          {first && (
            <div className="text-xs text-gray-500 flex justify-between">
              <span>Birinchi: {fmtDate(first.created_at)}</span>
              <span>Oxirgi: {fmtDate(last.created_at)}</span>
            </div>
          )}
          <div className="space-y-2">
            {customerOrders.map(o => (
              <div key={o.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="font-mono text-gray-400 text-xs w-10">#{o.id}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold">{fmt(o.total)}</p>
                  <p className="text-xs text-gray-400">{fmtDate(o.created_at)}</p>
                </div>
                <span className={`badge ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {STATUS_LABELS[o.status] || o.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusModal({ order, onClose, onStatusChange }) {
  const [newStatus, setNewStatus] = useState(order.status)
  const [saving,    setSaving]    = useState(false)

  async function save() {
    if (newStatus === order.status) { onClose(); return }
    setSaving(true)
    try { await onStatusChange(order.id, newStatus); onClose() }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Holat — #{order.id}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setNewStatus(s)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  newStatus === s ? STATUS_COLORS[s] : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost flex-1">Bekor</button>
            <button onClick={save} disabled={saving} className="btn-primary flex-1 disabled:opacity-40">
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderRow({ order, orders, onStatusChange }) {
  const [expanded,     setExpanded]     = useState(false)
  const [statusModal,  setStatusModal]  = useState(false)
  const [showCustomer, setShowCustomer] = useState(false)
  const customerKey = order.phone || order.customer_name || `user_${order.user_id}`

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer border-b border-gray-100"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-3 font-mono text-gray-500 text-sm">#{order.id}</td>
        <td className="px-4 py-3">
          <p className="font-semibold text-sm">{order.customer_name || '—'}</p>
          {order.customer_phone && <p className="text-xs text-gray-400">{order.customer_phone}</p>}
        </td>
        <td className="px-4 py-3 font-bold text-sm">{fmt(order.total)}</td>
        <td className="px-4 py-3 hidden sm:table-cell">
          <div className="flex flex-col gap-1">
            <button
              className={`badge border text-xs text-left ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
              onClick={e => { e.stopPropagation(); setStatusModal(true) }}
            >
              {STATUS_LABELS[order.status] || order.status}
            </button>
            {order.payment_method && <PaymentBadge method={order.payment_method} />}
          </div>
        </td>
        <td className="px-4 py-3 hidden md:table-cell text-gray-400 text-xs">
          {fmtDate(order.created_at)}
        </td>
        <td className="px-4 py-3 text-right text-gray-400">
          <svg
            className={`w-4 h-4 inline transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-yellow-50/60 border-b border-yellow-100">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Customer details */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mijoz ma'lumotlari</p>
                <p className="text-sm font-semibold">{order.customer_name || '—'}</p>
                {order.customer_phone && (
                  <p className="text-sm text-gray-700">📞 {order.customer_phone}</p>
                )}
                <p className="text-sm text-gray-700">📍 {order.address || "Manzil ko'rsatilmagan"}</p>
                {order.comment && (
                  <p className="text-sm text-gray-600 italic">💬 {order.comment}</p>
                )}
                {order.payment_method && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-gray-500">To'lov:</span>
                    <PaymentBadge method={order.payment_method} />
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mahsulotlar</p>
                <div className="space-y-1">
                  {(order.items || []).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{item.product_name} <span className="text-gray-400">×{item.quantity}</span></span>
                      <span className="font-semibold ml-2">{fmt(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-1 border-t border-yellow-200 font-bold text-sm">
                  <span>Jami:</span>
                  <span>{fmt(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Actions row */}
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-yellow-200">
              <button
                onClick={() => setStatusModal(true)}
                className="btn-ghost text-xs py-1.5 px-3"
              >
                ✏️ Holatni o'zgartirish
              </button>
              <button
                onClick={() => setShowCustomer(true)}
                className="btn-ghost text-xs py-1.5 px-3"
              >
                👤 Mijoz tarixi
              </button>
            </div>
          </td>
        </tr>
      )}

      {statusModal && (
        <StatusModal
          order={order}
          onClose={() => setStatusModal(false)}
          onStatusChange={onStatusChange}
        />
      )}

      {showCustomer && (
        <CustomerHistory
          orders={orders}
          customerKey={customerKey}
          onClose={() => setShowCustomer(false)}
        />
      )}
    </>
  )
}

export default function Orders() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('')

  const load = useCallback(() => {
    setLoading(true)
    getOrders().then(setOrders).catch(console.error).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleStatusChange(id, status) {
    await updateOrderStatus(id, status)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  const filtered = filter ? orders.filter(o => o.status === filter) : orders

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Buyurtmalar</h1>
          <p className="text-sm text-gray-500">{orders.length} ta buyurtma</p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Yangilash
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('')} className={`badge text-xs px-3 py-1.5 cursor-pointer border ${!filter ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
          Barchasi ({orders.length})
        </button>
        {STATUSES.map(s => {
          const count = orders.filter(o => o.status === s).length
          return (
            <button key={s} onClick={() => setFilter(s === filter ? '' : s)}
              className={`badge text-xs px-3 py-1.5 cursor-pointer border ${filter === s ? STATUS_COLORS[s] : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              {STATUS_LABELS[s]} ({count})
            </button>
          )
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Mijoz</th>
                <th className="px-4 py-3 font-semibold">Summa</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Holat</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Sana</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length:5}).map((_,i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Buyurtmalar topilmadi</td></tr>
              ) : filtered.map(o => (
                <OrderRow
                  key={o.id}
                  order={o}
                  orders={orders}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

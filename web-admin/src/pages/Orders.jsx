import { useEffect, useState, useCallback } from 'react'
import { getOrders, updateOrderStatus } from '../api.js'

const STATUSES = ['pending', 'confirmed', 'delivering', 'delivered', 'cancelled']
const STATUS_LABELS = {
  pending:    'Yangi',
  confirmed:  'Tasdiqlangan',
  delivering: 'Yetkazilmoqda',
  delivered:  'Yetkazildi',
  cancelled:  'Bekor',
}
const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed:  'bg-blue-100 text-blue-800 border-blue-200',
  delivering: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered:  'bg-green-100 text-green-800 border-green-200',
  cancelled:  'bg-red-100 text-red-800 border-red-200',
}

function OrderDetail({ order, onClose, onStatusChange }) {
  const [newStatus, setNewStatus] = useState(order.status)
  const [saving, setSaving]       = useState(false)

  async function save() {
    if (newStatus === order.status) return
    setSaving(true)
    try { await onStatusChange(order.id, newStatus) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  function fmt(n) { return Number(n).toLocaleString('ru-RU') + " so'm" }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Buyurtma #{order.id}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Customer info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mijoz</p>
            <p className="text-sm font-semibold">{order.customer_name || '—'}</p>
            {order.customer_phone && <p className="text-sm text-gray-600">📞 {order.customer_phone}</p>}
            {order.delivery_address && <p className="text-sm text-gray-600">📍 {order.delivery_address}</p>}
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mahsulotlar</p>
            <div className="space-y-2">
              {(order.items || []).map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium">{item.product_name}</p>
                    <p className="text-xs text-gray-400">x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold">{fmt(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 pt-2">
              <p className="font-bold">Jami:</p>
              <p className="font-black text-lg">{fmt(order.total_price)}</p>
            </div>
          </div>

          {/* Status change */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Holat</p>
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
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost flex-1">Yopish</button>
            <button onClick={save} disabled={saving || newStatus === order.status} className="btn-primary flex-1 disabled:opacity-40">
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Orders() {
  const [orders,    setOrders]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null)
  const [filter,    setFilter]    = useState('')

  const load = useCallback(() => {
    setLoading(true)
    getOrders().then(setOrders).catch(console.error).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleStatusChange(id, status) {
    await updateOrderStatus(id, status)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    setSelected(prev => prev ? { ...prev, status } : null)
  }

  const filtered = filter ? orders.filter(o => o.status === filter) : orders

  function fmt(n) { return Number(n).toLocaleString('ru-RU') + " so'm" }

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
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Mijoz</th>
                <th className="px-4 py-3 font-semibold">Summa</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Holat</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Sana</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({length:5}).map((_,i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Buyurtmalar topilmadi</td></tr>
              ) : filtered.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(o)}>
                  <td className="px-4 py-3 font-mono text-gray-500">#{o.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{o.customer_name || '—'}</p>
                    {o.customer_phone && <p className="text-xs text-gray-400">{o.customer_phone}</p>}
                  </td>
                  <td className="px-4 py-3 font-bold">{fmt(o.total_price)}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`badge border ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-400 text-xs">
                    {new Date(o.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">
                    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <OrderDetail
          order={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}

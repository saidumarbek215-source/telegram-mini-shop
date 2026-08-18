import { useEffect, useState } from 'react'
import { getOrders } from '../api.js'

export default function Customers() {
  const [orders,   setOrders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Build unique customers from orders
  const customersMap = {}
  for (const o of orders) {
    const key = o.phone || o.customer_name || `user_${o.user_id}`
    if (!customersMap[key]) {
      customersMap[key] = {
        name: o.customer_name || '—',
        phone: o.phone || '—',
        userId: o.user_id,
        orders: [],
        totalSpent: 0,
      }
    }
    customersMap[key].orders.push(o)
    if (o.status === 'shipped') {
      customersMap[key].totalSpent += Number(o.total || 0)
    }
  }
  const customers = Object.values(customersMap)
    .sort((a, b) => b.orders.length - a.orders.length)

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  function fmt(n) { return Number(n).toLocaleString('ru-RU') + " so'm" }

  const STATUS_COLORS = {
    new:       'bg-yellow-100 text-yellow-800',
    accepted:  'bg-blue-100 text-blue-800',
    shipped:   'bg-purple-100 text-purple-800',
    expired:   'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-800',
  }
  const STATUS_LABELS = {
    new: 'Yangi', accepted: 'Qabul qilindi',
    shipped: 'Yetkazilmoqda', expired: "Muddati o'tgan", cancelled: 'Bekor qilindi',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Mijozlar</h1>
          <p className="text-sm text-gray-500">{customers.length} ta noyob mijoz</p>
        </div>
      </div>

      <input
        className="input w-full max-w-xs"
        placeholder="🔍 Ism yoki telefon..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th className="px-4 py-3 font-semibold">Mijoz</th>
                <th className="px-4 py-3 font-semibold">Telefon</th>
                <th className="px-4 py-3 font-semibold">Buyurtmalar</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Jami xarid</th>
                <th className="px-4 py-3 font-semibold text-right">Batafsil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array.from({length: 5}).map((_, i) => (
                    <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
                  ))
                : filtered.length === 0
                  ? <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Mijozlar topilmadi</td></tr>
                  : filtered.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center text-base font-bold text-yellow-700 flex-shrink-0">
                            {c.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{c.name}</p>
                            {c.userId && <p className="text-xs text-gray-400">TG: {c.userId}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-600">{c.phone}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{c.orders.length}</span>
                          <span className="text-xs text-gray-400">
                            ({c.orders.filter(o => o.status === 'shipped').length} yetkazilmoqda)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell font-bold text-gray-900">
                        {fmt(c.totalSpent)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelected(selected?.phone === c.phone ? null : c)}
                          className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                          {selected?.phone === c.phone ? 'Yopish' : 'Ko\'rish'}
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected customer detail */}
      {selected && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">{selected.name} — buyurtmalar tarixi</h2>
              <p className="text-sm text-gray-500">{selected.phone}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
          </div>
          <div className="space-y-2">
            {selected.orders.map(o => (
              <div key={o.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="font-mono text-gray-400 text-xs w-12">#{o.id}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{fmt(o.total)}</p>
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('ru-RU')}</p>
                </div>
                <span className={`badge ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[o.status] || o.status}
                </span>
              </div>
            ))}
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-black text-gray-900">{selected.orders.length}</p>
              <p className="text-xs text-gray-500">Jami buyurtma</p>
            </div>
            <div>
              <p className="text-2xl font-black text-green-600">{selected.orders.filter(o => o.status === 'shipped').length}</p>
              <p className="text-xs text-gray-500">Yetkazilmoqda</p>
            </div>
            <div>
              <p className="text-lg font-black text-yellow-600">{fmt(selected.totalSpent)}</p>
              <p className="text-xs text-gray-500">Jami xarid</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

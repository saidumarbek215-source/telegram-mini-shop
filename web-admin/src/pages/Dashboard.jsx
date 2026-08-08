import { useEffect, useState } from 'react'
import { getProducts, getOrders, getCategories } from '../api.js'
import { Link } from 'react-router-dom'

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-800',
  confirmed:  'bg-blue-100 text-blue-800',
  delivering: 'bg-purple-100 text-purple-800',
  delivered:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
}
const STATUS_LABELS = {
  pending: 'Yangi', confirmed: 'Tasdiqlangan',
  delivering: 'Yetkazilmoqda', delivered: 'Yetkazildi', cancelled: 'Bekor',
}

function StatCard({ icon, label, value, sub, color, to }) {
  const content = (
    <div className={`card p-5 ${to ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-black text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${color}`}>{icon}</div>
      </div>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

function RevenueChart({ orders }) {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('ru-RU', { weekday: 'short' })
    const revenue = orders
      .filter(o => o.status === 'delivered' && o.created_at?.slice(0, 10) === dateStr)
      .reduce((s, o) => s + Number(o.total_price || 0), 0)
    const count = orders.filter(o => o.created_at?.slice(0, 10) === dateStr).length
    days.push({ label, revenue, count })
  }

  const maxRevenue = Math.max(...days.map(d => d.revenue), 1)

  function fmt(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
    return String(n)
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-sm text-gray-900">So'nggi 7 kun daromadi</h2>
        <span className="text-xs text-gray-400">Yetkazilgan buyurtmalar</span>
      </div>
      <div className="flex items-end gap-2 h-32">
        {days.map((d, i) => {
          const pct = Math.max((d.revenue / maxRevenue) * 100, d.revenue > 0 ? 4 : 0)
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              {d.revenue > 0 && (
                <span className="text-[9px] text-gray-500 font-medium">{fmt(d.revenue)}</span>
              )}
              <div className="w-full flex items-end" style={{ height: 88 }}>
                <div
                  className="w-full rounded-t-lg transition-all duration-500"
                  style={{
                    height: `${pct}%`,
                    background: d.revenue > 0
                      ? 'linear-gradient(180deg, #FFE000 0%, #f59e0b 100%)'
                      : '#f3f4f6',
                    minHeight: d.count > 0 ? 4 : 0,
                  }}
                />
              </div>
              <span className="text-[9px] text-gray-400 capitalize">{d.label}</span>
              {d.count > 0 && <span className="text-[9px] text-gray-300">{d.count}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [products,   setProducts]   = useState([])
  const [orders,     setOrders]     = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.all([getProducts(), getOrders(), getCategories()])
      .then(([p, o, c]) => { setProducts(p); setOrders(o); setCategories(c) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const newOrders    = orders.filter(o => o.status === 'pending')
  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + Number(o.total_price || 0), 0)
  const discounted   = products.filter(p => p.old_price && Number(p.old_price) > Number(p.price))

  // Unique customers
  const uniqueCustomers = new Set(orders.map(o => o.phone || o.user_id)).size

  // Top products by order count
  const productCount = {}
  for (const o of orders) {
    for (const item of o.items || []) {
      productCount[item.product_id] = (productCount[item.product_id] || 0) + (item.quantity || 1)
    }
  }
  const topProducts = products
    .map(p => ({ ...p, orderCount: productCount[p.id] || 0 }))
    .filter(p => p.orderCount > 0)
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 5)

  function fmt(n) { return Number(n).toLocaleString('ru-RU') + " so'm" }

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="card p-5 h-24 animate-pulse bg-gray-100" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Umumiy ko'rsatkichlar</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📦" label="Mahsulotlar"  value={products.length}   sub={`${discounted.length} aksiyada`}         color="bg-blue-50"   to="/products" />
        <StatCard icon="🛒" label="Buyurtmalar"  value={orders.length}     sub={`${newOrders.length} yangi`}              color="bg-yellow-50" to="/orders" />
        <StatCard icon="👥" label="Mijozlar"      value={uniqueCustomers}   sub="noyob xaridorlar"                         color="bg-purple-50" to="/customers" />
        <StatCard icon="💰" label="Daromad"       value={fmt(totalRevenue)} sub="yetkazilgan buyurtmalar"                  color="bg-green-50" />
      </div>

      {/* New orders alert */}
      {newOrders.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <p className="font-bold text-yellow-800">{newOrders.length} ta yangi buyurtma!</p>
            <p className="text-xs text-yellow-700">Tasdiqlashingiz kerak</p>
          </div>
          <Link to="/orders" className="btn-yellow text-xs">Ko'rish</Link>
        </div>
      )}

      {/* Revenue chart */}
      <RevenueChart orders={orders} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent orders */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="font-bold text-sm text-gray-900">So'nggi buyurtmalar</h2>
            <Link to="/orders" className="text-xs text-yellow-600 font-semibold hover:underline">Barchasi →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {orders.slice(0, 6).map(o => (
              <div key={o.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                <span className="font-mono text-gray-400 text-xs w-10">#{o.id}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{o.customer_name || '—'}</p>
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('ru-RU')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{fmt(o.total_price)}</p>
                  <span className={`badge text-xs ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[o.status] || o.status}
                  </span>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">Buyurtmalar yo'q</p>
            )}
          </div>
        </div>

        {/* Top products */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="font-bold text-sm text-gray-900">Top mahsulotlar</h2>
            <Link to="/products" className="text-xs text-yellow-600 font-semibold hover:underline">Barchasi →</Link>
          </div>
          {topProducts.length === 0 ? (
            <p className="px-5 py-8 text-center text-gray-400 text-sm">Hali buyurtmalar yo'q</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <span className="text-lg font-black text-gray-200 w-6 text-center">{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-full h-full object-contain p-0.5" />
                      : <div className="w-full h-full flex items-center justify-center text-sm">📦</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{fmt(p.price)}</p>
                  </div>
                  <div className="bg-yellow-50 text-yellow-700 text-xs font-bold px-2 py-1 rounded-lg">
                    {p.orderCount}✕
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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
  pending:    'Yangi',
  confirmed:  'Tasdiqlangan',
  delivering: 'Yetkazilmoqda',
  delivered:  'Yetkazildi',
  cancelled:  'Bekor',
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-black text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${color}`}>
          {icon}
        </div>
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

  const newOrders     = orders.filter(o => o.status === 'pending')
  const totalRevenue  = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + Number(o.total_price || 0), 0)
  const discounted    = products.filter(p => p.old_price && Number(p.old_price) > Number(p.price))
  const recentOrders  = [...orders].slice(0, 8)

  function fmt(n) {
    return Number(n).toLocaleString('ru-RU') + " so'm"
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="card p-5 h-24 animate-pulse bg-gray-100" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Umumiy ko'rsatkichlar</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📦" label="Mahsulotlar"  value={products.length}   sub={`${discounted.length} aksiyada`}   color="bg-blue-50" />
        <StatCard icon="🛒" label="Buyurtmalar"  value={orders.length}     sub={`${newOrders.length} yangi`}        color="bg-yellow-50" />
        <StatCard icon="🗂️" label="Kategoriyalar" value={categories.length} sub="jami"                               color="bg-purple-50" />
        <StatCard icon="💰" label="Daromad"       value={fmt(totalRevenue)} sub="yetkazilgan buyurtmalar"            color="bg-green-50" />
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

      {/* Recent orders */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-bold text-sm text-gray-900">So'nggi buyurtmalar</h2>
          <Link to="/orders" className="text-xs text-yellow-600 font-semibold hover:underline">Barchasi →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-2.5 font-semibold">#</th>
                <th className="px-5 py-2.5 font-semibold">Mijoz</th>
                <th className="px-5 py-2.5 font-semibold">Summa</th>
                <th className="px-5 py-2.5 font-semibold">Holat</th>
                <th className="px-5 py-2.5 font-semibold">Sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-gray-500">#{o.id}</td>
                  <td className="px-5 py-3 font-medium">{o.customer_name || '—'}</td>
                  <td className="px-5 py-3 font-bold">{fmt(o.total_price)}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(o.created_at).toLocaleDateString('ru-RU')}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">Buyurtmalar yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

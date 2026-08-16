import { useEffect, useState } from 'react'
import { getAnalytics } from '../api.js'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

function CustomTooltip({ active, payload, label, type }) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-yellow-600 font-bold">
        {type === 'revenue'
          ? `${Number(val).toLocaleString('ru-RU')} so'm`
          : `${val} buyurtma`}
      </p>
    </div>
  )
}

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
  return String(Math.round(n))
}

export default function Analytics() {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [days,    setDays]    = useState(30)
  const [type,    setType]    = useState('revenue')

  useEffect(() => {
    setLoading(true)
    getAnalytics(days)
      .then(rows => {
        const byDate = Object.fromEntries(rows.map(r => [r.date, r]))
        const result = []
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const dateStr = d.toISOString().slice(0, 10)
          const label = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
          result.push({
            date: dateStr,
            label,
            revenue: Number(byDate[dateStr]?.revenue ?? 0),
            orders:  Number(byDate[dateStr]?.orders  ?? 0),
          })
        }
        setData(result)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [days])

  const totalRevenue  = data.reduce((s, d) => s + d.revenue, 0)
  const totalOrders   = data.reduce((s, d) => s + d.orders,  0)
  const avgOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)
  const maxOrders  = Math.max(...data.map(d => d.orders),  1)
  const peakDay    = data.find(d => (type === 'revenue' ? d.revenue === maxRevenue : d.orders === maxOrders))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Tahlil</h1>
          <p className="text-sm text-gray-500">Sotuv dinamikasi</p>
        </div>
        <div className="flex gap-2">
          {[7, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                days === d
                  ? 'bg-black text-yellow-300'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {d} kun
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Daromad</p>
          <p className="text-xl font-black text-gray-900">{fmt(totalRevenue)} so'm</p>
          <p className="text-xs text-gray-400 mt-0.5">so'nggi {days} kun</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Buyurtmalar</p>
          <p className="text-xl font-black text-gray-900">{totalOrders}</p>
          <p className="text-xs text-gray-400 mt-0.5">so'nggi {days} kun</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">O'rtacha chek</p>
          <p className="text-xl font-black text-gray-900">{fmt(avgOrderValue)} so'm</p>
          {peakDay && (
            <p className="text-xs text-gray-400 mt-0.5">
              Eng ko'p: {peakDay.label}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {[['revenue', 'Daromad'], ['orders', 'Buyurtmalar']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setType(key)}
            className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
              type === key
                ? 'bg-yellow-400 text-black border-yellow-400'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4">
          {type === 'revenue' ? 'Daromad dinamikasi' : 'Buyurtmalar dinamikasi'}
        </h2>
        {loading ? (
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
        ) : data.every(d => (type === 'revenue' ? d.revenue : d.orders) === 0) ? (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
            Hali ma'lumot yo'q
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                interval={days === 30 ? 4 : 0}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={type === 'revenue' ? fmt : v => v}
                width={type === 'revenue' ? 48 : 32}
              />
              <Tooltip content={<CustomTooltip type={type} />} />
              <Area
                type="monotone"
                dataKey={type}
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#analyticsGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#f59e0b' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

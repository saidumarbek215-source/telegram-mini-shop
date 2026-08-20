import { useEffect, useState } from 'react'
import { formatPrice } from '../utils/format.js'

const API = import.meta.env.VITE_API_URL || '/api'
const SA_KEY = '7af70a9f2cfb95f563f9a884cca5241d18617f642edb546e '

function saFetch(path) {
  return fetch(`${API}${path}`, { headers: { 'x-super-admin': SA_KEY } }).then((r) => r.json())
}

function GmvCard({ label, amount, orders }) {
  return (
    <div className="rounded-2xl bg-surface p-4">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-lg font-bold text-accent leading-tight">{formatPrice(Number(amount) || 0)}</p>
      {orders != null && (
        <p className="text-xs text-muted mt-0.5">{orders} заказов</p>
      )}
    </div>
  )
}

export default function SuperAdmin() {
  const [authed, setAuthed] = useState(() => localStorage.getItem('sa_authed') === '1')
  const [password, setPassword] = useState('')
  const [gmv, setGmv] = useState(null)
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(false)

  function handleLogin(e) {
    e.preventDefault()
    if (password === SA_KEY) {
      localStorage.setItem('sa_authed', '1')
      setAuthed(true)
    } else {
      alert('Неверный пароль')
      setPassword('')
    }
  }

  useEffect(() => {
    if (!authed) return
    setLoading(true)
    Promise.all([saFetch('/super-admin/analytics/gmv'), saFetch('/super-admin/shops')])
      .then(([gmvData, shopsData]) => {
        setGmv(gmvData)
        setShops(Array.isArray(shopsData) ? shopsData : [])
      })
      .finally(() => setLoading(false))
  }, [authed])

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-6">
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
          <h1 className="text-center text-xl font-bold" style={{ color: 'var(--text, #fff)' }}>
            Super Admin
          </h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            autoFocus
            className="w-full rounded-2xl bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            style={{ color: 'var(--text, #fff)' }}
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-accent py-3 text-sm font-bold text-bg"
          >
            Войти
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg px-4 py-6" style={{ color: 'var(--text, #fff)' }}>
      <div className="mx-auto max-w-2xl space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Super Admin</h1>
          <button
            onClick={() => { localStorage.removeItem('sa_authed'); setAuthed(false) }}
            className="text-xs text-muted hover:text-accent"
          >
            Выйти
          </button>
        </div>

        {/* GMV Analytics */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted">📊 Оборот платформы</h2>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-20 rounded-2xl" />
              ))}
            </div>
          ) : gmv ? (
            <div className="grid grid-cols-2 gap-3">
              <GmvCard label="Сегодня" amount={gmv.today} orders={gmv.orders_today} />
              <GmvCard label="За неделю" amount={gmv.week} orders={gmv.orders_week} />
              <GmvCard label="За месяц" amount={gmv.month} orders={gmv.orders_month} />
              <GmvCard label="За год" amount={gmv.year} orders={gmv.orders_total} />
            </div>
          ) : null}
        </div>

        {/* Shops list */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted">
            🏪 Магазины ({shops.length})
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {shops.map((shop) => (
                <div key={shop.id} className="rounded-2xl bg-surface px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: 'var(--text, #fff)' }}>
                        {shop.name || `Магазин #${shop.id}`}
                      </p>
                      <p className="text-xs text-muted">
                        {shop.bot_username ? `@${shop.bot_username}` : '—'}
                        {' · '}
                        {shop.orders_count ?? 0} заказов
                      </p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      shop.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {shop.is_active ? 'активен' : 'неактивен'}
                    </span>
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

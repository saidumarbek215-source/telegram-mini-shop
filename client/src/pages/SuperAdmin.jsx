import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || '/api'

async function saFetch(path, key, options = {}) {
  const res = await fetch(`${API_URL}/super-admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-super-admin': key,
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Xatolik ${res.status}`)
  }
  return res.json()
}

const PROVIDERS = [
  { value: '', label: "Yo'q (ulanmagan)" },
  { value: 'click', label: 'Click' },
  { value: 'payme', label: 'Payme' },
  { value: 'uzum', label: 'Uzum Bank' },
]

function providerLabel(val) {
  return PROVIDERS.find((p) => p.value === val)?.label || val
}

function PaymentForm({ shop, apiKey, onSaved }) {
  const [form, setForm] = useState({
    provider: shop.payment_provider || '',
    merchant_id: shop.payment_merchant_id || '',
    service_id: shop.payment_service_id || '',
    secret: '',
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await saFetch(`/shops/${shop.id}/payment`, apiKey, {
        method: 'PATCH',
        body: JSON.stringify({
          provider: form.provider || null,
          merchant_id: form.merchant_id,
          service_id: form.service_id,
          secret: form.secret,
        }),
      })
      setToast({ ok: true, text: "To'lov tizimi ulandi" })
      onSaved({ ...shop, payment_provider: form.provider || null })
    } catch (err) {
      setToast({ ok: false, text: 'Xatolik: ' + err.message })
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <form onSubmit={handleSave} className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
      {toast && (
        <div
          className={`rounded-xl px-3 py-2 text-sm font-medium ${
            toast.ok ? 'bg-accent text-bg' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {toast.text}
        </div>
      )}

      {shop.payment_provider && (
        <p className="text-sm text-accent">✅ {providerLabel(shop.payment_provider)} ulangan</p>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Provider</label>
        <select
          value={form.provider}
          onChange={set('provider')}
          className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {PROVIDERS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Merchant ID</label>
        <input
          value={form.merchant_id}
          onChange={set('merchant_id')}
          placeholder="merchant_id"
          className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Service ID</label>
        <input
          value={form.service_id}
          onChange={set('service_id')}
          placeholder="service_id"
          className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Secret Key</label>
        <input
          type="password"
          value={form.secret}
          onChange={set('secret')}
          placeholder="••••••••"
          className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-accent py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? 'Saqlanmoqda...' : 'Saqlash'}
      </button>
    </form>
  )
}

function ShopCard({ shop: initialShop, apiKey }) {
  const [shop, setShop] = useState(initialShop)
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{shop.name || "Nomsiz do'kon"}</p>
          <p className="mt-0.5 text-xs text-muted">
            ID: {shop.id} · {shop.orders_count || 0} buyurtma
            {shop.payment_provider && (
              <span className="ml-2 text-accent">· ✅ {providerLabel(shop.payment_provider)}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-shrink-0 rounded-xl bg-surface2 px-3 py-1.5 text-xs font-medium text-accent"
        >
          💳 {open ? 'Yopish' : "To'lov"}
        </button>
      </div>

      {open && (
        <PaymentForm
          shop={shop}
          apiKey={apiKey}
          onSaved={(updated) => {
            setShop(updated)
          }}
        />
      )}
    </div>
  )
}

export default function SuperAdmin() {
  const [key, setKey] = useState(() => localStorage.getItem('sa_key') || '')
  const [keyInput, setKeyInput] = useState('')
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (!key) return
    setLoading(true)
    setAuthError('')
    saFetch('/shops', key)
      .then(setShops)
      .catch((e) => {
        setAuthError(e.message)
        localStorage.removeItem('sa_key')
        setKey('')
      })
      .finally(() => setLoading(false))
  }, [key])

  function handleLogin() {
    const trimmed = keyInput.trim()
    if (!trimmed) return
    localStorage.setItem('sa_key', trimmed)
    setKey(trimmed)
  }

  if (!key) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-4">
        <div className="w-full max-w-xs">
          <h1 className="mb-4 text-center text-base font-bold">🔐 Super Admin</h1>
          {authError && (
            <p className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-center text-xs text-red-400">
              {authError}
            </p>
          )}
          <div className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Admin kaliti"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full rounded-xl bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={handleLogin}
              className="rounded-xl bg-accent py-2.5 text-sm font-bold text-bg"
            >
              Kirish
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="mx-auto max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-base font-bold">🛒 Do'konlar ({shops.length})</h1>
          <button
            onClick={() => {
              localStorage.removeItem('sa_key')
              setKey('')
              setShops([])
            }}
            className="text-xs text-muted"
          >
            Chiqish
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        )}

        <div className="flex flex-col gap-3">
          {shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} apiKey={key} />
          ))}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { adminApi } from '../../api.js'

const STATUS_LABEL = { pending: '🟡 Yangi', approved: '🟢 Qabul qilindi', rejected: '🔴 Rad etildi' }
const STATUS_COLOR = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
}

const TYPE_META = {
  reklama:    { label: '📢 Reklama berish',   color: 'bg-blue-500/20 text-blue-400' },
  hamkorlik:  { label: '🤝 Hamkorlik',        color: 'bg-purple-500/20 text-purple-400' },
  savol:      { label: '💬 Savol va taklif',  color: 'bg-teal-500/20 text-teal-400' },
  optom:      { label: '📦 Optom',            color: 'bg-orange-500/20 text-orange-400' },
  boshqa:     { label: '💬 Boshqa',           color: 'bg-gray-500/20 text-gray-400' },
}

const FILTERS = [
  { key: 'all',       label: 'Hammasi' },
  { key: 'reklama',   label: '📢 Reklama' },
  { key: 'hamkorlik', label: '🤝 Hamkorlik' },
  { key: 'savol',     label: '💬 Savol' },
]

const EMPTY_CHANNEL = { name: '', username: '', subscribers: '', price: '' }

function fmt(n) { return Number(n).toLocaleString('ru-RU') }
function fmtDate(str) {
  if (!str) return ''
  const d = new Date(str)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function ManageAds() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState(null)
  const [channels, setChannels] = useState([])
  const [newCh, setNewCh] = useState(EMPTY_CHANNEL)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    Promise.all([adminApi.getAdOrders(), adminApi.getSettings()]).then(([ads, s]) => {
      setOrders(ads)
      setSettings(s)
      setChannels((s.ad_prices || {}).channels || [])
      setLoading(false)
    })
  }, [])

  async function saveChannels(updated) {
    setSaving(true)
    try {
      await adminApi.updateSettings({ ...settings, ad_prices: { channels: updated } })
      setChannels(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  function handleAddChannel(e) {
    e.preventDefault()
    if (!newCh.name.trim()) return
    const ch = {
      name: newCh.name.trim(),
      username: newCh.username.trim().startsWith('@') ? newCh.username.trim() : `@${newCh.username.trim()}`,
      subscribers: Number(newCh.subscribers) || 0,
      price: Number(newCh.price) || 0,
    }
    saveChannels([...channels, ch])
    setNewCh(EMPTY_CHANNEL)
  }

  async function handleStatusChange(id, status) {
    const updated = await adminApi.updateAdOrderStatus(id, status)
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)))
  }

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.request_type === filter)

  if (loading) return <div className="py-10 text-center text-sm text-muted">Yuklanmoqda...</div>

  return (
    <div className="flex flex-col gap-4 pb-6">
      <h2 className="text-base font-semibold pt-2">📢 Reklama va Hamkorlik</h2>

      {/* Channel settings */}
      <div className="rounded-2xl bg-surface p-4 flex flex-col gap-3">
        <p className="text-sm font-semibold">Mening kanallarim</p>

        {channels.length > 0 && (
          <div className="flex flex-col gap-2">
            {channels.map((ch, i) => (
              <div key={i} className="rounded-xl bg-bg px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{ch.name}</p>
                  <p className="text-xs text-muted">{ch.username} · {fmt(ch.subscribers)} obunachi · {fmt(ch.price)} so'm</p>
                </div>
                <button
                  onClick={() => saveChannels(channels.filter((_, j) => j !== i))}
                  className="flex-shrink-0 text-xs text-red-400 px-2 py-1 rounded-lg bg-red-500/10"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddChannel} className="flex flex-col gap-2">
          <p className="text-xs text-muted font-medium">Kanal qo'shish</p>
          <input
            value={newCh.name}
            onChange={(e) => setNewCh((p) => ({ ...p, name: e.target.value }))}
            placeholder="Kanal nomi *"
            className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <input
            value={newCh.username}
            onChange={(e) => setNewCh((p) => ({ ...p, username: e.target.value }))}
            placeholder="@kanal_username *"
            className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={newCh.subscribers}
              onChange={(e) => setNewCh((p) => ({ ...p, subscribers: e.target.value }))}
              placeholder="Obunachi soni"
              className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              type="number"
              value={newCh.price}
              onChange={(e) => setNewCh((p) => ({ ...p, price: e.target.value }))}
              placeholder="Narx (so'm)"
              className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !newCh.name.trim()}
            className="rounded-xl bg-accent py-2.5 text-sm font-medium text-bg disabled:opacity-60"
          >
            {saved ? '✓ Saqlandi' : saving ? 'Saqlanmoqda...' : "+ Kanal qo'shish"}
          </button>
        </form>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === key ? 'bg-accent text-bg' : 'bg-surface text-muted'
            }`}
          >
            {label}
            {key !== 'all' && (
              <span className="ml-1 opacity-60">
                {orders.filter((o) => o.request_type === key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-muted py-4">Arizalar yo'q</p>
        ) : (
          filtered.map((o) => {
            const typeMeta = TYPE_META[o.request_type] || { label: o.request_type || '—', color: 'bg-surface text-muted' }
            return (
              <div key={o.id} className="rounded-2xl bg-surface p-4 flex flex-col gap-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${typeMeta.color}`}>
                      {typeMeta.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[o.payment_status] || ''}`}>
                      {STATUS_LABEL[o.payment_status] || o.payment_status}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-muted">#{o.id}</p>
                    <p className="text-xs text-muted opacity-60">{fmtDate(o.created_at)}</p>
                  </div>
                </div>

                {/* Placement (reklama) */}
                {o.ad_placement && (
                  <p className="text-xs text-muted">📍 {o.ad_placement}</p>
                )}

                {/* Customer */}
                <p className="text-xs text-muted">
                  👤 {o.customer_username ? `@${o.customer_username}` : `ID: ${o.customer_telegram_id}`}
                </p>

                {/* Phone */}
                {o.customer_phone && (
                  <a href={`tel:${o.customer_phone}`} className="text-xs text-accent w-fit">
                    📞 {o.customer_phone}
                  </a>
                )}

                {/* Ad text / message */}
                {o.ad_text && (
                  <p className="text-xs bg-bg rounded-xl px-3 py-2 whitespace-pre-wrap leading-relaxed">
                    {o.ad_text}
                  </p>
                )}

                {/* Meta */}
                <div className="flex flex-wrap gap-3 text-xs text-muted">
                  {o.price > 0 && <span>💰 {fmt(o.price)} so'm</span>}
                  {o.ad_photo_file_id && <span>🖼 Rasm bor</span>}
                </div>

                {/* Actions */}
                {o.payment_status === 'pending' && (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleStatusChange(o.id, 'approved')}
                      className="flex-1 rounded-xl bg-green-500/20 text-green-400 py-2 text-xs font-medium"
                    >
                      ✅ Qabul qilish
                    </button>
                    <button
                      onClick={() => handleStatusChange(o.id, 'rejected')}
                      className="flex-1 rounded-xl bg-red-500/20 text-red-400 py-2 text-xs font-medium"
                    >
                      ❌ Rad etish
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

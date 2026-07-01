import { useEffect, useState } from 'react'
import { adminApi } from '../../api.js'

const STATUS_LABEL = { pending: '🟡 Yangi', approved: '🟢 Qabul qilindi', rejected: '🔴 Rad etildi' }
const STATUS_COLOR = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
}

const EMPTY_CHANNEL = { name: '', username: '', subscribers: '', price: '' }

function fmt(n) {
  return Number(n).toLocaleString('ru-RU')
}

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

  function handleDeleteChannel(idx) {
    saveChannels(channels.filter((_, i) => i !== idx))
  }

  async function handleStatusChange(id, status) {
    const updated = await adminApi.updateAdOrderStatus(id, status)
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)))
  }

  if (loading) return <div className="py-10 text-center text-sm text-muted">Yuklanmoqda...</div>

  return (
    <div className="flex flex-col gap-4 pb-6">
      <h2 className="text-base font-semibold pt-2">📢 Reklama</h2>

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
                  onClick={() => handleDeleteChannel(i)}
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
            {saved ? '✓ Saqlandi' : saving ? 'Saqlanmoqda...' : '+ Kanal qo\'shish'}
          </button>
        </form>
      </div>

      {/* Orders */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">Reklama arizalari</p>
        {orders.length === 0 ? (
          <p className="text-center text-sm text-muted py-4">Arizalar yo'q</p>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="rounded-2xl bg-surface p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Ariza #{o.id}</p>
                  <p className="text-xs text-muted mt-0.5">{fmtDate(o.created_at)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLOR[o.payment_status] || ''}`}>
                  {STATUS_LABEL[o.payment_status] || o.payment_status}
                </span>
              </div>

              {o.ad_placement && (
                <p className="text-xs text-muted">📍 {o.ad_placement}</p>
              )}

              <p className="text-xs text-muted">
                👤 {o.customer_username ? `@${o.customer_username}` : `ID: ${o.customer_telegram_id}`}
              </p>

              {o.customer_phone && (
                <a
                  href={`tel:${o.customer_phone}`}
                  className="text-xs text-accent"
                >
                  📞 {o.customer_phone}
                </a>
              )}

              {o.ad_text && (
                <p className="text-xs bg-bg rounded-xl px-3 py-2 whitespace-pre-wrap leading-relaxed">
                  📝 {o.ad_text}
                </p>
              )}

              {o.customer_comment && (
                <p className="text-xs text-muted italic">💬 {o.customer_comment}</p>
              )}

              <div className="flex flex-wrap gap-3 text-xs text-muted">
                {o.price != null && <span>💰 {fmt(o.price)} so'm</span>}
                <span>🖼 {o.ad_photo_file_id ? 'Rasm bor' : 'Rasmsiz'}</span>
              </div>

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
          ))
        )}
      </div>
    </div>
  )
}

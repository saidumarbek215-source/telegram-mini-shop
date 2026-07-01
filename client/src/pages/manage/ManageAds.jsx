import { useEffect, useState } from 'react'
import { adminApi } from '../../api.js'

const STATUS_LABEL = { pending: 'Ожидает', approved: 'Одобрено', rejected: 'Отклонено' }
const STATUS_COLOR = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
}

const DEFAULT_PRICES = { '24': '', '48': '', '72': '', '168': '' }

export default function ManageAds() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState(null)
  const [channelId, setChannelId] = useState('')
  const [prices, setPrices] = useState(DEFAULT_PRICES)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([adminApi.getAdOrders(), adminApi.getSettings()]).then(([ads, s]) => {
      setOrders(ads)
      setSettings(s)
      setChannelId(s.ad_channel_id || '')
      const p = s.ad_prices || {}
      setPrices({ '24': p['24'] ?? '', '48': p['48'] ?? '', '72': p['72'] ?? '', '168': p['168'] ?? '' })
      setLoading(false)
    })
  }, [])

  async function handleSaveSettings(e) {
    e.preventDefault()
    setSaving(true)
    const ad_prices = {}
    for (const [k, v] of Object.entries(prices)) {
      if (v !== '' && Number(v) >= 0) ad_prices[k] = Number(v)
    }
    try {
      await adminApi.updateSettings({ ...settings, ad_channel_id: channelId, ad_prices })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(id, status) {
    const updated = await adminApi.updateAdOrderStatus(id, status)
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)))
  }

  if (loading) return <div className="py-10 text-center text-sm text-muted">Загрузка...</div>

  return (
    <div className="flex flex-col gap-4 pb-6">
      <h2 className="text-base font-semibold pt-2">📢 Реклама</h2>

      {/* Settings */}
      <form onSubmit={handleSaveSettings} className="rounded-2xl bg-surface p-4 flex flex-col gap-3">
        <p className="text-sm font-semibold">Настройки рекламы</p>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">ID канала для публикации</label>
          <input
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder="@mychannel или -100123456789"
            className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <p className="text-xs text-muted font-medium mt-1">Цены (сум)</p>
        <div className="grid grid-cols-2 gap-2">
          {[['24', '24 ч'], ['48', '48 ч'], ['72', '72 ч'], ['168', '7 дней']].map(([key, label]) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs text-muted">{label}</label>
              <input
                type="number"
                value={prices[key]}
                onChange={(e) => setPrices((p) => ({ ...p, [key]: e.target.value }))}
                placeholder="0"
                className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-accent py-2.5 text-sm font-medium text-bg disabled:opacity-60"
        >
          {saved ? '✓ Сохранено' : saving ? 'Сохранение...' : 'Сохранить настройки'}
        </button>
      </form>

      {/* Orders */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">Заявки на рекламу</p>
        {orders.length === 0 ? (
          <p className="text-center text-sm text-muted py-4">Заявок пока нет</p>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="rounded-2xl bg-surface p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">Заявка #{o.id}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[o.payment_status] || ''}`}>
                  {STATUS_LABEL[o.payment_status] || o.payment_status}
                </span>
              </div>
              <p className="text-xs text-muted">
                {o.customer_username ? `@${o.customer_username}` : `ID: ${o.customer_telegram_id}`}
              </p>
              {o.ad_text && (
                <p className="text-xs bg-bg rounded-xl px-3 py-2 whitespace-pre-wrap">{o.ad_text}</p>
              )}
              <div className="flex flex-wrap gap-2 text-xs text-muted">
                <span>⏱ {o.duration_hours} ч</span>
                <span>💰 {Number(o.price).toLocaleString('ru-RU')} сум</span>
                <span>🖼 {o.ad_photo_file_id ? 'Есть фото' : 'Без фото'}</span>
              </div>
              {o.payment_status === 'pending' && (
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => handleStatusChange(o.id, 'approved')}
                    className="flex-1 rounded-xl bg-green-500/20 text-green-400 py-2 text-xs font-medium"
                  >
                    ✅ Одобрить
                  </button>
                  <button
                    onClick={() => handleStatusChange(o.id, 'rejected')}
                    className="flex-1 rounded-xl bg-red-500/20 text-red-400 py-2 text-xs font-medium"
                  >
                    ❌ Отклонить
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

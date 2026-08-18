import { useEffect, useState } from 'react'
import { getSettings, updateSettings } from '../api.js'

const PAYMENT_METHODS = [
  { key: 'cash',      label: 'Naqd pul (Cash)',  locked: false },
  { key: 'card',      label: 'Karta',             locked: false },
  { key: 'uzum',      label: 'Uzum Bank',         locked: true  },
  { key: 'payme',     label: 'Payme',             locked: true  },
  { key: 'nasiya',    label: 'Nasiya',            locked: true  },
]

export default function Settings() {
  const [form,    setForm]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  useEffect(() => {
    getSettings()
      .then(data => setForm(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateSettings(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="card p-5 h-24 animate-pulse bg-gray-100" />)}
    </div>
  )

  if (!form) return <div className="text-center text-gray-400 py-20">Sozlamalar yuklanmadi</div>

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-xl font-black text-gray-900">Sozlamalar</h1>
        <p className="text-sm text-gray-500">Do'kon ma'lumotlari va konfiguratsiya</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Store info */}
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Do'kon ma'lumotlari</h2>
          <div>
            <label className="label">Do'kon nomi</label>
            <input className="input" value={form.store_name || ''} onChange={e => set('store_name', e.target.value)} placeholder="Boston Telefon Bozor" />
          </div>
          <div>
            <label className="label">Tavsif</label>
            <textarea className="input resize-none" rows={2} value={form.store_description || ''} onChange={e => set('store_description', e.target.value)} placeholder="Do'kon haqida..." />
          </div>
          <div>
            <label className="label">Valyuta</label>
            <input className="input" value={form.currency || ''} onChange={e => set('currency', e.target.value)} placeholder="so'm" />
          </div>
        </div>

        {/* Payment */}
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">To'lov ma'lumotlari</h2>
          <div>
            <label className="label">Karta raqami</label>
            <input className="input font-mono" value={form.card_number || ''} onChange={e => set('card_number', e.target.value)} placeholder="8600 0000 0000 0000" />
          </div>
          <div>
            <label className="label">Karta egasi</label>
            <input className="input" value={form.card_holder || ''} onChange={e => set('card_holder', e.target.value)} placeholder="ALISHER UMAROV" />
          </div>
          <div>
            <label className="label">Click raqami</label>
            <input className="input" value={form.click_number || ''} onChange={e => set('click_number', e.target.value)} placeholder="+998 90 000 00 00" />
          </div>
          <div>
            <label className="label">Online to'lov tizimi</label>
            <select className="input" value={form.payment_provider || ''} onChange={e => set('payment_provider', e.target.value)}>
              <option value="">— Yo'q —</option>
              <option value="payme">Payme</option>
              <option value="click">Click</option>
              <option value="uzum">Uzum</option>
            </select>
          </div>
        </div>

        {/* Web admin credentials */}
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Veb admin kirish</h2>
          <p className="text-xs text-gray-500">Veb-adminpanelga kirish uchun login va parolni o'rnatish</p>
          <div>
            <label className="label">Login</label>
            <input className="input" value={form.web_admin_login || ''} onChange={e => set('web_admin_login', e.target.value)} placeholder="admin" autoComplete="off" />
          </div>
          <div>
            <label className="label">Yangi parol (bo'sh qoldiring — o'zgarmaydi)</label>
            <input className="input" type="password" onChange={e => set('web_admin_password', e.target.value)} placeholder="••••••" autoComplete="new-password" />
          </div>
        </div>

        {/* Appearance */}
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Ko'rinish va til</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Til</label>
              <select className="input" value={form.features?.language || 'ru'} onChange={e => set('features', { ...(form.features||{}), language: e.target.value })}>
                <option value="ru">🇷🇺 Русский</option>
                <option value="uz">🇺🇿 O'zbekcha</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>
            <div>
              <label className="label">Tema</label>
              <select className="input" value={form.features?.theme || 'dark'} onChange={e => set('features', { ...(form.features||{}), theme: e.target.value })}>
                <option value="dark">🌙 Qora</option>
                <option value="light">☀️ Oq</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">O'lchov turi</label>
            <select className="input" value={form.product_unit_type || 'size'} onChange={e => set('product_unit_type', e.target.value)}>
              <option value="size">O'lcham (S, M, L, XL, 40, 41...)</option>
              <option value="weight">Og'irlik (1kg, 5kg, 10kg...)</option>
              <option value="volume">Hajm (1l, 5l, 10l...)</option>
              <option value="piece">Dona (shtuka)</option>
            </select>
          </div>
          <div>
            <label className="label">Valyuta</label>
            <select className="input" value={form.currency || "so'm"} onChange={e => set('currency', e.target.value)}>
              <option value="so'm">🇺🇿 So'm (UZS)</option>
              <option value="$">🇺🇸 Dollar ($)</option>
              <option value="€">🇪🇺 Yevro (€)</option>
              <option value="₽">🇷🇺 Rubl (₽)</option>
            </select>
          </div>
          <div>
            <label className="label">Telegram admin username</label>
            <input className="input" value={form.admin_username || ''} onChange={e => set('admin_username', e.target.value)} placeholder="example: boston_admin" />
          </div>
        </div>

        {/* Payment methods */}
        {form && (() => {
          const tariff = form.tariff || 'trial'
          const businessUnlocked = tariff === 'business' || tariff === 'max'
          const enabledMethods = form.enabled_payment_methods || []
          const toggleMethod = (key) => {
            const next = enabledMethods.includes(key)
              ? enabledMethods.filter(m => m !== key)
              : [...enabledMethods, key]
            set('enabled_payment_methods', next)
          }
          return (
            <div className="card p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">To'lov usullari</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Mijozlarga ko'rsatiladigan to'lov usullari</p>
                </div>
                {!businessUnlocked && (
                  <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-semibold shrink-0">Business</span>
                )}
              </div>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(({ key, label, locked }) => {
                  const isLocked = locked && !businessUnlocked
                  const checked  = !isLocked && enabledMethods.includes(key)
                  return (
                    <label
                      key={key}
                      className={`flex items-center gap-3 cursor-pointer ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-yellow-400"
                        checked={checked}
                        disabled={isLocked}
                        onChange={() => !isLocked && toggleMethod(key)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{label}</p>
                        {isLocked && (
                          <p className="text-xs text-purple-600 font-semibold">Business tarifida ochiladi</p>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Order settings */}
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Buyurtma sozlamalari</h2>
          <div>
            <label className="label">Avtomatik bekor qilish (daqiqa, 0 = o'chirilgan)</label>
            <select className="input" value={form.auto_cancel_minutes ?? 15} onChange={e => set('auto_cancel_minutes', Number(e.target.value))}>
              {[0, 15, 30, 60, 120, 1440].map(v => (
                <option key={v} value={v}>{v === 0 ? "O'chirilgan" : v === 1440 ? "24 soat" : `${v} daqiqa`}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-yellow-400" checked={form.credit_enabled || false} onChange={e => set('credit_enabled', e.target.checked)} />
            <div>
              <p className="text-sm font-medium">Bo'lib to'lash</p>
              <p className="text-xs text-gray-500">Nasiya orqali xarid qilishga ruxsat berish</p>
            </div>
          </label>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary px-8 disabled:opacity-50">
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
          {saved && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saqlandi!
            </div>
          )}
        </div>
      </form>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { getSettings } from '../api.js'

const TARIFF_LABELS = {
  trial:    'Sinov (Trial)',
  standard: 'Standard',
  business: 'Business',
  max:      'Max',
}
const TARIFF_COLORS = {
  trial:    'bg-yellow-100 text-yellow-800 border-yellow-300',
  standard: 'bg-blue-100 text-blue-800 border-blue-300',
  business: 'bg-purple-100 text-purple-800 border-purple-300',
  max:      'bg-green-100 text-green-800 border-green-300',
}

const TARIFFS = [
  {
    key:      'trial',
    label:    'Sinov (Trial)',
    price:    'Bepul',
    period:   '7 kun',
    features: ['Mini App', 'Asosiy funksiyalar'],
  },
  {
    key:      'standard',
    label:    'Standard',
    price:    "250 000 so'm",
    period:   '/oy',
    features: ['Mini App'],
  },
  {
    key:      'business',
    label:    'Business',
    price:    "550 000 so'm",
    period:   '/oy',
    features: ['Standard', 'CRM', 'Onlayn sklad', "To'lov tizimlari (Uzum Bank, Payme, Nasiya)"],
  },
  {
    key:      'max',
    label:    'Max',
    price:    "850 000 so'm",
    period:   '/oy',
    features: ['Business', 'Sayt', 'AI Agent'],
  },
]

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })
}

function daysLeft(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  return Math.max(0, Math.ceil(diff / 86400000))
}

export default function Subscription() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSettings()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-4 max-w-xl">
      {[1, 2, 3].map(i => <div key={i} className="card p-5 h-24 animate-pulse bg-gray-100" />)}
    </div>
  )

  if (!data) return <div className="text-center text-gray-400 py-20">Ma'lumot yuklanmadi</div>

  const tariff   = data.tariff || 'trial'
  const isTrial  = tariff === 'trial'
  const deadline = isTrial ? data.trial_ends_at : data.next_payment_due
  const days     = daysLeft(deadline)
  const isUrgent = days !== null && days <= 3

  const crmLocked   = tariff === 'trial' || tariff === 'standard'
  const crmActive   = tariff === 'business' || tariff === 'max'

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <h1 className="text-xl font-black text-gray-900">Obuna</h1>
        <p className="text-sm text-gray-500">Tarif va to'lov holati</p>
      </div>

      {/* Current plan */}
      <div className="card p-5 space-y-4">
        <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Joriy tarif</h2>
        <div className="flex items-center gap-3">
          <span className={`badge border text-sm px-3 py-1 font-semibold ${TARIFF_COLORS[tariff] || TARIFF_COLORS.trial}`}>
            {TARIFF_LABELS[tariff] || tariff}
          </span>
          {isTrial && <span className="text-xs text-gray-500">Bepul sinov davri</span>}
        </div>

        {deadline ? (
          <div className={`rounded-xl p-4 border ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {isTrial ? 'Sinov tugash sanasi' : "Keyingi to'lov sanasi"}
            </p>
            <p className={`text-lg font-black ${isUrgent ? 'text-red-600' : 'text-gray-900'}`}>
              {fmt(deadline)}
            </p>
            {days !== null && (
              <p className={`text-sm mt-0.5 ${isUrgent ? 'text-red-500' : 'text-gray-500'}`}>
                {days === 0 ? 'Bugun tugaydi!' : `${days} kun qoldi`}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl p-4 bg-gray-50 border border-gray-200 text-sm text-gray-400">
            Tugash sanasi belgilanmagan
          </div>
        )}
      </div>

      {/* Tariff comparison */}
      <div className="card p-5 space-y-3">
        <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Tariflar</h2>
        {TARIFFS.map(t => (
          <div
            key={t.key}
            className={`flex items-start gap-3 p-3 rounded-xl border ${tariff === t.key ? 'border-yellow-400 bg-yellow-50' : 'border-gray-100 bg-gray-50'}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{t.label}</p>
                {tariff === t.key && (
                  <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-bold">Joriy</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{t.features.join(' · ')}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-gray-700">{t.price}</p>
              {t.period && <p className="text-xs text-gray-400">{t.period}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* CRM & Onlayn sklad announce */}
      <div className={`card p-5 space-y-3 border-2 ${crmActive ? 'border-green-300 bg-green-50' : 'border-dashed border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏪</span>
          <div>
            <p className="font-bold text-gray-900">CRM va Onlayn sklad</p>
            {crmActive ? (
              <span className="inline-block mt-1 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">Faollashtirilgan</span>
            ) : (
              <span className="inline-block mt-1 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-semibold">Business tarifda mavjud</span>
            )}
          </div>
        </div>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>📋 Mijozlar bazasi va tarix (CRM)</li>
          <li>📦 Mahsulot qoldiqlari va omborxona</li>
          <li>💳 Uzum Bank, Payme, Nasiya orqali to'lov</li>
        </ul>
        {crmLocked && (
          <p className="text-xs text-gray-400">Business yoki Max tarifiga o'ting — barcha funksiyalar ochiladi</p>
        )}
      </div>

      {/* Payment contact */}
      <div className="card p-5 text-center space-y-2 border-2 border-dashed border-gray-200">
        <p className="text-2xl">💬</p>
        <p className="font-semibold text-gray-700">Tarif o'zgartirish</p>
        <p className="text-sm text-gray-400">To'lov va tarif o'zgartirish uchun adminga murojaat qiling</p>
      </div>
    </div>
  )
}

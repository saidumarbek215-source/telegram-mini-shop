import { useEffect, useState } from 'react'
import { getSettings } from '../api.js'

const TARIFF_LABELS = {
  trial:    'Sinov davri',
  basic:    'Basic',
  pro:      'Pro',
  business: 'Business',
}
const TARIFF_COLORS = {
  trial:    'bg-yellow-100 text-yellow-800 border-yellow-300',
  basic:    'bg-blue-100 text-blue-800 border-blue-300',
  pro:      'bg-purple-100 text-purple-800 border-purple-300',
  business: 'bg-green-100 text-green-800 border-green-300',
}

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
          {isTrial && (
            <span className="text-xs text-gray-500">Bepul sinov davri</span>
          )}
        </div>

        {deadline ? (
          <div className={`rounded-xl p-4 border ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {isTrial ? 'Sinov tugash sanasi' : 'Keyingi to\'lov sanasi'}
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
        {[
          { key: 'trial',    label: 'Sinov',    price: 'Bepul',         features: ['30 kun', 'Asosiy funksiyalar'] },
          { key: 'basic',    label: 'Basic',    price: '99 000 so\'m/oy', features: ['Mahsulotlar', 'Buyurtmalar', 'Statistika'] },
          { key: 'pro',      label: 'Pro',      price: '199 000 so\'m/oy', features: ['Basic + AI assistant', 'Nasiya', 'Reklama'] },
          { key: 'business', label: 'Business', price: '349 000 so\'m/oy', features: ['Pro + Ustuvor qo\'llab-quvvatlash', 'Ko\'p filiallar'] },
        ].map(t => (
          <div key={t.key} className={`flex items-start gap-3 p-3 rounded-xl border ${tariff === t.key ? 'border-yellow-400 bg-yellow-50' : 'border-gray-100 bg-gray-50'}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{t.label}</p>
                {tariff === t.key && <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-bold">Joriy</span>}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{t.features.join(' · ')}</p>
            </div>
            <p className="text-sm font-bold text-gray-700 whitespace-nowrap">{t.price}</p>
          </div>
        ))}
      </div>

      {/* Payment coming soon */}
      <div className="card p-5 text-center space-y-2 border-2 border-dashed border-gray-200">
        <p className="text-2xl">🔜</p>
        <p className="font-semibold text-gray-700">To'lov tizimi tez orada</p>
        <p className="text-sm text-gray-400">To'lov tizimlari (Payme, Click, Uzum) tez orada qo'shiladi</p>
        <p className="text-xs text-gray-400 mt-2">To'lov uchun adminga murojaat qiling</p>
      </div>
    </div>
  )
}

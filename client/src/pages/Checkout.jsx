import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { api } from '../api.js'
import { formatPrice } from '../utils/format.js'
import { getTelegramUser, getTelegramWebApp, hapticFeedback } from '../telegram.js'
import { ChevronLeftIcon, CheckIcon } from '../components/Icons.jsx'
import { useShop } from '../context/ShopContext.jsx'
import { t } from '../i18n.js'

export default function Checkout() {
  const navigate = useNavigate()
  const { setHideContact } = useOutletContext() ?? {}
  const { items, total, clearCart } = useCart()
  const { lang } = useShop()

  const [settings, setSettings] = useState({})
  const [form, setForm] = useState({ name: '', phone: '', address: '', comment: '' })
  const [paymentType, setPaymentType] = useState('prepaid')
  const [paymentDueDate, setPaymentDueDate] = useState('')
  const [locationReceived, setLocationReceived] = useState(false)
  const [copied, setCopied] = useState(false)
  const [locationCoords, setLocationCoords] = useState(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [orderTotal, setOrderTotal] = useState(0)

  useEffect(() => {
    api.getSettings().then(setSettings)

    const tgUser = getTelegramUser()
    if (tgUser) {
      setForm((f) => ({
        ...f,
        name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' '),
      }))
    }
  }, [])

  useEffect(() => {
    if (items.length === 0 && !success) {
      navigate('/cart', { replace: true })
    }
  }, [items.length, success, navigate])

  useEffect(() => {
    setHideContact?.(success)
  }, [success, setHideContact])

  if (items.length === 0 && !success) return null

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleRequestLocation() {
    setLocationLabel(t('locating', lang))
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setForm((f) => ({ ...f, address: `${lat},${lng}` }))
        setLocationCoords({ lat, lng })
        setLocationReceived(true)
        setShowManualInput(false)
        setLocationLabel(t('locationReceived', lang))
      },
      () => {
        setLocationLabel(t('detectLocation', lang))
        setShowManualInput(true)
      }
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError(t('fillFields', lang))
      return
    }
    setError('')
    setSubmitting(true)

    const tgUser = getTelegramUser()

    try {
      const order = await api.createOrder({
        telegram_user_id: tgUser?.id,
        telegram_username: tgUser?.username,
        customer_name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        comment: form.comment.trim(),
        payment_type: paymentType,
        payment_due_date: paymentType === 'credit' ? paymentDueDate || null : null,
        items: items.map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name,
          image_url: i.image_url,
          price: i.price,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
        })),
      })
      hapticFeedback('heavy')
      setOrderItems(items)
      setOrderTotal(total)
      clearCart()
      setOrderId(order.id)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    function handleContactSeller() {
      if (!settings.admin_username) return

      const orderText = encodeURIComponent(
        `Заказ #${orderId}\n` +
          orderItems
            .map(
              (i) =>
                `• ${i.product_name}${i.size ? `, размер ${i.size}` : ''}, ${i.quantity} шт.`
            )
            .join('\n') +
          '\n' +
          `Сумма: ${formatPrice(orderTotal, settings.currency || 'сум')}\n` +
          `Прикрепляю фото чека`
      )

      const url = `https://t.me/${settings.admin_username}?text=${orderText}`
      const tg = getTelegramWebApp()
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(url)
      } else {
        window.open(url, '_blank')
      }
    }

    return (
      <div className="flex flex-col items-center px-4 py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
          <CheckIcon className="h-8 w-8 text-accent" />
        </div>
        <h2 className="text-lg font-bold">✅ {t('order', lang)} #{orderId} — {t('orderSuccess', lang)}</h2>

        {paymentType === 'credit' ? (
          <div className="mt-4 w-full rounded-2xl bg-accent/10 p-4 text-left">
            <p className="text-sm font-semibold text-accent">
              📅 {t('creditConfirm', lang)}{' '}
              {paymentDueDate
                ? new Date(paymentDueDate).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : '—'}
            </p>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted">{t('total', lang)}</span>
              <span className="font-bold text-accent">{formatPrice(orderTotal, settings.currency || 'сум')}</span>
            </div>
          </div>
        ) : (
          settings.card_number && (
            <div className="mt-4 w-full rounded-2xl bg-surface p-4 text-left">
              <h3 className="mb-2 text-sm font-semibold">💳 {t('payCard', lang)}:</h3>
              <div className="flex items-center justify-between py-1 text-sm">
                <span className="text-muted">{t('name', lang)}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{settings.card_number}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(settings.card_number)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="rounded-lg bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent"
                  >
                    {copied ? `✅ ${t('copied', lang)}` : `📋 ${t('copy', lang)}`}
                  </button>
                </div>
              </div>
              {settings.card_holder && (
                <div className="flex items-center justify-between py-1 text-sm">
                  <span className="text-muted">{settings.card_holder}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-1 text-sm">
                <span className="text-muted">{t('total', lang)}</span>
                <span className="font-bold text-accent">{formatPrice(orderTotal, settings.currency || 'сум')}</span>
              </div>
            </div>
          )
        )}

        <p className="mt-4 text-sm text-muted">📦 {t('deliveryNote', lang)}</p>

        {settings.admin_username && (
          <button
            onClick={handleContactSeller}
            className="mt-4 w-full rounded-2xl bg-accent py-3.5 text-sm font-bold text-bg"
          >
            💬 {t('writeSeller', lang)}
          </button>
        )}

        <button
          onClick={() => navigate('/profile')}
          className="mt-3 w-full rounded-2xl bg-surface py-3.5 text-sm font-bold text-white"
        >
          {t('myOrders', lang)}
        </button>
      </div>
    )
  }

  return (
    <div>
      <header className="flex items-center gap-2 px-4 pb-2 pt-5">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">{t('orderForm', lang)}</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pt-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">
            {t('buyerName', lang)}
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder={t('namePlaceholder', lang)}
            className="w-full rounded-2xl bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">
            {t('phoneNumber', lang)}
          </label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+998 90 123 45 67"
            type="tel"
            className="w-full rounded-2xl bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">
            {t('deliveryAddress', lang)}
          </label>
          {locationReceived ? (
            <div className="rounded-2xl bg-surface px-4 py-3">
              <p className="text-sm text-accent">{locationLabel}</p>
              {locationCoords && (
                <a
                  href={`https://maps.google.com/?q=${locationCoords.lat},${locationCoords.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block text-xs text-muted underline"
                >
                  {t('viewOnMap', lang)}
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  setLocationReceived(false)
                  setLocationCoords(null)
                  setLocationLabel(t('detectLocation', lang))
                  setShowManualInput(true)
                  setForm((f) => ({ ...f, address: '' }))
                }}
                className="mt-2 text-xs text-muted underline"
              >
                ✏️ Ввести адрес вручную
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRequestLocation}
                className="mb-2 w-full rounded-2xl bg-surface px-4 py-3 text-sm font-medium text-left"
              >
                {locationLabel || t('detectLocation', lang)}
              </button>
              {showManualInput ? (
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder={t('addressPlaceholder', lang)}
                  rows={2}
                  className="w-full resize-none rounded-2xl bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowManualInput(true)}
                  className="w-full rounded-2xl bg-surface px-4 py-3 text-sm text-left text-muted"
                >
                  ✏️ {t('enterAddressManual', lang)}
                </button>
              )}
            </>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">{t('comment', lang)}</label>
          <textarea
            name="comment"
            value={form.comment}
            onChange={handleChange}
            placeholder={t('commentPlaceholder', lang)}
            rows={2}
            className="w-full resize-none rounded-2xl bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {settings.credit_enabled && (
          <div className="rounded-2xl bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold">{t('paymentDetails', lang)}</h3>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('prepaid')}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  paymentType === 'prepaid' ? 'bg-accent text-bg' : 'bg-surface2 text-white'
                }`}
              >
                💳 {t('payNow', lang)}
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('credit')}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  paymentType === 'credit' ? 'bg-accent text-bg' : 'bg-surface2 text-white'
                }`}
              >
                📅 {t('payLater', lang)}
              </button>
            </div>
            {paymentType === 'credit' && (
              <div className="mt-3">
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  {t('paymentDate', lang)}
                </label>
                <input
                  type="date"
                  value={paymentDueDate}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  onChange={(e) => setPaymentDueDate(e.target.value)}
                  className="w-full rounded-2xl bg-surface2 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            )}
          </div>
        )}

        {paymentType === 'prepaid' && (settings.card_number || settings.click_number) && (
          <div className="rounded-2xl bg-surface p-4">
            <h3 className="mb-2 text-sm font-semibold">{t('paymentDetails', lang)}</h3>
            {settings.card_number && (
              <div className="flex items-center justify-between py-1 text-sm">
                <span className="text-muted">{t('card', lang)}</span>
                <span className="font-mono font-medium">{settings.card_number}</span>
              </div>
            )}
            {settings.card_holder && (
              <div className="flex items-center justify-between py-1 text-sm">
                <span className="text-muted">{t('recipient', lang)}</span>
                <span className="font-medium">{settings.card_holder}</span>
              </div>
            )}
            {settings.click_number && (
              <div className="flex items-center justify-between py-1 text-sm">
                <span className="text-muted">Click</span>
                <span className="font-medium">{settings.click_number}</span>
              </div>
            )}
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {t('payAfterConfirm', lang)}
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">
              {t('itemCount', lang)}: {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
            <span className="text-lg font-bold text-accent">{formatPrice(total, settings.currency || 'сум')}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mb-2 w-full rounded-2xl bg-accent py-3.5 text-sm font-bold text-bg shadow-glow transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? t('submitting', lang) : t('confirmOrder', lang)}
        </button>
      </form>
    </div>
  )
}

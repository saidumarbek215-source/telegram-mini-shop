import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { api } from '../api.js'
import { formatPrice } from '../utils/format.js'
import { getTelegramUser, hapticFeedback } from '../telegram.js'
import { ChevronLeftIcon, CheckIcon } from '../components/Icons.jsx'

export default function Checkout() {
  const navigate = useNavigate()
  const { items, total, clearCart } = useCart()

  const [settings, setSettings] = useState({})
  const [form, setForm] = useState({ name: '', phone: '', address: '', comment: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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

  if (items.length === 0 && !success) return null

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError('Заполните все обязательные поля')
      return
    }
    setError('')
    setSubmitting(true)

    const tgUser = getTelegramUser()

    try {
      await api.createOrder({
        telegram_user_id: tgUser?.id,
        telegram_username: tgUser?.username,
        customer_name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        comment: form.comment.trim(),
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
      clearCart()
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
          <CheckIcon className="h-8 w-8 text-accent" />
        </div>
        <h2 className="text-lg font-bold">Заказ оформлен!</h2>
        <p className="mt-1 text-sm text-muted">Мы свяжемся с вами для подтверждения оплаты</p>
        <button
          onClick={() => navigate('/profile')}
          className="mt-5 rounded-2xl bg-accent px-6 py-3 text-sm font-bold text-bg"
        >
          Мои заказы
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
        <h1 className="text-lg font-bold">Оформление заказа</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pt-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">
            Имя покупателя *
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Иван Иванов"
            className="w-full rounded-2xl bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">
            Номер телефона *
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
            Адрес доставки *
          </label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Город, улица, дом, квартира"
            rows={2}
            className="w-full resize-none rounded-2xl bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Комментарий</label>
          <textarea
            name="comment"
            value={form.comment}
            onChange={handleChange}
            placeholder="Дополнительная информация к заказу"
            rows={2}
            className="w-full resize-none rounded-2xl bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {(settings.card_number || settings.click_number) && (
          <div className="rounded-2xl bg-surface p-4">
            <h3 className="mb-2 text-sm font-semibold">Реквизиты для оплаты</h3>
            {settings.card_number && (
              <div className="flex items-center justify-between py-1 text-sm">
                <span className="text-muted">Карта</span>
                <span className="font-mono font-medium">{settings.card_number}</span>
              </div>
            )}
            {settings.card_holder && (
              <div className="flex items-center justify-between py-1 text-sm">
                <span className="text-muted">Получатель</span>
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
              Переведите сумму заказа по указанным реквизитам после подтверждения менеджером
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">
              Товаров: {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
            <span className="text-lg font-bold text-accent">{formatPrice(total)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mb-2 w-full rounded-2xl bg-accent py-3.5 text-sm font-bold text-bg shadow-glow transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? 'Отправка...' : 'Подтвердить заказ'}
        </button>
      </form>
    </div>
  )
}

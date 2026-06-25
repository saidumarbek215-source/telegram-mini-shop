import { useEffect, useState } from 'react'
import { adminApi } from '../../api.js'
import { SHOP_ID } from '../../shop.js'

const MINI_APP_BASE_URL =
  import.meta.env.VITE_MINI_APP_URL || 'https://telegram-mini-shop.netlify.app'
const MINI_APP_URL = `${MINI_APP_BASE_URL}?shop=${SHOP_ID}`

const FIELDS = [
  { key: 'store_name', label: 'Название магазина' },
  { key: 'store_description', label: 'Описание магазина' },
  { key: 'card_number', label: 'Номер карты для оплаты' },
  { key: 'card_holder', label: 'Получатель платежа (ФИО)' },
  { key: 'click_number', label: 'Номер Click' },
  { key: 'currency', label: 'Валюта' },
  { key: 'admin_username', label: 'Ваш Telegram username (без @)', placeholder: 'example: finexia_admin' },
]

const UNIT_TYPE_OPTIONS = [
  { value: 'size', label: 'Размер (S, M, L, XL, 40, 41...)' },
  { value: 'weight', label: 'Вес (1кг, 5кг, 10кг...)' },
  { value: 'volume', label: 'Объём (1л, 5л, 10л...)' },
  { value: 'piece', label: 'Количество (штуки)' },
]

export default function ManageSettings() {
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    adminApi
      .getSettings()
      .then((data) =>
        setForm({
          ...data,
          theme: data.features?.theme || 'dark',
          language: data.features?.language || 'ru',
        })
      )
      .finally(() => setLoading(false))
  }, [])

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setSaved(false)
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(MINI_APP_URL)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      /* clipboard not available */
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await adminApi.updateSettings(form)
      setForm({
        ...updated,
        theme: updated.features?.theme || 'dark',
        language: updated.features?.language || 'ru',
      })

      if (form.theme === 'light') {
        document.body.classList.add('light-theme')
      } else {
        document.body.classList.remove('light-theme')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-10 text-center text-sm text-muted">Загрузка...</div>

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-3 pb-4">
      <h2 className="mb-1 text-base font-bold">Реквизиты и настройки магазина</h2>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">
          Ссылка на Mini App (для BotFather)
        </label>
        <div className="flex gap-2">
          <input
            readOnly
            value={MINI_APP_URL}
            onFocus={(e) => e.target.select()}
            className="w-full truncate rounded-xl bg-surface px-3 py-2.5 text-sm text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-shrink-0 rounded-xl bg-surface px-3 py-2.5 text-sm font-medium text-accent"
          >
            {linkCopied ? 'Скопировано ✓' : 'Копировать'}
          </button>
        </div>
      </div>

      {FIELDS.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
          <input
            name={key}
            value={form[key] || ''}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full rounded-xl bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      ))}

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Тип единиц товара</label>
        <select
          name="product_unit_type"
          value={form.product_unit_type || 'size'}
          onChange={handleChange}
          className="w-full rounded-xl bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {UNIT_TYPE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Тема оформления</label>
        <select
          name="theme"
          value={form.theme || 'dark'}
          onChange={handleChange}
          className="w-full rounded-xl bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="dark">🌙 Тёмная</option>
          <option value="light">☀️ Светлая</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Язык интерфейса</label>
        <select
          name="language"
          value={form.language || 'ru'}
          onChange={handleChange}
          className="w-full rounded-xl bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="ru">🇷🇺 Русский</option>
          <option value="uz">🇺🇿 Узбекский</option>
          <option value="en">🇬🇧 English</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-2 rounded-2xl bg-accent py-3 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? 'Сохранение...' : saved ? 'Сохранено ✓' : 'Сохранить'}
      </button>
    </form>
  )
}

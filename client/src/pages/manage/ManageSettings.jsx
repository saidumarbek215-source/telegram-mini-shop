import { useEffect, useState } from 'react'
import { adminApi } from '../../api.js'
import { SHOP_ID } from '../../shop.js'
import { useShop } from '../../context/ShopContext.jsx'
import { t } from '../../i18n.js'

const MINI_APP_BASE_URL =
  import.meta.env.VITE_MINI_APP_URL || 'https://telegram-mini-shop.netlify.app'
const MINI_APP_URL = `${MINI_APP_BASE_URL}?shop=${SHOP_ID}`

const CURRENCY_OPTIONS = [
  { value: 'сум', label: '🇺🇿 Сум (UZS)' },
  { value: '$', label: '🇺🇸 Доллар ($)' },
  { value: '€', label: '🇪🇺 Евро (€)' },
  { value: '₽', label: '🇷🇺 Рубль (₽)' },
]

const UNIT_TYPE_OPTIONS = [
  { value: 'size', label: 'Размер (S, M, L, XL, 40, 41...)' },
  { value: 'weight', label: 'Вес (1кг, 5кг, 10кг...)' },
  { value: 'volume', label: 'Объём (1л, 5л, 10л...)' },
  { value: 'piece', label: 'Количество (штуки)' },
]

function getFields(lang) {
  return [
    { key: 'store_name', label: t('storeName', lang) },
    { key: 'store_description', label: t('storeDesc', lang) },
    { key: 'card_number', label: t('cardNumber', lang) },
    { key: 'card_holder', label: t('cardHolder', lang) },
    { key: 'click_number', label: t('clickNumber', lang) },
    { key: 'admin_username', label: t('tgUsername', lang), placeholder: 'example: finexia_admin' },
  ]
}

export default function ManageSettings() {
  const { lang } = useShop()
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
    } catch (err) {
      console.error('updateSettings error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-10 text-center text-sm text-muted">{t('loading', lang)}</div>

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-3 pb-4">
      <h2 className="mb-1 text-base font-bold">{t('manageSettings', lang)}</h2>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">
          {t('linkMiniApp', lang)}
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
            {linkCopied ? t('copyLinkDone', lang) : t('copyLink', lang)}
          </button>
        </div>
      </div>

      {getFields(lang).map(({ key, label, placeholder }) => (
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
        <label className="mb-1 block text-xs font-medium text-muted">{t('productUnitType', lang)}</label>
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
        <label className="mb-1 block text-xs font-medium text-muted">{t('currency', lang)}</label>
        <select
          name="currency"
          value={form.currency || 'сум'}
          onChange={handleChange}
          className="w-full rounded-xl bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {CURRENCY_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">{t('theme', lang)}</label>
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
        <label className="mb-1 block text-xs font-medium text-muted">{t('language', lang)}</label>
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

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">{t('autoCancelMinutes', lang)}</label>
        <select
          name="auto_cancel_minutes"
          value={form.auto_cancel_minutes ?? 15}
          onChange={handleChange}
          className="w-full rounded-xl bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value={0}>Не отменять автоматически</option>
          <option value={15}>15 минут</option>
          <option value={30}>30 минут</option>
          <option value={60}>1 час</option>
          <option value={120}>2 часа</option>
          <option value={1440}>24 часа</option>
        </select>
      </div>

      <label className="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
        <div>
          <p className="text-sm font-medium">Рассрочка (Должники)</p>
          <p className="text-xs text-muted">Включить возможность продавать в долг</p>
        </div>
        <input
          type="checkbox"
          name="credit_enabled"
          checked={form.credit_enabled || false}
          onChange={(e) => {
            setForm((f) => ({ ...f, credit_enabled: e.target.checked }))
            setSaved(false)
          }}
          className="h-5 w-5 accent-accent"
        />
      </label>

      <div className="rounded-xl bg-surface px-4 py-3 flex flex-col gap-3">
        <h3 className="text-sm font-bold">🌐 Veb-sayt admin paneli</h3>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Login</label>
          <input
            name="web_admin_login"
            value={form.web_admin_login || ''}
            onChange={handleChange}
            placeholder="Login"
            className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Parol</label>
          <input
            name="web_admin_password"
            type="password"
            value={form.web_admin_password || ''}
            onChange={handleChange}
            placeholder="Yangi parol (o'zgartirmasangiz bo'sh qoldiring)"
            className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      <div className="rounded-xl bg-surface px-4 py-3 flex flex-col gap-3">
        <h3 className="text-sm font-bold">💳 To'lov tizimi</h3>
        {form.payment_provider ? (
          <p className="text-sm text-accent">
            ✅{' '}
            {form.payment_provider === 'click'
              ? 'Click'
              : form.payment_provider === 'payme'
              ? 'Payme'
              : 'Uzum Bank'}{' '}
            ulangan
          </p>
        ) : (
          <>
            <p className="text-sm text-muted">To'lov tizimi ulanmagan</p>
            <button
              type="button"
              onClick={() => {
                const tg = window.Telegram?.WebApp
                if (tg) tg.openLink('https://t.me/finexia_uz')
                else window.open('https://t.me/finexia_uz', '_blank')
              }}
              className="rounded-xl bg-surface2 py-2.5 text-sm font-medium text-accent"
            >
              📩 To'lov tizimini ulash
            </button>
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-2 rounded-2xl bg-accent py-3 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? t('savingText', lang) : saved ? t('saved', lang) : t('save', lang)}
      </button>
    </form>
  )
}

import { useEffect, useState } from 'react'
import { adminApi } from '../../api.js'

const FIELDS = [
  { key: 'store_name', label: 'Название магазина' },
  { key: 'store_description', label: 'Описание магазина' },
  { key: 'card_number', label: 'Номер карты для оплаты' },
  { key: 'card_holder', label: 'Получатель платежа (ФИО)' },
  { key: 'click_number', label: 'Номер Click' },
  { key: 'currency', label: 'Валюта' },
]

export default function ManageSettings() {
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    adminApi
      .getSettings()
      .then(setForm)
      .finally(() => setLoading(false))
  }, [])

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setSaved(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await adminApi.updateSettings(form)
      setForm(updated)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-10 text-center text-sm text-muted">Загрузка...</div>

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-3 pb-4">
      <h2 className="mb-1 text-base font-bold">Реквизиты и настройки магазина</h2>

      {FIELDS.map(({ key, label }) => (
        <div key={key}>
          <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
          <input
            name={key}
            value={form[key] || ''}
            onChange={handleChange}
            className="w-full rounded-xl bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      ))}

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

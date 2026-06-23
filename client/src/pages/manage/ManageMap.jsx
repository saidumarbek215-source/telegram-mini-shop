import { useEffect, useState } from 'react'
import { adminApi } from '../../api.js'
import { getTelegramWebApp } from '../../telegram.js'

const EMPTY_FORM = { name: '', phone: '', address: '', status: 'active' }

export default function ManageMap() {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminApi.getPartners().then((data) => {
      setPartners(data)
      setLoading(false)
    })
  }, [])

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(partner) {
    setForm({
      name: partner.name,
      phone: partner.phone || '',
      address: partner.address || '',
      status: partner.status || 'active',
    })
    setEditingId(partner.id)
    setShowForm(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        const updated = await adminApi.updatePartner(editingId, form)
        setPartners((prev) => prev.map((p) => (p.id === editingId ? updated : p)))
      } else {
        const created = await adminApi.createPartner(form)
        setPartners((prev) => [created, ...prev])
      }
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(partner) {
    const newStatus = partner.status === 'active' ? 'inactive' : 'active'
    const updated = await adminApi.updatePartner(partner.id, { ...partner, status: newStatus })
    setPartners((prev) => prev.map((p) => (p.id === partner.id ? updated : p)))
  }

  async function handleDelete(id) {
    await adminApi.deletePartner(id)
    setPartners((prev) => prev.filter((p) => p.id !== id))
  }

  function openMap(address) {
    const tg = getTelegramWebApp()
    const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`
    if (tg?.openLink) {
      tg.openLink(url)
    } else {
      window.open(url, '_blank')
    }
  }

  if (loading) return <div className="py-10 text-center text-sm text-muted">Загрузка...</div>

  return (
    <div className="pb-6">
      <div className="mb-4 flex items-center justify-between pt-2">
        <h2 className="text-base font-semibold">Магазины-партнёры</h2>
        <button
          onClick={openAdd}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-bg"
        >
          + Добавить
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="mb-4 rounded-2xl bg-surface p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold">{editingId ? 'Редактировать' : 'Новый магазин'}</p>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Название *"
            className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            required
          />
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Телефон"
            type="tel"
            className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Адрес"
            className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="active">🟢 Активный</option>
            <option value="inactive">🔴 Неактивный</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-medium text-bg disabled:opacity-60"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-xl bg-bg py-2.5 text-sm font-medium text-muted"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {partners.length === 0 ? (
        <p className="text-center text-sm text-muted py-8">Партнёры не добавлены</p>
      ) : (
        <div className="flex flex-col gap-3">
          {partners.map((p) => (
            <div key={p.id} className="rounded-2xl bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  {p.phone && <p className="text-xs text-muted mt-0.5">{p.phone}</p>}
                  {p.address && <p className="text-xs text-muted mt-0.5">{p.address}</p>}
                </div>
                <span className="flex-shrink-0 text-sm">
                  {p.status === 'active' ? '🟢' : '🔴'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.address && (
                  <button
                    onClick={() => openMap(p.address)}
                    className="rounded-lg bg-bg px-3 py-1.5 text-xs font-medium text-muted"
                  >
                    🗺 На карте
                  </button>
                )}
                <button
                  onClick={() => toggleStatus(p)}
                  className="rounded-lg bg-bg px-3 py-1.5 text-xs font-medium text-muted"
                >
                  {p.status === 'active' ? '🔴 Деактивировать' : '🟢 Активировать'}
                </button>
                <button
                  onClick={() => openEdit(p)}
                  className="rounded-lg bg-bg px-3 py-1.5 text-xs font-medium text-muted"
                >
                  ✏️ Изменить
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="rounded-lg bg-bg px-3 py-1.5 text-xs font-medium text-red-400"
                >
                  🗑 Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

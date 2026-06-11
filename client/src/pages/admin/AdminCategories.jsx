import { useEffect, useState } from 'react'
import { adminApi } from '../../api.js'
import Modal from '../../components/admin/Modal.jsx'
import { PencilIcon, TrashIcon, PlusIcon } from '../../components/Icons.jsx'

function CategoryForm({ category, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    icon: category?.icon || '👟',
    sort_order: category?.sort_order ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Введите название')
      return
    }
    setError('')
    setSaving(true)
    try {
      await onSave({
        name: form.name.trim(),
        icon: form.icon.trim() || '👟',
        sort_order: Number(form.sort_order) || 0,
      })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Название *</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Иконка (эмодзи)</label>
          <input
            name="icon"
            value={form.icon}
            onChange={handleChange}
            className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Порядок</label>
          <input
            name="sort_order"
            type="number"
            value={form.sort_order}
            onChange={handleChange}
            className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="mt-1 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-2xl bg-surface2 py-3 text-sm font-medium text-white"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-2xl bg-accent py-3 text-sm font-bold text-bg disabled:opacity-60"
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  )
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    adminApi
      .getCategories()
      .then(setCategories)
      .finally(() => setLoading(false))
  }

  async function handleSave(data) {
    if (editing === 'new') {
      const created = await adminApi.createCategory(data)
      setCategories((prev) => [...prev, created])
    } else {
      const updated = await adminApi.updateCategory(editing.id, data)
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    }
    setEditing(null)
  }

  async function handleDelete(id) {
    if (!confirm('Удалить категорию? Товары останутся без категории.')) return
    await adminApi.deleteCategory(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  if (loading) return <div className="py-10 text-center text-sm text-muted">Загрузка...</div>

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold">Категории ({categories.length})</h2>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-bg"
        >
          <PlusIcon className="h-4 w-4" /> Добавить
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-surface2 text-2xl">
              {cat.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{cat.name}</p>
              <p className="text-xs text-muted">Порядок: {cat.sort_order}</p>
            </div>
            <div className="flex flex-shrink-0 gap-2">
              <button
                onClick={() => setEditing(cat)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface2 text-white"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface2 text-red-400"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">Категорий пока нет</p>
        )}
      </div>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Новая категория' : 'Редактировать категорию'}
          onClose={() => setEditing(null)}
        >
          <CategoryForm
            category={editing === 'new' ? null : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  )
}

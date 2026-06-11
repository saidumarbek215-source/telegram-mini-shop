import { useState } from 'react'

export default function ProductForm({ product, categories, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price ?? '',
    old_price: product?.old_price ?? '',
    image_url: product?.image_url || '',
    category_id: product?.category_id ?? '',
    sizes: (product?.sizes || []).join(', '),
    colors: (product?.colors || []).join(', '),
    in_stock: product?.in_stock ?? true,
    sort_order: product?.sort_order ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.price || !form.image_url.trim()) {
      setError('Заполните название, цену и ссылку на фото')
      return
    }
    setError('')
    setSaving(true)
    try {
      await onSave({
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        old_price: form.old_price ? Number(form.old_price) : null,
        image_url: form.image_url.trim(),
        category_id: form.category_id ? Number(form.category_id) : null,
        sizes: form.sizes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        colors: form.colors
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        in_stock: form.in_stock,
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
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Описание</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="w-full resize-none rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Цена (сум) *</label>
          <input
            name="price"
            type="number"
            min="0"
            value={form.price}
            onChange={handleChange}
            className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Старая цена</label>
          <input
            name="old_price"
            type="number"
            min="0"
            value={form.old_price}
            onChange={handleChange}
            placeholder="необязательно"
            className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Ссылка на фото *</label>
        <input
          name="image_url"
          value={form.image_url}
          onChange={handleChange}
          placeholder="https://..."
          className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Категория</label>
        <select
          name="category_id"
          value={form.category_id}
          onChange={handleChange}
          className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">Без категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">
          Размеры (через запятую)
        </label>
        <input
          name="sizes"
          value={form.sizes}
          onChange={handleChange}
          placeholder="40, 41, 42"
          className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">
          Цвета (через запятую)
        </label>
        <input
          name="colors"
          value={form.colors}
          onChange={handleChange}
          placeholder="Белый, Чёрный"
          className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Порядок сортировки
          </label>
          <input
            name="sort_order"
            type="number"
            value={form.sort_order}
            onChange={handleChange}
            className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm">
          <input
            type="checkbox"
            name="in_stock"
            checked={form.in_stock}
            onChange={handleChange}
            className="h-4 w-4 accent-accent"
          />
          В наличии
        </label>
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

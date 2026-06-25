import { useState } from 'react'

const UNIT_LABELS = {
  size: 'Размеры (через запятую)',
  weight: 'Варианты веса (через запятую, напр. 1кг, 5кг)',
  volume: 'Варианты объёма (через запятую, напр. 1л, 5л)',
}

const UNIT_PLACEHOLDERS = {
  size: 'S, M, L, XL',
  weight: '1кг, 5кг, 10кг, 25кг, 50кг',
  volume: '1л, 5л, 10л, 20л',
}

export default function ProductForm({ product, categories, unitType = 'size', onSave, onCancel }) {
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
  const [sizesStock, setSizesStock] = useState(product?.sizes_stock || {})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const sizesList = form.sizes
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleSizeStockChange(size, value) {
    setSizesStock((s) => ({ ...s, [size]: value }))
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
        price: parseFloat(String(form.price).replace(',', '.')),
        old_price: form.old_price ? parseFloat(String(form.old_price).replace(',', '.')) : null,
        image_url: form.image_url.trim(),
        category_id: form.category_id ? Number(form.category_id) : null,
        sizes: sizesList,
        colors: form.colors
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        sizes_stock: Object.fromEntries(
          sizesList.map((size) => [size, Math.max(0, Number(sizesStock[size]) || 0)])
        ),
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
          <label className="mb-1 block text-xs font-medium text-muted">Цена *</label>
          <input
            name="price"
            type="text"
            inputMode="decimal"
            value={form.price}
            onChange={(e) => {
              const value = e.target.value.replace(',', '.')
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setForm((f) => ({ ...f, price: value }))
              }
            }}
            className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Старая цена</label>
          <input
            name="old_price"
            type="text"
            inputMode="decimal"
            value={form.old_price}
            onChange={(e) => {
              const value = e.target.value.replace(',', '.')
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setForm((f) => ({ ...f, old_price: value }))
              }
            }}
            placeholder="необязательно"
            className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Ссылка на фото (URL) *</label>
        <input
          name="image_url"
          value={form.image_url}
          onChange={handleChange}
          placeholder="https://..."
          className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <p className="mt-1 text-xs text-muted">
          Используйте прямую ссылку на фото (Direct link с ImgBB).
          Пример: https://i.ibb.co/xxxxx/photo.jpg
        </p>
        {form.image_url.trim() && (
          <div className="mt-2 h-32 w-32 overflow-hidden rounded-xl bg-surface2">
            <img
              src={form.image_url.trim()}
              alt="Превью"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
              onLoad={(e) => {
                e.currentTarget.style.display = 'block'
              }}
            />
          </div>
        )}
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
      {unitType !== 'piece' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            {UNIT_LABELS[unitType] || UNIT_LABELS.size}
          </label>
          <input
            name="sizes"
            value={form.sizes}
            onChange={handleChange}
            placeholder={UNIT_PLACEHOLDERS[unitType] || UNIT_PLACEHOLDERS.size}
            className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      )}

      {unitType !== 'piece' && sizesList.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Количество по вариантам
          </label>
          <div className="flex flex-col gap-2 rounded-xl bg-surface2 p-3">
            {sizesList.map((size) => {
              const qty = Math.max(0, Number(sizesStock[size]) || 0)
              return (
                <div key={size} className="flex items-center justify-between gap-3">
                  <span className={`text-sm ${qty === 0 ? 'text-muted' : ''}`}>
                    {size}
                    {qty === 0 && <span className="ml-1.5 text-xs">— нет в наличии</span>}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={sizesStock[size] ?? 0}
                    onChange={(e) => handleSizeStockChange(size, e.target.value)}
                    className="w-20 rounded-lg bg-surface px-2 py-1.5 text-right text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              )
            })}
          </div>
          <p className="mt-1 text-xs text-muted">
            Если для всех вариантов указано 0, товар будет показан как «Нет в наличии»
          </p>
        </div>
      )}
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

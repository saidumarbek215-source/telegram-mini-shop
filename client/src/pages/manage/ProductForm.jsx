import { useState } from 'react'
import { useShop } from '../../context/ShopContext.jsx'
import { t } from '../../i18n.js'

export default function ProductForm({ product, categories, unitType = 'size', onSave, onCancel }) {
  const { lang } = useShop()
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
    is_bestseller: product?.is_bestseller ?? false,
    sort_order: product?.sort_order ?? 0,
    rating: product?.rating ?? '',
    review_count: product?.review_count ?? '',
  })
  const [sizesStock, setSizesStock] = useState(product?.sizes_stock || {})
  const [images, setImages] = useState(product?.images || [])
  const [variants, setVariants] = useState(product?.variants || [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const hasVariants = variants.length > 0

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

  // Images
  function addImage() {
    if (images.length < 5) setImages((imgs) => [...imgs, ''])
  }
  function updateImage(i, value) {
    setImages((imgs) => imgs.map((img, idx) => (idx === i ? value : img)))
  }
  function removeImage(i) {
    setImages((imgs) => imgs.filter((_, idx) => idx !== i))
  }

  // Variants
  function addVariant() {
    setVariants((v) => [...v, { label: '', price: '', old_price: '', in_stock: true }])
  }
  function updateVariant(i, field, value) {
    setVariants((v) => v.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)))
  }
  function removeVariant(i) {
    setVariants((v) => v.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || (!hasVariants && !form.price) || !form.image_url.trim()) {
      setError(t('fillNamePricePhoto', lang))
      return
    }
    setError('')
    setSaving(true)
    try {
      const effectivePrice = hasVariants
        ? Math.min(...variants.map((v) => Number(v.price) || 0))
        : parseFloat(String(form.price).replace(',', '.'))

      await onSave({
        name: form.name.trim(),
        description: form.description.trim(),
        price: effectivePrice,
        old_price: !hasVariants && form.old_price
          ? parseFloat(String(form.old_price).replace(',', '.'))
          : null,
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
        is_bestseller: form.is_bestseller,
        sort_order: Number(form.sort_order) || 0,
        rating: form.rating !== '' ? parseFloat(String(form.rating).replace(',', '.')) : null,
        review_count: form.review_count !== '' ? Number(form.review_count) : 0,
        images: images.filter(Boolean),
        variants: variants.map((v) => ({
          label: v.label,
          price: Number(v.price) || 0,
          old_price: v.old_price ? Number(v.old_price) : null,
          in_stock: v.in_stock !== false,
        })),
      })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const unitLabels = {
    size: t('sizesLabel', lang),
    weight: t('weightLabel', lang),
    volume: t('volumeLabel', lang),
  }

  const unitPlaceholders = {
    size: 'S, M, L, XL',
    weight: '1кг, 5кг, 10кг, 25кг, 50кг',
    volume: '1л, 5л, 10л, 20л',
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">{t('productName', lang)} *</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">{t('productDesc', lang)}</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="w-full resize-none rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Main price — hidden when variants are used */}
      {!hasVariants && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">{t('price', lang)} *</label>
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
            <label className="mb-1 block text-xs font-medium text-muted">{t('oldPrice', lang)}</label>
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
              placeholder={t('optional', lang)}
              className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">{t('photoUrl', lang)} *</label>
        <input
          name="image_url"
          value={form.image_url}
          onChange={handleChange}
          placeholder="https://..."
          className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <p className="mt-1 text-xs text-muted">{t('photoHint', lang)}</p>
        {form.image_url.trim() && (
          <div className="mt-2 h-32 w-32 overflow-hidden rounded-xl bg-surface2">
            <img
              src={form.image_url.trim()}
              alt={t('preview', lang)}
              className="h-full w-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
              onLoad={(e) => { e.currentTarget.style.display = 'block' }}
            />
          </div>
        )}
      </div>

      {/* Additional photos */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-medium text-muted">Дополнительные фото</label>
          {images.length < 5 && (
            <button
              type="button"
              onClick={addImage}
              className="text-xs font-medium text-accent"
            >
              + Добавить фото
            </button>
          )}
        </div>
        {images.length > 0 && (
          <div className="flex flex-col gap-2 rounded-xl bg-surface2 p-3">
            {images.map((img, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={img}
                  onChange={(e) => updateImage(i, e.target.value)}
                  placeholder="https://..."
                  className="min-w-0 flex-1 rounded-lg bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
                {img.trim() && (
                  <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg bg-surface">
                    <img
                      src={img.trim()}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                      onLoad={(e) => { e.currentTarget.style.display = 'block' }}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="flex-shrink-0 text-sm text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        {images.length === 0 && (
          <p className="text-xs text-muted">До 5 дополнительных фото</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">{t('category', lang)}</label>
        <select
          name="category_id"
          value={form.category_id}
          onChange={handleChange}
          className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">{t('noCategory', lang)}</option>
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
            {unitLabels[unitType] || unitLabels.size}
          </label>
          <input
            name="sizes"
            value={form.sizes}
            onChange={handleChange}
            placeholder={unitPlaceholders[unitType] || unitPlaceholders.size}
            className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      )}

      {unitType !== 'piece' && sizesList.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            {t('sortByVariants', lang)}
          </label>
          <div className="flex flex-col gap-2 rounded-xl bg-surface2 p-3">
            {sizesList.map((size) => {
              const qty = Math.max(0, Number(sizesStock[size]) || 0)
              return (
                <div key={size} className="flex items-center justify-between gap-3">
                  <span className={`text-sm ${qty === 0 ? 'text-muted' : ''}`}>
                    {size}
                    {qty === 0 && <span className="ml-1.5 text-xs">{t('noInStock', lang)}</span>}
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
          <p className="mt-1 text-xs text-muted">{t('stockZeroHint', lang)}</p>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">
          {t('colorsLabel', lang)}
        </label>
        <input
          name="colors"
          value={form.colors}
          onChange={handleChange}
          placeholder="Белый, Чёрный"
          className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Variants with prices */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-medium text-muted">Варианты с ценами</label>
          <button
            type="button"
            onClick={addVariant}
            className="text-xs font-medium text-accent"
          >
            + Добавить вариант
          </button>
        </div>
        {hasVariants ? (
          <div className="flex flex-col gap-2 rounded-xl bg-surface2 p-3">
            {variants.map((v, i) => (
              <div key={i} className="rounded-lg bg-surface p-2.5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={v.label}
                    onChange={(e) => updateVariant(i, 'label', e.target.value)}
                    placeholder="S, M, L или 1л, 5л..."
                    className="flex-1 rounded-lg bg-surface2 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="flex-shrink-0 text-sm text-red-400"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-0.5 block text-xs text-muted">{t('price', lang)} *</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={v.price}
                      onChange={(e) => {
                        const val = e.target.value.replace(',', '.')
                        if (val === '' || /^\d*\.?\d*$/.test(val)) updateVariant(i, 'price', val)
                      }}
                      className="w-full rounded-lg bg-surface2 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-xs text-muted">{t('oldPrice', lang)}</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={v.old_price}
                      onChange={(e) => {
                        const val = e.target.value.replace(',', '.')
                        if (val === '' || /^\d*\.?\d*$/.test(val)) updateVariant(i, 'old_price', val)
                      }}
                      placeholder={t('optional', lang)}
                      className="w-full rounded-lg bg-surface2 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={v.in_stock !== false}
                    onChange={(e) => updateVariant(i, 'in_stock', e.target.checked)}
                    className="h-4 w-4 accent-accent"
                  />
                  {t('inStockToggle', lang)}
                </label>
              </div>
            ))}
            <p className="text-xs text-muted">Если заданы варианты, основная цена скрыта</p>
          </div>
        ) : (
          <p className="text-xs text-muted">Варианты позволяют задать разные цены (S/M/L, 1л/5л и т.д.)</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            {t('productSortOrder', lang)}
          </label>
          <input
            name="sort_order"
            type="number"
            value={form.sort_order}
            onChange={handleChange}
            className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="flex flex-col gap-2 self-end pb-2.5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="in_stock"
              checked={form.in_stock}
              onChange={handleChange}
              className="h-4 w-4 accent-accent"
            />
            {t('inStockToggle', lang)}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_bestseller"
              checked={form.is_bestseller}
              onChange={handleChange}
              className="h-4 w-4 accent-accent"
            />
            🔥 Топ продаж
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">⭐ Рейтинг (1–5)</label>
          <input
            name="rating"
            type="number"
            min="1"
            max="5"
            step="0.1"
            value={form.rating}
            onChange={handleChange}
            placeholder="4.8"
            className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Кол-во отзывов</label>
          <input
            name="review_count"
            type="number"
            min="0"
            step="1"
            value={form.review_count}
            onChange={handleChange}
            placeholder="128"
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
          {t('cancel', lang)}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-2xl bg-accent py-3 text-sm font-bold text-bg disabled:opacity-60"
        >
          {saving ? t('savingText', lang) : t('save', lang)}
        </button>
      </div>
    </form>
  )
}

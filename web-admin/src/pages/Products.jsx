import { useEffect, useState, useCallback } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories } from '../api.js'
import ImageUpload from '../components/ImageUpload.jsx'

const EMPTY = {
  name: '', description: '', price: '', old_price: '',
  image_url: '', category_id: '', in_stock: true, is_bestseller: false,
  sort_order: 0, sizes: '', colors: '', images: [], variants: [],
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 mt-5 first:mt-0">{children}</p>
}

function ProductForm({ initial, categories, onSave, onCancel, loading }) {
  const [form, setForm] = useState(() => initial
    ? {
        ...initial,
        sizes: (initial.sizes || []).join(', '),
        colors: (initial.colors || []).join(', '),
        images: initial.images || [],
        variants: initial.variants || [],
      }
    : EMPTY
  )
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Sizes stock
  const [sizesStock, setSizesStock] = useState(initial?.sizes_stock || {})
  const sizesList = form.sizes.split(',').map(s => s.trim()).filter(Boolean)

  // Images
  const addImage = () => { if (form.images.length < 5) set('images', [...form.images, '']) }
  const updateImage = (i, v) => set('images', form.images.map((img, idx) => idx === i ? v : img))
  const removeImage = (i) => set('images', form.images.filter((_, idx) => idx !== i))

  // Variants
  const addVariant = () => set('variants', [...form.variants, { label: '', price: '', old_price: '', in_stock: true }])
  const updateVariant = (i, field, v) => set('variants', form.variants.map((item, idx) => idx === i ? { ...item, [field]: v } : item))
  const removeVariant = (i) => set('variants', form.variants.filter((_, idx) => idx !== i))

  const hasVariants = form.variants.length > 0

  function handleSubmit(e) {
    e.preventDefault()
    const effectivePrice = hasVariants
      ? Math.min(...form.variants.map(v => Number(v.price) || 0))
      : parseFloat(String(form.price).replace(',', '.'))

    onSave({
      name: form.name.trim(),
      description: form.description.trim(),
      price: effectivePrice,
      old_price: !hasVariants && form.old_price ? parseFloat(String(form.old_price).replace(',', '.')) : null,
      image_url: form.image_url.trim(),
      category_id: form.category_id ? Number(form.category_id) : null,
      sizes: sizesList,
      colors: form.colors.split(',').map(s => s.trim()).filter(Boolean),
      sizes_stock: Object.fromEntries(sizesList.map(s => [s, Number(sizesStock[s]) || 0])),
      in_stock: form.in_stock,
      is_bestseller: form.is_bestseller,
      sort_order: Number(form.sort_order) || 0,
      images: form.images.filter(Boolean),
      variants: form.variants.map(v => ({
        label: v.label,
        price: Number(v.price) || 0,
        old_price: v.old_price ? Number(v.old_price) : null,
        in_stock: v.in_stock,
      })),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* Basic info */}
      <SectionTitle>Asosiy ma'lumot</SectionTitle>
      <div>
        <label className="label">Nomi *</label>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="iPhone 15 Pro" />
      </div>
      <div>
        <label className="label">Tavsif</label>
        <textarea className="input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Mahsulot haqida..." />
      </div>
      <div>
        <label className="label">Kategoriya</label>
        <select className="input" value={form.category_id || ''} onChange={e => set('category_id', e.target.value)}>
          <option value="">— Kategoriyasiz —</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Price */}
      <SectionTitle>Narx</SectionTitle>
      {!hasVariants ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Narxi *</label>
            <input className="input" type="number" value={form.price} onChange={e => set('price', e.target.value)} required={!hasVariants} placeholder="500000" />
          </div>
          <div>
            <label className="label">Eski narxi (chegirma)</label>
            <input className="input" type="number" value={form.old_price} onChange={e => set('old_price', e.target.value)} placeholder="700000" />
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">Narx variantlardan avtomatik belgilanadi</p>
      )}

      {/* Variants */}
      <SectionTitle>Narx variantlari (ixtiyoriy)</SectionTitle>
      <div className="space-y-2">
        {form.variants.map((v, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-200">
            <div className="flex items-center gap-2">
              <input className="input flex-1 text-sm" placeholder="64GB / Qora..." value={v.label} onChange={e => updateVariant(i, 'label', e.target.value)} />
              <button type="button" onClick={() => removeVariant(i)} className="text-red-500 hover:text-red-700 p-1">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input className="input text-sm" type="number" placeholder="Narxi" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} />
              <input className="input text-sm" type="number" placeholder="Eski narxi" value={v.old_price} onChange={e => updateVariant(i, 'old_price', e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="accent-yellow-400" checked={v.in_stock} onChange={e => updateVariant(i, 'in_stock', e.target.checked)} />
              Mavjud
            </label>
          </div>
        ))}
        <button type="button" onClick={addVariant} className="w-full text-sm text-yellow-600 border border-dashed border-yellow-300 hover:border-yellow-500 rounded-xl py-2 transition-colors">
          + Variant qo'shish
        </button>
      </div>

      {/* Main photo */}
      <SectionTitle>Asosiy rasm *</SectionTitle>
      <ImageUpload
        value={form.image_url}
        onChange={v => set('image_url', v)}
        placeholder="https://..."
      />

      {/* Extra images */}
      <SectionTitle>Qo'shimcha rasmlar (max 5)</SectionTitle>
      <div className="space-y-2">
        {form.images.map((img, i) => (
          <div key={i} className="flex items-center gap-2">
            <ImageUpload
              value={img}
              onChange={v => updateImage(i, v)}
              placeholder="https://..."
            />
            <button type="button" onClick={() => removeImage(i)} className="text-red-500 hover:text-red-700 p-1 flex-shrink-0 self-start mt-2">✕</button>
          </div>
        ))}
        {form.images.length < 5 && (
          <button type="button" onClick={addImage} className="w-full text-sm text-yellow-600 border border-dashed border-yellow-300 hover:border-yellow-500 rounded-xl py-2 transition-colors">
            + Rasm qo'shish
          </button>
        )}
      </div>

      {/* Sizes */}
      <SectionTitle>O'lchamlar (vergul bilan)</SectionTitle>
      <div>
        <input className="input" value={form.sizes} onChange={e => set('sizes', e.target.value)} placeholder="S, M, L, XL  yoki  128GB, 256GB" />
      </div>
      {sizesList.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-gray-500">Har bir o'lcham uchun sklad:</p>
          {sizesList.map(size => (
            <div key={size} className="flex items-center gap-3">
              <span className="w-20 text-sm font-medium text-gray-700">{size}</span>
              <input
                className="input w-28 text-sm"
                type="number" min="0"
                placeholder="0"
                value={sizesStock[size] || ''}
                onChange={e => setSizesStock(s => ({ ...s, [size]: e.target.value }))}
              />
              <span className="text-xs text-gray-400">dona</span>
            </div>
          ))}
        </div>
      )}

      {/* Colors */}
      <SectionTitle>Ranglar (vergul bilan)</SectionTitle>
      <input className="input" value={form.colors} onChange={e => set('colors', e.target.value)} placeholder="Qora, Oq, Ko'k" />

      {/* Flags */}
      <SectionTitle>Qo'shimcha</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tartib raqami</label>
          <input className="input" type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
        </div>
        <div className="flex flex-col gap-2 justify-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-yellow-400" checked={form.in_stock} onChange={e => set('in_stock', e.target.checked)} />
            <span className="text-sm font-medium text-gray-700">Mavjud (stokda bor)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-yellow-400" checked={form.is_bestseller} onChange={e => set('is_bestseller', e.target.checked)} />
            <span className="text-sm font-medium text-gray-700">⭐ Bestseller</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">Bekor</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
          {loading ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </div>
    </form>
  )
}

export default function Products() {
  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [modal,      setModal]      = useState(null)
  const [search,     setSearch]     = useState('')
  const [catFilter,  setCatFilter]  = useState('')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([getProducts(), getCategories()])
      .then(([p, c]) => { setProducts(p); setCategories(c) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(data) {
    setSaving(true)
    try {
      if (modal === 'create') await createProduct(data)
      else await updateProduct(modal.id, data)
      setModal(null)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`"${name}" o'chirilsinmi?`)) return
    try { await deleteProduct(id); load() }
    catch (err) { alert(err.message) }
  }

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat    = !catFilter || String(p.category_id) === catFilter
    return matchSearch && matchCat
  })

  function catName(id) { return categories.find(c => c.id === id)?.name || '—' }
  function fmt(n) { return Number(n).toLocaleString('ru-RU') }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Mahsulotlar</h1>
          <p className="text-sm text-gray-500">{products.length} ta mahsulot</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2">
          <span className="text-lg">+</span> Qo'shish
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <input className="input flex-1 min-w-48" placeholder="🔍 Qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input w-48" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">Barcha kategoriyalar</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th className="px-4 py-3 font-semibold">Mahsulot</th>
                <th className="px-4 py-3 font-semibold">Narx</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Kategoriya</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Holat</th>
                <th className="px-4 py-3 font-semibold text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array.from({length: 5}).map((_, i) => (
                    <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
                  ))
                : filtered.length === 0
                  ? <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Mahsulotlar topilmadi</td></tr>
                  : filtered.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                            {p.image_url
                              ? <img src={p.image_url} alt={p.name} className="w-full h-full object-contain p-1" />
                              : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                            }
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 line-clamp-1">
                              {p.is_bestseller && <span className="text-yellow-500 mr-1">⭐</span>}
                              {p.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              #{p.id}
                              {p.variants?.length > 0 && <span className="ml-1.5 text-blue-500">{p.variants.length} variant</span>}
                              {p.images?.length > 0 && <span className="ml-1.5 text-purple-500">{p.images.length} rasm</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900">{fmt(p.price)} so'm</p>
                        {p.old_price && Number(p.old_price) > Number(p.price) && (
                          <p className="text-xs text-red-500 line-through">{fmt(p.old_price)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-500">{catName(p.category_id)}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`badge ${p.in_stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {p.in_stock ? 'Mavjud' : 'Tugagan'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setModal(p)} className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                            Tahrirlash
                          </button>
                          <button onClick={() => handleDelete(p.id, p.name)} className="px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">
                            O'chirish
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal
          title={modal === 'create' ? 'Yangi mahsulot' : `Tahrirlash: ${modal.name}`}
          onClose={() => setModal(null)}
        >
          <ProductForm
            initial={modal === 'create' ? null : modal}
            categories={categories}
            onSave={handleSave}
            onCancel={() => setModal(null)}
            loading={saving}
          />
        </Modal>
      )}
    </div>
  )
}

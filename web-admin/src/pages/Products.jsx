import { useEffect, useState, useCallback } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories } from '../api.js'

const EMPTY = {
  name: '', description: '', price: '', old_price: '',
  image_url: '', category_id: '', in_stock: true, sort_order: 0,
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
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

function ProductForm({ initial, categories, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || EMPTY)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      ...form,
      price: parseFloat(form.price),
      old_price: form.old_price ? parseFloat(form.old_price) : null,
      category_id: form.category_id || null,
      sort_order: Number(form.sort_order) || 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nomi *</label>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="iPhone 15 Pro" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Narxi *</label>
          <input className="input" type="number" value={form.price} onChange={e => set('price', e.target.value)} required placeholder="500000" />
        </div>
        <div>
          <label className="label">Eski narxi</label>
          <input className="input" type="number" value={form.old_price} onChange={e => set('old_price', e.target.value)} placeholder="700000" />
        </div>
      </div>
      <div>
        <label className="label">Rasm URL *</label>
        <input className="input" value={form.image_url} onChange={e => set('image_url', e.target.value)} required placeholder="https://..." />
        {form.image_url && (
          <img src={form.image_url} alt="" className="mt-2 w-20 h-20 object-contain rounded-lg border border-gray-200 bg-gray-50" onError={e => e.target.style.display='none'} />
        )}
      </div>
      <div>
        <label className="label">Kategoriya</label>
        <select className="input" value={form.category_id || ''} onChange={e => set('category_id', e.target.value)}>
          <option value="">— Kategoriyasiz —</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Tavsif</label>
        <textarea className="input resize-none" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Mahsulot haqida..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tartib raqami</label>
          <input className="input" type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-yellow-400" checked={form.in_stock} onChange={e => set('in_stock', e.target.checked)} />
            <span className="text-sm font-medium text-gray-700">Mavjud</span>
          </label>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
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
  const [modal,      setModal]      = useState(null) // null | 'create' | product_obj
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
      if (modal === 'create') {
        await createProduct(data)
      } else {
        await updateProduct(modal.id, data)
      }
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
    try {
      await deleteProduct(id)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat    = !catFilter || String(p.category_id) === catFilter
    return matchSearch && matchCat
  })

  function catName(id) {
    return categories.find(c => c.id === id)?.name || '—'
  }

  function fmt(n) { return Number(n).toLocaleString('ru-RU') }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Mahsulotlar</h1>
          <p className="text-sm text-gray-500">{products.length} ta mahsulot</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2">
          <span className="text-lg">+</span> Qo'shish
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          className="input flex-1 min-w-48"
          placeholder="🔍 Qidirish..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input w-48" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">Barcha kategoriyalar</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
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
              {loading ? (
                Array.from({length: 5}).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Mahsulotlar topilmadi</td></tr>
              ) : filtered.map(p => (
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
                        <p className="font-semibold text-gray-900 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-gray-400">#{p.id}</p>
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
                      <button
                        onClick={() => setModal(p)}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      >
                        Tahrirlash
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      >
                        O'chirish
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
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

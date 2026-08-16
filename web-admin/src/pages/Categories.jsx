import { useEffect, useState, useCallback } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api.js'
import ImageUpload from '../components/ImageUpload.jsx'

const EMPTY = { name: '', icon: '', image_url: '', sort_order: 0 }

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
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

export default function Categories() {
  const [cats,    setCats]    = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [modal,   setModal]   = useState(null)
  const [form,    setForm]    = useState(EMPTY)

  const load = useCallback(() => {
    setLoading(true)
    getCategories().then(setCats).catch(console.error).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() { setForm(EMPTY); setModal('create') }
  function openEdit(c)  { setForm({ name: c.name, icon: c.icon || '', image_url: c.image_url || '', sort_order: c.sort_order || 0 }); setModal(c) }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal === 'create') await createCategory(form)
      else await updateCategory(modal.id, form)
      setModal(null)
      load()
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id, name) {
    if (!confirm(`"${name}" o'chirilsinmi?`)) return
    try { await deleteCategory(id); load() } catch (err) { alert(err.message) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Kategoriyalar</h1>
          <p className="text-sm text-gray-500">{cats.length} ta kategoriya</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <span>+</span> Qo'shish
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th className="px-4 py-3 font-semibold">Kategoriya</th>
                <th className="px-4 py-3 font-semibold">Rasm</th>
                <th className="px-4 py-3 font-semibold">Tartib</th>
                <th className="px-4 py-3 font-semibold text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({length:4}).map((_,i) => (
                  <tr key={i}><td colSpan={4} className="px-4 py-3"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : cats.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-400">Kategoriyalar yo'q</td></tr>
              ) : cats.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{c.icon || '📦'}</span>
                      <span className="font-semibold text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.image_url
                      ? <img src={c.image_url} alt="" className="w-10 h-10 object-contain rounded-lg bg-gray-100 p-1" />
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => openEdit(c)} className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">Tahrirlash</button>
                      <button onClick={() => handleDelete(c.id, c.name)} className="px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg">O'chirish</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'Yangi kategoriya' : `Tahrirlash: ${modal.name}`} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Nomi *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Telefonlar" />
            </div>
            <div>
              <label className="label">Emoji ikonka</label>
              <input className="input" value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="📱" />
            </div>
            <div>
              <label className="label">Rasm URL</label>
              <ImageUpload
                value={form.image_url}
                onChange={v => set('image_url', v)}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="label">Tartib raqami</label>
              <input className="input" type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setModal(null)} className="btn-ghost flex-1">Bekor</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

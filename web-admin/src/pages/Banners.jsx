import { useEffect, useState, useCallback } from 'react'
import { getBanners, createBanner, updateBanner, deleteBanner } from '../api.js'
import ImageUpload from '../components/ImageUpload.jsx'

const EMPTY = { image_url: '', title: '', subtitle: '', sort_order: 0, active: true }

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
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

export default function Banners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [modal,   setModal]   = useState(null)
  const [form,    setForm]    = useState(EMPTY)

  const load = useCallback(() => {
    setLoading(true)
    getBanners().then(setBanners).catch(console.error).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() { setForm(EMPTY); setModal('create') }
  function openEdit(b)  { setForm({ image_url: b.image_url, title: b.title || '', subtitle: b.subtitle || '', sort_order: b.sort_order || 0, active: b.active ?? true }); setModal(b) }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal === 'create') await createBanner(form)
      else await updateBanner(modal.id, form)
      setModal(null); load()
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm("Bannerni o'chirishni istaysizmi?")) return
    try { await deleteBanner(id); load() } catch (err) { alert(err.message) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Bannerlar</h1>
          <p className="text-sm text-gray-500">{banners.length} ta banner</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <span>+</span> Qo'shish
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="card h-40 animate-pulse bg-gray-100" />)}
        </div>
      ) : banners.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🖼️</p>
          <p>Bannerlar yo'q. Birinchi bannerni qo'shing!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {banners.map(b => (
            <div key={b.id} className={`card overflow-hidden ${!b.active ? 'opacity-60' : ''}`}>
              <div className="aspect-[3/1] bg-gray-100 overflow-hidden">
                <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" onError={e => { e.target.style.display='none' }} />
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {b.title && <p className="font-semibold text-sm">{b.title}</p>}
                    {b.subtitle && <p className="text-xs text-gray-500">{b.subtitle}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge text-xs ${b.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {b.active ? 'Aktiv' : 'Nofaol'}
                      </span>
                      <span className="text-xs text-gray-400">Tartib: {b.sort_order}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => openEdit(b)} className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Tahrirlash</button>
                    <button onClick={() => handleDelete(b.id)} className="px-2.5 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium">O'chirish</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'create' ? 'Yangi banner' : 'Bannerni tahrirlash'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Rasm URL *</label>
              <ImageUpload
                value={form.image_url}
                onChange={v => set('image_url', v)}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="label">Sarlavha</label>
              <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Yangi kolleksiya" />
            </div>
            <div>
              <label className="label">Kichik sarlavha</label>
              <input className="input" value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Chegirmalar..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Tartib raqami</label>
                <input className="input" type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-yellow-400" checked={form.active} onChange={e => set('active', e.target.checked)} />
                  <span className="text-sm font-medium">Aktiv</span>
                </label>
              </div>
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

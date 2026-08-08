import { useEffect, useState } from 'react'
import { adminApi } from '../../api.js'
import Modal from '../../components/Modal.jsx'
import { PencilIcon, TrashIcon, PlusIcon } from '../../components/Icons.jsx'
import { useShop } from '../../context/ShopContext.jsx'
import { t } from '../../i18n.js'

function CategoryForm({ category, onSave, onCancel, lang }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    icon: category?.icon || '',
    image_url: category?.image_url || '',
    sort_order: category?.sort_order ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const { full_url } = await adminApi.uploadImage(file)
      setForm((f) => ({ ...f, image_url: full_url }))
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError(t('enterName', lang))
      return
    }
    setError('')
    setSaving(true)
    try {
      await onSave({
        name: form.name.trim(),
        icon: form.icon.trim(),
        image_url: form.image_url.trim() || null,
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
        <label className="mb-1 block text-xs font-medium text-muted">{t('productName', lang)} *</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">{t('iconEmoji', lang)}</label>
          <input
            name="icon"
            value={form.icon}
            onChange={handleChange}
            className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">{t('sortOrder', lang)}</label>
          <input
            name="sort_order"
            type="number"
            value={form.sort_order}
            onChange={handleChange}
            className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Фото категории</label>
        <div className="flex gap-2">
          <input
            name="image_url"
            value={form.image_url}
            onChange={handleChange}
            placeholder="https://..."
            disabled={uploading}
            className="min-w-0 flex-1 rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
          />
          <label className={`flex cursor-pointer items-center whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-medium transition-opacity ${uploading ? 'cursor-not-allowed bg-surface2 text-muted opacity-60' : 'bg-accent text-bg'}`}>
            {uploading ? '...' : 'Загрузить'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
        {uploadError && <p className="mt-1 text-xs text-red-400">{uploadError}</p>}
        {form.image_url.trim() && (
          <div className="mt-2 h-12 w-12 overflow-hidden rounded-xl bg-surface2">
            <img
              src={form.image_url.trim()}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
              onLoad={(e) => { e.currentTarget.style.display = 'block' }}
            />
          </div>
        )}
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

export default function ManageCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const { lang } = useShop()

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
    if (!confirm(t('deleteCategory', lang))) return
    await adminApi.deleteCategory(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  if (loading) return <div className="py-10 text-center text-sm text-muted">{t('loading', lang)}</div>

  return (
    <div className="pb-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold">{t('manageCategories', lang)} ({categories.length})</h2>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-bg"
        >
          <PlusIcon className="h-4 w-4" /> {t('addProduct', lang)}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
            {(cat.image_url || cat.icon) && (
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface2 text-2xl">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  cat.icon
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{cat.name}</p>
              <p className="text-xs text-muted">{t('sortOrder', lang)}: {cat.sort_order}</p>
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
          <p className="py-10 text-center text-sm text-muted">{t('noCategories', lang)}</p>
        )}
      </div>

      {editing && (
        <Modal
          title={editing === 'new' ? t('newCategory', lang) : t('editCategory', lang)}
          onClose={() => setEditing(null)}
        >
          <CategoryForm
            category={editing === 'new' ? null : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            lang={lang}
          />
        </Modal>
      )}
    </div>
  )
}

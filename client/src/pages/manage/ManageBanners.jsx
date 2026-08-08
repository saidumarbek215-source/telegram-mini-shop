import { useEffect, useState } from 'react'
import { adminApi } from '../../api.js'
import Modal from '../../components/Modal.jsx'
import { PencilIcon, TrashIcon, PlusIcon } from '../../components/Icons.jsx'
import { useShop } from '../../context/ShopContext.jsx'
import { t } from '../../i18n.js'

function BannerForm({ banner, onSave, onCancel, lang }) {
  const [form, setForm] = useState({
    image_url: banner?.image_url || '',
    title: banner?.title || '',
    subtitle: banner?.subtitle || '',
    sort_order: banner?.sort_order ?? 0,
    active: banner?.active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
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
    if (!form.image_url.trim()) {
      setError(t('enterImageUrl', lang))
      return
    }
    setError('')
    setSaving(true)
    try {
      await onSave({
        image_url: form.image_url.trim(),
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        sort_order: Number(form.sort_order) || 0,
        active: form.active,
      })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">
          {t('imageUrlRequired', lang)}
        </label>
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
          <div className="mt-2 h-20 w-32 overflow-hidden rounded-xl bg-surface2">
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
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">{t('bannerTitle', lang)}</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">{t('bannerSubtitle', lang)}</label>
        <input
          name="subtitle"
          value={form.subtitle}
          onChange={handleChange}
          className="w-full rounded-xl bg-surface2 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
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
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm">
          <input
            type="checkbox"
            name="active"
            checked={form.active}
            onChange={handleChange}
            className="h-4 w-4 accent-accent"
          />
          {t('activeLabel', lang)}
        </label>
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

export default function ManageBanners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const { lang } = useShop()

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    adminApi
      .getBanners()
      .then(setBanners)
      .finally(() => setLoading(false))
  }

  async function handleSave(data) {
    if (editing === 'new') {
      const created = await adminApi.createBanner(data)
      setBanners((prev) => [...prev, created])
    } else {
      const updated = await adminApi.updateBanner(editing.id, data)
      setBanners((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
    }
    setEditing(null)
  }

  async function handleDelete(id) {
    if (!confirm(t('deleteBanner', lang))) return
    await adminApi.deleteBanner(id)
    setBanners((prev) => prev.filter((b) => b.id !== id))
  }

  if (loading) return <div className="py-10 text-center text-sm text-muted">{t('loading', lang)}</div>

  return (
    <div className="pb-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold">{t('manageBanners', lang)} ({banners.length})</h2>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-bg"
        >
          <PlusIcon className="h-4 w-4" /> {t('addProduct', lang)}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {banners.map((banner) => (
          <div key={banner.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
            <div className="h-14 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-surface2">
              <img
                src={banner.image_url}
                alt={banner.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{banner.title || `— ${t('bannerTitle', lang)}`}</p>
              <p className="truncate text-xs text-muted">{banner.subtitle}</p>
              {!banner.active && (
                <span className="mt-1 inline-block rounded-full bg-surface2 px-2 py-0.5 text-[10px] text-muted">
                  {t('hiddenLabel', lang)}
                </span>
              )}
            </div>
            <div className="flex flex-shrink-0 gap-2">
              <button
                onClick={() => setEditing(banner)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface2 text-white"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(banner.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface2 text-red-400"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">{t('noBanners', lang)}</p>
        )}
      </div>

      {editing && (
        <Modal
          title={editing === 'new' ? t('newBanner', lang) : t('editBanner', lang)}
          onClose={() => setEditing(null)}
        >
          <BannerForm
            banner={editing === 'new' ? null : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            lang={lang}
          />
        </Modal>
      )}
    </div>
  )
}

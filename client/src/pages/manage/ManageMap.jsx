import { useEffect, useRef, useState } from 'react'
import { adminApi } from '../../api.js'

const TASHKENT = [41.2995, 69.2401]
const EMPTY_FORM = { name: '', phone: '', address: '', status: 'active', latitude: null, longitude: null }

function makeIcon(active) {
  const color = active ? '#22c55e' : '#ef4444'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 8 12 20 12 20S24 20 24 12C24 5.373 18.627 0 12 0z" fill="${color}"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`
  return window.L.divIcon({
    html: svg,
    className: '',
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32],
  })
}

export default function ManageMap() {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [picking, setPicking] = useState(false)

  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const pickMarkerRef = useRef(null)
  const pickHandlerRef = useRef(null)

  useEffect(() => {
    adminApi.getPartners().then((data) => {
      setPartners(data)
      setLoading(false)
    })
  }, [])

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    const L = window.L
    const map = L.map(mapRef.current, { zoomControl: true }).setView(TASHKENT, 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map)
    mapInstanceRef.current = map
  }, [loading])

  // Update partner markers
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    const L = window.L

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    partners.forEach((p) => {
      if (p.latitude == null || p.longitude == null) return
      const marker = L.marker([p.latitude, p.longitude], { icon: makeIcon(p.status === 'active') })
        .addTo(map)
        .bindPopup(`<b>${p.name}</b>${p.phone ? `<br>${p.phone}` : ''}`)
      markersRef.current.push(marker)
    })
  }, [partners, loading])

  // Picking mode: click on map to set coordinates
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    const L = window.L

    if (pickHandlerRef.current) {
      map.off('click', pickHandlerRef.current)
      pickHandlerRef.current = null
    }

    if (!picking) {
      map.getContainer().style.cursor = ''
      return
    }

    map.getContainer().style.cursor = 'crosshair'
    const handler = (e) => {
      const { lat, lng } = e.latlng
      setForm((f) => ({ ...f, latitude: lat, longitude: lng }))
      setPicking(false)
      map.getContainer().style.cursor = ''

      if (pickMarkerRef.current) pickMarkerRef.current.remove()
      pickMarkerRef.current = L.circleMarker([lat, lng], {
        radius: 8, color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.8,
      }).addTo(map).bindPopup('Новая точка').openPopup()
    }
    map.on('click', handler)
    pickHandlerRef.current = handler
  }, [picking])

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setPicking(false)
    if (pickMarkerRef.current) { pickMarkerRef.current.remove(); pickMarkerRef.current = null }
    setShowForm(true)
  }

  function openEdit(partner) {
    setForm({
      name: partner.name,
      phone: partner.phone || '',
      address: partner.address || '',
      status: partner.status || 'active',
      latitude: partner.latitude ?? null,
      longitude: partner.longitude ?? null,
    })
    setEditingId(partner.id)
    setPicking(false)
    setShowForm(true)

    if (partner.latitude != null && mapInstanceRef.current) {
      mapInstanceRef.current.setView([partner.latitude, partner.longitude], 14)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        const updated = await adminApi.updatePartner(editingId, form)
        setPartners((prev) => prev.map((p) => (p.id === editingId ? updated : p)))
      } else {
        const created = await adminApi.createPartner(form)
        setPartners((prev) => [created, ...prev])
      }
      setShowForm(false)
      if (pickMarkerRef.current) { pickMarkerRef.current.remove(); pickMarkerRef.current = null }
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(partner) {
    const newStatus = partner.status === 'active' ? 'inactive' : 'active'
    const updated = await adminApi.updatePartner(partner.id, { ...partner, status: newStatus })
    setPartners((prev) => prev.map((p) => (p.id === partner.id ? updated : p)))
  }

  async function handleDelete(id) {
    await adminApi.deletePartner(id)
    setPartners((prev) => prev.filter((p) => p.id !== id))
  }

  function flyTo(partner) {
    if (partner.latitude != null && mapInstanceRef.current) {
      mapInstanceRef.current.setView([partner.latitude, partner.longitude], 15)
    }
  }

  if (loading) return <div className="py-10 text-center text-sm text-muted">Загрузка...</div>

  return (
    <div className="pb-6">
      <div className="mb-3 flex items-center justify-between pt-2">
        <h2 className="text-base font-semibold">Магазины-партнёры</h2>
        <button
          onClick={openAdd}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-bg"
        >
          + Добавить
        </button>
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        className="rounded-2xl overflow-hidden mb-4"
        style={{ height: 280, zIndex: 0 }}
      />

      {picking && (
        <p className="text-center text-xs text-accent mb-3 -mt-2">
          Нажмите на карту, чтобы выбрать точку
        </p>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="mb-4 rounded-2xl bg-surface p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold">{editingId ? 'Редактировать' : 'Новый магазин'}</p>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Название *"
            className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            required
          />
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Телефон"
            type="tel"
            className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <div className="flex gap-2">
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Адрес"
              className="flex-1 rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              type="button"
              onClick={() => setPicking((p) => !p)}
              className={`flex-shrink-0 rounded-xl px-3 py-2.5 text-xs font-medium ${
                picking ? 'bg-accent text-bg' : 'bg-bg text-muted'
              }`}
            >
              🗺 На карте
            </button>
          </div>
          {form.latitude != null && (
            <p className="text-xs text-muted -mt-1">
              📍 {Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)}
            </p>
          )}
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="active">🟢 Активный</option>
            <option value="inactive">🔴 Неактивный</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-medium text-bg disabled:opacity-60"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setPicking(false) }}
              className="flex-1 rounded-xl bg-bg py-2.5 text-sm font-medium text-muted"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* Partners list */}
      {partners.length === 0 ? (
        <p className="text-center text-sm text-muted py-6">Партнёры не добавлены</p>
      ) : (
        <div className="flex flex-col gap-3">
          {partners.map((p) => (
            <div key={p.id} className="rounded-2xl bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  {p.phone && <p className="text-xs text-muted mt-0.5">{p.phone}</p>}
                  {p.address && <p className="text-xs text-muted mt-0.5">{p.address}</p>}
                </div>
                <span className="flex-shrink-0 text-sm">{p.status === 'active' ? '🟢' : '🔴'}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.latitude != null && (
                  <button
                    onClick={() => flyTo(p)}
                    className="rounded-lg bg-bg px-3 py-1.5 text-xs font-medium text-muted"
                  >
                    📍 На карте
                  </button>
                )}
                <button
                  onClick={() => toggleStatus(p)}
                  className="rounded-lg bg-bg px-3 py-1.5 text-xs font-medium text-muted"
                >
                  {p.status === 'active' ? '🔴 Деактивировать' : '🟢 Активировать'}
                </button>
                <button
                  onClick={() => openEdit(p)}
                  className="rounded-lg bg-bg px-3 py-1.5 text-xs font-medium text-muted"
                >
                  ✏️ Изменить
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="rounded-lg bg-bg px-3 py-1.5 text-xs font-medium text-red-400"
                >
                  🗑 Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

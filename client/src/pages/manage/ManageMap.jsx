import { useEffect, useRef, useState } from 'react'
import { adminApi } from '../../api.js'

const TASHKENT = [41.2995, 69.2401]
const EMPTY_FORM = {
  name: '', phone: '', address: '', status: 'active', latitude: null, longitude: null,
  photo_url: '', description: '', monthly_turnover: '', contact_person: '', working_hours: '',
}

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
  const [searchResults, setSearchResults] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

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

  async function handleAddressSearch(e) {
    const q = e.target.value
    setSearchQuery(q)
    if (q.length < 4) { setSearchResults([]); return }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
        { headers: { 'Accept-Language': 'ru' } }
      )
      setSearchResults(await res.json())
    } catch {
      setSearchResults([])
    }
  }

  function pickSearchResult(result) {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    setForm((f) => ({ ...f, address: result.display_name, latitude: lat, longitude: lng }))
    setSearchResults([])
    setSearchQuery('')
    if (mapInstanceRef.current) mapInstanceRef.current.setView([lat, lng], 15)
    if (pickMarkerRef.current) pickMarkerRef.current.remove()
    pickMarkerRef.current = window.L.circleMarker([lat, lng], {
      radius: 8, color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.8,
    }).addTo(mapInstanceRef.current).bindPopup('Новая точка').openPopup()
  }

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setPicking(false)
    setSearchResults([])
    setSearchQuery('')
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
      photo_url: partner.photo_url || '',
      description: partner.description || '',
      monthly_turnover: partner.monthly_turnover != null ? String(partner.monthly_turnover) : '',
      contact_person: partner.contact_person || '',
      working_hours: partner.working_hours || '',
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

  function openInMaps(partner) {
    const tg = window.Telegram?.WebApp
    let url = ''
    if (partner.latitude && partner.longitude) {
      url = `https://yandex.uz/maps/?pt=${partner.longitude},${partner.latitude}&z=16&l=map`
    } else if (partner.address) {
      url = `https://yandex.uz/maps/?text=${encodeURIComponent(partner.address)}`
    }
    if (url) {
      if (tg) tg.openLink(url)
      else window.open(url, '_blank')
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
          <div className="relative">
            <input
              value={searchQuery}
              onChange={handleAddressSearch}
              placeholder="Поиск адреса..."
              className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {searchResults.length > 0 && (
              <ul className="absolute z-50 mt-1 w-full rounded-xl bg-surface shadow-lg overflow-hidden">
                {searchResults.map((r) => (
                  <li
                    key={r.place_id}
                    onClick={() => pickSearchResult(r)}
                    className="cursor-pointer px-3 py-2 text-xs hover:bg-bg truncate border-b border-white/5 last:border-0"
                  >
                    {r.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
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

          <div className="flex flex-col gap-1">
            <input
              name="photo_url"
              value={form.photo_url}
              onChange={handleChange}
              placeholder="Фото магазина (URL)"
              className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {form.photo_url && (
              <img
                src={form.photo_url}
                alt="preview"
                className="w-full rounded-xl object-cover"
                style={{ maxHeight: 140 }}
                onError={(e) => { e.currentTarget.style.display = 'none' }}
                onLoad={(e) => { e.currentTarget.style.display = 'block' }}
              />
            )}
          </div>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Описание магазина, ассортимент..."
            rows={3}
            className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />

          <div className="flex flex-col gap-1">
            <input
              name="monthly_turnover"
              value={form.monthly_turnover}
              onChange={handleChange}
              placeholder="Оборот в месяц (сум)"
              type="number"
              className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {form.monthly_turnover && (
              <p className="text-xs text-muted px-1">
                Оборот: {Number(form.monthly_turnover).toLocaleString('ru-RU')} сум
              </p>
            )}
          </div>

          <input
            name="contact_person"
            value={form.contact_person}
            onChange={handleChange}
            placeholder="Контактное лицо (имя менеджера)"
            className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />

          <input
            name="working_hours"
            value={form.working_hours}
            onChange={handleChange}
            placeholder="Время работы: 09:00 - 21:00"
            className="w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />

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
            <div key={p.id} className="rounded-2xl bg-surface overflow-hidden">
              {p.photo_url && (
                <img
                  src={p.photo_url}
                  alt={p.name}
                  className="w-full object-cover"
                  style={{ maxHeight: 160 }}
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                    p.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {p.status === 'active' ? 'Активный' : 'Неактивный'}
                  </span>
                </div>

                {p.description && (
                  <p className="text-xs text-muted mb-2 leading-relaxed">{p.description}</p>
                )}

                <div className="flex flex-col gap-1 mb-3">
                  {p.monthly_turnover != null && (
                    <p className="text-xs text-muted">
                      💰 Оборот: {Number(p.monthly_turnover).toLocaleString('ru-RU')} сум
                    </p>
                  )}
                  {p.contact_person && (
                    <p className="text-xs text-muted">👤 {p.contact_person}</p>
                  )}
                  {p.phone && (
                    <p className="text-xs text-muted">📞 {p.phone}</p>
                  )}
                  {p.working_hours && (
                    <p className="text-xs text-muted">🕐 {p.working_hours}</p>
                  )}
                  {p.address && (
                    <p className="text-xs text-muted">📍 {p.address}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(p.latitude != null || p.address) && (
                    <button
                      onClick={() => openInMaps(p)}
                      className="rounded-lg bg-bg px-3 py-1.5 text-xs font-medium text-muted"
                    >
                      🗺 Яндекс Карта
                    </button>
                  )}
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

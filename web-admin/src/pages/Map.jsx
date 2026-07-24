import { useEffect, useRef, useState } from 'react'
import { getPartners, createPartner, updatePartner, deletePartner } from '../api.js'

const TASHKENT = [41.2995, 69.2401]
const EMPTY_FORM = {
  name: '', phone: '', address: '', status: 'active', latitude: null, longitude: null,
  photo_url: '', description: '', monthly_turnover: '', contact_person: '', working_hours: '',
}

function makeIcon(active) {
  const color = active ? '#22c55e' : '#ef4444'
  return window.L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  })
}

export default function Map() {
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
    getPartners().then((data) => {
      setPartners(data)
      setLoading(false)
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    const L = window.L
    if (!L) return
    const map = L.map(mapRef.current, { zoomControl: true }).setView(TASHKENT, 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map)
    mapInstanceRef.current = map
  }, [loading])

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
        radius: 8, color: '#eab308', fillColor: '#eab308', fillOpacity: 0.8,
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
      radius: 8, color: '#eab308', fillColor: '#eab308', fillOpacity: 0.8,
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
        const updated = await updatePartner(editingId, form)
        setPartners((prev) => prev.map((p) => (p.id === editingId ? updated : p)))
      } else {
        const created = await createPartner(form)
        setPartners((prev) => [created, ...prev])
      }
      setShowForm(false)
      if (pickMarkerRef.current) { pickMarkerRef.current.remove(); pickMarkerRef.current = null }
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`"${name}" o'chirilsinmi?`)) return
    try {
      await deletePartner(id)
      setPartners((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  function openInMaps(partner) {
    let url = ''
    if (partner.latitude && partner.longitude) {
      url = `https://yandex.uz/maps/?pt=${partner.longitude},${partner.latitude}&z=16&l=map`
    } else if (partner.address) {
      url = `https://yandex.uz/maps/?text=${encodeURIComponent(partner.address)}`
    }
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="card h-72 animate-pulse bg-gray-100" />
      {[1, 2].map(i => <div key={i} className="card p-5 h-28 animate-pulse bg-gray-100" />)}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Xarita — Партнёры</h1>
          <p className="text-sm text-gray-500">{partners.length} ta sherik do'kon</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <span className="text-lg">+</span> Добавить
        </button>
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        className="card overflow-hidden"
        style={{ height: 320, zIndex: 0 }}
      />

      {picking && (
        <p className="text-center text-sm text-yellow-600 font-medium">
          Нажмите на карту, чтобы выбрать точку
        </p>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="card p-5 space-y-3">
          <h2 className="font-bold text-gray-900">{editingId ? 'Редактировать магазин' : 'Новый магазин'}</h2>

          <div>
            <label className="label">Название *</label>
            <input name="name" value={form.name} onChange={handleChange} required className="input" placeholder="Название магазина" />
          </div>

          <div>
            <label className="label">Телефон</label>
            <input name="phone" value={form.phone} onChange={handleChange} type="tel" className="input" placeholder="+998 90 000 00 00" />
          </div>

          <div>
            <label className="label">Поиск адреса</label>
            <div className="relative">
              <input
                value={searchQuery}
                onChange={handleAddressSearch}
                placeholder="Введите адрес для поиска..."
                className="input"
              />
              {searchResults.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full rounded-xl bg-white shadow-lg border border-gray-100 overflow-hidden">
                  {searchResults.map((r) => (
                    <li
                      key={r.place_id}
                      onClick={() => pickSearchResult(r)}
                      className="cursor-pointer px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-0 truncate"
                    >
                      {r.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="label">Адрес</label>
              <input name="address" value={form.address} onChange={handleChange} className="input" placeholder="Адрес" />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setPicking((p) => !p)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  picking ? 'bg-yellow-400 text-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🗺 На карте
              </button>
            </div>
          </div>

          {form.latitude != null && (
            <p className="text-xs text-gray-500">
              📍 {Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)}
            </p>
          )}

          <div>
            <label className="label">Статус</label>
            <select name="status" value={form.status} onChange={handleChange} className="input">
              <option value="active">🟢 Активный</option>
              <option value="inactive">🔴 Неактивный</option>
            </select>
          </div>

          <div>
            <label className="label">Фото магазина (URL)</label>
            <input name="photo_url" value={form.photo_url} onChange={handleChange} className="input" placeholder="https://..." />
            {form.photo_url && (
              <img
                src={form.photo_url}
                alt="preview"
                className="mt-2 w-full rounded-xl object-cover max-h-36"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
                onLoad={(e) => { e.currentTarget.style.display = 'block' }}
              />
            )}
          </div>

          <div>
            <label className="label">Описание</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Описание магазина, ассортимент..."
              rows={3}
              className="input resize-none"
            />
          </div>

          <div>
            <label className="label">Оборот в месяц (сум)</label>
            <input name="monthly_turnover" value={form.monthly_turnover} onChange={handleChange} type="number" className="input" placeholder="0" />
            {form.monthly_turnover && (
              <p className="text-xs text-gray-400 mt-1">
                {Number(form.monthly_turnover).toLocaleString('ru-RU')} сум
              </p>
            )}
          </div>

          <div>
            <label className="label">Контактное лицо</label>
            <input name="contact_person" value={form.contact_person} onChange={handleChange} className="input" placeholder="Имя менеджера" />
          </div>

          <div>
            <label className="label">Время работы</label>
            <input name="working_hours" value={form.working_hours} onChange={handleChange} className="input" placeholder="09:00 - 21:00" />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => { setShowForm(false); setPicking(false) }} className="btn-ghost flex-1">
              Bekor
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      )}

      {/* Partners list */}
      {partners.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="font-semibold text-gray-900">Партнёры не добавлены</p>
          <p className="text-sm text-gray-400 mt-1">Нажмите «+ Добавить» чтобы добавить первый магазин</p>
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              {p.photo_url && (
                <img
                  src={p.photo_url}
                  alt={p.name}
                  className="w-full object-cover max-h-40"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="font-bold text-gray-900 truncate">{p.name}</p>
                  <span className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                    p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {p.status === 'active' ? '🟢 Активный' : '🔴 Неактивный'}
                  </span>
                </div>

                {p.description && (
                  <p className="text-sm text-gray-500 mb-2 leading-relaxed">{p.description}</p>
                )}

                <div className="space-y-0.5 mb-3">
                  {p.monthly_turnover != null && (
                    <p className="text-xs text-gray-500">💰 Оборот: {Number(p.monthly_turnover).toLocaleString('ru-RU')} сум</p>
                  )}
                  {p.contact_person && <p className="text-xs text-gray-500">👤 {p.contact_person}</p>}
                  {p.phone && <p className="text-xs text-gray-500">📞 {p.phone}</p>}
                  {p.working_hours && <p className="text-xs text-gray-500">🕐 {p.working_hours}</p>}
                  {p.address && <p className="text-xs text-gray-500">📍 {p.address}</p>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(p.latitude != null || p.address) && (
                    <button
                      onClick={() => openInMaps(p)}
                      className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      🗺 Яндекс Карта
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(p)}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    ✏️ Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
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
